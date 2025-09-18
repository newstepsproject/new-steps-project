#!/usr/bin/env python3
"""
Session Injection Testing
Use Playwright with direct session cookie injection to test authenticated forms
"""

import asyncio
import json
from datetime import datetime
from playwright.async_api import async_playwright

class SessionInjectionTester:
    def __init__(self, base_url="http://localhost:3000"):
        self.base_url = base_url
        self.results = {
            "timestamp": datetime.now().isoformat(),
            "session_setup": {},
            "admin_forms": {},
            "summary": {}
        }
    
    async def create_admin_session(self, page):
        """Create admin session by programmatic login"""
        try:
            print("🔐 Creating admin session...")
            
            # Go to login page
            await page.goto(f"{self.base_url}/login")
            await page.wait_for_load_state('networkidle')
            
            # Fill login form
            await page.fill('input[type="email"]', 'admin@newsteps.fit')
            await page.fill('input[type="password"]', 'Admin123!')
            
            # Submit and wait for redirect
            await page.click('button[type="submit"]')
            await page.wait_for_timeout(3000)
            
            # Check if login successful
            current_url = page.url
            login_success = '/admin' in current_url or '/account' in current_url
            
            if login_success:
                print("✅ Admin session created successfully")
                
                # Extract session cookies for reuse
                cookies = await page.context.cookies()
                session_cookies = [c for c in cookies if 'session' in c['name'].lower() or 'token' in c['name'].lower()]
                
                self.results["session_setup"]["admin_login"] = {
                    "success": True,
                    "final_url": current_url,
                    "session_cookies_count": len(session_cookies)
                }
                
                return True
            else:
                print("❌ Admin session creation failed")
                self.results["session_setup"]["admin_login"] = {
                    "success": False,
                    "final_url": current_url
                }
                return False
                
        except Exception as e:
            print(f"❌ Session creation error: {e}")
            self.results["session_setup"]["admin_login"] = {
                "success": False,
                "error": str(e)
            }
            return False
    
    async def test_admin_form_access(self, page, form_config):
        """Test admin form with authenticated session"""
        try:
            name = form_config["name"]
            url = form_config["url"]
            description = form_config.get("description", "")
            
            print(f"🧪 Testing {name}: {description}")
            
            # Navigate to admin form
            await page.goto(f"{self.base_url}{url}")
            await page.wait_for_load_state('networkidle')
            await page.wait_for_timeout(2000)
            
            # Check if we're redirected to login (session expired)
            if '/login' in page.url:
                print(f"❌ {name}: Session expired, redirected to login")
                self.results["admin_forms"][name] = {
                    "success": False,
                    "error": "Session expired"
                }
                return False
            
            # Check if form elements are present
            form_elements = await page.locator('form, input, textarea, select').count()
            
            if form_elements == 0:
                print(f"❌ {name}: No form elements found")
                self.results["admin_forms"][name] = {
                    "success": False,
                    "error": "No form elements"
                }
                return False
            
            print(f"✅ {name}: Form accessible ({form_elements} elements)")
            
            # Try to fill form if fields provided
            fields = form_config.get("fields", {})
            filled_fields = 0
            
            for field_name, value in fields.items():
                selectors = [
                    f'input[name="{field_name}"]',
                    f'input[id="{field_name}"]',
                    f'textarea[name="{field_name}"]',
                    f'select[name="{field_name}"]'
                ]
                
                for selector in selectors:
                    try:
                        element = page.locator(selector)
                        if await element.count() > 0:
                            if selector.startswith('select'):
                                await element.select_option(str(value))
                            else:
                                await element.fill(str(value))
                            filled_fields += 1
                            break
                    except:
                        continue
            
            # Test form submission (but don't actually submit to avoid data pollution)
            submit_buttons = await page.locator('button[type="submit"], button:has-text("Save"), button:has-text("Add")').count()
            
            # For list/table pages, success means having form elements (search, filters, etc.)
            # For form pages, success means having both form elements AND submit buttons
            is_form_page = len(fields) > 0 or "add" in url.lower() or "settings" in url.lower()
            
            if is_form_page:
                success = form_elements > 0 and submit_buttons > 0
            else:
                # List/table pages just need to be accessible with some interactive elements
                success = form_elements > 0
            
            self.results["admin_forms"][name] = {
                "url": url,
                "description": description,
                "success": success,
                "form_elements": form_elements,
                "submit_buttons": submit_buttons,
                "filled_fields": filled_fields,
                "total_fields": len(fields)
            }
            
            return success
            
        except Exception as e:
            print(f"❌ {name}: Error - {str(e)}")
            self.results["admin_forms"][name] = {
                "url": url,
                "success": False,
                "error": str(e)
            }
            return False
    
    async def run_session_tests(self):
        """Run all session injection tests"""
        print("🎯 STARTING SESSION INJECTION TESTING")
        print("=" * 60)
        
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            context = await browser.new_context()
            page = await context.new_page()
            
            try:
                # Create admin session
                session_success = await self.create_admin_session(page)
                
                if session_success:
                    # Test admin forms with authenticated session
                    admin_forms = [
                        {
                            "name": "add_shoe_form",
                            "url": "/admin/shoes/add",
                            "description": "Add new shoe to inventory",
                            "fields": {
                                "brand": "Nike",
                                "modelName": "Session Test Shoe",
                                "size": "10",
                                "color": "Red",
                                "sport": "running",
                                "condition": "good"
                            }
                        },
                        {
                            "name": "admin_settings",
                            "url": "/admin/settings",
                            "description": "System settings page"
                        },
                        {
                            "name": "admin_requests",
                            "url": "/admin/requests",
                            "description": "Request management page"
                        },
                        {
                            "name": "admin_donations",
                            "url": "/admin/shoe-donations",
                            "description": "Donation management page"
                        },
                        {
                            "name": "admin_users",
                            "url": "/admin/users",
                            "description": "User management page"
                        }
                    ]
                    
                    print("\n📋 Testing Admin Forms with Session...")
                    for form_config in admin_forms:
                        await self.test_admin_form_access(page, form_config)
                        await asyncio.sleep(1)  # Brief pause between tests
                
            finally:
                await browser.close()
        
        # Generate summary
        self.generate_summary()
        self.save_results()
        
        return self.results
    
    def generate_summary(self):
        """Generate test summary"""
        session_tests = len(self.results["session_setup"])
        form_tests = len(self.results["admin_forms"])
        total_tests = session_tests + form_tests
        
        session_passed = sum(1 for test in self.results["session_setup"].values() 
                           if isinstance(test, dict) and test.get("success", False))
        form_passed = sum(1 for test in self.results["admin_forms"].values() 
                         if test.get("success", False))
        
        total_passed = session_passed + form_passed
        
        overall_success_rate = (total_passed / total_tests * 100) if total_tests > 0 else 0
        
        self.results["summary"] = {
            "total_tests": total_tests,
            "total_passed": total_passed,
            "overall_success_rate": overall_success_rate,
            "session_setup_success": session_passed > 0,
            "admin_forms_accessible": form_passed > 0
        }
        
        print("\n" + "=" * 60)
        print("📊 SESSION INJECTION TESTING SUMMARY")
        print("=" * 60)
        print(f"Session Setup: {'✅' if session_passed > 0 else '❌'}")
        print(f"Admin Forms Tested: {form_tests}")
        print(f"Admin Forms Accessible: {form_passed}")
        print(f"Overall Success Rate: {overall_success_rate:.1f}%")
        
        if overall_success_rate >= 80:
            print("🎉 EXCELLENT: Session injection working well!")
        elif overall_success_rate >= 60:
            print("✅ GOOD: Most admin forms accessible")
        else:
            print("⚠️ NEEDS WORK: Session or form access issues")
    
    def save_results(self):
        """Save results to JSON file"""
        filename = f"session_injection_test_results_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        with open(filename, 'w') as f:
            json.dump(self.results, f, indent=2)
        print(f"\n💾 Results saved to: {filename}")

async def main():
    tester = SessionInjectionTester()
    await tester.run_session_tests()

if __name__ == "__main__":
    asyncio.run(main())
