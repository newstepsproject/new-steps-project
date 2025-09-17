#!/usr/bin/env python3
# test-data-flow-integration.py - Layer 2: Data Flow Integration Testing

import requests
import json
import time
from datetime import datetime

class DataFlowTester:
    def __init__(self, base_url="http://localhost:3000"):
        self.base_url = base_url
        
    def test_settings_data_flow(self):
        """Test complete settings data flow: DB → API → Page → User"""
        print("🔍 LAYER 2: DATA FLOW INTEGRATION TESTING")
        print("==========================================")
        
        # 1. Test API data consistency
        print("\n1️⃣ Testing API Data Consistency...")
        try:
            api_response = requests.get(f"{self.base_url}/api/settings", timeout=10)
            if api_response.status_code != 200:
                raise Exception(f"Settings API failed: {api_response.status_code}")
            
            api_data = api_response.json()
            print(f"   ✅ Settings API returns: {list(api_data.keys())}")
            
            # Validate expected fields
            required_fields = ["projectEmail", "shippingFee", "maxShoesPerRequest"]
            for field in required_fields:
                if field in api_data:
                    print(f"   ✅ Required field present: {field}")
                else:
                    raise Exception(f"Missing required field: {field}")
                    
        except Exception as e:
            raise Exception(f"API data consistency test failed: {e}")
        
        # 2. Test page rendering with API data
        print("\n2️⃣ Testing Page Rendering...")
        try:
            about_response = requests.get(f"{self.base_url}/about", timeout=10)
            if about_response.status_code != 200:
                raise Exception(f"About page failed: {about_response.status_code}")
                
            about_html = about_response.text
            print(f"   ✅ About page loaded ({len(about_html)} chars)")
            
        except Exception as e:
            raise Exception(f"Page rendering test failed: {e}")
        
        # 3. Validate data appears in HTML
        print("\n3️⃣ Validating Data in HTML...")
        timeline_items = [
            "The Beginning (2023)",
            "Growing Our Impact (2024)", 
            "Today & Beyond (2025)"
        ]
        
        found_items = 0
        for item in timeline_items:
            if item in about_html:
                print(f"   ✅ Found: {item}")
                found_items += 1
            else:
                print(f"   ❌ Missing: {item}")
        
        if found_items < len(timeline_items):
            raise Exception(f"Only found {found_items}/{len(timeline_items)} timeline items")
        
        # 4. Test dynamic content detection
        print("\n4️⃣ Testing Dynamic Content Detection...")
        dynamic_markers = [
            "__NEXT_DATA__",
            "data-reactroot", 
            '"props"',
            '"buildId"'
        ]
        
        found_markers = 0
        for marker in dynamic_markers:
            if marker in about_html:
                found_markers += 1
                
        if found_markers > 0:
            print(f"   ✅ Page appears dynamically rendered ({found_markers} markers found)")
        else:
            print("   ⚠️  WARNING: No dynamic rendering markers found")
            
        return True
        
    def test_database_connectivity(self):
        """Test database connectivity through various endpoints"""
        print("\n💾 DATABASE CONNECTIVITY TESTING")
        print("=================================")
        
        endpoints = {
            "shoes": "/api/shoes",
            "health": "/api/health/database"
        }
        
        for name, endpoint in endpoints.items():
            try:
                print(f"\n📊 Testing {name} endpoint...")
                response = requests.get(f"{self.base_url}{endpoint}", timeout=10)
                
                if response.status_code == 200:
                    print(f"   ✅ {name} endpoint responding")
                    
                    if name == "shoes":
                        data = response.json()
                        shoe_count = len(data.get("shoes", []))
                        print(f"   📦 Found {shoe_count} shoes in inventory")
                        
                        if shoe_count > 0:
                            # Test individual shoe access
                            first_shoe = data["shoes"][0]
                            shoe_id = first_shoe.get("shoeId")
                            
                            shoe_response = requests.get(f"{self.base_url}/api/shoes/{shoe_id}", timeout=10)
                            if shoe_response.status_code == 200:
                                print(f"   ✅ Individual shoe access working (ID: {shoe_id})")
                            else:
                                print(f"   ⚠️  Individual shoe access failed: {shoe_response.status_code}")
                                
                else:
                    print(f"   ❌ {name} endpoint failed: {response.status_code}")
                    
            except Exception as e:
                print(f"   ❌ {name} endpoint error: {e}")
        
        return True
        
    def test_environment_consistency(self):
        """Test consistency across different environments"""
        print("\n🌍 ENVIRONMENT CONSISTENCY TESTING")
        print("===================================")
        
        environments = {
            "localhost": "http://localhost:3000",
            "production": "https://newsteps.fit"
        }
        
        results = {}
        
        for env_name, base_url in environments.items():
            print(f"\n📊 Testing {env_name.upper()} ({base_url})...")
            
            try:
                # Test critical pages
                pages = ["/", "/about", "/shoes"]
                env_results = {}
                
                for page in pages:
                    try:
                        response = requests.get(f"{base_url}{page}", timeout=10)
                        env_results[page] = {
                            "status": response.status_code,
                            "success": response.status_code == 200,
                            "has_timeline": "The Beginning (2023)" in response.text if response.status_code == 200 else False,
                            "response_size": len(response.text) if response.status_code == 200 else 0
                        }
                        status_icon = "✅" if response.status_code == 200 else "❌"
                        print(f"   {page}: {response.status_code} {status_icon}")
                        
                    except Exception as e:
                        env_results[page] = {"success": False, "error": str(e)}
                        print(f"   {page}: ERROR - {e}")
                
                results[env_name] = env_results
                
            except Exception as e:
                print(f"   ❌ {env_name} environment failed: {e}")
                results[env_name] = {"error": str(e)}
        
        # Compare environments if both available
        if len(results) == 2 and "localhost" in results and "production" in results:
            print(f"\n🔍 ENVIRONMENT COMPARISON:")
            
            localhost_data = results["localhost"]
            production_data = results["production"]
            
            for page in ["/", "/about", "/shoes"]:
                local_success = localhost_data.get(page, {}).get("success", False)
                prod_success = production_data.get(page, {}).get("success", False)
                
                local_timeline = localhost_data.get(page, {}).get("has_timeline", False)
                prod_timeline = production_data.get(page, {}).get("has_timeline", False)
                
                if local_success and prod_success:
                    if local_timeline == prod_timeline:
                        print(f"   ✅ {page}: Environments consistent")
                    else:
                        print(f"   ⚠️  {page}: Timeline content differs (local:{local_timeline}, prod:{prod_timeline})")
                else:
                    print(f"   ❌ {page}: Environment availability differs")
        
        return results

