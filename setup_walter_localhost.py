#!/usr/bin/env python3
"""
Create Walter's account on localhost for testing
"""

import requests
import json

def create_account(base_url, email, password):
    """Create Walter's account"""
    registration_data = {
        "firstName": "Walter",
        "lastName": "Zhang", 
        "email": email,
        "password": password,
        "phone": "(555) 123-4567"
    }
    
    try:
        response = requests.post(f"{base_url}/api/auth/register", json=registration_data)
        if response.status_code == 201:
            print(f"   ✅ Account created: {email}")
            return True
        elif response.status_code == 400 and "already exists" in response.text:
            print(f"   ℹ️  Account already exists: {email}")
            return True
        else:
            print(f"   ❌ Failed to create account: {response.status_code} - {response.text}")
            return False
    except Exception as e:
        print(f"   ❌ Error creating account: {str(e)}")
        return False

def test_login(base_url, email, password):
    """Test login"""
    login_data = {"email": email, "password": password}
    
    try:
        response = requests.post(f"{base_url}/api/auth/test-login", json=login_data)
        if response.status_code == 200:
            print(f"   ✅ Login test successful: {email}")
            return True
        else:
            print(f"   ❌ Login test failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"   ❌ Login test error: {str(e)}")
        return False

def main():
    email = "walterzhang10@gmail.com"
    password = "TestPass123!"
    base_url = "http://localhost:3000"
    
    print(f"🔧 Creating account on localhost...")
    if create_account(base_url, email, password):
        print(f"🔐 Testing login...")
        test_login(base_url, email, password)

if __name__ == "__main__":
    main()
