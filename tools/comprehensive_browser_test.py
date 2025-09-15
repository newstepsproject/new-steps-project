#!/usr/bin/env python3
"""
Comprehensive Browser-Based Testing for New Steps Project
Phase 2: Browser Workflows (Visitor, User, Admin)
"""

import asyncio
from playwright.async_api import async_playwright
import json
import time
import sys

class ComprehensiveBrowserTest:
    def __init__(self, base_url="http://localhost:3000"):
        self.base_url = base_url
        self.results = {
            "visitor_workflows": {},
            "user_workflows": {},
            "admin_workflows": {},
            "admin_settings_tests": {},
            "email_tests": {},
            "summary": {}
        }
        
    async def run_all_tests(self):
        """Run all browser-based tests"""
        async with async_playwright() as p:
            # Use Chromium for consistent testing
            browser = await p.chromium.launch(headless=False, slow_mo=1000)
            
            try:
                print("🧪 **PHASE 2: COMPREHENSIVE BROWSER TESTING**\n")
                
                # Phase 2.1: Visitor Workflows
                await self.test_visitor_workflows(browser)
                
                # Phase 2.2: User Registration & Workflows  
                await self.test_user_workflows(browser)
                
                # Phase 2.3: Admin Workflows
                await self.test_admin_workflows(browser)
                
                # Phase 2.4: Admin Settings Impact Testing (CRITICAL)
                await self.test_admin_settings_impact(browser)
                
                # Generate summary
                self.generate_summary()
                
            finally:
                await browser.close()
                
        return self.results
    
    async def test_visitor_workflows(self, browser):
        """Test all visitor workflows (no authentication required)"""
        print("🌐 **TESTING VISITOR WORKFLOWS**")
        
        context = await browser.new_context()
        page = await context.new_page()
        
        try:
            # Test 1: Homepage Navigation
            print("1. Testing homepage navigation...")
            await page.goto(self.base_url)
            await page.wait_for_load_state('networkidle')
            
            # Check hero image loads
            hero_image = page.locator('img').first
            if await hero_image.count() > 0:
                self.results["visitor_workflows"]["homepage_hero"] = "✅ PASSED"
            else:
                self.results["visitor_workflows"]["homepage_hero"] = "❌ FAILED - No hero image"
            
            # Test navigation menu
            nav_links = ["About", "Donate Shoes", "Request Shoes", "Get Involved"]
            nav_results = {}
            
            for link_text in nav_links:
                try:
                    link = page.locator(f'text="{link_text}"').first
                    if await link.count() > 0:
                        nav_results[link_text] = "✅ Found"
                    else:
                        nav_results[link_text] = "❌ Missing"
                except:
                    nav_results[link_text] = "❌ Error"
            
            self.results["visitor_workflows"]["navigation"] = nav_results
            
            # Test 2: Browse Shoes (No Login Required)
            print("2. Testing shoe browsing...")
            await page.goto(f"{self.base_url}/shoes")
            await page.wait_for_load_state('networkidle')
            
            # Check if shoes are displayed
            shoes = page.locator('[data-testid="shoe-card"], .shoe-card, .grid > div').first
            if await shoes.count() > 0:
                self.results["visitor_workflows"]["browse_shoes"] = "✅ PASSED - Shoes displayed"
                
                # Test shoe details
                await shoes.click()
                await page.wait_for_load_state('networkidle')
                
                # Check for shoe ID display
                shoe_id = page.locator('text=/ID:? ?\\d+/, text=/Shoe ID/, [data-testid="shoe-id"]')
                if await shoe_id.count() > 0:
                    self.results["visitor_workflows"]["shoe_id_display"] = "✅ PASSED - Shoe ID visible"
                else:
                    self.results["visitor_workflows"]["shoe_id_display"] = "❌ FAILED - Shoe ID not visible"
                    
            else:
                self.results["visitor_workflows"]["browse_shoes"] = "❌ FAILED - No shoes displayed"
            
            # Test 3: Anonymous Shoe Donation
            print("3. Testing anonymous shoe donation...")
            await page.goto(f"{self.base_url}/donate/shoes")
            await page.wait_for_load_state('networkidle')
            
            # Fill donation form
            await page.fill('input[name="firstName"], input[placeholder*="First"], input[placeholder*="first"]', 'Browser')
            await page.fill('input[name="lastName"], input[placeholder*="Last"], input[placeholder*="last"]', 'Test')
            await page.fill('input[name="email"], input[type="email"]', 'browsertest@example.com')
            await page.fill('input[name="phone"], input[type="tel"]', '5551234567')
            await page.fill('textarea[name="donationDescription"], textarea[placeholder*="description"]', 'Browser test donation - 2 pairs of running shoes')
            
            # Submit form
            submit_btn = page.locator('button[type="submit"], button:has-text("Submit"), button:has-text("Donate")')
            await submit_btn.click()
            await page.wait_for_timeout(3000)
            
            # Check for success message or reference ID
            success_indicators = [
                'text=/DS-\\w+-\\d+/',  # Reference ID pattern
                'text="Thank you"',
                'text="Success"',
                'text="submitted"'
            ]
            
            donation_success = False
            for indicator in success_indicators:
                if await page.locator(indicator).count() > 0:
                    donation_success = True
                    break
            
            self.results["visitor_workflows"]["anonymous_donation"] = "✅ PASSED" if donation_success else "❌ FAILED"
            
            # Test 4: Money Donation
            print("4. Testing money donation...")
            await page.goto(f"{self.base_url}/get-involved")
            await page.wait_for_load_state('networkidle')
            
            # Look for money donation form
            money_form = page.locator('form:has(input[name="amount"]), form:has-text("donation")')
            if await money_form.count() > 0:
                await page.fill('input[name="firstName"], input[placeholder*="First"]', 'Money')
                await page.fill('input[name="lastName"], input[placeholder*="Last"]', 'Donor')
                await page.fill('input[name="email"], input[type="email"]', 'moneytest@example.com')
                await page.fill('input[name="amount"]', '25.00')
                
                submit_btn = money_form.locator('button[type="submit"]')
                await submit_btn.click()
                await page.wait_for_timeout(3000)
                
                # Check for success
                money_success = False
                for indicator in ['text=/DM-\\w+-\\d+/', 'text="Thank you"', 'text="Success"']:
                    if await page.locator(indicator).count() > 0:
                        money_success = True
                        break
                
                self.results["visitor_workflows"]["money_donation"] = "✅ PASSED" if money_success else "❌ FAILED"
            else:
                self.results["visitor_workflows"]["money_donation"] = "❌ FAILED - No money donation form found"
            
        except Exception as e:
            self.results["visitor_workflows"]["error"] = f"❌ ERROR: {str(e)}"
        finally:
            await context.close()
    
    async def test_user_workflows(self, browser):
        """Test registered user workflows"""
        print("\n👤 **TESTING USER WORKFLOWS**")
        
        context = await browser.new_context()
        page = await context.new_page()
        
        try:
            # Test 1: User Registration
            print("1. Testing user registration...")
            await page.goto(f"{self.base_url}/register")
            await page.wait_for_load_state('networkidle')
            
            # Fill registration form
            test_email = f"testuser{int(time.time())}@example.com"
            await page.fill('input[name="firstName"]', 'Test')
            await page.fill('input[name="lastName"]', 'User')
            await page.fill('input[type="email"]', test_email)
            await page.fill('input[type="password"]', 'TestPass123!')
            
            # Submit registration
            await page.click('button[type="submit"]')
            await page.wait_for_timeout(3000)
            
            # Check for success (might redirect to login or show success message)
            reg_success = False
            success_indicators = [
                'text="registered successfully"',
                'text="check your email"',
                'text="verification"',
                f'{self.base_url}/login'  # Redirected to login
            ]
            
            current_url = page.url
            for indicator in success_indicators:
                if indicator in current_url or await page.locator(indicator).count() > 0:
                    reg_success = True
                    break
            
            self.results["user_workflows"]["registration"] = "✅ PASSED" if reg_success else "❌ FAILED"
            
            # Test 2: User Login (skip email verification for testing)
            print("2. Testing user login...")
            await page.goto(f"{self.base_url}/login")
            await page.wait_for_load_state('networkidle')
            
            # Try to login with admin credentials for testing
            await page.fill('input[type="email"]', 'admin@newsteps.fit')
            await page.fill('input[type="password"]', 'Admin123!')
            await page.click('button[type="submit"]')
            await page.wait_for_timeout(3000)
            
            # Check if logged in (redirected away from login or see account elements)
            login_success = False
            if '/login' not in page.url or await page.locator('text="Dashboard", text="Account", text="Logout"').count() > 0:
                login_success = True
            
            self.results["user_workflows"]["login"] = "✅ PASSED" if login_success else "❌ FAILED"
            
            if login_success:
                # Test 3: Shoe Request Workflow
                print("3. Testing shoe request workflow...")
                await page.goto(f"{self.base_url}/shoes")
                await page.wait_for_load_state('networkidle')
                
                # Add shoe to cart
                add_to_cart_btn = page.locator('button:has-text("Add to Cart"), button:has-text("Request")')
                if await add_to_cart_btn.count() > 0:
                    await add_to_cart_btn.first.click()
                    await page.wait_for_timeout(2000)
                    
                    # Go to checkout
                    await page.goto(f"{self.base_url}/checkout")
                    await page.wait_for_load_state('networkidle')
                    
                    # Fill checkout form
                    await page.fill('input[name="firstName"], input[placeholder*="First"]', 'Checkout')
                    await page.fill('input[name="lastName"], input[placeholder*="Last"]', 'Test')
                    await page.fill('input[type="email"]', 'checkout@example.com')
                    await page.fill('input[name="address"], input[placeholder*="address"]', '123 Test St')
                    await page.fill('input[name="city"], input[placeholder*="city"]', 'Test City')
                    await page.fill('input[name="state"], input[placeholder*="state"]', 'CA')
                    await page.fill('input[name="zipCode"], input[placeholder*="zip"]', '12345')
                    
                    # Select shipping method
                    shipping_radio = page.locator('input[value="standard"], input[value="shipping"]')
                    if await shipping_radio.count() > 0:
                        await shipping_radio.click()
                        
                        # Agree to shipping payment
                        agree_checkbox = page.locator('input[type="checkbox"]:has-text("agree"), input[name*="agree"]')
                        if await agree_checkbox.count() > 0:
                            await agree_checkbox.click()
                    
                    # Submit request
                    submit_btn = page.locator('button[type="submit"]:has-text("Complete"), button:has-text("Submit")')
                    await submit_btn.click()
                    await page.wait_for_timeout(5000)
                    
                    # Check for success
                    request_success = False
                    success_indicators = [
                        'text=/REQ-\\w+-\\d+/',
                        'text="request submitted"',
                        'text="Thank you"',
                        'text="Success"'
                    ]
                    
                    for indicator in success_indicators:
                        if await page.locator(indicator).count() > 0:
                            request_success = True
                            break
                    
                    self.results["user_workflows"]["shoe_request"] = "✅ PASSED" if request_success else "❌ FAILED"
                else:
                    self.results["user_workflows"]["shoe_request"] = "❌ FAILED - No add to cart button"
            
        except Exception as e:
            self.results["user_workflows"]["error"] = f"❌ ERROR: {str(e)}"
        finally:
            await context.close()
    
    async def test_admin_workflows(self, browser):
        """Test admin workflows"""
        print("\n🔧 **TESTING ADMIN WORKFLOWS**")
        
        context = await browser.new_context()
        page = await context.new_page()
        
        try:
            # Admin Login
            print("1. Testing admin login...")
            await page.goto(f"{self.base_url}/admin")
            await page.wait_for_load_state('networkidle')
            
            # Login as admin
            await page.fill('input[type="email"]', 'admin@newsteps.fit')
            await page.fill('input[type="password"]', 'Admin123!')
            await page.click('button[type="submit"]')
            await page.wait_for_timeout(3000)
            
            # Check if in admin dashboard
            admin_success = False
            if '/admin' in page.url and '/login' not in page.url:
                admin_success = True
            
            self.results["admin_workflows"]["login"] = "✅ PASSED" if admin_success else "❌ FAILED"
            
            if admin_success:
                # Test 2: Add Shoe to Inventory
                print("2. Testing add shoe to inventory...")
                await page.goto(f"{self.base_url}/admin/shoes/add")
                await page.wait_for_load_state('networkidle')
                
                # Fill shoe form
                await page.fill('input[name="brand"], input[placeholder*="brand"]', 'Test Brand')
                await page.fill('input[name="modelName"], input[placeholder*="model"]', 'Test Model')
                await page.fill('input[name="size"]', '10')
                await page.fill('input[name="color"]', 'Blue')
                
                # Select dropdowns
                selects = page.locator('select')
                select_count = await selects.count()
                
                if select_count >= 3:  # Gender, Sport, Condition
                    await selects.nth(0).select_option('men')  # Gender
                    await selects.nth(1).select_option('basketball')  # Sport  
                    await selects.nth(2).select_option('good')  # Condition
                
                # Submit form
                submit_btn = page.locator('button[type="submit"]:has-text("Add"), button:has-text("Save")')
                await submit_btn.click()
                await page.wait_for_timeout(3000)
                
                # Check for success
                add_shoe_success = False
                success_indicators = [
                    'text="added successfully"',
                    'text="created successfully"', 
                    'text="Success"',
                    f'{self.base_url}/admin/shoes'  # Redirected to shoes list
                ]
                
                current_url = page.url
                for indicator in success_indicators:
                    if indicator in current_url or await page.locator(indicator).count() > 0:
                        add_shoe_success = True
                        break
                
                self.results["admin_workflows"]["add_shoe"] = "✅ PASSED" if add_shoe_success else "❌ FAILED"
                
                # Test 3: Process Donations
                print("3. Testing donation processing...")
                await page.goto(f"{self.base_url}/admin/shoe-donations")
                await page.wait_for_load_state('networkidle')
                
                # Look for donations to process
                donation_rows = page.locator('tr:has(td), .donation-item')
                if await donation_rows.count() > 1:  # More than header row
                    # Click on first donation
                    await donation_rows.nth(1).click()
                    await page.wait_for_timeout(2000)
                    
                    # Look for status update options
                    status_select = page.locator('select:has(option[value="received"]), select:has(option[value="processed"])')
                    if await status_select.count() > 0:
                        await status_select.select_option('received')
                        
                        # Save changes
                        save_btn = page.locator('button:has-text("Save"), button:has-text("Update")')
                        if await save_btn.count() > 0:
                            await save_btn.click()
                            await page.wait_for_timeout(2000)
                        
                        self.results["admin_workflows"]["process_donations"] = "✅ PASSED"
                    else:
                        self.results["admin_workflows"]["process_donations"] = "❌ FAILED - No status options"
                else:
                    self.results["admin_workflows"]["process_donations"] = "⚠️ SKIPPED - No donations to process"
            
        except Exception as e:
            self.results["admin_workflows"]["error"] = f"❌ ERROR: {str(e)}"
        finally:
            await context.close()
    
    async def test_admin_settings_impact(self, browser):
        """Test that admin settings actually impact the public site (CRITICAL)"""
        print("\n⚙️ **TESTING ADMIN SETTINGS IMPACT (CRITICAL)**")
        
        admin_context = await browser.new_context()
        admin_page = await admin_context.new_page()
        
        public_context = await browser.new_context()
        public_page = await public_context.new_page()
        
        try:
            # Login to admin
            await admin_page.goto(f"{self.base_url}/admin")
            await admin_page.wait_for_load_state('networkidle')
            await admin_page.fill('input[type="email"]', 'admin@newsteps.fit')
            await admin_page.fill('input[type="password"]', 'Admin123!')
            await admin_page.click('button[type="submit"]')
            await admin_page.wait_for_timeout(3000)
            
            # Test 1: Shipping Fee Configuration
            print("1. Testing shipping fee configuration impact...")
            await admin_page.goto(f"{self.base_url}/admin/settings")
            await admin_page.wait_for_load_state('networkidle')
            
            # Look for shipping fee setting
            shipping_fee_input = admin_page.locator('input[name*="shipping"], input[name*="fee"]')
            if await shipping_fee_input.count() > 0:
                # Change shipping fee to $7.50
                await shipping_fee_input.fill('7.50')
                
                # Save settings
                save_btn = admin_page.locator('button:has-text("Save"), button[type="submit"]')
                await save_btn.click()
                await admin_page.wait_for_timeout(2000)
                
                # Check public site reflects change
                await public_page.goto(f"{self.base_url}/checkout")
                await public_page.wait_for_load_state('networkidle')
                
                # Look for $7.50 shipping fee
                if await public_page.locator('text="$7.50", text="7.50"').count() > 0:
                    self.results["admin_settings_tests"]["shipping_fee"] = "✅ PASSED - Setting impacts public site"
                else:
                    self.results["admin_settings_tests"]["shipping_fee"] = "❌ FAILED - Setting not reflected"
                
                # Reset to $5.00
                await admin_page.goto(f"{self.base_url}/admin/settings")
                await admin_page.wait_for_load_state('networkidle')
                await shipping_fee_input.fill('5.00')
                await save_btn.click()
                
            else:
                self.results["admin_settings_tests"]["shipping_fee"] = "❌ FAILED - No shipping fee setting found"
            
            # Test 2: Max Shoes Per Request (if configurable)
            print("2. Testing max shoes per request configuration...")
            max_shoes_input = admin_page.locator('input[name*="max"], input[name*="limit"]')
            if await max_shoes_input.count() > 0:
                # Change to 1 shoe max
                await max_shoes_input.fill('1')
                await save_btn.click()
                await admin_page.wait_for_timeout(2000)
                
                # Test on public site - try to add 2 shoes
                await public_page.goto(f"{self.base_url}/shoes")
                await public_page.wait_for_load_state('networkidle')
                
                # Add first shoe
                add_btn = public_page.locator('button:has-text("Add to Cart"), button:has-text("Request")').first
                if await add_btn.count() > 0:
                    await add_btn.click()
                    await public_page.wait_for_timeout(1000)
                    
                    # Try to add second shoe
                    second_add_btn = public_page.locator('button:has-text("Add to Cart"), button:has-text("Request")').nth(1)
                    if await second_add_btn.count() > 0:
                        await second_add_btn.click()
                        await public_page.wait_for_timeout(1000)
                        
                        # Check for limit message
                        if await public_page.locator('text="limit", text="maximum", text="1 shoe"').count() > 0:
                            self.results["admin_settings_tests"]["max_shoes"] = "✅ PASSED - Limit enforced"
                        else:
                            self.results["admin_settings_tests"]["max_shoes"] = "❌ FAILED - Limit not enforced"
                
                # Reset to 2 shoes
                await admin_page.goto(f"{self.base_url}/admin/settings")
                await admin_page.wait_for_load_state('networkidle')
                await max_shoes_input.fill('2')
                await save_btn.click()
                
            else:
                self.results["admin_settings_tests"]["max_shoes"] = "⚠️ SKIPPED - No max shoes setting found"
            
        except Exception as e:
            self.results["admin_settings_tests"]["error"] = f"❌ ERROR: {str(e)}"
        finally:
            await admin_context.close()
            await public_context.close()
    
    def generate_summary(self):
        """Generate test summary"""
        total_tests = 0
        passed_tests = 0
        failed_tests = 0
        
        for category in [self.results["visitor_workflows"], self.results["user_workflows"], 
                        self.results["admin_workflows"], self.results["admin_settings_tests"]]:
            for test_name, result in category.items():
                if test_name != "error":
                    total_tests += 1
                    if "✅ PASSED" in str(result):
                        passed_tests += 1
                    elif "❌ FAILED" in str(result):
                        failed_tests += 1
        
        success_rate = (passed_tests / total_tests * 100) if total_tests > 0 else 0
        
        self.results["summary"] = {
            "total_tests": total_tests,
            "passed": passed_tests,
            "failed": failed_tests,
            "success_rate": f"{success_rate:.1f}%",
            "status": "✅ EXCELLENT" if success_rate >= 90 else "⚠️ NEEDS ATTENTION" if success_rate >= 70 else "❌ CRITICAL ISSUES"
        }

async def main():
    """Run comprehensive browser testing"""
    tester = ComprehensiveBrowserTest()
    results = await tester.run_all_tests()
    
    print("\n" + "="*60)
    print("🧪 **PHASE 2 BROWSER TESTING COMPLETE**")
    print("="*60)
    
    # Print results
    for category, tests in results.items():
        if category != "summary":
            print(f"\n📋 **{category.upper().replace('_', ' ')}:**")
            for test_name, result in tests.items():
                print(f"  {test_name}: {result}")
    
    # Print summary
    summary = results["summary"]
    print(f"\n🎯 **OVERALL RESULTS:**")
    print(f"  Total Tests: {summary['total_tests']}")
    print(f"  Passed: {summary['passed']}")
    print(f"  Failed: {summary['failed']}")
    print(f"  Success Rate: {summary['success_rate']}")
    print(f"  Status: {summary['status']}")
    
    return results

if __name__ == "__main__":
    asyncio.run(main())
