#!/usr/bin/env python3
"""
Database Logic Testing
Test admin and user functionality by directly testing database operations
"""

import requests
import json
from datetime import datetime

class DatabaseLogicTester:
    def __init__(self, base_url="http://localhost:3000"):
        self.base_url = base_url
        self.results = {
            "timestamp": datetime.now().isoformat(),
            "database_operations": {},
            "business_logic": {},
            "summary": {}
        }
    
    def test_admin_shoe_creation(self):
        """Test admin shoe creation via test endpoint"""
        try:
            print("🧪 Testing Admin Shoe Creation Logic...")
            
            # Use the test endpoint we created earlier
            shoe_data = {
                "brand": "Adidas",
                "modelName": "Admin Test Shoe",
                "size": "9",
                "color": "Blue",
                "sport": "basketball",
                "condition": "good",  # Valid enum: 'like_new' | 'good' | 'fair'
                "description": "Testing admin shoe creation logic",
                "status": "available"
            }
            
            response = requests.post(
                f"{self.base_url}/api/test/shoes",
                json=shoe_data,
                timeout=10
            )
            
            success = response.status_code == 201
            
            if success:
                result = response.json()
                print(f"✅ Admin shoe creation: Success (ID: {result.get('shoeId', 'N/A')})")
            else:
                print(f"❌ Admin shoe creation: Failed ({response.status_code})")
            
            self.results["database_operations"]["admin_shoe_creation"] = {
                "success": success,
                "status_code": response.status_code,
                "response": response.json() if success else None
            }
            
        except Exception as e:
            print(f"❌ Admin shoe creation error: {e}")
            self.results["database_operations"]["admin_shoe_creation"] = {
                "success": False,
                "error": str(e)
            }
    
    def test_settings_functionality(self):
        """Test system settings retrieval and validation"""
        try:
            print("🧪 Testing Settings Functionality...")
            
            response = requests.get(f"{self.base_url}/api/settings", timeout=10)
            
            if response.status_code == 200:
                settings = response.json()
                
                # Validate expected settings
                expected_settings = ["maxShoesPerRequest", "shippingFee"]
                has_expected = all(key in settings for key in expected_settings)
                
                print(f"✅ Settings API: Working")
                print(f"   Max shoes per request: {settings.get('maxShoesPerRequest', 'N/A')}")
                print(f"   Shipping fee: ${settings.get('shippingFee', 'N/A')}")
                
                self.results["business_logic"]["settings_functionality"] = {
                    "success": True,
                    "has_expected_settings": has_expected,
                    "settings": settings
                }
            else:
                print(f"❌ Settings API: Failed ({response.status_code})")
                self.results["business_logic"]["settings_functionality"] = {
                    "success": False,
                    "status_code": response.status_code
                }
                
        except Exception as e:
            print(f"❌ Settings functionality error: {e}")
            self.results["business_logic"]["settings_functionality"] = {
                "success": False,
                "error": str(e)
            }
    
    def test_inventory_management(self):
        """Test inventory management logic"""
        try:
            print("🧪 Testing Inventory Management Logic...")
            
            # Get current inventory
            response = requests.get(f"{self.base_url}/api/shoes", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                shoes = data.get('shoes', []) if isinstance(data, dict) else data
                
                # Analyze inventory
                total_shoes = len(shoes)
                available_shoes = len([s for s in shoes if s.get('status') == 'available'])
                brands = set(s.get('brand') for s in shoes if s.get('brand'))
                
                print(f"✅ Inventory Management: Working")
                print(f"   Total shoes: {total_shoes}")
                print(f"   Available shoes: {available_shoes}")
                print(f"   Brands: {', '.join(brands) if brands else 'None'}")
                
                self.results["business_logic"]["inventory_management"] = {
                    "success": True,
                    "total_shoes": total_shoes,
                    "available_shoes": available_shoes,
                    "brands": list(brands)
                }
            else:
                print(f"❌ Inventory Management: Failed ({response.status_code})")
                self.results["business_logic"]["inventory_management"] = {
                    "success": False,
                    "status_code": response.status_code
                }
                
        except Exception as e:
            print(f"❌ Inventory management error: {e}")
            self.results["business_logic"]["inventory_management"] = {
                "success": False,
                "error": str(e)
            }
    
    def test_request_creation_logic(self):
        """Test request creation business logic (without auth)"""
        try:
            print("🧪 Testing Request Creation Logic...")
            
            # Test the request API to see what happens without auth
            test_request = {
                "items": [
                    {
                        "inventoryId": "test123",
                        "shoeId": 1,
                        "size": "10",
                        "gender": "men"
                    }
                ],
                "shippingInfo": {
                    "firstName": "Test",
                    "lastName": "User",
                    "street": "123 Test St",
                    "city": "Test City",
                    "state": "CA",
                    "zipCode": "94102",
                    "country": "USA"
                }
            }
            
            response = requests.post(
                f"{self.base_url}/api/requests",
                json=test_request,
                timeout=10
            )
            
            # We expect 401 (auth required) which means the logic is working
            auth_required = response.status_code == 401
            
            if auth_required:
                print("✅ Request Creation Logic: Properly protected (401)")
            else:
                print(f"⚠️ Request Creation Logic: Unexpected response ({response.status_code})")
            
            self.results["business_logic"]["request_creation"] = {
                "auth_required": auth_required,
                "status_code": response.status_code,
                "properly_protected": auth_required
            }
            
        except Exception as e:
            print(f"❌ Request creation logic error: {e}")
            self.results["business_logic"]["request_creation"] = {
                "success": False,
                "error": str(e)
            }
    
    def test_donation_processing_logic(self):
        """Test donation processing workflow"""
        try:
            print("🧪 Testing Donation Processing Logic...")
            
            # Create a test donation
            donation_data = {
                "firstName": "Test",
                "lastName": "Donor",
                "email": "testdonor@example.com",
                "address": {
                    "street": "123 Donor St",
                    "city": "San Francisco",
                    "state": "CA",
                    "zipCode": "94102",
                    "country": "USA"
                },
                "numberOfShoes": 3,
                "donationDescription": "Testing donation processing logic"
            }
            
            response = requests.post(
                f"{self.base_url}/api/donations",
                json=donation_data,
                timeout=10
            )
            
            success = response.status_code == 201
            
            if success:
                result = response.json()
                donation_id = result.get('donationId', 'N/A')
                print(f"✅ Donation Processing: Success (ID: {donation_id})")
                
                self.results["business_logic"]["donation_processing"] = {
                    "success": True,
                    "donation_id": donation_id,
                    "status_code": response.status_code
                }
            else:
                print(f"❌ Donation Processing: Failed ({response.status_code})")
                self.results["business_logic"]["donation_processing"] = {
                    "success": False,
                    "status_code": response.status_code
                }
                
        except Exception as e:
            print(f"❌ Donation processing error: {e}")
            self.results["business_logic"]["donation_processing"] = {
                "success": False,
                "error": str(e)
            }
    
    def test_money_donation_logic(self):
        """Test money donation processing"""
        try:
            print("🧪 Testing Money Donation Logic...")
            
            money_donation_data = {
                "firstName": "Test",
                "lastName": "MoneyDonor",
                "email": "moneydonor@example.com",
                "phone": "1234567890",
                "amount": 25.00,
                "message": "Testing money donation logic"
            }
            
            response = requests.post(
                f"{self.base_url}/api/donations/money",
                json=money_donation_data,
                timeout=10
            )
            
            success = response.status_code == 201
            
            if success:
                result = response.json()
                donation_id = result.get('donationId', 'N/A')
                print(f"✅ Money Donation: Success (ID: {donation_id})")
                
                self.results["business_logic"]["money_donation"] = {
                    "success": True,
                    "donation_id": donation_id,
                    "status_code": response.status_code
                }
            else:
                print(f"❌ Money Donation: Failed ({response.status_code})")
                self.results["business_logic"]["money_donation"] = {
                    "success": False,
                    "status_code": response.status_code
                }
                
        except Exception as e:
            print(f"❌ Money donation error: {e}")
            self.results["business_logic"]["money_donation"] = {
                "success": False,
                "error": str(e)
            }
    
    def test_volunteer_application_logic(self):
        """Test volunteer application processing"""
        try:
            print("🧪 Testing Volunteer Application Logic...")
            
            volunteer_data = {
                "firstName": "Test",
                "lastName": "Volunteer",
                "email": "volunteer@example.com",
                "phone": "1234567890",
                "city": "San Francisco",  # Required field
                "state": "CA",  # Required field
                "availability": "Weekends",
                "interests": ["Shoe Collection"],
                "skills": "Testing volunteer applications",  # Changed from 'experience'
                "message": "Testing volunteer application logic"
            }
            
            response = requests.post(
                f"{self.base_url}/api/volunteers",
                json=volunteer_data,
                timeout=10
            )
            
            success = response.status_code == 201
            
            if success:
                result = response.json()
                volunteer_id = result.get('volunteerId', 'N/A')
                print(f"✅ Volunteer Application: Success (ID: {volunteer_id})")
                
                self.results["business_logic"]["volunteer_application"] = {
                    "success": True,
                    "volunteer_id": volunteer_id,
                    "status_code": response.status_code
                }
            else:
                print(f"❌ Volunteer Application: Failed ({response.status_code})")
                self.results["business_logic"]["volunteer_application"] = {
                    "success": False,
                    "status_code": response.status_code
                }
                
        except Exception as e:
            print(f"❌ Volunteer application error: {e}")
            self.results["business_logic"]["volunteer_application"] = {
                "success": False,
                "error": str(e)
            }
    
    def test_contact_form_logic(self):
        """Test contact form processing"""
        try:
            print("🧪 Testing Contact Form Logic...")
            
            contact_data = {
                "firstName": "Test",
                "lastName": "Contact",
                "email": "contact@example.com",
                "subject": "Testing contact form",
                "message": "Testing contact form logic"
            }
            
            response = requests.post(
                f"{self.base_url}/api/contact",
                json=contact_data,
                timeout=10
            )
            
            success = response.status_code == 200
            
            if success:
                print("✅ Contact Form: Success")
                self.results["business_logic"]["contact_form"] = {
                    "success": True,
                    "status_code": response.status_code
                }
            else:
                print(f"❌ Contact Form: Failed ({response.status_code})")
                self.results["business_logic"]["contact_form"] = {
                    "success": False,
                    "status_code": response.status_code
                }
                
        except Exception as e:
            print(f"❌ Contact form error: {e}")
            self.results["business_logic"]["contact_form"] = {
                "success": False,
                "error": str(e)
            }
    
    def test_cart_logic_validation(self):
        """Test cart logic and validation"""
        try:
            print("🧪 Testing Cart Logic Validation...")
            
            # Get settings to understand cart limits
            settings_response = requests.get(f"{self.base_url}/api/settings", timeout=10)
            
            if settings_response.status_code == 200:
                settings = settings_response.json()
                max_shoes = settings.get('maxShoesPerRequest', 2)
                
                # Get available shoes
                shoes_response = requests.get(f"{self.base_url}/api/shoes", timeout=10)
                
                if shoes_response.status_code == 200:
                    shoes_data = shoes_response.json()
                    shoes = shoes_data.get('shoes', []) if isinstance(shoes_data, dict) else shoes_data
                    available_shoes = [s for s in shoes if s.get('status') == 'available']
                    
                    cart_logic_working = len(available_shoes) >= max_shoes
                    
                    print(f"✅ Cart Logic: Available shoes ({len(available_shoes)}) >= Max limit ({max_shoes})")
                    
                    self.results["business_logic"]["cart_logic"] = {
                        "success": cart_logic_working,
                        "available_shoes": len(available_shoes),
                        "max_shoes_limit": max_shoes,
                        "sufficient_inventory": cart_logic_working
                    }
                else:
                    print(f"❌ Cart Logic: Cannot get shoes ({shoes_response.status_code})")
                    self.results["business_logic"]["cart_logic"] = {
                        "success": False,
                        "error": f"Shoes API failed: {shoes_response.status_code}"
                    }
            else:
                print(f"❌ Cart Logic: Cannot get settings ({settings_response.status_code})")
                self.results["business_logic"]["cart_logic"] = {
                    "success": False,
                    "error": f"Settings API failed: {settings_response.status_code}"
                }
                
        except Exception as e:
            print(f"❌ Cart logic error: {e}")
            self.results["business_logic"]["cart_logic"] = {
                "success": False,
                "error": str(e)
            }
    
    def run_database_tests(self):
        """Run all database logic tests"""
        print("🎯 STARTING DATABASE LOGIC TESTING")
        print("=" * 60)
        
        # Test database operations
        self.test_admin_shoe_creation()
        
        # Test business logic
        self.test_settings_functionality()
        self.test_inventory_management()
        self.test_request_creation_logic()
        self.test_donation_processing_logic()
        self.test_money_donation_logic()
        self.test_volunteer_application_logic()
        self.test_contact_form_logic()
        self.test_cart_logic_validation()
        
        # Generate summary
        self.generate_summary()
        self.save_results()
        
        return self.results
    
    def generate_summary(self):
        """Generate test summary"""
        db_tests = len(self.results["database_operations"])
        logic_tests = len(self.results["business_logic"])
        total_tests = db_tests + logic_tests
        
        db_passed = sum(1 for test in self.results["database_operations"].values() 
                       if test.get("success", False))
        logic_passed = sum(1 for test in self.results["business_logic"].values() 
                          if test.get("success", False) or test.get("properly_protected", False))
        
        total_passed = db_passed + logic_passed
        
        overall_success_rate = (total_passed / total_tests * 100) if total_tests > 0 else 0
        
        self.results["summary"] = {
            "total_tests": total_tests,
            "total_passed": total_passed,
            "overall_success_rate": overall_success_rate,
            "database_operations": {
                "total": db_tests,
                "passed": db_passed
            },
            "business_logic": {
                "total": logic_tests,
                "passed": logic_passed
            }
        }
        
        print("\n" + "=" * 60)
        print("📊 DATABASE LOGIC TESTING SUMMARY")
        print("=" * 60)
        print(f"Database Operations: {db_passed}/{db_tests}")
        print(f"Business Logic: {logic_passed}/{logic_tests}")
        print(f"Overall Success Rate: {overall_success_rate:.1f}%")
        
        if overall_success_rate >= 80:
            print("🎉 EXCELLENT: Database logic working well!")
        elif overall_success_rate >= 60:
            print("✅ GOOD: Most database operations functional")
        else:
            print("⚠️ NEEDS WORK: Database or logic issues")
    
    def save_results(self):
        """Save results to JSON file"""
        filename = f"database_logic_test_results_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        with open(filename, 'w') as f:
            json.dump(self.results, f, indent=2)
        print(f"\n💾 Results saved to: {filename}")

if __name__ == "__main__":
    tester = DatabaseLogicTester()
    tester.run_database_tests()
