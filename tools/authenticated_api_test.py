#!/usr/bin/env python3
"""
Authenticated API Testing
Test admin and user APIs directly with proper authentication tokens
"""

import requests
import json
from datetime import datetime

class AuthenticatedAPITester:
    def __init__(self, base_url="http://localhost:3000"):
        self.base_url = base_url
        self.session = requests.Session()
        self.results = {
            "timestamp": datetime.now().isoformat(),
            "authentication": {},
            "user_apis": {},
            "admin_apis": {},
            "summary": {}
        }
    
    def get_csrf_token(self):
        """Get CSRF token for NextAuth"""
        try:
            response = self.session.get(f"{self.base_url}/api/auth/csrf")
            if response.status_code == 200:
                return response.json().get('csrfToken')
        except Exception as e:
            print(f"❌ CSRF token error: {e}")
        return None
    
    def login_as_admin(self):
        """Login as admin and get session cookies"""
        try:
            # Get CSRF token first
            csrf_token = self.get_csrf_token()
            if not csrf_token:
                return False
            
            # Attempt login via credentials provider
            login_data = {
                'email': 'admin@newsteps.fit',
                'password': 'Admin123!',
                'csrfToken': csrf_token,
                'callbackUrl': f'{self.base_url}/admin',
                'json': 'true'
            }
            
            response = self.session.post(
                f"{self.base_url}/api/auth/callback/credentials",
                data=login_data,
                headers={'Content-Type': 'application/x-www-form-urlencoded'}
            )
            
            print(f"Admin login response: {response.status_code}")
            
            # Check if we have session cookies
            session_cookies = [cookie for cookie in self.session.cookies if 'session' in cookie.name.lower()]
            auth_success = len(session_cookies) > 0 or response.status_code in [200, 302]
            
            self.results["authentication"]["admin_login"] = {
                "success": auth_success,
                "status_code": response.status_code,
                "cookies_count": len(session_cookies)
            }
            
            return auth_success
            
        except Exception as e:
            print(f"❌ Admin login error: {e}")
            self.results["authentication"]["admin_login"] = {
                "success": False,
                "error": str(e)
            }
            return False
    
    def test_admin_apis(self):
        """Test admin APIs with authenticated session"""
        admin_apis = [
            # Shoes Management
            {
                "name": "admin_shoes_get",
                "method": "GET",
                "endpoint": "/api/admin/shoes",
                "description": "Get admin shoes list"
            },
            {
                "name": "admin_shoes_post",
                "method": "POST", 
                "endpoint": "/api/admin/shoes",
                "data": {
                    "brand": "Nike",
                    "modelName": "Test Shoe API",
                    "size": "10",
                    "color": "Black",
                    "sport": "running",
                    "condition": "good",
                    "description": "Test shoe via API",
                    "status": "available"
                },
                "description": "Add shoe via admin API"
            },
            
            # Settings Management
            {
                "name": "admin_settings_get",
                "method": "GET",
                "endpoint": "/api/admin/settings",
                "description": "Get system settings"
            },
            {
                "name": "admin_settings_post",
                "method": "POST",
                "endpoint": "/api/admin/settings",
                "data": {
                    "maxShoesPerRequest": 2,
                    "shippingFee": 5,
                    "projectEmail": "newstepsfit@gmail.com"
                },
                "description": "Update system settings"
            },
            
            # Requests Management
            {
                "name": "admin_requests_get",
                "method": "GET",
                "endpoint": "/api/admin/requests", 
                "description": "Get admin requests list"
            },
            {
                "name": "admin_requests_post",
                "method": "POST",
                "endpoint": "/api/admin/requests",
                "data": {
                    "items": [
                        {
                            "inventoryId": "test123",
                            "shoeId": 1,
                            "size": "10",
                            "gender": "men"
                        }
                    ],
                    "shippingInfo": {
                        "firstName": "Admin",
                        "lastName": "Test",
                        "street": "123 Test St",
                        "city": "Test City",
                        "state": "CA",
                        "zipCode": "94102",
                        "country": "USA"
                    }
                },
                "description": "Create admin request"
            },
            
            # Shoe Donations Management
            {
                "name": "admin_donations_get",
                "method": "GET",
                "endpoint": "/api/admin/shoe-donations",
                "description": "Get admin donations list"
            },
            {
                "name": "admin_donations_post",
                "method": "POST",
                "endpoint": "/api/admin/shoe-donations",
                "data": {
                    "firstName": "Test",
                    "lastName": "Donor",
                    "email": "testdonor@example.com",
                    "address": {
                        "street": "123 Donor St",
                        "city": "San Francisco",
                        "state": "CA",
                        "zipCode": "94102",
                        "country": "USA"
                    },
                    "numberOfShoes": 2,
                    "donationDescription": "Admin test donation"
                },
                "description": "Create admin donation"
            },
            
            # Money Donations Management
            {
                "name": "admin_money_donations_get",
                "method": "GET",
                "endpoint": "/api/admin/money-donations",
                "description": "Get money donations list"
            },
            {
                "name": "admin_money_donations_post",
                "method": "POST",
                "endpoint": "/api/admin/money-donations",
                "data": {
                    "firstName": "Test",
                    "lastName": "MoneyDonor",
                    "email": "moneydonor@example.com",
                    "phone": "1234567890",
                    "amount": 50.00,
                    "message": "Admin test money donation"
                },
                "description": "Create admin money donation"
            },
            
            # Users Management
            {
                "name": "admin_users_get",
                "method": "GET",
                "endpoint": "/api/admin/users",
                "description": "Get users list"
            },
            {
                "name": "admin_users_ensure_admin",
                "method": "POST",
                "endpoint": "/api/admin/users/ensure-admin",
                "data": {},
                "description": "Ensure admin user exists"
            },
            
            # Orders Management
            {
                "name": "admin_orders_get",
                "method": "GET",
                "endpoint": "/api/admin/orders",
                "description": "Get orders list"
            },
            
            # Analytics
            {
                "name": "admin_analytics_get",
                "method": "GET",
                "endpoint": "/api/admin/analytics",
                "description": "Get analytics data"
            },
            
            # Dashboard Stats
            {
                "name": "admin_dashboard_donation_stats",
                "method": "GET",
                "endpoint": "/api/admin/dashboard/donation-stats",
                "description": "Get dashboard donation stats"
            },
            
            # Inventory Conversion
            {
                "name": "admin_convert_donation_to_inventory",
                "method": "POST",
                "endpoint": "/api/admin/donations/convert-to-inventory",
                "data": {
                    "donationId": "test-donation-id",
                    "shoes": [
                        {
                            "brand": "Nike",
                            "modelName": "Converted Shoe",
                            "size": "9",
                            "color": "Blue",
                            "sport": "basketball",
                            "condition": "good"
                        }
                    ]
                },
                "description": "Convert donation to inventory"
            }
        ]
        
        for api in admin_apis:
            self.test_authenticated_api(api, "admin")
    
    def test_authenticated_api(self, api_config, api_type):
        """Test individual authenticated API"""
        try:
            name = api_config["name"]
            method = api_config["method"]
            endpoint = api_config["endpoint"]
            description = api_config.get("description", "")
            
            print(f"🧪 Testing {name}: {description}")
            
            url = f"{self.base_url}{endpoint}"
            
            if method == "GET":
                response = self.session.get(url, timeout=10)
            elif method == "POST":
                data = api_config.get("data", {})
                response = self.session.post(url, json=data, timeout=10)
            elif method == "PATCH":
                data = api_config.get("data", {})
                response = self.session.patch(url, json=data, timeout=10)
            elif method == "PUT":
                data = api_config.get("data", {})
                response = self.session.put(url, json=data, timeout=10)
            elif method == "DELETE":
                response = self.session.delete(url, timeout=10)
            else:
                print(f"❌ {name}: Unsupported method {method}")
                return
            
            success = 200 <= response.status_code < 300
            
            # For admin APIs, 401/403 might indicate auth is working but we're not properly authenticated
            if response.status_code in [401, 403]:
                auth_required = True
                success = False
            else:
                auth_required = False
            
            print(f"{'✅' if success else '❌'} {name}: {response.status_code}")
            
            # Try to get response data
            response_data = None
            try:
                response_data = response.json()
                if isinstance(response_data, dict) and 'error' in response_data:
                    print(f"   Error: {response_data['error']}")
            except:
                pass
            
            self.results[f"{api_type}_apis"][name] = {
                "endpoint": endpoint,
                "method": method,
                "description": description,
                "success": success,
                "status_code": response.status_code,
                "auth_required": auth_required,
                "response_data": response_data
            }
            
        except Exception as e:
            print(f"❌ {name}: Error - {str(e)}")
            self.results[f"{api_type}_apis"][name] = {
                "endpoint": endpoint,
                "success": False,
                "error": str(e)
            }
    
    def run_authenticated_tests(self):
        """Run all authenticated API tests"""
        print("🎯 STARTING AUTHENTICATED API TESTING")
        print("=" * 60)
        
        # Test admin authentication
        print("🔐 Testing Admin Authentication...")
        admin_auth_success = self.login_as_admin()
        
        if admin_auth_success:
            print("✅ Admin authentication successful")
            print("\n📋 Testing Admin APIs...")
            self.test_admin_apis()
        else:
            print("❌ Admin authentication failed")
        
        # Generate summary
        self.generate_summary()
        self.save_results()
        
        return self.results
    
    def generate_summary(self):
        """Generate test summary"""
        auth_tests = len(self.results["authentication"])
        admin_tests = len(self.results["admin_apis"])
        
        total_tests = auth_tests + admin_tests
        
        auth_passed = sum(1 for test in self.results["authentication"].values() 
                         if isinstance(test, dict) and test.get("success", False))
        admin_passed = sum(1 for test in self.results["admin_apis"].values() 
                          if test.get("success", False))
        
        total_passed = auth_passed + admin_passed
        
        overall_success_rate = (total_passed / total_tests * 100) if total_tests > 0 else 0
        
        self.results["summary"] = {
            "total_tests": total_tests,
            "total_passed": total_passed,
            "overall_success_rate": overall_success_rate,
            "authentication_success": auth_passed > 0,
            "admin_apis_working": admin_passed > 0
        }
        
        print("\n" + "=" * 60)
        print("📊 AUTHENTICATED API TESTING SUMMARY")
        print("=" * 60)
        print(f"Authentication: {'✅' if auth_passed > 0 else '❌'}")
        print(f"Admin APIs Tested: {admin_tests}")
        print(f"Admin APIs Working: {admin_passed}")
        print(f"Overall Success Rate: {overall_success_rate:.1f}%")
        
        if overall_success_rate >= 80:
            print("🎉 EXCELLENT: Authenticated APIs working well!")
        elif overall_success_rate >= 60:
            print("✅ GOOD: Most authenticated APIs functional")
        else:
            print("⚠️ NEEDS WORK: Authentication or API issues")
    
    def save_results(self):
        """Save results to JSON file"""
        filename = f"authenticated_api_test_results_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        with open(filename, 'w') as f:
            json.dump(self.results, f, indent=2)
        print(f"\n💾 Results saved to: {filename}")

if __name__ == "__main__":
    tester = AuthenticatedAPITester()
    tester.run_authenticated_tests()
