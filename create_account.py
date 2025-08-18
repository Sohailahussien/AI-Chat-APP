#!/usr/bin/env python3
"""
Create a fresh account with unique email
"""

import requests
import time

def create_fresh_account():
    """Create a fresh account with timestamp"""
    timestamp = int(time.time())
    
    fresh_user = {
        "name": "Your Name",
        "email": f"user{timestamp}@example.com",
        "password": "password123"
    }
    
    print("👤 CREATING FRESH ACCOUNT:")
    print("=" * 50)
    
    try:
        response = requests.post(
            "http://localhost:3000/api/auth/register",
            json=fresh_user,
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Fresh account created successfully!")
            print(f"   Name: {data['user']['name']}")
            print(f"   Email: {data['user']['email']}")
            print(f"   Token: {data['token'][:20]}...")
            
            print("\n🔑 YOUR LOGIN CREDENTIALS:")
            print(f"   Email: {fresh_user['email']}")
            print(f"   Password: {fresh_user['password']}")
            
            print("\n💡 NEXT STEPS:")
            print("1. Clear your browser localStorage:")
            print("   - Press F12 in your browser")
            print("   - Go to Application/Storage tab")
            print("   - Right-click 'localhost:3000' and select 'Clear'")
            print("2. Go to http://localhost:3000")
            print("3. Click 'Sign in'")
            print("4. Use the credentials above")
            
            return True
        else:
            print(f"❌ Failed to create account: {response.status_code}")
            print(f"   Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error creating account: {e}")
        return False

if __name__ == "__main__":
    create_fresh_account()
