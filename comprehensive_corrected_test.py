#!/usr/bin/env python3
"""
Comprehensive Corrected Form Testing
Uses actual HTML selectors discovered from frontend inspection
"""

import asyncio
import json
import requests
import time
from playwright.async_api import async_playwright

class CorrectedFormTester:
    def __init__(self, base_url="http://localhost:3000"):
        self.base_url = base_url
        self.results = {
            "visitor_forms": {},
            "user_forms": {},
            "admin_forms": {},
            "summary": {}
        }
        self.admin_session = None
    
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
            
            # Use correct selectors from inspection
            await page.fill('input[id="email"]', 'admin@newsteps.fit')
            await page.fill('input[id="password"]', 'Admin123!')
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
    
    async def test_corrected_form_integration(self, browser, form_config, auth_context=None):
        """Layer 2: Form integration testing with corrected selectors"""
        if auth_context:
            context, page = auth_context
        else:
            context = await browser.new_context()
            page = await context.new_page()
        
        try:
            await page.goto(form_config['url'])
            await page.wait_for_load_state('networkidle')
            
            # Handle modal forms
            if form_config.get('is_modal'):
                if form_config.get('modal_trigger') == 'donate':
                    # Money donation modal
                    donate_buttons = page.locator('button:has-text("Get Started")')
                    if await donate_buttons.count() >= 2:
                        await donate_buttons.nth(1).click()  # Financial Support
                        await page.wait_for_timeout(2000)
                elif form_config.get('modal_trigger') == 'partner':
                    # Partnership modal
                    partner_buttons = page.locator('button:has-text("Get Started")')
                    if await partner_buttons.count() >= 3:
                        await partner_buttons.nth(2).click()  # Partnership
                        await page.wait_for_timeout(2000)
            
            # Fill form fields using corrected selectors
            for field_name, field_value in form_config['form_data'].items():
                try:
                    selector = form_config['selectors'].get(field_name)
                    if not selector:
                        print(f"⚠️ No selector found for field: {field_name}")
                        continue
                    
                    element = page.locator(selector).first
                    if await element.count() > 0:
                        # Check if field is readonly
                        readonly = await element.get_attribute('readonly')
                        if readonly is not None:
                            print(f"⚠️ Skipping readonly field: {field_name}")
                            continue
                        
                        # Handle different field types
                        tag_name = await element.evaluate('el => el.tagName.toLowerCase()')
                        if tag_name == 'select':
                            await element.select_option(str(field_value))
                        elif tag_name == 'input':
                            input_type = await element.get_attribute('type') or 'text'
                            if input_type == 'checkbox':
                                if field_value:
                                    await element.check()
                            else:
                                await element.fill(str(field_value))
                        elif tag_name == 'textarea':
                            await element.fill(str(field_value))
                        
                        print(f"✅ Filled {field_name}: {field_value}")
                    else:
                        print(f"⚠️ Element not found for {field_name}: {selector}")
                        
                except Exception as e:
                    print(f"⚠️ Error filling {field_name}: {e}")
            
            # Submit form using corrected selector
            submit_selector = form_config.get('submit_selector', 'button[type="submit"]')
            submit_button = page.locator(submit_selector).first
            
            if await submit_button.count() > 0:
                await submit_button.click()
                await page.wait_for_timeout(5000)
            else:
                return {
                    "success": False,
                    "error": f"Submit button not found: {submit_selector}",
                    "reference_id": None
                }
            
            # Check for success indicators
            success = False
            reference_id = None
            error_message = None
            
            success_indicators = form_config.get('success_indicators', [
                'text="Thank you"',
                'text="Success"',
                'text="submitted"',
                'text="created"'
            ])
            
            for indicator in success_indicators:
                try:
                    if await page.locator(indicator).count() > 0:
                        success = True
                        # Try to extract reference ID
                        ref_patterns = [
                            'text=/[A-Z]{2,3}-[A-Z]{4}-\\d{4}/',
                            'text=/REQ-\\d{8}-[A-Z0-9]{4}/',
                            'text=/VOL-[A-Z0-9]{8}/'
                        ]
                        for pattern in ref_patterns:
                            if await page.locator(pattern).count() > 0:
                                reference_id = await page.locator(pattern).first.text_content()
                                break
                        break
                except Exception as e:
                    print(f"⚠️ Error checking success indicator {indicator}: {e}")
            
            # Check for errors
            error_indicators = [
                'text="Error"',
                'text="Failed"',
                '[role="alert"]',
                '.error'
            ]
            
            for error_indicator in error_indicators:
                try:
                    if await page.locator(error_indicator).count() > 0:
                        error_message = await page.locator(error_indicator).first.text_content()
                        break
                except:
                    pass
            
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
    
    async def run_corrected_comprehensive_tests(self):
        """Run comprehensive tests with corrected selectors"""
        print("🎯 **COMPREHENSIVE CORRECTED FORM TESTING**\n")
        
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            
            # Test Visitor Forms
            print("📋 **TESTING VISITOR FORMS WITH CORRECTED SELECTORS**\n")
            
            visitor_forms = [
                {
                    "name": "Volunteer Form",
                    "api_endpoint": "volunteers",
                    "api_data": {
                        "firstName": "Vol",
                        "lastName": "API",
                        "email": f"volapi{int(time.time())}@example.com",
                        "phone": "5551234567",
                        "city": "API City",
                        "state": "CA",
                        "availability": "weekly",
                        "interests": ["collection", "sorting"],
                        "skills": "API testing skills",
                        "message": "API volunteer test"
                    },
                    "url": f"{self.base_url}/volunteer",
                    "is_modal": False,
                    "form_data": {
                        "firstName": "Vol",
                        "lastName": "Integration",
                        "email": f"volint{int(time.time())}@example.com",
                        "phone": "5551234567",
                        "location": "Integration City, CA",
                        "experience": "Integration testing experience",
                        "message": "Integration volunteer test"
                    },
                    "selectors": {
                        "firstName": "input[name=\"firstName\"]",
                        "lastName": "input[name=\"lastName\"]", 
                        "email": "input[name=\"email\"]",
                        "phone": "input[name=\"phone\"]",
                        "location": "input[name=\"location\"]",
                        "experience": "textarea[name=\"experience\"]",
                        "message": "textarea[name=\"message\"]"
                    },
                    "submit_selector": "button[type=\"submit\"]",
                    "success_indicators": [
                        'text="Thank you"',
                        'text="Success"',
                        'text="submitted"'
                    ]
                },
                {
                    "name": "Contact Form",
                    "api_endpoint": "contact",
                    "api_data": {
                        "firstName": "Contact",
                        "lastName": "API",
                        "email": f"contactapi{int(time.time())}@example.com",
                        "subject": "API Test",
                        "message": "API contact test"
                    },
                    "url": f"{self.base_url}/contact",
                    "is_modal": False,
                    "form_data": {
                        "firstName": "Contact",
                        "lastName": "Integration",
                        "email": f"contactint{int(time.time())}@example.com",
                        "subject": "Integration Test",
                        "message": "Integration contact test"
                    },
                    "selectors": {
                        "firstName": "input[name=\"firstName\"]",
                        "lastName": "input[name=\"lastName\"]",
                        "email": "input[name=\"email\"]",
                        "subject": "input[name=\"subject\"]",
                        "message": "textarea[name=\"message\"]"
                    },
                    "submit_selector": "button[type=\"submit\"]",
                    "success_indicators": [
                        'text="Thank you"',
                        'text="Success"',
                        'text="sent"'
                    ]
                }
            ]
            
            for form_config in visitor_forms:
                print(f"Testing {form_config['name']}...")
                
                # API Layer Test
                api_result = self.test_api_layer(form_config['api_endpoint'], form_config['api_data'])
                print(f"  API: {'✅ PASS' if api_result['success'] else '❌ FAIL'} - Status: {api_result['status']}")
                
                # Integration Layer Test
                integration_result = await self.test_corrected_form_integration(browser, form_config)
                print(f"  Integration: {'✅ PASS' if integration_result['success'] else '❌ FAIL'}")
                if integration_result['reference_id']:
                    print(f"    Reference ID: {integration_result['reference_id']}")
                if integration_result['error']:
                    print(f"    Error: {integration_result['error']}")
                
                self.results["visitor_forms"][form_config['name']] = {
                    "api": api_result,
                    "integration": integration_result
                }
                print()
            
            # Test User Forms
            print("👤 **TESTING USER FORMS WITH CORRECTED SELECTORS**\n")
            
            user_forms = [
                {
                    "name": "Registration Form",
                    "api_endpoint": "auth/register",
                    "api_data": {
                        "firstName": "User",
                        "lastName": "API",
                        "email": f"userapi{int(time.time())}@example.com",
                        "password": "TestPass123!",
                        "phone": "5551234567"
                    },
                    "url": f"{self.base_url}/register",
                    "is_modal": False,
                    "form_data": {
                        "firstName": "User",
                        "lastName": "Integration",
                        "email": f"userint{int(time.time())}@example.com",
                        "password": "TestPass123!",
                        "confirmPassword": "TestPass123!",
                        "phone": "5551234567"
                    },
                    "selectors": {
                        "firstName": "input[name=\"firstName\"]",
                        "lastName": "input[name=\"lastName\"]",
                        "email": "input[name=\"email\"]",
                        "password": "input[name=\"password\"]",
                        "confirmPassword": "input[name=\"confirmPassword\"]",
                        "phone": "input[name=\"phone\"]"
                    },
                    "submit_selector": "button[type=\"submit\"]",
                    "success_indicators": [
                        'text="Success"',
                        'text="registered"',
                        'text="account"'
                    ]
                }
            ]
            
            for form_config in user_forms:
                print(f"Testing {form_config['name']}...")
                
                # API Layer Test
                api_result = self.test_api_layer(form_config['api_endpoint'], form_config['api_data'])
                print(f"  API: {'✅ PASS' if api_result['success'] else '❌ FAIL'} - Status: {api_result['status']}")
                
                # Integration Layer Test
                integration_result = await self.test_corrected_form_integration(browser, form_config)
                print(f"  Integration: {'✅ PASS' if integration_result['success'] else '❌ FAIL'}")
                if integration_result['error']:
                    print(f"    Error: {integration_result['error']}")
                
                self.results["user_forms"][form_config['name']] = {
                    "api": api_result,
                    "integration": integration_result
                }
                print()
            
            # Test Admin Forms
            print("🔧 **TESTING ADMIN FORMS WITH CORRECTED SELECTORS**\n")
            
            try:
                admin_context, admin_page = await self.login_admin(browser)
                print("✅ Admin login successful")
                
                admin_forms = [
                    {
                        "name": "Add Shoe Form",
                        "api_endpoint": "admin/shoes",
                        "api_data": {
                            "brand": "Nike",
                            "modelName": "API Test",
                            "size": "10",
                            "gender": "men",
                            "sport": "basketball",
                            "condition": "good",
                            "color": "black",
                            "description": "API test shoe",
                            "status": "available"
                        },
                        "url": f"{self.base_url}/admin/shoes/add",
                        "is_modal": False,
                        "form_data": {
                            "modelName": "Integration Test Shoe",
                            "size": "9",
                            "color": "white",
                            "inventoryCount": "1",
                            "description": "Integration test shoe"
                        },
                        "selectors": {
                            "modelName": "input[name=\"modelName\"]",
                            "size": "input[name=\"size\"]",
                            "color": "input[name=\"color\"]",
                            "inventoryCount": "input[name=\"inventoryCount\"]",
                            "description": "textarea[name=\"description\"]"
                        },
                        "submit_selector": "button[type=\"submit\"]",
                        "success_indicators": [
                            'text="Success"',
                            'text="added"',
                            'text="created"'
                        ]
                    }
                ]
                
                # API test with admin session
                headers = {"Cookie": self.admin_session} if self.admin_session else None
                
                for form_config in admin_forms:
                    print(f"Testing {form_config['name']}...")
                    
                    # API Layer Test
                    api_result = self.test_api_layer(form_config['api_endpoint'], form_config['api_data'], headers=headers)
                    print(f"  API: {'✅ PASS' if api_result['success'] else '❌ FAIL'} - Status: {api_result['status']}")
                    
                    # Integration Layer Test
                    integration_result = await self.test_corrected_form_integration(browser, form_config, auth_context=(admin_context, admin_page))
                    print(f"  Integration: {'✅ PASS' if integration_result['success'] else '❌ FAIL'}")
                    if integration_result['error']:
                        print(f"    Error: {integration_result['error']}")
                    
                    self.results["admin_forms"][form_config['name']] = {
                        "api": api_result,
                        "integration": integration_result
                    }
                    print()
                
                await admin_context.close()
                
            except Exception as e:
                print(f"❌ Admin testing failed: {e}")
            
            await browser.close()
        
        # Generate Summary
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
        
        print(f"🎯 **CORRECTED TESTING SUMMARY**")
        print(f"Total Tests: {total_tests}")
        print(f"Passed: {passed_tests}")
        print(f"Failed: {total_tests - passed_tests}")
        print(f"Success Rate: {success_rate:.1f}%")
        print(f"Status: {self.results['summary']['status']}")

async def main():
    """Run corrected comprehensive testing"""
    tester = CorrectedFormTester()
    results = await tester.run_corrected_comprehensive_tests()
    
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
