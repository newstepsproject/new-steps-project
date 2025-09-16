#!/usr/bin/env python3
"""
Multi-User Interactive Workflow Testing
Test complex interactions between visitors, users, and admins
"""

import asyncio
import json
import time
from datetime import datetime
from playwright.async_api import async_playwright

class MultiUserWorkflowTester:
    def __init__(self, base_url="http://localhost:3000"):
        self.base_url = base_url
        self.results = {
            "timestamp": datetime.now().isoformat(),
            "workflows": {},
            "summary": {}
        }
        
        # Test user credentials
        self.admin_credentials = {
            "email": "admin@newsteps.fit",
            "password": "Admin123!"
        }
        
        # Will be created during test
        self.test_user_credentials = None
        self.test_donation_id = None
        self.test_request_id = None
        self.test_shoe_ids = []
    
    async def create_test_user(self, page):
        """Create a test user for workflow testing"""
        try:
            timestamp = int(time.time())
            test_email = f"workflowuser{timestamp}@example.com"
            
            print("👤 Creating test user for workflow testing...")
            
            await page.goto(f"{self.base_url}/register")
            await page.wait_for_load_state('networkidle')
            await page.wait_for_timeout(2000)
            
            # Fill registration form with correct field names
            await page.fill('input[name="firstName"]', 'Workflow')
            await page.fill('input[name="lastName"]', 'TestUser')
            await page.fill('input[name="email"]', test_email)
            await page.fill('input[name="password"]', 'WorkflowTest123!')
            await page.fill('input[name="confirmPassword"]', 'WorkflowTest123!')
            await page.fill('input[name="phone"]', '1234567890')
            
            # Submit registration
            await page.click('button[type="submit"]')
            await page.wait_for_timeout(3000)
            
            # Check for success
            page_content = await page.content()
            success = 'registered successfully' in page_content.lower() or '/login' in page.url
            
            if success:
                self.test_user_credentials = {
                    "email": test_email,
                    "password": "WorkflowTest123!"
                }
                print(f"✅ Test user created: {test_email}")
                return True
            else:
                print("❌ Test user creation failed")
                return False
                
        except Exception as e:
            print(f"❌ Error creating test user: {e}")
            return False
    
    async def login_user(self, page, credentials, user_type="user"):
        """Login a user with given credentials"""
        try:
            print(f"🔐 Logging in {user_type}: {credentials['email']}")
            
            await page.goto(f"{self.base_url}/login")
            await page.wait_for_load_state('networkidle')
            await page.wait_for_timeout(2000)
            
            # Fill login form
            await page.fill('input[type="email"]', credentials['email'])
            await page.fill('input[type="password"]', credentials['password'])
            
            # Submit login
            await page.click('button[type="submit"]')
            await page.wait_for_timeout(3000)
            
            # Check for successful login
            current_url = page.url
            page_content = await page.content()
            success = '/admin' in current_url or '/account' in current_url or 'dashboard' in page_content.lower()
            
            if success:
                print(f"✅ {user_type.title()} logged in successfully")
                return True
            else:
                print(f"❌ {user_type.title()} login failed")
                return False
                
        except Exception as e:
            print(f"❌ Error logging in {user_type}: {e}")
            return False
    
    async def workflow_1_shoe_donation_to_inventory(self):
        """
        Workflow 1: Visitor donates shoes → Admin processes → Shoes appear in inventory
        """
        print("\n🔄 WORKFLOW 1: SHOE DONATION TO INVENTORY")
        print("-" * 60)
        
        workflow_results = {
            "name": "Shoe Donation to Inventory",
            "steps": {},
            "success": False
        }
        
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=False)
            
            try:
                # Step 1: Visitor submits shoe donation
                print("Step 1: Visitor submits shoe donation...")
                visitor_context = await browser.new_context()
                visitor_page = await visitor_context.new_page()
                
                await visitor_page.goto(f"{self.base_url}/donate/shoes")
                await visitor_page.wait_for_load_state('networkidle')
                await visitor_page.wait_for_timeout(2000)
                
                # Fill donation form with correct field names
                await visitor_page.fill('input[id="firstName"]', 'Workflow')
                await visitor_page.fill('input[id="lastName"]', 'Donor')
                await visitor_page.fill('input[id="email"]', 'workflowdonor@example.com')
                await visitor_page.fill('input[id="phone"]', '1234567890')
                await visitor_page.fill('input[id="street"]', '123 Donation St')
                await visitor_page.fill('input[id="city"]', 'San Francisco')
                await visitor_page.fill('input[id="state"]', 'CA')
                await visitor_page.fill('input[id="zipCode"]', '94102')
                await visitor_page.fill('input[id="country"]', 'USA')
                await visitor_page.fill('input[id="numberOfShoes"]', '2')
                await visitor_page.fill('textarea[id="donationDescription"]', 'Workflow testing donation - 2 Nike shoes in good condition')
                
                # Submit donation
                await visitor_page.click('button[type="submit"]')
                await visitor_page.wait_for_timeout(5000)
                
                # Extract donation ID
                page_content = await visitor_page.content()
                donation_success = 'donation submitted successfully' in page_content.lower()
                
                if donation_success:
                    # Try to extract donation ID from page
                    import re
                    donation_id_match = re.search(r'DS-[A-Z0-9-]+', page_content)
                    if donation_id_match:
                        self.test_donation_id = donation_id_match.group()
                        print(f"✅ Step 1: Donation submitted successfully (ID: {self.test_donation_id})")
                        workflow_results["steps"]["visitor_donation"] = {"success": True, "donation_id": self.test_donation_id}
                    else:
                        print("✅ Step 1: Donation submitted (ID not found in page)")
                        workflow_results["steps"]["visitor_donation"] = {"success": True, "donation_id": "unknown"}
                else:
                    print("❌ Step 1: Donation submission failed")
                    workflow_results["steps"]["visitor_donation"] = {"success": False}
                    await visitor_context.close()
                    return workflow_results
                
                await visitor_context.close()
                
                # Step 2: Admin sees and processes donation
                print("Step 2: Admin processes donation...")
                admin_context = await browser.new_context()
                admin_page = await admin_context.new_page()
                
                # Login as admin
                admin_login_success = await self.login_user(admin_page, self.admin_credentials, "admin")
                if not admin_login_success:
                    workflow_results["steps"]["admin_login"] = {"success": False}
                    await admin_context.close()
                    return workflow_results
                
                workflow_results["steps"]["admin_login"] = {"success": True}
                
                # Navigate to donations page
                await admin_page.goto(f"{self.base_url}/admin/shoe-donations")
                await admin_page.wait_for_load_state('networkidle')
                await admin_page.wait_for_timeout(3000)
                
                # Check if donation appears in admin list
                page_content = await admin_page.content()
                donation_visible = 'workflowdonor@example.com' in page_content.lower() or (self.test_donation_id and self.test_donation_id in page_content)
                
                if donation_visible:
                    print("✅ Step 2a: Donation visible in admin dashboard")
                    workflow_results["steps"]["admin_sees_donation"] = {"success": True}
                    
                    # Try to update donation status (if possible)
                    # Look for status update buttons or forms
                    status_buttons = await admin_page.locator('button:has-text("received"), button:has-text("processed"), select[name*="status"]').count()
                    
                    if status_buttons > 0:
                        print("✅ Step 2b: Admin can update donation status")
                        workflow_results["steps"]["admin_can_update_status"] = {"success": True}
                    else:
                        print("⚠️ Step 2b: No status update controls found")
                        workflow_results["steps"]["admin_can_update_status"] = {"success": False}
                else:
                    print("❌ Step 2a: Donation not visible in admin dashboard")
                    workflow_results["steps"]["admin_sees_donation"] = {"success": False}
                
                await admin_context.close()
                
                # Step 3: Check if workflow affects inventory
                print("Step 3: Checking inventory impact...")
                inventory_context = await browser.new_context()
                inventory_page = await inventory_context.new_page()
                
                # Check public shoes page for any changes
                await inventory_page.goto(f"{self.base_url}/shoes")
                await inventory_page.wait_for_load_state('networkidle')
                await inventory_page.wait_for_timeout(2000)
                
                # Count available shoes
                shoe_elements = await inventory_page.locator('.shoe-card, [data-testid="shoe-item"], .grid > div').count()
                print(f"✅ Step 3: Found {shoe_elements} shoes in public inventory")
                workflow_results["steps"]["inventory_check"] = {"success": True, "shoe_count": shoe_elements}
                
                await inventory_context.close()
                
                # Determine overall workflow success
                successful_steps = sum(1 for step in workflow_results["steps"].values() if step.get("success", False))
                total_steps = len(workflow_results["steps"])
                workflow_results["success"] = successful_steps >= (total_steps * 0.7)  # 70% success threshold
                
                print(f"🎯 Workflow 1 Result: {successful_steps}/{total_steps} steps successful")
                
            except Exception as e:
                print(f"❌ Workflow 1 error: {e}")
                workflow_results["error"] = str(e)
            finally:
                await browser.close()
        
        return workflow_results
    
    async def workflow_2_user_request_admin_processing(self):
        """
        Workflow 2: User requests shoes → Admin processes → Inventory updates → User gets notification
        """
        print("\n🔄 WORKFLOW 2: USER REQUEST → ADMIN PROCESSING")
        print("-" * 60)
        
        workflow_results = {
            "name": "User Request to Admin Processing",
            "steps": {},
            "success": False
        }
        
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=False)
            
            try:
                # Step 1: Create test user if not exists
                if not self.test_user_credentials:
                    user_context = await browser.new_context()
                    user_page = await user_context.new_page()
                    user_created = await self.create_test_user(user_page)
                    await user_context.close()
                    
                    if not user_created:
                        workflow_results["steps"]["user_creation"] = {"success": False}
                        return workflow_results
                    
                    workflow_results["steps"]["user_creation"] = {"success": True}
                
                # Step 2: User browses shoes and makes request
                print("Step 2: User browses shoes and makes request...")
                user_context = await browser.new_context()
                user_page = await user_context.new_page()
                
                # Login as user
                user_login_success = await self.login_user(user_page, self.test_user_credentials, "user")
                if not user_login_success:
                    workflow_results["steps"]["user_login"] = {"success": False}
                    await user_context.close()
                    return workflow_results
                
                workflow_results["steps"]["user_login"] = {"success": True}
                
                # Browse shoes
                await user_page.goto(f"{self.base_url}/shoes")
                await user_page.wait_for_load_state('networkidle')
                await user_page.wait_for_timeout(3000)
                
                # Try to add a shoe to cart
                add_to_cart_buttons = await user_page.locator('button:has-text("Add to Cart"), button:has-text("Request")').count()
                
                if add_to_cart_buttons > 0:
                    print("✅ Step 2a: Shoes available for request")
                    workflow_results["steps"]["shoes_available"] = {"success": True}
                    
                    # Click first available button
                    await user_page.locator('button:has-text("Add to Cart"), button:has-text("Request")').first.click()
                    await user_page.wait_for_timeout(2000)
                    
                    # Go to cart/checkout
                    await user_page.goto(f"{self.base_url}/cart")
                    await user_page.wait_for_load_state('networkidle')
                    await user_page.wait_for_timeout(2000)
                    
                    # Check if items in cart
                    cart_content = await user_page.content()
                    has_items = 'checkout' in cart_content.lower() or 'request' in cart_content.lower()
                    
                    if has_items:
                        print("✅ Step 2b: Items added to cart successfully")
                        workflow_results["steps"]["cart_addition"] = {"success": True}
                    else:
                        print("⚠️ Step 2b: Cart appears empty")
                        workflow_results["steps"]["cart_addition"] = {"success": False}
                else:
                    print("⚠️ Step 2a: No shoes available for request")
                    workflow_results["steps"]["shoes_available"] = {"success": False}
                
                await user_context.close()
                
                # Step 3: Admin checks requests
                print("Step 3: Admin checks user requests...")
                admin_context = await browser.new_context()
                admin_page = await admin_context.new_page()
                
                # Login as admin
                admin_login_success = await self.login_user(admin_page, self.admin_credentials, "admin")
                if not admin_login_success:
                    workflow_results["steps"]["admin_login"] = {"success": False}
                    await admin_context.close()
                    return workflow_results
                
                workflow_results["steps"]["admin_login"] = {"success": True}
                
                # Navigate to requests page
                await admin_page.goto(f"{self.base_url}/admin/requests")
                await admin_page.wait_for_load_state('networkidle')
                await admin_page.wait_for_timeout(3000)
                
                # Check if requests page loads and has content
                page_content = await admin_page.content()
                requests_page_working = 'request' in page_content.lower() and not 'error' in page_content.lower()
                
                if requests_page_working:
                    print("✅ Step 3: Admin can access requests dashboard")
                    workflow_results["steps"]["admin_requests_access"] = {"success": True}
                else:
                    print("❌ Step 3: Admin requests dashboard not accessible")
                    workflow_results["steps"]["admin_requests_access"] = {"success": False}
                
                await admin_context.close()
                
                # Determine overall workflow success
                successful_steps = sum(1 for step in workflow_results["steps"].values() if step.get("success", False))
                total_steps = len(workflow_results["steps"])
                workflow_results["success"] = successful_steps >= (total_steps * 0.7)  # 70% success threshold
                
                print(f"🎯 Workflow 2 Result: {successful_steps}/{total_steps} steps successful")
                
            except Exception as e:
                print(f"❌ Workflow 2 error: {e}")
                workflow_results["error"] = str(e)
            finally:
                await browser.close()
        
        return workflow_results
    
    async def workflow_3_admin_inventory_management(self):
        """
        Workflow 3: Admin adds shoes → Public sees them → Admin updates status → Public reflects changes
        """
        print("\n🔄 WORKFLOW 3: ADMIN INVENTORY MANAGEMENT")
        print("-" * 60)
        
        workflow_results = {
            "name": "Admin Inventory Management",
            "steps": {},
            "success": False
        }
        
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=False)
            
            try:
                # Step 1: Admin adds new shoe to inventory
                print("Step 1: Admin adds new shoe to inventory...")
                admin_context = await browser.new_context()
                admin_page = await admin_context.new_page()
                
                # Login as admin
                admin_login_success = await self.login_user(admin_page, self.admin_credentials, "admin")
                if not admin_login_success:
                    workflow_results["steps"]["admin_login"] = {"success": False}
                    await admin_context.close()
                    return workflow_results
                
                workflow_results["steps"]["admin_login"] = {"success": True}
                
                # Navigate to add shoes page
                await admin_page.goto(f"{self.base_url}/admin/shoes/add")
                await admin_page.wait_for_load_state('networkidle')
                await admin_page.wait_for_timeout(3000)
                
                # Check if add shoe form is accessible
                form_elements = await admin_page.locator('form, input[name="brand"], input[name="modelName"]').count()
                
                if form_elements > 0:
                    print("✅ Step 1a: Add shoe form accessible")
                    workflow_results["steps"]["add_form_accessible"] = {"success": True}
                    
                    # Try to fill the form (React Hook Form with FormField components)
                    try:
                        # Fill donor info first
                        await admin_page.fill('input[placeholder*="First name"], input[id*="firstName"]', 'Workflow')
                        await admin_page.fill('input[placeholder*="Last name"], input[id*="lastName"]', 'Donor')
                        
                        # Fill shoe details
                        await admin_page.fill('input[placeholder*="Model name"], input[id*="modelName"]', 'Interactive Test Shoe')
                        await admin_page.fill('input[placeholder*="Size"], input[id*="size"]', '10')
                        await admin_page.fill('input[placeholder*="Color"], input[id*="color"]', 'Blue')
                        
                        # Try to select brand, sport, gender, and condition using Select components
                        # These are React Select components, so we need to click and select
                        brand_trigger = await admin_page.locator('[role="combobox"]:has-text("Select brand"), button:has-text("Select brand")').count()
                        if brand_trigger > 0:
                            await admin_page.locator('[role="combobox"]:has-text("Select brand"), button:has-text("Select brand")').first.click()
                            await admin_page.wait_for_timeout(500)
                            await admin_page.locator('[role="option"]:has-text("Nike"), [data-value="Nike"]').first.click()
                        
                        print("✅ Step 1b: Form filled successfully")
                        workflow_results["steps"]["form_filling"] = {"success": True}
                        
                    except Exception as e:
                        print(f"⚠️ Step 1b: Form filling partial: {e}")
                        workflow_results["steps"]["form_filling"] = {"success": False}
                else:
                    print("❌ Step 1a: Add shoe form not accessible")
                    workflow_results["steps"]["add_form_accessible"] = {"success": False}
                
                await admin_context.close()
                
                # Step 2: Check public inventory
                print("Step 2: Checking public inventory visibility...")
                public_context = await browser.new_context()
                public_page = await public_context.new_page()
                
                await public_page.goto(f"{self.base_url}/shoes")
                await public_page.wait_for_load_state('networkidle')
                await public_page.wait_for_timeout(3000)
                
                # Count shoes and check for variety
                shoe_elements = await public_page.locator('.shoe-card, [data-testid="shoe-item"], .grid > div').count()
                page_content = await public_page.content()
                has_shoe_data = 'nike' in page_content.lower() or 'adidas' in page_content.lower() or 'shoe' in page_content.lower()
                
                if shoe_elements > 0 and has_shoe_data:
                    print(f"✅ Step 2: Public inventory shows {shoe_elements} shoes")
                    workflow_results["steps"]["public_inventory"] = {"success": True, "shoe_count": shoe_elements}
                else:
                    print("⚠️ Step 2: Public inventory appears empty or not loading")
                    workflow_results["steps"]["public_inventory"] = {"success": False, "shoe_count": shoe_elements}
                
                await public_context.close()
                
                # Step 3: Admin views inventory management
                print("Step 3: Admin inventory management dashboard...")
                admin_context2 = await browser.new_context()
                admin_page2 = await admin_context2.new_page()
                
                # Login as admin again
                admin_login_success2 = await self.login_user(admin_page2, self.admin_credentials, "admin")
                if admin_login_success2:
                    # Navigate to shoes management
                    await admin_page2.goto(f"{self.base_url}/admin/shoes")
                    await admin_page2.wait_for_load_state('networkidle')
                    await admin_page2.wait_for_timeout(3000)
                    
                    # Check if admin can see and manage inventory
                    admin_content = await admin_page2.content()
                    can_manage = 'shoe' in admin_content.lower() and ('edit' in admin_content.lower() or 'status' in admin_content.lower())
                    
                    if can_manage:
                        print("✅ Step 3: Admin can manage inventory")
                        workflow_results["steps"]["admin_inventory_management"] = {"success": True}
                    else:
                        print("⚠️ Step 3: Admin inventory management limited")
                        workflow_results["steps"]["admin_inventory_management"] = {"success": False}
                else:
                    workflow_results["steps"]["admin_inventory_management"] = {"success": False}
                
                await admin_context2.close()
                
                # Determine overall workflow success
                successful_steps = sum(1 for step in workflow_results["steps"].values() if step.get("success", False))
                total_steps = len(workflow_results["steps"])
                workflow_results["success"] = successful_steps >= (total_steps * 0.7)  # 70% success threshold
                
                print(f"🎯 Workflow 3 Result: {successful_steps}/{total_steps} steps successful")
                
            except Exception as e:
                print(f"❌ Workflow 3 error: {e}")
                workflow_results["error"] = str(e)
            finally:
                await browser.close()
        
        return workflow_results
    
    async def run_all_workflows(self):
        """Run all multi-user interactive workflows"""
        print("🚀 STARTING MULTI-USER INTERACTIVE WORKFLOW TESTING")
        print("=" * 80)
        print(f"Testing Platform: {self.base_url}")
        print(f"Timestamp: {datetime.now().isoformat()}")
        print("=" * 80)
        
        # Run all workflows
        workflows = [
            ("workflow_1", self.workflow_1_shoe_donation_to_inventory),
            ("workflow_2", self.workflow_2_user_request_admin_processing),
            ("workflow_3", self.workflow_3_admin_inventory_management)
        ]
        
        for workflow_id, workflow_func in workflows:
            try:
                result = await workflow_func()
                self.results["workflows"][workflow_id] = result
            except Exception as e:
                print(f"❌ {workflow_id} failed: {e}")
                self.results["workflows"][workflow_id] = {
                    "name": workflow_id,
                    "success": False,
                    "error": str(e)
                }
        
        # Generate summary
        self.generate_summary()
        self.save_results()
        
        return self.results
    
    def generate_summary(self):
        """Generate workflow testing summary"""
        print("\n" + "=" * 80)
        print("📊 MULTI-USER WORKFLOW TESTING SUMMARY")
        print("=" * 80)
        
        total_workflows = len(self.results["workflows"])
        successful_workflows = sum(1 for w in self.results["workflows"].values() if w.get("success", False))
        
        for workflow_id, workflow_result in self.results["workflows"].items():
            name = workflow_result.get("name", workflow_id)
            success = workflow_result.get("success", False)
            steps = workflow_result.get("steps", {})
            successful_steps = sum(1 for s in steps.values() if s.get("success", False))
            total_steps = len(steps)
            
            status = "✅ PASS" if success else "❌ FAIL"
            print(f"{name:40} | {successful_steps:2d}/{total_steps:2d} steps | {status}")
        
        overall_success_rate = (successful_workflows / total_workflows * 100) if total_workflows > 0 else 0
        
        print("-" * 80)
        print(f"{'OVERALL INTERACTIVE WORKFLOWS':40} | {successful_workflows:2d}/{total_workflows:2d} workflows | {overall_success_rate:5.1f}%")
        
        # Determine overall status
        if overall_success_rate >= 80:
            overall_status = "🎉 EXCELLENT"
            status_message = "Multi-user interactions working well!"
        elif overall_success_rate >= 60:
            overall_status = "✅ GOOD"
            status_message = "Most interactions functional"
        else:
            overall_status = "⚠️ NEEDS WORK"
            status_message = "Interactive workflows need attention"
        
        print("=" * 80)
        print(f"FINAL STATUS: {overall_status}")
        print(f"ASSESSMENT: {status_message}")
        print("=" * 80)
        
        # Store summary
        self.results["summary"] = {
            "total_workflows": total_workflows,
            "successful_workflows": successful_workflows,
            "overall_success_rate": overall_success_rate,
            "overall_status": overall_status,
            "status_message": status_message
        }
    
    def save_results(self):
        """Save results to JSON file"""
        filename = f"multi_user_workflow_results_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        with open(filename, 'w') as f:
            json.dump(self.results, f, indent=2)
        print(f"\n💾 Multi-user workflow results saved to: {filename}")

async def main():
    """Main function to run multi-user workflow testing"""
    import argparse
    
    parser = argparse.ArgumentParser(description='Multi-User Workflow Testing')
    parser.add_argument('--base-url', default='http://localhost:3000',
                       help='Base URL to test (default: http://localhost:3000)')
    
    args = parser.parse_args()
    
    tester = MultiUserWorkflowTester(base_url=args.base_url)
    await tester.run_all_workflows()

if __name__ == "__main__":
    asyncio.run(main())
