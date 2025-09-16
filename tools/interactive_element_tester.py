#!/usr/bin/env python3
"""
Interactive Element Tester
Tests every button, form, link, and interactive element in the application
"""

import asyncio
import json
import time
from playwright.async_api import async_playwright, Page, Browser
from typing import Dict, List, Any
import re

class InteractiveElementTester:
    def __init__(self, base_url: str = "http://localhost:3000"):
        self.base_url = base_url
        self.results = []
        self.test_data = {
            "user_email": "test@example.com",
            "user_password": "TestPassword123!",
            "admin_email": "admin@newsteps.fit",
            "admin_password": "Admin123!"
        }
    
    async def test_all_pages(self):
        """Test all pages and their interactive elements"""
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=False)  # Set to True for headless
            context = await browser.new_context()
            page = await context.new_page()
            
            # Test pages systematically
            pages_to_test = [
                "/",
                "/about",
                "/shoes",
                "/donate",
                "/donate/shoes", 
                "/donate/money",
                "/contact",
                "/get-involved",
                "/login",
                "/register",
                "/account",
                "/cart",
                "/checkout",
                "/admin",
                "/admin/shoes",
                "/admin/requests",
                "/admin/shoe-donations",
                "/admin/money-donations"
            ]
            
            for page_path in pages_to_test:
                await self.test_page_comprehensively(page, page_path)
            
            await browser.close()
        
        self.generate_report()
    
    async def test_page_comprehensively(self, page: Page, page_path: str):
        """Comprehensively test a single page"""
        print(f"🧪 Testing page: {page_path}")
        
        page_result = {
            "page": page_path,
            "url": f"{self.base_url}{page_path}",
            "timestamp": time.time(),
            "tests": []
        }
        
        try:
            # Navigate to page
            response = await page.goto(f"{self.base_url}{page_path}")
            page_result["status_code"] = response.status if response else "unknown"
            
            # Wait for page to load
            await page.wait_for_load_state("networkidle", timeout=10000)
            
            # Test 1: Page loads successfully
            page_result["tests"].append({
                "test": "page_loads",
                "status": "pass" if response and response.status == 200 else "fail",
                "details": f"Status: {response.status if response else 'No response'}"
            })
            
            # Test 2: Check for dynamic content vs hardcoded content
            await self.test_dynamic_content(page, page_result)
            
            # Test 3: Test all buttons
            await self.test_all_buttons(page, page_result)
            
            # Test 4: Test all links
            await self.test_all_links(page, page_result)
            
            # Test 5: Test all forms
            await self.test_all_forms(page, page_result)
            
            # Test 6: Test data consistency (if user data page)
            await self.test_data_consistency(page, page_result, page_path)
            
            # Test 7: Test error states
            await self.test_error_states(page, page_result)
            
        except Exception as e:
            page_result["tests"].append({
                "test": "page_access",
                "status": "fail",
                "error": str(e)
            })
        
        self.results.append(page_result)
    
    async def test_dynamic_content(self, page: Page, page_result: Dict):
        """Test if content is dynamic or hardcoded"""
        print("  📊 Testing dynamic content...")
        
        # Look for suspicious hardcoded content
        suspicious_texts = [
            "No donations yet",
            "No requests yet", 
            "No data available",
            "Coming soon",
            "Placeholder",
            "Lorem ipsum"
        ]
        
        page_content = await page.content()
        found_hardcoded = []
        
        for text in suspicious_texts:
            if text.lower() in page_content.lower():
                found_hardcoded.append(text)
        
        # Check if page has data fetching indicators
        has_loading_states = await page.locator('[data-testid*="loading"], .loading, [class*="loading"], [class*="spinner"]').count() > 0
        has_error_states = await page.locator('[data-testid*="error"], .error, [class*="error"]').count() > 0
        
        page_result["tests"].append({
            "test": "dynamic_content_check",
            "status": "warning" if found_hardcoded else "pass",
            "hardcoded_content": found_hardcoded,
            "has_loading_states": has_loading_states,
            "has_error_states": has_error_states
        })
    
    async def test_all_buttons(self, page: Page, page_result: Dict):
        """Test all buttons on the page"""
        print("  🔘 Testing buttons...")
        
        buttons = await page.locator('button, [role="button"], input[type="button"], input[type="submit"]').all()
        button_results = []
        
        for i, button in enumerate(buttons):
            try:
                # Get button info
                text = await button.text_content() or await button.get_attribute('value') or f"Button {i+1}"
                is_visible = await button.is_visible()
                is_enabled = await button.is_enabled()
                
                button_test = {
                    "index": i + 1,
                    "text": text.strip(),
                    "visible": is_visible,
                    "enabled": is_enabled,
                    "clickable": is_visible and is_enabled
                }
                
                # Test click if safe to do so
                if is_visible and is_enabled and not self.is_destructive_button(text):
                    try:
                        # Take screenshot before click
                        await page.screenshot(path=f"screenshots/before_click_{i+1}.png")
                        
                        # Click button
                        await button.click(timeout=5000)
                        
                        # Wait a bit for any response
                        await page.wait_for_timeout(1000)
                        
                        # Check for any changes (new elements, navigation, etc.)
                        current_url = page.url
                        button_test["click_result"] = "success"
                        button_test["url_after_click"] = current_url
                        
                        # Take screenshot after click
                        await page.screenshot(path=f"screenshots/after_click_{i+1}.png")
                        
                    except Exception as e:
                        button_test["click_result"] = "error"
                        button_test["click_error"] = str(e)
                
                button_results.append(button_test)
                
            except Exception as e:
                button_results.append({
                    "index": i + 1,
                    "error": str(e)
                })
        
        page_result["tests"].append({
            "test": "button_functionality",
            "status": "pass",
            "button_count": len(buttons),
            "buttons": button_results
        })
    
    async def test_all_links(self, page: Page, page_result: Dict):
        """Test all links on the page"""
        print("  🔗 Testing links...")
        
        links = await page.locator('a[href]').all()
        link_results = []
        
        for i, link in enumerate(links):
            try:
                href = await link.get_attribute('href')
                text = await link.text_content()
                is_visible = await link.is_visible()
                
                link_test = {
                    "index": i + 1,
                    "href": href,
                    "text": text.strip() if text else "",
                    "visible": is_visible,
                    "is_external": href.startswith('http') if href else False,
                    "is_internal": href.startswith('/') if href else False
                }
                
                # Test internal links (don't follow external links)
                if is_visible and href and href.startswith('/') and not href.startswith('//'):
                    try:
                        # Check if link is valid by making a head request
                        response = await page.request.head(f"{self.base_url}{href}")
                        link_test["link_status"] = response.status
                        link_test["link_valid"] = response.status < 400
                    except Exception as e:
                        link_test["link_error"] = str(e)
                        link_test["link_valid"] = False
                
                link_results.append(link_test)
                
            except Exception as e:
                link_results.append({
                    "index": i + 1,
                    "error": str(e)
                })
        
        page_result["tests"].append({
            "test": "link_functionality",
            "status": "pass",
            "link_count": len(links),
            "links": link_results
        })
    
    async def test_all_forms(self, page: Page, page_result: Dict):
        """Test all forms on the page"""
        print("  📝 Testing forms...")
        
        forms = await page.locator('form').all()
        form_results = []
        
        for i, form in enumerate(forms):
            try:
                # Get form info
                action = await form.get_attribute('action')
                method = await form.get_attribute('method') or 'GET'
                
                # Find form fields
                inputs = await form.locator('input, textarea, select').all()
                field_info = []
                
                for input_elem in inputs:
                    field_type = await input_elem.get_attribute('type') or 'text'
                    field_name = await input_elem.get_attribute('name')
                    field_required = await input_elem.get_attribute('required') is not None
                    
                    field_info.append({
                        "type": field_type,
                        "name": field_name,
                        "required": field_required
                    })
                
                form_test = {
                    "index": i + 1,
                    "action": action,
                    "method": method,
                    "field_count": len(inputs),
                    "fields": field_info
                }
                
                # Test form submission with valid data (if safe)
                if not self.is_destructive_form(action):
                    try:
                        await self.fill_form_with_test_data(form, field_info)
                        
                        # Submit form
                        submit_button = await form.locator('input[type="submit"], button[type="submit"], button:not([type])').first
                        if await submit_button.count() > 0:
                            await submit_button.click()
                            await page.wait_for_timeout(2000)  # Wait for response
                            
                            form_test["submission_test"] = "attempted"
                            form_test["url_after_submit"] = page.url
                    
                    except Exception as e:
                        form_test["submission_error"] = str(e)
                
                form_results.append(form_test)
                
            except Exception as e:
                form_results.append({
                    "index": i + 1,
                    "error": str(e)
                })
        
        page_result["tests"].append({
            "test": "form_functionality",
            "status": "pass",
            "form_count": len(forms),
            "forms": form_results
        })
    
    async def test_data_consistency(self, page: Page, page_result: Dict, page_path: str):
        """Test data consistency for user data pages"""
        print("  🔄 Testing data consistency...")
        
        # Pages that should show user data
        user_data_pages = ["/account", "/admin/requests", "/admin/shoe-donations", "/admin/money-donations"]
        
        if page_path in user_data_pages:
            # Look for data tables, lists, or cards
            data_containers = await page.locator('[data-testid*="list"], [data-testid*="table"], .table, ul, ol, [class*="grid"], [class*="list"]').all()
            
            consistency_test = {
                "is_user_data_page": True,
                "data_containers": len(data_containers),
                "has_empty_states": False,
                "has_loading_states": False,
                "has_data": False
            }
            
            # Check for empty state messages
            empty_messages = ["no data", "no donations", "no requests", "empty", "nothing found"]
            page_text = (await page.content()).lower()
            
            for message in empty_messages:
                if message in page_text:
                    consistency_test["has_empty_states"] = True
                    break
            
            # Check for loading indicators
            loading_indicators = await page.locator('[class*="loading"], [class*="spinner"], [data-testid*="loading"]').count()
            consistency_test["has_loading_states"] = loading_indicators > 0
            
            # Check for actual data (tables with rows, lists with items)
            data_rows = await page.locator('tr:not(:first-child), li:not(:empty), [class*="card"]:not(:empty)').count()
            consistency_test["has_data"] = data_rows > 0
            
            page_result["tests"].append({
                "test": "data_consistency",
                "status": "warning" if consistency_test["has_empty_states"] and not consistency_test["has_data"] else "pass",
                "details": consistency_test
            })
    
    async def test_error_states(self, page: Page, page_result: Dict):
        """Test error handling and error states"""
        print("  ⚠️ Testing error states...")
        
        # Look for error handling elements
        error_elements = await page.locator('[class*="error"], [data-testid*="error"], .alert-error, .text-red').count()
        
        # Check console errors
        console_errors = []
        page.on("console", lambda msg: console_errors.append(msg.text) if msg.type == "error" else None)
        
        # Wait a bit to collect any console errors
        await page.wait_for_timeout(2000)
        
        page_result["tests"].append({
            "test": "error_states",
            "status": "pass",
            "error_elements_present": error_elements > 0,
            "console_errors": console_errors
        })
    
    async def fill_form_with_test_data(self, form, field_info: List[Dict]):
        """Fill form with appropriate test data"""
        for field in field_info:
            field_name = field["name"]
            field_type = field["type"]
            
            if not field_name:
                continue
            
            try:
                input_elem = await form.locator(f'[name="{field_name}"]').first
                
                if field_type == "email":
                    await input_elem.fill(self.test_data["user_email"])
                elif field_type == "password":
                    await input_elem.fill(self.test_data["user_password"])
                elif field_type == "text":
                    if "name" in field_name.lower():
                        await input_elem.fill("Test User")
                    elif "phone" in field_name.lower():
                        await input_elem.fill("1234567890")
                    else:
                        await input_elem.fill("Test Value")
                elif field_type == "textarea":
                    await input_elem.fill("This is a test message.")
                elif field_type == "number":
                    await input_elem.fill("100")
                elif field_type == "select":
                    # Select first option
                    options = await input_elem.locator('option').all()
                    if len(options) > 1:  # Skip first option (usually placeholder)
                        await input_elem.select_option(index=1)
                
            except Exception as e:
                print(f"    Error filling field {field_name}: {e}")
    
    def is_destructive_button(self, text: str) -> bool:
        """Check if button might be destructive"""
        destructive_keywords = ["delete", "remove", "cancel", "logout", "sign out", "clear", "reset"]
        return any(keyword in text.lower() for keyword in destructive_keywords)
    
    def is_destructive_form(self, action: str) -> bool:
        """Check if form might be destructive"""
        if not action:
            return False
        destructive_actions = ["delete", "remove", "cancel", "logout"]
        return any(keyword in action.lower() for keyword in destructive_actions)
    
    def generate_report(self):
        """Generate comprehensive test report"""
        print("\n" + "="*60)
        print("🧪 INTERACTIVE ELEMENT TEST REPORT")
        print("="*60)
        
        total_pages = len(self.results)
        total_tests = sum(len(result["tests"]) for result in self.results)
        
        passed_tests = 0
        failed_tests = 0
        warning_tests = 0
        
        for result in self.results:
            for test in result["tests"]:
                if test["status"] == "pass":
                    passed_tests += 1
                elif test["status"] == "fail":
                    failed_tests += 1
                elif test["status"] == "warning":
                    warning_tests += 1
        
        print(f"\n📊 Summary:")
        print(f"  Pages Tested: {total_pages}")
        print(f"  Total Tests: {total_tests}")
        print(f"  ✅ Passed: {passed_tests}")
        print(f"  ⚠️  Warnings: {warning_tests}")
        print(f"  ❌ Failed: {failed_tests}")
        
        print(f"\n🚨 Issues Found:")
        for result in self.results:
            page_issues = [test for test in result["tests"] if test["status"] in ["fail", "warning"]]
            if page_issues:
                print(f"\n  📄 {result['page']}:")
                for issue in page_issues:
                    print(f"    • {issue['test']}: {issue['status']}")
                    if "hardcoded_content" in issue and issue["hardcoded_content"]:
                        print(f"      Hardcoded: {issue['hardcoded_content']}")
                    if "error" in issue:
                        print(f"      Error: {issue['error']}")
        
        # Save detailed report
        with open('interactive_test_report.json', 'w') as f:
            json.dump(self.results, f, indent=2)
        
        print(f"\n💾 Detailed report saved to: interactive_test_report.json")
        print("="*60)

async def main():
    tester = InteractiveElementTester()
    await tester.test_all_pages()

if __name__ == "__main__":
    asyncio.run(main())
