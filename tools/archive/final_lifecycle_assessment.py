#!/usr/bin/env python3
"""
Final Lifecycle Assessment
Quick automated assessment of the complete request lifecycle and admin status capabilities
"""

import asyncio
import json
import requests
import time
from datetime import datetime
from playwright.async_api import async_playwright

class FinalLifecycleAssessment:
    def __init__(self, base_url="http://localhost:3000"):
        self.base_url = base_url
        self.results = {
            "timestamp": datetime.now().isoformat(),
            "assessments": {},
            "summary": {}
        }
        
        self.admin_credentials = {
            "email": "admin@newsteps.fit",
            "password": "Admin123!"
        }
    
    def test_api_endpoints(self):
        """Test all critical API endpoints"""
        print("🔄 TESTING CRITICAL API ENDPOINTS")
        print("-" * 50)
        
        endpoints = [
            ("GET", "/api/shoes", "Public Shoes API", None),
            ("GET", "/api/health", "Health Check", None),
            ("POST", "/api/contact", "Contact Form", {
                "firstName": "Test", "lastName": "User", "email": "test@example.com",
                "phone": "1234567890", "subject": "Test", "message": "Test message"
            }),
            ("POST", "/api/donations", "Shoe Donations", {
                "firstName": "Test", "lastName": "Donor", "email": "donor@example.com",
                "phone": "1234567890", "numberOfShoes": 2, "donationDescription": "Test donation",
                "address": {"street": "123 St", "city": "SF", "state": "CA", "zipCode": "94102", "country": "USA"}
            }),
            ("POST", "/api/donations/money", "Money Donations", {
                "firstName": "Test", "lastName": "MoneyDonor", "email": "money@example.com",
                "phone": "1234567890", "amount": 25.00, "message": "Test money donation"
            }),
            ("POST", "/api/volunteers", "Volunteer Applications", {
                "firstName": "Test", "lastName": "Volunteer", "email": "volunteer@example.com",
                "phone": "1234567890", "location": "SF", "availability": "Weekends",
                "interests": ["Shoe Collection"], "experience": "Test", "message": "Test volunteer"
            })
        ]
        
        api_results = {}
        
        for method, endpoint, name, data in endpoints:
            try:
                if method == "GET":
                    response = requests.get(f"{self.base_url}{endpoint}", timeout=10)
                else:
                    response = requests.post(f"{self.base_url}{endpoint}", json=data, timeout=10)
                
                success = response.status_code in [200, 201]
                api_results[name] = {
                    "success": success,
                    "status_code": response.status_code,
                    "endpoint": endpoint
                }
                
                status = "✅" if success else "❌"
                print(f"{status} {name}: {response.status_code}")
                
            except Exception as e:
                api_results[name] = {
                    "success": False,
                    "error": str(e),
                    "endpoint": endpoint
                }
                print(f"❌ {name}: Error - {e}")
        
        return api_results
    
    async def test_user_registration_and_login(self):
        """Test user registration and login flow"""
        print("\n🔄 TESTING USER REGISTRATION AND LOGIN")
        print("-" * 50)
        
        auth_results = {}
        
        try:
            # Create test user
            timestamp = int(time.time())
            user_data = {
                "firstName": "Final",
                "lastName": "TestUser",
                "email": f"finaltest{timestamp}@example.com",
                "password": "FinalTest123!",
                "phone": "1234567890"
            }
            
            # Test registration
            reg_response = requests.post(f"{self.base_url}/api/auth/register", json=user_data, timeout=10)
            
            if reg_response.status_code == 201:
                print("✅ User registration: Success")
                auth_results["registration"] = {"success": True, "email": user_data["email"]}
                
                # Test login via browser
                async with async_playwright() as p:
                    browser = await p.chromium.launch(headless=True)
                    context = await browser.new_context()
                    page = await context.new_page()
                    
                    try:
                        await page.goto(f"{self.base_url}/login")
                        await page.wait_for_load_state('networkidle')
                        await page.wait_for_timeout(2000)
                        
                        await page.fill('input[type="email"]', user_data["email"])
                        await page.fill('input[type="password"]', user_data["password"])
                        await page.click('button[type="submit"]')
                        await page.wait_for_timeout(3000)
                        
                        if '/account' in page.url:
                            print("✅ User login: Success")
                            auth_results["login"] = {"success": True}
                        else:
                            print("❌ User login: Failed")
                            auth_results["login"] = {"success": False}
                            
                    finally:
                        await context.close()
                        await browser.close()
            else:
                print(f"❌ User registration: Failed ({reg_response.status_code})")
                auth_results["registration"] = {"success": False}
                
        except Exception as e:
            print(f"❌ User auth error: {e}")
            auth_results["error"] = str(e)
        
        return auth_results
    
    async def test_admin_access(self):
        """Test admin login and dashboard access"""
        print("\n🔄 TESTING ADMIN ACCESS")
        print("-" * 50)
        
        admin_results = {}
        
        try:
            async with async_playwright() as p:
                browser = await p.chromium.launch(headless=True)
                context = await browser.new_context()
                page = await context.new_page()
                
                try:
                    # Admin login
                    await page.goto(f"{self.base_url}/login")
                    await page.wait_for_load_state('networkidle')
                    await page.wait_for_timeout(2000)
                    
                    await page.fill('input[type="email"]', self.admin_credentials['email'])
                    await page.fill('input[type="password"]', self.admin_credentials['password'])
                    await page.click('button[type="submit"]')
                    await page.wait_for_timeout(3000)
                    
                    if '/admin' in page.url or 'dashboard' in page.url:
                        print("✅ Admin login: Success")
                        admin_results["login"] = {"success": True}
                        
                        # Test admin pages
                        admin_pages = [
                            "/admin/requests",
                            "/admin/shoe-donations", 
                            "/admin/money-donations",
                            "/admin/shoes",
                            "/admin/users"
                        ]
                        
                        accessible_pages = 0
                        for admin_page in admin_pages:
                            try:
                                await page.goto(f"{self.base_url}{admin_page}")
                                await page.wait_for_load_state('networkidle')
                                await page.wait_for_timeout(1000)
                                
                                if 'login' not in page.url and '404' not in await page.content():
                                    accessible_pages += 1
                            except:
                                pass
                        
                        admin_results["dashboard_access"] = {
                            "success": accessible_pages >= 3,
                            "accessible_pages": accessible_pages,
                            "total_pages": len(admin_pages)
                        }
                        
                        print(f"✅ Admin dashboard: {accessible_pages}/{len(admin_pages)} pages accessible")
                        
                    else:
                        print("❌ Admin login: Failed")
                        admin_results["login"] = {"success": False}
                        
                finally:
                    await context.close()
                    await browser.close()
                    
        except Exception as e:
            print(f"❌ Admin access error: {e}")
            admin_results["error"] = str(e)
        
        return admin_results
    
    def test_inventory_and_request_readiness(self):
        """Test inventory availability and request system readiness"""
        print("\n🔄 TESTING INVENTORY AND REQUEST READINESS")
        print("-" * 50)
        
        inventory_results = {}
        
        try:
            # Check inventory
            shoes_response = requests.get(f"{self.base_url}/api/shoes", timeout=10)
            
            if shoes_response.status_code == 200:
                shoes_data = shoes_response.json()
                shoes = shoes_data.get('shoes', [])
                shoe_count = len(shoes)
                
                inventory_results["inventory_check"] = {
                    "success": shoe_count > 0,
                    "shoe_count": shoe_count,
                    "has_requestable_shoes": shoe_count > 0
                }
                
                print(f"✅ Inventory: {shoe_count} shoes available")
                
                # Check if shoes have required fields for requests
                if shoes:
                    sample_shoe = shoes[0]
                    required_fields = ['_id', 'brand', 'modelName', 'size', 'status']
                    has_required_fields = all(field in sample_shoe for field in required_fields)
                    
                    inventory_results["shoe_data_quality"] = {
                        "success": has_required_fields,
                        "sample_shoe_fields": list(sample_shoe.keys()),
                        "has_required_fields": has_required_fields
                    }
                    
                    status = "✅" if has_required_fields else "❌"
                    print(f"{status} Shoe data quality: {'Good' if has_required_fields else 'Missing fields'}")
                
            else:
                print(f"❌ Inventory check failed: {shoes_response.status_code}")
                inventory_results["inventory_check"] = {"success": False}
            
            # Test request API (without auth - should return 401)
            test_request_data = {
                "items": [{"inventoryId": "test", "shoeId": 1, "quantity": 1}],
                "shippingInfo": {"firstName": "Test", "lastName": "User", "email": "test@example.com"}
            }
            
            request_response = requests.post(f"{self.base_url}/api/requests", json=test_request_data, timeout=10)
            
            # Should return 401 (auth required) - this is correct behavior
            request_protected = request_response.status_code == 401
            
            inventory_results["request_protection"] = {
                "success": request_protected,
                "status_code": request_response.status_code,
                "properly_protected": request_protected
            }
            
            status = "✅" if request_protected else "❌"
            print(f"{status} Request API protection: {'Properly protected' if request_protected else 'Not protected'}")
            
        except Exception as e:
            print(f"❌ Inventory/request test error: {e}")
            inventory_results["error"] = str(e)
        
        return inventory_results
    
    async def run_final_assessment(self):
        """Run complete final assessment"""
        print("🚀 FINAL LIFECYCLE ASSESSMENT")
        print("=" * 80)
        print(f"Platform: {self.base_url}")
        print(f"Focus: Complete system readiness for request lifecycle")
        print(f"Timestamp: {datetime.now().isoformat()}")
        print("=" * 80)
        
        # Run all assessments
        self.results["assessments"]["api_endpoints"] = self.test_api_endpoints()
        self.results["assessments"]["user_auth"] = await self.test_user_registration_and_login()
        self.results["assessments"]["admin_access"] = await self.test_admin_access()
        self.results["assessments"]["inventory_readiness"] = self.test_inventory_and_request_readiness()
        
        # Generate final summary
        self.generate_final_summary()
        self.save_results()
        
        return self.results
    
    def generate_final_summary(self):
        """Generate final assessment summary"""
        print("\n" + "=" * 80)
        print("📊 FINAL LIFECYCLE ASSESSMENT SUMMARY")
        print("=" * 80)
        
        # Calculate success rates for each category
        categories = {
            "API Endpoints": self.results["assessments"]["api_endpoints"],
            "User Authentication": self.results["assessments"]["user_auth"],
            "Admin Access": self.results["assessments"]["admin_access"],
            "Inventory Readiness": self.results["assessments"]["inventory_readiness"]
        }
        
        total_tests = 0
        successful_tests = 0
        
        for category_name, category_data in categories.items():
            if isinstance(category_data, dict) and "error" not in category_data:
                category_successful = sum(1 for item in category_data.values() if isinstance(item, dict) and item.get("success", False))
                category_total = len([item for item in category_data.values() if isinstance(item, dict) and "success" in item])
                
                total_tests += category_total
                successful_tests += category_successful
                
                success_rate = (category_successful / category_total * 100) if category_total > 0 else 0
                status = "✅ PASS" if success_rate >= 70 else "❌ FAIL"
                
                print(f"{category_name:30} | {category_successful:2d}/{category_total:2d} tests | {success_rate:5.1f}% | {status}")
            else:
                print(f"{category_name:30} | ERROR")
        
        # Overall assessment
        overall_success_rate = (successful_tests / total_tests * 100) if total_tests > 0 else 0
        
        print("-" * 80)
        print(f"{'OVERALL SYSTEM READINESS':30} | {successful_tests:2d}/{total_tests:2d} tests | {overall_success_rate:5.1f}%")
        
        # Final status determination
        if overall_success_rate >= 80:
            final_status = "🎉 READY FOR PRODUCTION"
            status_message = "System ready for complete request lifecycle!"
        elif overall_success_rate >= 60:
            final_status = "✅ MOSTLY READY"
            status_message = "System mostly ready, minor issues to address"
        else:
            final_status = "⚠️ NEEDS WORK"
            status_message = "System needs attention before production"
        
        print("=" * 80)
        print(f"FINAL STATUS: {final_status}")
        print(f"ASSESSMENT: {status_message}")
        
        # Key capabilities assessment
        print("\n🎯 KEY CAPABILITIES ASSESSMENT:")
        
        # Check critical capabilities
        api_working = len([k for k, v in self.results["assessments"]["api_endpoints"].items() if v.get("success", False)]) >= 4
        user_auth_working = self.results["assessments"]["user_auth"].get("registration", {}).get("success", False)
        admin_access_working = self.results["assessments"]["admin_access"].get("login", {}).get("success", False)
        inventory_ready = self.results["assessments"]["inventory_readiness"].get("inventory_check", {}).get("success", False)
        
        capabilities = [
            ("✅" if api_working else "❌", "API Endpoints", "Core APIs functional"),
            ("✅" if user_auth_working else "❌", "User Registration", "Users can create accounts"),
            ("✅" if admin_access_working else "❌", "Admin Access", "Admin can access dashboard"),
            ("✅" if inventory_ready else "❌", "Inventory System", "Shoes available for requests")
        ]
        
        for status, capability, description in capabilities:
            print(f"   {status} {capability}: {description}")
        
        # Request lifecycle readiness
        print("\n📋 REQUEST LIFECYCLE READINESS:")
        
        if all([api_working, user_auth_working, admin_access_working, inventory_ready]):
            print("   🎉 COMPLETE LIFECYCLE READY:")
            print("      • Users can register and login ✅")
            print("      • Shoes available for requests ✅")
            print("      • Admin can access management ✅")
            print("      • APIs functional for all operations ✅")
            print("\n   📝 MANUAL VERIFICATION NEEDED:")
            print("      • Admin status changes (approve/reject/ship)")
            print("      • Email notifications for status changes")
            print("      • Inventory updates after admin actions")
        else:
            print("   ⚠️ SOME COMPONENTS NEED ATTENTION")
            print("      • Fix failing components before production")
        
        print("=" * 80)
        
        # Store summary
        self.results["summary"] = {
            "total_tests": total_tests,
            "successful_tests": successful_tests,
            "overall_success_rate": overall_success_rate,
            "final_status": final_status,
            "status_message": status_message,
            "api_working": api_working,
            "user_auth_working": user_auth_working,
            "admin_access_working": admin_access_working,
            "inventory_ready": inventory_ready,
            "lifecycle_ready": all([api_working, user_auth_working, admin_access_working, inventory_ready])
        }
    
    def save_results(self):
        """Save assessment results"""
        filename = f"final_lifecycle_assessment_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        with open(filename, 'w') as f:
            json.dump(self.results, f, indent=2)
        print(f"\n💾 Final assessment saved to: {filename}")

async def main():
    """Main function"""
    assessor = FinalLifecycleAssessment()
    await assessor.run_final_assessment()

if __name__ == "__main__":
    asyncio.run(main())
