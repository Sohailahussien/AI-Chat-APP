#!/usr/bin/env python3

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Dict, Any, Optional, List
import pathlib
import os

app = FastAPI(title="Simple Working RAG")

# Simple in-memory storage
documents = []
metadatas = []

def _read_text_file(path: str) -> str:
    """Read text from file"""
    try:
        file_ext = pathlib.Path(path).suffix.lower()
        
        if file_ext == '.txt':
            return pathlib.Path(path).read_text(encoding="utf-8")
        elif file_ext == '.docx':
            return _read_docx_file(path)
        elif file_ext == '.pdf':
            return _read_pdf_file(path)
        else:
            print(f"❌ Unsupported file type: {file_ext}")
            return ""
    except Exception as e:
        print(f"❌ Error reading file {path}: {e}")
        return ""

def _read_docx_file(path: str) -> str:
    """Read text from DOCX file"""
    try:
        from docx import Document
        doc = Document(path)
        text = []
        for paragraph in doc.paragraphs:
            text.append(paragraph.text)
        return '\n'.join(text)
    except ImportError:
        print("❌ python-docx not installed")
        return ""
    except Exception as e:
        print(f"❌ Error reading DOCX file {path}: {e}")
        return ""

def _read_pdf_file(path: str) -> str:
    """Read text from PDF file"""
    try:
        import PyPDF2
        with open(path, 'rb') as file:
            pdf_reader = PyPDF2.PdfReader(file)
            text = []
            for page in pdf_reader.pages:
                text.append(page.extract_text())
            return '\n'.join(text)
    except ImportError:
        print("❌ PyPDF2 not installed")
        return ""
    except Exception as e:
        print(f"❌ Error reading PDF file {path}: {e}")
        return ""

class IngestRequest(BaseModel):
    file_path: str
    source: str | None = None
    user_id: str | None = None

class QueryRequest(BaseModel):
    query: str
    top_k: int = 5
    user_id: str | None = None

@app.get("/health")
def health() -> dict:
    return {
        "status": "ok", 
        "model": "Simple Working RAG",
        "documents_count": len(documents),
        "service": "Simple Working RAG"
    }

@app.post("/ingest")
async def ingest(req: IngestRequest) -> dict:
    """Ingest documents into the simple index"""
    global documents, metadatas
    
    if not req.file_path:
        raise HTTPException(status_code=400, detail="file_path is required")

    print(f"📄 Ingesting file: {req.file_path}")
    text = _read_text_file(req.file_path)
    
    if not text:
        return {"count": 0, "ids": [], "error": f"No readable text in {req.file_path}"}

    print(f"✅ Read {len(text)} characters from file")
    
    # Split text into chunks
    chunks = [text[i:i+1000] for i in range(0, len(text), 1000)]
    
    # Add to documents
    start_idx = len(documents)
    documents.extend(chunks)
    
    # Add metadata
    meta = {"source": req.source or req.file_path, "user_id": req.user_id or "default"}
    metadatas.extend([meta for _ in chunks])
    
    print(f"✅ Added {len(chunks)} chunks to index. Total documents: {len(documents)}")
    
    return {
        "count": len(chunks),
        "ids": [f"doc_{i}" for i in range(start_idx, len(documents))],
        "error": None
    }

@app.post("/query")
async def query(req: QueryRequest) -> dict:
    """Query the simple index"""
    global documents, metadatas
    
    if len(documents) == 0:
        return {
            "ids": [],
            "distances": [],
            "metadatas": [],
            "documents": []
        }
    
    print(f"🔍 Querying: '{req.query}'")
    
    # Simple keyword matching
    query_lower = req.query.lower()
    results = []
    
    for i, doc in enumerate(documents):
        doc_lower = doc.lower()
        # Count matching words
        query_words = set(query_lower.split())
        doc_words = set(doc_lower.split())
        common_words = query_words.intersection(doc_words)
        score = len(common_words) / max(len(query_words), 1)
        
        if score > 0:
            results.append((score, i))
    
    # Sort by score (highest first)
    results.sort(reverse=True)
    
    # Get top results
    top_results = results[:req.top_k]
    
    response = {
        "ids": [f"doc_{idx}" for score, idx in top_results],
        "distances": [score for score, idx in top_results],
        "metadatas": [metadatas[idx] for score, idx in top_results],
        "documents": [documents[idx] for score, idx in top_results]
    }
    
    print(f"✅ Found {len(response['documents'])} relevant documents")
    return response

@app.get("/stats")
def stats() -> dict:
    """Get statistics about the index"""
    return {
        "total_documents": len(documents),
        "model": "Simple Working RAG",
        "index_type": "In-Memory",
        "service": "Simple Working RAG"
    }

@app.post("/clear")
def clear_index() -> dict:
    """Clear all documents from the index"""
    global documents, metadatas
    documents = []
    metadatas = []
    print("✅ RAG index cleared")
    return {
        "status": "success",
        "message": "All documents cleared from index",
        "documents_count": 0
    }

if __name__ == "__main__":
    import uvicorn
    print("🚀 Starting Simple Working RAG Service...")
    uvicorn.run(app, host="0.0.0.0", port=8001)
