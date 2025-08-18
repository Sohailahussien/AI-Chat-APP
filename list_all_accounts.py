#!/usr/bin/env python3
"""
List all accounts directly from the database
"""

import sqlite3
import os
from datetime import datetime

def list_all_accounts():
    """List all accounts from the SQLite database"""
    db_path = "prisma/dev.db"
    
    if not os.path.exists(db_path):
        print(f"❌ Database not found at: {db_path}")
        return
    
    print("🔍 CHECKING DATABASE FOR ALL ACCOUNTS:")
    print("=" * 50)
    
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Get all users
        cursor.execute("SELECT id, name, email, createdAt FROM User ORDER BY createdAt DESC")
        users = cursor.fetchall()
        
        if users:
            print(f"✅ Found {len(users)} accounts in database:")
            print()
            
            for i, (user_id, name, email, created_at) in enumerate(users, 1):
                # Convert timestamp to readable date
                if created_at:
                    try:
                        date = datetime.fromisoformat(created_at.replace('Z', '+00:00'))
                        date_str = date.strftime('%Y-%m-%d %H:%M:%S')
                    except:
                        date_str = created_at
                else:
                    date_str = "Unknown"
                
                print(f"   {i}. ID: {user_id}")
                print(f"      Name: {name}")
                print(f"      Email: {email}")
                print(f"      Created: {date_str}")
                print()
        else:
            print("❌ No accounts found in database")
        
        # Get profiles count
        cursor.execute("SELECT COUNT(*) FROM Profile")
        profile_count = cursor.fetchone()[0]
        print(f"📊 Total profiles: {profile_count}")
        
        conn.close()
        
    except Exception as e:
        print(f"❌ Error reading database: {e}")

def test_all_accounts():
    """Test login for all found accounts"""
    print("\n🔐 TESTING LOGIN FOR ALL ACCOUNTS:")
    print("=" * 50)
    
    # Common passwords to try
    common_passwords = [
        "password123",
        "123456", 
        "password",
        "admin123",
        "test123",
        "user123"
    ]
    
    db_path = "prisma/dev.db"
    
    if not os.path.exists(db_path):
        return
    
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        cursor.execute("SELECT email FROM User")
        emails = [row[0] for row in cursor.fetchall()]
        conn.close()
        
        import requests
        
        for email in emails:
            print(f"\n🔍 Testing: {email}")
            print("-" * 30)
            
            for password in common_passwords:
                try:
                    response = requests.post(
                        "http://localhost:3000/api/auth/login",
                        json={"email": email, "password": password},
                        timeout=5
                    )
                    
                    if response.status_code == 200:
                        data = response.json()
                        print(f"✅ SUCCESS! Password: {password}")
                        print(f"   User: {data.get('user', {}).get('name', 'Unknown')}")
                        print(f"   Token: {data.get('token', 'None')[:20]}...")
                        break
                    else:
                        print(f"   ❌ {password}: Failed")
                        
                except Exception as e:
                    print(f"   ❌ {password}: Error - {e}")
                    
    except Exception as e:
        print(f"❌ Error testing accounts: {e}")

def main():
    print("🚀 COMPLETE ACCOUNT RECOVERY")
    print("=" * 50)
    
    list_all_accounts()
    test_all_accounts()
    
    print("\n💡 NEXT STEPS:")
    print("1. Use the working credentials above")
    print("2. Go to http://localhost:3000")
    print("3. Click 'Sign in'")
    print("4. Enter the email and password that worked")
    print("5. Your chat history should be preserved!")

if __name__ == "__main__":
    main()
