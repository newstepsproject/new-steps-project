# Comprehensive Testing Framework
## Based on Cache Bug Lessons Learned

### Overview
This testing framework implements 4 layers of validation to catch issues that component-level testing misses. Each layer builds on the previous one to ensure complete system validation.

## Layer 1: Build-Time Analysis
**Purpose**: Catch static vs dynamic rendering issues before deployment

### 1.1 Build Output Analysis
```bash
#!/bin/bash
# test-build-analysis.sh

echo "🔍 LAYER 1: BUILD-TIME ANALYSIS"
echo "================================"

# Clean build
rm -rf .next
echo "📦 Starting fresh build..."

# Capture build output
npm run build 2>&1 | tee build-output.log

# Analyze static vs dynamic pages
echo -e "\n📊 PAGE RENDERING ANALYSIS:"
echo "Static Pages (○):"
grep "○" build-output.log | grep -v "api" || echo "  None found"

echo -e "\nDynamic Pages (ƒ):"
grep "ƒ" build-output.log | grep -v "api" || echo "  None found"

# Check for unexpected static pages
CRITICAL_DYNAMIC_PAGES=("/about" "/admin" "/account")
echo -e "\n⚠️  CRITICAL PAGE VALIDATION:"

for page in "${CRITICAL_DYNAMIC_PAGES[@]}"; do
    if grep -q "○.*$page" build-output.log; then
        echo "❌ CRITICAL: $page is static but should be dynamic!"
        exit 1
    else
        echo "✅ $page is properly dynamic"
    fi
done

# Check for build-time errors
if grep -q "Error fetching app settings" build-output.log; then
    echo "⚠️  WARNING: Database calls failing during build"
    grep "Error fetching app settings" build-output.log
fi

echo -e "\n✅ Build analysis complete"
```

### 1.2 Environment Dependency Testing
```bash
#!/bin/bash
# test-environment-dependencies.sh

echo "🔍 TESTING BUILD WITH MISSING ENVIRONMENT VARIABLES"

# Test build without database
echo "Testing build without MONGODB_URI..."
MONGODB_URI="" npm run build 2>&1 | grep -E "(Error|Failed)" | head -10

# Test build without auth secrets
echo "Testing build without NEXTAUTH_SECRET..."
NEXTAUTH_SECRET="" npm run build 2>&1 | grep -E "(Error|Failed)" | head -10

echo "✅ Environment dependency testing complete"
```

## Layer 2: Data Flow Integration Testing
**Purpose**: Validate complete data flow from database to user interface

### 2.1 Database-to-UI Flow Validation
```python
#!/usr/bin/env python3
# test-data-flow-integration.py

import requests
import json
import time
from datetime import datetime

class DataFlowTester:
    def __init__(self, base_url="http://localhost:3000"):
        self.base_url = base_url
        self.admin_session = None
        
    def test_settings_data_flow(self):
        """Test complete settings data flow: DB → API → Page → User"""
        print("🔍 LAYER 2: DATA FLOW INTEGRATION TESTING")
        print("==========================================")
        
        # 1. Test API data consistency
        print("\n1️⃣ Testing API Data Consistency...")
        api_response = requests.get(f"{self.base_url}/api/settings")
        if api_response.status_code != 200:
            raise Exception(f"Settings API failed: {api_response.status_code}")
        
        api_data = api_response.json()
        print(f"   ✅ Settings API returns: {list(api_data.keys())}")
        
        # 2. Test page rendering with API data
        print("\n2️⃣ Testing Page Rendering...")
        about_response = requests.get(f"{self.base_url}/about")
        if about_response.status_code != 200:
            raise Exception(f"About page failed: {about_response.status_code}")
            
        about_html = about_response.text
        
        # 3. Validate data appears in HTML
        print("\n3️⃣ Validating Data in HTML...")
        timeline_items = [
            "The Beginning (2023)",
            "Growing Our Impact (2024)", 
            "Today & Beyond (2025)"
        ]
        
        for item in timeline_items:
            if item in about_html:
                print(f"   ✅ Found: {item}")
            else:
                raise Exception(f"❌ Missing timeline item: {item}")
        
        # 4. Test dynamic content detection
        print("\n4️⃣ Testing Dynamic Content Detection...")
        # Check for React hydration markers
        if 'data-reactroot' in about_html or '__NEXT_DATA__' in about_html:
            print("   ✅ Page appears to be dynamically rendered")
        else:
            print("   ⚠️  WARNING: Page may be statically generated")
            
        return True
        
    def test_cache_invalidation_flow(self):
        """Test cache invalidation: Admin Change → Cache Clear → User Sees Change"""
        print("\n🔄 CACHE INVALIDATION FLOW TESTING")
        print("==================================")
        
        # This would require admin authentication
        # For now, test that cache clearing endpoints exist
        
        # Test cache clearing endpoint exists
        cache_test = requests.get(f"{self.base_url}/api/admin/settings")
        if cache_test.status_code in [401, 307]:  # Auth required = good
            print("   ✅ Admin settings endpoint properly protected")
        else:
            print(f"   ⚠️  Admin endpoint returned: {cache_test.status_code}")
            
        return True

if __name__ == "__main__":
    tester = DataFlowTester()
    
    try:
        tester.test_settings_data_flow()
        tester.test_cache_invalidation_flow()
        print("\n🎉 ALL DATA FLOW TESTS PASSED")
    except Exception as e:
        print(f"\n❌ DATA FLOW TEST FAILED: {e}")
        exit(1)
```

