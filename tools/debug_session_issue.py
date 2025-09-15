#!/usr/bin/env python3
"""
Debug Session Issue
Compare session validation between working and failing APIs
"""

import requests
import json
import time

def test_session_comparison():
    """Compare session behavior between profile and requests APIs"""
    session = requests.Session()
    base_url = "http://localhost:3000"
    
    print("🔍 DEBUGGING SESSION ISSUE")
    print("=" * 50)
    
    # Step 1: Register and login
    print("1. Registering test user...")
    timestamp = int(time.time())
    test_email = f"debuguser{timestamp}@example.com"
    
    # Register
    register_data = {
        "firstName": "Debug",
        "lastName": "User",
        "email": test_email,
        "password": "DebugUser123!",
        "phone": "1234567890"
    }
    
    register_response = session.post(f"{base_url}/api/auth/register", json=register_data)
    print(f"   Registration: {register_response.status_code}")
    
    # Get CSRF token
    csrf_response = session.get(f"{base_url}/api/auth/csrf")
    csrf_token = csrf_response.json().get('csrfToken') if csrf_response.status_code == 200 else None
    print(f"   CSRF token: {'✅' if csrf_token else '❌'}")
    
    # Login
    login_data = {
        'email': test_email,
        'password': 'DebugUser123!',
        'csrfToken': csrf_token,
        'callbackUrl': f'{base_url}/account',
        'json': 'true'
    }
    
    login_response = session.post(
        f"{base_url}/api/auth/callback/credentials",
        data=login_data,
        headers={'Content-Type': 'application/x-www-form-urlencoded'}
    )
    print(f"   Login: {login_response.status_code}")
    print(f"   Login response: {login_response.text[:200]}...")
    print(f"   Login headers: {dict(login_response.headers)}")
    
    # Check cookies
    session_cookies = [cookie for cookie in session.cookies if 'session' in cookie.name.lower()]
    print(f"   Session cookies: {len(session_cookies)}")
    
    # Wait for session to stabilize and test multiple times
    print("\n   Waiting for session to stabilize...")
    for i in range(5):
        time.sleep(2)
        session_test = session.get(f"{base_url}/api/auth/session")
        session_data = session_test.json() if session_test.status_code == 200 else {}
        user_email = session_data.get('user', {}).get('email', 'N/A')
        print(f"   Attempt {i+1}: Session status = {session_test.status_code}, User = {user_email}")
        if user_email != 'N/A':
            print("   ✅ Session established!")
            break
    else:
        print("   ❌ Session never established after 10 seconds")
    
    print("\n2. Testing API endpoints...")
    
    # Test profile API (working)
    print("   Testing /api/user/profile...")
    profile_response = session.get(f"{base_url}/api/user/profile")
    print(f"     Response: {profile_response.status_code}")
    if profile_response.status_code != 200:
        print(f"     Error: {profile_response.text}")
    else:
        print(f"     Success: {profile_response.text[:100]}...")
    
    # Test requests API (failing)
    print("   Testing /api/requests...")
    requests_response = session.get(f"{base_url}/api/requests")
    print(f"     Response: {requests_response.status_code}")
    if requests_response.status_code != 200:
        print(f"     Error: {requests_response.text}")
    
    print("\n3. Detailed session analysis...")
    
    # Check all cookies
    print("   All cookies:")
    for cookie in session.cookies:
        print(f"     {cookie.name}: {cookie.value[:30]}...")
    
    # Test session endpoint directly
    print("   Testing /api/auth/session...")
    session_check = session.get(f"{base_url}/api/auth/session")
    print(f"     Response: {session_check.status_code}")
    if session_check.status_code == 200:
        session_data = session_check.json()
        print(f"     Full session data: {json.dumps(session_data, indent=2)}")
        print(f"     User: {session_data.get('user', {}).get('email', 'N/A')}")
        print(f"     Expires: {session_data.get('expires', 'N/A')}")
    else:
        print(f"     Session check failed: {session_check.text}")
    
    print("\n4. Testing with explicit headers...")
    
    # Try requests API with explicit headers
    headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }
    
    requests_response_2 = session.get(f"{base_url}/api/requests", headers=headers)
    print(f"   /api/requests with headers: {requests_response_2.status_code}")
    
    # Try with a small delay
    time.sleep(1)
    requests_response_3 = session.get(f"{base_url}/api/requests")
    print(f"   /api/requests after delay: {requests_response_3.status_code}")

if __name__ == "__main__":
    test_session_comparison()
