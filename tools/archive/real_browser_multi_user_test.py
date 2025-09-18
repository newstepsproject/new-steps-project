#!/usr/bin/env python3
"""
REAL BROWSER-BASED MULTI-USER TESTING FRAMEWORK
Using Playwright for actual browser automation and user interaction testing

This framework tests REAL user workflows with actual browser interactions,
form submissions, navigation, and multi-user scenarios.
"""

import asyncio
import json
import sys
import time
from datetime import datetime
from playwright.async_api import async_playwright
import random
import string

class RealBrowserMultiUserTester:
    def __init__(self, base_url):
        self.base_url = base_url.rstrip('/')
        self.results = {
            'timestamp': datetime.now().isoformat(),
            'base_url': base_url,
            'browser_tests': {},
            'multi_user_scenarios': {},
            'overall_success_rate': 0,
            'critical_issues': [],
            'user_experience_issues': []
        }
        
    def log(self, message, level="INFO"):
        timestamp = datetime.now().strftime("%H:%M:%S")
        print(f"[{timestamp}] {level}: {message}")
        
    def generate_test_user_data(self, suffix=""):
        timestamp = str(int(time.time()))
        return {
            'firstName': f'Test{suffix}',
            'lastName': f'User{suffix}',
            'email': f'testuser{suffix}_{timestamp}@example.com',
            'password': 'TestPassword123!',
            'phone': '1234567890'
        }

    async def test_visitor_real_workflows(self, browser):
        """Test real visitor workflows with browser automation"""
        self.log("🌐 Testing Real Visitor Workflows with Browser")
        
        visitor_results = {
            'page_navigation': [],
            'form_interactions': [],
            'shoe_browsing': [],
            'issues': []
        }
        
        try:
            context = await browser.new_context()
            page = await context.new_page()
            
            # Test 1: Homepage Navigation and Content
            self.log("Testing homepage navigation...")
            test_result = {'name': 'homepage_navigation', 'success': False, 'details': {}}
            
            try:
                await page.goto(f"{self.base_url}/", wait_until='networkidle', timeout=30000)
                
                # Check if page loaded
                title = await page.title()
                test_result['details']['page_title'] = title
                
                # Check for key elements
                hero_section = await page.query_selector('h1, .hero, [data-testid="hero"]')
                nav_menu = await page.query_selector('nav, .nav, [data-testid="nav"]')
                
                test_result['details']['has_hero'] = hero_section is not None
                test_result['details']['has_navigation'] = nav_menu is not None
                test_result['success'] = hero_section is not None and nav_menu is not None
                
            except Exception as e:
                test_result['details']['error'] = str(e)
                visitor_results['issues'].append(f"Homepage navigation error: {str(e)}")
            
            visitor_results['page_navigation'].append(test_result)
            
            # Test 2: Shoe Catalog Browsing
            self.log("Testing shoe catalog browsing...")
            test_result = {'name': 'shoe_catalog_browsing', 'success': False, 'details': {}}
            
            try:
                await page.goto(f"{self.base_url}/shoes", wait_until='networkidle', timeout=30000)
                
                # Wait for shoes to load
                await page.wait_for_selector('.grid, [data-testid="shoes-grid"], .shoe-card', timeout=15000)
                
                # Count shoe cards
                shoe_cards = await page.query_selector_all('.grid > div, [data-testid="shoe-card"], .shoe-card')
                test_result['details']['shoes_found'] = len(shoe_cards)
                
                # Try to click on first shoe
                if shoe_cards:
                    await shoe_cards[0].click()
                    await page.wait_for_load_state('networkidle', timeout=10000)
                    
                    # Check if we're on shoe detail page
                    current_url = page.url
                    test_result['details']['shoe_detail_accessible'] = '/shoes/' in current_url
                    test_result['details']['detail_url'] = current_url
                    
                    # Check for shoe details
                    shoe_title = await page.query_selector('h1, .shoe-title, [data-testid="shoe-title"]')
                    add_to_cart_btn = await page.query_selector('button:has-text("Add to Cart"), button:has-text("Request"), [data-testid="add-to-cart"]')
                    
                    test_result['details']['has_shoe_title'] = shoe_title is not None
                    test_result['details']['has_add_to_cart'] = add_to_cart_btn is not None
                    
                    test_result['success'] = (len(shoe_cards) > 0 and 
                                            '/shoes/' in current_url and 
                                            shoe_title is not None)
                else:
                    test_result['details']['no_shoes_found'] = True
                
            except Exception as e:
                test_result['details']['error'] = str(e)
                visitor_results['issues'].append(f"Shoe browsing error: {str(e)}")
            
            visitor_results['shoe_browsing'].append(test_result)
            
            # Test 3: Contact Form Submission
            self.log("Testing contact form submission...")
            test_result = {'name': 'contact_form_submission', 'success': False, 'details': {}}
            
            try:
                await page.goto(f"{self.base_url}/contact", wait_until='networkidle', timeout=30000)
                
                # Fill contact form
                await page.fill('input[name="firstName"], input[type="text"]:first-of-type', 'Test')
                await page.fill('input[name="lastName"], input[type="text"]:nth-of-type(2)', 'Visitor')
                await page.fill('input[name="email"], input[type="email"]', f'testvisitor_{int(time.time())}@example.com')
                await page.fill('textarea[name="message"], textarea', 'Test message from real browser workflow')
                
                # Submit form
                await page.click('button[type="submit"], button:has-text("Send"), button:has-text("Submit")')
                
                # Wait for response
                await page.wait_for_timeout(5000)
                
                # Check for success indicators
                success_message = await page.query_selector('text=success, text=sent, text=thank, .success, [data-testid="success"]')
                error_message = await page.query_selector('text=error, .error, [data-testid="error"]')
                
                test_result['details']['has_success_message'] = success_message is not None
                test_result['details']['has_error_message'] = error_message is not None
                test_result['details']['current_url'] = page.url
                
                test_result['success'] = success_message is not None and error_message is None
                
            except Exception as e:
                test_result['details']['error'] = str(e)
                visitor_results['issues'].append(f"Contact form error: {str(e)}")
            
            visitor_results['form_interactions'].append(test_result)
            
            await context.close()
            
        except Exception as e:
            visitor_results['issues'].append(f"Visitor workflow setup error: {str(e)}")
        
        return visitor_results

    async def test_user_real_workflows(self, browser):
        """Test real authenticated user workflows"""
        self.log("👤 Testing Real User Workflows with Browser")
        
        user_results = {
            'registration': [],
            'authentication': [],
            'shoe_requests': [],
            'account_management': [],
            'issues': []
        }
        
        try:
            context = await browser.new_context()
            page = await context.new_page()
            
            # Generate test user data
            user_data = self.generate_test_user_data("_browser")
            
            # Test 1: User Registration
            self.log("Testing user registration...")
            test_result = {'name': 'user_registration', 'success': False, 'details': {}}
            
            try:
                await page.goto(f"{self.base_url}/register", wait_until='networkidle', timeout=30000)
                
                # Fill registration form
                await page.fill('input[name="firstName"]', user_data['firstName'])
                await page.fill('input[name="lastName"]', user_data['lastName'])
                await page.fill('input[name="email"]', user_data['email'])
                await page.fill('input[name="password"]', user_data['password'])
                await page.fill('input[name="phone"]', user_data['phone'])
                
                # Submit registration
                await page.click('button[type="submit"]:has-text("Register"), button[type="submit"]:has-text("Sign Up")')
                
                # Wait for response
                await page.wait_for_timeout(5000)
                
                # Check for success (redirect to login or success message)
                current_url = page.url
                success_message = await page.query_selector('text=success, text=registered, text=verify, .success')
                
                test_result['details']['final_url'] = current_url
                test_result['details']['has_success_message'] = success_message is not None
                test_result['details']['redirected_to_login'] = 'login' in current_url.lower()
                test_result['details']['user_email'] = user_data['email']
                
                test_result['success'] = (success_message is not None or 
                                        'login' in current_url.lower() or
                                        'account' in current_url.lower())
                
            except Exception as e:
                test_result['details']['error'] = str(e)
                user_results['issues'].append(f"Registration error: {str(e)}")
            
            user_results['registration'].append(test_result)
            
            # Test 2: User Login
            if test_result['success']:
                self.log("Testing user login...")
                test_result = {'name': 'user_login', 'success': False, 'details': {}}
                
                try:
                    await page.goto(f"{self.base_url}/login", wait_until='networkidle', timeout=30000)
                    
                    # Fill login form
                    await page.fill('input[name="email"], input[type="email"]', user_data['email'])
                    await page.fill('input[name="password"], input[type="password"]', user_data['password'])
                    
                    # Submit login
                    await page.click('button[type="submit"]:has-text("Sign In"), button[type="submit"]:has-text("Login")')
                    
                    # Wait for redirect
                    await page.wait_for_timeout(5000)
                    
                    # Check if logged in (look for logout button, account link, or redirect)
                    current_url = page.url
                    logout_btn = await page.query_selector('button:has-text("Logout"), a:has-text("Logout"), [data-testid="logout"]')
                    account_link = await page.query_selector('a:has-text("Account"), [data-testid="account"], [href="/account"]')
                    user_menu = await page.query_selector('[data-testid="user-menu"], .user-menu')
                    
                    test_result['details']['final_url'] = current_url
                    test_result['details']['has_logout_btn'] = logout_btn is not None
                    test_result['details']['has_account_link'] = account_link is not None
                    test_result['details']['has_user_menu'] = user_menu is not None
                    
                    test_result['success'] = (logout_btn is not None or 
                                            account_link is not None or 
                                            user_menu is not None or
                                            'account' in current_url.lower())
                    
                except Exception as e:
                    test_result['details']['error'] = str(e)
                    user_results['issues'].append(f"Login error: {str(e)}")
                
                user_results['authentication'].append(test_result)
                
                # Test 3: Shoe Request Process (if logged in)
                if test_result['success']:
                    self.log("Testing shoe request process...")
                    test_result = {'name': 'shoe_request_process', 'success': False, 'details': {}}
                    
                    try:
                        # Go to shoes page
                        await page.goto(f"{self.base_url}/shoes", wait_until='networkidle', timeout=30000)
                        
                        # Wait for shoes to load
                        await page.wait_for_selector('.grid, [data-testid="shoes-grid"]', timeout=15000)
                        
                        # Find and click "Add to Cart" or "Request" button
                        request_buttons = await page.query_selector_all('button:has-text("Add to Cart"), button:has-text("Request"), button:has-text("Add")')
                        
                        if request_buttons:
                            await request_buttons[0].click()
                            await page.wait_for_timeout(3000)
                            
                            # Check if item was added (look for cart indicator or success message)
                            cart_indicator = await page.query_selector('[data-testid="cart-count"], .cart-count, text=added')
                            success_message = await page.query_selector('text=added, text=cart, .success')
                            
                            test_result['details']['item_added'] = cart_indicator is not None or success_message is not None
                            
                            # Try to go to cart
                            cart_links = await page.query_selector_all('a[href="/cart"], a:has-text("Cart"), [data-testid="cart"]')
                            if cart_links:
                                await cart_links[0].click()
                                await page.wait_for_timeout(3000)
                                
                                current_url = page.url
                                test_result['details']['reached_cart'] = 'cart' in current_url.lower()
                                
                                # Try to proceed to checkout
                                checkout_buttons = await page.query_selector_all('button:has-text("Checkout"), button:has-text("Request"), a[href="/checkout"]')
                                if checkout_buttons:
                                    await checkout_buttons[0].click()
                                    await page.wait_for_timeout(3000)
                                    
                                    current_url = page.url
                                    test_result['details']['reached_checkout'] = 'checkout' in current_url.lower()
                                    test_result['success'] = 'checkout' in current_url.lower()
                        
                    except Exception as e:
                        test_result['details']['error'] = str(e)
                        user_results['issues'].append(f"Shoe request error: {str(e)}")
                    
                    user_results['shoe_requests'].append(test_result)
            
            await context.close()
            
        except Exception as e:
            user_results['issues'].append(f"User workflow setup error: {str(e)}")
        
        return user_results

    async def test_admin_real_workflows(self, browser):
        """Test real admin workflows"""
        self.log("👑 Testing Real Admin Workflows with Browser")
        
        admin_results = {
            'authentication': [],
            'dashboard_access': [],
            'inventory_management': [],
            'user_management': [],
            'issues': []
        }
        
        try:
            context = await browser.new_context()
            page = await context.new_page()
            
            # Test 1: Admin Login
            self.log("Testing admin login...")
            test_result = {'name': 'admin_login', 'success': False, 'details': {}}
            
            try:
                await page.goto(f"{self.base_url}/login", wait_until='networkidle', timeout=30000)
                
                # Fill admin login
                await page.fill('input[name="email"], input[type="email"]', 'admin@newsteps.fit')
                await page.fill('input[name="password"], input[type="password"]', 'Admin123!')
                
                # Submit login
                await page.click('button[type="submit"]:has-text("Sign In"), button[type="submit"]:has-text("Login")')
                
                # Wait for redirect
                await page.wait_for_timeout(5000)
                
                # Check if can access admin area
                current_url = page.url
                test_result['details']['login_redirect_url'] = current_url
                
                # Try to navigate to admin dashboard
                await page.goto(f"{self.base_url}/admin", wait_until='networkidle', timeout=15000)
                
                admin_url = page.url
                dashboard_elements = await page.query_selector_all('text=Dashboard, text=Admin, [data-testid="admin-nav"], .admin-nav')
                
                test_result['details']['admin_url'] = admin_url
                test_result['details']['has_admin_elements'] = len(dashboard_elements) > 0
                test_result['details']['admin_accessible'] = 'admin' in admin_url.lower()
                
                test_result['success'] = ('admin' in admin_url.lower() and len(dashboard_elements) > 0)
                
            except Exception as e:
                test_result['details']['error'] = str(e)
                admin_results['issues'].append(f"Admin login error: {str(e)}")
            
            admin_results['authentication'].append(test_result)
            
            # Test 2: Admin Dashboard Navigation (if login successful)
            if test_result['success']:
                self.log("Testing admin dashboard navigation...")
                test_result = {'name': 'admin_dashboard_navigation', 'success': False, 'details': {}}
                
                try:
                    # Test navigation to different admin sections
                    admin_sections = [
                        {'name': 'shoes', 'path': '/admin/shoes', 'expected_content': ['inventory', 'shoes', 'add']},
                        {'name': 'donations', 'path': '/admin/shoe-donations', 'expected_content': ['donations', 'status']},
                        {'name': 'requests', 'path': '/admin/requests', 'expected_content': ['requests', 'status']},
                    ]
                    
                    section_results = []
                    
                    for section in admin_sections:
                        section_result = {'name': section['name'], 'success': False, 'details': {}}
                        
                        try:
                            await page.goto(f"{self.base_url}{section['path']}", wait_until='networkidle', timeout=30000)
                            
                            current_url = page.url
                            page_content = await page.content()
                            
                            # Check for expected content
                            content_found = any(keyword.lower() in page_content.lower() 
                                              for keyword in section['expected_content'])
                            
                            # Check for admin elements
                            admin_elements = await page.query_selector_all('table, .admin, button, [data-testid="admin"]')
                            
                            section_result['details']['url'] = current_url
                            section_result['details']['has_expected_content'] = content_found
                            section_result['details']['has_admin_elements'] = len(admin_elements) > 0
                            section_result['success'] = content_found and len(admin_elements) > 0
                            
                        except Exception as e:
                            section_result['details']['error'] = str(e)
                        
                        section_results.append(section_result)
                    
                    test_result['details']['sections'] = section_results
                    test_result['success'] = any(section['success'] for section in section_results)
                    
                except Exception as e:
                    test_result['details']['error'] = str(e)
                    admin_results['issues'].append(f"Admin dashboard error: {str(e)}")
                
                admin_results['dashboard_access'].append(test_result)
            
            await context.close()
            
        except Exception as e:
            admin_results['issues'].append(f"Admin workflow setup error: {str(e)}")
        
        return admin_results

    async def test_multi_user_scenarios(self, browser):
        """Test complex multi-user scenarios with real browser interactions"""
        self.log("🔄 Testing Multi-User Interactive Scenarios")
        
        scenarios = []
        
        # Scenario 1: Complete User Journey (Visitor → User → Request)
        scenario = {
            'name': 'complete_user_journey',
            'description': 'Visitor browses, registers, logs in, makes shoe request',
            'success': False,
            'steps': []
        }
        
        try:
            context = await browser.new_context()
            page = await context.new_page()
            
            user_data = self.generate_test_user_data("_journey")
            
            # Step 1: Visitor browses shoes
            step_result = {'step': 'visitor_browse_shoes', 'success': False, 'details': {}}
            try:
                await page.goto(f"{self.base_url}/shoes", wait_until='networkidle', timeout=30000)
                await page.wait_for_selector('.grid, [data-testid="shoes-grid"]', timeout=15000)
                
                shoe_cards = await page.query_selector_all('.grid > div, [data-testid="shoe-card"], .shoe-card')
                step_result['details']['shoes_found'] = len(shoe_cards)
                step_result['success'] = len(shoe_cards) > 0
                
            except Exception as e:
                step_result['details']['error'] = str(e)
            
            scenario['steps'].append(step_result)
            
            # Step 2: Visitor registers
            step_result = {'step': 'visitor_registers', 'success': False, 'details': {}}
            try:
                await page.goto(f"{self.base_url}/register", wait_until='networkidle', timeout=30000)
                
                await page.fill('input[name="firstName"]', user_data['firstName'])
                await page.fill('input[name="lastName"]', user_data['lastName'])
                await page.fill('input[name="email"]', user_data['email'])
                await page.fill('input[name="password"]', user_data['password'])
                await page.fill('input[name="phone"]', user_data['phone'])
                
                await page.click('button[type="submit"]:has-text("Register")')
                await page.wait_for_timeout(5000)
                
                current_url = page.url
                success_indicators = await page.query_selector_all('text=success, text=registered, .success')
                
                step_result['details']['final_url'] = current_url
                step_result['details']['user_email'] = user_data['email']
                step_result['success'] = (len(success_indicators) > 0 or 'login' in current_url.lower())
                
            except Exception as e:
                step_result['details']['error'] = str(e)
            
            scenario['steps'].append(step_result)
            
            # Step 3: User logs in
            if step_result['success']:
                step_result = {'step': 'user_login', 'success': False, 'details': {}}
                try:
                    await page.goto(f"{self.base_url}/login", wait_until='networkidle', timeout=30000)
                    
                    await page.fill('input[type="email"]', user_data['email'])
                    await page.fill('input[type="password"]', user_data['password'])
                    await page.click('button[type="submit"]')
                    await page.wait_for_timeout(5000)
                    
                    # Check for login success indicators
                    logout_btn = await page.query_selector('button:has-text("Logout"), a:has-text("Logout")')
                    account_link = await page.query_selector('a:has-text("Account"), [href="/account"]')
                    
                    step_result['details']['has_logout'] = logout_btn is not None
                    step_result['details']['has_account'] = account_link is not None
                    step_result['success'] = logout_btn is not None or account_link is not None
                    
                except Exception as e:
                    step_result['details']['error'] = str(e)
                
                scenario['steps'].append(step_result)
            
            # Calculate scenario success
            successful_steps = sum(1 for step in scenario['steps'] if step['success'])
            scenario['success'] = successful_steps >= len(scenario['steps']) * 0.8
            scenario['success_rate'] = successful_steps / len(scenario['steps']) if scenario['steps'] else 0
            
            await context.close()
            
        except Exception as e:
            scenario['steps'].append({
                'step': 'scenario_error',
                'success': False,
                'details': {'error': str(e)}
            })
        
        scenarios.append(scenario)
        return scenarios

    async def run_comprehensive_browser_test(self):
        """Run comprehensive browser-based testing"""
        self.log("🚀 Starting Real Browser-Based Multi-User Testing")
        self.log("=" * 80)
        
        start_time = time.time()
        
        async with async_playwright() as p:
            # Launch browser
            browser = await p.chromium.launch(headless=True)
            
            try:
                # Run all browser tests
                self.log("🌐 Phase 1: Visitor Workflows")
                visitor_results = await self.test_visitor_real_workflows(browser)
                self.results['browser_tests']['visitor_workflows'] = visitor_results
                
                self.log("👤 Phase 2: User Workflows")
                user_results = await self.test_user_real_workflows(browser)
                self.results['browser_tests']['user_workflows'] = user_results
                
                self.log("👑 Phase 3: Admin Workflows")
                admin_results = await self.test_admin_real_workflows(browser)
                self.results['browser_tests']['admin_workflows'] = admin_results
                
                self.log("🔄 Phase 4: Multi-User Scenarios")
                scenario_results = await self.test_multi_user_scenarios(browser)
                self.results['multi_user_scenarios'] = scenario_results
                
            finally:
                await browser.close()
        
        # Calculate results
        execution_time = time.time() - start_time
        self._calculate_browser_results()
        self._generate_browser_report(execution_time)
        
        return self.results

    def _calculate_browser_results(self):
        """Calculate comprehensive browser test results"""
        total_tests = 0
        successful_tests = 0
        
        # Count visitor workflow tests
        visitor_tests = self.results['browser_tests'].get('visitor_workflows', {})
        for category in ['page_navigation', 'form_interactions', 'shoe_browsing']:
            tests = visitor_tests.get(category, [])
            if isinstance(tests, list):
                total_tests += len(tests)
                successful_tests += sum(1 for test in tests if test.get('success'))
        
        # Count user workflow tests
        user_tests = self.results['browser_tests'].get('user_workflows', {})
        for category in ['registration', 'authentication', 'shoe_requests', 'account_management']:
            tests = user_tests.get(category, [])
            if isinstance(tests, list):
                total_tests += len(tests)
                successful_tests += sum(1 for test in tests if test.get('success'))
        
        # Count admin workflow tests
        admin_tests = self.results['browser_tests'].get('admin_workflows', {})
        for category in ['authentication', 'dashboard_access', 'inventory_management', 'user_management']:
            tests = admin_tests.get(category, [])
            if isinstance(tests, list):
                total_tests += len(tests)
                successful_tests += sum(1 for test in tests if test.get('success'))
        
        # Count multi-user scenarios
        scenarios = self.results.get('multi_user_scenarios', [])
        total_tests += len(scenarios)
        successful_tests += sum(1 for scenario in scenarios if scenario.get('success'))
        
        self.results['overall_success_rate'] = (successful_tests / total_tests * 100) if total_tests > 0 else 0
        self.results['total_tests'] = total_tests
        self.results['successful_tests'] = successful_tests

    def _generate_browser_report(self, execution_time):
        """Generate comprehensive browser test report"""
        print("\n" + "=" * 80)
        print("🌐 REAL BROWSER-BASED MULTI-USER TESTING REPORT")
        print("=" * 80)
        
        print(f"\n🎯 OVERALL RESULTS:")
        print(f"  Success Rate: {self.results['overall_success_rate']:.1f}%")
        print(f"  Total Tests: {self.results['total_tests']}")
        print(f"  Successful: {self.results['successful_tests']}")
        print(f"  Execution Time: {execution_time:.1f} seconds")
        print(f"  Environment: {self.base_url}")
        
        # Visitor workflows
        visitor_tests = self.results['browser_tests'].get('visitor_workflows', {})
        if visitor_tests:
            print(f"\n🌐 VISITOR WORKFLOWS:")
            for category, tests in visitor_tests.items():
                if isinstance(tests, list) and tests:
                    successful = sum(1 for test in tests if test.get('success'))
                    status = '✅' if successful == len(tests) else '⚠️' if successful > 0 else '❌'
                    print(f"  {status} {category.replace('_', ' ').title()}: {successful}/{len(tests)}")
        
        # User workflows
        user_tests = self.results['browser_tests'].get('user_workflows', {})
        if user_tests:
            print(f"\n👤 USER WORKFLOWS:")
            for category, tests in user_tests.items():
                if isinstance(tests, list) and tests:
                    successful = sum(1 for test in tests if test.get('success'))
                    status = '✅' if successful == len(tests) else '⚠️' if successful > 0 else '❌'
                    print(f"  {status} {category.replace('_', ' ').title()}: {successful}/{len(tests)}")
        
        # Admin workflows
        admin_tests = self.results['browser_tests'].get('admin_workflows', {})
        if admin_tests:
            print(f"\n👑 ADMIN WORKFLOWS:")
            for category, tests in admin_tests.items():
                if isinstance(tests, list) and tests:
                    successful = sum(1 for test in tests if test.get('success'))
                    status = '✅' if successful == len(tests) else '⚠️' if successful > 0 else '❌'
                    print(f"  {status} {category.replace('_', ' ').title()}: {successful}/{len(tests)}")
        
        # Multi-user scenarios
        scenarios = self.results.get('multi_user_scenarios', [])
        if scenarios:
            print(f"\n🔄 MULTI-USER SCENARIOS:")
            for scenario in scenarios:
                status = '✅' if scenario.get('success') else '❌'
                success_rate = scenario.get('success_rate', 0) * 100
                print(f"  {status} {scenario['name']}: {success_rate:.1f}% ({len([s for s in scenario.get('steps', []) if s.get('success')])}/{len(scenario.get('steps', []))} steps)")
        
        # Issues summary
        all_issues = []
        for workflow_type in self.results['browser_tests'].values():
            if isinstance(workflow_type, dict):
                all_issues.extend(workflow_type.get('issues', []))
        
        if all_issues:
            print(f"\n❌ ISSUES FOUND ({len(all_issues)}):")
            for i, issue in enumerate(all_issues[:5], 1):
                print(f"  {i}. {issue}")
            if len(all_issues) > 5:
                print(f"  ... and {len(all_issues) - 5} more issues")
        
        # Final status
        success_rate = self.results['overall_success_rate']
        if success_rate >= 95:
            print(f"\n🎉 BROWSER TEST STATUS: EXCELLENT - Real user workflows validated")
        elif success_rate >= 85:
            print(f"\n✅ BROWSER TEST STATUS: VERY GOOD - Minor user experience issues")
        elif success_rate >= 75:
            print(f"\n⚠️ BROWSER TEST STATUS: GOOD - Some user workflow improvements needed")
        else:
            print(f"\n❌ BROWSER TEST STATUS: NEEDS IMPROVEMENT - Significant user experience issues")
        
        # Save results
        timestamp = int(time.time())
        filename = f"real_browser_multi_user_test_{timestamp}.json"
        with open(filename, 'w') as f:
            json.dump(self.results, f, indent=2)
        
        print(f"\n📄 Detailed results saved to: {filename}")
        print("=" * 80)

async def main():
    if len(sys.argv) != 2:
        print("Usage: python real_browser_multi_user_test.py <base_url>")
        print("Example: python real_browser_multi_user_test.py https://newsteps.fit")
        sys.exit(1)
    
    base_url = sys.argv[1]
    tester = RealBrowserMultiUserTester(base_url)
    
    try:
        results = await tester.run_comprehensive_browser_test()
        
        # Exit with appropriate code
        success_rate = results.get('overall_success_rate', 0)
        if success_rate >= 90:
            sys.exit(0)  # Excellent
        elif success_rate >= 75:
            sys.exit(0)  # Good
        else:
            sys.exit(1)  # Needs improvement
            
    except KeyboardInterrupt:
        print("\n\n⚠️ Browser testing interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n\n❌ Browser testing failed with error: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main())