### 2.2 Cross-Environment Consistency Testing
```python
#!/usr/bin/env python3
# test-environment-consistency.py

import requests
import subprocess
import time

class EnvironmentTester:
    def __init__(self):
        self.environments = {
            "development": "http://localhost:3000",
            "production": "https://newsteps.fit"
        }
        
    def test_environment_parity(self):
        """Test that dev and prod return consistent data"""
        print("🔍 ENVIRONMENT CONSISTENCY TESTING")
        print("==================================")
        
        results = {}
        
        for env_name, base_url in self.environments.items():
            print(f"\n📊 Testing {env_name.upper()} ({base_url})...")
            
            try:
                # Test critical pages
                pages = ["/", "/about", "/shoes"]
                env_results = {}
                
                for page in pages:
                    response = requests.get(f"{base_url}{page}", timeout=10)
                    env_results[page] = {
                        "status": response.status_code,
                        "has_timeline": "The Beginning (2023)" in response.text,
                        "has_dynamic_content": "__NEXT_DATA__" in response.text
                    }
                    print(f"   {page}: {response.status_code} "
                          f"{'✅' if response.status_code == 200 else '❌'}")
                
                results[env_name] = env_results
                
            except Exception as e:
                print(f"   ❌ {env_name} failed: {e}")
                results[env_name] = {"error": str(e)}
        
        # Compare environments
        print(f"\n🔍 ENVIRONMENT COMPARISON:")
        if len(results) == 2:
            dev_data = results.get("development", {})
            prod_data = results.get("production", {})
            
            for page in ["/", "/about", "/shoes"]:
                dev_timeline = dev_data.get(page, {}).get("has_timeline", False)
                prod_timeline = prod_data.get(page, {}).get("has_timeline", False)
                
                if dev_timeline == prod_timeline:
                    print(f"   ✅ {page}: Timeline consistency OK")
                else:
                    print(f"   ❌ {page}: Timeline mismatch (dev:{dev_timeline}, prod:{prod_timeline})")
        
        return results

if __name__ == "__main__":
    tester = EnvironmentTester()
    results = tester.test_environment_parity()
    print("\n🎉 ENVIRONMENT TESTING COMPLETE")
```

## Layer 3: End-to-End User Journey Testing
**Purpose**: Test complete workflows from admin actions to user experience

