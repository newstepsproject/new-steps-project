#!/usr/bin/env python3
# test-production-health.py - Layer 4: Production Validation & Monitoring

import requests
import json
import time
from datetime import datetime
import statistics

class ProductionValidator:
    def __init__(self, base_url="https://newsteps.fit"):
        self.base_url = base_url
        
    def comprehensive_health_check(self):
        """Comprehensive production health validation"""
        print("🔍 LAYER 4: PRODUCTION HEALTH VALIDATION")
        print("========================================")
        
        checks = [
            ("Core Pages", self.check_core_pages),
            ("API Endpoints", self.check_api_endpoints),
            ("Database Connectivity", self.check_database_connectivity),
            ("Cache Behavior", self.check_cache_behavior),
            ("Admin Security", self.check_admin_functionality),
            ("User Workflows", self.check_user_workflows),
            ("Performance", self.check_performance)
        ]
        
        results = {}
        
        for check_name, check_func in checks:
            try:
                print(f"\n🔍 Running {check_name}...")
                result = check_func()
                results[check_name] = result
                
                success = result.get('success', False)
                icon = "✅" if success else "❌"
                print(f"   {icon} {check_name}: {'PASSED' if success else 'FAILED'}")
                
                # Show additional details for failures
                if not success and 'error' in result:
                    print(f"      Error: {result['error']}")
                    
            except Exception as e:
                results[check_name] = {"success": False, "error": str(e)}
                print(f"   ❌ {check_name} failed: {e}")
        
        return results
        
    def check_core_pages(self):
        """Check all core pages load correctly"""
        pages = {
            "Homepage": "/",
            "About": "/about", 
            "Shoes": "/shoes",
            "Contact": "/contact",
            "Donate": "/donate/shoes",
            "Login": "/login"
        }
        
        results = {}
        all_success = True
        
        for name, path in pages.items():
            try:
                start_time = time.time()
                response = requests.get(f"{self.base_url}{path}", timeout=15)
                load_time = time.time() - start_time
                
                success = response.status_code == 200
                results[name] = {
                    "status": response.status_code,
                    "success": success,
                    "load_time": round(load_time, 2),
                    "size": len(response.text) if success else 0
                }
                
                if success:
                    print(f"      ✅ {name}: {response.status_code} ({load_time:.2f}s)")
                else:
                    print(f"      ❌ {name}: {response.status_code}")
                    all_success = False
                    
            except Exception as e:
                results[name] = {"success": False, "error": str(e)}
                print(f"      ❌ {name}: {e}")
                all_success = False
        
        return {"success": all_success, "pages": results}
        
    def check_api_endpoints(self):
        """Check critical API endpoints"""
        endpoints = {
            "Health": "/api/health",
            "Shoes": "/api/shoes", 
            "Settings": "/api/settings",
            "Database Health": "/api/health/database"
        }
        
        results = {}
        all_success = True
        
        for name, path in endpoints.items():
            try:
                response = requests.get(f"{self.base_url}{path}", timeout=10)
                success = response.status_code == 200
                
                # Validate response content for specific endpoints
                content_valid = True
                if success:
                    try:
                        if name == "Settings":
                            data = response.json()
                            required_fields = ["projectEmail", "shippingFee", "maxShoesPerRequest"]
                            content_valid = all(field in data for field in required_fields)
                        elif name == "Shoes":
                            data = response.json()
                            content_valid = "shoes" in data and isinstance(data["shoes"], list)
                    except:
                        content_valid = False
                
                final_success = success and content_valid
                results[name] = {
                    "status": response.status_code,
                    "success": final_success,
                    "content_valid": content_valid
                }
                
                if final_success:
                    print(f"      ✅ {name}: {response.status_code}")
                else:
                    print(f"      ❌ {name}: {response.status_code} (content: {content_valid})")
                    all_success = False
                    
            except Exception as e:
                results[name] = {"success": False, "error": str(e)}
                print(f"      ❌ {name}: {e}")
                all_success = False
        
        return {"success": all_success, "endpoints": results}
        
    def check_database_connectivity(self):
        """Check database connectivity through API"""
        try:
            # Test database through multiple endpoints
            endpoints = [
                ("/api/shoes", "shoes"),
                ("/api/health/database", "health")
            ]
            
            all_success = True
            results = {}
            
            for endpoint, name in endpoints:
                try:
                    response = requests.get(f"{self.base_url}{endpoint}", timeout=10)
                    success = response.status_code == 200
                    
                    if success and name == "shoes":
                        data = response.json()
                        shoe_count = len(data.get("shoes", []))
                        results[name] = {
                            "success": True,
                            "shoe_count": shoe_count,
                            "has_data": shoe_count > 0
                        }
                        print(f"      ✅ Database has {shoe_count} shoes")
                    else:
                        results[name] = {"success": success, "status": response.status_code}
                        if success:
                            print(f"      ✅ Database {name} check passed")
                        else:
                            print(f"      ❌ Database {name} check failed: {response.status_code}")
                            all_success = False
                            
                except Exception as e:
                    results[name] = {"success": False, "error": str(e)}
                    all_success = False
            
            return {"success": all_success, "tests": results}
            
        except Exception as e:
            return {"success": False, "error": str(e)}
            
    def check_cache_behavior(self):
        """Check cache behavior and consistency"""
        try:
            print(f"      🔄 Testing cache consistency...")
            
            # Make multiple requests to about page to test cache
            responses = []
            for i in range(3):
                start_time = time.time()
                resp = requests.get(f"{self.base_url}/about", timeout=10)
                load_time = time.time() - start_time
                
                responses.append({
                    "status": resp.status_code,
                    "timeline_count": resp.text.count("The Beginning (2023)"),
                    "load_time": round(load_time, 2),
                    "size": len(resp.text),
                    "has_dynamic_markers": "__NEXT_DATA__" in resp.text
                })
                time.sleep(1)
            
            # Check consistency
            statuses = [r["status"] for r in responses]
            timeline_counts = [r["timeline_count"] for r in responses]
            sizes = [r["size"] for r in responses]
            
            status_consistent = all(s == 200 for s in statuses)
            content_consistent = all(count == timeline_counts[0] for count in timeline_counts)
            size_consistent = all(abs(s - sizes[0]) < 100 for s in sizes)  # Allow small variations
            
            avg_load_time = statistics.mean([r["load_time"] for r in responses])
            has_dynamic_content = any(r["has_dynamic_markers"] for r in responses)
            
            overall_success = status_consistent and content_consistent and size_consistent
            
            print(f"      📊 Avg load time: {avg_load_time:.2f}s")
            print(f"      📊 Content consistent: {content_consistent}")
            print(f"      📊 Dynamic rendering: {has_dynamic_content}")
            
            return {
                "success": overall_success,
                "status_consistent": status_consistent,
                "content_consistent": content_consistent,
                "size_consistent": size_consistent,
                "avg_load_time": avg_load_time,
                "has_dynamic_content": has_dynamic_content,
                "responses": responses
            }
            
        except Exception as e:
            return {"success": False, "error": str(e)}
            
    def check_admin_functionality(self):
        """Check admin endpoints are properly protected"""
        admin_endpoints = [
            "/api/admin/settings",
            "/api/admin/shoes",
            "/api/admin/users",
            "/admin",
            "/admin/settings"
        ]
        
        results = {}
        all_protected = True
        
        for endpoint in admin_endpoints:
            try:
                response = requests.get(f"{self.base_url}{endpoint}", timeout=10, allow_redirects=False)
                
                # Admin endpoints should return 401 (unauthorized), 307 (redirect), or 403 (forbidden)
                protected = response.status_code in [401, 403, 307]
                
                results[endpoint] = {
                    "status": response.status_code,
                    "protected": protected
                }
                
                if protected:
                    print(f"      ✅ {endpoint}: Protected ({response.status_code})")
                else:
                    print(f"      ❌ {endpoint}: Not protected ({response.status_code})")
                    all_protected = False
                    
            except Exception as e:
                results[endpoint] = {"error": str(e), "protected": False}
                print(f"      ❌ {endpoint}: Error - {e}")
                all_protected = False
        
        return {"success": all_protected, "endpoints": results}
        
    def check_user_workflows(self):
        """Check critical user workflows work end-to-end"""
        try:
            workflows = {}
            
            # 1. Shoe browsing workflow
            print(f"      👟 Testing shoe browsing workflow...")
            shoes_response = requests.get(f"{self.base_url}/shoes", timeout=10)
            shoes_page_works = shoes_response.status_code == 200
            workflows["shoes_browsing"] = shoes_page_works
            
            # 2. Individual shoe access
            print(f"      🔍 Testing individual shoe access...")
            api_response = requests.get(f"{self.base_url}/api/shoes", timeout=10)
            individual_shoe_works = True
            
            if api_response.status_code == 200:
                shoes_data = api_response.json()
                if shoes_data.get("shoes") and len(shoes_data["shoes"]) > 0:
                    first_shoe_id = shoes_data["shoes"][0].get("shoeId")
                    shoe_response = requests.get(f"{self.base_url}/shoes/{first_shoe_id}", timeout=10)
                    individual_shoe_works = shoe_response.status_code == 200
                    
                    if individual_shoe_works:
                        print(f"         ✅ Individual shoe page works (ID: {first_shoe_id})")
                    else:
                        print(f"         ❌ Individual shoe page failed: {shoe_response.status_code}")
                else:
                    print(f"         ⚠️  No shoes in inventory to test individual access")
            
            workflows["individual_shoe"] = individual_shoe_works
            
            # 3. Contact form workflow
            print(f"      📧 Testing contact form access...")
            contact_response = requests.get(f"{self.base_url}/contact", timeout=10)
            contact_works = contact_response.status_code == 200
            workflows["contact_form"] = contact_works
            
            # 4. Donation form workflow
            print(f"      💝 Testing donation form access...")
            donate_response = requests.get(f"{self.base_url}/donate/shoes", timeout=10)
            donate_works = donate_response.status_code == 200
            workflows["donation_form"] = donate_works
            
            all_workflows_work = all(workflows.values())
            
            return {
                "success": all_workflows_work,
                "workflows": workflows
            }
            
        except Exception as e:
            return {"success": False, "error": str(e)}
            
    def check_performance(self):
        """Check basic performance metrics"""
        try:
            print(f"      ⚡ Testing performance...")
            
            # Test key pages for performance
            pages = ["/", "/about", "/shoes"]
            performance_results = {}
            
            for page in pages:
                times = []
                for i in range(3):  # 3 requests per page
                    start_time = time.time()
                    response = requests.get(f"{self.base_url}{page}", timeout=15)
                    end_time = time.time()
                    
                    if response.status_code == 200:
                        load_time = end_time - start_time
                        times.append(load_time)
                
                if times:
                    avg_time = statistics.mean(times)
                    performance_results[page] = {
                        "avg_time": round(avg_time, 2),
                        "times": [round(t, 2) for t in times],
                        "acceptable": avg_time < 5.0  # 5 second threshold
                    }
                    
                    status = "✅" if avg_time < 5.0 else "⚠️"
                    print(f"         {status} {page}: {avg_time:.2f}s avg")
            
            # Overall performance assessment
            all_acceptable = all(result.get("acceptable", False) for result in performance_results.values())
            
            return {
                "success": all_acceptable,
                "pages": performance_results
            }
            
        except Exception as e:
            return {"success": False, "error": str(e)}

