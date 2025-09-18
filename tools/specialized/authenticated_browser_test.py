#!/usr/bin/env python3
"""
AUTHENTICATED BROWSER TESTING FRAMEWORK
Real login sessions with complete authenticated workflows
"""

import asyncio
import json
import sys
import time
from datetime import datetime
from playwright.async_api import async_playwright

class AuthenticatedBrowserTester:
    def __init__(self, base_url):
        self.base_url = base_url.rstrip('/')
        self.results = {
            'timestamp': datetime.now().isoformat(),
            'base_url': base_url,
            'authenticated_tests': [],
            'overall_success_rate': 0,
            'issues': []
        }
        
    def log(self, message, level="INFO"):
        timestamp = datetime.now().strftime("%H:%M:%S")
        print(f"[{timestamp}] {level}: {message}")
        
    def add_test_result(self, name, success, details=None):
        """Add a test result to the results list"""
        self.results['authenticated_tests'].append({
            'name': name,
            'success': success,
            'details': details or {}
        })

    async def create_test_user_and_login(self, page):
        """Create a test user account and login"""
        self.log("🔐 Creating test user and logging in...")
        
        try:
            # Generate unique user data
            timestamp = int(time.time())
            user_data = {
                'firstName': 'TestUser',
                'lastName': 'Authenticated',
                'email': f'testauth_{timestamp}@example.com',
                'password': 'TestAuth123!',
                'phone': '1234567890'
            }
            
            # Step 1: Register new user
            await page.goto(f"{self.base_url}/register", wait_until='networkidle', timeout=30000)
            
            # Fill registration form
            await page.fill('input[name="firstName"]', user_data['firstName'])
            await page.fill('input[name="lastName"]', user_data['lastName'])
            await page.fill('input[name="email"]', user_data['email'])
            await page.fill('input[name="password"]', user_data['password'])
            await page.fill('input[name="phone"]', user_data['phone'])
            
            # Submit registration
            await page.click('button[type="submit"]')
            await page.wait_for_timeout(8000)  # Wait for registration processing
            
            # Step 2: Login with new user
            await page.goto(f"{self.base_url}/login", wait_until='networkidle', timeout=30000)
            
            await page.fill('input[type="email"]', user_data['email'])
            await page.fill('input[type="password"]', user_data['password'])
            await page.click('button[type="submit"]')
            await page.wait_for_timeout(5000)
            
            # Verify login success
            current_url = page.url
            logout_element = await page.query_selector('text=Logout')
            account_element = await page.query_selector('text=Account')
            user_menu_element = await page.query_selector('[data-testid="user-menu"]')
            
            is_logged_in = (
                'account' in current_url.lower() or 
                bool(logout_element) or
                bool(account_element) or
                bool(user_menu_element)
            )
            
            success = bool(is_logged_in)
            details = {
                'user_email': user_data['email'],
                'registration_attempted': True,
                'login_attempted': True,
                'login_success': is_logged_in,
                'final_url': current_url
            }
            
            self.add_test_result('user_registration_and_login', success, details)
            return success, user_data if success else None
            
        except Exception as e:
            self.add_test_result('user_registration_and_login', False, {'error': str(e)})
            self.results['issues'].append(f"User registration/login error: {str(e)}")
            return False, None

    async def test_authenticated_shoe_browsing(self, page, user_data):
        """Test shoe browsing while logged in"""
        if not user_data:
            self.add_test_result('authenticated_shoe_browsing', False, {'error': 'No authenticated user'})
            return False
            
        self.log("👟 Testing authenticated shoe browsing...")
        
        try:
            await page.goto(f"{self.base_url}/shoes", wait_until='networkidle', timeout=30000)
            
            # Count available shoes
            shoe_cards = await page.query_selector_all('.grid > div, .shoe-card, .shoe-item')
            shoes_count = len(shoe_cards)
            
            # Try to click on first shoe for detail view
            shoe_detail_success = False
            if shoe_cards:
                try:
                    await shoe_cards[0].click()
                    await page.wait_for_timeout(3000)
                    shoe_detail_success = '/shoes/' in page.url and page.url != f"{self.base_url}/shoes"
                except:
                    pass
            
            # Look for "Add to Cart" or "Request" buttons (authenticated users should see these)
            add_to_cart_buttons = await page.query_selector_all('button:has-text("Add to Cart"), button:has-text("Request"), button:has-text("Add to Request")')
            has_request_functionality = len(add_to_cart_buttons) > 0
            
            success = shoes_count > 0 and has_request_functionality
            details = {
                'shoes_found': shoes_count,
                'shoe_detail_accessible': shoe_detail_success,
                'has_request_buttons': has_request_functionality,
                'request_buttons_count': len(add_to_cart_buttons),
                'final_url': page.url
            }
            
            self.add_test_result('authenticated_shoe_browsing', success, details)
            return success
            
        except Exception as e:
            self.add_test_result('authenticated_shoe_browsing', False, {'error': str(e)})
            self.results['issues'].append(f"Authenticated shoe browsing error: {str(e)}")
            return False

    async def test_shoe_request_workflow(self, page, user_data):
        """Test complete shoe request workflow"""
        if not user_data:
            self.add_test_result('shoe_request_workflow', False, {'error': 'No authenticated user'})
            return False
            
        self.log("🛒 Testing shoe request workflow...")
        
        try:
            # Go to shoes page
            await page.goto(f"{self.base_url}/shoes", wait_until='networkidle', timeout=30000)
            
            # Find and click first available shoe
            shoe_cards = await page.query_selector_all('.grid > div, .shoe-card, .shoe-item')
            if not shoe_cards:
                self.add_test_result('shoe_request_workflow', False, {'error': 'No shoes found'})
                return False
            
            # Click on first shoe
            await shoe_cards[0].click()
            await page.wait_for_timeout(3000)
            
            # Look for "Add to Cart" or "Request" button
            request_selectors = [
                'button:has-text("Add to Cart")',
                'button:has-text("Request These Shoes")',
                'button:has-text("Add to Request")',
                'button[data-testid="add-to-cart"]'
            ]
            
            request_button = None
            for selector in request_selectors:
                request_button = await page.query_selector(selector)
                if request_button:
                    break
            
            # Add shoe to cart/request
            cart_added = False
            if request_button:
                try:
                    await request_button.click()
                    await page.wait_for_timeout(2000)
                    cart_added = True
                except:
                    pass
            
            # Try to access cart/checkout
            checkout_accessible = False
            if cart_added:
                try:
                    # Look for cart icon or checkout link
                    cart_selectors = [
                        'a[href="/cart"]',
                        'a[href="/checkout"]',
                        'button:has-text("Cart")',
                        '[data-testid="cart"]'
                    ]
                    
                    for selector in cart_selectors:
                        cart_link = await page.query_selector(selector)
                        if cart_link:
                            await cart_link.click()
                            await page.wait_for_timeout(3000)
                            checkout_accessible = 'cart' in page.url.lower() or 'checkout' in page.url.lower()
                            break
                except:
                    pass
            
            success = cart_added and checkout_accessible
            details = {
                'shoes_available': len(shoe_cards),
                'request_button_found': bool(request_button),
                'cart_added': cart_added,
                'checkout_accessible': checkout_accessible,
                'final_url': page.url
            }
            
            self.add_test_result('shoe_request_workflow', success, details)
            return success
            
        except Exception as e:
            self.add_test_result('shoe_request_workflow', False, {'error': str(e)})
            self.results['issues'].append(f"Shoe request workflow error: {str(e)}")
            return False

    async def test_user_account_access(self, page, user_data):
        """Test user account page access and functionality"""
        if not user_data:
            self.add_test_result('user_account_access', False, {'error': 'No authenticated user'})
            return False
            
        self.log("👤 Testing user account access...")
        
        try:
            # Try to access account page
            await page.goto(f"{self.base_url}/account", wait_until='networkidle', timeout=30000)
            
            # Check if we're on account page and not redirected to login
            current_url = page.url
            on_account_page = 'account' in current_url.lower() and 'login' not in current_url.lower()
            
            # Look for user information display
            user_info_elements = await page.query_selector_all('text=' + user_data['firstName'] + ', text=' + user_data['email'])
            has_user_info = len(user_info_elements) > 0
            
            # Look for account sections (requests, donations, etc.)
            account_sections = await page.query_selector_all('h2, h3, .card, [data-testid="account-section"]')
            has_account_sections = len(account_sections) > 0
            
            # Check for logout functionality
            logout_button = await page.query_selector('button:has-text("Logout"), a:has-text("Logout"), button:has-text("Sign Out")')
            has_logout = bool(logout_button)
            
            success = on_account_page and (has_user_info or has_account_sections) and has_logout
            details = {
                'on_account_page': on_account_page,
                'has_user_info': has_user_info,
                'has_account_sections': has_account_sections,
                'account_sections_count': len(account_sections),
                'has_logout': has_logout,
                'final_url': current_url
            }
            
            self.add_test_result('user_account_access', success, details)
            return success
            
        except Exception as e:
            self.add_test_result('user_account_access', False, {'error': str(e)})
            self.results['issues'].append(f"User account access error: {str(e)}")
            return False

    async def test_admin_login_and_dashboard(self, page):
        """Test admin login and dashboard functionality"""
        self.log("🔑 Testing admin login and dashboard...")
        
        try:
            # Go to login page
            await page.goto(f"{self.base_url}/login", wait_until='networkidle', timeout=30000)
            
            # Login as admin
            await page.fill('input[type="email"]', 'admin@newsteps.fit')
            await page.fill('input[type="password"]', 'Admin123!')
            await page.click('button[type="submit"]')
            await page.wait_for_timeout(5000)
            
            # Try to access admin dashboard
            await page.goto(f"{self.base_url}/admin", wait_until='networkidle', timeout=15000)
            
            current_url = page.url
            on_admin_page = 'admin' in current_url.lower() and 'login' not in current_url.lower()
            
            # Look for admin dashboard elements
            admin_elements = await page.query_selector_all('text=Dashboard, text=Admin, h1, h2, .card, [data-testid="admin"]')
            has_admin_elements = len(admin_elements) > 0
            
            # Look for admin navigation/menu items
            admin_nav_items = await page.query_selector_all('a:has-text("Shoes"), a:has-text("Users"), a:has-text("Requests"), a:has-text("Donations")')
            has_admin_nav = len(admin_nav_items) > 0
            
            success = on_admin_page and has_admin_elements
            details = {
                'admin_login_attempted': True,
                'on_admin_page': on_admin_page,
                'has_admin_elements': has_admin_elements,
                'admin_elements_count': len(admin_elements),
                'has_admin_nav': has_admin_nav,
                'admin_nav_count': len(admin_nav_items),
                'final_url': current_url
            }
            
            self.add_test_result('admin_login_and_dashboard', success, details)
            return success
            
        except Exception as e:
            self.add_test_result('admin_login_and_dashboard', False, {'error': str(e)})
            self.results['issues'].append(f"Admin login/dashboard error: {str(e)}")
            return False

    async def test_admin_inventory_management(self, page):
        """Test admin inventory management functionality"""
        self.log("📦 Testing admin inventory management...")
        
        try:
            # Navigate to admin shoes/inventory page
            await page.goto(f"{self.base_url}/admin/shoes", wait_until='networkidle', timeout=30000)
            
            current_url = page.url
            on_inventory_page = 'admin' in current_url.lower() and 'shoes' in current_url.lower()
            
            # Look for inventory table/grid
            inventory_elements = await page.query_selector_all('table, .grid, .shoe-item, tr, td')
            has_inventory_display = len(inventory_elements) > 0
            
            # Look for admin action buttons
            admin_buttons = await page.query_selector_all('button:has-text("Add"), button:has-text("Edit"), button:has-text("Delete"), button:has-text("Update")')
            has_admin_actions = len(admin_buttons) > 0
            
            # Count displayed shoes in admin view
            shoe_rows = await page.query_selector_all('tr:has(td), .shoe-item, .inventory-item')
            admin_shoes_count = len(shoe_rows)
            
            success = on_inventory_page and has_inventory_display
            details = {
                'on_inventory_page': on_inventory_page,
                'has_inventory_display': has_inventory_display,
                'inventory_elements_count': len(inventory_elements),
                'has_admin_actions': has_admin_actions,
                'admin_buttons_count': len(admin_buttons),
                'admin_shoes_count': admin_shoes_count,
                'final_url': current_url
            }
            
            self.add_test_result('admin_inventory_management', success, details)
            return success
            
        except Exception as e:
            self.add_test_result('admin_inventory_management', False, {'error': str(e)})
            self.results['issues'].append(f"Admin inventory management error: {str(e)}")
            return False

    async def test_donation_form_submission(self, page, user_data):
        """Test donation form submission while logged in"""
        if not user_data:
            self.add_test_result('donation_form_submission', False, {'error': 'No authenticated user'})
            return False
            
        self.log("💝 Testing donation form submission...")
        
        try:
            # Go to donation page
            await page.goto(f"{self.base_url}/donate", wait_until='networkidle', timeout=30000)
            
            # Fill donation form
            form_filled = False
            try:
                # Try to fill donation form fields
                await page.fill('input[name="numberOfShoes"]', '2')
                await page.fill('textarea[name="donationDescription"]', 'Test donation from authenticated browser test')
                await page.fill('select[name="condition"]', 'good')
                
                # Address fields
                await page.fill('input[name="street"]', '123 Test Street')
                await page.fill('input[name="city"]', 'San Francisco')
                await page.fill('input[name="state"]', 'CA')
                await page.fill('input[name="zipCode"]', '94102')
                
                form_filled = True
            except:
                # Try alternative selectors
                try:
                    number_input = await page.query_selector('input[type="number"]')
                    if number_input:
                        await number_input.fill('2')
                    
                    textarea = await page.query_selector('textarea')
                    if textarea:
                        await textarea.fill('Test donation from authenticated browser test')
                    
                    form_filled = True
                except:
                    pass
            
            # Submit donation form
            donation_submitted = False
            if form_filled:
                try:
                    submit_button = await page.query_selector('button[type="submit"]:has-text("Submit"), button:has-text("Donate")')
                    if submit_button:
                        await submit_button.click()
                        await page.wait_for_timeout(5000)
                        donation_submitted = True
                except:
                    pass
            
            # Check for success indicators
            donation_success = False
            if donation_submitted:
                success_element = await page.query_selector('text=success')
                thank_element = await page.query_selector('text=thank')
                submitted_element = await page.query_selector('text=submitted')
                success_class_element = await page.query_selector('.success')
                
                donation_success = bool(success_element or thank_element or submitted_element or success_class_element)
            
            success = form_filled and donation_submitted
            details = {
                'form_filled': form_filled,
                'donation_submitted': donation_submitted,
                'donation_success': donation_success,
                'final_url': page.url
            }
            
            self.add_test_result('donation_form_submission', success, details)
            return success
            
        except Exception as e:
            self.add_test_result('donation_form_submission', False, {'error': str(e)})
            self.results['issues'].append(f"Donation form submission error: {str(e)}")
            return False

    async def run_all_authenticated_tests(self):
        """Run all authenticated browser tests"""
        self.log("🚀 Starting Comprehensive Authenticated Browser Testing")
        self.log("=" * 80)
        
        start_time = time.time()
        
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            
            try:
                # Create separate contexts for user and admin testing
                user_context = await browser.new_context()
                user_page = await user_context.new_page()
                
                admin_context = await browser.new_context()
                admin_page = await admin_context.new_page()
                
                # User workflow tests
                user_login_success, user_data = await self.create_test_user_and_login(user_page)
                
                if user_login_success and user_data:
                    await self.test_authenticated_shoe_browsing(user_page, user_data)
                    await self.test_shoe_request_workflow(user_page, user_data)
                    await self.test_user_account_access(user_page, user_data)
                    await self.test_donation_form_submission(user_page, user_data)
                
                # Admin workflow tests
                admin_login_success = await self.test_admin_login_and_dashboard(admin_page)
                if admin_login_success:
                    await self.test_admin_inventory_management(admin_page)
                
                await user_context.close()
                await admin_context.close()
                
            finally:
                await browser.close()
        
        # Calculate results
        execution_time = time.time() - start_time
        self.calculate_results()
        self.generate_report(execution_time)
        
        return self.results

    def calculate_results(self):
        """Calculate overall success rate"""
        total_tests = len(self.results['authenticated_tests'])
        successful_tests = sum(1 for test in self.results['authenticated_tests'] if test['success'])
        
        self.results['total_tests'] = total_tests
        self.results['successful_tests'] = successful_tests
        self.results['overall_success_rate'] = (successful_tests / total_tests * 100) if total_tests > 0 else 0

    def generate_report(self, execution_time):
        """Generate comprehensive authenticated test report"""
        print("\n" + "=" * 80)
        print("🔐 COMPREHENSIVE AUTHENTICATED BROWSER TESTING REPORT")
        print("=" * 80)
        
        print(f"\n🎯 OVERALL RESULTS:")
        print(f"  Success Rate: {self.results['overall_success_rate']:.1f}%")
        print(f"  Total Tests: {self.results['total_tests']}")
        print(f"  Successful: {self.results['successful_tests']}")
        print(f"  Failed: {self.results['total_tests'] - self.results['successful_tests']}")
        print(f"  Execution Time: {execution_time:.1f} seconds")
        print(f"  Environment: {self.base_url}")
        
        print(f"\n📋 DETAILED AUTHENTICATED TEST RESULTS:")
        for test in self.results['authenticated_tests']:
            status = '✅' if test['success'] else '❌'
            print(f"  {status} {test['name']}")
            if test['success'] and 'user_email' in test['details']:
                print(f"      User: {test['details']['user_email']}")
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
            print(f"\n🎉 STATUS: EXCELLENT - Authenticated workflows validated")
        elif success_rate >= 75:
            print(f"\n✅ STATUS: GOOD - Minor authenticated workflow issues")
        elif success_rate >= 50:
            print(f"\n⚠️ STATUS: ACCEPTABLE - Authenticated workflow improvements needed")
        else:
            print(f"\n❌ STATUS: CRITICAL - Major authenticated functionality issues")
        
        # Save results
        timestamp = int(time.time())
        filename = f"authenticated_browser_test_{timestamp}.json"
        with open(filename, 'w') as f:
            json.dump(self.results, f, indent=2)
        
        print(f"\n📄 Detailed results saved to: {filename}")
        print("=" * 80)

async def main():
    if len(sys.argv) != 2:
        print("Usage: python authenticated_browser_test.py <base_url>")
        print("Example: python authenticated_browser_test.py https://newsteps.fit")
        sys.exit(1)
    
    base_url = sys.argv[1]
    tester = AuthenticatedBrowserTester(base_url)
    
    try:
        results = await tester.run_all_authenticated_tests()
        
        # Exit with appropriate code
        success_rate = results.get('overall_success_rate', 0)
        if success_rate >= 75:
            sys.exit(0)
        else:
            sys.exit(1)
            
    except KeyboardInterrupt:
        print("\n\n⚠️ Authenticated browser testing interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n\n❌ Authenticated browser testing failed with error: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main())
