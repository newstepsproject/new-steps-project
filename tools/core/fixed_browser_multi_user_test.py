#!/usr/bin/env python3
"""
FIXED REAL BROWSER-BASED MULTI-USER TESTING FRAMEWORK
Robust Playwright implementation with proper error handling
"""

import asyncio
import json
import sys
import time
from datetime import datetime
from playwright.async_api import async_playwright

class FixedBrowserTester:
    def __init__(self, base_url):
        self.base_url = base_url.rstrip('/')
        self.results = {
            'timestamp': datetime.now().isoformat(),
            'base_url': base_url,
            'tests': [],
            'overall_success_rate': 0,
            'issues': []
        }
        
    def log(self, message, level="INFO"):
        timestamp = datetime.now().strftime("%H:%M:%S")
        print(f"[{timestamp}] {level}: {message}")
        
    def add_test_result(self, name, success, details=None):
        """Add a test result to the results list"""
        self.results['tests'].append({
            'name': name,
            'success': success,
            'details': details or {}
        })

    async def test_homepage_navigation(self, page):
        """Test homepage loading and navigation"""
        self.log("Testing homepage navigation...")
        
        try:
            await page.goto(f"{self.base_url}/", wait_until='networkidle', timeout=30000)
            
            # Check basic page elements
            title = await page.title()
            hero_element = await page.query_selector('h1, .hero, [data-testid="hero"]')
            nav_element = await page.query_selector('nav, .nav, [data-testid="nav"]')
            
            success = bool(title and hero_element and nav_element)
            details = {
                'title': title,
                'has_hero': bool(hero_element),
                'has_nav': bool(nav_element),
                'url': page.url
            }
            
            self.add_test_result('homepage_navigation', success, details)
            return success
            
        except Exception as e:
            self.add_test_result('homepage_navigation', False, {'error': str(e)})
            self.results['issues'].append(f"Homepage navigation error: {str(e)}")
            return False

    async def test_shoes_catalog(self, page):
        """Test shoes catalog browsing"""
        self.log("Testing shoes catalog...")
        
        try:
            await page.goto(f"{self.base_url}/shoes", wait_until='networkidle', timeout=30000)
            
            # Wait for shoes to load with multiple possible selectors
            shoe_selectors = ['.grid', '[data-testid="shoes-grid"]', '.shoe-card', '.shoes-container']
            shoes_container = None
            
            for selector in shoe_selectors:
                try:
                    await page.wait_for_selector(selector, timeout=10000)
                    shoes_container = await page.query_selector(selector)
                    if shoes_container:
                        break
                except:
                    continue
            
            # Count shoe items
            shoe_items = await page.query_selector_all('.grid > div, [data-testid="shoe-card"], .shoe-card, .shoe-item')
            
            # Try to click on first shoe if available
            shoe_detail_accessible = False
            if shoe_items:
                try:
                    await shoe_items[0].click()
                    await page.wait_for_load_state('networkidle', timeout=10000)
                    shoe_detail_accessible = '/shoes/' in page.url
                except:
                    pass
            
            success = len(shoe_items) > 0
            details = {
                'shoes_found': len(shoe_items),
                'has_container': bool(shoes_container),
                'shoe_detail_accessible': shoe_detail_accessible,
                'final_url': page.url
            }
            
            self.add_test_result('shoes_catalog_browsing', success, details)
            return success
            
        except Exception as e:
            self.add_test_result('shoes_catalog_browsing', False, {'error': str(e)})
            self.results['issues'].append(f"Shoes catalog error: {str(e)}")
            return False

    async def test_contact_form(self, page):
        """Test contact form submission"""
        self.log("Testing contact form...")
        
        try:
            await page.goto(f"{self.base_url}/contact", wait_until='networkidle', timeout=30000)
            
            # Try multiple selector strategies for form fields
            form_filled = False
            
            # Strategy 1: Try by name attributes
            try:
                await page.fill('input[name="firstName"]', 'Test')
                await page.fill('input[name="lastName"]', 'User')
                await page.fill('input[name="email"]', f'test_{int(time.time())}@example.com')
                await page.fill('textarea[name="message"]', 'Test message from browser automation')
                form_filled = True
            except:
                pass
            
            # Strategy 2: Try by type and position
            if not form_filled:
                try:
                    text_inputs = await page.query_selector_all('input[type="text"]')
                    email_input = await page.query_selector('input[type="email"]')
                    textarea = await page.query_selector('textarea')
                    
                    if len(text_inputs) >= 2 and email_input and textarea:
                        await text_inputs[0].fill('Test')
                        await text_inputs[1].fill('User')
                        await email_input.fill(f'test_{int(time.time())}@example.com')
                        await textarea.fill('Test message from browser automation')
                        form_filled = True
                except:
                    pass
            
            # Try to submit form
            form_submitted = False
            if form_filled:
                try:
                    submit_selectors = [
                        'button[type="submit"]',
                        'button:has-text("Send")',
                        'button:has-text("Submit")',
                        'input[type="submit"]'
                    ]
                    
                    for selector in submit_selectors:
                        submit_btn = await page.query_selector(selector)
                        if submit_btn:
                            await submit_btn.click()
                            form_submitted = True
                            break
                except:
                    pass
            
            # Wait for response and check for success indicators
            if form_submitted:
                await page.wait_for_timeout(5000)
                
                success_selectors = [
                    'text=success',
                    'text=sent',
                    'text=thank',
                    '.success',
                    '[data-testid="success"]'
                ]
                
                success_found = False
                for selector in success_selectors:
                    element = await page.query_selector(selector)
                    if element:
                        success_found = True
                        break
            
            success = form_filled and form_submitted
            details = {
                'form_filled': form_filled,
                'form_submitted': form_submitted,
                'success_message_found': success_found if form_submitted else False,
                'final_url': page.url
            }
            
            self.add_test_result('contact_form_submission', success, details)
            return success
            
        except Exception as e:
            self.add_test_result('contact_form_submission', False, {'error': str(e)})
            self.results['issues'].append(f"Contact form error: {str(e)}")
            return False

    async def test_user_registration(self, page):
        """Test user registration process"""
        self.log("Testing user registration...")
        
        try:
            await page.goto(f"{self.base_url}/register", wait_until='networkidle', timeout=30000)
            
            # Generate unique user data
            timestamp = int(time.time())
            user_data = {
                'firstName': 'TestUser',
                'lastName': 'Browser',
                'email': f'testuser_browser_{timestamp}@example.com',
                'password': 'TestPassword123!',
                'phone': '1234567890'
            }
            
            # Fill registration form with multiple strategies
            form_filled = False
            
            # Strategy 1: By name attributes
            try:
                await page.fill('input[name="firstName"]', user_data['firstName'])
                await page.fill('input[name="lastName"]', user_data['lastName'])
                await page.fill('input[name="email"]', user_data['email'])
                await page.fill('input[name="password"]', user_data['password'])
                await page.fill('input[name="phone"]', user_data['phone'])
                form_filled = True
            except:
                pass
            
            # Strategy 2: By type and position
            if not form_filled:
                try:
                    text_inputs = await page.query_selector_all('input[type="text"]')
                    email_input = await page.query_selector('input[type="email"]')
                    password_input = await page.query_selector('input[type="password"]')
                    
                    if len(text_inputs) >= 3 and email_input and password_input:
                        await text_inputs[0].fill(user_data['firstName'])
                        await text_inputs[1].fill(user_data['lastName'])
                        await email_input.fill(user_data['email'])
                        await password_input.fill(user_data['password'])
                        if len(text_inputs) >= 3:
                            await text_inputs[2].fill(user_data['phone'])
                        form_filled = True
                except:
                    pass
            
            # Submit registration
            registration_submitted = False
            if form_filled:
                try:
                    submit_selectors = [
                        'button[type="submit"]:has-text("Register")',
                        'button[type="submit"]:has-text("Sign Up")',
                        'button[type="submit"]',
                        'input[type="submit"]'
                    ]
                    
                    for selector in submit_selectors:
                        submit_btn = await page.query_selector(selector)
                        if submit_btn:
                            await submit_btn.click()
                            registration_submitted = True
                            break
                except:
                    pass
            
            # Check for success indicators
            registration_success = False
            if registration_submitted:
                await page.wait_for_timeout(8000)  # Wait longer for registration processing
                
                current_url = page.url
                success_indicators = [
                    'login' in current_url.lower(),
                    'account' in current_url.lower(),
                    await page.query_selector('text=success'),
                    await page.query_selector('text=registered'),
                    await page.query_selector('text=verify'),
                    await page.query_selector('.success')
                ]
                
                registration_success = any(indicator for indicator in success_indicators)
            
            success = form_filled and registration_submitted and registration_success
            details = {
                'form_filled': form_filled,
                'registration_submitted': registration_submitted,
                'registration_success': registration_success,
                'user_email': user_data['email'],
                'final_url': page.url
            }
            
            self.add_test_result('user_registration', success, details)
            return success, user_data
            
        except Exception as e:
            self.add_test_result('user_registration', False, {'error': str(e)})
            self.results['issues'].append(f"User registration error: {str(e)}")
            return False, None

    async def test_user_login(self, page, user_data):
        """Test user login process"""
        if not user_data:
            self.add_test_result('user_login', False, {'error': 'No user data from registration'})
            return False
            
        self.log("Testing user login...")
        
        try:
            await page.goto(f"{self.base_url}/login", wait_until='networkidle', timeout=30000)
            
            # Fill login form
            login_filled = False
            try:
                await page.fill('input[name="email"]', user_data['email'])
                await page.fill('input[name="password"]', user_data['password'])
                login_filled = True
            except:
                try:
                    await page.fill('input[type="email"]', user_data['email'])
                    await page.fill('input[type="password"]', user_data['password'])
                    login_filled = True
                except:
                    pass
            
            # Submit login
            login_submitted = False
            if login_filled:
                try:
                    submit_selectors = [
                        'button[type="submit"]:has-text("Sign In")',
                        'button[type="submit"]:has-text("Login")',
                        'button[type="submit"]'
                    ]
                    
                    for selector in submit_selectors:
                        submit_btn = await page.query_selector(selector)
                        if submit_btn:
                            await submit_btn.click()
                            login_submitted = True
                            break
                except:
                    pass
            
            # Check for login success
            login_success = False
            if login_submitted:
                await page.wait_for_timeout(5000)
                
                current_url = page.url
                success_indicators = [
                    'account' in current_url.lower(),
                    'dashboard' in current_url.lower(),
                    await page.query_selector('button:has-text("Logout")'),
                    await page.query_selector('a:has-text("Account")'),
                    await page.query_selector('[data-testid="user-menu"]')
                ]
                
                login_success = any(indicator for indicator in success_indicators)
            
            success = login_filled and login_submitted and login_success
            details = {
                'login_filled': login_filled,
                'login_submitted': login_submitted,
                'login_success': login_success,
                'final_url': page.url
            }
            
            self.add_test_result('user_login', success, details)
            return success
            
        except Exception as e:
            self.add_test_result('user_login', False, {'error': str(e)})
            self.results['issues'].append(f"User login error: {str(e)}")
            return False

    async def test_admin_login(self, page):
        """Test admin login and dashboard access"""
        self.log("Testing admin login...")
        
        try:
            await page.goto(f"{self.base_url}/login", wait_until='networkidle', timeout=30000)
            
            # Fill admin credentials
            await page.fill('input[type="email"]', 'admin@newsteps.fit')
            await page.fill('input[type="password"]', 'Admin123!')
            
            # Submit login
            await page.click('button[type="submit"]')
            await page.wait_for_timeout(5000)
            
            # Try to access admin dashboard
            await page.goto(f"{self.base_url}/admin", wait_until='networkidle', timeout=15000)
            
            current_url = page.url
            admin_elements = await page.query_selector_all('text=Dashboard, text=Admin, [data-testid="admin"]')
            
            success = 'admin' in current_url.lower() and len(admin_elements) > 0
            details = {
                'admin_url_accessible': 'admin' in current_url.lower(),
                'has_admin_elements': len(admin_elements) > 0,
                'final_url': current_url
            }
            
            self.add_test_result('admin_login', success, details)
            return success
            
        except Exception as e:
            self.add_test_result('admin_login', False, {'error': str(e)})
            self.results['issues'].append(f"Admin login error: {str(e)}")
            return False

    async def test_complete_user_journey(self, page):
        """Test complete user journey from visitor to authenticated user"""
        self.log("Testing complete user journey...")
        
        try:
            # Step 1: Browse as visitor
            await page.goto(f"{self.base_url}/shoes", wait_until='networkidle', timeout=30000)
            shoes_found = len(await page.query_selector_all('.grid > div, .shoe-card, .shoe-item'))
            
            # Step 2: Go to registration
            await page.goto(f"{self.base_url}/register", wait_until='networkidle', timeout=30000)
            
            # Step 3: Quick registration test
            timestamp = int(time.time())
            try:
                await page.fill('input[name="firstName"]', 'Journey')
                await page.fill('input[name="lastName"]', 'Test')
                await page.fill('input[name="email"]', f'journey_{timestamp}@example.com')
                await page.fill('input[name="password"]', 'JourneyTest123!')
                await page.fill('input[name="phone"]', '1234567890')
                
                await page.click('button[type="submit"]')
                await page.wait_for_timeout(5000)
                
                registration_success = 'login' in page.url.lower() or await page.query_selector('text=success')
            except:
                registration_success = False
            
            success = shoes_found > 0 and registration_success
            details = {
                'shoes_browsed': shoes_found,
                'registration_attempted': True,
                'registration_success': registration_success,
                'final_url': page.url
            }
            
            self.add_test_result('complete_user_journey', success, details)
            return success
            
        except Exception as e:
            self.add_test_result('complete_user_journey', False, {'error': str(e)})
            self.results['issues'].append(f"User journey error: {str(e)}")
            return False

    async def run_all_tests(self):
        """Run all browser tests"""
        self.log("🚀 Starting Comprehensive Browser Testing")
        self.log("=" * 80)
        
        start_time = time.time()
        
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            
            try:
                context = await browser.new_context()
                page = await context.new_page()
                
                # Run all tests
                await self.test_homepage_navigation(page)
                await self.test_shoes_catalog(page)
                await self.test_contact_form(page)
                
                # User workflow tests
                registration_success, user_data = await self.test_user_registration(page)
                if registration_success and user_data:
                    await self.test_user_login(page, user_data)
                
                # Admin tests
                await self.test_admin_login(page)
                
                # Complete journey test
                await self.test_complete_user_journey(page)
                
                await context.close()
                
            finally:
                await browser.close()
        
        # Calculate results
        execution_time = time.time() - start_time
        self.calculate_results()
        self.generate_report(execution_time)
        
        return self.results

    def calculate_results(self):
        """Calculate overall success rate"""
        total_tests = len(self.results['tests'])
        successful_tests = sum(1 for test in self.results['tests'] if test['success'])
        
        self.results['total_tests'] = total_tests
        self.results['successful_tests'] = successful_tests
        self.results['overall_success_rate'] = (successful_tests / total_tests * 100) if total_tests > 0 else 0

    def generate_report(self, execution_time):
        """Generate comprehensive test report"""
        print("\n" + "=" * 80)
        print("🌐 COMPREHENSIVE BROWSER TESTING REPORT")
        print("=" * 80)
        
        print(f"\n🎯 OVERALL RESULTS:")
        print(f"  Success Rate: {self.results['overall_success_rate']:.1f}%")
        print(f"  Total Tests: {self.results['total_tests']}")
        print(f"  Successful: {self.results['successful_tests']}")
        print(f"  Failed: {self.results['total_tests'] - self.results['successful_tests']}")
        print(f"  Execution Time: {execution_time:.1f} seconds")
        print(f"  Environment: {self.base_url}")
        
        print(f"\n📋 DETAILED TEST RESULTS:")
        for test in self.results['tests']:
            status = '✅' if test['success'] else '❌'
            print(f"  {status} {test['name']}")
            if not test['success'] and 'error' in test['details']:
                print(f"      Error: {test['details']['error']}")
        
        if self.results['issues']:
            print(f"\n❌ ISSUES FOUND ({len(self.results['issues'])}):")
            for i, issue in enumerate(self.results['issues'][:5], 1):
                print(f"  {i}. {issue}")
            if len(self.results['issues']) > 5:
                print(f"  ... and {len(self.results['issues']) - 5} more issues")
        
        # Success rate assessment
        success_rate = self.results['overall_success_rate']
        if success_rate >= 90:
            print(f"\n🎉 STATUS: EXCELLENT - Browser workflows validated")
        elif success_rate >= 75:
            print(f"\n✅ STATUS: GOOD - Minor browser issues found")
        elif success_rate >= 50:
            print(f"\n⚠️ STATUS: ACCEPTABLE - Significant browser improvements needed")
        else:
            print(f"\n❌ STATUS: CRITICAL - Major browser functionality issues")
        
        # Save results
        timestamp = int(time.time())
        filename = f"browser_test_results_{timestamp}.json"
        with open(filename, 'w') as f:
            json.dump(self.results, f, indent=2)
        
        print(f"\n📄 Detailed results saved to: {filename}")
        print("=" * 80)

async def main():
    if len(sys.argv) != 2:
        print("Usage: python fixed_browser_multi_user_test.py <base_url>")
        print("Example: python fixed_browser_multi_user_test.py https://newsteps.fit")
        sys.exit(1)
    
    base_url = sys.argv[1]
    tester = FixedBrowserTester(base_url)
    
    try:
        results = await tester.run_all_tests()
        
        # Exit with appropriate code
        success_rate = results.get('overall_success_rate', 0)
        if success_rate >= 75:
            sys.exit(0)
        else:
            sys.exit(1)
            
    except KeyboardInterrupt:
        print("\n\n⚠️ Browser testing interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n\n❌ Browser testing failed with error: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main())
