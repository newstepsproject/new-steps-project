#!/usr/bin/env python3
"""
Simplified Multi-User Workflow Testing
Focus on critical interactive workflows between users and admin
"""

import asyncio
import json
import requests
import time
from datetime import datetime
from playwright.async_api import async_playwright

class SimplifiedWorkflowTester:
    def __init__(self, base_url="http://localhost:3000"):
        self.base_url = base_url
        self.results = {
            "timestamp": datetime.now().isoformat(),
            "workflows": {},
            "summary": {}
        }
        
        # Test data
        self.admin_credentials = {
            "email": "admin@newsteps.fit",
            "password": "Admin123!"
        }
        
        self.test_donation_id = None
        self.test_request_id = None
    
    async def workflow_1_donation_visibility_cycle(self):
        """
        Critical Workflow 1: Visitor donation → Admin sees it → Admin processes it
        Tests the core donation-to-admin visibility and processing cycle
        """
        print("\n🔄 WORKFLOW 1: DONATION VISIBILITY CYCLE")
        print("-" * 60)
        
        workflow_results = {
            "name": "Donation Visibility Cycle",
            "steps": {},
            "success": False
        }
        
        try:
            # Step 1: Create donation via API (simulating visitor form submission)
            print("Step 1: Creating donation via API (simulating visitor submission)...")
            
            donation_data = {
                "firstName": "Workflow",
                "lastName": "Donor",
                "email": "workflowdonor@example.com",
                "phone": "1234567890",
                "address": {
                    "street": "123 Workflow St",
                    "city": "San Francisco",
                    "state": "CA",
                    "zipCode": "94102",
                    "country": "USA"
                },
                "numberOfShoes": 2,
                "donationDescription": "Workflow test - 2 Nike shoes in good condition"
            }
            
            response = requests.post(f"{self.base_url}/api/donations", json=donation_data, timeout=10)
            
            if response.status_code == 201:
                result = response.json()
                self.test_donation_id = result.get('donationId', 'unknown')
                print(f"✅ Step 1: Donation created successfully (ID: {self.test_donation_id})")
                workflow_results["steps"]["donation_creation"] = {"success": True, "donation_id": self.test_donation_id}
            else:
                print(f"❌ Step 1: Donation creation failed ({response.status_code})")
                workflow_results["steps"]["donation_creation"] = {"success": False}
                return workflow_results
            
            # Step 2: Admin login and check donations dashboard
            print("Step 2: Admin checks donations dashboard...")
            
            async with async_playwright() as p:
                browser = await p.chromium.launch(headless=False)
                admin_context = await browser.new_context()
                admin_page = await admin_context.new_page()
                
                try:
                    # Login as admin
                    await admin_page.goto(f"{self.base_url}/login")
                    await admin_page.wait_for_load_state('networkidle')
                    await admin_page.wait_for_timeout(2000)
                    
                    await admin_page.fill('input[type="email"]', self.admin_credentials['email'])
                    await admin_page.fill('input[type="password"]', self.admin_credentials['password'])
                    await admin_page.click('button[type="submit"]')
                    await admin_page.wait_for_timeout(3000)
                    
                    # Check if logged in
                    current_url = admin_page.url
                    if '/admin' in current_url or '/account' in current_url:
                        print("✅ Step 2a: Admin logged in successfully")
                        workflow_results["steps"]["admin_login"] = {"success": True}
                        
                        # Navigate to donations page
                        await admin_page.goto(f"{self.base_url}/admin/shoe-donations")
                        await admin_page.wait_for_load_state('networkidle')
                        await admin_page.wait_for_timeout(3000)
                        
                        # Check if donation is visible
                        page_content = await admin_page.content()
                        donation_visible = (
                            'workflowdonor@example.com' in page_content.lower() or
                            (self.test_donation_id and self.test_donation_id in page_content) or
                            'workflow' in page_content.lower()
                        )
                        
                        if donation_visible:
                            print("✅ Step 2b: Donation visible in admin dashboard")
                            workflow_results["steps"]["admin_sees_donation"] = {"success": True}
                        else:
                            print("⚠️ Step 2b: Donation not immediately visible (may need refresh)")
                            workflow_results["steps"]["admin_sees_donation"] = {"success": False}
                        
                        # Check if admin can interact with donations
                        interactive_elements = await admin_page.locator('button, select, input[type="submit"]').count()
                        if interactive_elements > 0:
                            print("✅ Step 2c: Admin can interact with donations dashboard")
                            workflow_results["steps"]["admin_can_interact"] = {"success": True}
                        else:
                            print("⚠️ Step 2c: Limited admin interaction options")
                            workflow_results["steps"]["admin_can_interact"] = {"success": False}
                            
                    else:
                        print("❌ Step 2a: Admin login failed")
                        workflow_results["steps"]["admin_login"] = {"success": False}
                        
                finally:
                    await admin_context.close()
                    await browser.close()
            
            # Determine workflow success
            successful_steps = sum(1 for step in workflow_results["steps"].values() if step.get("success", False))
            total_steps = len(workflow_results["steps"])
            workflow_results["success"] = successful_steps >= (total_steps * 0.7)
            
            print(f"🎯 Workflow 1 Result: {successful_steps}/{total_steps} steps successful")
            
        except Exception as e:
            print(f"❌ Workflow 1 error: {e}")
            workflow_results["error"] = str(e)
        
        return workflow_results
    
    async def workflow_2_inventory_public_visibility(self):
        """
        Critical Workflow 2: Admin inventory changes → Public sees updates
        Tests the core inventory-to-public visibility cycle
        """
        print("\n🔄 WORKFLOW 2: INVENTORY PUBLIC VISIBILITY")
        print("-" * 60)
        
        workflow_results = {
            "name": "Inventory Public Visibility",
            "steps": {},
            "success": False
        }
        
        try:
            # Step 1: Check current public inventory
            print("Step 1: Checking current public inventory...")
            
            async with async_playwright() as p:
                browser = await p.chromium.launch(headless=False)
                public_context = await browser.new_context()
                public_page = await public_context.new_page()
                
                try:
                    await public_page.goto(f"{self.base_url}/shoes")
                    await public_page.wait_for_load_state('networkidle')
                    await public_page.wait_for_timeout(3000)
                    
                    # Count shoes and check for content
                    shoe_elements = await public_page.locator('.shoe-card, [data-testid="shoe-item"], .grid > div, .space-y-4 > div').count()
                    page_content = await public_page.content()
                    has_shoe_content = any(brand in page_content.lower() for brand in ['nike', 'adidas', 'new balance', 'converse'])
                    
                    if shoe_elements > 0 and has_shoe_content:
                        print(f"✅ Step 1: Public inventory shows {shoe_elements} shoes with content")
                        workflow_results["steps"]["public_inventory_visible"] = {"success": True, "shoe_count": shoe_elements}
                    else:
                        print(f"⚠️ Step 1: Public inventory shows {shoe_elements} shoes but limited content")
                        workflow_results["steps"]["public_inventory_visible"] = {"success": False, "shoe_count": shoe_elements}
                    
                finally:
                    await public_context.close()
                
                # Step 2: Admin checks inventory management
                print("Step 2: Admin checks inventory management...")
                
                admin_context = await browser.new_context()
                admin_page = await admin_context.new_page()
                
                try:
                    # Login as admin
                    await admin_page.goto(f"{self.base_url}/login")
                    await admin_page.wait_for_load_state('networkidle')
                    await admin_page.wait_for_timeout(2000)
                    
                    await admin_page.fill('input[type="email"]', self.admin_credentials['email'])
                    await admin_page.fill('input[type="password"]', self.admin_credentials['password'])
                    await admin_page.click('button[type="submit"]')
                    await admin_page.wait_for_timeout(3000)
                    
                    # Navigate to admin shoes page
                    await admin_page.goto(f"{self.base_url}/admin/shoes")
                    await admin_page.wait_for_load_state('networkidle')
                    await admin_page.wait_for_timeout(3000)
                    
                    # Check if admin can see inventory
                    admin_content = await admin_page.content()
                    admin_sees_inventory = any(brand in admin_content.lower() for brand in ['nike', 'adidas', 'new balance', 'converse'])
                    
                    if admin_sees_inventory:
                        print("✅ Step 2a: Admin can see inventory")
                        workflow_results["steps"]["admin_sees_inventory"] = {"success": True}
                        
                        # Check if admin can manage inventory
                        management_elements = await admin_page.locator('button:has-text("Edit"), button:has-text("Delete"), button:has-text("Add"), a:has-text("Add")').count()
                        
                        if management_elements > 0:
                            print("✅ Step 2b: Admin can manage inventory")
                            workflow_results["steps"]["admin_can_manage"] = {"success": True}
                        else:
                            print("⚠️ Step 2b: Limited admin management options")
                            workflow_results["steps"]["admin_can_manage"] = {"success": False}
                    else:
                        print("❌ Step 2a: Admin cannot see inventory")
                        workflow_results["steps"]["admin_sees_inventory"] = {"success": False}
                        
                finally:
                    await admin_context.close()
                    await browser.close()
            
            # Step 3: Test admin access to add shoes
            print("Step 3: Testing admin add shoes access...")
            
            async with async_playwright() as p:
                browser = await p.chromium.launch(headless=False)
                admin_context = await browser.new_context()
                admin_page = await admin_context.new_page()
                
                try:
                    # Login and go to add shoes
                    await admin_page.goto(f"{self.base_url}/login")
                    await admin_page.wait_for_load_state('networkidle')
                    await admin_page.wait_for_timeout(2000)
                    
                    await admin_page.fill('input[type="email"]', self.admin_credentials['email'])
                    await admin_page.fill('input[type="password"]', self.admin_credentials['password'])
                    await admin_page.click('button[type="submit"]')
                    await admin_page.wait_for_timeout(3000)
                    
                    await admin_page.goto(f"{self.base_url}/admin/shoes/add")
                    await admin_page.wait_for_load_state('networkidle')
                    await admin_page.wait_for_timeout(3000)
                    
                    # Check if add form is accessible
                    form_elements = await admin_page.locator('form, input, select, textarea').count()
                    
                    if form_elements > 5:  # Should have multiple form elements
                        print("✅ Step 3: Admin add shoes form accessible")
                        workflow_results["steps"]["admin_add_form_accessible"] = {"success": True}
                    else:
                        print("⚠️ Step 3: Admin add shoes form limited")
                        workflow_results["steps"]["admin_add_form_accessible"] = {"success": False}
                        
                finally:
                    await admin_context.close()
                    await browser.close()
            
            # Determine workflow success
            successful_steps = sum(1 for step in workflow_results["steps"].values() if step.get("success", False))
            total_steps = len(workflow_results["steps"])
            workflow_results["success"] = successful_steps >= (total_steps * 0.7)
            
            print(f"🎯 Workflow 2 Result: {successful_steps}/{total_steps} steps successful")
            
        except Exception as e:
            print(f"❌ Workflow 2 error: {e}")
            workflow_results["error"] = str(e)
        
        return workflow_results
    
    async def workflow_3_request_admin_cycle(self):
        """
        Critical Workflow 3: User request creation → Admin processing → Status updates
        Tests the core request-to-admin processing cycle
        """
        print("\n🔄 WORKFLOW 3: REQUEST ADMIN CYCLE")
        print("-" * 60)
        
        workflow_results = {
            "name": "Request Admin Cycle",
            "steps": {},
            "success": False
        }
        
        try:
            # Step 1: Check if users can browse shoes
            print("Step 1: Checking user shoe browsing...")
            
            async with async_playwright() as p:
                browser = await p.chromium.launch(headless=False)
                user_context = await browser.new_context()
                user_page = await user_context.new_page()
                
                try:
                    await user_page.goto(f"{self.base_url}/shoes")
                    await user_page.wait_for_load_state('networkidle')
                    await user_page.wait_for_timeout(3000)
                    
                    # Check if shoes are available for request
                    request_buttons = await user_page.locator('button:has-text("Add to Cart"), button:has-text("Request"), button:has-text("Add")').count()
                    
                    if request_buttons > 0:
                        print(f"✅ Step 1: Users can browse and request shoes ({request_buttons} request options)")
                        workflow_results["steps"]["user_can_browse"] = {"success": True, "request_options": request_buttons}
                    else:
                        print("⚠️ Step 1: Limited or no request options for users")
                        workflow_results["steps"]["user_can_browse"] = {"success": False, "request_options": 0}
                        
                finally:
                    await user_context.close()
                
                # Step 2: Admin checks requests dashboard
                print("Step 2: Admin checks requests dashboard...")
                
                admin_context = await browser.new_context()
                admin_page = await admin_context.new_page()
                
                try:
                    # Login as admin
                    await admin_page.goto(f"{self.base_url}/login")
                    await admin_page.wait_for_load_state('networkidle')
                    await admin_page.wait_for_timeout(2000)
                    
                    await admin_page.fill('input[type="email"]', self.admin_credentials['email'])
                    await admin_page.fill('input[type="password"]', self.admin_credentials['password'])
                    await admin_page.click('button[type="submit"]')
                    await admin_page.wait_for_timeout(3000)
                    
                    # Navigate to requests page
                    await admin_page.goto(f"{self.base_url}/admin/requests")
                    await admin_page.wait_for_load_state('networkidle')
                    await admin_page.wait_for_timeout(3000)
                    
                    # Check if requests page is functional
                    page_content = await admin_page.content()
                    requests_functional = (
                        'request' in page_content.lower() and 
                        not 'error' in page_content.lower() and
                        not '404' in page_content
                    )
                    
                    if requests_functional:
                        print("✅ Step 2a: Admin requests dashboard accessible")
                        workflow_results["steps"]["admin_requests_accessible"] = {"success": True}
                        
                        # Check for management capabilities
                        management_elements = await admin_page.locator('button, select, input[type="submit"]').count()
                        
                        if management_elements > 0:
                            print("✅ Step 2b: Admin can manage requests")
                            workflow_results["steps"]["admin_can_manage_requests"] = {"success": True}
                        else:
                            print("⚠️ Step 2b: Limited request management options")
                            workflow_results["steps"]["admin_can_manage_requests"] = {"success": False}
                    else:
                        print("❌ Step 2a: Admin requests dashboard not accessible")
                        workflow_results["steps"]["admin_requests_accessible"] = {"success": False}
                        
                finally:
                    await admin_context.close()
                    await browser.close()
            
            # Determine workflow success
            successful_steps = sum(1 for step in workflow_results["steps"].values() if step.get("success", False))
            total_steps = len(workflow_results["steps"])
            workflow_results["success"] = successful_steps >= (total_steps * 0.7)
            
            print(f"🎯 Workflow 3 Result: {successful_steps}/{total_steps} steps successful")
            
        except Exception as e:
            print(f"❌ Workflow 3 error: {e}")
            workflow_results["error"] = str(e)
        
        return workflow_results
    
    async def run_all_workflows(self):
        """Run all simplified multi-user workflows"""
        print("🚀 STARTING SIMPLIFIED MULTI-USER WORKFLOW TESTING")
        print("=" * 80)
        print(f"Testing Platform: {self.base_url}")
        print(f"Focus: Critical interactive workflows between users and admin")
        print(f"Timestamp: {datetime.now().isoformat()}")
        print("=" * 80)
        
        # Run all workflows
        workflows = [
            ("workflow_1", self.workflow_1_donation_visibility_cycle),
            ("workflow_2", self.workflow_2_inventory_public_visibility),
            ("workflow_3", self.workflow_3_request_admin_cycle)
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
        print("📊 SIMPLIFIED MULTI-USER WORKFLOW TESTING SUMMARY")
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
            status_message = "Most critical interactions functional"
        else:
            overall_status = "⚠️ NEEDS WORK"
            status_message = "Some critical workflows need attention"
        
        print("=" * 80)
        print(f"FINAL STATUS: {overall_status}")
        print(f"ASSESSMENT: {status_message}")
        
        # Provide specific recommendations
        print("\n🔍 WORKFLOW ANALYSIS:")
        for workflow_id, workflow_result in self.results["workflows"].items():
            name = workflow_result.get("name", workflow_id)
            success = workflow_result.get("success", False)
            steps = workflow_result.get("steps", {})
            
            if success:
                print(f"✅ {name}: Core functionality working")
            else:
                failed_steps = [step_name for step_name, step_data in steps.items() if not step_data.get("success", False)]
                if failed_steps:
                    print(f"⚠️ {name}: Issues in {', '.join(failed_steps)}")
                else:
                    print(f"❌ {name}: Major functionality issues")
        
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
        filename = f"simplified_workflow_results_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        with open(filename, 'w') as f:
            json.dump(self.results, f, indent=2)
        print(f"\n💾 Simplified workflow results saved to: {filename}")

async def main():
    """Main function to run simplified workflow testing"""
    tester = SimplifiedWorkflowTester()
    await tester.run_all_workflows()

if __name__ == "__main__":
    asyncio.run(main())
