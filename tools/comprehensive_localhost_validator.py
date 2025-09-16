#!/usr/bin/env python3
"""
Comprehensive Localhost Validator
Tests all critical functionality on localhost before deployment
"""

import requests
import json
import time
from typing import Dict, List, Any

class LocalhostValidator:
    def __init__(self, base_url: str = "http://localhost:3000"):
        self.base_url = base_url
        self.results = []
        self.session = requests.Session()
        
    def run_comprehensive_validation(self):
        """Run all validation tests"""
        print("🧪 COMPREHENSIVE LOCALHOST VALIDATION")
        print("=" * 50)
        
        # Test 1: Basic connectivity and page loads
        print("🌐 Testing basic connectivity...")
        self.test_page_loads()
        
        # Test 2: API endpoint functionality
        print("🔌 Testing API endpoints...")
        self.test_api_endpoints()
        
        # Test 3: Form submissions
        print("📝 Testing form submissions...")
        self.test_form_submissions()
        
        # Test 4: Data consistency
        print("🔄 Testing data consistency...")
        self.test_data_consistency()
        
        # Test 5: Email system
        print("📧 Testing email system...")
        self.test_email_system()
        
        # Generate final report
        self.generate_final_report()
    
    def test_page_loads(self):
        """Test that all critical pages load successfully"""
        pages = [
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
            "/cart",
            "/checkout"
        ]
        
        page_results = []
        for page in pages:
            try:
                response = self.session.get(f"{self.base_url}{page}", timeout=10)
                status = "PASS" if response.status_code == 200 else "FAIL"
                page_results.append({
                    "page": page,
                    "status_code": response.status_code,
                    "status": status,
                    "response_time": response.elapsed.total_seconds()
                })
                print(f"  {status} {page} ({response.status_code})")
            except Exception as e:
                page_results.append({
                    "page": page,
                    "status": "ERROR",
                    "error": str(e)
                })
                print(f"  ERROR {page}: {e}")
        
        self.results.append({
            "test": "page_loads",
            "results": page_results,
            "summary": {
                "total": len(pages),
                "passed": len([r for r in page_results if r.get("status") == "PASS"]),
                "failed": len([r for r in page_results if r.get("status") != "PASS"])
            }
        })
    
    def test_api_endpoints(self):
        """Test critical API endpoints"""
        api_tests = [
            # Public APIs
            {"method": "GET", "url": "/api/health", "expected": 200},
            {"method": "GET", "url": "/api/shoes", "expected": 200},
            {"method": "GET", "url": "/api/settings", "expected": 200},
            
            # Contact form
            {"method": "POST", "url": "/api/contact", "data": {
                "firstName": "Test",
                "lastName": "User", 
                "email": "test@example.com",
                "subject": "Test Subject",
                "message": "Test message"
            }, "expected": 200},
            
            # Volunteer form
            {"method": "POST", "url": "/api/volunteer", "data": {
                "firstName": "Test",
                "lastName": "Volunteer",
                "email": "volunteer@example.com",
                "phone": "1234567890",
                "city": "Test City",
                "state": "CA",
                "availability": "weekends",
                "interests": ["mentoring"]
            }, "expected": 201},
            
            # Partnership form
            {"method": "POST", "url": "/api/partnerships", "data": {
                "firstName": "Test",
                "lastName": "Partner",
                "email": "partner@example.com",
                "organizationName": "Test Org",
                "organizationType": "business",
                "partnershipInterest": "financial_support",
                "message": "Test partnership inquiry"
            }, "expected": 201},
            
            # Money donation
            {"method": "POST", "url": "/api/donations/money", "data": {
                "firstName": "Test",
                "lastName": "Donor",
                "email": "donor@example.com",
                "phone": "1234567890",
                "amount": 25.00,
                "donationMethod": "check",
                "checkNumber": "12345"
            }, "expected": 201},
            
            # Shoe donation (with proper structure)
            {"method": "POST", "url": "/api/donations", "data": {
                "donationType": "shoes",
                "numberOfShoes": 1,
                "donationDescription": "Test shoe donation - various athletic shoes",
                "firstName": "Test",
                "lastName": "ShoedonorDonor",
                "email": "shoedonor@example.com",
                "phone": "1234567890",
                "address": {
                    "street": "123 Test St",
                    "city": "Test City", 
                    "state": "CA",
                    "zipCode": "12345",
                    "country": "USA"
                },
                "pickupMethod": "drop_off",
                "notes": "Test donation"
            }, "expected": 201}
        ]
        
        api_results = []
        for test in api_tests:
            try:
                if test["method"] == "GET":
                    response = self.session.get(f"{self.base_url}{test['url']}", timeout=10)
                elif test["method"] == "POST":
                    response = self.session.post(
                        f"{self.base_url}{test['url']}", 
                        json=test["data"],
                        headers={"Content-Type": "application/json"},
                        timeout=10
                    )
                
                status = "PASS" if response.status_code == test["expected"] else "FAIL"
                api_results.append({
                    "method": test["method"],
                    "url": test["url"],
                    "expected": test["expected"],
                    "actual": response.status_code,
                    "status": status,
                    "response_time": response.elapsed.total_seconds()
                })
                
                print(f"  {status} {test['method']} {test['url']} ({response.status_code})")
                
                if status == "FAIL":
                    print(f"    Expected: {test['expected']}, Got: {response.status_code}")
                    try:
                        error_data = response.json()
                        print(f"    Error: {error_data}")
                    except:
                        print(f"    Response: {response.text[:200]}")
                
            except Exception as e:
                api_results.append({
                    "method": test["method"],
                    "url": test["url"],
                    "status": "ERROR",
                    "error": str(e)
                })
                print(f"  ERROR {test['method']} {test['url']}: {e}")
        
        self.results.append({
            "test": "api_endpoints",
            "results": api_results,
            "summary": {
                "total": len(api_tests),
                "passed": len([r for r in api_results if r.get("status") == "PASS"]),
                "failed": len([r for r in api_results if r.get("status") != "PASS"])
            }
        })
    
    def test_form_submissions(self):
        """Test form submission workflows"""
        print("  Testing registration form...")
        
        # Test user registration
        reg_data = {
            "firstName": "Test",
            "lastName": "FormUser",
            "email": f"formtest{int(time.time())}@example.com",
            "password": "TestPassword123!"
        }
        
        try:
            response = self.session.post(
                f"{self.base_url}/api/auth/register",
                json=reg_data,
                headers={"Content-Type": "application/json"},
                timeout=10
            )
            
            reg_status = "PASS" if response.status_code == 201 else "FAIL"
            print(f"    {reg_status} User registration ({response.status_code})")
            
            if reg_status == "FAIL":
                print(f"      Error: {response.text}")
            
        except Exception as e:
            reg_status = "ERROR"
            print(f"    ERROR User registration: {e}")
        
        self.results.append({
            "test": "form_submissions",
            "registration_status": reg_status
        })
    
    def test_data_consistency(self):
        """Test data consistency across the application"""
        print("  Testing user data APIs...")
        
        # Create a test user first
        test_user = {
            "firstName": "Data",
            "lastName": "TestUser", 
            "email": f"datatest{int(time.time())}@example.com",
            "password": "TestPassword123!"
        }
        
        try:
            # Register user
            reg_response = self.session.post(
                f"{self.base_url}/api/auth/register",
                json=test_user,
                headers={"Content-Type": "application/json"}
            )
            
            if reg_response.status_code == 201:
                print("    ✅ Test user created")
                
                # Test user-specific APIs (these should require authentication)
                user_apis = [
                    "/api/user/donations",
                    "/api/user/money-donations",
                    "/api/requests"
                ]
                
                for api in user_apis:
                    try:
                        response = self.session.get(f"{self.base_url}{api}")
                        # These should return 401 without authentication
                        expected_status = "PASS" if response.status_code == 401 else "FAIL"
                        print(f"    {expected_status} {api} auth protection ({response.status_code})")
                    except Exception as e:
                        print(f"    ERROR {api}: {e}")
            else:
                print(f"    ❌ Failed to create test user: {reg_response.status_code}")
                
        except Exception as e:
            print(f"    ERROR in data consistency test: {e}")
        
        self.results.append({
            "test": "data_consistency",
            "status": "completed"
        })
    
    def test_email_system(self):
        """Test email system functionality"""
        print("  Testing email endpoints...")
        
        # Test contact form email
        contact_data = {
            "firstName": "Email",
            "lastName": "Tester",
            "email": "emailtest@example.com",
            "subject": "Email System Test",
            "message": "Testing email functionality"
        }
        
        try:
            response = self.session.post(
                f"{self.base_url}/api/contact",
                json=contact_data,
                headers={"Content-Type": "application/json"}
            )
            
            email_status = "PASS" if response.status_code == 200 else "FAIL"
            print(f"    {email_status} Contact form email ({response.status_code})")
            
        except Exception as e:
            print(f"    ERROR Contact form email: {e}")
        
        self.results.append({
            "test": "email_system",
            "status": "completed"
        })
    
    def generate_final_report(self):
        """Generate comprehensive final report"""
        print("\n" + "=" * 60)
        print("📊 COMPREHENSIVE VALIDATION REPORT")
        print("=" * 60)
        
        total_tests = 0
        passed_tests = 0
        failed_tests = 0
        
        for result in self.results:
            if "summary" in result:
                total_tests += result["summary"]["total"]
                passed_tests += result["summary"]["passed"]
                failed_tests += result["summary"]["failed"]
        
        print(f"\n📈 Overall Results:")
        print(f"  Total Tests: {total_tests}")
        print(f"  ✅ Passed: {passed_tests}")
        print(f"  ❌ Failed: {failed_tests}")
        print(f"  📊 Success Rate: {(passed_tests/total_tests*100):.1f}%" if total_tests > 0 else "  📊 Success Rate: N/A")
        
        print(f"\n🔍 Test Breakdown:")
        for result in self.results:
            if "summary" in result:
                test_name = result["test"].replace("_", " ").title()
                summary = result["summary"]
                print(f"  {test_name}: {summary['passed']}/{summary['total']} passed")
        
        print(f"\n🚨 Issues Found:")
        issues_found = False
        for result in self.results:
            if "results" in result:
                failed_items = [r for r in result["results"] if r.get("status") not in ["PASS", "completed"]]
                if failed_items:
                    issues_found = True
                    test_name = result["test"].replace("_", " ").title()
                    print(f"\n  {test_name}:")
                    for item in failed_items:
                        if "url" in item:
                            print(f"    • {item.get('method', 'GET')} {item['url']}: {item.get('status', 'UNKNOWN')}")
                        elif "page" in item:
                            print(f"    • {item['page']}: {item.get('status', 'UNKNOWN')}")
                        
                        if "error" in item:
                            print(f"      Error: {item['error']}")
        
        if not issues_found:
            print("  🎉 No critical issues found!")
        
        # Save detailed report
        with open('comprehensive_validation_report.json', 'w') as f:
            json.dump(self.results, f, indent=2)
        
        print(f"\n💾 Detailed report saved to: comprehensive_validation_report.json")
        
        # Determine overall status
        success_rate = (passed_tests/total_tests*100) if total_tests > 0 else 0
        overall_status = "READY FOR PRODUCTION" if success_rate >= 90 else "NEEDS FIXES"
        
        print(f"\n🎯 OVERALL STATUS: {overall_status}")
        print("=" * 60)

def main():
    validator = LocalhostValidator()
    validator.run_comprehensive_validation()

if __name__ == "__main__":
    main()
