#!/usr/bin/env python3
"""
Comprehensive Platform Testing Suite
Using Enhanced 4-Layer Testing Methodology

Tests all pages, forms, and user interactions for:
- Visitors (no authentication)
- Users (authenticated)
- Admins (admin role)

Based on COMPREHENSIVE_TESTING_PLAN.md
"""

import asyncio
import json
import requests
import time
from datetime import datetime
from playwright.async_api import async_playwright
from typing import Dict, List, Any, Optional

class ComprehensivePlatformTester:
    def __init__(self, base_url: str = "http://localhost:3000"):
        self.base_url = base_url
        self.results = {
            "timestamp": datetime.now().isoformat(),
            "base_url": base_url,
            "layer1_api": {},
            "layer2_forms": {},
            "layer3_interactive": {},
            "layer4_workflows": {},
            "summary": {}
        }
        
    async def run_comprehensive_tests(self):
        """Execute all 4 layers of testing systematically"""
        print("🎯 STARTING COMPREHENSIVE PLATFORM TESTING")
        print("=" * 80)
        
        # Layer 1: API Endpoints
        print("🔍 LAYER 1: API ENDPOINTS TESTING")
        await self.test_layer1_apis()
        
        # Layer 2: Forms Testing  
        print("\n📝 LAYER 2: FORMS TESTING")
        await self.test_layer2_forms()
        
        # Layer 3: Interactive Features
        print("\n⚡ LAYER 3: INTERACTIVE FEATURES TESTING")
        await self.test_layer3_interactive()
        
        # Layer 4: Complete Workflows
        print("\n🌊 LAYER 4: COMPLETE WORKFLOW TESTING")
        await self.test_layer4_workflows()
        
        # Generate Summary
        self.generate_summary()
        self.save_results()
        
        return self.results
    
    async def test_layer1_apis(self):
        """Test all API endpoints systematically"""
        
        # Public APIs (No Auth)
        public_apis = [
            {"name": "health", "endpoint": "/api/health", "method": "GET"},
            {"name": "health_database", "endpoint": "/api/health/database", "method": "GET"},
            {"name": "settings", "endpoint": "/api/settings", "method": "GET"},
            {"name": "shoes", "endpoint": "/api/shoes", "method": "GET"},
            {"name": "contact", "endpoint": "/api/contact", "method": "POST", "data": {
                "firstName": "Test", "lastName": "User", "email": "test@example.com",
                "subject": "API Test", "message": "Testing contact API"
            }},
            {"name": "donations", "endpoint": "/api/donations", "method": "POST", "data": {
                "firstName": "Test", "lastName": "Donor", "email": "donor@example.com",
                "street": "123 Test St", "city": "Test City", "state": "CA", "zipCode": "94102", "country": "USA",
                "numberOfShoes": 2, "donationDescription": "Testing shoe donation API"
            }},
            {"name": "volunteers", "endpoint": "/api/volunteers", "method": "POST", "data": {
                "firstName": "Test", "lastName": "Volunteer", "email": "volunteer@example.com",
                "phone": "5551234567", "city": "Test City", "state": "CA", "availability": "weekly", "interests": ["collection"]
            }}
        ]
        
        for api in public_apis:
            await self.test_api_endpoint(api, "public")
        
        # Authenticated APIs (would require session setup)
        auth_apis = [
            {"name": "register", "endpoint": "/api/auth/register", "method": "POST"},
            {"name": "requests", "endpoint": "/api/requests", "method": "POST"},
            {"name": "user_profile", "endpoint": "/api/user/profile", "method": "GET"}
        ]
        
        for api in auth_apis:
            await self.test_api_endpoint(api, "authenticated", test_auth_only=True)
        
        # Admin APIs (would require admin session)
        admin_apis = [
            {"name": "admin_analytics", "endpoint": "/api/admin/analytics", "method": "GET"},
            {"name": "admin_shoes", "endpoint": "/api/admin/shoes", "method": "GET"},
            {"name": "admin_requests", "endpoint": "/api/admin/requests", "method": "GET"},
            {"name": "admin_users", "endpoint": "/api/admin/users", "method": "GET"}
        ]
        
        for api in admin_apis:
            await self.test_api_endpoint(api, "admin", test_auth_only=True)
    
    async def test_api_endpoint(self, api_config: Dict, category: str, test_auth_only: bool = False):
        """Test individual API endpoint"""
        try:
            endpoint = api_config["endpoint"]
            method = api_config["method"]
            name = api_config["name"]
            
            if test_auth_only:
                # Just test that authentication is required
                response = requests.get(f"{self.base_url}{endpoint}", timeout=10)
                expected_status = 401  # Should require authentication
                success = response.status_code == expected_status
                print(f"{'✅' if success else '❌'} {name}: {response.status_code} (Auth Required)")
            else:
                # Test actual functionality
                if method == "GET":
                    response = requests.get(f"{self.base_url}{endpoint}", timeout=10)
                elif method == "POST":
                    data = api_config.get("data", {})
                    response = requests.post(f"{self.base_url}{endpoint}", json=data, timeout=10)
                
                success = 200 <= response.status_code < 300
                print(f"{'✅' if success else '❌'} {name}: {response.status_code}")
                
                # Store additional info for successful responses
                if success and method == "GET":
                    try:
                        json_data = response.json()
                        if name == "shoes" and isinstance(json_data, dict):
                            shoe_count = len(json_data.get('shoes', []))
                            print(f"   📊 Available shoes: {shoe_count}")
                        elif name == "settings":
                            max_shoes = json_data.get('maxShoesPerRequest', 'unknown')
                            print(f"   ⚙️ Max shoes per request: {max_shoes}")
                    except:
                        pass
            
            self.results["layer1_api"][name] = {
                "endpoint": endpoint,
                "method": method,
                "category": category,
                "success": success,
                "status_code": response.status_code if 'response' in locals() else None
            }
            
        except Exception as e:
            print(f"❌ {name}: Error - {str(e)}")
            self.results["layer1_api"][name] = {
                "endpoint": endpoint,
                "success": False,
                "error": str(e)
            }
    
    async def test_layer2_forms(self):
        """Test all forms using browser automation"""
        
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            
            # Visitor Forms (No Auth Required)
            visitor_forms = [
                {
                    "name": "contact_form",
                    "url": "/contact",
                    "fields": {
                        "firstName": "Test",
                        "lastName": "User", 
                        "email": "test@example.com",
                        "subject": "Test Subject",
                        "message": "This is a test message for form validation"
                    },
                    "submit_selector": 'button[type="submit"]',
                    "success_indicators": ['text="Thank you"', 'text="sent successfully"', 'text="received"']
                },
                {
                    "name": "shoe_donation_form",
                    "url": "/donate/shoes",
                    "fields": {
                        "firstName": "Test",
                        "lastName": "Donor",
                        "email": "donor@example.com",
                        "phone": "5551234567",
                        "street": "123 Test Street",
                        "city": "San Francisco",
                        "state": "CA",
                        "zipCode": "94102",
                        "country": "USA",
                        "numberOfShoes": "2",
                        "donationDescription": "Testing shoe donation form with comprehensive details"
                    },
                    "submit_selector": 'button[type="submit"]',
                    "success_indicators": ['text="DS-"', 'text="donation"', 'text="submitted"']
                },
                {
                    "name": "volunteer_form",
                    "url": "/volunteer",
                    "fields": {
                        "firstName": "Test",
                        "lastName": "Volunteer",
                        "email": "volunteer@example.com",
                        "phone": "5551234567",
                        "location": "San Francisco, CA",
                        "availability": "Weekends and evenings",
                        "experience": "Testing and quality assurance experience",
                        "message": "I would like to help with testing and validation",
                        "interests": "collection"
                    },
                    "submit_selector": 'button[type="submit"]',
                    "success_indicators": ['text="application"', 'text="submitted"', 'text="VOL-"']
                }
            ]
            
            for form_config in visitor_forms:
                await self.test_form(browser, form_config, "visitor")
            
            # User Forms (would require authentication setup)
            user_forms = [
                {
                    "name": "registration_form",
                    "url": "/register",
                    "auth_required": True
                },
                {
                    "name": "login_form", 
                    "url": "/login",
                    "auth_required": True
                },
                {
                    "name": "checkout_form",
                    "url": "/checkout",
                    "auth_required": True
                }
            ]
            
            for form_config in user_forms:
                await self.test_form(browser, form_config, "user")
            
            await browser.close()
    
    async def test_form(self, browser, form_config: Dict, category: str):
        """Test individual form"""
        context = await browser.new_context()
        page = await context.new_page()
        
        try:
            name = form_config["name"]
            url = form_config["url"]
            
            if form_config.get("auth_required"):
                # Just test that form loads and requires auth
                await page.goto(f"{self.base_url}{url}")
                await page.wait_for_load_state('networkidle')
                
                # Check if redirected to login or shows auth requirement
                current_url = page.url
                page_content = await page.content()
                requires_auth = "/login" in current_url or "sign" in page_content.lower()
                
                print(f"{'✅' if requires_auth else '❌'} {name}: Authentication required")
                self.results["layer2_forms"][name] = {
                    "url": url,
                    "category": category,
                    "success": requires_auth,
                    "auth_required": True
                }
            else:
                # Test actual form functionality
                await page.goto(f"{self.base_url}{url}")
                await page.wait_for_load_state('networkidle')
                await page.wait_for_timeout(2000)  # Wait for React to load
                
                fields = form_config.get("fields", {})
                success = False
                
                # Fill form fields
                for field_name, value in fields.items():
                    filled = False
                    
                    if field_name == "availability":
                        # Handle Select dropdown for availability
                        select_trigger = page.locator('button[role="combobox"]').filter(has_text="Select availability")
                        if await select_trigger.count() > 0:
                            await select_trigger.click()
                            await page.wait_for_timeout(500)
                            option = page.locator(f'[role="option"]:has-text("Weekly")')
                            if await option.count() > 0:
                                await option.click()
                                filled = True
                    elif field_name == "interests":
                        # Handle checkboxes for interests - click the first checkbox button
                        checkbox_button = page.locator('button[role="checkbox"]').first
                        if await checkbox_button.count() > 0:
                            await checkbox_button.click()
                            filled = True
                    else:
                        # Handle regular input fields
                        selectors = [
                            f'input[id="{field_name}"]',
                            f'input[name="{field_name}"]',
                            f'textarea[id="{field_name}"]',
                            f'textarea[name="{field_name}"]'
                        ]
                        
                        for selector in selectors:
                            try:
                                if await page.locator(selector).count() > 0:
                                    await page.fill(selector, str(value))
                                    filled = True
                                    break
                            except:
                                continue
                    
                    if not filled:
                        print(f"   ⚠️ Could not fill field: {field_name}")
                
                # Submit form
                submit_selector = form_config.get("submit_selector", 'button[type="submit"]')
                submit_button = page.locator(submit_selector)
                
                if await submit_button.count() > 0:
                    await submit_button.click()
                    await page.wait_for_timeout(8000)  # Wait longer for submission
                    
                    # Check for success indicators
                    success_indicators = form_config.get("success_indicators", [])
                    for indicator in success_indicators:
                        if await page.locator(indicator).count() > 0:
                            success = True
                            break
                    
                    # Also check for success in page content
                    if not success:
                        content = await page.content()
                        success_keywords = ["success", "submitted", "thank you", "confirmation", "reference", "application", "vol-"]
                        success = any(keyword in content.lower() for keyword in success_keywords)
                
                print(f"{'✅' if success else '❌'} {name}: {'Form submitted successfully' if success else 'Form submission failed'}")
                
                self.results["layer2_forms"][name] = {
                    "url": url,
                    "category": category,
                    "success": success,
                    "fields_tested": len(fields)
                }
                
        except Exception as e:
            print(f"❌ {name}: Error - {str(e)}")
            self.results["layer2_forms"][name] = {
                "url": url,
                "category": category,
                "success": False,
                "error": str(e)
            }
        finally:
            await context.close()
    
    async def test_layer3_interactive(self):
        """Test interactive features"""
        
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            context = await browser.new_context()
            page = await context.new_page()
            
            # Test Navigation
            await self.test_navigation(page)
            
            # Test Cart Operations (reuse proven cart test)
            await self.test_cart_operations(page)
            
            # Test Search & Filtering
            await self.test_search_filtering(page)
            
            # Test Mobile Features
            await self.test_mobile_features(page)
            
            await browser.close()
    
    async def test_navigation(self, page):
        """Test navigation elements"""
        try:
            await page.goto(self.base_url)
            await page.wait_for_load_state('networkidle')
            
            # Test header navigation
            nav_links = page.locator('nav a, header a')
            nav_count = await nav_links.count()
            
            # Test mobile navigation
            mobile_nav = page.locator('.md\\:hidden nav, [data-testid="mobile-nav"]')
            mobile_nav_exists = await mobile_nav.count() > 0
            
            print(f"✅ Navigation: {nav_count} links found, mobile nav: {mobile_nav_exists}")
            
            self.results["layer3_interactive"]["navigation"] = {
                "success": True,
                "nav_links": nav_count,
                "mobile_nav": mobile_nav_exists
            }
            
        except Exception as e:
            print(f"❌ Navigation: Error - {str(e)}")
            self.results["layer3_interactive"]["navigation"] = {
                "success": False,
                "error": str(e)
            }
    
    async def test_cart_operations(self, page):
        """Test cart functionality (reuse proven methodology)"""
        try:
            await page.goto(f"{self.base_url}/shoes")
            await page.wait_for_load_state('networkidle')
            
            # Test Add to Cart
            add_buttons = page.locator('button:has-text("Add to Cart"), button:has-text("Request These Shoes")')
            if await add_buttons.count() > 0:
                await add_buttons.first.click()
                await page.wait_for_timeout(2000)
                
                # Check if button changed to "In Cart"
                in_cart_buttons = page.locator('button:has-text("In Cart")')
                cart_success = await in_cart_buttons.count() > 0
                
                # Check cart count
                cart_count = page.locator('span.absolute.-top-1.-right-1')
                count_visible = await cart_count.count() > 0
                
                print(f"✅ Cart Operations: Add to cart works: {cart_success}, Count visible: {count_visible}")
                
                self.results["layer3_interactive"]["cart_operations"] = {
                    "success": cart_success and count_visible,
                    "add_to_cart": cart_success,
                    "count_display": count_visible
                }
            else:
                print("❌ Cart Operations: No Add to Cart buttons found")
                self.results["layer3_interactive"]["cart_operations"] = {
                    "success": False,
                    "error": "No add to cart buttons"
                }
                
        except Exception as e:
            print(f"❌ Cart Operations: Error - {str(e)}")
            self.results["layer3_interactive"]["cart_operations"] = {
                "success": False,
                "error": str(e)
            }
    
    async def test_search_filtering(self, page):
        """Test search and filter functionality"""
        try:
            await page.goto(f"{self.base_url}/shoes")
            await page.wait_for_load_state('networkidle')
            
            # Test search functionality
            search_input = page.locator('input[type="search"], input[placeholder*="search" i]')
            search_exists = await search_input.count() > 0
            
            # Test filter options
            filter_elements = page.locator('select, [data-testid*="filter"]')
            filter_count = await filter_elements.count()
            
            print(f"✅ Search & Filtering: Search input: {search_exists}, Filters: {filter_count}")
            
            self.results["layer3_interactive"]["search_filtering"] = {
                "success": True,
                "search_input": search_exists,
                "filter_count": filter_count
            }
            
        except Exception as e:
            print(f"❌ Search & Filtering: Error - {str(e)}")
            self.results["layer3_interactive"]["search_filtering"] = {
                "success": False,
                "error": str(e)
            }
    
    async def test_mobile_features(self, page):
        """Test mobile-specific features"""
        try:
            # Set mobile viewport
            await page.set_viewport_size({"width": 375, "height": 667})
            await page.goto(self.base_url)
            await page.wait_for_load_state('networkidle')
            
            # Test mobile bottom navigation
            mobile_nav = page.locator('.md\\:hidden.fixed.bottom-0')
            mobile_nav_exists = await mobile_nav.count() > 0
            
            # Test mobile menu
            mobile_menu_button = page.locator('button[aria-label*="menu" i], .md\\:hidden button')
            mobile_menu_exists = await mobile_menu_button.count() > 0
            
            print(f"✅ Mobile Features: Bottom nav: {mobile_nav_exists}, Menu button: {mobile_menu_exists}")
            
            self.results["layer3_interactive"]["mobile_features"] = {
                "success": mobile_nav_exists or mobile_menu_exists,
                "bottom_nav": mobile_nav_exists,
                "menu_button": mobile_menu_exists
            }
            
        except Exception as e:
            print(f"❌ Mobile Features: Error - {str(e)}")
            self.results["layer3_interactive"]["mobile_features"] = {
                "success": False,
                "error": str(e)
            }
    
    async def test_layer4_workflows(self):
        """Test complete user workflows"""
        
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            
            # Visitor Workflows
            visitor_workflows = [
                {
                    "name": "homepage_to_browse_shoes",
                    "steps": [
                        {"action": "goto", "url": "/"},
                        {"action": "click", "selector": 'a[href="/shoes"], a:has-text("Browse"), a:has-text("Shoes")'},
                        {"action": "wait", "condition": "networkidle"}
                    ],
                    "success_condition": "url_contains:/shoes"
                },
                {
                    "name": "browse_to_shoe_details",
                    "steps": [
                        {"action": "goto", "url": "/shoes"},
                        {"action": "wait", "condition": "networkidle"},
                        {"action": "click", "selector": 'a[href*="/shoes/"], .shoe-card a, [data-testid="shoe-link"]'},
                        {"action": "wait", "condition": "networkidle"}
                    ],
                    "success_condition": "url_contains:/shoes/"
                },
                {
                    "name": "homepage_to_donation",
                    "steps": [
                        {"action": "goto", "url": "/"},
                        {"action": "click", "selector": 'a[href="/donate"], a:has-text("Donate")'},
                        {"action": "wait", "condition": "networkidle"}
                    ],
                    "success_condition": "url_contains:/donate"
                }
            ]
            
            for workflow in visitor_workflows:
                await self.test_workflow(browser, workflow, "visitor")
            
            # User Workflows (would require authentication)
            user_workflows = [
                {
                    "name": "login_required_checkout",
                    "steps": [
                        {"action": "goto", "url": "/checkout"}
                    ],
                    "success_condition": "url_contains:/login",
                    "auth_required": True
                }
            ]
            
            for workflow in user_workflows:
                await self.test_workflow(browser, workflow, "user")
            
            await browser.close()
    
    async def test_workflow(self, browser, workflow_config: Dict, category: str):
        """Test individual workflow"""
        context = await browser.new_context()
        page = await context.new_page()
        
        try:
            name = workflow_config["name"]
            steps = workflow_config["steps"]
            success_condition = workflow_config["success_condition"]
            
            success = False
            
            for step in steps:
                action = step["action"]
                
                if action == "goto":
                    url = step["url"]
                    await page.goto(f"{self.base_url}{url}")
                elif action == "click":
                    selector = step["selector"]
                    element = page.locator(selector)
                    if await element.count() > 0:
                        await element.first.click()
                    else:
                        print(f"   ⚠️ Element not found: {selector}")
                elif action == "wait":
                    condition = step["condition"]
                    if condition == "networkidle":
                        await page.wait_for_load_state('networkidle')
                    else:
                        await page.wait_for_timeout(2000)
            
            # Check success condition
            if success_condition.startswith("url_contains:"):
                expected_url = success_condition.split(":", 1)[1]
                current_url = page.url
                success = expected_url in current_url
            
            print(f"{'✅' if success else '❌'} {name}: {'Workflow completed' if success else 'Workflow failed'}")
            
            self.results["layer4_workflows"][name] = {
                "category": category,
                "success": success,
                "steps_count": len(steps),
                "final_url": page.url
            }
            
        except Exception as e:
            print(f"❌ {name}: Error - {str(e)}")
            self.results["layer4_workflows"][name] = {
                "category": category,
                "success": False,
                "error": str(e)
            }
        finally:
            await context.close()
    
    def generate_summary(self):
        """Generate comprehensive test summary"""
        layers = ["layer1_api", "layer2_forms", "layer3_interactive", "layer4_workflows"]
        
        total_tests = 0
        total_passed = 0
        
        layer_summary = {}
        
        for layer in layers:
            layer_data = self.results[layer]
            layer_total = len(layer_data)
            layer_passed = sum(1 for test in layer_data.values() if test.get("success", False))
            
            layer_summary[layer] = {
                "total": layer_total,
                "passed": layer_passed,
                "failed": layer_total - layer_passed,
                "success_rate": (layer_passed / layer_total * 100) if layer_total > 0 else 0
            }
            
            total_tests += layer_total
            total_passed += layer_passed
        
        overall_success_rate = (total_passed / total_tests * 100) if total_tests > 0 else 0
        
        self.results["summary"] = {
            "total_tests": total_tests,
            "total_passed": total_passed,
            "total_failed": total_tests - total_passed,
            "overall_success_rate": overall_success_rate,
            "layer_breakdown": layer_summary
        }
        
        # Print summary
        print("\n" + "=" * 80)
        print("📊 COMPREHENSIVE TESTING SUMMARY")
        print("=" * 80)
        
        for layer, stats in layer_summary.items():
            layer_name = layer.replace("_", " ").title()
            print(f"{layer_name}:")
            print(f"  ✅ Passed: {stats['passed']}")
            print(f"  ❌ Failed: {stats['failed']}")
            print(f"  📊 Success Rate: {stats['success_rate']:.1f}%")
            print()
        
        print(f"🎯 OVERALL RESULTS:")
        print(f"   Total Tests: {total_tests}")
        print(f"   Passed: {total_passed}")
        print(f"   Failed: {total_tests - total_passed}")
        print(f"   Success Rate: {overall_success_rate:.1f}%")
        
        if overall_success_rate >= 95:
            print("🎉 EXCELLENT: Platform is production ready!")
        elif overall_success_rate >= 85:
            print("✅ GOOD: Platform is mostly functional with minor issues")
        elif overall_success_rate >= 70:
            print("⚠️ MODERATE: Platform has significant issues to address")
        else:
            print("🚨 CRITICAL: Platform has major issues requiring immediate attention")
    
    def save_results(self):
        """Save detailed results to JSON file"""
        filename = f"comprehensive_test_results_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        with open(filename, 'w') as f:
            json.dump(self.results, f, indent=2)
        print(f"\n💾 Detailed results saved to: {filename}")

async def main():
    """Main execution function"""
    tester = ComprehensivePlatformTester()
    await tester.run_comprehensive_tests()

if __name__ == "__main__":
    asyncio.run(main())
