#!/usr/bin/env python3
"""
COMPREHENSIVE MULTI-USER PRODUCTION TEST
4-Layer Testing Methodology + Multi-User Interactive Scenarios

This framework tests actual user workflows and interactions on production,
following the established 4-layer testing methodology.
"""

import requests
import time
import json
import sys
import os
from datetime import datetime
import random
import string

# Add parent directory to path for imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

class ComprehensiveProductionTester:
    def __init__(self, base_url):
        self.base_url = base_url.rstrip('/')
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'NewSteps-Testing-Framework/1.0'
        })
        
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
        
    def generate_test_data(self, suffix=""):
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
        """Layer 1: Production build and page availability analysis"""
        self.log("🔍 LAYER 1: Production Build Analysis")
        layer1_results = {
            'critical_pages': [],
            'api_endpoints': [],
            'performance_metrics': {},
            'issues': []
        }
        
        try:
            # Test critical pages
            critical_pages = [
                {'path': '/', 'name': 'Homepage', 'expected_content': ['New Steps', 'shoes']},
                {'path': '/shoes', 'name': 'Shoes Catalog', 'expected_content': ['shoes', 'available']},
                {'path': '/about', 'name': 'About Page', 'expected_content': ['mission', 'story']},
                {'path': '/contact', 'name': 'Contact Page', 'expected_content': ['contact', 'email']},
                {'path': '/donate/shoes', 'name': 'Shoe Donation', 'expected_content': ['donate', 'shoes']},
                {'path': '/login', 'name': 'Login Page', 'expected_content': ['login', 'email']},
                {'path': '/register', 'name': 'Registration', 'expected_content': ['register', 'account']},
            ]
            
            for page in critical_pages:
                start_time = time.time()
                try:
                    response = self.session.get(f"{self.base_url}{page['path']}", timeout=15)
                    load_time = time.time() - start_time
                    
                    # Check content
                    content_check = any(keyword.lower() in response.text.lower() 
                                      for keyword in page['expected_content'])
                    
                    page_result = {
                        'name': page['name'],
                        'path': page['path'],
                        'status_code': response.status_code,
                        'load_time': load_time,
                        'content_valid': content_check,
                        'success': response.status_code == 200 and content_check and load_time < 10
                    }
                    
                    layer1_results['critical_pages'].append(page_result)
                    
                    if not page_result['success']:
                        layer1_results['issues'].append(
                            f"Page {page['name']} failed: Status {response.status_code}, "
                            f"Load time {load_time:.2f}s, Content valid: {content_check}"
                        )
                        
                except Exception as e:
                    layer1_results['issues'].append(f"Page {page['name']} error: {str(e)}")
                    layer1_results['critical_pages'].append({
                        'name': page['name'],
                        'path': page['path'],
                        'success': False,
                        'error': str(e)
                    })
            
            # Test API endpoints
            api_endpoints = [
                {'path': '/api/health', 'name': 'Health Check', 'expected_status': 200},
                {'path': '/api/shoes', 'name': 'Shoes API', 'expected_status': 200},
                {'path': '/api/settings', 'name': 'Settings API', 'expected_status': 200},
                {'path': '/api/auth/test-login', 'name': 'Test Login API', 'expected_status': [400, 401]},  # Expects POST
                {'path': '/api/donations', 'name': 'Donations API', 'expected_status': [200, 401, 405]},
                {'path': '/api/admin/shoes', 'name': 'Admin API Protection', 'expected_status': [302, 401, 403]},
            ]
            
            for endpoint in api_endpoints:
                try:
                    response = self.session.get(f"{self.base_url}{endpoint['path']}", timeout=10)
                    expected_statuses = endpoint['expected_status'] if isinstance(endpoint['expected_status'], list) else [endpoint['expected_status']]
                    
                    endpoint_result = {
                        'name': endpoint['name'],
                        'path': endpoint['path'],
                        'status_code': response.status_code,
                        'success': response.status_code in expected_statuses
                    }
                    
                    layer1_results['api_endpoints'].append(endpoint_result)
                    
                except Exception as e:
                    layer1_results['issues'].append(f"API {endpoint['name']} error: {str(e)}")
            
            self.results['layers']['layer1'] = layer1_results
            
            # Calculate success rate
            successful_pages = len([p for p in layer1_results['critical_pages'] if p.get('success')])
            successful_apis = len([a for a in layer1_results['api_endpoints'] if a.get('success')])
            total_tests = len(layer1_results['critical_pages']) + len(layer1_results['api_endpoints'])
            success_rate = ((successful_pages + successful_apis) / total_tests * 100) if total_tests > 0 else 0
            
            self.log(f"✅ Layer 1 Complete: {success_rate:.1f}% success rate ({successful_pages + successful_apis}/{total_tests})")
            
        except Exception as e:
            layer1_results['issues'].append(f"Layer 1 critical error: {str(e)}")
            self.log(f"❌ Layer 1 Failed: {str(e)}", "ERROR")

    # ==================== LAYER 2: DATA FLOW INTEGRATION ====================
    def layer2_data_flow_integration(self):
        """Layer 2: Test data consistency and API integration"""
        self.log("🔍 LAYER 2: Data Flow Integration Testing")
        layer2_results = {
            'database_health': {},
            'data_consistency': [],
            'api_integration': [],
            'issues': []
        }
        
        try:
            # Test database connectivity and health
            health_response = self.session.get(f"{self.base_url}/api/health", timeout=15)
            if health_response.status_code == 200:
                health_data = health_response.json()
                layer2_results['database_health'] = {
                    'connected': health_data.get('databaseConnection') == 'connected',
                    'environment': health_data.get('environment'),
                    'database_name': health_data.get('databaseDetails', {}).get('name'),
                    'response_time': health_data.get('databaseDetails', {}).get('connectionTime')
                }
            
            # Test shoes data flow
            shoes_response = self.session.get(f"{self.base_url}/api/shoes", timeout=15)
            if shoes_response.status_code == 200:
                shoes_data = shoes_response.json()
                
                data_test = {
                    'test_name': 'shoes_data_structure',
                    'success': False,
                    'details': {}
                }
                
                if 'shoes' in shoes_data and isinstance(shoes_data['shoes'], list):
                    shoes_list = shoes_data['shoes']
                    data_test['details']['total_shoes'] = len(shoes_list)
                    data_test['details']['available_shoes'] = len([s for s in shoes_list if s.get('status') == 'available'])
                    
                    # Check shoe data structure
                    if shoes_list:
                        sample_shoe = shoes_list[0]
                        required_fields = ['shoeId', 'brand', 'modelName', 'size', 'status']
                        has_required_fields = all(field in sample_shoe for field in required_fields)
                        data_test['details']['has_required_fields'] = has_required_fields
                        data_test['success'] = has_required_fields and len(shoes_list) > 0
                    else:
                        data_test['details']['no_shoes_found'] = True
                
                layer2_results['data_consistency'].append(data_test)
            
            # Test settings integration
            settings_response = self.session.get(f"{self.base_url}/api/settings", timeout=10)
            if settings_response.status_code == 200:
                settings_data = settings_response.json()
                
                settings_test = {
                    'test_name': 'settings_integration',
                    'success': False,
                    'details': {}
                }
                
                required_settings = ['maxShoesPerRequest', 'shippingFee', 'projectEmail']
                has_settings = all(setting in settings_data for setting in required_settings)
                settings_test['success'] = has_settings
                settings_test['details']['settings_count'] = len(settings_data)
                settings_test['details']['has_required_settings'] = has_settings
                
                layer2_results['data_consistency'].append(settings_test)
            
            # Test form submission endpoints
            form_endpoints = [
                {'path': '/api/contact', 'method': 'POST', 'name': 'Contact Form'},
                {'path': '/api/donations', 'method': 'POST', 'name': 'Donation Form'},
                {'path': '/api/volunteer', 'method': 'POST', 'name': 'Volunteer Form'},
            ]
            
            for endpoint in form_endpoints:
                try:
                    # Test with minimal valid data
                    test_data = {
                        'firstName': 'Test',
                        'lastName': 'User',
                        'email': 'test@example.com',
                        'message': 'Test message'
                    }
                    
                    if endpoint['path'] == '/api/donations':
                        test_data.update({
                            'numberOfShoes': 1,
                            'condition': 'good',
                            'donationDescription': 'Test donation',
                            'donorInfo': {
                                'firstName': 'Test',
                                'lastName': 'User',
                                'email': 'test@example.com',
                                'phone': '1234567890'
                            }
                        })
                    elif endpoint['path'] == '/api/volunteer':
                        test_data.update({
                            'phone': '1234567890',
                            'availability': 'weekends',
                            'city': 'San Francisco',
                            'state': 'CA',
                            'interests': ['helping']
                        })
                    
                    response = self.session.post(f"{self.base_url}{endpoint['path']}", 
                                               json=test_data, timeout=15)
                    
                    # Success is 200-201 or validation error (400) - not server error (500)
                    integration_test = {
                        'test_name': f"{endpoint['name']}_endpoint",
                        'success': response.status_code in [200, 201, 400, 401],
                        'details': {
                            'status_code': response.status_code,
                            'endpoint_responsive': True
                        }
                    }
                    
                    if response.status_code == 500:
                        integration_test['details']['server_error'] = True
                        layer2_results['issues'].append(f"{endpoint['name']} returned 500 error")
                    
                    layer2_results['api_integration'].append(integration_test)
                    
                except Exception as e:
                    layer2_results['issues'].append(f"{endpoint['name']} integration error: {str(e)}")
            
            self.results['layers']['layer2'] = layer2_results
            
            # Calculate success rate
            all_tests = layer2_results['data_consistency'] + layer2_results['api_integration']
            successful_tests = len([t for t in all_tests if t.get('success')])
            success_rate = (successful_tests / len(all_tests) * 100) if all_tests else 0
            
            self.log(f"✅ Layer 2 Complete: {success_rate:.1f}% success rate ({successful_tests}/{len(all_tests)})")
            
        except Exception as e:
            layer2_results['issues'].append(f"Layer 2 critical error: {str(e)}")
            self.log(f"❌ Layer 2 Failed: {str(e)}", "ERROR")

    # ==================== LAYER 3: WORKFLOW SIMULATION ====================
    def layer3_workflow_simulation(self):
        """Layer 3: Simulate complete user workflows via API"""
        self.log("🔍 LAYER 3: Multi-User Workflow Simulation")
        layer3_results = {
            'visitor_workflows': [],
            'user_workflows': [],
            'admin_workflows': [],
            'issues': []
        }
        
        try:
            # Visitor Workflows
            self.log("Testing Visitor Workflows...")
            
            # Visitor Workflow 1: Browse shoes
            workflow = {'name': 'visitor_browse_shoes', 'success': False, 'steps': []}
            
            try:
                # Step 1: Get shoes list
                shoes_response = self.session.get(f"{self.base_url}/api/shoes", timeout=15)
                step1 = {
                    'step': 'get_shoes_list',
                    'success': shoes_response.status_code == 200,
                    'details': {'status_code': shoes_response.status_code}
                }
                
                if step1['success']:
                    shoes_data = shoes_response.json()
                    step1['details']['shoes_count'] = len(shoes_data.get('shoes', []))
                
                workflow['steps'].append(step1)
                
                # Step 2: Get individual shoe details (if shoes exist)
                if step1['success'] and shoes_data.get('shoes'):
                    first_shoe = shoes_data['shoes'][0]
                    shoe_id = first_shoe.get('shoeId')
                    
                    if shoe_id:
                        shoe_detail_response = self.session.get(f"{self.base_url}/api/shoes/{shoe_id}", timeout=10)
                        step2 = {
                            'step': 'get_shoe_details',
                            'success': shoe_detail_response.status_code == 200,
                            'details': {'status_code': shoe_detail_response.status_code, 'shoe_id': shoe_id}
                        }
                        workflow['steps'].append(step2)
                
                workflow['success'] = all(step['success'] for step in workflow['steps'])
                
            except Exception as e:
                workflow['steps'].append({'step': 'error', 'success': False, 'details': {'error': str(e)}})
            
            layer3_results['visitor_workflows'].append(workflow)
            
            # Visitor Workflow 2: Submit contact form
            workflow = {'name': 'visitor_contact_submission', 'success': False, 'steps': []}
            
            try:
                contact_data = {
                    'firstName': 'Test',
                    'lastName': 'Visitor',
                    'email': f'testvisitor_{int(time.time())}@example.com',
                    'message': 'Test contact message from workflow simulation'
                }
                
                contact_response = self.session.post(f"{self.base_url}/api/contact", 
                                                   json=contact_data, timeout=15)
                
                step = {
                    'step': 'submit_contact_form',
                    'success': contact_response.status_code in [200, 201],
                    'details': {'status_code': contact_response.status_code}
                }
                
                workflow['steps'].append(step)
                workflow['success'] = step['success']
                
            except Exception as e:
                workflow['steps'].append({'step': 'error', 'success': False, 'details': {'error': str(e)}})
            
            layer3_results['visitor_workflows'].append(workflow)
            
            # User Workflows
            self.log("Testing User Workflows...")
            
            # User Workflow 1: Registration and Authentication
            workflow = {'name': 'user_registration_flow', 'success': False, 'steps': []}
            user_data = self.generate_test_data("_workflow")
            
            try:
                # Step 1: Register new user
                registration_response = self.session.post(f"{self.base_url}/api/auth/register", 
                                                        json=user_data, timeout=15)
                
                step1 = {
                    'step': 'user_registration',
                    'success': registration_response.status_code in [200, 201],
                    'details': {
                        'status_code': registration_response.status_code,
                        'email': user_data['email']
                    }
                }
                workflow['steps'].append(step1)
                
                # Step 2: Test login
                if step1['success']:
                    login_data = {
                        'email': user_data['email'],
                        'password': user_data['password']
                    }
                    
                    login_response = self.session.post(f"{self.base_url}/api/auth/test-login", 
                                                     json=login_data, timeout=15)
                    
                    step2 = {
                        'step': 'user_login',
                        'success': login_response.status_code == 200,
                        'details': {'status_code': login_response.status_code}
                    }
                    
                    if step2['success']:
                        login_result = login_response.json()
                        step2['details']['user_role'] = login_result.get('user', {}).get('role')
                    
                    workflow['steps'].append(step2)
                
                workflow['success'] = all(step['success'] for step in workflow['steps'])
                
            except Exception as e:
                workflow['steps'].append({'step': 'error', 'success': False, 'details': {'error': str(e)}})
            
            layer3_results['user_workflows'].append(workflow)
            
            # Admin Workflows
            self.log("Testing Admin Workflows...")
            
            # Admin Workflow 1: Admin Authentication
            workflow = {'name': 'admin_authentication', 'success': False, 'steps': []}
            
            try:
                admin_login_data = {
                    'email': 'admin@newsteps.fit',
                    'password': 'Admin123!'
                }
                
                admin_login_response = self.session.post(f"{self.base_url}/api/auth/test-login", 
                                                       json=admin_login_data, timeout=15)
                
                step = {
                    'step': 'admin_login',
                    'success': admin_login_response.status_code == 200,
                    'details': {'status_code': admin_login_response.status_code}
                }
                
                if step['success']:
                    admin_result = admin_login_response.json()
                    step['details']['admin_role'] = admin_result.get('user', {}).get('role')
                    step['success'] = admin_result.get('user', {}).get('role') == 'admin'
                
                workflow['steps'].append(step)
                workflow['success'] = step['success']
                
            except Exception as e:
                workflow['steps'].append({'step': 'error', 'success': False, 'details': {'error': str(e)}})
            
            layer3_results['admin_workflows'].append(workflow)
            
            self.results['layers']['layer3'] = layer3_results
            
            # Calculate success rate
            all_workflows = (layer3_results['visitor_workflows'] + 
                           layer3_results['user_workflows'] + 
                           layer3_results['admin_workflows'])
            successful_workflows = len([w for w in all_workflows if w.get('success')])
            success_rate = (successful_workflows / len(all_workflows) * 100) if all_workflows else 0
            
            self.log(f"✅ Layer 3 Complete: {success_rate:.1f}% success rate ({successful_workflows}/{len(all_workflows)})")
            
        except Exception as e:
            layer3_results['issues'].append(f"Layer 3 critical error: {str(e)}")
            self.log(f"❌ Layer 3 Failed: {str(e)}", "ERROR")

    # ==================== LAYER 4: PRODUCTION HEALTH ====================
    def layer4_production_health(self):
        """Layer 4: Production environment health and performance"""
        self.log("🔍 LAYER 4: Production Health Validation")
        layer4_results = {
            'performance_metrics': {},
            'security_validation': {},
            'reliability_tests': {},
            'environment_check': {},
            'issues': []
        }
        
        try:
            # Performance metrics
            self.log("Testing performance metrics...")
            
            # Homepage load time
            start_time = time.time()
            homepage_response = self.session.get(f"{self.base_url}/", timeout=30)
            homepage_load_time = time.time() - start_time
            
            # API response time
            start_time = time.time()
            api_response = self.session.get(f"{self.base_url}/api/health", timeout=15)
            api_response_time = time.time() - start_time
            
            layer4_results['performance_metrics'] = {
                'homepage_load_time': homepage_load_time,
                'api_response_time': api_response_time,
                'homepage_status': homepage_response.status_code,
                'api_status': api_response.status_code,
                'performance_acceptable': homepage_load_time < 5.0 and api_response_time < 2.0
            }
            
            # Security validation
            self.log("Testing security measures...")
            security_tests = []
            
            # Test admin protection
            admin_response = self.session.get(f"{self.base_url}/admin", allow_redirects=False, timeout=10)
            security_tests.append({
                'test': 'admin_route_protection',
                'success': admin_response.status_code in [302, 401, 403],
                'status_code': admin_response.status_code
            })
            
            # Test API authentication requirements
            protected_apis = ['/api/admin/shoes', '/api/admin/users', '/api/admin/settings']
            for api in protected_apis:
                try:
                    response = self.session.get(f"{self.base_url}{api}", allow_redirects=False, timeout=10)
                    security_tests.append({
                        'test': f'api_protection_{api.split("/")[-1]}',
                        'success': response.status_code in [302, 401, 403],
                        'status_code': response.status_code
                    })
                except Exception as e:
                    security_tests.append({
                        'test': f'api_protection_{api.split("/")[-1]}',
                        'success': False,
                        'error': str(e)
                    })
            
            layer4_results['security_validation'] = security_tests
            
            # Reliability tests
            self.log("Testing system reliability...")
            
            # Test multiple concurrent requests
            import concurrent.futures
            
            def test_concurrent_health_check():
                try:
                    response = self.session.get(f"{self.base_url}/api/health", timeout=10)
                    return response.status_code == 200
                except:
                    return False
            
            # Run 10 concurrent requests
            with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
                futures = [executor.submit(test_concurrent_health_check) for _ in range(10)]
                concurrent_results = [future.result() for future in futures]
            
            reliability_tests = [{
                'test': 'concurrent_load_handling',
                'success_rate': sum(concurrent_results) / len(concurrent_results),
                'total_requests': len(concurrent_results),
                'successful_requests': sum(concurrent_results),
                'success': sum(concurrent_results) >= 8  # At least 80% success
            }]
            
            layer4_results['reliability_tests'] = reliability_tests
            
            # Environment check
            if api_response.status_code == 200:
                health_data = api_response.json()
                layer4_results['environment_check'] = {
                    'environment': health_data.get('environment'),
                    'database_connected': health_data.get('databaseConnection') == 'connected',
                    'database_name': health_data.get('databaseDetails', {}).get('name'),
                    'server_timestamp': health_data.get('timestamp')
                }
            
            self.results['layers']['layer4'] = layer4_results
            
            # Calculate success rate
            performance_ok = layer4_results['performance_metrics'].get('performance_acceptable', False)
            security_passed = len([t for t in security_tests if t.get('success')]) / len(security_tests) >= 0.8
            reliability_passed = all(t.get('success', False) for t in reliability_tests)
            
            success_count = sum([performance_ok, security_passed, reliability_passed])
            success_rate = (success_count / 3 * 100)
            
            self.log(f"✅ Layer 4 Complete: {success_rate:.1f}% success rate")
            
        except Exception as e:
            layer4_results['issues'].append(f"Layer 4 critical error: {str(e)}")
            self.log(f"❌ Layer 4 Failed: {str(e)}", "ERROR")

    # ==================== MULTI-USER SCENARIOS ====================
    def test_multi_user_scenarios(self):
        """Test complex multi-user interaction scenarios"""
        self.log("🔍 MULTI-USER INTERACTION SCENARIOS")
        
        scenarios = []
        
        # Scenario 1: Complete donation-to-inventory workflow
        scenario = {
            'name': 'donation_to_inventory_workflow',
            'description': 'Visitor donates shoes, admin processes donation',
            'success': False,
            'steps': []
        }
        
        try:
            # Step 1: Visitor submits shoe donation
            donation_data = {
                'numberOfShoes': 2,
                'condition': 'good',
                'donationDescription': 'Test shoes for multi-user workflow',
                'notes': 'Testing complete workflow',
                'donorInfo': {
                    'firstName': 'Test',
                    'lastName': 'Donor',
                    'email': f'testdonor_{int(time.time())}@example.com',
                    'phone': '1234567890'
                }
            }
            
            donation_response = self.session.post(f"{self.base_url}/api/donations", 
                                                json=donation_data, timeout=15)
            
            step1 = {
                'step': 'visitor_donation_submission',
                'success': donation_response.status_code in [200, 201],
                'details': {
                    'status_code': donation_response.status_code,
                    'donor_email': donation_data['donorInfo']['email']
                }
            }
            scenario['steps'].append(step1)
            
            # Step 2: Admin authentication (simulated)
            admin_login_data = {
                'email': 'admin@newsteps.fit',
                'password': 'Admin123!'
            }
            
            admin_response = self.session.post(f"{self.base_url}/api/auth/test-login", 
                                             json=admin_login_data, timeout=15)
            
            step2 = {
                'step': 'admin_authentication',
                'success': admin_response.status_code == 200,
                'details': {'status_code': admin_response.status_code}
            }
            
            if step2['success']:
                admin_result = admin_response.json()
                step2['details']['admin_verified'] = admin_result.get('user', {}).get('role') == 'admin'
                step2['success'] = step2['details']['admin_verified']
            
            scenario['steps'].append(step2)
            
            # Calculate scenario success
            successful_steps = sum(1 for step in scenario['steps'] if step['success'])
            scenario['success'] = successful_steps >= len(scenario['steps']) * 0.8  # 80% success threshold
            scenario['success_rate'] = successful_steps / len(scenario['steps'])
            
        except Exception as e:
            scenario['steps'].append({
                'step': 'scenario_execution_error',
                'success': False,
                'details': {'error': str(e)}
            })
        
        scenarios.append(scenario)
        
        # Scenario 2: User registration to request workflow
        scenario = {
            'name': 'user_registration_to_request',
            'description': 'User registers, browses shoes, attempts request',
            'success': False,
            'steps': []
        }
        
        try:
            # Step 1: User registration
            user_data = self.generate_test_data("_scenario")
            
            registration_response = self.session.post(f"{self.base_url}/api/auth/register", 
                                                    json=user_data, timeout=15)
            
            step1 = {
                'step': 'user_registration',
                'success': registration_response.status_code in [200, 201],
                'details': {
                    'status_code': registration_response.status_code,
                    'user_email': user_data['email']
                }
            }
            scenario['steps'].append(step1)
            
            # Step 2: User login verification
            if step1['success']:
                login_data = {
                    'email': user_data['email'],
                    'password': user_data['password']
                }
                
                login_response = self.session.post(f"{self.base_url}/api/auth/test-login", 
                                                 json=login_data, timeout=15)
                
                step2 = {
                    'step': 'user_login_verification',
                    'success': login_response.status_code == 200,
                    'details': {'status_code': login_response.status_code}
                }
                scenario['steps'].append(step2)
            
            # Step 3: Browse available shoes
            shoes_response = self.session.get(f"{self.base_url}/api/shoes", timeout=15)
            
            step3 = {
                'step': 'browse_available_shoes',
                'success': shoes_response.status_code == 200,
                'details': {'status_code': shoes_response.status_code}
            }
            
            if step3['success']:
                shoes_data = shoes_response.json()
                available_shoes = [s for s in shoes_data.get('shoes', []) if s.get('status') == 'available']
                step3['details']['available_shoes_count'] = len(available_shoes)
                step3['success'] = len(available_shoes) > 0
            
            scenario['steps'].append(step3)
            
            # Calculate scenario success
            successful_steps = sum(1 for step in scenario['steps'] if step['success'])
            scenario['success'] = successful_steps >= len(scenario['steps']) * 0.8
            scenario['success_rate'] = successful_steps / len(scenario['steps'])
            
        except Exception as e:
            scenario['steps'].append({
                'step': 'scenario_execution_error',
                'success': False,
                'details': {'error': str(e)}
            })
        
        scenarios.append(scenario)
        
        self.results['multi_user_scenarios'] = scenarios
        
        # Log scenario results
        for scenario in scenarios:
            status = '✅' if scenario['success'] else '❌'
            success_rate = scenario.get('success_rate', 0) * 100
            self.log(f"{status} {scenario['name']}: {success_rate:.1f}% success rate")

    # ==================== MAIN EXECUTION ====================
    def run_comprehensive_test(self):
        """Execute all 4 layers plus multi-user scenarios"""
        self.log("🚀 Starting Comprehensive Multi-User Production Testing")
        self.log("=" * 80)
        
        start_time = time.time()
        
        # Execute all layers
        self.layer1_build_analysis()
        self.layer2_data_flow_integration()
        self.layer3_workflow_simulation()
        self.layer4_production_health()
        
        # Execute multi-user scenarios
        self.test_multi_user_scenarios()
        
        # Calculate overall results
        self._calculate_overall_results()
        
        # Generate final report
        execution_time = time.time() - start_time
        self._generate_final_report(execution_time)
        
        return self.results

    def _calculate_overall_results(self):
        """Calculate comprehensive success metrics across all layers"""
        layer_scores = []
        
        # Layer 1 score
        if 'layer1' in self.results['layers']:
            layer1 = self.results['layers']['layer1']
            pages_success = len([p for p in layer1.get('critical_pages', []) if p.get('success')])
            apis_success = len([a for a in layer1.get('api_endpoints', []) if a.get('success')])
            total_layer1 = len(layer1.get('critical_pages', [])) + len(layer1.get('api_endpoints', []))
            layer1_score = (pages_success + apis_success) / total_layer1 if total_layer1 > 0 else 0
            layer_scores.append(layer1_score)
        
        # Layer 2 score
        if 'layer2' in self.results['layers']:
            layer2 = self.results['layers']['layer2']
            all_tests = layer2.get('data_consistency', []) + layer2.get('api_integration', [])
            successful_tests = len([t for t in all_tests if t.get('success')])
            layer2_score = successful_tests / len(all_tests) if all_tests else 0
            layer_scores.append(layer2_score)
        
        # Layer 3 score
        if 'layer3' in self.results['layers']:
            layer3 = self.results['layers']['layer3']
            all_workflows = (layer3.get('visitor_workflows', []) + 
                           layer3.get('user_workflows', []) + 
                           layer3.get('admin_workflows', []))
            successful_workflows = len([w for w in all_workflows if w.get('success')])
            layer3_score = successful_workflows / len(all_workflows) if all_workflows else 0
            layer_scores.append(layer3_score)
        
        # Layer 4 score
        if 'layer4' in self.results['layers']:
            layer4 = self.results['layers']['layer4']
            performance_ok = layer4.get('performance_metrics', {}).get('performance_acceptable', False)
            security_tests = layer4.get('security_validation', [])
            security_passed = len([t for t in security_tests if t.get('success')]) / len(security_tests) if security_tests else 0
            reliability_tests = layer4.get('reliability_tests', [])
            reliability_passed = len([t for t in reliability_tests if t.get('success')]) / len(reliability_tests) if reliability_tests else 0
            
            layer4_score = (int(performance_ok) + security_passed + reliability_passed) / 3
            layer_scores.append(layer4_score)
        
        # Multi-user scenarios score
        scenarios = self.results.get('multi_user_scenarios', [])
        if scenarios:
            successful_scenarios = len([s for s in scenarios if s.get('success')])
            scenarios_score = successful_scenarios / len(scenarios)
            layer_scores.append(scenarios_score)
        
        # Calculate overall success rate
        self.results['overall_success_rate'] = (sum(layer_scores) / len(layer_scores) * 100) if layer_scores else 0
        self.results['layer_scores'] = {
            f'layer_{i+1}': score * 100 for i, score in enumerate(layer_scores[:-1])
        }
        if scenarios:
            self.results['layer_scores']['multi_user_scenarios'] = layer_scores[-1] * 100

    def _generate_final_report(self, execution_time):
        """Generate comprehensive final report"""
        print("\n" + "=" * 80)
        print("📊 COMPREHENSIVE MULTI-USER PRODUCTION TESTING REPORT")
        print("=" * 80)
        
        print(f"\n🎯 OVERALL RESULTS:")
        print(f"  Success Rate: {self.results['overall_success_rate']:.1f}%")
        print(f"  Execution Time: {execution_time:.1f} seconds")
        print(f"  Environment: {self.base_url}")
        
        # Layer-by-layer breakdown
        layer_names = {
            'layer_1': 'Layer 1: Build Analysis',
            'layer_2': 'Layer 2: Data Flow Integration', 
            'layer_3': 'Layer 3: Workflow Simulation',
            'layer_4': 'Layer 4: Production Health',
            'multi_user_scenarios': 'Multi-User Scenarios'
        }
        
        print(f"\n📋 LAYER-BY-LAYER RESULTS:")
        for layer_key, score in self.results.get('layer_scores', {}).items():
            layer_name = layer_names.get(layer_key, layer_key)
            status = '✅' if score >= 75 else '⚠️' if score >= 50 else '❌'
            print(f"  {status} {layer_name}: {score:.1f}%")
        
        # Critical findings
        all_issues = []
        for layer_data in self.results['layers'].values():
            all_issues.extend(layer_data.get('issues', []))
        
        if all_issues:
            print(f"\n❌ CRITICAL ISSUES FOUND ({len(all_issues)}):")
            for i, issue in enumerate(all_issues[:5], 1):
                print(f"  {i}. {issue}")
            if len(all_issues) > 5:
                print(f"  ... and {len(all_issues) - 5} more issues")
        else:
            print(f"\n✅ NO CRITICAL ISSUES FOUND")
        
        # Performance summary
        if 'layer4' in self.results['layers']:
            perf = self.results['layers']['layer4'].get('performance_metrics', {})
            print(f"\n⚡ PERFORMANCE SUMMARY:")
            print(f"  Homepage Load Time: {perf.get('homepage_load_time', 0):.2f}s")
            print(f"  API Response Time: {perf.get('api_response_time', 0):.2f}s")
            print(f"  Performance Rating: {'✅ Excellent' if perf.get('performance_acceptable') else '⚠️ Needs Improvement'}")
        
        # Multi-user scenarios summary
        scenarios = self.results.get('multi_user_scenarios', [])
        if scenarios:
            print(f"\n🔄 MULTI-USER SCENARIOS:")
            for scenario in scenarios:
                status = '✅' if scenario.get('success') else '❌'
                success_rate = scenario.get('success_rate', 0) * 100
                print(f"  {status} {scenario['name']}: {success_rate:.1f}%")
        
        # Recommendations
        recommendations = []
        
        if self.results['overall_success_rate'] < 90:
            recommendations.append("Overall success rate below 90% - investigate failing components")
        
        if all_issues:
            recommendations.append("Address critical issues found during testing")
        
        if 'layer4' in self.results['layers']:
            perf = self.results['layers']['layer4'].get('performance_metrics', {})
            if not perf.get('performance_acceptable'):
                recommendations.append("Optimize performance - load times exceed acceptable thresholds")
        
        if recommendations:
            print(f"\n💡 RECOMMENDATIONS:")
            for i, rec in enumerate(recommendations, 1):
                print(f"  {i}. {rec}")
        
        # Save detailed results
        timestamp = int(time.time())
        filename = f"comprehensive_multi_user_production_test_{timestamp}.json"
        with open(filename, 'w') as f:
            json.dump(self.results, f, indent=2)
        
        print(f"\n📄 Detailed results saved to: {filename}")
        
        # Final status
        if self.results['overall_success_rate'] >= 90:
            print(f"\n🎉 PRODUCTION STATUS: EXCELLENT - Ready for full deployment")
        elif self.results['overall_success_rate'] >= 75:
            print(f"\n✅ PRODUCTION STATUS: GOOD - Minor optimizations recommended")
        elif self.results['overall_success_rate'] >= 50:
            print(f"\n⚠️ PRODUCTION STATUS: ACCEPTABLE - Significant improvements needed")
        else:
            print(f"\n❌ PRODUCTION STATUS: CRITICAL - Major issues require immediate attention")
        
        print("=" * 80)

def main():
    if len(sys.argv) != 2:
        print("Usage: python comprehensive_multi_user_production_test.py <base_url>")
        print("Example: python comprehensive_multi_user_production_test.py https://newsteps.fit")
        sys.exit(1)
    
    base_url = sys.argv[1]
    tester = ComprehensiveProductionTester(base_url)
    
    try:
        results = tester.run_comprehensive_test()
        
        # Exit with appropriate code based on success rate
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
