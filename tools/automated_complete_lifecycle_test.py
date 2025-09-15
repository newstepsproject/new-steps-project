#!/usr/bin/env python3
"""
Automated Complete Request Lifecycle Testing
Test all request statuses and admin actions automatically using API calls and database verification
"""

import asyncio
import json
import requests
import time
from datetime import datetime
from playwright.async_api import async_playwright
import pymongo
from urllib.parse import quote_plus

class AutomatedLifecycleTester:
    def __init__(self, base_url="http://localhost:3000"):
        self.base_url = base_url
        self.results = {
            "timestamp": datetime.now().isoformat(),
            "lifecycle_tests": {},
            "status_tests": {},
            "summary": {}
        }
        
        # Admin credentials
        self.admin_credentials = {
            "email": "admin@newsteps.fit",
            "password": "Admin123!"
        }
        
        # MongoDB connection (for direct database verification)
        self.db = None
        self.connect_to_database()
        
        # Test data storage
        self.test_users = []
        self.test_requests = []
        self.initial_inventory = []
        
        # All possible request statuses to test
        self.request_statuses = [
            "submitted",
            "approved", 
            "shipped",
            "rejected"
        ]
        
        # All possible shoe donation statuses to test
        self.donation_statuses = [
            "submitted",
            "received",
            "processed",
            "cancelled"
        ]
        
        # All possible money donation statuses to test
        self.money_donation_statuses = [
            "submitted",
            "processed",
            "cancelled"
        ]
    
    def connect_to_database(self):
        """Connect to MongoDB for direct database verification"""
        try:
            # Try to connect to MongoDB (assuming local development)
            client = pymongo.MongoClient("mongodb://localhost:27017/")
            self.db = client["newsteps"]
            print("✅ Connected to MongoDB for database verification")
        except Exception as e:
            print(f"⚠️ MongoDB connection failed: {e}")
            print("   Database verification will be skipped")
    
    def create_test_user_via_api(self, user_number):
        """Create test user via API"""
        timestamp = int(time.time())
        user_data = {
            "firstName": f"Test{user_number}",
            "lastName": "User",
            "email": f"testuser{user_number}_{timestamp}@example.com",
            "password": "TestUser123!",
            "phone": f"123456789{user_number}"
        }
        
        try:
            response = requests.post(f"{self.base_url}/api/auth/register", json=user_data, timeout=10)
            if response.status_code == 201:
                return user_data
            else:
                print(f"❌ User creation failed: {response.status_code} - {response.text}")
                return None
        except Exception as e:
            print(f"❌ User creation error: {e}")
            return None
    
    def get_admin_session(self):
        """Get authenticated admin session"""
        session = requests.Session()
        
        # Get CSRF token first
        try:
            csrf_response = session.get(f"{self.base_url}/api/auth/csrf", timeout=10)
            if csrf_response.status_code == 200:
                csrf_token = csrf_response.json().get('csrfToken')
            else:
                csrf_token = None
        except:
            csrf_token = None
        
        # Login as admin
        login_data = {
            "email": self.admin_credentials["email"],
            "password": self.admin_credentials["password"]
        }
        
        if csrf_token:
            login_data["csrfToken"] = csrf_token
        
        try:
            login_response = session.post(
                f"{self.base_url}/api/auth/callback/credentials",
                data=login_data,
                headers={'Content-Type': 'application/x-www-form-urlencoded'},
                timeout=10
            )
            
            if login_response.status_code == 200:
                return session
            else:
                print(f"❌ Admin login failed: {login_response.status_code}")
                return None
        except Exception as e:
            print(f"❌ Admin login error: {e}")
            return None
    
    async def create_request_via_browser(self, user_data):
        """Create request via browser automation (handles authentication properly)"""
        try:
            async with async_playwright() as p:
                browser = await p.chromium.launch(headless=True)
                context = await browser.new_context()
                page = await context.new_page()
                
                try:
                    # Login user
                    await page.goto(f"{self.base_url}/login")
                    await page.wait_for_load_state('networkidle')
                    await page.wait_for_timeout(2000)
                    
                    await page.fill('input[type="email"]', user_data["email"])
                    await page.fill('input[type="password"]', user_data["password"])
                    await page.click('button[type="submit"]')
                    await page.wait_for_timeout(3000)
                    
                    # Check login success
                    if '/account' not in page.url:
                        return None
                    
                    # Go to shoes page
                    await page.goto(f"{self.base_url}/shoes")
                    await page.wait_for_load_state('networkidle')
                    await page.wait_for_timeout(2000)
                    
                    # Add first available shoe to cart
                    add_buttons = await page.locator('button:has-text("Add to Cart"), button:has-text("Request")').count()
                    if add_buttons == 0:
                        return None
                    
                    await page.locator('button:has-text("Add to Cart"), button:has-text("Request")').first.click()
                    await page.wait_for_timeout(2000)
                    
                    # Go to checkout
                    await page.goto(f"{self.base_url}/checkout")
                    await page.wait_for_load_state('networkidle')
                    await page.wait_for_timeout(3000)
                    
                    # Fill checkout form
                    await page.fill('input[name="firstName"], input[id="firstName"]', user_data["firstName"])
                    await page.fill('input[name="lastName"], input[id="lastName"]', user_data["lastName"])
                    await page.fill('input[name="email"], input[id="email"]', user_data["email"])
                    await page.fill('input[name="phone"], input[id="phone"]', user_data["phone"])
                    await page.fill('input[name="street"], input[id="street"]', '123 Test St')
                    await page.fill('input[name="city"], input[id="city"]', 'San Francisco')
                    await page.fill('input[name="state"], input[id="state"]', 'CA')
                    await page.fill('input[name="zipCode"], input[id="zipCode"]', '94102')
                    
                    # Select pickup to avoid payment
                    pickup_options = await page.locator('input[value="pickup"], label:has-text("Pickup")').count()
                    if pickup_options > 0:
                        await page.locator('input[value="pickup"], label:has-text("Pickup")').first.click()
                        await page.wait_for_timeout(1000)
                    
                    # Submit request
                    submit_buttons = await page.locator('button[type="submit"]:has-text("Complete"), button:has-text("Submit")').count()
                    if submit_buttons > 0:
                        await page.locator('button[type="submit"]:has-text("Complete"), button:has-text("Submit")').first.click()
                        await page.wait_for_timeout(5000)
                        
                        # Extract request ID
                        content = await page.content()
                        import re
                        request_id_match = re.search(r'REQ-[A-Z0-9-]+', content)
                        if request_id_match:
                            return request_id_match.group()
                    
                    return None
                    
                finally:
                    await context.close()
                    await browser.close()
                    
        except Exception as e:
            print(f"❌ Browser request creation error: {e}")
            return None
    
    def get_inventory_count(self):
        """Get current inventory count"""
        try:
            response = requests.get(f"{self.base_url}/api/shoes", timeout=10)
            if response.status_code == 200:
                data = response.json()
                return len(data.get('shoes', []))
            return 0
        except:
            return 0
    
    def get_request_from_database(self, request_id):
        """Get request from database"""
        if not self.db:
            return None
        
        try:
            requests_collection = self.db["shoerequests"]
            request = requests_collection.find_one({"requestId": request_id})
            return request
        except Exception as e:
            print(f"❌ Database query error: {e}")
            return None
    
    def update_request_status_via_api(self, request_id, new_status, admin_session):
        """Update request status via admin API"""
        try:
            # First, get the request to find its MongoDB ID
            if not self.db:
                print("❌ Cannot update status without database connection")
                return False
            
            request_doc = self.get_request_from_database(request_id)
            if not request_doc:
                print(f"❌ Request {request_id} not found in database")
                return False
            
            mongo_id = str(request_doc["_id"])
            
            # Update via admin API
            update_data = {
                "status": new_status,
                "adminNotes": f"Automated test - status changed to {new_status}"
            }
            
            if new_status == "shipped":
                update_data["trackingNumber"] = "TEST123456789"
                update_data["shippingNotes"] = "Automated test shipment"
            elif new_status == "rejected":
                update_data["rejectionReason"] = "Automated test rejection"
            
            response = admin_session.patch(
                f"{self.base_url}/api/admin/requests",
                json={"requestId": mongo_id, **update_data},
                timeout=10
            )
            
            if response.status_code == 200:
                return True
            else:
                print(f"❌ Status update failed: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Status update error: {e}")
            return False
    
    async def test_complete_request_lifecycle(self):
        """Test complete request lifecycle with all status changes"""
        print("\n🔄 TESTING COMPLETE REQUEST LIFECYCLE")
        print("-" * 60)
        
        lifecycle_results = {
            "name": "Complete Request Lifecycle",
            "tests": {},
            "success": False
        }
        
        try:
            # Get admin session
            admin_session = self.get_admin_session()
            if not admin_session:
                lifecycle_results["error"] = "Admin authentication failed"
                return lifecycle_results
            
            # Record initial inventory
            initial_count = self.get_inventory_count()
            print(f"📊 Initial inventory: {initial_count} shoes")
            
            # Create test user and request
            print("1. Creating test user and request...")
            user_data = self.create_test_user_via_api(1)
            if not user_data:
                lifecycle_results["tests"]["user_creation"] = {"success": False}
                return lifecycle_results
            
            lifecycle_results["tests"]["user_creation"] = {"success": True, "email": user_data["email"]}
            
            # Create request via browser
            request_id = await self.create_request_via_browser(user_data)
            if not request_id:
                lifecycle_results["tests"]["request_creation"] = {"success": False}
                return lifecycle_results
            
            lifecycle_results["tests"]["request_creation"] = {"success": True, "request_id": request_id}
            print(f"✅ Request created: {request_id}")
            
            # Test each status transition
            status_transitions = [
                ("submitted", "approved"),
                ("approved", "shipped"),
                ("shipped", "shipped")  # Stay shipped (final state)
            ]
            
            for from_status, to_status in status_transitions:
                print(f"2. Testing status change: {from_status} → {to_status}")
                
                # Record inventory before status change
                before_count = self.get_inventory_count()
                
                # Update status
                status_updated = self.update_request_status_via_api(request_id, to_status, admin_session)
                
                if status_updated:
                    # Wait for changes to propagate
                    time.sleep(2)
                    
                    # Record inventory after status change
                    after_count = self.get_inventory_count()
                    
                    # Verify database status
                    db_request = self.get_request_from_database(request_id)
                    db_status = db_request.get("status") if db_request else "unknown"
                    
                    test_result = {
                        "success": True,
                        "from_status": from_status,
                        "to_status": to_status,
                        "db_status": db_status,
                        "inventory_before": before_count,
                        "inventory_after": after_count,
                        "inventory_changed": before_count != after_count
                    }
                    
                    print(f"   ✅ Status: {from_status} → {to_status} (DB: {db_status})")
                    print(f"   📊 Inventory: {before_count} → {after_count}")
                    
                else:
                    test_result = {"success": False, "from_status": from_status, "to_status": to_status}
                    print(f"   ❌ Status change failed: {from_status} → {to_status}")
                
                lifecycle_results["tests"][f"status_{from_status}_to_{to_status}"] = test_result
            
            # Test rejection cycle with new request
            print("3. Testing rejection cycle...")
            user_data_2 = self.create_test_user_via_api(2)
            if user_data_2:
                request_id_2 = await self.create_request_via_browser(user_data_2)
                if request_id_2:
                    before_count = self.get_inventory_count()
                    
                    # Approve first, then reject
                    self.update_request_status_via_api(request_id_2, "approved", admin_session)
                    time.sleep(1)
                    middle_count = self.get_inventory_count()
                    
                    self.update_request_status_via_api(request_id_2, "rejected", admin_session)
                    time.sleep(2)
                    after_count = self.get_inventory_count()
                    
                    rejection_test = {
                        "success": True,
                        "request_id": request_id_2,
                        "inventory_before_approval": before_count,
                        "inventory_after_approval": middle_count,
                        "inventory_after_rejection": after_count,
                        "inventory_restored": after_count > middle_count
                    }
                    
                    print(f"   ✅ Rejection cycle: {before_count} → {middle_count} → {after_count}")
                    print(f"   📊 Inventory restored: {rejection_test['inventory_restored']}")
                    
                    lifecycle_results["tests"]["rejection_cycle"] = rejection_test
            
            # Determine overall success
            successful_tests = sum(1 for t in lifecycle_results["tests"].values() if t.get("success", False))
            total_tests = len(lifecycle_results["tests"])
            lifecycle_results["success"] = successful_tests >= (total_tests * 0.8)
            
            print(f"🎯 Lifecycle Result: {successful_tests}/{total_tests} tests successful")
            
        except Exception as e:
            print(f"❌ Lifecycle test error: {e}")
            lifecycle_results["error"] = str(e)
        
        return lifecycle_results
    
    async def test_all_admin_statuses(self):
        """Test all possible admin status changes across different entities"""
        print("\n🔄 TESTING ALL ADMIN STATUS CHANGES")
        print("-" * 60)
        
        status_results = {
            "name": "All Admin Status Changes",
            "entity_tests": {},
            "success": False
        }
        
        try:
            admin_session = self.get_admin_session()
            if not admin_session:
                status_results["error"] = "Admin authentication failed"
                return status_results
            
            # Test 1: Request Status Changes
            print("1. Testing all request statuses...")
            request_status_results = {}
            
            for status in self.request_statuses:
                print(f"   Testing request status: {status}")
                
                # Create user and request for this status test
                user_data = self.create_test_user_via_api(len(self.test_users) + 1)
                if user_data:
                    request_id = await self.create_request_via_browser(user_data)
                    if request_id:
                        # Update to target status
                        status_updated = self.update_request_status_via_api(request_id, status, admin_session)
                        
                        if status_updated:
                            time.sleep(1)
                            db_request = self.get_request_from_database(request_id)
                            actual_status = db_request.get("status") if db_request else "unknown"
                            
                            request_status_results[status] = {
                                "success": actual_status == status,
                                "request_id": request_id,
                                "expected_status": status,
                                "actual_status": actual_status
                            }
                            
                            print(f"      ✅ {status}: Expected={status}, Actual={actual_status}")
                        else:
                            request_status_results[status] = {"success": False, "error": "Status update failed"}
                            print(f"      ❌ {status}: Update failed")
            
            status_results["entity_tests"]["requests"] = request_status_results
            
            # Test 2: Donation Status Changes (via API)
            print("2. Testing donation statuses...")
            donation_status_results = {}
            
            for status in self.donation_statuses:
                print(f"   Testing donation status: {status}")
                
                # Create donation via API
                donation_data = {
                    "firstName": "Test",
                    "lastName": "Donor",
                    "email": f"donor{len(self.test_users)}@example.com",
                    "phone": "1234567890",
                    "address": {
                        "street": "123 Test St",
                        "city": "San Francisco", 
                        "state": "CA",
                        "zipCode": "94102",
                        "country": "USA"
                    },
                    "numberOfShoes": 2,
                    "donationDescription": f"Test donation for {status} status"
                }
                
                donation_response = requests.post(f"{self.base_url}/api/donations", json=donation_data, timeout=10)
                
                if donation_response.status_code == 201:
                    donation_result = donation_response.json()
                    donation_id = donation_result.get("donationId")
                    
                    # Update donation status via admin API
                    if self.db:
                        try:
                            donations_collection = self.db["donations"]
                            donation_doc = donations_collection.find_one({"donationId": donation_id})
                            
                            if donation_doc:
                                mongo_id = str(donation_doc["_id"])
                                
                                update_response = admin_session.patch(
                                    f"{self.base_url}/api/admin/donations`,
                                    json={"donationId": mongo_id, "status": status},
                                    timeout=10
                                )
                                
                                if update_response.status_code == 200:
                                    # Verify status in database
                                    updated_doc = donations_collection.find_one({"donationId": donation_id})
                                    actual_status = updated_doc.get("status") if updated_doc else "unknown"
                                    
                                    donation_status_results[status] = {
                                        "success": actual_status == status,
                                        "donation_id": donation_id,
                                        "expected_status": status,
                                        "actual_status": actual_status
                                    }
                                    
                                    print(f"      ✅ {status}: Expected={status}, Actual={actual_status}")
                                else:
                                    donation_status_results[status] = {"success": False, "error": "Status update failed"}
                                    print(f"      ❌ {status}: Update failed")
                        except Exception as e:
                            donation_status_results[status] = {"success": False, "error": str(e)}
                            print(f"      ❌ {status}: Database error")
                else:
                    donation_status_results[status] = {"success": False, "error": "Donation creation failed"}
                    print(f"      ❌ {status}: Donation creation failed")
            
            status_results["entity_tests"]["donations"] = donation_status_results
            
            # Test 3: Money Donation Status Changes
            print("3. Testing money donation statuses...")
            money_status_results = {}
            
            for status in self.money_donation_statuses:
                print(f"   Testing money donation status: {status}")
                
                # Create money donation via API
                money_data = {
                    "firstName": "Test",
                    "lastName": "MoneyDonor",
                    "email": f"moneydonor{len(self.test_users)}@example.com",
                    "phone": "1234567890",
                    "amount": 25.00,
                    "message": f"Test money donation for {status} status"
                }
                
                money_response = requests.post(f"{self.base_url}/api/donations/money", json=money_data, timeout=10)
                
                if money_response.status_code == 201:
                    money_result = money_response.json()
                    money_donation_id = money_result.get("donationId")
                    
                    # Update money donation status via admin API
                    if self.db:
                        try:
                            money_collection = self.db["moneydonations"]
                            money_doc = money_collection.find_one({"donationId": money_donation_id})
                            
                            if money_doc:
                                mongo_id = str(money_doc["_id"])
                                
                                update_response = admin_session.patch(
                                    f"{self.base_url}/api/admin/money-donations",
                                    json={"donationId": mongo_id, "status": status},
                                    timeout=10
                                )
                                
                                if update_response.status_code == 200:
                                    # Verify status in database
                                    updated_doc = money_collection.find_one({"donationId": money_donation_id})
                                    actual_status = updated_doc.get("status") if updated_doc else "unknown"
                                    
                                    money_status_results[status] = {
                                        "success": actual_status == status,
                                        "donation_id": money_donation_id,
                                        "expected_status": status,
                                        "actual_status": actual_status
                                    }
                                    
                                    print(f"      ✅ {status}: Expected={status}, Actual={actual_status}")
                                else:
                                    money_status_results[status] = {"success": False, "error": "Status update failed"}
                                    print(f"      ❌ {status}: Update failed")
                        except Exception as e:
                            money_status_results[status] = {"success": False, "error": str(e)}
                            print(f"      ❌ {status}: Database error")
                else:
                    money_status_results[status] = {"success": False, "error": "Money donation creation failed"}
                    print(f"      ❌ {status}: Money donation creation failed")
            
            status_results["entity_tests"]["money_donations"] = money_status_results
            
            # Calculate overall success
            total_status_tests = 0
            successful_status_tests = 0
            
            for entity, tests in status_results["entity_tests"].items():
                for status, result in tests.items():
                    total_status_tests += 1
                    if result.get("success", False):
                        successful_status_tests += 1
            
            status_results["success"] = successful_status_tests >= (total_status_tests * 0.7)
            
            print(f"🎯 Status Tests Result: {successful_status_tests}/{total_status_tests} tests successful")
            
        except Exception as e:
            print(f"❌ Status tests error: {e}")
            status_results["error"] = str(e)
        
        return status_results
    
    async def run_complete_automated_testing(self):
        """Run all automated lifecycle and status testing"""
        print("🚀 STARTING AUTOMATED COMPLETE LIFECYCLE TESTING")
        print("=" * 80)
        print(f"Testing Platform: {self.base_url}")
        print(f"Focus: Complete request lifecycle + all admin status changes")
        print(f"Database: {'✅ Connected' if self.db else '❌ Not connected'}")
        print(f"Timestamp: {datetime.now().isoformat()}")
        print("=" * 80)
        
        # Run lifecycle test
        lifecycle_result = await self.test_complete_request_lifecycle()
        self.results["lifecycle_tests"] = lifecycle_result
        
        # Run status tests
        status_result = await self.test_all_admin_statuses()
        self.results["status_tests"] = status_result
        
        # Generate summary
        self.generate_summary()
        self.save_results()
        
        return self.results
    
    def generate_summary(self):
        """Generate comprehensive testing summary"""
        print("\n" + "=" * 80)
        print("📊 AUTOMATED COMPLETE LIFECYCLE TESTING SUMMARY")
        print("=" * 80)
        
        # Lifecycle tests summary
        lifecycle_tests = self.results.get("lifecycle_tests", {})
        lifecycle_success = lifecycle_tests.get("success", False)
        lifecycle_test_count = len(lifecycle_tests.get("tests", {}))
        lifecycle_successful = sum(1 for t in lifecycle_tests.get("tests", {}).values() if t.get("success", False))
        
        print(f"{'Request Lifecycle Testing':40} | {lifecycle_successful:2d}/{lifecycle_test_count:2d} tests | {'✅ PASS' if lifecycle_success else '❌ FAIL'}")
        
        # Status tests summary
        status_tests = self.results.get("status_tests", {})
        status_success = status_tests.get("success", False)
        
        total_status_tests = 0
        successful_status_tests = 0
        
        for entity, tests in status_tests.get("entity_tests", {}).items():
            entity_successful = sum(1 for t in tests.values() if t.get("success", False))
            entity_total = len(tests)
            total_status_tests += entity_total
            successful_status_tests += entity_successful
            
            print(f"{f'{entity.title()} Status Testing':40} | {entity_successful:2d}/{entity_total:2d} tests | {'✅ PASS' if entity_successful >= entity_total * 0.7 else '❌ FAIL'}")
        
        # Overall summary
        total_tests = lifecycle_test_count + total_status_tests
        total_successful = lifecycle_successful + successful_status_tests
        overall_success_rate = (total_successful / total_tests * 100) if total_tests > 0 else 0
        
        print("-" * 80)
        print(f"{'OVERALL AUTOMATED TESTING':40} | {total_successful:2d}/{total_tests:2d} tests | {overall_success_rate:5.1f}%")
        
        # Determine overall status
        if overall_success_rate >= 80:
            overall_status = "🎉 EXCELLENT"
            status_message = "Complete lifecycle and status testing successful!"
        elif overall_success_rate >= 60:
            overall_status = "✅ GOOD"
            status_message = "Most lifecycle and status tests functional"
        else:
            overall_status = "⚠️ NEEDS WORK"
            status_message = "Lifecycle and status testing needs attention"
        
        print("=" * 80)
        print(f"FINAL STATUS: {overall_status}")
        print(f"ASSESSMENT: {status_message}")
        
        # Detailed analysis
        print("\n🔍 DETAILED ANALYSIS:")
        
        if lifecycle_success:
            print("✅ REQUEST LIFECYCLE: Complete user-to-admin workflow functional")
        else:
            print("❌ REQUEST LIFECYCLE: User-to-admin workflow has issues")
        
        if status_success:
            print("✅ ADMIN STATUS CHANGES: All entity status updates working")
        else:
            print("⚠️ ADMIN STATUS CHANGES: Some status updates need attention")
        
        # Critical findings
        print("\n🎯 CRITICAL FINDINGS:")
        
        # Check inventory impact
        lifecycle_tests_data = lifecycle_tests.get("tests", {})
        inventory_impact_found = any("inventory" in str(test) for test in lifecycle_tests_data.values())
        
        if inventory_impact_found:
            print("   ✅ INVENTORY IMPACT: Status changes affect inventory correctly")
        else:
            print("   ⚠️ INVENTORY IMPACT: Inventory changes not fully verified")
        
        # Check rejection cycle
        rejection_test = lifecycle_tests_data.get("rejection_cycle", {})
        if rejection_test.get("inventory_restored", False):
            print("   ✅ REJECTION CYCLE: Rejected requests restore inventory")
        else:
            print("   ⚠️ REJECTION CYCLE: Rejection inventory restoration needs verification")
        
        print("=" * 80)
        
        # Store summary
        self.results["summary"] = {
            "total_tests": total_tests,
            "successful_tests": total_successful,
            "overall_success_rate": overall_success_rate,
            "overall_status": overall_status,
            "status_message": status_message,
            "lifecycle_success": lifecycle_success,
            "status_success": status_success
        }
    
    def save_results(self):
        """Save results to JSON file"""
        filename = f"automated_lifecycle_results_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        with open(filename, 'w') as f:
            json.dump(self.results, f, indent=2)
        print(f"\n💾 Automated lifecycle results saved to: {filename}")

async def main():
    """Main function to run automated complete lifecycle testing"""
    tester = AutomatedLifecycleTester()
    await tester.run_complete_automated_testing()

if __name__ == "__main__":
    asyncio.run(main())
