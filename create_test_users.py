#!/usr/bin/env python3
"""
Create test user accounts for mobile UI/UX testing
"""

import requests
import json

def create_test_user(base_url, email, password, first_name, last_name, phone=""):
    """Create a test user account"""
    registration_data = {
        "firstName": first_name,
        "lastName": last_name,
        "email": email,
        "password": password,
        "phone": phone
    }
    
    try:
        response = requests.post(f"{base_url}/api/auth/register", json=registration_data)
        if response.status_code == 201:
            print(f"   ✅ Created user: {email}")
            return True
        elif response.status_code == 400 and "already exists" in response.text:
            print(f"   ℹ️  User already exists: {email}")
            return True
        else:
            print(f"   ❌ Failed to create {email}: {response.status_code} - {response.text}")
            return False
    except Exception as e:
        print(f"   ❌ Error creating {email}: {str(e)}")
        return False

def test_login(base_url, email, password):
    """Test login functionality"""
    login_data = {
        "email": email,
        "password": password
    }
    
    try:
        response = requests.post(f"{base_url}/api/auth/test-login", json=login_data)
        if response.status_code == 200:
            print(f"   ✅ Login test successful: {email}")
            return True
        else:
            print(f"   ❌ Login test failed for {email}: {response.status_code}")
            return False
    except Exception as e:
        print(f"   ❌ Login test error for {email}: {str(e)}")
        return False

def main():
    environments = [
        ("localhost", "http://localhost:3000"),
        ("production", "https://newsteps.fit")
    ]
    
    test_users = [
        ("mobile.test@example.com", "MobileTest123!", "Mobile", "Tester", "(555) 123-4567"),
        ("ui.test@example.com", "UITest123!", "UI", "Tester", "(555) 234-5678"),
        ("ux.test@example.com", "UXTest123!", "UX", "Tester", "(555) 345-6789")
    ]
    
    for env_name, base_url in environments:
        print(f"\n🌐 {env_name.upper()} ENVIRONMENT ({base_url})")
        print("-" * 50)
        
        # Test server connectivity
        try:
            response = requests.get(f"{base_url}/", timeout=10)
            if response.status_code == 200:
                print(f"   ✅ Server is accessible")
            else:
                print(f"   ⚠️  Server returned {response.status_code}")
                continue
        except Exception as e:
            print(f"   ❌ Server not accessible: {str(e)}")
            continue
        
        # Create test users
        print(f"\n   👤 Creating test users...")
        success_count = 0
        for email, password, first_name, last_name, phone in test_users:
            if create_test_user(base_url, email, password, first_name, last_name, phone):
                success_count += 1
        
        print(f"\n   📊 Created/verified {success_count}/{len(test_users)} users")
        
        # Test login for each user
        print(f"\n   🔐 Testing login functionality...")
        login_success = 0
        for email, password, _, _, _ in test_users:
            if test_login(base_url, email, password):
                login_success += 1
        
        print(f"   📊 Login tests: {login_success}/{len(test_users)} successful")

if __name__ == "__main__":
    main()