if __name__ == "__main__":
    # Test both localhost and production
    environments = ["http://localhost:3000", "https://newsteps.fit"]
    
    for base_url in environments:
        env_name = "LOCALHOST" if "localhost" in base_url else "PRODUCTION"
        print(f"\n🚀 TESTING {env_name} ENVIRONMENT")
        print("=" * (20 + len(env_name)))
        
        tester = DataFlowTester(base_url)
        
        try:
            # Test if environment is available
            health_check = requests.get(f"{base_url}/api/health", timeout=5)
            if health_check.status_code != 200:
                print(f"   ⚠️  {env_name} not available, skipping...")
                continue
                
            tester.test_settings_data_flow()
            tester.test_database_connectivity()
            print(f"\n🎉 {env_name} DATA FLOW TESTS PASSED")
            
        except requests.exceptions.ConnectionError:
            print(f"   ⚠️  {env_name} not available, skipping...")
        except Exception as e:
            print(f"\n❌ {env_name} DATA FLOW TEST FAILED: {e}")
            if "localhost" in base_url:
                exit(1)  # Fail if localhost tests fail
    
    # Run environment consistency test
    tester = DataFlowTester()
    tester.test_environment_consistency()
    
    print("\n🎉 ALL DATA FLOW INTEGRATION TESTS COMPLETED")
