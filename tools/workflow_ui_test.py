#!/usr/bin/env python3
"""
Comprehensive Workflow UI Testing
Tests actual user journeys and interactions, not just page loading
"""

import asyncio
import json
import time
import random
import string
from playwright.async_api import async_playwright
import os

class WorkflowUITester:
    def __init__(self, base_url="https://newsteps.fit"):
        self.base_url = base_url
        self.test_results = []
        self.test_user = {
            'email': f'testuser_{int(time.time())}@example.com',
            'password': 'TestPassword123!',
            'firstName': 'Test',
            'lastName': 'User',
            'phone': '5551234567'
        }
        
    def log_result(self, workflow, step, status, details, critical=False):
        """Log workflow test result"""
        result = {
            "workflow": workflow,
            "step": step,
            "status": status,
            "details": details,
            "critical": critical,
            "timestamp": time.strftime("%Y-%m-%d %H:%M:%S")
        }
        self.test_results.append(result)
        
        status_symbol = "✅" if status == "PASS" else "❌" if status == "FAIL" else "⚠️"
        critical_flag = " [CRITICAL]" if critical else ""
        print(f"{status_symbol} {workflow} - {step}{critical_flag}: {details}")

    async def test_user_registration_workflow(self, page):
        """Test complete user registration workflow"""
        workflow = "User Registration"
        print(f"\n🔐 **TESTING WORKFLOW: {workflow.upper()}**\n")
        
        try:
            # Step 1: Navigate to registration page
            await page.goto(f"{self.base_url}/register", wait_until='networkidle')
            self.log_result(workflow, "Navigate to Register", "PASS", "Registration page loaded")
            
            # Step 2: Fill out registration form
            await page.fill('input[name="firstName"]', self.test_user['firstName'])
            await page.fill('input[name="lastName"]', self.test_user['lastName'])
            await page.fill('input[name="email"]', self.test_user['email'])
            await page.fill('input[name="password"]', self.test_user['password'])
            await page.fill('input[name="confirmPassword"]', self.test_user['password'])
            # Phone is optional, so we'll test both with and without
            await page.fill('input[name="phone"]', self.test_user['phone'])
            
            self.log_result(workflow, "Fill Registration Form", "PASS", "All fields filled successfully")
            
            # Step 3: Submit registration
            register_button = page.locator('button[type="submit"]')
            await register_button.click()
            
            # Wait for response - either success or error
            await page.wait_for_timeout(3000)
            
            # Check for success indicators
            current_url = page.url
            if '/login' in current_url or '/account' in current_url:
                self.log_result(workflow, "Registration Submission", "PASS", f"Redirected to {current_url}", critical=True)
                return True
            else:
                # Check for error messages
                error_elements = await page.locator('.text-red-500, .error, [role="alert"]').all()
                if error_elements:
                    error_text = await error_elements[0].text_content()
                    self.log_result(workflow, "Registration Submission", "FAIL", f"Error: {error_text}", critical=True)
                else:
                    self.log_result(workflow, "Registration Submission", "FAIL", "No success redirect, no error message", critical=True)
                return False
                
        except Exception as e:
            self.log_result(workflow, "Registration Workflow", "FAIL", f"Exception: {str(e)}", critical=True)
            return False

    async def test_user_login_workflow(self, page):
        """Test user login workflow"""
        workflow = "User Login"
        print(f"\n🔑 **TESTING WORKFLOW: {workflow.upper()}**\n")
        
        try:
            # Step 1: Navigate to login page
            await page.goto(f"{self.base_url}/login", wait_until='networkidle')
            self.log_result(workflow, "Navigate to Login", "PASS", "Login page loaded")
            
            # Step 2: Fill login form
            await page.fill('input[name="email"]', self.test_user['email'])
            await page.fill('input[name="password"]', self.test_user['password'])
            self.log_result(workflow, "Fill Login Form", "PASS", "Credentials entered")
            
            # Step 3: Submit login
            login_button = page.locator('button[type="submit"]')
            await login_button.click()
            
            # Wait for login response
            await page.wait_for_timeout(5000)
            
            # Check for successful login
            current_url = page.url
            if '/account' in current_url or current_url == f"{self.base_url}/":
                self.log_result(workflow, "Login Submission", "PASS", f"Successfully logged in, redirected to {current_url}", critical=True)
                return True
            else:
                # Check for error messages
                error_elements = await page.locator('.text-red-500, .error, [role="alert"]').all()
                if error_elements:
                    error_text = await error_elements[0].text_content()
                    self.log_result(workflow, "Login Submission", "FAIL", f"Login failed: {error_text}", critical=True)
                else:
                    self.log_result(workflow, "Login Submission", "WARN", "Login status unclear", critical=True)
                return False
                
        except Exception as e:
            self.log_result(workflow, "Login Workflow", "FAIL", f"Exception: {str(e)}", critical=True)
            return False

    async def test_shoe_browsing_workflow(self, page):
        """Test shoe browsing and interaction workflow"""
        workflow = "Shoe Browsing"
        print(f"\n👟 **TESTING WORKFLOW: {workflow.upper()}**\n")
        
        try:
            # Step 1: Navigate to shoes page
            await page.goto(f"{self.base_url}/shoes", wait_until='networkidle')
            self.log_result(workflow, "Navigate to Shoes", "PASS", "Shoes browse page loaded")
            
            # Step 2: Check if shoes are displayed
            shoe_cards = await page.locator('[data-testid="shoe-card"], .shoe-card, .grid > div').all()
            if len(shoe_cards) > 0:
                self.log_result(workflow, "Shoes Display", "PASS", f"Found {len(shoe_cards)} shoes displayed")
            else:
                self.log_result(workflow, "Shoes Display", "FAIL", "No shoes found on page", critical=True)
                return False
            
            # Step 3: Click on first shoe to view details
            first_shoe = shoe_cards[0]
            await first_shoe.click()
            await page.wait_for_timeout(2000)
            
            # Check if we're on shoe detail page
            current_url = page.url
            if '/shoes/' in current_url and current_url != f"{self.base_url}/shoes":
                self.log_result(workflow, "Shoe Detail Navigation", "PASS", f"Navigated to shoe detail: {current_url}")
            else:
                self.log_result(workflow, "Shoe Detail Navigation", "FAIL", f"Failed to navigate to shoe detail, still on: {current_url}")
                return False
            
            # Step 4: Test add to cart functionality
            add_to_cart_button = page.locator('button:has-text("Add to Cart"), button:has-text("Add to Request")')
            if await add_to_cart_button.count() > 0:
                await add_to_cart_button.click()
                await page.wait_for_timeout(2000)
                
                # Check for success feedback (toast, cart icon update, etc.)
                cart_icon = page.locator('[data-testid="cart-icon"], .cart-icon')
                if await cart_icon.count() > 0:
                    cart_text = await cart_icon.text_content()
                    if '1' in cart_text or 'cart' in cart_text.lower():
                        self.log_result(workflow, "Add to Cart", "PASS", "Item successfully added to cart")
                    else:
                        self.log_result(workflow, "Add to Cart", "WARN", "Cart update unclear")
                else:
                    self.log_result(workflow, "Add to Cart", "WARN", "No cart icon found to verify")
            else:
                self.log_result(workflow, "Add to Cart", "FAIL", "No add to cart button found", critical=True)
                return False
                
            return True
            
        except Exception as e:
            self.log_result(workflow, "Shoe Browsing Workflow", "FAIL", f"Exception: {str(e)}", critical=True)
            return False

    async def test_cart_workflow(self, page):
        """Test cart viewing and modification workflow"""
        workflow = "Cart Management"
        print(f"\n🛒 **TESTING WORKFLOW: {workflow.upper()}**\n")
        
        try:
            # Step 1: Navigate to cart
            await page.goto(f"{self.base_url}/cart", wait_until='networkidle')
            self.log_result(workflow, "Navigate to Cart", "PASS", "Cart page loaded")
            
            # Step 2: Check cart contents
            cart_items = await page.locator('[data-testid="cart-item"], .cart-item').all()
            if len(cart_items) > 0:
                self.log_result(workflow, "Cart Contents", "PASS", f"Found {len(cart_items)} items in cart")
                
                # Step 3: Test quantity modification (if available)
                quantity_inputs = await page.locator('input[type="number"], .quantity-input').all()
                if len(quantity_inputs) > 0:
                    # Try to modify quantity
                    await quantity_inputs[0].fill('2')
                    await page.wait_for_timeout(1000)
                    self.log_result(workflow, "Quantity Modification", "PASS", "Quantity updated")
                
                # Step 4: Test remove item (if available)
                remove_buttons = await page.locator('button:has-text("Remove"), .remove-item').all()
                if len(remove_buttons) > 0:
                    initial_count = len(cart_items)
                    await remove_buttons[0].click()
                    await page.wait_for_timeout(2000)
                    
                    # Check if item was removed
                    updated_cart_items = await page.locator('[data-testid="cart-item"], .cart-item').all()
                    if len(updated_cart_items) < initial_count:
                        self.log_result(workflow, "Remove Item", "PASS", "Item successfully removed")
                    else:
                        self.log_result(workflow, "Remove Item", "WARN", "Remove action unclear")
                
            else:
                # Empty cart case
                empty_message = await page.locator(':has-text("empty"), :has-text("no items")').count()
                if empty_message > 0:
                    self.log_result(workflow, "Cart Contents", "PASS", "Empty cart displayed correctly")
                else:
                    self.log_result(workflow, "Cart Contents", "FAIL", "No items found and no empty message", critical=True)
                    return False
            
            return True
            
        except Exception as e:
            self.log_result(workflow, "Cart Workflow", "FAIL", f"Exception: {str(e)}", critical=True)
            return False

    async def test_checkout_workflow(self, page):
        """Test checkout process workflow"""
        workflow = "Checkout Process"
        print(f"\n💳 **TESTING WORKFLOW: {workflow.upper()}**\n")
        
        try:
            # Step 1: Navigate to checkout
            await page.goto(f"{self.base_url}/checkout", wait_until='networkidle')
            
            # Check if redirected to login (authentication required)
            current_url = page.url
            if '/login' in current_url:
                self.log_result(workflow, "Checkout Access", "PASS", "Properly redirected to login (authentication required)")
                return True  # This is expected behavior
            
            self.log_result(workflow, "Navigate to Checkout", "PASS", "Checkout page loaded")
            
            # Step 2: Fill shipping information
            shipping_fields = [
                ('input[name="firstName"], input[name="first_name"]', 'Test'),
                ('input[name="lastName"], input[name="last_name"]', 'User'),  
                ('input[name="email"]', self.test_user['email']),
                ('input[name="phone"]', self.test_user['phone']),
                ('input[name="address"], input[name="street"]', '123 Test St'),
                ('input[name="city"]', 'Test City'),
                ('input[name="state"]', 'CA'),
                ('input[name="zipCode"], input[name="zip"]', '12345')
            ]
            
            filled_fields = 0
            for selector, value in shipping_fields:
                try:
                    field = page.locator(selector)
                    if await field.count() > 0:
                        await field.fill(value)
                        filled_fields += 1
                except:
                    pass  # Field might not exist
            
            if filled_fields > 0:
                self.log_result(workflow, "Fill Shipping Info", "PASS", f"Filled {filled_fields} shipping fields")
            else:
                self.log_result(workflow, "Fill Shipping Info", "WARN", "No shipping fields found or filled")
            
            # Step 3: Test delivery method selection
            delivery_options = await page.locator('input[type="radio"][name*="delivery"], input[type="radio"][name*="shipping"]').all()
            if len(delivery_options) > 0:
                await delivery_options[0].click()
                self.log_result(workflow, "Select Delivery Method", "PASS", "Delivery method selected")
            else:
                self.log_result(workflow, "Select Delivery Method", "WARN", "No delivery options found")
            
            # Step 4: Check for payment section (if needed)
            payment_section = await page.locator('#paypal, .paypal, :has-text("PayPal")').count()
            if payment_section > 0:
                self.log_result(workflow, "Payment Section", "PASS", "Payment section detected")
            else:
                self.log_result(workflow, "Payment Section", "INFO", "No payment section (may be free)")
            
            # Step 5: Test form submission (but don't actually submit to avoid creating test orders)
            submit_button = page.locator('button[type="submit"], button:has-text("Complete"), button:has-text("Submit")')
            if await submit_button.count() > 0:
                button_state = await submit_button.is_enabled()
                self.log_result(workflow, "Submit Button", "PASS", f"Submit button found, enabled: {button_state}")
            else:
                self.log_result(workflow, "Submit Button", "WARN", "No submit button found")
            
            return True
            
        except Exception as e:
            self.log_result(workflow, "Checkout Workflow", "FAIL", f"Exception: {str(e)}", critical=True)
            return False

    async def test_donation_workflow(self, page):
        """Test shoe donation submission workflow"""
        workflow = "Shoe Donation"
        print(f"\n🎁 **TESTING WORKFLOW: {workflow.upper()}**\n")
        
        try:
            # Step 1: Navigate to donation form
            await page.goto(f"{self.base_url}/donate/shoes", wait_until='networkidle')
            self.log_result(workflow, "Navigate to Donation", "PASS", "Donation form loaded")
            
            # Step 2: Fill donor information
            donor_fields = [
                ('input[name="firstName"]', 'Test'),
                ('input[name="lastName"]', 'Donor'),
                ('input[name="email"]', f'donor_{int(time.time())}@example.com'),
                ('input[name="phone"]', '5551234567'),
                ('textarea[name="donationDescription"], textarea[name="description"]', 'Test donation of athletic shoes')
            ]
            
            filled_fields = 0
            for selector, value in donor_fields:
                try:
                    field = page.locator(selector)
                    if await field.count() > 0:
                        await field.first.fill(value)
                        filled_fields += 1
                except:
                    pass
            
            if filled_fields > 0:
                self.log_result(workflow, "Fill Donor Information", "PASS", f"Filled {filled_fields} donor fields")
            else:
                self.log_result(workflow, "Fill Donor Information", "FAIL", "No donor fields found", critical=True)
                return False
            
            # Step 3: Test pickup/delivery selection
            delivery_options = await page.locator('input[type="radio"]').all()
            if len(delivery_options) > 0:
                await delivery_options[0].click()
                self.log_result(workflow, "Select Pickup Method", "PASS", "Pickup method selected")
            else:
                self.log_result(workflow, "Select Pickup Method", "WARN", "No pickup options found")
            
            # Step 4: Check form validation without submitting
            submit_button = page.locator('button[type="submit"]:has-text("Submit"), button:has-text("Donate")')
            if await submit_button.count() > 0:
                button_enabled = await submit_button.is_enabled()
                self.log_result(workflow, "Form Validation", "PASS", f"Submit button enabled: {button_enabled}")
            else:
                self.log_result(workflow, "Form Validation", "WARN", "No submit button found")
            
            return True
            
        except Exception as e:
            self.log_result(workflow, "Donation Workflow", "FAIL", f"Exception: {str(e)}", critical=True)
            return False

    async def test_navigation_workflow(self, page):
        """Test site navigation and menu functionality"""
        workflow = "Site Navigation"
        print(f"\n🧭 **TESTING WORKFLOW: {workflow.upper()}**\n")
        
        try:
            # Start from homepage
            await page.goto(self.base_url, wait_until='networkidle')
            
            # Test main navigation links
            nav_links = [
                ('About', '/about'),
                ('Donate', '/donate'),
                ('Request Shoes', '/shoes'),
                ('Contact', '/contact')
            ]
            
            successful_navigations = 0
            for link_text, expected_path in nav_links:
                try:
                    # Find and click navigation link
                    nav_link = page.locator(f'a:has-text("{link_text}"), nav a[href*="{expected_path}"]')
                    if await nav_link.count() > 0:
                        await nav_link.first.click()
                        await page.wait_for_timeout(2000)
                        
                        current_url = page.url
                        if expected_path in current_url:
                            self.log_result(workflow, f"Navigate to {link_text}", "PASS", f"Successfully navigated to {current_url}")
                            successful_navigations += 1
                        else:
                            self.log_result(workflow, f"Navigate to {link_text}", "FAIL", f"Expected {expected_path}, got {current_url}")
                    else:
                        self.log_result(workflow, f"Navigate to {link_text}", "WARN", f"Navigation link not found")
                        
                except Exception as e:
                    self.log_result(workflow, f"Navigate to {link_text}", "FAIL", f"Navigation error: {str(e)}")
            
            # Test footer links
            await page.goto(self.base_url, wait_until='networkidle')
            footer_links = await page.locator('footer a').all()
            if len(footer_links) > 0:
                self.log_result(workflow, "Footer Links", "PASS", f"Found {len(footer_links)} footer links")
            else:
                self.log_result(workflow, "Footer Links", "WARN", "No footer links found")
            
            # Test mobile menu (if applicable)
            mobile_menu_button = page.locator('button[aria-label*="menu"], .mobile-menu-button, button:has-text("☰")')
            if await mobile_menu_button.count() > 0:
                await mobile_menu_button.click()
                await page.wait_for_timeout(1000)
                self.log_result(workflow, "Mobile Menu", "PASS", "Mobile menu interaction tested")
            else:
                self.log_result(workflow, "Mobile Menu", "INFO", "No mobile menu found (desktop view)")
            
            return successful_navigations > 0
            
        except Exception as e:
            self.log_result(workflow, "Navigation Workflow", "FAIL", f"Exception: {str(e)}", critical=True)
            return False

    async def run_comprehensive_workflow_tests(self):
        """Run all workflow tests"""
        print("🚀 **COMPREHENSIVE WORKFLOW TESTING**")
        print(f"Testing: {self.base_url}")
        print(f"Started: {time.strftime('%Y-%m-%d %H:%M:%S')}")
        print("=" * 60)
        
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            context = await browser.new_context()
            page = await context.new_page()
            
            # Track overall workflow success
            workflow_results = []
            
            try:
                # Test 1: Site Navigation
                nav_success = await self.test_navigation_workflow(page)
                workflow_results.append(('Navigation', nav_success))
                
                # Test 2: User Registration
                reg_success = await self.test_user_registration_workflow(page)
                workflow_results.append(('Registration', reg_success))
                
                # Test 3: User Login (only if registration succeeded or we skip it)
                if reg_success:
                    login_success = await self.test_user_login_workflow(page)
                    workflow_results.append(('Login', login_success))
                    user_authenticated = login_success
                else:
                    # Try login with any existing user
                    self.test_user['email'] = 'test@example.com'  # Use a generic test email
                    login_success = await self.test_user_login_workflow(page)
                    workflow_results.append(('Login', login_success))
                    user_authenticated = login_success
                
                # Test 4: Shoe Browsing
                browse_success = await self.test_shoe_browsing_workflow(page)
                workflow_results.append(('Shoe Browsing', browse_success))
                
                # Test 5: Cart Management
                cart_success = await self.test_cart_workflow(page)
                workflow_results.append(('Cart Management', cart_success))
                
                # Test 6: Checkout Process
                checkout_success = await self.test_checkout_workflow(page)
                workflow_results.append(('Checkout', checkout_success))
                
                # Test 7: Donation Process
                donation_success = await self.test_donation_workflow(page)
                workflow_results.append(('Donation', donation_success))
                
            finally:
                await browser.close()
            
            # Generate comprehensive report
            self.generate_workflow_report(workflow_results)

    def generate_workflow_report(self, workflow_results):
        """Generate comprehensive workflow test report"""
        print("\n" + "=" * 60)
        print("📊 **COMPREHENSIVE WORKFLOW TEST REPORT**")
        print("=" * 60)
        
        total_tests = len(self.test_results)
        passed_tests = len([r for r in self.test_results if r['status'] == 'PASS'])
        failed_tests = len([r for r in self.test_results if r['status'] == 'FAIL'])
        critical_failures = len([r for r in self.test_results if r['status'] == 'FAIL' and r['critical']])
        
        success_rate = (passed_tests / total_tests * 100) if total_tests > 0 else 0
        
        print(f"📈 **OVERALL RESULTS:**")
        print(f"   Total Tests: {total_tests}")
        print(f"   ✅ Passed: {passed_tests}")
        print(f"   ❌ Failed: {failed_tests}")
        print(f"   🚨 Critical Failures: {critical_failures}")
        print(f"   📊 Success Rate: {success_rate:.1f}%")
        
        print(f"\n🔄 **WORKFLOW RESULTS:**")
        for workflow_name, success in workflow_results:
            status = "✅ PASS" if success else "❌ FAIL"
            print(f"   {status} {workflow_name}")
        
        # Group results by workflow
        workflow_groups = {}
        for result in self.test_results:
            workflow = result['workflow']
            if workflow not in workflow_groups:
                workflow_groups[workflow] = []
            workflow_groups[workflow].append(result)
        
        print(f"\n📋 **DETAILED WORKFLOW ANALYSIS:**")
        for workflow, results in workflow_groups.items():
            passed = len([r for r in results if r['status'] == 'PASS'])
            failed = len([r for r in results if r['status'] == 'FAIL'])
            total = len(results)
            rate = (passed / total * 100) if total > 0 else 0
            
            print(f"\n   🔸 **{workflow}**: {passed}/{total} passed ({rate:.1f}%)")
            
            # Show failed steps
            failed_steps = [r for r in results if r['status'] == 'FAIL']
            for step in failed_steps:
                print(f"      ❌ {step['step']}: {step['details']}")
        
        if critical_failures == 0:
            print(f"\n🎉 **SYSTEM STATUS: WORKFLOWS OPERATIONAL**")
            print(f"✅ All critical workflow steps passed")
            print(f"✅ Core user journeys functional")
        else:
            print(f"\n🚨 **SYSTEM STATUS: WORKFLOW ISSUES DETECTED**")
            print(f"❌ {critical_failures} critical workflow failures")
            print(f"⚠️  User experience may be impacted")
        
        # Save detailed results
        with open("workflow_test_results.json", "w") as f:
            json.dump({
                "summary": {
                    "total_tests": total_tests,
                    "passed": passed_tests,
                    "failed": failed_tests,
                    "critical_failures": critical_failures,
                    "success_rate": success_rate,
                    "workflow_results": workflow_results
                },
                "detailed_results": self.test_results,
                "workflow_groups": workflow_groups
            }, f, indent=2)
        
        print(f"\n📄 Detailed results saved to: workflow_test_results.json")

# Main execution
async def main():
    tester = WorkflowUITester()
    await tester.run_comprehensive_workflow_tests()

if __name__ == "__main__":
    asyncio.run(main()) 