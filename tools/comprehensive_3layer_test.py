#!/usr/bin/env python3
"""
COMPREHENSIVE 3-Layer Testing for ALL Forms
Tests visitor, user, and admin forms systematically
"""

import asyncio
import json
import requests
import time
from playwright.async_api import async_playwright

class Comprehensive3LayerTester:
    def __init__(self, base_url="http://localhost:3000"):
        self.base_url = base_url
        self.results = {
            "visitor_forms": {},
            "user_forms": {},
            "admin_forms": {},
            "summary": {}
        }
        self.admin_session = None
        self.user_session = None
    
    def test_api_layer(self, endpoint, data, method="POST", headers=None):
        """Layer 1: Direct API testing"""
        try:
            url = f"{self.base_url}/api/{endpoint}"
            if method == "POST":
                response = requests.post(url, json=data, headers=headers, timeout=10)
            elif method == "GET":
                response = requests.get(url, headers=headers, timeout=10)
            elif method == "PATCH":
                response = requests.patch(url, json=data, headers=headers, timeout=10)
            
            return {
                "status": response.status_code,
                "success": response.status_code in [200, 201],
                "data": response.json() if response.headers.get('content-type', '').startswith('application/json') else response.text,
                "error": None
            }
        except Exception as e:
            return {
                "status": 0,
                "success": False,
                "data": None,
                "error": str(e)
            }
    
    async def login_admin(self, browser):
        """Helper: Login as admin and get session"""
        context = await browser.new_context()
        page = await context.new_page()
        
        try:
            await page.goto(f"{self.base_url}/login")
            await page.wait_for_load_state('networkidle')
            
            # Fill login form
            await page.fill('input[type="email"]', 'admin@newsteps.fit')
            await page.fill('input[type="password"]', 'Admin123!')
            await page.click('button[type="submit"]')
            
            await page.wait_for_timeout(3000)
            
            # Get session cookies
            cookies = await context.cookies()
            session_cookie = None
            for cookie in cookies:
                if 'session' in cookie['name'].lower():
                    session_cookie = f"{cookie['name']}={cookie['value']}"
                    break
            
            self.admin_session = session_cookie
            return context, page
            
        except Exception as e:
            await context.close()
            raise e
    
    async def test_form_integration(self, browser, form_url, form_data, success_indicators, auth_context=None):
        """Layer 2: Form integration testing"""
        if auth_context:
            context, page = auth_context
        else:
            context = await browser.new_context()
            page = await context.new_page()
        
        try:
            await page.goto(form_url)
            await page.wait_for_load_state('networkidle')
            
            # Handle modal forms (like money donation)
            if 'get-involved' in form_url and 'donate' in str(form_data):
                donate_buttons = page.locator('button:has-text("Get Started")')
                if await donate_buttons.count() >= 2:
                    await donate_buttons.nth(1).click()  # Financial Support
                    await page.wait_for_timeout(2000)
            
            # Fill form fields
            for field, value in form_data.items():
                try:
                    selectors = [
                        f'input[id="{field}"]',
                        f'input[name="{field}"]',
                        f'textarea[id="{field}"]',
                        f'textarea[name="{field}"]',
                        f'select[name="{field}"]'
                    ]
                    
                    filled = False
                    for selector in selectors:
                        if await page.locator(selector).count() > 0:
                            element = page.locator(selector).first
                            if await element.get_attribute('readonly') is None:
                                await element.fill(str(value))
                                filled = True
                                break
                    
                    if not filled:
                        print(f"⚠️ Could not fill field: {field}")
                        
                except Exception as e:
                    print(f"⚠️ Error filling {field}: {e}")
            
            # Submit form
            submit_selectors = [
                'button[type="submit"]',
                'button:has-text("Submit")',
                'button:has-text("Save")',
                'button:has-text("Add")',
                'button:has-text("Update")',
                'button:has-text("Create")'
            ]
            
            submitted = False
            for selector in submit_selectors:
                if await page.locator(selector).count() > 0:
                    await page.click(selector)
                    submitted = True
                    break
            
            if not submitted:
                return {
                    "success": False,
                    "error": "Could not find submit button",
                    "reference_id": None
                }
            
            await page.wait_for_timeout(5000)
            
            # Check for success
            success = False
            reference_id = None
            error_message = None
            
            for indicator in success_indicators:
                if await page.locator(indicator).count() > 0:
                    success = True
                    # Try to extract reference ID
                    try:
                        ref_patterns = [
                            'text=/[A-Z]{2,3}-[A-Z]{4}-\\d{4}/',
                            'text=/REQ-\\d{8}-[A-Z0-9]{4}/',
                            'text="success"',
                            'text="Success"'
                        ]
                        for pattern in ref_patterns:
                            if await page.locator(pattern).count() > 0:
                                reference_id = await page.locator(pattern).first.text_content()
                                break
                    except:
                        pass
                    break
            
            return {
                "success": success,
                "error": error_message,
                "reference_id": reference_id,
                "page_url": page.url
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": f"Integration test error: {str(e)}",
                "reference_id": None
            }
        finally:
            if not auth_context:
                await context.close()
    
    async def test_visitor_forms(self, browser):
        """Test all visitor/public forms"""
        print("🧪 **TESTING VISITOR FORMS**\n")
        
        forms = [
            {
                "name": "Volunteer Form",
                "api_endpoint": "volunteers",
                "form_url": f"{self.base_url}/volunteer",
                "api_data": {
                    "firstName": "Vol",
                    "lastName": "API",
                    "email": "volapi@example.com",
                    "phone": "5551234567",
                    "city": "API City",
                    "state": "CA",
                    "availability": "weekly",
                    "interests": ["collection", "sorting"],
                    "skills": "API testing skills",
                    "message": "API volunteer test"
                },
                "form_data": {
                    "firstName": "Vol",
                    "lastName": "Integration",
                    "email": "volint@example.com",
                    "phone": "5551234567",
                    "city": "Integration City",
                    "state": "CA",
                    "skills": "Integration testing",
                    "message": "Integration volunteer test"
                },
                "success_indicators": [
                    'text="Thank you"',
                    'text="Success"',
                    'text="submitted"'
                ]
            },
            {
                "name": "Partnership Form",
                "api_endpoint": "contact",  # Partnership uses contact API
                "form_url": f"{self.base_url}/get-involved",
                "api_data": {
                    "firstName": "Partner",
                    "lastName": "API",
                    "email": "partnerapi@example.com",
                    "phone": "5551234567",
                    "subject": "Partnership Inquiry",
                    "message": "API partnership test"
                },
                "form_data": {
                    "firstName": "Partner",
                    "lastName": "Integration",
                    "email": "partnerint@example.com",
                    "phone": "5551234567",
                    "subject": "Partnership Integration Test",
                    "message": "Integration partnership test"
                },
                "success_indicators": [
                    'text="Thank you"',
                    'text="Success"',
                    'text="sent"'
                ]
            }
        ]
        
        for form in forms:
            print(f"Testing {form['name']}...")
            
            # API Layer
            api_result = self.test_api_layer(form['api_endpoint'], form['api_data'])
            print(f"  API: {'✅ PASS' if api_result['success'] else '❌ FAIL'} - Status: {api_result['status']}")
            
            # Integration Layer
            if form['name'] == "Partnership Form":
                # Partnership form is in modal, need special handling
                integration_result = await self.test_partnership_modal(browser, form['form_url'], form['form_data'], form['success_indicators'])
            else:
                integration_result = await self.test_form_integration(browser, form['form_url'], form['form_data'], form['success_indicators'])
            
            print(f"  Integration: {'✅ PASS' if integration_result['success'] else '❌ FAIL'}")
            if integration_result['error']:
                print(f"    Error: {integration_result['error']}")
            
            self.results["visitor_forms"][form['name']] = {
                "api": api_result,
                "integration": integration_result
            }
            print()
    
    async def test_partnership_modal(self, browser, form_url, form_data, success_indicators):
        """Special handler for partnership form in modal"""
        context = await browser.new_context()
        page = await context.new_page()
        
        try:
            await page.goto(form_url)
            await page.wait_for_load_state('networkidle')
            
            # Click "Get Started" for Partnership (3rd card)
            partner_buttons = page.locator('button:has-text("Get Started")')
            if await partner_buttons.count() >= 3:
                await partner_buttons.nth(2).click()  # Partnership is 3rd
                await page.wait_for_timeout(2000)
            
            # Fill partnership form
            for field, value in form_data.items():
                try:
                    selectors = [f'input[id="{field}"]', f'textarea[id="{field}"]']
                    for selector in selectors:
                        if await page.locator(selector).count() > 0:
                            await page.fill(selector, str(value))
                            break
                except Exception as e:
                    print(f"⚠️ Error filling {field}: {e}")
            
            # Submit
            submit_button = page.locator('button[type="submit"]')
            if await submit_button.count() > 0:
                await submit_button.click()
                await page.wait_for_timeout(5000)
            
            # Check success
            success = False
            for indicator in success_indicators:
                if await page.locator(indicator).count() > 0:
                    success = True
                    break
            
            return {
                "success": success,
                "error": None if success else "Form submission failed",
                "reference_id": None
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": f"Partnership modal error: {str(e)}",
                "reference_id": None
            }
        finally:
            await context.close()
    
    async def test_user_forms(self, browser):
        """Test authenticated user forms"""
        print("🧪 **TESTING USER FORMS**\n")
        
        # Test Registration Form
        print("Testing User Registration...")
        reg_api_data = {
            "firstName": "User",
            "lastName": "API",
            "email": "userapi@example.com",
            "password": "TestPass123!",
            "phone": "5551234567"
        }
        
        reg_api_result = self.test_api_layer("auth/register", reg_api_data)
        print(f"  API: {'✅ PASS' if reg_api_result['success'] else '❌ FAIL'} - Status: {reg_api_result['status']}")
        
        # Integration test for registration
        reg_form_data = {
            "firstName": "User",
            "lastName": "Integration",
            "email": "userint@example.com",
            "password": "TestPass123!",
            "confirmPassword": "TestPass123!",
            "phone": "5551234567"
        }
        
        reg_integration_result = await self.test_form_integration(
            browser,
            f"{self.base_url}/register",
            reg_form_data,
            ['text="Success"', 'text="registered"', 'text="account"']
        )
        
        print(f"  Integration: {'✅ PASS' if reg_integration_result['success'] else '❌ FAIL'}")
        
        self.results["user_forms"]["Registration"] = {
            "api": reg_api_result,
            "integration": reg_integration_result
        }
        print()
    
    async def test_admin_forms(self, browser):
        """Test admin forms"""
        print("🧪 **TESTING ADMIN FORMS**\n")
        
        # Login as admin first
        try:
            admin_context, admin_page = await self.login_admin(browser)
            print("✅ Admin login successful")
        except Exception as e:
            print(f"❌ Admin login failed: {e}")
            return
        
        # Test Add Shoe Form
        print("Testing Add Shoe to Inventory...")
        
        shoe_api_data = {
            "brand": "Nike",
            "modelName": "API Test",
            "size": "10",
            "gender": "men",
            "sport": "basketball",
            "condition": "good",
            "color": "black",
            "description": "API test shoe",
            "status": "available"
        }
        
        # API test with admin session
        headers = {"Cookie": self.admin_session} if self.admin_session else None
        shoe_api_result = self.test_api_layer("admin/shoes", shoe_api_data, headers=headers)
        print(f"  API: {'✅ PASS' if shoe_api_result['success'] else '❌ FAIL'} - Status: {shoe_api_result['status']}")
        
        # Integration test
        shoe_form_data = {
            "brand": "Adidas",
            "modelName": "Integration Test",
            "size": "9",
            "color": "white",
            "description": "Integration test shoe"
        }
        
        shoe_integration_result = await self.test_form_integration(
            browser,
            f"{self.base_url}/admin/shoes/add",
            shoe_form_data,
            ['text="Success"', 'text="added"', 'text="created"'],
            auth_context=(admin_context, admin_page)
        )
        
        print(f"  Integration: {'✅ PASS' if shoe_integration_result['success'] else '❌ FAIL'}")
        
        self.results["admin_forms"]["Add Shoe"] = {
            "api": shoe_api_result,
            "integration": shoe_integration_result
        }
        
        await admin_context.close()
        print()
    
    async def run_comprehensive_tests(self):
        """Run all comprehensive 3-layer tests"""
        print("🎯 **COMPREHENSIVE 3-LAYER TESTING FOR ALL FORMS**\n")
        
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            
            # Test all form categories
            await self.test_visitor_forms(browser)
            await self.test_user_forms(browser)
            await self.test_admin_forms(browser)
            
            await browser.close()
        
        # Generate summary
        self.generate_summary()
        return self.results
    
    def generate_summary(self):
        """Generate comprehensive test summary"""
        total_tests = 0
        passed_tests = 0
        
        for category, forms in self.results.items():
            if category != "summary":
                for form_name, layers in forms.items():
                    for layer_name, result in layers.items():
                        if result:
                            total_tests += 1
                            if result.get('success', False):
                                passed_tests += 1
        
        success_rate = (passed_tests / total_tests * 100) if total_tests > 0 else 0
        
        self.results["summary"] = {
            "total_tests": total_tests,
            "passed": passed_tests,
            "failed": total_tests - passed_tests,
            "success_rate": f"{success_rate:.1f}%",
            "status": "✅ EXCELLENT" if success_rate >= 90 else "⚠️ NEEDS ATTENTION" if success_rate >= 70 else "❌ CRITICAL ISSUES"
        }
        
        print(f"🎯 **COMPREHENSIVE TESTING SUMMARY**")
        print(f"Total Tests: {total_tests}")
        print(f"Passed: {passed_tests}")
        print(f"Failed: {total_tests - passed_tests}")
        print(f"Success Rate: {success_rate:.1f}%")
        print(f"Status: {self.results['summary']['status']}")

async def main():
    """Run comprehensive 3-layer testing"""
    tester = Comprehensive3LayerTester()
    results = await tester.run_comprehensive_tests()
    
    # Print detailed results
    print(f"\n📊 **DETAILED RESULTS BY CATEGORY:**")
    for category, forms in results.items():
        if category != "summary":
            print(f"\n{category.upper().replace('_', ' ')}:")
            for form_name, layers in forms.items():
                print(f"  {form_name}:")
                for layer_name, result in layers.items():
                    if result:
                        status = "✅ PASS" if result.get('success', False) else "❌ FAIL"
                        print(f"    {layer_name}: {status}")
                        if result.get('error'):
                            print(f"      Error: {result['error']}")

if __name__ == "__main__":
    asyncio.run(main())
