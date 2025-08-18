#!/usr/bin/env python3
"""
Free Local RAG Service using sentence-transformers
No API keys required - completely free!
"""

import os
import json
import pathlib
from typing import List, Dict, Any, Optional
from sentence_transformers import SentenceTransformer
import faiss
import numpy as np
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from pydantic import BaseModel

app = FastAPI(title="Free Local RAG Service")

class QueryRequest(BaseModel):
    query: str
    top_k: int = 5

class QueryResponse(BaseModel):
    ids: List[str]
    distances: List[float]
    metadatas: List[Any]
    documents: List[str]

class LocalRAG:
    def __init__(self):
        print("🔄 Loading free embedding model...")
        # Use free multilingual model (no API key needed)
        self.model = SentenceTransformer('all-MiniLM-L6-v2')
        self.documents = []
        self.metadatas = []
        self.embeddings = None
        self.index = None
        print("✅ Free embedding model loaded!")
        
    def add_documents(self, texts: List[str], metadatas: List[Dict] = None):
        """Add documents to the local index"""
        if not texts:
            return {"count": 0, "total": len(self.documents)}
            
        if metadatas is None:
            metadatas = [{"text": text, "source": f"doc_{i}"} for i, text in enumerate(texts)]
            
        print(f"📝 Adding {len(texts)} documents...")
        
        # Create embeddings
        embeddings = self.model.encode(texts)
        
        if self.embeddings is None:
            self.embeddings = embeddings
            self.documents = texts
            self.metadatas = metadatas
            # Create FAISS index
            dimension = embeddings.shape[1]
            self.index = faiss.IndexFlatIP(dimension)
            self.index.add(embeddings.astype('float32'))
        else:
            # Add to existing
            self.embeddings = np.vstack([self.embeddings, embeddings])
            self.documents.extend(texts)
            self.metadatas.extend(metadatas)
            self.index.add(embeddings.astype('float32'))
            
        print(f"✅ Added {len(texts)} documents. Total: {len(self.documents)}")
        return {"count": len(texts), "total": len(self.documents)}
    
    def query(self, query: str, top_k: int = 5):
        """Query the local index"""
        if self.index is None or len(self.documents) == 0:
            return {
                "ids": [],
                "distances": [],
                "metadatas": [],
                "documents": []
            }
            
        print(f"🔍 Searching for: '{query}'")
        
        # Encode query
        query_embedding = self.model.encode([query])
        
        # Search
        distances, indices = self.index.search(
            query_embedding.astype('float32'), 
            min(top_k, len(self.documents))
        )
        
        # Get results
        results = {
            "ids": [f"doc_{i}" for i in indices[0]],
            "distances": distances[0].tolist(),
            "metadatas": [self.metadatas[i] for i in indices[0]],
            "documents": [self.documents[i] for i in indices[0]]
        }
        
        print(f"✅ Found {len(results['documents'])} relevant documents")
        return results

# Global RAG instance
rag = LocalRAG()

def _read_text_file(path: str) -> str:
    """Read text from file"""
    try:
        return pathlib.Path(path).read_text(encoding="utf-8")
    except Exception as e:
        print(f"❌ Error reading file {path}: {e}")
        return ""

@app.get("/health")
def health() -> dict:
    return {
        "status": "ok", 
        "model": "all-MiniLM-L6-v2",
        "documents_count": len(rag.documents),
        "service": "Free Local RAG"
    }

@app.post("/ingest")
async def ingest(
    file: UploadFile | None = File(None),
    file_path: str | None = Form(None),
    source: str | None = Form(None),
) -> dict:
    """Ingest documents into the local index"""
    
    if file is None and not file_path:
        raise HTTPException(status_code=400, detail="Provide either file upload or file_path")

    if file is not None:
        # Save upload to a local temp path, then ingest
        uploads_dir = os.path.join(os.getcwd(), "uploads")
        os.makedirs(uploads_dir, exist_ok=True)
        tmp_path = os.path.join(uploads_dir, file.filename)
        data = await file.read()
        with open(tmp_path, "wb") as f:
            f.write(data)
        return ingest_file(tmp_path, source=source or file.filename)

    # file_path mode
    return ingest_file(file_path, source=source)

def ingest_file(file_path: str, source: Optional[str] = None) -> Dict[str, Any]:
    """Ingest a file into the local index"""
    text = _read_text_file(file_path)
    if not text:
        return {"count": 0, "ids": [], "error": f"No readable text in {file_path}"}

    # Split text into chunks (simple approach)
    chunks = [text[i:i+1000] for i in range(0, len(text), 1000)]
    
    meta = {"text": text, "source": source or file_path}
    metadatas = [meta for _ in chunks]
    
    return rag.add_documents(chunks, metadatas)

@app.post("/query", response_model=QueryResponse)
async def query(req: QueryRequest) -> QueryResponse:
    """Query the local index"""
    result = rag.query(req.query, top_k=req.top_k)
    return QueryResponse(**result)

@app.get("/stats")
def stats() -> dict:
    """Get statistics about the index"""
    return {
        "total_documents": len(rag.documents),
        "model": "all-MiniLM-L6-v2",
        "index_type": "FAISS",
        "service": "Free Local RAG"
    }

if __name__ == "__main__":
    import uvicorn
    print("🚀 Starting Free Local RAG Service...")
    print("✅ No API keys required!")
    print("✅ Completely free to use!")
    uvicorn.run(app, host="127.0.0.1", port=8001)
