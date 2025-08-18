"""
Lightweight Python RAG utilities extracted from the provided notebook and
organized as reusable functions for the Next.js integration.

Functions exposed:
- init_clients(openai_key, pinecone_key, index_name)
- ensure_index(index_name, dimension=1536, metric='dotproduct')
- ingest_texts(texts: list[str], metadatas: list[dict], ids: list[str] | None = None)
- ingest_file(file_path: str, source: str | None = None)
- query_text(query: str, top_k: int = 5) -> dict

Returned query shape aligns with the app's expectations:
{
  "ids": List[str],
  "distances": List[float],  # similarity scores from Pinecone
  "metadatas": List[Any],
  "documents": List[str]
}
"""

from __future__ import annotations

import os
import pathlib
from typing import Any, Dict, List, Optional, Tuple

from pinecone import Pinecone, ServerlessSpec, CloudProvider, AwsRegion, Metric
from langchain_openai import OpenAIEmbeddings
from langchain_pinecone import PineconeVectorStore

# -----------------------------
# Global, lazily initialized state
# -----------------------------
_pc: Optional[Pinecone] = None
_index = None  # pinecone index handle
_vectorstore: Optional[PineconeVectorStore] = None
_embeddings: Optional[OpenAIEmbeddings] = None


def _require_env(name: str, fallback: Optional[str] = None) -> str:
    value = os.getenv(name, fallback)
    if not value:
        raise RuntimeError(f"Environment variable {name} is required but not set")
    return value


def init_clients(
    openai_key: Optional[str] = None,
    pinecone_key: Optional[str] = None,
    index_name: Optional[str] = None,
    embedding_model: Optional[str] = None,
) -> None:
    """Initialize OpenAI embeddings, Pinecone client, and vectorstore (if index exists).

    - openai_key: overrides OPENAI_API_KEY
    - pinecone_key: overrides PINECONE_API_KEY
    - index_name: overrides PINECONE_INDEX (default: deepseek-r1-rag)
    - embedding_model: overrides OPENAI_EMBED_MODEL (default: text-embedding-3-small)
    """
    global _pc, _index, _vectorstore, _embeddings

    # OpenAI embeddings
    openai_api_key = openai_key or _require_env("OPENAI_API_KEY")
    embed_model = embedding_model or os.getenv("OPENAI_EMBED_MODEL", "text-embedding-3-small")
    _embeddings = OpenAIEmbeddings(api_key=openai_api_key, model=embed_model)

    # Pinecone client
    pinecone_api_key = pinecone_key or _require_env("PINECONE_API_KEY")
    _pc = Pinecone(api_key=pinecone_api_key)

    # Attach index/vectorstore if an index already exists
    idx_name = index_name or os.getenv("PINECONE_INDEX", "deepseek-r1-rag")
    try:
        if _pc.has_index(name=idx_name):
            _index = _pc.Index(name=idx_name)
            _vectorstore = PineconeVectorStore(index=_index, embedding=_embeddings, text_key="text")
    except Exception:
        # Defer actual creation/attachment to ensure_index
        _index = None
        _vectorstore = None


def ensure_index(
    index_name: Optional[str] = None,
    dimension: int = 1536,
    metric: str = "dotproduct",
    cloud: CloudProvider = CloudProvider.AWS,
    region: AwsRegion = AwsRegion.US_EAST_1,
) -> None:
    """Ensure Pinecone index exists and bind vectorstore to it.

    Defaults match OpenAI text-embedding-3-small (1536 dims).
    """
    global _pc, _index, _vectorstore, _embeddings
    if _pc is None or _embeddings is None:
        init_clients()

    idx_name = index_name or os.getenv("PINECONE_INDEX", "deepseek-r1-rag")

    if not _pc.has_index(name=idx_name):
        _pc.create_index(
            name=idx_name,
            metric=Metric.DOTPRODUCT if metric.lower() == "dotproduct" else Metric.COSINE,
            dimension=dimension,
            spec=ServerlessSpec(cloud=cloud, region=region),
        )

    _index = _pc.Index(name=idx_name)
    _vectorstore = PineconeVectorStore(index=_index, embedding=_embeddings, text_key="text")


def ingest_texts(
    texts: List[str],
    metadatas: Optional[List[Dict[str, Any]]] = None,
    ids: Optional[List[str]] = None,
) -> Dict[str, Any]:
    """Embed and upsert a batch of texts into Pinecone.

    - texts: raw document texts
    - metadatas: list of dicts (same length as texts). If None, minimal metadata is created.
    - ids: optional pre-specified ids; if None, auto-generate using a simple counter.
    """
    global _vectorstore
    if _vectorstore is None:
        ensure_index()

    if metadatas is None:
        metadatas = [{"text": t} for t in texts]
    else:
        # Ensure each metadata contains the text for retrievability with text_key='text'
        for i, t in enumerate(texts):
            if "text" not in metadatas[i]:
                metadatas[i]["text"] = t

    if ids is None:
        # Create simple ids
        ids = [f"doc_{i}" for i in range(len(texts))]

    # langchain-pinecone vectorstore exposes .add_texts, but we already have metadatas and ids.
    # Use underlying index directly for efficiency: upsert zip(ids, embeddings, metadatas)
    # However, we rely on vectorstore convenience; embed and upsert via vectorstore.
    # PineconeVectorStore.add_texts will embed with the provided embedding function.
    _vectorstore.add_texts(texts=texts, metadatas=metadatas, ids=ids)

    return {"count": len(texts), "ids": ids}


def _read_text_file(path: str) -> str:
    try:
        return pathlib.Path(path).read_text(encoding="utf-8")
    except Exception:
        return ""


def ingest_file(file_path: str, source: Optional[str] = None) -> Dict[str, Any]:
    """Minimal file ingester (for .txt). Extend as needed for PDF/DOCX.

    - file_path: local path
    - source: optional source string stored in metadata
    """
    text = _read_text_file(file_path)
    if not text:
        return {"count": 0, "ids": [], "error": f"No readable text in {file_path}"}

    meta = {"text": text, "source": source or file_path}
    return ingest_texts([text], [meta])


def query_text(query: str, top_k: int = 5) -> Dict[str, Any]:
    """Query similar documents. Returns ids, scores (as distances), metadatas, and documents.
    Uses similarity_search_with_score to obtain scores from Pinecone.
    """
    global _vectorstore
    if _vectorstore is None:
        ensure_index()

    # similarity_search_with_score returns List[Tuple[Document, score]]
    results: List[Tuple[Any, float]] = _vectorstore.similarity_search_with_score(query, k=top_k)

    ids: List[str] = []
    scores: List[float] = []
    metadatas: List[Any] = []
    docs: List[str] = []

    for doc, score in results:
        # LangChain Document has .metadata and .page_content
        metadatas.append(doc.metadata)
        docs.append(doc.page_content)
        # Try to recover id from metadata if present; else synthesize
        doc_id = doc.metadata.get("id") if isinstance(doc.metadata, dict) else None
        ids.append(doc_id or f"doc_{len(ids)}")
        scores.append(float(score))

    return {
        "ids": ids,
        "distances": scores,  # these are similarity scores from Pinecone
        "metadatas": metadatas,
        "documents": docs,
    }


