
import os
import json
from sentence_transformers import SentenceTransformer
import faiss
import numpy as np
from typing import List, Dict, Any

class LocalRAG:
    def __init__(self):
        # Use free multilingual model
        self.model = SentenceTransformer('all-MiniLM-L6-v2')
        self.documents = []
        self.embeddings = None
        self.index = None
        
    def add_documents(self, texts: List[str], metadatas: List[Dict] = None):
        """Add documents to the local index"""
        if metadatas is None:
            metadatas = [{"text": text} for text in texts]
            
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
            
        return {"count": len(texts), "total": len(self.documents)}
    
    def query(self, query: str, top_k: int = 5):
        """Query the local index"""
        if self.index is None:
            return {"documents": [], "distances": [], "metadatas": []}
            
        # Encode query
        query_embedding = self.model.encode([query])
        
        # Search
        distances, indices = self.index.search(
            query_embedding.astype('float32'), top_k
        )
        
        # Get results
        results = {
            "documents": [self.documents[i] for i in indices[0]],
            "distances": distances[0].tolist(),
            "metadatas": [self.metadatas[i] for i in indices[0]]
        }
        
        return results

# Usage example:
# rag = LocalRAG()
# rag.add_documents(["Your document text here"])
# results = rag.query("Your question here")
