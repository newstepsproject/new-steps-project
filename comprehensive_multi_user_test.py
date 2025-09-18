#!/usr/bin/env python3
"""
COMPREHENSIVE MULTI-USER INTERACTIVE TESTING FRAMEWORK
4-Layer Testing Methodology for New Steps Project

This framework tests actual user workflows and interactions, not just API endpoints.
It simulates real user behavior across different user types and scenarios.
"""

import requests
import time
import json
import sys
from datetime import datetime
from playwright.sync_api import sync_playwright
import random
import string

class ComprehensiveMultiUserTester:
    def __init__(self, base_url):
        self.base_url = base_url.rstrip('/')
        self.results = {
            'timestamp': datetime.now().isoformat(),
            'base_url': base_url,
            'layers': {},
            'multi_user_scenarios': {},
            'overall_success_rate': 0,
            'critical_issues': [],
            'recommendations': []
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

    # ==================== LAYER 1: BUILD-TIME ANALYSIS ====================
    def layer1_build_analysis(self):
        """Layer 1: Analyze production build and static/dynamic pages"""
        self.log("🔍 LAYER 1: Build-Time Analysis")
        layer1_results = {
            'static_pages': [],
            'dynamic_pages': [],
            'api_routes': [],
            'build_health': True,
            'issues': []
        }
        
        try:
            # Test static pages that should load quickly
            static_pages = [
                '/', '/about', '/contact', '/donate', '/get-involved', 
                '/login', '/register', '/shoes', '/cart'
            ]
            
            for page in static_pages:
                try:
                    response = requests.get(f"{self.base_url}{page}", timeout=10)
                    if response.status_code == 200:
                        layer1_results['static_pages'].append({
                            'page': page,
                            'status': 'success',
                            'load_time': response.elapsed.total_seconds()
                        })
                    else:
                        layer1_results['issues'].append(f"Static page {page} returned {response.status_code}")
                except Exception as e:
                    layer1_results['issues'].append(f"Static page {page} failed: {str(e)}")
            
            # Test API routes availability
            api_routes = [
                '/api/health', '/api/shoes', '/api/settings', 
                '/api/contact', '/api/donations', '/api/volunteer'
            ]
            
            for route in api_routes:
                try:
                    response = requests.get(f"{self.base_url}{route}", timeout=5)
                    layer1_results['api_routes'].append({
                        'route': route,
                        'status': response.status_code,
                        'available': response.status_code in [200, 401, 405]  # 401/405 are expected for protected routes
                    })
                except Exception as e:
                    layer1_results['issues'].append(f"API route {route} failed: {str(e)}")
            
            self.results['layers']['layer1'] = layer1_results
            success_rate = (len(layer1_results['static_pages']) / len(static_pages)) * 100
            self.log(f"✅ Layer 1 Complete: {success_rate:.1f}% static pages loaded successfully")
            
        except Exception as e:
            layer1_results['build_health'] = False
            layer1_results['issues'].append(f"Layer 1 failed: {str(e)}")
            self.log(f"❌ Layer 1 Failed: {str(e)}", "ERROR")

    # ==================== LAYER 2: DATA FLOW INTEGRATION ====================
    def layer2_data_flow_integration(self):
        """Layer 2: Test data consistency and integration"""
        self.log("🔍 LAYER 2: Data Flow Integration Testing")
        layer2_results = {
            'database_connectivity': False,
            'data_consistency': [],
            'integration_tests': [],
            'issues': []
        }
        
        try:
            # Test database connectivity
            health_response = requests.get(f"{self.base_url}/api/health", timeout=10)
            if health_response.status_code == 200:
                health_data = health_response.json()
                layer2_results['database_connectivity'] = health_data.get('databaseConnection') == 'connected'
            
            # Test data flow: shoes API -> frontend display
            shoes_response = requests.get(f"{self.base_url}/api/shoes", timeout=10)
            if shoes_response.status_code == 200:
                shoes_data = shoes_response.json()
                layer2_results['integration_tests'].append({
                    'test': 'shoes_api_data_structure',
                    'success': 'shoes' in shoes_data and isinstance(shoes_data['shoes'], list),
                    'shoe_count': len(shoes_data.get('shoes', []))
                })
            
            # Test settings API integration
            settings_response = requests.get(f"{self.base_url}/api/settings", timeout=10)
            if settings_response.status_code == 200:
                settings_data = settings_response.json()
                layer2_results['integration_tests'].append({
                    'test': 'settings_api_integration',
                    'success': 'maxShoesPerRequest' in settings_data,
                    'settings_loaded': len(settings_data.keys())
                })
            
            self.results['layers']['layer2'] = layer2_results
            success_count = sum(1 for test in layer2_results['integration_tests'] if test['success'])
            total_tests = len(layer2_results['integration_tests'])
            success_rate = (success_count / total_tests * 100) if total_tests > 0 else 0
            self.log(f"✅ Layer 2 Complete: {success_rate:.1f}% integration tests passed")
            
        except Exception as e:
            layer2_results['issues'].append(f"Layer 2 failed: {str(e)}")
            self.log(f"❌ Layer 2 Failed: {str(e)}", "ERROR")

    # ==================== LAYER 3: END-TO-END WORKFLOWS ====================
    def layer3_end_to_end_workflows(self):
        """Layer 3: Test complete user workflows with browser automation"""
        self.log("🔍 LAYER 3: End-to-End Multi-User Workflows")
        layer3_results = {
            'visitor_workflows': [],
            'user_workflows': [],
            'admin_workflows': [],
            'issues': []
        }
        
        try:
            with sync_playwright() as p:
                browser = p.chromium.launch(headless=True)
                
                # Test Visitor Workflows
                self.log("Testing Visitor Workflows...")
                visitor_results = self._test_visitor_workflows(browser)
                layer3_results['visitor_workflows'] = visitor_results
                
                # Test Authenticated User Workflows  
                self.log("Testing User Workflows...")
                user_results = self._test_user_workflows(browser)
                layer3_results['user_workflows'] = user_results
                
                # Test Admin Workflows
                self.log("Testing Admin Workflows...")
                admin_results = self._test_admin_workflows(browser)
                layer3_results['admin_workflows'] = admin_results
                
                browser.close()
            
            self.results['layers']['layer3'] = layer3_results
            
            # Calculate overall success rate
            all_workflows = (layer3_results['visitor_workflows'] + 
                           layer3_results['user_workflows'] + 
                           layer3_results['admin_workflows'])
            success_count = sum(1 for w in all_workflows if w.get('success', False))
            total_workflows = len(all_workflows)
            success_rate = (success_count / total_workflows * 100) if total_workflows > 0 else 0
            
            self.log(f"✅ Layer 3 Complete: {success_rate:.1f}% workflows successful ({success_count}/{total_workflows})")
            
        except Exception as e:
            layer3_results['issues'].append(f"Layer 3 failed: {str(e)}")
            self.log(f"❌ Layer 3 Failed: {str(e)}", "ERROR")

    def _test_visitor_workflows(self, browser):
        """Test workflows for anonymous visitors"""
        workflows = []
        
        try:
            page = browser.new_page()
            
            # Workflow 1: Browse shoes as visitor
            workflow = {'name': 'visitor_browse_shoes', 'success': False, 'details': {}}
            try:
                page.goto(f"{self.base_url}/shoes", wait_until='networkidle', timeout=30000)
                
                # Wait for shoes to load
                page.wait_for_selector('.grid', timeout=10000)
                
                # Check if shoes are displayed
                shoe_cards = page.query_selector_all('[data-testid="shoe-card"], .shoe-card, .grid > div')
                workflow['details']['shoes_found'] = len(shoe_cards)
                workflow['success'] = len(shoe_cards) > 0
                
                if workflow['success']:
                    # Try to click on a shoe
                    if shoe_cards:
                        shoe_cards[0].click()
                        page.wait_for_load_state('networkidle', timeout=10000)
                        workflow['details']['shoe_detail_accessible'] = '/shoes/' in page.url
                        
            except Exception as e:
                workflow['details']['error'] = str(e)
            
            workflows.append(workflow)
            
            # Workflow 2: Contact form submission
            workflow = {'name': 'visitor_contact_form', 'success': False, 'details': {}}
            try:
                page.goto(f"{self.base_url}/contact", wait_until='networkidle', timeout=30000)
                
                # Fill contact form
                page.fill('input[name="firstName"], input[type="text"]:first-of-type', 'Test')
                page.fill('input[name="lastName"], input[type="text"]:nth-of-type(2)', 'Visitor')
                page.fill('input[name="email"], input[type="email"]', 'testvisitor@example.com')
                page.fill('textarea[name="message"], textarea', 'Test message from visitor workflow')
                
                # Submit form
                page.click('button[type="submit"], button:has-text("Send")')
                
                # Wait for success message or redirect
                page.wait_for_timeout(3000)
                
                # Check for success indicators
                success_indicators = [
                    page.query_selector('text=success'),
                    page.query_selector('text=sent'),
                    page.query_selector('text=thank'),
                    page.query_selector('.success'),
                    page.query_selector('[data-testid="success"]')
                ]
                
                workflow['success'] = any(indicator for indicator in success_indicators)
                workflow['details']['form_submitted'] = True
                
            except Exception as e:
                workflow['details']['error'] = str(e)
            
            workflows.append(workflow)
            
            # Workflow 3: Donation form (anonymous)
            workflow = {'name': 'visitor_shoe_donation', 'success': False, 'details': {}}
            try:
                page.goto(f"{self.base_url}/donate/shoes", wait_until='networkidle', timeout=30000)
                
                # Fill donation form
                page.fill('input[name="donorInfo.firstName"], input[name="firstName"]', 'Test')
                page.fill('input[name="donorInfo.lastName"], input[name="lastName"]', 'Donor')
                page.fill('input[name="donorInfo.email"], input[name="email"]', 'testdonor@example.com')
                page.fill('input[name="donorInfo.phone"], input[name="phone"]', '1234567890')
                page.fill('input[name="numberOfShoes"]', '2')
                page.select_option('select[name="condition"]', 'good')
                page.fill('textarea[name="notes"]', 'Test donation from visitor workflow')
                page.fill('textarea[name="donationDescription"]', 'Test shoes for donation')
                
                # Submit donation
                page.click('button[type="submit"]:has-text("Submit")')
                
                # Wait for success
                page.wait_for_timeout(5000)
                
                # Check for success
                success_indicators = [
                    page.query_selector('text=success'),
                    page.query_selector('text=submitted'),
                    page.query_selector('text=thank'),
                    page.query_selector('.success')
                ]
                
                workflow['success'] = any(indicator for indicator in success_indicators)
                
            except Exception as e:
                workflow['details']['error'] = str(e)
            
            workflows.append(workflow)
            
            page.close()
            
        except Exception as e:
            workflows.append({'name': 'visitor_workflows_setup', 'success': False, 'details': {'error': str(e)}})
        
        return workflows

    def _test_user_workflows(self, browser):
        """Test workflows for authenticated users"""
        workflows = []
        
        try:
            page = browser.new_page()
            
            # First register a new user
            user_data = self.generate_test_user_data("_user")
            
            # Workflow 1: User registration
            workflow = {'name': 'user_registration', 'success': False, 'details': {}}
            try:
                page.goto(f"{self.base_url}/register", wait_until='networkidle', timeout=30000)
                
                # Fill registration form
                page.fill('input[name="firstName"]', user_data['firstName'])
                page.fill('input[name="lastName"]', user_data['lastName'])
                page.fill('input[name="email"]', user_data['email'])
                page.fill('input[name="password"]', user_data['password'])
                page.fill('input[name="phone"]', user_data['phone'])
                
                # Submit registration
                page.click('button[type="submit"]:has-text("Register")')
                
                # Wait for response
                page.wait_for_timeout(5000)
                
                # Check for success (either success message or redirect to login)
                success_indicators = [
                    'success' in page.url.lower(),
                    'login' in page.url.lower(),
                    page.query_selector('text=success'),
                    page.query_selector('text=registered'),
                    page.query_selector('text=verify')
                ]
                
                workflow['success'] = any(success_indicators)
                workflow['details']['email'] = user_data['email']
                
            except Exception as e:
                workflow['details']['error'] = str(e)
            
            workflows.append(workflow)
            
            # Workflow 2: User login
            workflow = {'name': 'user_login', 'success': False, 'details': {}}
            try:
                page.goto(f"{self.base_url}/login", wait_until='networkidle', timeout=30000)
                
                # Fill login form
                page.fill('input[name="email"], input[type="email"]', user_data['email'])
                page.fill('input[name="password"], input[type="password"]', user_data['password'])
                
                # Submit login
                page.click('button[type="submit"]:has-text("Sign In")')
                
                # Wait for redirect
                page.wait_for_timeout(5000)
                
                # Check if redirected to account or dashboard
                success_indicators = [
                    'account' in page.url.lower(),
                    'dashboard' in page.url.lower(),
                    page.url == f"{self.base_url}/",
                    page.query_selector('text=logout'),
                    page.query_selector('text=account'),
                    page.query_selector('[data-testid="user-menu"]')
                ]
                
                workflow['success'] = any(success_indicators)
                
            except Exception as e:
                workflow['details']['error'] = str(e)
            
            workflows.append(workflow)
            
            # Workflow 3: Shoe request (if logged in)
            if workflows[-1]['success']:  # Only if login was successful
                workflow = {'name': 'user_shoe_request', 'success': False, 'details': {}}
                try:
                    # Go to shoes page
                    page.goto(f"{self.base_url}/shoes", wait_until='networkidle', timeout=30000)
                    
                    # Wait for shoes to load
                    page.wait_for_selector('.grid', timeout=10000)
                    
                    # Find and click "Add to Cart" or "Request" button
                    request_buttons = page.query_selector_all('button:has-text("Add to Cart"), button:has-text("Request"), button:has-text("Add")')
                    
                    if request_buttons:
                        request_buttons[0].click()
                        page.wait_for_timeout(2000)
                        
                        # Go to cart/checkout
                        cart_links = page.query_selector_all('a[href="/cart"], a:has-text("Cart"), [data-testid="cart"]')
                        if cart_links:
                            cart_links[0].click()
                            page.wait_for_timeout(3000)
                            
                            # Try to proceed to checkout
                            checkout_buttons = page.query_selector_all('button:has-text("Checkout"), button:has-text("Request"), a[href="/checkout"]')
                            if checkout_buttons:
                                checkout_buttons[0].click()
                                page.wait_for_timeout(3000)
                                
                                workflow['success'] = 'checkout' in page.url.lower()
                                workflow['details']['reached_checkout'] = workflow['success']
                
                except Exception as e:
                    workflow['details']['error'] = str(e)
                
                workflows.append(workflow)
            
            page.close()
            
        except Exception as e:
            workflows.append({'name': 'user_workflows_setup', 'success': False, 'details': {'error': str(e)}})
        
        return workflows

    def _test_admin_workflows(self, browser):
        """Test workflows for admin users"""
        workflows = []
        
        try:
            page = browser.new_page()
            
            # Workflow 1: Admin login
            workflow = {'name': 'admin_login', 'success': False, 'details': {}}
            try:
                page.goto(f"{self.base_url}/login", wait_until='networkidle', timeout=30000)
                
                # Fill admin login
                page.fill('input[name="email"], input[type="email"]', 'admin@newsteps.fit')
                page.fill('input[name="password"], input[type="password"]', 'Admin123!')
                
                # Submit login
                page.click('button[type="submit"]:has-text("Sign In")')
                
                # Wait for redirect
                page.wait_for_timeout(5000)
                
                # Check if can access admin area
                try:
                    page.goto(f"{self.base_url}/admin", wait_until='networkidle', timeout=15000)
                    
                    success_indicators = [
                        'admin' in page.url.lower(),
                        page.query_selector('text=Dashboard'),
                        page.query_selector('text=Admin'),
                        page.query_selector('[data-testid="admin-nav"]'),
                        page.query_selector('a[href*="admin"]')
                    ]
                    
                    workflow['success'] = any(success_indicators)
                    
                except Exception as e:
                    workflow['details']['admin_access_error'] = str(e)
                
            except Exception as e:
                workflow['details']['error'] = str(e)
            
            workflows.append(workflow)
            
            # Workflow 2: Admin shoes management (if login successful)
            if workflows[-1]['success']:
                workflow = {'name': 'admin_shoes_management', 'success': False, 'details': {}}
                try:
                    page.goto(f"{self.base_url}/admin/shoes", wait_until='networkidle', timeout=30000)
                    
                    # Check if shoes admin page loads
                    success_indicators = [
                        page.query_selector('table'),
                        page.query_selector('.shoe'),
                        page.query_selector('text=Inventory'),
                        page.query_selector('text=Shoes'),
                        page.query_selector('button:has-text("Add")')
                    ]
                    
                    workflow['success'] = any(success_indicators)
                    workflow['details']['admin_shoes_accessible'] = workflow['success']
                    
                except Exception as e:
                    workflow['details']['error'] = str(e)
                
                workflows.append(workflow)
                
                # Workflow 3: Admin donations management
                workflow = {'name': 'admin_donations_management', 'success': False, 'details': {}}
                try:
                    page.goto(f"{self.base_url}/admin/shoe-donations", wait_until='networkidle', timeout=30000)
                    
                    # Check if donations admin page loads
                    success_indicators = [
                        page.query_selector('table'),
                        page.query_selector('.donation'),
                        page.query_selector('text=Donations'),
                        page.query_selector('text=Status'),
                        page.query_selector('button')
                    ]
                    
                    workflow['success'] = any(success_indicators)
                    workflow['details']['admin_donations_accessible'] = workflow['success']
                    
                except Exception as e:
                    workflow['details']['error'] = str(e)
                
                workflows.append(workflow)
            
            page.close()
            
        except Exception as e:
            workflows.append({'name': 'admin_workflows_setup', 'success': False, 'details': {'error': str(e)}})
        
        return workflows

    # ==================== LAYER 4: PRODUCTION HEALTH ====================
    def layer4_production_health(self):
        """Layer 4: Comprehensive production health validation"""
        self.log("🔍 LAYER 4: Production Health Validation")
        layer4_results = {
            'performance_metrics': {},
            'security_validation': {},
            'reliability_tests': {},
            'issues': []
        }
        
        try:
            # Performance metrics
            start_time = time.time()
            response = requests.get(f"{self.base_url}/", timeout=30)
            load_time = time.time() - start_time
            
            layer4_results['performance_metrics'] = {
                'homepage_load_time': load_time,
                'homepage_status': response.status_code,
                'response_size': len(response.content),
                'performance_acceptable': load_time < 5.0
            }
            
            # Security validation
            security_tests = []
            
            # Test HTTPS redirect (if applicable)
            if self.base_url.startswith('https://'):
                try:
                    http_url = self.base_url.replace('https://', 'http://')
                    http_response = requests.get(http_url, allow_redirects=False, timeout=10)
                    security_tests.append({
                        'test': 'https_redirect',
                        'success': http_response.status_code in [301, 302, 308]
                    })
                except:
                    security_tests.append({'test': 'https_redirect', 'success': False})
            
            # Test admin protection
            try:
                admin_response = requests.get(f"{self.base_url}/admin", allow_redirects=False, timeout=10)
                security_tests.append({
                    'test': 'admin_protection',
                    'success': admin_response.status_code in [302, 401, 403]
                })
            except:
                security_tests.append({'test': 'admin_protection', 'success': False})
            
            layer4_results['security_validation'] = security_tests
            
            # Reliability tests
            reliability_tests = []
            
            # Test multiple concurrent requests
            import concurrent.futures
            
            def test_concurrent_request():
                try:
                    response = requests.get(f"{self.base_url}/api/health", timeout=10)
                    return response.status_code == 200
                except:
                    return False
            
            with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
                futures = [executor.submit(test_concurrent_request) for _ in range(10)]
                concurrent_results = [future.result() for future in futures]
            
            reliability_tests.append({
                'test': 'concurrent_requests',
                'success_rate': sum(concurrent_results) / len(concurrent_results),
                'total_requests': len(concurrent_results)
            })
            
            layer4_results['reliability_tests'] = reliability_tests
            
            self.results['layers']['layer4'] = layer4_results
            self.log("✅ Layer 4 Complete: Production health validated")
            
        except Exception as e:
            layer4_results['issues'].append(f"Layer 4 failed: {str(e)}")
            self.log(f"❌ Layer 4 Failed: {str(e)}", "ERROR")

    # ==================== MULTI-USER SCENARIOS ====================
    def test_multi_user_scenarios(self):
        """Test complex multi-user interaction scenarios"""
        self.log("🔍 MULTI-USER INTERACTION SCENARIOS")
        
        scenarios = []
        
        # Scenario 1: Visitor -> User -> Admin workflow
        scenario = {
            'name': 'complete_user_journey',
            'description': 'Visitor browses, registers, makes request, admin processes',
            'success': False,
            'steps': []
        }
        
        try:
            with sync_playwright() as p:
                browser = p.chromium.launch(headless=True)
                
                # Step 1: Visitor browses shoes
                visitor_page = browser.new_page()
                visitor_page.goto(f"{self.base_url}/shoes", wait_until='networkidle', timeout=30000)
                
                shoes_visible = visitor_page.query_selector_all('.grid > div, [data-testid="shoe-card"]')
                scenario['steps'].append({
                    'step': 'visitor_browse',
                    'success': len(shoes_visible) > 0,
                    'details': f'Found {len(shoes_visible)} shoes'
                })
                
                # Step 2: Visitor registers
                user_data = self.generate_test_user_data("_journey")
                visitor_page.goto(f"{self.base_url}/register", wait_until='networkidle', timeout=30000)
                
                visitor_page.fill('input[name="firstName"]', user_data['firstName'])
                visitor_page.fill('input[name="lastName"]', user_data['lastName'])
                visitor_page.fill('input[name="email"]', user_data['email'])
                visitor_page.fill('input[name="password"]', user_data['password'])
                visitor_page.fill('input[name="phone"]', user_data['phone'])
                
                visitor_page.click('button[type="submit"]:has-text("Register")')
                visitor_page.wait_for_timeout(3000)
                
                registration_success = any([
                    'login' in visitor_page.url,
                    visitor_page.query_selector('text=success'),
                    visitor_page.query_selector('text=registered')
                ])
                
                scenario['steps'].append({
                    'step': 'user_registration',
                    'success': registration_success,
                    'details': f'User {user_data["email"]} registration'
                })
                
                # Step 3: User logs in and makes request
                if registration_success:
                    visitor_page.goto(f"{self.base_url}/login", wait_until='networkidle', timeout=30000)
                    visitor_page.fill('input[type="email"]', user_data['email'])
                    visitor_page.fill('input[type="password"]', user_data['password'])
                    visitor_page.click('button[type="submit"]')
                    visitor_page.wait_for_timeout(3000)
                    
                    login_success = any([
                        'account' in visitor_page.url,
                        visitor_page.url == f"{self.base_url}/",
                        visitor_page.query_selector('text=logout')
                    ])
                    
                    scenario['steps'].append({
                        'step': 'user_login',
                        'success': login_success,
                        'details': 'User authentication'
                    })
                
                visitor_page.close()
                
                # Step 4: Admin checks new user (simulate admin workflow)
                admin_page = browser.new_page()
                admin_page.goto(f"{self.base_url}/login", wait_until='networkidle', timeout=30000)
                admin_page.fill('input[type="email"]', 'admin@newsteps.fit')
                admin_page.fill('input[type="password"]', 'Admin123!')
                admin_page.click('button[type="submit"]')
                admin_page.wait_for_timeout(3000)
                
                # Try to access admin area
                admin_page.goto(f"{self.base_url}/admin", wait_until='networkidle', timeout=30000)
                
                admin_access = any([
                    'admin' in admin_page.url,
                    admin_page.query_selector('text=Dashboard'),
                    admin_page.query_selector('text=Admin')
                ])
                
                scenario['steps'].append({
                    'step': 'admin_access',
                    'success': admin_access,
                    'details': 'Admin dashboard access'
                })
                
                admin_page.close()
                browser.close()
                
                # Calculate overall scenario success
                successful_steps = sum(1 for step in scenario['steps'] if step['success'])
                scenario['success'] = successful_steps >= 3  # At least 3 out of 4 steps
                scenario['success_rate'] = successful_steps / len(scenario['steps'])
                
        except Exception as e:
            scenario['steps'].append({
                'step': 'scenario_execution',
                'success': False,
                'details': f'Error: {str(e)}'
            })
        
        scenarios.append(scenario)
        self.results['multi_user_scenarios'] = scenarios

    # ==================== MAIN EXECUTION ====================
    def run_comprehensive_test(self):
        """Execute all 4 layers plus multi-user scenarios"""
        self.log("🚀 Starting Comprehensive Multi-User Testing Framework")
        self.log("=" * 80)
        
        # Execute all layers
        self.layer1_build_analysis()
        self.layer2_data_flow_integration()
        self.layer3_end_to_end_workflows()
        self.layer4_production_health()
        
        # Execute multi-user scenarios
        self.test_multi_user_scenarios()
        
        # Calculate overall results
        self._calculate_overall_results()
        
        # Generate report
        self._generate_final_report()
        
        return self.results

    def _calculate_overall_results(self):
        """Calculate comprehensive success metrics"""
        total_tests = 0
        successful_tests = 0
        
        # Layer 1 results
        if 'layer1' in self.results['layers']:
            layer1 = self.results['layers']['layer1']
            total_tests += len(layer1.get('static_pages', []))
            successful_tests += len([p for p in layer1.get('static_pages', []) if p.get('status') == 'success'])
        
        # Layer 2 results
        if 'layer2' in self.results['layers']:
            layer2 = self.results['layers']['layer2']
            total_tests += len(layer2.get('integration_tests', []))
            successful_tests += len([t for t in layer2.get('integration_tests', []) if t.get('success')])
        
        # Layer 3 results
        if 'layer3' in self.results['layers']:
            layer3 = self.results['layers']['layer3']
            all_workflows = (layer3.get('visitor_workflows', []) + 
                           layer3.get('user_workflows', []) + 
                           layer3.get('admin_workflows', []))
            total_tests += len(all_workflows)
            successful_tests += len([w for w in all_workflows if w.get('success')])
        
        # Multi-user scenarios
        scenarios = self.results.get('multi_user_scenarios', [])
        total_tests += len(scenarios)
        successful_tests += len([s for s in scenarios if s.get('success')])
        
        self.results['overall_success_rate'] = (successful_tests / total_tests * 100) if total_tests > 0 else 0
        self.results['total_tests'] = total_tests
        self.results['successful_tests'] = successful_tests

    def _generate_final_report(self):
        """Generate comprehensive final report"""
        print("\n" + "=" * 80)
        print("📊 COMPREHENSIVE MULTI-USER TESTING FINAL REPORT")
        print("=" * 80)
        
        print(f"\n🎯 OVERALL RESULTS:")
        print(f"  Total Tests: {self.results['total_tests']}")
        print(f"  Successful: {self.results['successful_tests']}")
        print(f"  Success Rate: {self.results['overall_success_rate']:.1f}%")
        
        # Layer-by-layer breakdown
        for layer_name, layer_data in self.results['layers'].items():
            print(f"\n📋 {layer_name.upper()}:")
            
            if layer_name == 'layer1':
                static_pages = layer_data.get('static_pages', [])
                successful_pages = len([p for p in static_pages if p.get('status') == 'success'])
                print(f"  Static Pages: {successful_pages}/{len(static_pages)} loaded successfully")
                
                if layer_data.get('issues'):
                    print(f"  Issues: {len(layer_data['issues'])}")
            
            elif layer_name == 'layer2':
                integration_tests = layer_data.get('integration_tests', [])
                successful_tests = len([t for t in integration_tests if t.get('success')])
                print(f"  Integration Tests: {successful_tests}/{len(integration_tests)} passed")
                print(f"  Database Connected: {'✅' if layer_data.get('database_connectivity') else '❌'}")
            
            elif layer_name == 'layer3':
                visitor_workflows = layer_data.get('visitor_workflows', [])
                user_workflows = layer_data.get('user_workflows', [])
                admin_workflows = layer_data.get('admin_workflows', [])
                
                print(f"  Visitor Workflows: {len([w for w in visitor_workflows if w.get('success')])}/{len(visitor_workflows)}")
                print(f"  User Workflows: {len([w for w in user_workflows if w.get('success')])}/{len(user_workflows)}")
                print(f"  Admin Workflows: {len([w for w in admin_workflows if w.get('success')])}/{len(admin_workflows)}")
            
            elif layer_name == 'layer4':
                performance = layer_data.get('performance_metrics', {})
                if performance:
                    print(f"  Homepage Load Time: {performance.get('homepage_load_time', 0):.2f}s")
                    print(f"  Performance Acceptable: {'✅' if performance.get('performance_acceptable') else '❌'}")
        
        # Multi-user scenarios
        scenarios = self.results.get('multi_user_scenarios', [])
        if scenarios:
            print(f"\n🔄 MULTI-USER SCENARIOS:")
            for scenario in scenarios:
                status = '✅' if scenario.get('success') else '❌'
                success_rate = scenario.get('success_rate', 0) * 100
                print(f"  {status} {scenario['name']}: {success_rate:.1f}% success rate")
        
        # Critical issues
        all_issues = []
        for layer_data in self.results['layers'].values():
            all_issues.extend(layer_data.get('issues', []))
        
        if all_issues:
            print(f"\n❌ CRITICAL ISSUES FOUND ({len(all_issues)}):")
            for i, issue in enumerate(all_issues[:5], 1):  # Show first 5 issues
                print(f"  {i}. {issue}")
            if len(all_issues) > 5:
                print(f"  ... and {len(all_issues) - 5} more issues")
        
        # Save detailed results
        timestamp = int(time.time())
        filename = f"comprehensive_multi_user_test_results_{timestamp}.json"
        with open(filename, 'w') as f:
            json.dump(self.results, f, indent=2)
        
        print(f"\n📄 Detailed results saved to: {filename}")
        print("=" * 80)

def main():
    if len(sys.argv) != 2:
        print("Usage: python comprehensive_multi_user_test.py <base_url>")
        print("Example: python comprehensive_multi_user_test.py https://newsteps.fit")
        sys.exit(1)
    
    base_url = sys.argv[1]
    tester = ComprehensiveMultiUserTester(base_url)
    
    try:
        results = tester.run_comprehensive_test()
        
        # Exit with appropriate code
        success_rate = results.get('overall_success_rate', 0)
        if success_rate >= 90:
            sys.exit(0)  # Excellent
        elif success_rate >= 75:
            sys.exit(0)  # Good
        else:
            sys.exit(1)  # Needs improvement
            
    except KeyboardInterrupt:
        print("\n\n⚠️ Testing interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n\n❌ Testing failed with error: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main()
