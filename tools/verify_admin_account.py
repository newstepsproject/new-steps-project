#!/usr/bin/env python3
"""
Verify Admin Account Exists
"""

import requests
import json

def verify_admin_account():
    print("🔍 VERIFYING ADMIN ACCOUNT")
    print("=" * 30)
    
    base_url = "http://localhost:3001"
    
    # Test 1: Check if we can access admin page (should redirect to login)
    print("\n1. Testing admin page access...")
    try:
        response = requests.get(f"{base_url}/admin", allow_redirects=False)
        print(f"   Status: {response.status_code}")
        if response.status_code == 302:
            print("   ✅ Correctly redirects to login (admin page protected)")
        else:
            print(f"   ⚠️  Unexpected status: {response.status_code}")
    except Exception as e:
        print(f"   ❌ Error: {e}")
    
    # Test 2: Try to login with admin credentials
    print("\n2. Testing admin login...")
    try:
        # Get CSRF token first
        session = requests.Session()
        csrf_response = session.get(f"{base_url}/api/auth/csrf")
        csrf_data = csrf_response.json()
        csrf_token = csrf_data.get('csrfToken')
        
        print(f"   CSRF Token: {csrf_token[:20]}..." if csrf_token else "   ❌ No CSRF token")
        
        # Attempt login
        login_data = {
            'email': 'newstepsfit@gmail.com',
            'password': 'Admin123!',
            'csrfToken': csrf_token,
            'redirect': 'false'
        }
        
        login_response = session.post(
            f"{base_url}/api/auth/signin/credentials",
            data=login_data,
            allow_redirects=False
        )
        
        print(f"   Login Status: {login_response.status_code}")
        print(f"   Response Headers: {dict(login_response.headers)}")
        
        if login_response.status_code == 302:
            print("   ✅ Login appears successful (302 redirect)")
        elif login_response.status_code == 401:
            print("   ❌ Login failed - Invalid credentials")
        else:
            print(f"   ⚠️  Unexpected login response: {login_response.status_code}")
            
    except Exception as e:
        print(f"   ❌ Login test error: {e}")
    
    # Test 3: Check if admin user exists in database
    print("\n3. Testing user existence...")
    try:
        # This would require database access, so we'll skip for now
        print("   ℹ️  Database check skipped (would require direct DB access)")
    except Exception as e:
        print(f"   ❌ Database check error: {e}")
    
    print("\n🎯 RECOMMENDATION:")
    print("   Try manual login at: http://localhost:3001/login")
    print("   Email: newstepsfit@gmail.com")
    print("   Password: Admin123!")

if __name__ == "__main__":
    verify_admin_account()

