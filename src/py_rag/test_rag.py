#!/usr/bin/env python3
"""
Simple test script to verify RAG service functionality
"""

import requests
import json
import time

def test_rag_service():
    base_url = "http://127.0.0.1:8001"
    
    print("Testing RAG Service...")
    
    # Test 1: Health check
    try:
        response = requests.get(f"{base_url}/health", timeout=5)
        if response.status_code == 200:
            print("✅ Health check passed")
        else:
            print(f"❌ Health check failed: {response.status_code}")
            return False
    except requests.exceptions.RequestException as e:
        print(f"❌ Health check failed: {e}")
        return False
    
    # Test 2: Query test
    try:
        query_data = {"query": "test query", "top_k": 3}
        response = requests.post(
            f"{base_url}/query", 
            json=query_data, 
            timeout=10
        )
        if response.status_code == 200:
            result = response.json()
            print("✅ Query test passed")
            print(f"   Found {len(result.get('documents', []))} documents")
        else:
            print(f"❌ Query test failed: {response.status_code}")
            print(f"   Response: {response.text}")
            return False
    except requests.exceptions.RequestException as e:
        print(f"❌ Query test failed: {e}")
        return False
    
    print("🎉 RAG service is working properly!")
    return True

if __name__ == "__main__":
    test_rag_service()
