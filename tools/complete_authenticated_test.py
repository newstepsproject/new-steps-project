#!/usr/bin/env python3
"""
Complete Authenticated Testing Suite
Tests ALL forms including authenticated user and admin forms
Using Enhanced 4-Layer Testing Methodology with Authentication
"""

import asyncio
import json
import requests
import time
from datetime import datetime
from playwright.async_api import async_playwright
from typing import Dict, List, Any, Optional

class CompleteAuthenticatedTester:
    def __init__(self, base_url: str = "http://localhost:3000"):
        self.base_url = base_url
        self.results = {
            "timestamp": datetime.now().isoformat(),
            "base_url": base_url,
            "authentication": {},
            "user_forms": {},
            "admin_forms": {},
            "summary": {}
        }
        
    async def run_complete_tests(self):
        """Execute comprehensive testing including all authenticated forms"""
        print("🎯 STARTING COMPLETE AUTHENTICATED TESTING")
        print("=" * 80)
        
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            
            # Test User Authentication & Forms
            print("👤 TESTING USER AUTHENTICATION & FORMS")
            await self.test_user_authentication_and_forms(browser)
            
            # Test Admin Authentication & Forms  
            print("\n🔐 TESTING ADMIN AUTHENTICATION & FORMS")
            await self.test_admin_authentication_and_forms(browser)
            
            await browser.close()
        
        # Generate Summary
        self.generate_summary()
        self.save_results()
        
        return self.results
    
    async def test_user_authentication_and_forms(self, browser):
        """Test user login and all user-accessible forms"""
        
        # Step 1: Create test user account
        user_context = await browser.new_context()
        user_page = await user_context.new_page()
        
        try:
            # Register a test user
            test_user = {
                "firstName": "Test",
                "lastName": "User",
                "email": "testuser@example.com",
                "password": "TestPassword123!",
                "confirmPassword": "TestPassword123!"
            }
            
            print("📝 Registering test user...")
            await user_page.goto(f"{self.base_url}/register")
            await user_page.wait_for_load_state('networkidle')
            
            # Fill registration form with multiple selector strategies
            form_fields = [
                ("firstName", test_user["firstName"]),
                ("lastName", test_user["lastName"]),
                ("email", test_user["email"]),
                ("password", test_user["password"]),
                ("confirmPassword", test_user["confirmPassword"])
            ]
            
            for field_name, value in form_fields:
                selectors = [f'input[name="{field_name}"]', f'input[id="{field_name}"]']
                filled = False
                for selector in selectors:
                    try:
                        if await user_page.locator(selector).count() > 0:
                            await user_page.fill(selector, value)
                            filled = True
                            break
                    except:
                        continue
                if not filled:
                    print(f"⚠️ Could not fill registration field: {field_name}")
            
            # Submit registration
            await user_page.click('button[type="submit"]')
            await user_page.wait_for_timeout(3000)
            
            # Check if registration successful (might redirect to login or show success)
            current_url = user_page.url
            page_content = await user_page.content()
            registration_success = "/login" in current_url or "success" in page_content.lower()
            
            self.results["authentication"]["user_registration"] = {
                "success": registration_success,
                "email": test_user["email"]
            }
            
            # Step 2: Login as user
            print("🔑 Logging in as user...")
            if "/login" not in current_url:
                await user_page.goto(f"{self.base_url}/login")
                await user_page.wait_for_load_state('networkidle')
            
            # Fill login form with multiple selector strategies
            email_selectors = ['input[name="email"]', 'input[type="email"]', 'input[id="email"]']
            password_selectors = ['input[name="password"]', 'input[type="password"]', 'input[id="password"]']
            
            # Fill email
            for selector in email_selectors:
                try:
                    if await user_page.locator(selector).count() > 0:
                        await user_page.fill(selector, test_user["email"])
                        break
                except:
                    continue
            
            # Fill password
            for selector in password_selectors:
                try:
                    if await user_page.locator(selector).count() > 0:
                        await user_page.fill(selector, test_user["password"])
                        break
                except:
                    continue
            await user_page.click('button[type="submit"]')
            await user_page.wait_for_timeout(3000)
            
            # Verify login success
            login_success = "/account" in user_page.url or "dashboard" in user_page.url.lower()
            
            self.results["authentication"]["user_login"] = {
                "success": login_success,
                "final_url": user_page.url
            }
            
            if login_success:
                print("✅ User login successful")
                
                # Step 3: Test user forms
                await self.test_user_forms(user_page)
            else:
                print("❌ User login failed")
                
        except Exception as e:
            print(f"❌ User authentication error: {str(e)}")
            self.results["authentication"]["user_error"] = str(e)
        finally:
            await user_context.close()
    
    async def test_user_forms(self, page):
        """Test all forms available to authenticated users"""
        
        user_forms = [
            {
                "name": "checkout_form",
                "url": "/checkout",
                "description": "Complete checkout process",
                "setup": self.setup_cart_for_checkout
            },
            {
                "name": "account_profile_update",
                "url": "/account",
                "description": "Update user profile information",
                "fields": {
                    "firstName": "Updated",
                    "lastName": "User",
                    "email": "updated@example.com"
                }
            }
        ]
        
        for form_config in user_forms:
            await self.test_authenticated_form(page, form_config, "user")
    
    async def setup_cart_for_checkout(self, page):
        """Add items to cart before testing checkout"""
        try:
            # Go to shoes page and add items to cart
            await page.goto(f"{self.base_url}/shoes")
            await page.wait_for_load_state('networkidle')
            
            # Add first available shoe to cart
            add_buttons = page.locator('button:has-text("Add to Cart"), button:has-text("Request These Shoes")')
            if await add_buttons.count() > 0:
                await add_buttons.first.click()
                await page.wait_for_timeout(2000)
                print("✅ Added item to cart for checkout test")
                return True
            else:
                print("❌ No shoes available to add to cart")
                return False
        except Exception as e:
            print(f"❌ Cart setup error: {str(e)}")
            return False
    
    async def test_admin_authentication_and_forms(self, browser):
        """Test admin login and all admin forms"""
        
        admin_context = await browser.new_context()
        admin_page = await admin_context.new_page()
        
        try:
            # Login as admin
            print("🔑 Logging in as admin...")
            await admin_page.goto(f"{self.base_url}/admin")
            await admin_page.wait_for_load_state('networkidle')
            
            # Should redirect to login
            if "/login" not in admin_page.url:
                await admin_page.goto(f"{self.base_url}/login")
                await admin_page.wait_for_load_state('networkidle')
            
            # Use admin credentials
            admin_credentials = {
                "email": "admin@newsteps.fit",
                "password": "Admin123!"
            }
            
            # Try multiple selector strategies for login form
            email_selectors = ['input[name="email"]', 'input[type="email"]', 'input[id="email"]']
            password_selectors = ['input[name="password"]', 'input[type="password"]', 'input[id="password"]']
            
            # Fill email
            email_filled = False
            for selector in email_selectors:
                try:
                    if await admin_page.locator(selector).count() > 0:
                        await admin_page.fill(selector, admin_credentials["email"])
                        email_filled = True
                        break
                except:
                    continue
            
            # Fill password
            password_filled = False
            for selector in password_selectors:
                try:
                    if await admin_page.locator(selector).count() > 0:
                        await admin_page.fill(selector, admin_credentials["password"])
                        password_filled = True
                        break
                except:
                    continue
            
            if not email_filled or not password_filled:
                print(f"❌ Could not find login form fields. Email filled: {email_filled}, Password filled: {password_filled}")
                self.results["authentication"]["admin_login"] = {
                    "success": False,
                    "error": "Login form fields not found"
                }
                return
            await admin_page.click('button[type="submit"]')
            await admin_page.wait_for_timeout(3000)
            
            # Verify admin login success
            admin_login_success = "/admin" in admin_page.url
            
            self.results["authentication"]["admin_login"] = {
                "success": admin_login_success,
                "final_url": admin_page.url
            }
            
            if admin_login_success:
                print("✅ Admin login successful")
                
                # Test admin forms
                await self.test_admin_forms(admin_page)
            else:
                print("❌ Admin login failed")
                
        except Exception as e:
            print(f"❌ Admin authentication error: {str(e)}")
            self.results["authentication"]["admin_error"] = str(e)
        finally:
            await admin_context.close()
    
    async def test_admin_forms(self, page):
        """Test all admin dashboard forms"""
        
        admin_forms = [
            {
                "name": "add_shoe_form",
                "url": "/admin/shoes/add",
                "description": "Add new shoe to inventory",
                "fields": {
                    "brand": "Nike",
                    "modelName": "Test Shoe",
                    "size": "10",
                    "color": "Black",
                    "sport": "running",
                    "condition": "good",
                    "description": "Test shoe for automated testing"
                }
            },
            {
                "name": "admin_settings_form",
                "url": "/admin/settings",
                "description": "Update system settings",
                "fields": {
                    "maxShoesPerRequest": "2",
                    "shippingFee": "5.00"
                }
            },
            {
                "name": "add_money_donation_form",
                "url": "/admin/money-donations/add",
                "description": "Add money donation record",
                "fields": {
                    "firstName": "Test",
                    "lastName": "Donor",
                    "email": "donor@example.com",
                    "amount": "25.00",
                    "paymentMethod": "cash"
                }
            },
            {
                "name": "add_shoe_donation_form",
                "url": "/admin/shoe-donations/add",
                "description": "Add shoe donation record",
                "fields": {
                    "firstName": "Test",
                    "lastName": "Donor",
                    "email": "donor@example.com",
                    "numberOfShoes": "2",
                    "donationDescription": "Test donation via admin"
                }
            },
            {
                "name": "add_request_form",
                "url": "/admin/requests/add",
                "description": "Create request on behalf of user",
                "fields": {
                    "userEmail": "testuser@example.com",
                    "notes": "Admin-created test request"
                }
            }
        ]
        
        for form_config in admin_forms:
            await self.test_authenticated_form(page, form_config, "admin")
    
    async def test_authenticated_form(self, page, form_config, user_type):
        """Test individual authenticated form"""
        try:
            name = form_config["name"]
            url = form_config["url"]
            description = form_config.get("description", "")
            
            print(f"🧪 Testing {name}: {description}")
            
            # Setup if needed
            if "setup" in form_config:
                setup_success = await form_config["setup"](page)
                if not setup_success:
                    self.results[f"{user_type}_forms"][name] = {
                        "success": False,
                        "error": "Setup failed"
                    }
                    return
            
            # Navigate to form
            await page.goto(f"{self.base_url}{url}")
            await page.wait_for_load_state('networkidle')
            await page.wait_for_timeout(2000)
            
            # Check if form is accessible
            page_content = await page.content()
            if "login" in page.url.lower() or "unauthorized" in page_content.lower():
                print(f"❌ {name}: Access denied")
                self.results[f"{user_type}_forms"][name] = {
                    "success": False,
                    "error": "Access denied"
                }
                return
            
            success = False
            
            # Fill form fields if provided
            fields = form_config.get("fields", {})
            if fields:
                for field_name, value in fields.items():
                    # Try multiple selector strategies
                    selectors = [
                        f'input[name="{field_name}"]',
                        f'input[id="{field_name}"]',
                        f'textarea[name="{field_name}"]',
                        f'textarea[id="{field_name}"]',
                        f'select[name="{field_name}"]'
                    ]
                    
                    filled = False
                    for selector in selectors:
                        try:
                            element = page.locator(selector)
                            if await element.count() > 0:
                                if selector.startswith('select'):
                                    # Handle select dropdown
                                    await element.select_option(str(value))
                                else:
                                    # Handle input/textarea
                                    await element.fill(str(value))
                                filled = True
                                break
                        except:
                            continue
                    
                    if not filled:
                        print(f"   ⚠️ Could not fill field: {field_name}")
                
                # Submit form
                submit_selectors = [
                    'button[type="submit"]',
                    'button:has-text("Save")',
                    'button:has-text("Submit")',
                    'button:has-text("Add")',
                    'button:has-text("Update")'
                ]
                
                for submit_selector in submit_selectors:
                    submit_button = page.locator(submit_selector)
                    if await submit_button.count() > 0:
                        await submit_button.click()
                        await page.wait_for_timeout(5000)
                        break
                
                # Check for success indicators
                content = await page.content()
                success_keywords = ["success", "saved", "added", "updated", "created", "submitted"]
                success = any(keyword in content.lower() for keyword in success_keywords)
                
                # Also check for redirect to list page (common admin pattern)
                if not success and url.endswith("/add"):
                    list_url = url.replace("/add", "")
                    success = list_url in page.url
            else:
                # Just check if form loads
                form_elements = page.locator('form, input, textarea, select')
                success = await form_elements.count() > 0
            
            print(f"{'✅' if success else '❌'} {name}: {'Success' if success else 'Failed'}")
            
            self.results[f"{user_type}_forms"][name] = {
                "url": url,
                "description": description,
                "success": success,
                "fields_tested": len(fields) if fields else 0
            }
            
        except Exception as e:
            print(f"❌ {name}: Error - {str(e)}")
            self.results[f"{user_type}_forms"][name] = {
                "url": url,
                "success": False,
                "error": str(e)
            }
    
    def generate_summary(self):
        """Generate comprehensive test summary"""
        auth_tests = len(self.results["authentication"])
        user_tests = len(self.results["user_forms"])
        admin_tests = len(self.results["admin_forms"])
        
        total_tests = auth_tests + user_tests + admin_tests
        
        # Count successes
        auth_passed = sum(1 for test in self.results["authentication"].values() 
                         if isinstance(test, dict) and test.get("success", False))
        user_passed = sum(1 for test in self.results["user_forms"].values() 
                         if test.get("success", False))
        admin_passed = sum(1 for test in self.results["admin_forms"].values() 
                          if test.get("success", False))
        
        total_passed = auth_passed + user_passed + admin_passed
        
        overall_success_rate = (total_passed / total_tests * 100) if total_tests > 0 else 0
        
        self.results["summary"] = {
            "total_tests": total_tests,
            "total_passed": total_passed,
            "total_failed": total_tests - total_passed,
            "overall_success_rate": overall_success_rate,
            "authentication": {
                "total": auth_tests,
                "passed": auth_passed,
                "success_rate": (auth_passed / auth_tests * 100) if auth_tests > 0 else 0
            },
            "user_forms": {
                "total": user_tests,
                "passed": user_passed,
                "success_rate": (user_passed / user_tests * 100) if user_tests > 0 else 0
            },
            "admin_forms": {
                "total": admin_tests,
                "passed": admin_passed,
                "success_rate": (admin_passed / admin_tests * 100) if admin_tests > 0 else 0
            }
        }
        
        # Print summary
        print("\n" + "=" * 80)
        print("📊 COMPLETE AUTHENTICATED TESTING SUMMARY")
        print("=" * 80)
        
        print(f"Authentication Tests:")
        print(f"  ✅ Passed: {auth_passed}")
        print(f"  ❌ Failed: {auth_tests - auth_passed}")
        print(f"  📊 Success Rate: {(auth_passed / auth_tests * 100) if auth_tests > 0 else 0:.1f}%")
        print()
        
        print(f"User Forms:")
        print(f"  ✅ Passed: {user_passed}")
        print(f"  ❌ Failed: {user_tests - user_passed}")
        print(f"  📊 Success Rate: {(user_passed / user_tests * 100) if user_tests > 0 else 0:.1f}%")
        print()
        
        print(f"Admin Forms:")
        print(f"  ✅ Passed: {admin_passed}")
        print(f"  ❌ Failed: {admin_tests - admin_passed}")
        print(f"  📊 Success Rate: {(admin_passed / admin_tests * 100) if admin_tests > 0 else 0:.1f}%")
        print()
        
        print(f"🎯 OVERALL RESULTS:")
        print(f"   Total Tests: {total_tests}")
        print(f"   Passed: {total_passed}")
        print(f"   Failed: {total_tests - total_passed}")
        print(f"   Success Rate: {overall_success_rate:.1f}%")
        
        if overall_success_rate >= 90:
            print("🎉 EXCELLENT: All authenticated forms working perfectly!")
        elif overall_success_rate >= 75:
            print("✅ GOOD: Most authenticated forms working correctly")
        elif overall_success_rate >= 60:
            print("⚠️ MODERATE: Some authenticated forms need attention")
        else:
            print("🚨 CRITICAL: Major issues with authenticated forms")
    
    def save_results(self):
        """Save detailed results to JSON file"""
        filename = f"complete_authenticated_test_results_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        with open(filename, 'w') as f:
            json.dump(self.results, f, indent=2)
        print(f"\n💾 Detailed results saved to: {filename}")

async def main():
    """Main execution function"""
    tester = CompleteAuthenticatedTester()
    await tester.run_complete_tests()

if __name__ == "__main__":
    asyncio.run(main())
