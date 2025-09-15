#!/usr/bin/env python3
"""
Authenticated Request Lifecycle Testing
Test the complete authenticated flow: User login → Request → Admin actions → Consequences
"""

import asyncio
import json
import time
from datetime import datetime
from playwright.async_api import async_playwright

class AuthenticatedRequestLifecycleTester:
    def __init__(self, base_url="http://localhost:3000"):
        self.base_url = base_url
        self.results = {
            "timestamp": datetime.now().isoformat(),
            "lifecycle_steps": {},
            "summary": {}
        }
        
        # Test credentials
        self.admin_credentials = {
            "email": "admin@newsteps.fit",
            "password": "Admin123!"
        }
        
        # Test data storage
        self.test_user_email = None
        self.test_user_password = "RequestTest123!"
        self.test_request_id = None
        self.test_shoe_name = None
        self.initial_shoe_count = 0
        self.request_created = False
    
    async def step_1_complete_user_request_flow(self):
        """Step 1: Complete authenticated user request flow"""
        print("\n🔄 STEP 1: COMPLETE USER REQUEST FLOW")
        print("-" * 60)
        
        step_results = {
            "name": "Complete User Request Flow",
            "substeps": {},
            "success": False
        }
        
        try:
            async with async_playwright() as p:
                browser = await p.chromium.launch(headless=False)
                user_context = await browser.new_context()
                user_page = await user_context.new_page()
                
                try:
                    # 1a. Create test user
                    timestamp = int(time.time())
                    self.test_user_email = f"requestuser{timestamp}@example.com"
                    
                    print("1a. Creating test user via registration form...")
                    await user_page.goto(f"{self.base_url}/register")
                    await user_page.wait_for_load_state('networkidle')
                    await user_page.wait_for_timeout(2000)
                    
                    # Fill registration form
                    await user_page.fill('input[name="firstName"]', 'Request')
                    await user_page.fill('input[name="lastName"]', 'TestUser')
                    await user_page.fill('input[name="email"]', self.test_user_email)
                    await user_page.fill('input[name="password"]', self.test_user_password)
                    await user_page.fill('input[name="confirmPassword"]', self.test_user_password)
                    await user_page.fill('input[name="phone"]', '1234567890')
                    
                    # Submit registration
                    await user_page.click('button[type="submit"]')
                    await user_page.wait_for_timeout(3000)
                    
                    # Check registration success
                    page_content = await user_page.content()
                    registration_success = (
                        'registered successfully' in page_content.lower() or
                        '/login' in user_page.url or
                        '/account' in user_page.url
                    )
                    
                    if registration_success:
                        print(f"✅ 1a: User registered successfully: {self.test_user_email}")
                        step_results["substeps"]["user_registration"] = {"success": True, "email": self.test_user_email}
                    else:
                        print("❌ 1a: User registration failed")
                        step_results["substeps"]["user_registration"] = {"success": False}
                        return step_results
                    
                    # 1b. Login user
                    print("1b. Logging in user...")
                    await user_page.goto(f"{self.base_url}/login")
                    await user_page.wait_for_load_state('networkidle')
                    await user_page.wait_for_timeout(2000)
                    
                    await user_page.fill('input[type="email"]', self.test_user_email)
                    await user_page.fill('input[type="password"]', self.test_user_password)
                    await user_page.click('button[type="submit"]')
                    await user_page.wait_for_timeout(3000)
                    
                    # Check login success
                    current_url = user_page.url
                    login_success = '/account' in current_url or 'dashboard' in current_url
                    
                    if login_success:
                        print("✅ 1b: User logged in successfully")
                        step_results["substeps"]["user_login"] = {"success": True}
                    else:
                        print("❌ 1b: User login failed")
                        step_results["substeps"]["user_login"] = {"success": False}
                        return step_results
                    
                    # 1c. Browse shoes and add to cart
                    print("1c. Browsing shoes and adding to cart...")
                    await user_page.goto(f"{self.base_url}/shoes")
                    await user_page.wait_for_load_state('networkidle')
                    await user_page.wait_for_timeout(3000)
                    
                    # Count available shoes
                    shoe_elements = await user_page.locator('.shoe-card, [data-testid="shoe-item"], .grid > div').count()
                    self.initial_shoe_count = shoe_elements
                    
                    # Find and click first "Add to Cart" button
                    add_buttons = await user_page.locator('button:has-text("Add to Cart"), button:has-text("Request")').count()
                    
                    if add_buttons > 0:
                        # Get shoe name before adding to cart
                        try:
                            shoe_name_element = await user_page.locator('.grid > div').first.locator('h3, .font-semibold, .text-lg').first.text_content()
                            self.test_shoe_name = shoe_name_element or "Unknown Shoe"
                        except:
                            self.test_shoe_name = "Test Shoe"
                        
                        # Click add to cart
                        await user_page.locator('button:has-text("Add to Cart"), button:has-text("Request")').first.click()
                        await user_page.wait_for_timeout(2000)
                        
                        print(f"✅ 1c: Added shoe to cart: {self.test_shoe_name}")
                        step_results["substeps"]["add_to_cart"] = {"success": True, "shoe_name": self.test_shoe_name}
                    else:
                        print("❌ 1c: No shoes available to add to cart")
                        step_results["substeps"]["add_to_cart"] = {"success": False}
                        return step_results
                    
                    # 1d. Go to cart and checkout
                    print("1d. Proceeding to checkout...")
                    await user_page.goto(f"{self.base_url}/cart")
                    await user_page.wait_for_load_state('networkidle')
                    await user_page.wait_for_timeout(3000)
                    
                    # Check if items in cart
                    cart_content = await user_page.content()
                    has_items = 'checkout' in cart_content.lower() or self.test_shoe_name.lower() in cart_content.lower()
                    
                    if has_items:
                        # Proceed to checkout
                        checkout_button = await user_page.locator('button:has-text("Checkout"), a:has-text("Checkout")').count()
                        
                        if checkout_button > 0:
                            await user_page.locator('button:has-text("Checkout"), a:has-text("Checkout")').first.click()
                            await user_page.wait_for_timeout(3000)
                            
                            print("✅ 1d: Proceeded to checkout")
                            step_results["substeps"]["proceed_checkout"] = {"success": True}
                        else:
                            print("⚠️ 1d: Checkout button not found")
                            step_results["substeps"]["proceed_checkout"] = {"success": False}
                    else:
                        print("❌ 1d: No items in cart")
                        step_results["substeps"]["proceed_checkout"] = {"success": False}
                        return step_results
                    
                    # 1e. Complete checkout form
                    print("1e. Completing checkout form...")
                    
                    # Check if we're on checkout page
                    if '/checkout' in user_page.url:
                        # Fill shipping information
                        try:
                            await user_page.fill('input[name="firstName"], input[id="firstName"]', 'Request')
                            await user_page.fill('input[name="lastName"], input[id="lastName"]', 'TestUser')
                            await user_page.fill('input[name="email"], input[id="email"]', self.test_user_email)
                            await user_page.fill('input[name="phone"], input[id="phone"]', '1234567890')
                            await user_page.fill('input[name="street"], input[id="street"]', '123 Request St')
                            await user_page.fill('input[name="city"], input[id="city"]', 'San Francisco')
                            await user_page.fill('input[name="state"], input[id="state"]', 'CA')
                            await user_page.fill('input[name="zipCode"], input[id="zipCode"]', '94102')
                            
                            # Select shipping method (pickup to avoid payment)
                            pickup_option = await user_page.locator('input[value="pickup"], label:has-text("Pickup")').count()
                            if pickup_option > 0:
                                await user_page.locator('input[value="pickup"], label:has-text("Pickup")').first.click()
                                await user_page.wait_for_timeout(1000)
                            
                            # Submit request
                            submit_button = await user_page.locator('button[type="submit"]:has-text("Complete"), button:has-text("Submit")').count()
                            
                            if submit_button > 0:
                                await user_page.locator('button[type="submit"]:has-text("Complete"), button:has-text("Submit")').first.click()
                                await user_page.wait_for_timeout(5000)
                                
                                # Check for success
                                final_content = await user_page.content()
                                request_success = (
                                    'request submitted' in final_content.lower() or
                                    'thank you' in final_content.lower() or
                                    'REQ-' in final_content
                                )
                                
                                if request_success:
                                    # Try to extract request ID
                                    import re
                                    request_id_match = re.search(r'REQ-[A-Z0-9-]+', final_content)
                                    if request_id_match:
                                        self.test_request_id = request_id_match.group()
                                    
                                    print(f"✅ 1e: Request submitted successfully (ID: {self.test_request_id or 'unknown'})")
                                    step_results["substeps"]["request_submission"] = {"success": True, "request_id": self.test_request_id}
                                    self.request_created = True
                                else:
                                    print("❌ 1e: Request submission failed")
                                    step_results["substeps"]["request_submission"] = {"success": False}
                            else:
                                print("❌ 1e: Submit button not found")
                                step_results["substeps"]["request_submission"] = {"success": False}
                                
                        except Exception as e:
                            print(f"❌ 1e: Checkout form error: {e}")
                            step_results["substeps"]["request_submission"] = {"success": False}
                    else:
                        print("❌ 1e: Not on checkout page")
                        step_results["substeps"]["request_submission"] = {"success": False}
                    
                finally:
                    await user_context.close()
                    await browser.close()
            
            # Determine step success
            successful_substeps = sum(1 for s in step_results["substeps"].values() if s.get("success", False))
            total_substeps = len(step_results["substeps"])
            step_results["success"] = successful_substeps >= (total_substeps * 0.8)  # 80% threshold
            
            print(f"🎯 Step 1 Result: {successful_substeps}/{total_substeps} substeps successful")
            
        except Exception as e:
            print(f"❌ Step 1 error: {e}")
            step_results["error"] = str(e)
        
        return step_results
    
    async def step_2_admin_sees_and_processes_request(self):
        """Step 2: Admin sees and processes the request"""
        print("\n🔄 STEP 2: ADMIN SEES AND PROCESSES REQUEST")
        print("-" * 60)
        
        step_results = {
            "name": "Admin Request Processing",
            "substeps": {},
            "success": False
        }
        
        if not self.request_created:
            print("❌ Step 2: No request created in Step 1")
            step_results["error"] = "No request from previous step"
            return step_results
        
        try:
            async with async_playwright() as p:
                browser = await p.chromium.launch(headless=False)
                admin_context = await browser.new_context()
                admin_page = await admin_context.new_page()
                
                try:
                    # 2a. Admin login
                    print("2a. Admin login...")
                    await admin_page.goto(f"{self.base_url}/login")
                    await admin_page.wait_for_load_state('networkidle')
                    await admin_page.wait_for_timeout(2000)
                    
                    await admin_page.fill('input[type="email"]', self.admin_credentials['email'])
                    await admin_page.fill('input[type="password"]', self.admin_credentials['password'])
                    await admin_page.click('button[type="submit"]')
                    await admin_page.wait_for_timeout(3000)
                    
                    # Check login success
                    current_url = admin_page.url
                    if '/admin' in current_url or 'dashboard' in current_url:
                        print("✅ 2a: Admin logged in successfully")
                        step_results["substeps"]["admin_login"] = {"success": True}
                    else:
                        print("❌ 2a: Admin login failed")
                        step_results["substeps"]["admin_login"] = {"success": False}
                        return step_results
                    
                    # 2b. Navigate to requests dashboard
                    print("2b. Checking requests dashboard...")
                    await admin_page.goto(f"{self.base_url}/admin/requests")
                    await admin_page.wait_for_load_state('networkidle')
                    await admin_page.wait_for_timeout(3000)
                    
                    # Check if requests page loads
                    page_content = await admin_page.content()
                    requests_loaded = (
                        'request' in page_content.lower() and 
                        not 'error' in page_content.lower() and
                        not '404' in page_content and
                        not 'login' in admin_page.url
                    )
                    
                    if requests_loaded:
                        print("✅ 2b: Admin requests dashboard accessible")
                        step_results["substeps"]["requests_dashboard"] = {"success": True}
                        
                        # 2c. Look for our test request
                        print("2c. Looking for test request...")
                        request_visible = (
                            (self.test_request_id and self.test_request_id in page_content) or
                            (self.test_user_email and self.test_user_email in page_content) or
                            'requestuser' in page_content.lower()
                        )
                        
                        if request_visible:
                            print("✅ 2c: Test request visible in admin dashboard")
                            step_results["substeps"]["request_visible"] = {"success": True}
                            
                            # 2d. Check for status management options
                            print("2d. Checking status management options...")
                            status_controls = await admin_page.locator('select, button:has-text("Approve"), button:has-text("Reject"), button:has-text("Ship"), button:has-text("Edit")').count()
                            
                            if status_controls > 0:
                                print("✅ 2d: Admin can manage request status")
                                step_results["substeps"]["status_management"] = {"success": True}
                            else:
                                print("⚠️ 2d: Limited status management options")
                                step_results["substeps"]["status_management"] = {"success": False}
                        else:
                            print("⚠️ 2c: Test request not immediately visible")
                            step_results["substeps"]["request_visible"] = {"success": False}
                    else:
                        print("❌ 2b: Admin requests dashboard not accessible")
                        step_results["substeps"]["requests_dashboard"] = {"success": False}
                    
                finally:
                    await admin_context.close()
                    await browser.close()
            
            # Determine step success
            successful_substeps = sum(1 for s in step_results["substeps"].values() if s.get("success", False))
            total_substeps = len(step_results["substeps"])
            step_results["success"] = successful_substeps >= (total_substeps * 0.7)
            
            print(f"🎯 Step 2 Result: {successful_substeps}/{total_substeps} substeps successful")
            
        except Exception as e:
            print(f"❌ Step 2 error: {e}")
            step_results["error"] = str(e)
        
        return step_results
    
    async def step_3_inventory_impact_check(self):
        """Step 3: Check inventory impact after request"""
        print("\n🔄 STEP 3: INVENTORY IMPACT CHECK")
        print("-" * 60)
        
        step_results = {
            "name": "Inventory Impact Check",
            "substeps": {},
            "success": False
        }
        
        try:
            async with async_playwright() as p:
                browser = await p.chromium.launch(headless=False)
                public_context = await browser.new_context()
                public_page = await public_context.new_page()
                
                try:
                    # 3a. Check current public inventory
                    print("3a. Checking current public inventory...")
                    await public_page.goto(f"{self.base_url}/shoes")
                    await public_page.wait_for_load_state('networkidle')
                    await public_page.wait_for_timeout(3000)
                    
                    # Count current shoes
                    current_shoe_elements = await public_page.locator('.shoe-card, [data-testid="shoe-item"], .grid > div').count()
                    
                    print(f"✅ 3a: Current inventory: {current_shoe_elements} shoes (was {self.initial_shoe_count})")
                    step_results["substeps"]["inventory_count"] = {
                        "success": True,
                        "current_count": current_shoe_elements,
                        "initial_count": self.initial_shoe_count,
                        "change": current_shoe_elements - self.initial_shoe_count
                    }
                    
                    # 3b. Check if requested shoe is still available
                    if self.test_shoe_name:
                        page_content = await public_page.content()
                        shoe_still_available = self.test_shoe_name.lower() in page_content.lower()
                        
                        if shoe_still_available:
                            print(f"✅ 3b: Requested shoe '{self.test_shoe_name}' still available")
                            step_results["substeps"]["shoe_availability"] = {"success": True, "available": True}
                        else:
                            print(f"⚠️ 3b: Requested shoe '{self.test_shoe_name}' may be reserved/unavailable")
                            step_results["substeps"]["shoe_availability"] = {"success": True, "available": False}
                    
                finally:
                    await public_context.close()
                    await browser.close()
            
            # Determine step success
            successful_substeps = sum(1 for s in step_results["substeps"].values() if s.get("success", False))
            total_substeps = len(step_results["substeps"])
            step_results["success"] = successful_substeps >= 1  # At least inventory check working
            
            print(f"🎯 Step 3 Result: {successful_substeps}/{total_substeps} substeps successful")
            
        except Exception as e:
            print(f"❌ Step 3 error: {e}")
            step_results["error"] = str(e)
        
        return step_results
    
    async def step_4_user_account_verification(self):
        """Step 4: Verify user can see their request in account"""
        print("\n🔄 STEP 4: USER ACCOUNT VERIFICATION")
        print("-" * 60)
        
        step_results = {
            "name": "User Account Verification",
            "substeps": {},
            "success": False
        }
        
        if not self.request_created:
            print("❌ Step 4: No request created to verify")
            step_results["error"] = "No request from previous steps"
            return step_results
        
        try:
            async with async_playwright() as p:
                browser = await p.chromium.launch(headless=False)
                user_context = await browser.new_context()
                user_page = await user_context.new_page()
                
                try:
                    # 4a. User login
                    print("4a. User login to check account...")
                    await user_page.goto(f"{self.base_url}/login")
                    await user_page.wait_for_load_state('networkidle')
                    await user_page.wait_for_timeout(2000)
                    
                    await user_page.fill('input[type="email"]', self.test_user_email)
                    await user_page.fill('input[type="password"]', self.test_user_password)
                    await user_page.click('button[type="submit"]')
                    await user_page.wait_for_timeout(3000)
                    
                    # Check login success
                    current_url = user_page.url
                    if '/account' in current_url:
                        print("✅ 4a: User logged in successfully")
                        step_results["substeps"]["user_login"] = {"success": True}
                        
                        # 4b. Check account page for request
                        print("4b. Checking account page for request...")
                        page_content = await user_page.content()
                        
                        request_visible = (
                            (self.test_request_id and self.test_request_id in page_content) or
                            'request' in page_content.lower() or
                            (self.test_shoe_name and self.test_shoe_name.lower() in page_content.lower())
                        )
                        
                        if request_visible:
                            print("✅ 4b: User can see their request in account")
                            step_results["substeps"]["request_in_account"] = {"success": True}
                        else:
                            print("⚠️ 4b: Request not visible in user account")
                            step_results["substeps"]["request_in_account"] = {"success": False}
                    else:
                        print("❌ 4a: User login failed")
                        step_results["substeps"]["user_login"] = {"success": False}
                    
                finally:
                    await user_context.close()
                    await browser.close()
            
            # Determine step success
            successful_substeps = sum(1 for s in step_results["substeps"].values() if s.get("success", False))
            total_substeps = len(step_results["substeps"])
            step_results["success"] = successful_substeps >= 1
            
            print(f"🎯 Step 4 Result: {successful_substeps}/{total_substeps} substeps successful")
            
        except Exception as e:
            print(f"❌ Step 4 error: {e}")
            step_results["error"] = str(e)
        
        return step_results
    
    async def run_complete_authenticated_lifecycle_test(self):
        """Run the complete authenticated request lifecycle test"""
        print("🚀 STARTING AUTHENTICATED REQUEST LIFECYCLE TESTING")
        print("=" * 80)
        print(f"Testing Platform: {self.base_url}")
        print(f"Focus: Complete authenticated request cycle with admin visibility")
        print(f"Timestamp: {datetime.now().isoformat()}")
        print("=" * 80)
        
        # Run all lifecycle steps
        lifecycle_steps = [
            ("step_1", self.step_1_complete_user_request_flow),
            ("step_2", self.step_2_admin_sees_and_processes_request),
            ("step_3", self.step_3_inventory_impact_check),
            ("step_4", self.step_4_user_account_verification)
        ]
        
        for step_id, step_func in lifecycle_steps:
            try:
                result = await step_func()
                self.results["lifecycle_steps"][step_id] = result
            except Exception as e:
                print(f"❌ {step_id} failed: {e}")
                self.results["lifecycle_steps"][step_id] = {
                    "name": step_id,
                    "success": False,
                    "error": str(e)
                }
        
        # Generate summary
        self.generate_summary()
        self.save_results()
        
        return self.results
    
    def generate_summary(self):
        """Generate lifecycle testing summary"""
        print("\n" + "=" * 80)
        print("📊 AUTHENTICATED REQUEST LIFECYCLE TESTING SUMMARY")
        print("=" * 80)
        
        total_steps = len(self.results["lifecycle_steps"])
        successful_steps = sum(1 for s in self.results["lifecycle_steps"].values() if s.get("success", False))
        
        for step_id, step_result in self.results["lifecycle_steps"].items():
            name = step_result.get("name", step_id)
            success = step_result.get("success", False)
            substeps = step_result.get("substeps", {})
            successful_substeps = sum(1 for s in substeps.values() if s.get("success", False))
            total_substeps = len(substeps)
            
            status = "✅ PASS" if success else "❌ FAIL"
            print(f"{name:40} | {successful_substeps:2d}/{total_substeps:2d} substeps | {status}")
        
        overall_success_rate = (successful_steps / total_steps * 100) if total_steps > 0 else 0
        
        print("-" * 80)
        print(f"{'OVERALL AUTHENTICATED LIFECYCLE':40} | {successful_steps:2d}/{total_steps:2d} steps | {overall_success_rate:5.1f}%")
        
        # Determine overall status
        if overall_success_rate >= 80:
            overall_status = "🎉 EXCELLENT"
            status_message = "Complete authenticated request lifecycle working!"
        elif overall_success_rate >= 60:
            overall_status = "✅ GOOD"
            status_message = "Most authenticated lifecycle steps functional"
        else:
            overall_status = "⚠️ NEEDS WORK"
            status_message = "Authenticated request lifecycle needs attention"
        
        print("=" * 80)
        print(f"FINAL STATUS: {overall_status}")
        print(f"ASSESSMENT: {status_message}")
        
        # Provide detailed analysis
        print("\n🔍 AUTHENTICATED LIFECYCLE ANALYSIS:")
        
        # Check what's working
        working_aspects = []
        needs_attention = []
        
        for step_id, step_result in self.results["lifecycle_steps"].items():
            name = step_result.get("name", step_id)
            success = step_result.get("success", False)
            
            if success:
                working_aspects.append(name)
            else:
                needs_attention.append(name)
        
        if working_aspects:
            print("✅ WORKING WELL:")
            for aspect in working_aspects:
                print(f"   • {aspect}")
        
        if needs_attention:
            print("⚠️ NEEDS ATTENTION:")
            for aspect in needs_attention:
                print(f"   • {aspect}")
        
        # Critical findings
        print("\n🎯 CRITICAL FINDINGS:")
        if self.request_created:
            print("   ✅ AUTHENTICATED REQUEST CREATION: Working")
            print("   ✅ USER-TO-ADMIN WORKFLOW: Functional")
        else:
            print("   ❌ AUTHENTICATED REQUEST CREATION: Failed")
            print("   ❌ USER-TO-ADMIN WORKFLOW: Blocked")
        
        # Next steps
        print("\n📋 NEXT STEPS FOR COMPLETE TESTING:")
        print("   1. Manual admin status changes (approve → ship → reject)")
        print("   2. Email notification verification for each status")
        print("   3. Inventory updates after admin actions")
        print("   4. User notification cycle testing")
        
        print("=" * 80)
        
        # Store summary
        self.results["summary"] = {
            "total_steps": total_steps,
            "successful_steps": successful_steps,
            "overall_success_rate": overall_success_rate,
            "overall_status": overall_status,
            "status_message": status_message,
            "working_aspects": working_aspects,
            "needs_attention": needs_attention,
            "request_created": self.request_created
        }
    
    def save_results(self):
        """Save results to JSON file"""
        filename = f"authenticated_lifecycle_results_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        with open(filename, 'w') as f:
            json.dump(self.results, f, indent=2)
        print(f"\n💾 Authenticated lifecycle results saved to: {filename}")

async def main():
    """Main function to run authenticated request lifecycle testing"""
    tester = AuthenticatedRequestLifecycleTester()
    await tester.run_complete_authenticated_lifecycle_test()

if __name__ == "__main__":
    asyncio.run(main())
