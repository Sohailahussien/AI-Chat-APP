#!/usr/bin/env python3
"""
Comprehensive test script to verify both RAG and OpenAI functionality
"""

import requests
import json
import time

def test_openai_chat():
    """Test OpenAI chat functionality"""
    print("🧠 Testing OpenAI Chat...")
    
    try:
        # Test general question
        response = requests.post(
            'http://localhost:3000/api/chat/enhanced',
            json={
                "message": "What is 2 + 2?",
                "streaming": False
            },
            timeout=10
        )
        
        if response.status_code == 200:
            result = response.json()
            print("✅ OpenAI Chat Test PASSED")
            print(f"   Response: {result.get('response', '')[:100]}...")
            print(f"   Type: {result.get('responseType', 'unknown')}")
            return True
        else:
            print(f"❌ OpenAI Chat Test FAILED: {response.status_code}")
            print(f"   Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ OpenAI Chat Test FAILED: {e}")
        return False

def test_rag_service():
    """Test RAG service functionality"""
    print("\n🔍 Testing RAG Service...")
    
    try:
        # Test health endpoint
        response = requests.get('http://127.0.0.1:8001/health', timeout=5)
        if response.status_code == 200:
            print("✅ RAG Health Check PASSED")
        else:
            print(f"❌ RAG Health Check FAILED: {response.status_code}")
            return False
            
        # Test query endpoint
        response = requests.post(
            'http://127.0.0.1:8001/query',
            json={"query": "test query", "top_k": 3},
            timeout=10
        )
        
        if response.status_code == 200:
            result = response.json()
            print("✅ RAG Query Test PASSED")
            print(f"   Found {len(result.get('documents', []))} documents")
            return True
        else:
            print(f"❌ RAG Query Test FAILED: {response.status_code}")
            print(f"   Response: {response.text}")
            return False
            
    except requests.exceptions.ConnectionError:
        print("❌ RAG Service NOT RUNNING (Connection refused)")
        print("   The RAG service needs to be started on port 8001")
        return False
    except Exception as e:
        print(f"❌ RAG Service Test FAILED: {e}")
        return False

def test_hybrid_chat():
    """Test the main chat endpoint that combines RAG and OpenAI"""
    print("\n🤖 Testing Hybrid Chat (Main Endpoint)...")
    
    try:
        # Test general question
        response = requests.post(
            'http://localhost:3000/api/chat',
            json={
                "message": "What is the weather like?",
                "streaming": False
            },
            timeout=10
        )
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Hybrid Chat Test PASSED")
            print(f"   Response: {result.get('response', '')[:100]}...")
            print(f"   Type: {result.get('responseType', 'unknown')}")
            return True
        else:
            print(f"❌ Hybrid Chat Test FAILED: {response.status_code}")
            print(f"   Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Hybrid Chat Test FAILED: {e}")
        return False

def main():
    print("🚀 Comprehensive System Test")
    print("=" * 50)
    
    openai_ok = test_openai_chat()
    rag_ok = test_rag_service()
    hybrid_ok = test_hybrid_chat()
    
    print("\n" + "=" * 50)
    print("📊 TEST RESULTS SUMMARY:")
    print(f"   OpenAI Chat: {'✅ WORKING' if openai_ok else '❌ FAILED'}")
    print(f"   RAG Service: {'✅ WORKING' if rag_ok else '❌ FAILED'}")
    print(f"   Hybrid Chat: {'✅ WORKING' if hybrid_ok else '❌ FAILED'}")
    
    if openai_ok and hybrid_ok:
        print("\n🎉 Core functionality is working!")
        print("   - General questions work via OpenAI")
        print("   - Main chat endpoint is functional")
        
        if not rag_ok:
            print("\n⚠️  RAG Service Issue:")
            print("   - Document queries will fall back to general AI")
            print("   - To fix: Check OpenAI API quota or start RAG service")
    else:
        print("\n❌ Core functionality has issues")
        print("   - Check if the Next.js app is running on port 3000")

if __name__ == "__main__":
    main()