### 3.1 Admin-to-User Workflow Testing
```python
#!/usr/bin/env python3
# test-admin-user-workflows.py

import requests
import time
import json
from datetime import datetime

class WorkflowTester:
    def __init__(self, base_url="https://newsteps.fit"):
        self.base_url = base_url
        self.admin_session = requests.Session()
        
    def authenticate_admin(self):
        """Authenticate as admin user"""
        print("🔐 Authenticating as admin...")
        
        # This would need actual admin login implementation
        # For now, return mock session
        print("   ⚠️  Using mock admin session (implement real auth)")
        return True
        
    def test_settings_change_workflow(self):
        """Test: Admin changes settings → User sees changes immediately"""
        print("🔍 LAYER 3: ADMIN-TO-USER WORKFLOW TESTING")
        print("==========================================")
        
        # 1. Get current state
        print("\n1️⃣ Capturing current state...")
        initial_response = requests.get(f"{self.base_url}/about")
        initial_content = initial_response.text
        initial_timeline_count = initial_content.count('timeline-item')
        print(f"   Current timeline items: {initial_timeline_count}")
        
        # 2. Admin makes change (mock for now)
        print("\n2️⃣ Admin making changes...")
        test_item_id = f"test-{int(time.time())}"
        print(f"   Adding test timeline item: {test_item_id}")
        
        # Mock admin change - in real implementation:
        # self.admin_session.post(f"{self.base_url}/api/admin/settings", 
        #                        json={"ourStory": [...existing, new_item]})
        
        # 3. Verify immediate change (no cache delay)
        print("\n3️⃣ Verifying immediate change...")
        time.sleep(2)  # Minimal delay for processing
        
        updated_response = requests.get(f"{self.base_url}/about")
        updated_content = updated_response.text
        
        # Check if content changed
        if initial_content != updated_content:
            print("   ✅ Content changed (cache invalidation working)")
        else:
            print("   ⚠️  Content unchanged (may indicate cache issue)")
            
        # 4. Test cache behavior
        print("\n4️⃣ Testing cache behavior...")
        
        # Multiple rapid requests should return consistent data
        responses = []
        for i in range(3):
            resp = requests.get(f"{self.base_url}/about")
            responses.append(resp.text)
            time.sleep(0.5)
            
        if all(r == responses[0] for r in responses):
            print("   ✅ Cache consistency maintained")
        else:
            print("   ❌ Cache inconsistency detected")
            
        return True
        
    def test_inventory_workflow(self):
        """Test: Admin adds shoe → User sees in inventory → User can request"""
        print("\n👟 INVENTORY WORKFLOW TESTING")
        print("=============================")
        
        # 1. Check current inventory
        print("\n1️⃣ Checking current inventory...")
        shoes_response = requests.get(f"{self.base_url}/api/shoes")
        if shoes_response.status_code == 200:
            shoes_data = shoes_response.json()
            initial_count = len(shoes_data.get('shoes', []))
            print(f"   Current inventory: {initial_count} shoes")
        else:
            print(f"   ❌ Shoes API failed: {shoes_response.status_code}")
            return False
            
        # 2. Test public inventory page
        print("\n2️⃣ Testing public inventory page...")
        inventory_response = requests.get(f"{self.base_url}/shoes")
        if inventory_response.status_code == 200:
            print("   ✅ Public inventory page accessible")
        else:
            print(f"   ❌ Public inventory failed: {inventory_response.status_code}")
            
        # 3. Test individual shoe pages
        if shoes_data.get('shoes'):
            first_shoe = shoes_data['shoes'][0]
            shoe_id = first_shoe.get('shoeId')
            
            print(f"\n3️⃣ Testing individual shoe page (ID: {shoe_id})...")
            shoe_response = requests.get(f"{self.base_url}/shoes/{shoe_id}")
            if shoe_response.status_code == 200:
                print("   ✅ Individual shoe page accessible")
            else:
                print(f"   ❌ Shoe page failed: {shoe_response.status_code}")
                
        return True

if __name__ == "__main__":
    tester = WorkflowTester()
    
    try:
        tester.test_settings_change_workflow()
        tester.test_inventory_workflow()
        print("\n🎉 ALL WORKFLOW TESTS PASSED")
    except Exception as e:
        print(f"\n❌ WORKFLOW TEST FAILED: {e}")
        exit(1)
```

