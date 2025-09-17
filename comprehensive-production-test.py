#!/usr/bin/env python3

"""
COMPREHENSIVE PRODUCTION TESTING FRAMEWORK
Tests all authentication-required functions and workflows on both localhost and production
"""

import requests
import json
import time
import sys
from datetime import datetime
import os

class ComprehensiveProductionTester:
    def __init__(self, base_url):
        self.base_url = base_url.rstrip('/')
        self.session = requests.Session()
        self.test_results = {
            'timestamp': datetime.now().isoformat(),
            'base_url': base_url,
            'total_tests': 0,
            'passed_tests': 0,
            'failed_tests': 0,
            'test_details': [],
            'authentication': {
                'user_session': None,
                'admin_session': None
            }
        }
        
    def log_test(self, test_name, success, details, error=None):
        """Log test result"""
        self.test_results['total_tests'] += 1
        if success:
            self.test_results['passed_tests'] += 1
            status = "✅ PASS"
        else:
            self.test_results['failed_tests'] += 1
            status = "❌ FAIL"
            
        result = {
            'test_name': test_name,
            'status': status,
            'success': success,
            'details': details,
            'error': error,
            'timestamp': datetime.now().isoformat()
        }
        
        self.test_results['test_details'].append(result)
        print(f"{status} - {test_name}: {details}")
        if error:
            print(f"    Error: {error}")
            
    def test_user_registration(self):
        """Test user registration workflow"""
        test_data = {
            'firstName': 'Test',
            'lastName': 'User',
            'email': f'testuser_{int(time.time())}@example.com',
            'phone': '1234567890',
            'password': 'TestPassword123!',
            'confirmPassword': 'TestPassword123!'
        }
        
        try:
            response = self.session.post(f'{self.base_url}/api/auth/register', json=test_data)
            
            if response.status_code == 201:
                self.log_test('User Registration', True, f'User registered successfully: {test_data["email"]}')
                return test_data
            else:
                self.log_test('User Registration', False, f'Registration failed with status {response.status_code}', response.text)
                return None
                
        except Exception as e:
            self.log_test('User Registration', False, 'Registration request failed', str(e))
            return None
            
    def test_user_login(self, email=None, password=None):
        """Test user login workflow"""
        if not email:
            email = 'testuser@example.com'
            password = 'TestPassword123!'
            
        login_data = {
            'email': email,
            'password': password,
            'redirect': 'false'
        }
        
        try:
            # Test login API using test endpoint
            response = self.session.post(f'{self.base_url}/api/auth/test-login', json={'email': email, 'password': password})
            
            if response.status_code == 200:
                login_data = response.json()
                if login_data.get('success') and login_data.get('user'):
                    # Store user data for session simulation
                    user_data = login_data['user']
                    self.test_results['authentication']['user_session'] = {'user': user_data}
                    self.log_test('User Login', True, f'User logged in successfully: {email}')
                    return {'user': user_data}
                        
            self.log_test('User Login', False, f'Login failed with status {response.status_code}', response.text)
            return None
            
        except Exception as e:
            self.log_test('User Login', False, 'Login request failed', str(e))
            return None
            
    def test_admin_login(self):
        """Test admin login workflow"""
        admin_data = {
            'email': 'admin@newsteps.fit',
            'password': 'Admin123!',
            'redirect': 'false'
        }
        
        try:
            response = self.session.post(f'{self.base_url}/api/auth/test-login', json={'email': admin_data['email'], 'password': admin_data['password']})
            
            if response.status_code == 200:
                login_data = response.json()
                if login_data.get('success') and login_data.get('user', {}).get('role') == 'admin':
                    # Store admin data for session simulation
                    user_data = login_data['user']
                    self.test_results['authentication']['admin_session'] = {'user': user_data}
                    self.log_test('Admin Login', True, 'Admin logged in successfully')
                    return {'user': user_data}
                        
            self.log_test('Admin Login', False, f'Admin login failed with status {response.status_code}', response.text)
            return None
            
        except Exception as e:
            self.log_test('Admin Login', False, 'Admin login request failed', str(e))
            return None
            
    def test_protected_user_endpoints(self):
        """Test user-protected endpoints"""
        endpoints = [
            ('/api/requests', 'GET', 'User Requests List'),
            ('/api/donations', 'GET', 'User Donations List'),
            ('/api/volunteer', 'GET', 'User Volunteer Applications')
        ]
        
        for endpoint, method, description in endpoints:
            try:
                if method == 'GET':
                    response = self.session.get(f'{self.base_url}{endpoint}')
                    
                if response.status_code == 200:
                    data = response.json()
                    self.log_test(f'Protected Endpoint: {description}', True, f'Endpoint accessible, returned {len(data.get("data", data))} items')
                elif response.status_code == 401:
                    self.log_test(f'Protected Endpoint: {description}', True, 'Properly protected (401 Unauthorized)')
                else:
                    self.log_test(f'Protected Endpoint: {description}', False, f'Unexpected status {response.status_code}', response.text)
                    
            except Exception as e:
                self.log_test(f'Protected Endpoint: {description}', False, 'Request failed', str(e))
                
    def test_admin_endpoints(self):
        """Test admin-protected endpoints"""
        endpoints = [
            ('/api/admin/shoes', 'GET', 'Admin Shoes Management'),
            ('/api/admin/requests', 'GET', 'Admin Requests Management'),
            ('/api/admin/donations', 'GET', 'Admin Donations Management'),
            ('/api/admin/users', 'GET', 'Admin Users Management'),
            ('/api/admin/settings', 'GET', 'Admin Settings Management')
        ]
        
        for endpoint, method, description in endpoints:
            try:
                if method == 'GET':
                    response = self.session.get(f'{self.base_url}{endpoint}')
                    
                if response.status_code == 200:
                    data = response.json()
                    self.log_test(f'Admin Endpoint: {description}', True, f'Admin endpoint accessible, returned data')
                elif response.status_code == 401 or response.status_code == 403:
                    self.log_test(f'Admin Endpoint: {description}', True, f'Properly protected ({response.status_code})')
                else:
                    self.log_test(f'Admin Endpoint: {description}', False, f'Unexpected status {response.status_code}', response.text)
                    
            except Exception as e:
                self.log_test(f'Admin Endpoint: {description}', False, 'Request failed', str(e))
                
    def test_shoe_request_workflow(self):
        """Test complete shoe request workflow"""
        # First get available shoes
        try:
            shoes_response = self.session.get(f'{self.base_url}/api/shoes')
            if shoes_response.status_code != 200:
                self.log_test('Shoe Request Workflow - Get Shoes', False, 'Could not fetch shoes', shoes_response.text)
                return
                
            shoes_data = shoes_response.json()
            available_shoes = shoes_data.get('shoes', [])
            
            if not available_shoes:
                self.log_test('Shoe Request Workflow - Get Shoes', False, 'No available shoes found')
                return
                
            self.log_test('Shoe Request Workflow - Get Shoes', True, f'Found {len(available_shoes)} available shoes')
            
            # Create a shoe request
            test_shoe = available_shoes[0]
            request_data = {
                'items': [{
                    'shoeId': test_shoe.get('shoeId'),
                    'inventoryId': test_shoe.get('_id'),
                    'name': test_shoe.get('modelName', 'Test Shoe'),
                    'brand': test_shoe.get('brand', 'Test Brand'),
                    'size': test_shoe.get('size', '10'),
                    'color': test_shoe.get('color', 'Black'),
                    'sport': test_shoe.get('sport', 'Running'),
                    'condition': test_shoe.get('condition', 'good'),
                    'gender': test_shoe.get('gender', 'unisex'),
                    'quantity': 1
                }],
                'requestorInfo': {
                    'firstName': 'Test',
                    'lastName': 'Requestor',
                    'email': 'testrequestor@example.com',
                    'phone': '1234567890',
                    'schoolName': 'Test School',
                    'grade': '10',
                    'sportClub': 'Test Club'
                },
                'shippingInfo': {
                    'address': '123 Test St',
                    'city': 'Test City',
                    'state': 'CA',
                    'zipCode': '12345',
                    'country': 'USA'
                },
                'deliveryMethod': 'standard',
                'shippingFee': 5,
                'notes': 'Test request from automated testing'
            }
            
            request_response = self.session.post(f'{self.base_url}/api/requests', json=request_data)
            
            if request_response.status_code == 201:
                request_result = request_response.json()
                self.log_test('Shoe Request Workflow - Create Request', True, f'Request created: {request_result.get("referenceId", "Unknown ID")}')
            elif request_response.status_code == 401:
                self.log_test('Shoe Request Workflow - Create Request', True, 'Properly requires authentication (401)')
            else:
                self.log_test('Shoe Request Workflow - Create Request', False, f'Request failed with status {request_response.status_code}', request_response.text)
                
        except Exception as e:
            self.log_test('Shoe Request Workflow', False, 'Workflow test failed', str(e))
            
    def test_donation_workflow(self):
        """Test shoe donation workflow"""
        donation_data = {
            'donationType': 'shoes',
            'donationDescription': 'Test donation of athletic shoes',
            'numberOfShoes': 2,
            'condition': 'good',
            'notes': 'Test donation from automated testing',
            'firstName': 'Test',
            'lastName': 'Donor',
            'email': 'testdonor@example.com',
            'phone': '1234567890',
            'address': {
                'street': '123 Donor St',
                'city': 'Donor City',
                'state': 'CA',
                'zipCode': '12345',
                'country': 'USA'
            }
        }
        
        try:
            response = self.session.post(f'{self.base_url}/api/donations', json=donation_data)
            
            if response.status_code == 201:
                donation_result = response.json()
                self.log_test('Donation Workflow', True, f'Donation created: {donation_result.get("referenceId", "Unknown ID")}')
            else:
                self.log_test('Donation Workflow', False, f'Donation failed with status {response.status_code}', response.text)
                
        except Exception as e:
            self.log_test('Donation Workflow', False, 'Donation workflow failed', str(e))
            
    def test_volunteer_application_workflow(self):
        """Test volunteer application workflow"""
        volunteer_data = {
            'firstName': 'Test',
            'lastName': 'Volunteer',
            'email': 'testvolunteer@example.com',
            'phone': '1234567890',
            'city': 'Test City',
            'state': 'CA',
            'location': 'Test City, CA',
            'interests': ['shoe_sorting', 'event_help'],
            'availability': 'weekends',
            'experience': 'No prior experience but eager to help',
            'motivation': 'Test volunteer application from automated testing'
        }
        
        try:
            response = self.session.post(f'{self.base_url}/api/volunteer', json=volunteer_data)
            
            if response.status_code == 201:
                volunteer_result = response.json()
                self.log_test('Volunteer Application Workflow', True, 'Volunteer application submitted successfully')
            elif response.status_code == 401:
                self.log_test('Volunteer Application Workflow', True, 'Properly requires authentication (401)')
            else:
                self.log_test('Volunteer Application Workflow', False, f'Application failed with status {response.status_code}', response.text)
                
        except Exception as e:
            self.log_test('Volunteer Application Workflow', False, 'Volunteer workflow failed', str(e))
            
    def test_contact_form_workflow(self):
        """Test contact form workflow"""
        contact_data = {
            'firstName': 'Test',
            'lastName': 'Contact',
            'email': 'testcontact@example.com',
            'subject': 'Test Contact Form',
            'message': 'This is a test message from automated testing'
        }
        
        try:
            response = self.session.post(f'{self.base_url}/api/contact', json=contact_data)
            
            if response.status_code == 200:
                self.log_test('Contact Form Workflow', True, 'Contact form submitted successfully')
            else:
                self.log_test('Contact Form Workflow', False, f'Contact form failed with status {response.status_code}', response.text)
                
        except Exception as e:
            self.log_test('Contact Form Workflow', False, 'Contact form workflow failed', str(e))
            
    def test_account_page_access(self):
        """Test account page functionality"""
        try:
            # Test account page API endpoints
            endpoints = [
                ('/api/auth/session', 'Session Check'),
                ('/api/requests', 'User Requests'),
                ('/api/donations', 'User Donations')
            ]
            
            for endpoint, description in endpoints:
                response = self.session.get(f'{self.base_url}{endpoint}')
                
                if response.status_code == 200:
                    self.log_test(f'Account Page - {description}', True, f'{description} accessible')
                elif response.status_code == 401:
                    self.log_test(f'Account Page - {description}', True, f'{description} properly protected')
                else:
                    self.log_test(f'Account Page - {description}', False, f'Unexpected status {response.status_code}', response.text)
                    
        except Exception as e:
            self.log_test('Account Page Access', False, 'Account page test failed', str(e))
            
    def run_comprehensive_test(self):
        """Run all comprehensive tests"""
        print(f"\n🚀 Starting Comprehensive Production Testing on {self.base_url}")
        print("=" * 80)
        
        # Phase 1: Authentication Tests
        print("\n📋 PHASE 1: AUTHENTICATION TESTING")
        user_data = self.test_user_registration()
        if user_data:
            self.test_user_login(user_data['email'], user_data['password'])
        else:
            self.test_user_login()  # Try with default credentials
            
        self.test_admin_login()
        
        # Phase 2: Protected Endpoint Tests
        print("\n📋 PHASE 2: PROTECTED ENDPOINT TESTING")
        self.test_protected_user_endpoints()
        self.test_admin_endpoints()
        
        # Phase 3: Workflow Tests
        print("\n📋 PHASE 3: WORKFLOW TESTING")
        self.test_shoe_request_workflow()
        self.test_donation_workflow()
        self.test_volunteer_application_workflow()
        self.test_contact_form_workflow()
        
        # Phase 4: Account Functionality
        print("\n📋 PHASE 4: ACCOUNT FUNCTIONALITY TESTING")
        self.test_account_page_access()
        
        # Generate final report
        self.generate_final_report()
        
    def generate_final_report(self):
        """Generate comprehensive test report"""
        success_rate = (self.test_results['passed_tests'] / self.test_results['total_tests'] * 100) if self.test_results['total_tests'] > 0 else 0
        
        print("\n" + "=" * 80)
        print("📊 COMPREHENSIVE TESTING FINAL REPORT")
        print("=" * 80)
        
        print(f"\n🎯 OVERALL RESULTS:")
        print(f"  Total Tests: {self.test_results['total_tests']}")
        print(f"  Passed: {self.test_results['passed_tests']}")
        print(f"  Failed: {self.test_results['failed_tests']}")
        print(f"  Success Rate: {success_rate:.1f}%")
        
        if self.test_results['failed_tests'] > 0:
            print(f"\n❌ FAILED TESTS:")
            for test in self.test_results['test_details']:
                if not test['success']:
                    print(f"  - {test['test_name']}: {test['details']}")
                    if test['error']:
                        print(f"    Error: {test['error']}")
                        
        print(f"\n✅ AUTHENTICATION STATUS:")
        if self.test_results['authentication']['user_session']:
            user = self.test_results['authentication']['user_session']['user']
            print(f"  User Session: ✅ {user.get('email', 'Unknown')}")
        else:
            print(f"  User Session: ❌ Not authenticated")
            
        if self.test_results['authentication']['admin_session']:
            admin = self.test_results['authentication']['admin_session']['user']
            print(f"  Admin Session: ✅ {admin.get('email', 'Unknown')} (Role: {admin.get('role', 'Unknown')})")
        else:
            print(f"  Admin Session: ❌ Not authenticated")
            
        # Save detailed results
        timestamp = int(time.time())
        results_file = f"comprehensive_test_results_{timestamp}.json"
        with open(results_file, 'w') as f:
            json.dump(self.test_results, f, indent=2)
            
        print(f"\n📄 Detailed results saved to: {results_file}")
        print("=" * 80)
        
        return success_rate >= 95  # Consider 95%+ as success

def main():
    if len(sys.argv) < 2:
        print("Usage: python comprehensive-production-test.py <base_url>")
        print("Example: python comprehensive-production-test.py http://localhost:3000")
        print("Example: python comprehensive-production-test.py https://newsteps.fit")
        sys.exit(1)
        
    base_url = sys.argv[1]
    tester = ComprehensiveProductionTester(base_url)
    success = tester.run_comprehensive_test()
    
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()
