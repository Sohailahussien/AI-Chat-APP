#!/usr/bin/env python3
"""
Test Chat History System
"""

import requests
import json

def test_chat_history():
    """Test the complete chat history system"""
    print("🧪 TESTING CHAT HISTORY SYSTEM")
    print("=" * 50)
    
    # Step 1: Login to get a token
    login_data = {
        "email": "test@example.com",
        "password": "password123"
    }
    
    try:
        response = requests.post(
            "http://localhost:3000/api/auth/login",
            json=login_data,
            timeout=10
        )
        
        if response.status_code != 200:
            print("❌ Login failed")
            return
            
        data = response.json()
        token = data.get('token')
        user = data.get('user')
        
        print(f"✅ Logged in as: {user.get('name')} ({user.get('email')})")
        print(f"   Token: {token[:20]}...")
        
    except Exception as e:
        print(f"❌ Login error: {e}")
        return
    
    # Step 2: Send a test message
    headers = {
        'Content-Type': 'application/json',
        'Authorization': f'Bearer {token}'
    }
    
    test_message = {
        "message": "Hello! This is a test message for chat history."
    }
    
    try:
        response = requests.post(
            "http://localhost:3000/api/chat",
            json=test_message,
            headers=headers,
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Chat response: {data.get('response', 'No response')[:50]}...")
        else:
            print(f"❌ Chat failed: {response.status_code}")
            return
            
    except Exception as e:
        print(f"❌ Chat error: {e}")
        return
    
    # Step 3: Check chat history
    try:
        response = requests.get(
            "http://localhost:3000/api/chat/messages",
            headers=headers,
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            messages = data.get('messages', [])
            print(f"✅ Found {len(messages)} messages in chat history")
            
            for i, msg in enumerate(messages[-4:], 1):  # Show last 4 messages
                print(f"   {i}. [{msg.get('role')}] {msg.get('content', '')[:50]}...")
                print(f"      AI Agent: {msg.get('aiAgent', 'default')}")
                print(f"      Time: {msg.get('timestamp', 'Unknown')}")
                print()
        else:
            print(f"❌ Failed to get chat history: {response.status_code}")
            
    except Exception as e:
        print(f"❌ Chat history error: {e}")
    
    # Step 4: Test account info
    try:
        response = requests.get(
            "http://localhost:3000/api/auth/accounts",
            timeout=10
        )
        
        if response.status_code == 200:
            accounts = response.json()
            print(f"✅ Found {len(accounts)} accounts in system")
            for account in accounts:
                print(f"   - {account.get('name')} ({account.get('email')}) - {account.get('_count', {}).get('messages', 0)} messages")
        else:
            print(f"❌ Failed to get accounts: {response.status_code}")
            
    except Exception as e:
        print(f"❌ Accounts error: {e}")

def main():
    print("🚀 CHAT HISTORY SYSTEM TEST")
    print("=" * 50)
    test_chat_history()
    
    print("\n💡 NEXT STEPS:")
    print("1. Go to http://localhost:3000")
    print("2. Sign in with: test@example.com / password123")
    print("3. Start chatting - your messages will be saved!")
    print("4. Click 'Account' in the header to view chat history")
    print("5. Your chat history will persist between sessions!")

if __name__ == "__main__":
    main()