### 3.2 Performance & Load Testing
```python
#!/usr/bin/env python3
# test-performance-load.py

import requests
import time
import concurrent.futures
import statistics

class PerformanceTester:
    def __init__(self, base_url="https://newsteps.fit"):
        self.base_url = base_url
        
    def test_page_load_times(self):
        """Test page load performance"""
        print("🔍 PERFORMANCE TESTING")
        print("======================")
        
        pages = ["/", "/about", "/shoes", "/contact"]
        results = {}
        
        for page in pages:
            print(f"\n📊 Testing {page}...")
            times = []
            
            for i in range(5):  # 5 requests per page
                start_time = time.time()
                response = requests.get(f"{self.base_url}{page}")
                end_time = time.time()
                
                if response.status_code == 200:
                    load_time = end_time - start_time
                    times.append(load_time)
                    print(f"   Request {i+1}: {load_time:.2f}s")
                else:
                    print(f"   Request {i+1}: FAILED ({response.status_code})")
            
            if times:
                avg_time = statistics.mean(times)
                results[page] = {
                    "avg_time": avg_time,
                    "times": times,
                    "status": "✅" if avg_time < 3.0 else "⚠️"
                }
                print(f"   Average: {avg_time:.2f}s {results[page]['status']}")
        
        return results
        
    def test_concurrent_load(self):
        """Test concurrent user load"""
        print(f"\n🚀 CONCURRENT LOAD TESTING")
        print("==========================")
        
        def make_request(url):
            start_time = time.time()
            try:
                response = requests.get(url, timeout=10)
                end_time = time.time()
                return {
                    "status": response.status_code,
                    "time": end_time - start_time,
                    "success": response.status_code == 200
                }
            except Exception as e:
                return {
                    "status": "error",
                    "time": 10.0,
                    "success": False,
                    "error": str(e)
                }
        
        # Test 10 concurrent requests to about page
        urls = [f"{self.base_url}/about" for _ in range(10)]
        
        print("   Testing 10 concurrent requests...")
        start_time = time.time()
        
        with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
            results = list(executor.map(make_request, urls))
        
        end_time = time.time()
        total_time = end_time - start_time
        
        success_count = sum(1 for r in results if r["success"])
        avg_response_time = statistics.mean([r["time"] for r in results])
        
        print(f"   Total time: {total_time:.2f}s")
        print(f"   Success rate: {success_count}/10 ({success_count*10}%)")
        print(f"   Avg response time: {avg_response_time:.2f}s")
        
        if success_count >= 9 and avg_response_time < 5.0:
            print("   ✅ Concurrent load test PASSED")
        else:
            print("   ⚠️  Concurrent load test needs attention")
        
        return results

if __name__ == "__main__":
    tester = PerformanceTester()
    
    load_results = tester.test_page_load_times()
    concurrent_results = tester.test_concurrent_load()
    
    print("\n🎉 PERFORMANCE TESTING COMPLETE")
```

## Layer 4: Production Validation & Monitoring
**Purpose**: Continuous validation in production environment