if __name__ == "__main__":
    print(f"🚀 Starting production health validation at {datetime.now()}")
    print(f"🌐 Target: https://newsteps.fit")
    
    validator = ProductionValidator()
    results = validator.comprehensive_health_check()
    
    # Calculate overall health score
    total_checks = len(results)
    successful_checks = sum(1 for r in results.values() if r.get("success", False))
    success_rate = (successful_checks / total_checks) * 100
    
    print(f"\n📊 PRODUCTION HEALTH SUMMARY")
    print(f"============================")
    print(f"Total checks: {total_checks}")
    print(f"Successful: {successful_checks}")
    print(f"Success rate: {success_rate:.1f}%")
    
    # Determine overall status
    if success_rate >= 95:
        status = "🎉 EXCELLENT"
        color = "green"
    elif success_rate >= 85:
        status = "✅ HEALTHY"
        color = "green"
    elif success_rate >= 70:
        status = "⚠️  NEEDS ATTENTION"
        color = "yellow"
    else:
        status = "❌ CRITICAL ISSUES"
        color = "red"
    
    print(f"Overall status: {status}")
    
    # Show failed checks
    failed_checks = [name for name, result in results.items() if not result.get("success", False)]
    if failed_checks:
        print(f"\n❌ Failed checks:")
        for check in failed_checks:
            error = results[check].get("error", "Unknown error")
            print(f"   - {check}: {error}")
    
    # Save detailed results with timestamp
    timestamp = int(time.time())
    filename = f"production-health-{timestamp}.json"
    
    with open(filename, "w") as f:
        json.dump({
            "timestamp": datetime.now().isoformat(),
            "success_rate": success_rate,
            "overall_status": status,
            "results": results
        }, f, indent=2, default=str)
    
    print(f"\n📄 Detailed results saved to: {filename}")
    
    # Exit with appropriate code
    if success_rate >= 85:
        print("🎉 PRODUCTION VALIDATION PASSED")
        exit(0)
    else:
        print("❌ PRODUCTION VALIDATION FAILED")
        exit(1)
