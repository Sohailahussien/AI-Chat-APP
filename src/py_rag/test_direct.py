#!/usr/bin/env python3
"""
Direct test of RAG functionality without FastAPI
"""

import os
import sys
from dotenv import load_dotenv

# Load environment variables
load_dotenv('../../.env.local')

# Import RAG functions
from rag_impl import init_clients, ensure_index, query_text, ingest_texts

def test_rag_directly():
    print("Testing RAG functionality directly...")
    
    try:
        # Initialize clients
        print("1. Initializing clients...")
        init_clients()
        print("   ✅ Clients initialized")
        
        # Ensure index exists
        print("2. Ensuring index exists...")
        ensure_index()
        print("   ✅ Index ready")
        
        # Test query (should return empty results if no documents)
        print("3. Testing query...")
        result = query_text("test query", top_k=3)
        print(f"   ✅ Query successful")
        print(f"   Found {len(result.get('documents', []))} documents")
        print(f"   Result structure: {list(result.keys())}")
        
        print("🎉 RAG functionality is working!")
        return True
        
    except Exception as e:
        print(f"❌ RAG test failed: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    test_rag_directly()