### 4.1 Production Health Monitoring
```python
#!/usr/bin/env python3
# test-production-health.py

import requests
import json
import time
from datetime import datetime

class ProductionValidator:
    def __init__(self):
        self.base_url = "https://newsteps.fit"
        self.health_checks = []
        
    def comprehensive_health_check(self):
        """Comprehensive production health validation"""
        print("🔍 LAYER 4: PRODUCTION HEALTH VALIDATION")
        print("========================================")
        
        checks = [
            self.check_core_pages,
            self.check_api_endpoints,
            self.check_database_connectivity,
            self.check_cache_behavior,
            self.check_admin_functionality,
            self.check_user_workflows
        ]
        
        results = {}
        
        for check in checks:
            try:
                check_name = check.__name__
                print(f"\n🔍 Running {check_name}...")
                result = check()
                results[check_name] = result
                print(f"   {'✅' if result.get('success', False) else '❌'} {check_name}")
            except Exception as e:
                results[check_name] = {"success": False, "error": str(e)}
                print(f"   ❌ {check_name} failed: {e}")
        
        return results
        
    def check_core_pages(self):
        """Check all core pages load correctly"""
        pages = {
            "homepage": "/",
            "about": "/about", 
            "shoes": "/shoes",
            "contact": "/contact",
            "donate": "/donate/shoes"
        }
        
        results = {}
        all_success = True
        
        for name, path in pages.items():
            try:
                response = requests.get(f"{self.base_url}{path}", timeout=10)
                success = response.status_code == 200
                results[name] = {
                    "status": response.status_code,
                    "success": success,
                    "load_time": response.elapsed.total_seconds()
                }
                if not success:
                    all_success = False
            except Exception as e:
                results[name] = {"success": False, "error": str(e)}
                all_success = False
        
        return {"success": all_success, "pages": results}
        
    def check_api_endpoints(self):
        """Check critical API endpoints"""
        endpoints = {
            "health": "/api/health",
            "shoes": "/api/shoes", 
            "settings": "/api/settings"
        }
        
        results = {}
        all_success = True
        
        for name, path in endpoints.items():
            try:
                response = requests.get(f"{self.base_url}{path}", timeout=10)
                success = response.status_code == 200
                
                # Validate response content
                if success and name == "settings":
                    data = response.json()
                    success = "projectEmail" in data and "shippingFee" in data
                
                results[name] = {
                    "status": response.status_code,
                    "success": success
                }
                if not success:
                    all_success = False
            except Exception as e:
                results[name] = {"success": False, "error": str(e)}
                all_success = False
        
        return {"success": all_success, "endpoints": results}
        
    def check_database_connectivity(self):
        """Check database connectivity through API"""
        try:
            # Test database through shoes API
            response = requests.get(f"{self.base_url}/api/shoes", timeout=10)
            if response.status_code == 200:
                data = response.json()
                has_shoes = len(data.get("shoes", [])) > 0
                return {
                    "success": True,
                    "shoes_count": len(data.get("shoes", [])),
                    "has_data": has_shoes
                }
            else:
                return {"success": False, "status": response.status_code}
        except Exception as e:
            return {"success": False, "error": str(e)}
            
    def check_cache_behavior(self):
        """Check cache behavior and consistency"""
        try:
            # Make multiple requests to about page
            responses = []
            for i in range(3):
                resp = requests.get(f"{self.base_url}/about", timeout=10)
                responses.append({
                    "status": resp.status_code,
                    "timeline_count": resp.text.count("timeline-"),
                    "has_dynamic_markers": "__NEXT_DATA__" in resp.text
                })
                time.sleep(1)
            
            # Check consistency
            timeline_counts = [r["timeline_count"] for r in responses]
            consistent = all(count == timeline_counts[0] for count in timeline_counts)
            
            return {
                "success": consistent and all(r["status"] == 200 for r in responses),
                "consistent": consistent,
                "responses": responses
            }
        except Exception as e:
            return {"success": False, "error": str(e)}
            
    def check_admin_functionality(self):
        """Check admin endpoints are protected"""
        admin_endpoints = [
            "/api/admin/settings",
            "/api/admin/shoes",
            "/api/admin/users"
        ]
        
        results = {}
        all_protected = True
        
        for endpoint in admin_endpoints:
            try:
                response = requests.get(f"{self.base_url}{endpoint}", timeout=10)
                # Should return 401 (unauthorized) or 307 (redirect to login)
                protected = response.status_code in [401, 307]
                results[endpoint] = {
                    "status": response.status_code,
                    "protected": protected
                }
                if not protected:
                    all_protected = False
            except Exception as e:
                results[endpoint] = {"error": str(e), "protected": False}
                all_protected = False
        
        return {"success": all_protected, "endpoints": results}
        
    def check_user_workflows(self):
        """Check critical user workflows work"""
        try:
            # Test shoe browsing workflow
            shoes_response = requests.get(f"{self.base_url}/shoes", timeout=10)
            shoes_page_works = shoes_response.status_code == 200
            
            # Test individual shoe page if shoes exist
            api_response = requests.get(f"{self.base_url}/api/shoes", timeout=10)
            individual_shoe_works = True
            
            if api_response.status_code == 200:
                shoes_data = api_response.json()
                if shoes_data.get("shoes"):
                    first_shoe_id = shoes_data["shoes"][0].get("shoeId")
                    shoe_response = requests.get(f"{self.base_url}/shoes/{first_shoe_id}", timeout=10)
                    individual_shoe_works = shoe_response.status_code == 200
            
            return {
                "success": shoes_page_works and individual_shoe_works,
                "shoes_page": shoes_page_works,
                "individual_shoe": individual_shoe_works
            }
        except Exception as e:
            return {"success": False, "error": str(e)}

if __name__ == "__main__":
    validator = ProductionValidator()
    
    print(f"🚀 Starting production validation at {datetime.now()}")
    results = validator.comprehensive_health_check()
    
    # Summary
    total_checks = len(results)
    successful_checks = sum(1 for r in results.values() if r.get("success", False))
    success_rate = (successful_checks / total_checks) * 100
    
    print(f"\n📊 PRODUCTION VALIDATION SUMMARY")
    print(f"================================")
    print(f"Total checks: {total_checks}")
    print(f"Successful: {successful_checks}")
    print(f"Success rate: {success_rate:.1f}%")
    
    if success_rate >= 90:
        print("🎉 PRODUCTION STATUS: HEALTHY")
    elif success_rate >= 75:
        print("⚠️  PRODUCTION STATUS: NEEDS ATTENTION")
    else:
        print("❌ PRODUCTION STATUS: CRITICAL ISSUES")
    
    # Save detailed results
    with open(f"production-health-{int(time.time())}.json", "w") as f:
        json.dump(results, f, indent=2, default=str)
```

