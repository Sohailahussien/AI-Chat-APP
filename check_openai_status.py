#!/usr/bin/env python3
"""
Check OpenAI API status and provide free alternatives
"""

import os
import requests
from dotenv import load_dotenv

# Load environment variables
load_dotenv('.env.local')

def check_openai_status():
    """Check if OpenAI API key is working"""
    api_key = os.getenv('OPENAI_API_KEY')
    
    if not api_key:
        print("❌ No OpenAI API key found")
        return False
    
    print("🔍 Checking OpenAI API status...")
    
    try:
        # Test with a simple request
        headers = {
            'Authorization': f'Bearer {api_key}',
            'Content-Type': 'application/json'
        }
        
        response = requests.post(
            'https://api.openai.com/v1/chat/completions',
            headers=headers,
            json={
                'model': 'gpt-3.5-turbo',
                'messages': [{'role': 'user', 'content': 'Hello'}],
                'max_tokens': 10
            },
            timeout=10
        )
        
        if response.status_code == 200:
            print("✅ OpenAI API is working!")
            return True
        elif response.status_code == 429:
            print("❌ OpenAI API quota exceeded")
            print("   This means you've used all your free credits")
            return False
        else:
            print(f"❌ OpenAI API error: {response.status_code}")
            print(f"   Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error checking OpenAI API: {e}")
        return False

def get_free_alternatives():
    """Provide free alternatives for RAG"""
    print("\n🆓 FREE RAG ALTERNATIVES:")
    print("=" * 50)
    
    print("1. 🆓 NEW OPENAI ACCOUNT")
    print("   - Sign up for a new OpenAI account")
    print("   - Get $5 free credits (enough for testing)")
    print("   - Visit: https://platform.openai.com/signup")
    
    print("\n2. 🆓 HUGGING FACE FREE MODELS")
    print("   - Use free embedding models")
    print("   - No API key required for some models")
    print("   - Visit: https://huggingface.co/models")
    
    print("\n3. 🆓 LOCAL EMBEDDING MODELS")
    print("   - Use sentence-transformers locally")
    print("   - No API calls needed")
    print("   - Completely free")
    
    print("\n4. 🆓 PINECONE FREE TIER")
    print("   - 1 free index")
    print("   - 100,000 vectors")
    print("   - Visit: https://www.pinecone.io/")

def create_local_rag_alternative():
    """Create a local RAG alternative using sentence-transformers"""
    print("\n🔧 CREATING LOCAL RAG ALTERNATIVE:")
    print("=" * 50)
    
    # Create requirements for local RAG
    requirements = """
# Local RAG requirements (free)
sentence-transformers==2.2.2
faiss-cpu==1.7.4
numpy==1.24.3
scikit-learn==1.3.0
"""
    
    with open('local_rag_requirements.txt', 'w') as f:
        f.write(requirements)
    
    print("✅ Created local_rag_requirements.txt")
    print("   Install with: pip install -r local_rag_requirements.txt")
    
    # Create local RAG implementation
    local_rag_code = '''
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
'''
    
    with open('local_rag.py', 'w') as f:
        f.write(local_rag_code)
    
    print("✅ Created local_rag.py")
    print("   This provides free local RAG functionality")

if __name__ == "__main__":
    print("🚀 RAG Service Status Check")
    print("=" * 50)
    
    # Check current status
    openai_working = check_openai_status()
    
    if not openai_working:
        get_free_alternatives()
        create_local_rag_alternative()
        
        print("\n💡 RECOMMENDED NEXT STEPS:")
        print("1. Try creating a new OpenAI account for free credits")
        print("2. Or install local RAG: pip install -r local_rag_requirements.txt")
        print("3. Use local_rag.py for free document search")
    else:
        print("\n✅ Your OpenAI API is working! RAG should work now.")
