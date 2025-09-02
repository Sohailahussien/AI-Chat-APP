#!/usr/bin/env python3
"""
Simple Fast RAG Service - No heavy models, instant startup!
Uses basic text similarity for document search
Supports user-specific document storage
"""

import os
import json
import pathlib
import re
from typing import List, Dict, Any, Optional
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from pydantic import BaseModel
from difflib import SequenceMatcher

app = FastAPI(title="Simple Fast RAG Service")

class QueryRequest(BaseModel):
    query: str
    top_k: int = 5
    user_id: Optional[str] = None

class QueryResponse(BaseModel):
    ids: List[str]
    distances: List[float]
    metadatas: List[Any]
    documents: List[str]

class SimpleRAG:
    def __init__(self):
        print("🚀 Simple RAG Service Ready!")
        # Store documents per user
        self.user_documents = {}  # user_id -> documents list
        self.user_metadatas = {}  # user_id -> metadatas list
        
    def add_documents(self, texts: List[str], user_id: str = "default", metadatas: List[Dict] = None):
        """Add documents to the simple index for a specific user"""
        if not texts:
            return {"count": 0, "total": self.get_user_document_count(user_id)}
            
        if metadatas is None:
            metadatas = [{"text": text, "source": f"doc_{i}", "user_id": user_id} for i, text in enumerate(texts)]
        else:
            # Add user_id to metadata
            for meta in metadatas:
                meta["user_id"] = user_id
            
        print(f"📝 Adding {len(texts)} documents for user {user_id}...")
        
        # Initialize user storage if not exists
        if user_id not in self.user_documents:
            self.user_documents[user_id] = []
            self.user_metadatas[user_id] = []
        
        # Add to user's documents
        start_idx = len(self.user_documents[user_id])
        self.user_documents[user_id].extend(texts)
        self.user_metadatas[user_id].extend(metadatas)
        
        print(f"✅ Added {len(texts)} documents for user {user_id}. Total: {len(self.user_documents[user_id])}")
        return {"count": len(texts), "total": len(self.user_documents[user_id])}
    
    def get_user_document_count(self, user_id: str = "default") -> int:
        """Get document count for a specific user"""
        return len(self.user_documents.get(user_id, []))
    
    def simple_similarity(self, query: str, text: str) -> float:
        """Calculate simple text similarity"""
        # Convert to lowercase for better matching
        query_lower = query.lower()
        text_lower = text.lower()
        
        # Check for exact word matches
        query_words = set(re.findall(r'\w+', query_lower))
        text_words = set(re.findall(r'\w+', text_lower))
        
        if not query_words:
            return 0.0
            
        # Calculate word overlap
        common_words = query_words.intersection(text_words)
        word_similarity = len(common_words) / len(query_words)
        
        # Calculate sequence similarity
        sequence_similarity = SequenceMatcher(None, query_lower, text_lower).ratio()
        
        # Combine both scores
        combined_score = (word_similarity * 0.7) + (sequence_similarity * 0.3)
        
        return combined_score
    
    def query(self, query: str, user_id: str = "default", top_k: int = 5):
        """Query the simple index for a specific user"""
        user_docs = self.user_documents.get(user_id, [])
        user_metas = self.user_metadatas.get(user_id, [])
        
        if len(user_docs) == 0:
            return {
                "ids": [],
                "distances": [],
                "metadatas": [],
                "documents": []
            }
            
        print(f"🔍 Searching for user {user_id}: '{query}'")
        
        # Calculate similarities
        similarities = []
        for i, doc in enumerate(user_docs):
            score = self.simple_similarity(query, doc)
            similarities.append((score, i))
        
        # Sort by similarity (highest first)
        similarities.sort(reverse=True)
        
        # Get top results
        top_results = similarities[:top_k]
        
        results = {
            "ids": [f"doc_{idx}" for score, idx in top_results],
            "distances": [score for score, idx in top_results],
            "metadatas": [user_metas[idx] for score, idx in top_results],
            "documents": [user_docs[idx] for score, idx in top_results]
        }
        
        print(f"✅ Found {len(results['documents'])} relevant documents for user {user_id}")
        return results
    
    def clear_user_documents(self, user_id: str = "default"):
        """Clear all documents for a specific user"""
        if user_id in self.user_documents:
            del self.user_documents[user_id]
        if user_id in self.user_metadatas:
            del self.user_metadatas[user_id]
        print(f"✅ Cleared all documents for user {user_id}")

# Global RAG instance
rag = SimpleRAG()

def _read_text_file(path: str) -> str:
    """Read text from file"""
    try:
        # Check file extension
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
        print("❌ python-docx not installed. Install with: pip install python-docx")
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
        print("❌ PyPDF2 not installed. Install with: pip install PyPDF2")
        return ""
    except Exception as e:
        print(f"❌ Error reading PDF file {path}: {e}")
        return ""

@app.get("/health")
def health() -> dict:
    return {
        "status": "ok", 
        "model": "Simple Text Similarity",
        "documents_count": len(rag.user_documents), # Changed to reflect user-specific count
        "service": "Simple Fast RAG"
    }

class IngestRequest(BaseModel):
    file_path: str
    source: str | None = None
    user_id: str | None = None

@app.post("/ingest")
async def ingest(req: IngestRequest) -> dict:
    """Ingest documents into the simple index for a specific user"""
    
    if not req.file_path:
        raise HTTPException(status_code=400, detail="file_path is required")

    return ingest_file(req.file_path, source=req.source, user_id=req.user_id)

def ingest_file(file_path: str, source: Optional[str] = None, user_id: Optional[str] = None) -> Dict[str, Any]:
    """Ingest a file into the simple index for a specific user"""
    text = _read_text_file(file_path)
    if not text:
        return {"count": 0, "ids": [], "error": f"No readable text in {file_path}"}

    # Split text into chunks (simple approach)
    chunks = [text[i:i+1000] for i in range(0, len(text), 1000)]
    
    meta = {"text": text, "source": source or file_path, "user_id": user_id or "default"}
    metadatas = [meta for _ in chunks]
    
    return rag.add_documents(chunks, user_id=user_id or "default", metadatas=metadatas)

@app.post("/query", response_model=QueryResponse)
async def query(req: QueryRequest) -> QueryResponse:
    """Query the simple index"""
    result = rag.query(req.query, user_id=req.user_id, top_k=req.top_k)
    return QueryResponse(**result)

@app.get("/stats")
def stats() -> dict:
    """Get statistics about the index"""
    return {
        "total_documents": len(rag.user_documents), # Changed to reflect user-specific count
        "model": "Simple Text Similarity",
        "index_type": "In-Memory",
        "service": "Simple Fast RAG"
    }

@app.post("/clear")
def clear_index() -> dict:
    """Clear all documents from the index"""
    global rag
    rag = SimpleRAG()
    print("✅ RAG index cleared")
    return {
        "status": "success",
        "message": "All documents cleared from index",
        "documents_count": 0
    }

class ClearUserRequest(BaseModel):
    user_id: str

@app.post("/clear-user")
def clear_user_documents(req: ClearUserRequest) -> dict:
    """Clear all documents for a specific user"""
    rag.clear_user_documents(req.user_id)
    return {
        "status": "success",
        "message": f"All documents cleared for user {req.user_id}",
        "user_id": req.user_id
    }

if __name__ == "__main__":
    import uvicorn
    print("🚀 Starting Simple Fast RAG Service...")
    print("✅ Instant startup!")
    print("✅ No heavy models!")
    print("✅ Completely free!")
    uvicorn.run(app, host="127.0.0.1", port=8001)