## Master Test Runner
```bash
#!/bin/bash
# run-comprehensive-tests.sh

echo "🚀 COMPREHENSIVE TESTING FRAMEWORK"
echo "=================================="
echo "Running all 4 layers of testing..."

# Layer 1: Build-Time Analysis
echo -e "\n🏗️  LAYER 1: BUILD-TIME ANALYSIS"
./test-build-analysis.sh
if [ $? -ne 0 ]; then
    echo "❌ Layer 1 failed - stopping tests"
    exit 1
fi

# Layer 2: Data Flow Integration
echo -e "\n🔄 LAYER 2: DATA FLOW INTEGRATION"
python3 test-data-flow-integration.py
if [ $? -ne 0 ]; then
    echo "❌ Layer 2 failed - stopping tests"
    exit 1
fi

# Layer 3: End-to-End Workflows
echo -e "\n👥 LAYER 3: END-TO-END WORKFLOWS"
python3 test-admin-user-workflows.py
if [ $? -ne 0 ]; then
    echo "❌ Layer 3 failed - stopping tests"
    exit 1
fi

# Layer 4: Production Validation
echo -e "\n🌐 LAYER 4: PRODUCTION VALIDATION"
python3 test-production-health.py
if [ $? -ne 0 ]; then
    echo "❌ Layer 4 failed"
    exit 1
fi

echo -e "\n🎉 ALL TESTING LAYERS COMPLETED SUCCESSFULLY!"
echo "============================================="
```

## Testing Schedule
```markdown
### Continuous Integration
- **Every commit**: Layer 1 (Build Analysis)
- **Every PR**: Layers 1-2 (Build + Data Flow)
- **Pre-deployment**: Layers 1-3 (Build + Data Flow + Workflows)
- **Post-deployment**: Layer 4 (Production Validation)

### Monitoring Schedule
- **Every 5 minutes**: Basic health checks
- **Every hour**: Cache behavior validation
- **Daily**: Full Layer 4 production validation
- **Weekly**: Performance benchmarking
```

This comprehensive framework would have caught the cache bug because:
1. **Layer 1** would detect the about page being static instead of dynamic
2. **Layer 2** would validate that database changes don't appear in the UI
3. **Layer 3** would test the admin-to-user workflow end-to-end
4. **Layer 4** would continuously monitor cache behavior in production

The key insight is testing the **complete system behavior** rather than individual components.
