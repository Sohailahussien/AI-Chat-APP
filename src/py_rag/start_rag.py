#!/usr/bin/env python3
"""
Startup script for RAG service
"""

import uvicorn
import os
import sys
from dotenv import load_dotenv

# Add parent directory to path for imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Load environment variables
load_dotenv('../../.env.local')

if __name__ == "__main__":
    print("Starting RAG service...")
    print(f"OPENAI_API_KEY: {'SET' if os.getenv('OPENAI_API_KEY') else 'NOT SET'}")
    print(f"PINECONE_API_KEY: {'SET' if os.getenv('PINECONE_API_KEY') else 'NOT SET'}")
    print(f"PINECONE_INDEX: {os.getenv('PINECONE_INDEX', 'NOT SET')}")
    
    uvicorn.run(
        "app:app",
        host="127.0.0.1",
        port=8001,
        reload=True,
        log_level="info"
    )
