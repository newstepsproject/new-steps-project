#!/usr/bin/env python3
"""
Improved 3-Layer Testing Methodology
Tests form-to-API integration to catch data structure mismatches
"""

import asyncio
import json
import requests
import time
from playwright.async_api import async_playwright

class ImprovedIntegrationTester:
    def __init__(self, base_url="http://localhost:3000"):
        self.base_url = base_url
        self.results = {
            "shoe_donation": {"api": None, "integration": None, "workflow": None},
            "money_donation": {"api": None, "integration": None, "workflow": None},
            "contact_form": {"api": None, "integration": None, "workflow": None},
            "summary": {}
        }
    
    def test_api_layer(self, endpoint, data, method="POST"):
        """Layer 1: Direct API testing with correct data structure"""
        try:
            url = f"{self.base_url}/api/{endpoint}"
            if method == "POST":
                response = requests.post(url, json=data, timeout=10)
            else:
                response = requests.get(url, timeout=10)
            
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
    
    async def test_integration_layer(self, browser, form_url, form_data, expected_success_indicators):
        """Layer 2: Form-to-API integration testing"""
        context = await browser.new_context()
        page = await context.new_page()
        
        try:
            # Navigate to form
            await page.goto(form_url)
            await page.wait_for_load_state('networkidle')
            
            # Fill form based on form_data
            for field, value in form_data.items():
                try:
                    # Try multiple selector strategies
                    selectors = [
                        f'input[name="{field}"]',
                        f'input[placeholder*="{field}"]',
                        f'textarea[name="{field}"]',
                        f'select[name="{field}"]'
                    ]
                    
                    filled = False
                    for selector in selectors:
                        if await page.locator(selector).count() > 0:
                            if field == "amount" or "number" in field.lower():
                                await page.fill(selector, str(value))
                            else:
                                await page.fill(selector, value)
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
                'button:has-text("Donate")',
                'button:has-text("Send")'
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
            
            # Wait for response
            await page.wait_for_timeout(5000)
            
            # Check for success indicators
            success = False
            reference_id = None
            error_message = None
            
            for indicator in expected_success_indicators:
                if await page.locator(indicator).count() > 0:
                    success = True
                    # Try to extract reference ID
                    try:
                        ref_element = await page.locator('text=/[A-Z]{2,3}-[A-Z]{4}-\\d{4}/').first.text_content()
                        if ref_element:
                            reference_id = ref_element
                    except:
                        pass
                    break
            
            # Check for error indicators
            error_selectors = [
                'text="500"',
                'text="Error"',
                'text="Failed"',
                '[role="alert"]'
            ]
            
            for error_selector in error_selectors:
                if await page.locator(error_selector).count() > 0:
                    try:
                        error_message = await page.locator(error_selector).first.text_content()
                    except:
                        error_message = "Error detected"
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
            await context.close()
    
    async def test_money_donation_modal(self, browser, form_url, form_data, expected_success_indicators):
        """Special test for money donation form that's in a modal"""
        context = await browser.new_context()
        page = await context.new_page()
        
        try:
            # Navigate to get-involved page
            await page.goto(form_url)
            await page.wait_for_load_state('networkidle')
            
            # Click "Get Started" button for Financial Support (donate) card
            donate_buttons = page.locator('button:has-text("Get Started")')
            if await donate_buttons.count() >= 2:  # Should be 3 cards
                await donate_buttons.nth(1).click()  # Second card is Financial Support
                await page.wait_for_timeout(2000)
            else:
                return {
                    "success": False,
                    "error": "Could not find Get Started buttons",
                    "reference_id": None
                }
            
            # Now fill the form that should be visible
            for field, value in form_data.items():
                try:
                    # Try multiple selector strategies for the modal form
                    selectors = [
                        f'input[id="{field}"]',  # Form uses id attributes
                        f'input[name="{field}"]',
                        f'textarea[id="{field}"]',
                        f'textarea[name="{field}"]'
                    ]
                    
                    filled = False
                    for selector in selectors:
                        if await page.locator(selector).count() > 0:
                            await page.fill(selector, str(value))
                            filled = True
                            break
                    
                    if not filled:
                        print(f"⚠️ Could not fill field: {field}")
                        
                except Exception as e:
                    print(f"⚠️ Error filling {field}: {e}")
            
            # Submit the modal form
            submit_button = page.locator('button[type="submit"]:has-text("Submit"), button:has-text("Donate Money")')
            if await submit_button.count() > 0:
                await submit_button.click()
                await page.wait_for_timeout(5000)
            else:
                return {
                    "success": False,
                    "error": "Could not find submit button in modal",
                    "reference_id": None
                }
            
            # Check for success indicators
            success = False
            reference_id = None
            error_message = None
            
            for indicator in expected_success_indicators:
                if await page.locator(indicator).count() > 0:
                    success = True
                    # Try to extract reference ID
                    try:
                        ref_element = await page.locator('text=/DM-[A-Z]{4}-\\d{4}/').first.text_content()
                        if ref_element:
                            reference_id = ref_element
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
                "error": f"Modal test error: {str(e)}",
                "reference_id": None
            }
        finally:
            await context.close()
    
    async def run_comprehensive_tests(self):
        """Run all 3-layer tests"""
        print("🎯 **IMPROVED 3-LAYER INTEGRATION TESTING**\n")
        
        # Test 1: Shoe Donation Form
        print("🧪 **TESTING SHOE DONATION FORM**")
        
        # Layer 1: API Test
        print("1. API Layer Test...")
        api_data = {
            "firstName": "API",
            "lastName": "Test",
            "email": "apitest@example.com",
            "phone": "5551234567",
            "donationDescription": "API layer test",
            "numberOfShoes": 1,
            "isBayArea": False,
            "address": {
                "street": "123 API St",
                "city": "API City",
                "state": "CA",
                "zipCode": "12345",
                "country": "USA"
            }
        }
        
        api_result = self.test_api_layer("donations", api_data)
        self.results["shoe_donation"]["api"] = api_result
        print(f"   API Result: {'✅ PASS' if api_result['success'] else '❌ FAIL'} - Status: {api_result['status']}")
        
        # Layer 2: Integration Test
        print("2. Integration Layer Test...")
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            
            form_data = {
                "firstName": "Integration",
                "lastName": "Test", 
                "email": "integration@example.com",
                "phone": "5551234567",
                "street": "123 Integration St",
                "city": "Integration City",
                "state": "CA",
                "zipCode": "12345",
                "country": "USA",
                "donationDescription": "Integration layer test - automated",
                "numberOfShoes": "1"
            }
            
            success_indicators = [
                'text="Thank you"',
                'text="Success"',
                'text="submitted"',
                'text=/DS-\\w+-\\d+/'
            ]
            
            integration_result = await self.test_integration_layer(
                browser, 
                f"{self.base_url}/donate/shoes",
                form_data,
                success_indicators
            )
            
            self.results["shoe_donation"]["integration"] = integration_result
            print(f"   Integration Result: {'✅ PASS' if integration_result['success'] else '❌ FAIL'}")
            if integration_result['reference_id']:
                print(f"   Reference ID: {integration_result['reference_id']}")
            if integration_result['error']:
                print(f"   Error: {integration_result['error']}")
            
            await browser.close()
        
        # Test 2: Money Donation Form
        print("\n🧪 **TESTING MONEY DONATION FORM**")
        
        # Layer 1: API Test
        print("1. API Layer Test...")
        money_api_data = {
            "firstName": "Money",
            "lastName": "API",
            "email": "moneyapi@example.com",
            "phone": "5551234567",
            "amount": "25.00",
            "notes": "API layer test"
        }
        
        money_api_result = self.test_api_layer("donations/money", money_api_data)
        self.results["money_donation"]["api"] = money_api_result
        print(f"   API Result: {'✅ PASS' if money_api_result['success'] else '❌ FAIL'} - Status: {money_api_result['status']}")
        
        # Layer 2: Integration Test
        print("2. Integration Layer Test...")
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            
            money_form_data = {
                "firstName": "Money",
                "lastName": "Integration",
                "email": "moneyintegration@example.com", 
                "phone": "5551234567",
                "amount": "15.00",
                "notes": "Integration layer test - automated"
            }
            
            money_success_indicators = [
                'text="Thank you"',
                'text="Success"', 
                'text="submitted"',
                'text=/DM-\\w+-\\d+/'
            ]
            
            # Money donation form is in a modal - need to click "Get Started" first
            money_integration_result = await self.test_money_donation_modal(
                browser,
                f"{self.base_url}/get-involved",
                money_form_data,
                money_success_indicators
            )
            
            self.results["money_donation"]["integration"] = money_integration_result
            print(f"   Integration Result: {'✅ PASS' if money_integration_result['success'] else '❌ FAIL'}")
            if money_integration_result['reference_id']:
                print(f"   Reference ID: {money_integration_result['reference_id']}")
            if money_integration_result['error']:
                print(f"   Error: {money_integration_result['error']}")
            
            await browser.close()
        
        # Test 3: Contact Form
        print("\n🧪 **TESTING CONTACT FORM**")
        
        # Layer 1: API Test
        print("1. API Layer Test...")
        contact_api_data = {
            "firstName": "Contact",
            "lastName": "API",
            "email": "contactapi@example.com",
            "phone": "5551234567",
            "subject": "API Test",
            "message": "API layer test message"
        }
        
        contact_api_result = self.test_api_layer("contact", contact_api_data)
        self.results["contact_form"]["api"] = contact_api_result
        print(f"   API Result: {'✅ PASS' if contact_api_result['success'] else '❌ FAIL'} - Status: {contact_api_result['status']}")
        
        # Layer 2: Integration Test
        print("2. Integration Layer Test...")
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            
            contact_form_data = {
                "firstName": "Contact",
                "lastName": "Integration",
                "email": "contactintegration@example.com",
                "phone": "5551234567", 
                "subject": "Integration Test",
                "message": "Integration layer test - automated contact form submission"
            }
            
            contact_success_indicators = [
                'text="Thank you"',
                'text="Success"',
                'text="sent"',
                'text="received"'
            ]
            
            contact_integration_result = await self.test_integration_layer(
                browser,
                f"{self.base_url}/contact",
                contact_form_data,
                contact_success_indicators
            )
            
            self.results["contact_form"]["integration"] = contact_integration_result
            print(f"   Integration Result: {'✅ PASS' if contact_integration_result['success'] else '❌ FAIL'}")
            if contact_integration_result['error']:
                print(f"   Error: {contact_integration_result['error']}")
            
            await browser.close()
        
        # Generate Summary
        self.generate_summary()
        return self.results
    
    def generate_summary(self):
        """Generate comprehensive test summary"""
        total_tests = 0
        passed_tests = 0
        failed_tests = 0
        
        for form_name, layers in self.results.items():
            if form_name != "summary":
                for layer_name, result in layers.items():
                    if result:
                        total_tests += 1
                        if result.get('success', False):
                            passed_tests += 1
                        else:
                            failed_tests += 1
        
        success_rate = (passed_tests / total_tests * 100) if total_tests > 0 else 0
        
        self.results["summary"] = {
            "total_tests": total_tests,
            "passed": passed_tests,
            "failed": failed_tests,
            "success_rate": f"{success_rate:.1f}%",
            "status": "✅ EXCELLENT" if success_rate >= 90 else "⚠️ NEEDS ATTENTION" if success_rate >= 70 else "❌ CRITICAL ISSUES"
        }
        
        print(f"\n🎯 **INTEGRATION TESTING SUMMARY**")
        print(f"Total Tests: {total_tests}")
        print(f"Passed: {passed_tests}")
        print(f"Failed: {failed_tests}")
        print(f"Success Rate: {success_rate:.1f}%")
        print(f"Status: {self.results['summary']['status']}")

async def main():
    """Run improved integration testing"""
    tester = ImprovedIntegrationTester()
    results = await tester.run_comprehensive_tests()
    
    # Print detailed results
    print(f"\n📊 **DETAILED RESULTS:**")
    for form_name, layers in results.items():
        if form_name != "summary":
            print(f"\n{form_name.upper().replace('_', ' ')}:")
            for layer_name, result in layers.items():
                if result:
                    status = "✅ PASS" if result.get('success', False) else "❌ FAIL"
                    print(f"  {layer_name}: {status}")
                    if result.get('error'):
                        print(f"    Error: {result['error']}")

if __name__ == "__main__":
    asyncio.run(main())
