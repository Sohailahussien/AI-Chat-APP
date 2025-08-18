#!/usr/bin/env python3
"""
Check existing accounts in the database
"""

import requests
import json

def check_existing_accounts():
    """Check what accounts exist in the database"""
    print("🔍 CHECKING EXISTING ACCOUNTS:")
    print("=" * 50)
    
    try:
        # Try to get accounts from the database
        response = requests.get("http://localhost:3000/api/auth/accounts", timeout=5)
        
        if response.status_code == 200:
            accounts = response.json()
            print(f"✅ Found {len(accounts)} accounts:")
            for i, account in enumerate(accounts, 1):
                print(f"   {i}. {account.get('name', 'Unknown')} - {account.get('email', 'No email')}")
            return accounts
        else:
            print(f"❌ Could not fetch accounts: {response.status_code}")
            return []
            
    except Exception as e:
        print(f"❌ Error checking accounts: {e}")
        return []

def test_login(email, password):
    """Test login with given credentials"""
    print(f"\n🔐 TESTING LOGIN FOR: {email}")
    print("-" * 30)
    
    try:
        response = requests.post(
            "http://localhost:3000/api/auth/login",
            json={"email": email, "password": password},
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Login successful!")
            print(f"   User: {data.get('user', {}).get('name', 'Unknown')}")
            print(f"   Token: {data.get('token', 'None')[:20]}...")
            return True
        else:
            print(f"❌ Login failed: {response.status_code}")
            print(f"   Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Login error: {e}")
        return False

def main():
    print("🚀 ACCOUNT RECOVERY TOOL")
    print("=" * 50)
    
    # Check existing accounts
    accounts = check_existing_accounts()
    
    if not accounts:
        print("\n💡 No accounts found or API not available.")
        print("   Let's try to access your accounts manually.")
        
        # Common test accounts
        test_accounts = [
            {"email": "test@example.com", "password": "password123"},
            {"email": "user@example.com", "password": "password123"},
            {"email": "admin@example.com", "password": "admin123"},
        ]
        
        print("\n🔑 TRYING COMMON ACCOUNTS:")
        for account in test_accounts:
            test_login(account["email"], account["password"])
    
    print("\n💡 MANUAL RECOVERY STEPS:")
    print("1. Go to http://localhost:3000")
    print("2. Click 'Sign in'")
    print("3. Try your previous email/password combinations")
    print("4. If you remember your email, try common passwords:")
    print("   - password123")
    print("   - 123456")
    print("   - your email username")
    print("   - admin123")
    
    print("\n🔧 IF YOU CAN'T LOGIN:")
    print("1. Clear browser localStorage (F12 → Application → Clear)")
    print("2. Try different browsers")
    print("3. Check if you have the credentials saved somewhere")

if __name__ == "__main__":
    main()
