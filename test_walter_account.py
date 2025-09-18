#!/usr/bin/env python3
"""
Test Walter's account on both environments
"""

import requests
import json

def test_login(base_url, email, password):
    """Test login functionality"""
    login_data = {
        "email": email,
        "password": password
    }
    
    try:
        response = requests.post(f"{base_url}/api/auth/test-login", json=login_data)
        if response.status_code == 200:
            print(f"   ✅ Login successful: {email}")
            return True
        else:
            print(f"   ❌ Login failed: {response.status_code} - {response.text}")
            return False
    except Exception as e:
        print(f"   ❌ Login error: {str(e)}")
        return False

def main():
    email = "walterzhang10@gmail.com"
    password = "TestPass123!"
    
    environments = [
        ("localhost", "http://localhost:3000"),
        ("production", "https://newsteps.fit")
    ]
    
    for env_name, base_url in environments:
        print(f"\n🌐 {env_name.upper()} - Testing Walter's Account")
        print("-" * 50)
        
        # Test server connectivity
        try:
            response = requests.get(f"{base_url}/", timeout=10)
            if response.status_code == 200:
                print(f"   ✅ Server accessible")
                # Test login
                test_login(base_url, email, password)
            else:
                print(f"   ⚠️  Server returned {response.status_code}")
        except Exception as e:
            print(f"   ❌ Server not accessible: {str(e)}")

if __name__ == "__main__":
    main()
