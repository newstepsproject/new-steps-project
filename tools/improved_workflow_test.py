#!/usr/bin/env python3
"""
Improved Workflow UI Testing - Handles Dynamic Content Loading
Properly waits for React content, loading spinners, and async operations
"""

import asyncio
import json
import time
import random
import string
from playwright.async_api import async_playwright
import os

class ImprovedWorkflowTester:
    def __init__(self, base_url="https://newsteps.fit"):
        self.base_url = base_url
        self.test_results = []
        self.test_user = {
            'email': f'workflowtest_{int(time.time())}@example.com',
            'password': 'TestPassword123!',
            'firstName': 'Workflow',
            'lastName': 'Tester',
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

    async def wait_for_page_load(self, page, timeout=15000):
        """Wait for page to fully load, including dynamic content"""
        try:
            # Wait for initial load
            await page.wait_for_load_state('networkidle', timeout=timeout)
            
            # Wait for any loading spinners to disappear 
            loading_selectors = [
                '.animate-spin',
                '.loading-spinner', 
                '.lucide-loader2',
                'div:has-text("Loading")',
                'div:has-text("loading")'
            ]
            
            for selector in loading_selectors:
                try:
                    if await page.locator(selector).count() > 0:
                        print(f"    Waiting for loading spinner to disappear...")
                        await page.locator(selector).wait_for(state='detached', timeout=10000)
                        await page.wait_for_timeout(1000)  # Additional buffer
                except:
                    pass  # Loading spinner might not exist or already gone
                    
            # Wait a bit more for content to stabilize
            await page.wait_for_timeout(2000)
            return True
            
        except Exception as e:
            print(f"    Warning: Page load timeout - {str(e)}")
            return False

    async def test_user_registration_workflow(self, page):
        """Test complete user registration workflow with better form handling"""
        workflow = "User Registration"
        print(f"\n🔐 **TESTING WORKFLOW: {workflow.upper()}**\n")
        
        try:
            # Step 1: Navigate to registration page
            await page.goto(f"{self.base_url}/register", wait_until='networkidle', timeout=30000)
            await self.wait_for_page_load(page)
            self.log_result(workflow, "Navigate to Register", "PASS", "Registration page loaded")
            
            # Step 2: Wait for form to be ready
            form_ready = await page.locator('form, input[name="firstName"]').wait_for(timeout=10000)
            if form_ready:
                self.log_result(workflow, "Form Ready", "PASS", "Registration form detected")
            
            # Step 3: Fill out registration form with multiple selector strategies
            form_fields = [
                (['input[name="firstName"]', 'input[placeholder*="first" i]'], self.test_user['firstName'], "First Name"),
                (['input[name="lastName"]', 'input[placeholder*="last" i]'], self.test_user['lastName'], "Last Name"), 
                (['input[name="email"]', 'input[type="email"]'], self.test_user['email'], "Email"),
                (['input[name="password"]', 'input[type="password"]:not([name*="confirm"])'], self.test_user['password'], "Password"),
                (['input[name="confirmPassword"]', 'input[name="password_confirmation"]', 'input[placeholder*="confirm" i]'], self.test_user['password'], "Confirm Password"),
                (['input[name="phone"]', 'input[type="tel"]'], self.test_user['phone'], "Phone")
            ]
            
            filled_count = 0
            for selectors, value, field_name in form_fields:
                for selector in selectors:
                    try:
                        field = page.locator(selector)
                        if await field.count() > 0:
                            await field.first.fill(value)
                            filled_count += 1
                            print(f"    ✓ Filled {field_name}")
                            break
                    except Exception as e:
                        continue
            
            if filled_count >= 4:  # At least email, password, confirm, first/last name
                self.log_result(workflow, "Fill Registration Form", "PASS", f"Filled {filled_count} form fields")
            else:
                self.log_result(workflow, "Fill Registration Form", "FAIL", f"Only filled {filled_count} fields", critical=True)
                return False
            
            # Step 4: Submit registration
            submit_selectors = [
                'button[type="submit"]',
                'input[type="submit"]',
                'button:has-text("Register")',
                'button:has-text("Sign Up")',
                'button:has-text("Create Account")'
            ]
            
            submitted = False
            for selector in submit_selectors:
                try:
                    submit_button = page.locator(selector)
                    if await submit_button.count() > 0:
                        await submit_button.first.click()
                        submitted = True
                        break
                except:
                    continue
            
            if not submitted:
                self.log_result(workflow, "Registration Submission", "FAIL", "No submit button found", critical=True)
                return False
            
            # Wait for response with extended timeout
            await page.wait_for_timeout(5000)
            
            # Check for success indicators
            current_url = page.url
            success_indicators = [
                '/login' in current_url,
                '/account' in current_url,
                '/dashboard' in current_url,
                await page.locator(':has-text("success"), :has-text("registered"), :has-text("welcome")').count() > 0
            ]
            
            if any(success_indicators):
                self.log_result(workflow, "Registration Submission", "PASS", f"Registration successful - {current_url}", critical=True)
                return True
            else:
                # Check for specific error messages
                error_elements = await page.locator('.text-red-500, .error, [role="alert"], .alert-error').all()
                if error_elements:
                    error_text = await error_elements[0].text_content()
                    self.log_result(workflow, "Registration Submission", "FAIL", f"Error: {error_text[:100]}", critical=True)
                else:
                    self.log_result(workflow, "Registration Submission", "FAIL", "Registration failed - no success indication", critical=True)
                return False
                
        except Exception as e:
            self.log_result(workflow, "Registration Workflow", "FAIL", f"Exception: {str(e)}", critical=True)
            return False

    async def test_shoe_browsing_workflow(self, page):
        """Test shoe browsing with proper dynamic content loading"""
        workflow = "Shoe Browsing"
        print(f"\n👟 **TESTING WORKFLOW: {workflow.upper()}**\n")
        
        try:
            # Step 1: Navigate to shoes page
            await page.goto(f"{self.base_url}/shoes", wait_until='networkidle', timeout=30000)
            await self.wait_for_page_load(page)
            self.log_result(workflow, "Navigate to Shoes", "PASS", "Shoes browse page loaded")
            
            # Step 2: Wait for shoes to load (dynamic content)
            await page.wait_for_timeout(3000)  # Give time for API calls
            
            # Check if shoes are displayed with multiple selectors
            shoe_selectors = [
                '[data-testid="shoe-card"]',
                '.shoe-card', 
                '.grid > div > div',  # Grid items
                'article',
                'div:has(img):has-text("$")',  # Divs with images and price
                'a[href*="/shoes/"]'  # Links to shoe details
            ]
            
            total_shoes = 0
            for selector in shoe_selectors:
                count = await page.locator(selector).count()
                total_shoes = max(total_shoes, count)
            
            if total_shoes > 0:
                self.log_result(workflow, "Shoes Display", "PASS", f"Found {total_shoes} shoes displayed")
                
                # Step 3: Try to click on first shoe
                clicked = False
                for selector in shoe_selectors:
                    try:
                        shoes = page.locator(selector)
                        if await shoes.count() > 0:
                            first_shoe = shoes.first
                            await first_shoe.click()
                            clicked = True
                            break
                    except:
                        continue
                
                if clicked:
                    # Wait for navigation and page load
                    await page.wait_for_timeout(5000)
                    await self.wait_for_page_load(page)
                    
                    current_url = page.url
                    if '/shoes/' in current_url and current_url != f"{self.base_url}/shoes":
                        self.log_result(workflow, "Shoe Detail Navigation", "PASS", f"Navigated to: {current_url}")
                        
                        # Step 4: Look for add to cart button with extended wait
                        add_to_cart_selectors = [
                            'button:has-text("Add to Cart")',
                            'button:has-text("Add to Request")', 
                            'button:has-text("Request This Shoe")',
                            'button[data-testid="add-to-cart"]',
                            '.add-to-cart-button',
                            'button:has-text("Add")'
                        ]
                        
                        found_button = False
                        for selector in add_to_cart_selectors:
                            try:
                                button = page.locator(selector)
                                if await button.count() > 0:
                                    await button.first.click()
                                    await page.wait_for_timeout(2000)
                                    
                                    # Check for success feedback
                                    success_indicators = [
                                        await page.locator(':has-text("added"), :has-text("cart")').count() > 0,
                                        await page.locator('[data-testid="cart-icon"]').count() > 0
                                    ]
                                    
                                    if any(success_indicators):
                                        self.log_result(workflow, "Add to Cart", "PASS", "Item added to cart successfully")
                                    else:
                                        self.log_result(workflow, "Add to Cart", "WARN", "Add to cart clicked, feedback unclear")
                                    
                                    found_button = True
                                    break
                            except Exception as e:
                                continue
                        
                        if not found_button:
                            # Take a screenshot for debugging
                            await page.screenshot(path="debug_shoe_detail.png")
                            self.log_result(workflow, "Add to Cart", "FAIL", "No add to cart button found after page load", critical=True)
                    else:
                        self.log_result(workflow, "Shoe Detail Navigation", "FAIL", f"Navigation failed - still on: {current_url}")
                        return False
                else:
                    self.log_result(workflow, "Shoe Click", "FAIL", "Could not click on any shoe", critical=True)
                    return False
            else:
                self.log_result(workflow, "Shoes Display", "FAIL", "No shoes found on page", critical=True)
                return False
            
            return True
            
        except Exception as e:
            self.log_result(workflow, "Shoe Browsing Workflow", "FAIL", f"Exception: {str(e)}", critical=True)
            return False

    async def test_checkout_workflow(self, page):
        """Test checkout with proper dynamic form loading"""
        workflow = "Checkout Process"
        print(f"\n💳 **TESTING WORKFLOW: {workflow.upper()}**\n")
        
        try:
            # Step 1: Navigate to checkout
            await page.goto(f"{self.base_url}/checkout", wait_until='networkidle', timeout=30000)
            await self.wait_for_page_load(page)
            
            # Check if redirected to login (expected behavior)
            current_url = page.url
            if '/login' in current_url:
                self.log_result(workflow, "Checkout Access", "PASS", "Properly requires authentication (redirected to login)")
                return True
            
            self.log_result(workflow, "Navigate to Checkout", "PASS", "Checkout page loaded")
            
            # Step 2: Wait for form to load (it's dynamic)
            await page.wait_for_timeout(5000)  # Give time for React to render form
            
            # Look for any form fields with multiple strategies
            form_field_selectors = [
                'input[type="text"]',
                'input[type="email"]', 
                'input[name*="name"]',
                'input[name*="address"]',
                'input[name*="city"]',
                'input[name*="state"]',
                'input[name*="zip"]',
                'input[name*="phone"]',
                'form input',
                '.form-input'
            ]
            
            total_fields = 0
            for selector in form_field_selectors:
                count = await page.locator(selector).count()
                total_fields += count
            
            if total_fields > 0:
                self.log_result(workflow, "Checkout Form Detection", "PASS", f"Found {total_fields} form fields")
                
                # Try to fill some basic fields
                test_data = [
                    (['input[name*="firstName"], input[name*="first"]', 'name'], 'Test'),
                    (['input[name*="lastName"], input[name*="last"]', 'name'], 'User'),
                    (['input[type="email"], input[name*="email"]'], self.test_user['email']),
                    (['input[name*="phone"], input[type="tel"]'], self.test_user['phone']),
                    (['input[name*="address"], input[name*="street"]'], '123 Test St'),
                    (['input[name*="city"]'], 'Test City'),
                    (['input[name*="state"]'], 'CA'),
                    (['input[name*="zip"], input[name*="postal"]'], '12345')
                ]
                
                filled = 0
                for selectors, value in test_data:
                    for selector in selectors:
                        try:
                            field = page.locator(selector)
                            if await field.count() > 0:
                                await field.first.fill(value)
                                filled += 1
                                break
                        except:
                            continue
                
                if filled > 0:
                    self.log_result(workflow, "Fill Checkout Form", "PASS", f"Filled {filled} form fields")
                else:
                    self.log_result(workflow, "Fill Checkout Form", "WARN", "No fields could be filled")
                
                # Look for delivery/shipping options  
                radio_buttons = await page.locator('input[type="radio"]').count()
                if radio_buttons > 0:
                    try:
                        await page.locator('input[type="radio"]').first.click()
                        self.log_result(workflow, "Select Delivery Option", "PASS", f"Selected from {radio_buttons} delivery options")
                    except:
                        self.log_result(workflow, "Select Delivery Option", "WARN", "Could not select delivery option")
                else:
                    self.log_result(workflow, "Select Delivery Option", "INFO", "No delivery options found")
                
                # Look for submit button
                submit_selectors = [
                    'button[type="submit"]',
                    'button:has-text("Complete")',
                    'button:has-text("Submit")',
                    'button:has-text("Place Order")',
                    'button:has-text("Continue")'
                ]
                
                found_submit = False
                for selector in submit_selectors:
                    if await page.locator(selector).count() > 0:
                        is_enabled = await page.locator(selector).first.is_enabled()
                        self.log_result(workflow, "Submit Button", "PASS", f"Submit button found, enabled: {is_enabled}")
                        found_submit = True
                        break
                
                if not found_submit:
                    self.log_result(workflow, "Submit Button", "WARN", "No submit button found")
                
            else:
                # Take screenshot for debugging
                await page.screenshot(path="debug_checkout_form.png")
                self.log_result(workflow, "Checkout Form Detection", "FAIL", "No form fields found - may still be loading", critical=True)
                return False
            
            return True
            
        except Exception as e:
            self.log_result(workflow, "Checkout Workflow", "FAIL", f"Exception: {str(e)}", critical=True)
            return False

    async def run_improved_workflow_tests(self):
        """Run improved workflow tests with proper dynamic content handling"""
        print("🚀 **IMPROVED WORKFLOW TESTING - DYNAMIC CONTENT AWARE**")
        print(f"Testing: {self.base_url}")
        print(f"Started: {time.strftime('%Y-%m-%d %H:%M:%S')}")
        print("=" * 60)
        
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=False, slow_mo=1000)  # Visible browser for debugging
            context = await browser.new_context(viewport={'width': 1280, 'height': 720})
            page = await context.new_page()
            
            # Track workflow results
            workflow_results = []
            
            try:
                # Test 1: User Registration (simplified)
                reg_success = await self.test_user_registration_workflow(page)
                workflow_results.append(('Registration', reg_success))
                
                # Test 2: Shoe Browsing (most important)
                browse_success = await self.test_shoe_browsing_workflow(page)
                workflow_results.append(('Shoe Browsing', browse_success))
                
                # Test 3: Checkout Process  
                checkout_success = await self.test_checkout_workflow(page)
                workflow_results.append(('Checkout', checkout_success))
                
            finally:
                await browser.close()
            
            # Generate report
            self.generate_improved_report(workflow_results)

    def generate_improved_report(self, workflow_results):
        """Generate improved workflow test report"""
        print("\n" + "=" * 60)
        print("📊 **IMPROVED WORKFLOW TEST REPORT**")
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
        
        if critical_failures == 0:
            print(f"\n🎉 **SYSTEM STATUS: CORE WORKFLOWS OPERATIONAL**")
            print(f"✅ All critical workflow steps completed")
        else:
            print(f"\n🚨 **SYSTEM STATUS: WORKFLOW ISSUES DETECTED**")
            print(f"❌ {critical_failures} critical failures need attention")
        
        # Save results
        with open("improved_workflow_results.json", "w") as f:
            json.dump({
                "summary": {
                    "total_tests": total_tests,
                    "success_rate": success_rate,
                    "critical_failures": critical_failures,
                    "workflow_results": workflow_results
                },
                "detailed_results": self.test_results
            }, f, indent=2)
        
        print(f"\n📄 Results saved to: improved_workflow_results.json")
        print(f"🖼️  Debug screenshots: debug_*.png")

# Main execution
async def main():
    tester = ImprovedWorkflowTester()
    await tester.run_improved_workflow_tests()

if __name__ == "__main__":
    asyncio.run(main()) 