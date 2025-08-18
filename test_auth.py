#!/usr/bin/env python3
"""
Authentication Test and Fix Script
"""

import requests
import json

def test_auth_flow():
    """Test the complete authentication flow"""
    base_url = "http://localhost:3000"
    
    print("🔐 Testing Authentication Flow")
    print("=" * 50)
    
    # Test 1: Check if sign-in page is accessible
    try:
        response = requests.get(f"{base_url}/auth", timeout=5)
        if response.status_code == 200:
            print("✅ Sign-in page accessible")
        else:
            print(f"❌ Sign-in page error: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Sign-in page error: {e}")
        return False
    
    # Test 2: Test registration
    test_user = {
        "name": "Test User",
        "email": "test@example.com",
        "password": "password123"
    }
    
    try:
        response = requests.post(
            f"{base_url}/api/auth/register",
            json=test_user,
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Registration successful")
            print(f"   User: {data.get('user', {}).get('name', 'Unknown')}")
            print(f"   Token: {data.get('token', 'None')[:20]}...")
            return True
        else:
            print(f"❌ Registration failed: {response.status_code}")
            print(f"   Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Registration error: {e}")
        return False

def clear_local_storage():
    """Instructions to clear localStorage"""
    print("\n🧹 CLEAR BROWSER DATA:")
    print("=" * 50)
    print("1. Open your browser")
    print("2. Go to http://localhost:3000")
    print("3. Press F12 to open Developer Tools")
    print("4. Go to Application/Storage tab")
    print("5. Clear localStorage:")
    print("   - Right-click on 'localhost:3000'")
    print("   - Select 'Clear'")
    print("6. Refresh the page")

def create_test_account():
    """Create a test account via API"""
    print("\n👤 CREATING TEST ACCOUNT:")
    print("=" * 50)
    
    test_user = {
        "name": "Test User",
        "email": "test@example.com", 
        "password": "password123"
    }
    
    try:
        response = requests.post(
            "http://localhost:3000/api/auth/register",
            json=test_user,
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Test account created successfully!")
            print(f"   Name: {data['user']['name']}")
            print(f"   Email: {data['user']['email']}")
            print(f"   Token: {data['token'][:20]}...")
            
            print("\n🔑 LOGIN CREDENTIALS:")
            print(f"   Email: {test_user['email']}")
            print(f"   Password: {test_user['password']}")
            
            return True
        else:
            print(f"❌ Failed to create test account: {response.status_code}")
            print(f"   Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error creating test account: {e}")
        return False

def main():
    print("🚀 Authentication Test & Fix")
    print("=" * 50)
    
    # Reset database first
    try:
        response = requests.post("http://localhost:3000/api/auth/reset", timeout=5)
        if response.status_code == 200:
            print("✅ Database reset successfully")
        else:
            print(f"❌ Database reset failed: {response.status_code}")
    except Exception as e:
        print(f"❌ Database reset error: {e}")
    
    # Test authentication flow
    auth_ok = test_auth_flow()
    
    if auth_ok:
        print("\n🎉 Authentication system is working!")
        print("   You can now create a new account")
    else:
        print("\n⚠️  Authentication system has issues")
        clear_local_storage()
    
    # Create a test account
    print("\n" + "=" * 50)
    create_test_account()
    
    print("\n💡 NEXT STEPS:")
    print("1. Clear your browser localStorage (see instructions above)")
    print("2. Go to http://localhost:3000")
    print("3. Click 'Sign in'")
    print("4. Use the test credentials above")
    print("5. Or create your own account")

if __name__ == "__main__":
    main()
