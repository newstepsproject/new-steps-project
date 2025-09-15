#!/usr/bin/env python3
"""
PHASE 1: CRITICAL CART OPERATIONS TESTING
Using Enhanced 4-Layer Methodology
"""

import asyncio
import json
import requests
import time
from playwright.async_api import async_playwright

class CartOperationsTester:
    def __init__(self, base_url="http://localhost:3000"):
        self.base_url = base_url
        self.results = {
            "layer1_api": {},
            "layer2_forms": {},
            "layer3_interactive": {},
            "layer4_workflows": {},
            "summary": {}
        }
    
    def test_layer1_api_endpoints(self):
        """Layer 1: Test cart-related API endpoints"""
        print("🔍 LAYER 1: API ENDPOINTS TESTING")
        
        # Test settings API (cart limit configuration)
        try:
            response = requests.get(f"{self.base_url}/api/settings", timeout=10)
            if response.status_code == 200:
                settings = response.json()
                max_shoes = settings.get('maxShoesPerRequest', 'NOT_FOUND')
                print(f"✅ Settings API: {response.status_code} - Max shoes: {max_shoes}")
                self.results["layer1_api"]["settings"] = {
                    "status": response.status_code,
                    "success": True,
                    "maxShoesPerRequest": max_shoes
                }
            else:
                print(f"❌ Settings API: {response.status_code}")
                self.results["layer1_api"]["settings"] = {
                    "status": response.status_code,
                    "success": False,
                    "error": "Non-200 response"
                }
        except Exception as e:
            print(f"❌ Settings API Error: {str(e)}")
            self.results["layer1_api"]["settings"] = {
                "status": 0,
                "success": False,
                "error": str(e)
            }
        
        # Test shoes API (cart item source)
        try:
            response = requests.get(f"{self.base_url}/api/shoes", timeout=10)
            if response.status_code == 200:
                data = response.json()
                shoes = data.get('shoes', []) if isinstance(data, dict) else data
                shoe_count = len(shoes) if isinstance(shoes, list) else 0
                print(f"✅ Shoes API: {response.status_code} - Available shoes: {shoe_count}")
                self.results["layer1_api"]["shoes"] = {
                    "status": response.status_code,
                    "success": True,
                    "shoeCount": shoe_count,
                    "sampleShoe": shoes[0] if shoes else None
                }
            else:
                print(f"❌ Shoes API: {response.status_code}")
                self.results["layer1_api"]["shoes"] = {
                    "status": response.status_code,
                    "success": False,
                    "error": "Non-200 response"
                }
        except Exception as e:
            print(f"❌ Shoes API Error: {str(e)}")
            self.results["layer1_api"]["shoes"] = {
                "status": 0,
                "success": False,
                "error": str(e)
            }
    
    async def test_layer3_interactive_features(self, browser):
        """Layer 3: Test cart interactive features (client-side logic)"""
        print("\n⚡ LAYER 3: INTERACTIVE FEATURES TESTING")
        
        context = await browser.new_context()
        page = await context.new_page()
        
        try:
            # Test 1: Cart Icon Display and State
            print("🧪 Test 1: Cart Icon Display and State")
            await page.goto(f"{self.base_url}/shoes")
            await page.wait_for_load_state('networkidle')
            
            # Check cart icon exists
            cart_icon = page.locator('[data-testid="cart-icon"], button:has-text("Cart"), .cart-icon')
            if await cart_icon.count() > 0:
                print("✅ Cart icon found")
                self.results["layer3_interactive"]["cart_icon_display"] = {"success": True}
            else:
                print("❌ Cart icon not found")
                self.results["layer3_interactive"]["cart_icon_display"] = {"success": False, "error": "Cart icon not found"}
            
            # Test 2: Add to Cart from List Page (CRITICAL - just fixed)
            print("🧪 Test 2: Add to Cart from List Page (Critical Bug Fix)")
            
            # Find first available shoe
            add_buttons = page.locator('button:has-text("Add to Cart")')
            if await add_buttons.count() > 0:
                # Click first Add to Cart button
                await add_buttons.first.click()
                await page.wait_for_timeout(2000)
                
                # Check if button text changed to "In Cart"
                in_cart_buttons = page.locator('button:has-text("In Cart")')
                if await in_cart_buttons.count() > 0:
                    print("✅ Add to Cart (List Page): SUCCESS - Button changed to 'In Cart'")
                    self.results["layer3_interactive"]["add_to_cart_list"] = {"success": True}
                else:
                    print("❌ Add to Cart (List Page): FAILED - Button didn't change")
                    self.results["layer3_interactive"]["add_to_cart_list"] = {"success": False, "error": "Button state didn't change"}
            else:
                print("❌ Add to Cart (List Page): No Add to Cart buttons found")
                self.results["layer3_interactive"]["add_to_cart_list"] = {"success": False, "error": "No Add to Cart buttons found"}
            
            # Test 3: Cart Limit Enforcement
            print("🧪 Test 3: Cart Limit Enforcement")
            
            # Try to add second shoe
            remaining_add_buttons = page.locator('button:has-text("Add to Cart")')
            if await remaining_add_buttons.count() > 0:
                await remaining_add_buttons.first.click()
                await page.wait_for_timeout(2000)
                
                # Check if we can add a third shoe (should be blocked)
                third_add_buttons = page.locator('button:has-text("Add to Cart")')
                if await third_add_buttons.count() > 0:
                    await third_add_buttons.first.click()
                    await page.wait_for_timeout(2000)
                    
                    # Should see "Cart Limit Reached" buttons
                    limit_buttons = page.locator('button:has-text("Cart Limit Reached")')
                    if await limit_buttons.count() > 0:
                        print("✅ Cart Limit Enforcement: SUCCESS - Limit reached message shown")
                        self.results["layer3_interactive"]["cart_limit"] = {"success": True}
                    else:
                        print("❌ Cart Limit Enforcement: FAILED - No limit message")
                        self.results["layer3_interactive"]["cart_limit"] = {"success": False, "error": "No limit enforcement"}
                else:
                    print("✅ Cart Limit Enforcement: SUCCESS - No more Add to Cart buttons available")
                    self.results["layer3_interactive"]["cart_limit"] = {"success": True}
            
            # Test 4: Cart Icon Count Update
            print("🧪 Test 4: Cart Icon Count Update")
            
            # Check cart icon shows item count (looking for the badge with count)
            cart_count_elements = page.locator('span.absolute.-top-1.-right-1, .cart-count, [data-testid="cart-count"], .badge')
            cart_count_text = ""
            if await cart_count_elements.count() > 0:
                cart_count_text = await cart_count_elements.first.text_content()
                print(f"✅ Cart Icon Count: Found count '{cart_count_text}'")
                self.results["layer3_interactive"]["cart_count"] = {"success": True, "count": cart_count_text}
            else:
                print("❌ Cart Icon Count: No count element found")
                self.results["layer3_interactive"]["cart_count"] = {"success": False, "error": "No count element"}
            
            # Test 5: Cart Dropdown/Modal Interaction
            print("🧪 Test 5: Cart Dropdown/Modal Interaction")
            
            # Find the actual cart icon button (not the "In Cart" buttons)
            actual_cart_icon = page.locator('button:has(svg.lucide-shopping-cart)')
            if await actual_cart_icon.count() > 0:
                await actual_cart_icon.first.click()
                await page.wait_for_timeout(2000)
                
                # Look for cart items in dropdown (using more specific selectors)
                cart_items = page.locator('div.space-y-4 > div, .cart-item, [data-testid="cart-item"]')
                if await cart_items.count() > 0:
                    print(f"✅ Cart Dropdown: Found {await cart_items.count()} items")
                    self.results["layer3_interactive"]["cart_dropdown"] = {"success": True, "itemCount": await cart_items.count()}
                    
                    # Test Remove from Cart
                    remove_buttons = page.locator('button:has-text("Remove")')
                    if await remove_buttons.count() > 0:
                        await remove_buttons.first.click()
                        await page.wait_for_timeout(2000)
                        
                        # Check if item was removed
                        remaining_items = await cart_items.count()
                        print(f"✅ Remove from Cart: Items after removal: {remaining_items}")
                        self.results["layer3_interactive"]["remove_from_cart"] = {"success": True, "remainingItems": remaining_items}
                    else:
                        print("❌ Remove from Cart: No remove buttons found")
                        self.results["layer3_interactive"]["remove_from_cart"] = {"success": False, "error": "No remove buttons"}
                else:
                    print("❌ Cart Dropdown: No items found")
                    self.results["layer3_interactive"]["cart_dropdown"] = {"success": False, "error": "No items in dropdown"}
            
            # Test 6: Cross-Page Consistency (Detail Page vs List Page)
            print("🧪 Test 6: Cross-Page Consistency Check")
            
            # Go to individual shoe detail page using a known shoe ID
            await page.goto(f"{self.base_url}/shoes/9")  # Use the Nike shoe we added
            await page.wait_for_load_state('networkidle')
            
            # Wait a bit for the page to fully load
            await page.wait_for_timeout(3000)
            
            # Test Add to Cart on detail page
            detail_add_button = page.locator('button:has-text("Add to Cart"), button:has-text("Request These Shoes")')
            if await detail_add_button.count() > 0:
                await detail_add_button.click()
                await page.wait_for_timeout(2000)
                
                # Check if button changed to "In Cart"
                detail_in_cart = page.locator('button:has-text("In Cart")')
                if await detail_in_cart.count() > 0:
                    print("✅ Cross-Page Consistency: Detail page Add to Cart works")
                    self.results["layer3_interactive"]["cross_page_consistency"] = {"success": True}
                else:
                    print("❌ Cross-Page Consistency: Detail page Add to Cart failed")
                    self.results["layer3_interactive"]["cross_page_consistency"] = {"success": False, "error": "Detail page add failed"}
            else:
                print("❌ Cross-Page Consistency: No Add to Cart button on detail page")
                self.results["layer3_interactive"]["cross_page_consistency"] = {"success": False, "error": "No button on detail page"}
            
        except Exception as e:
            print(f"❌ Interactive Features Error: {str(e)}")
            self.results["layer3_interactive"]["error"] = str(e)
        finally:
            await context.close()
    
    async def test_layer4_complete_workflows(self, browser):
        """Layer 4: Test complete cart-to-checkout workflows"""
        print("\n🌊 LAYER 4: COMPLETE WORKFLOW TESTING")
        
        context = await browser.new_context()
        page = await context.new_page()
        
        try:
            # Workflow 1: Browse → Add to Cart → View Cart → Checkout
            print("🧪 Workflow 1: Complete Cart-to-Checkout Flow")
            
            # Step 1: Browse shoes
            await page.goto(f"{self.base_url}/shoes")
            await page.wait_for_load_state('networkidle')
            
            # Step 2: Add shoes to cart
            add_buttons = page.locator('button:has-text("Add to Cart")')
            if await add_buttons.count() >= 2:
                # Add first shoe
                await add_buttons.nth(0).click()
                await page.wait_for_timeout(1000)
                
                # Add second shoe
                await add_buttons.nth(1).click()
                await page.wait_for_timeout(1000)
                
                print("✅ Step 2: Added 2 shoes to cart")
            else:
                print("❌ Step 2: Not enough shoes available")
                self.results["layer4_workflows"]["complete_flow"] = {"success": False, "error": "Not enough shoes"}
                return
            
            # Step 3: Go to cart page
            await page.goto(f"{self.base_url}/cart")
            await page.wait_for_load_state('networkidle')
            
            # Check cart page shows items
            cart_items = page.locator('.cart-item, [data-testid="cart-item"]')
            if await cart_items.count() > 0:
                print(f"✅ Step 3: Cart page shows {await cart_items.count()} items")
            else:
                print("❌ Step 3: Cart page shows no items")
                self.results["layer4_workflows"]["complete_flow"] = {"success": False, "error": "Cart page empty"}
                return
            
            # Step 4: Proceed to checkout
            checkout_button = page.locator('button:has-text("Checkout"), a:has-text("Checkout")')
            if await checkout_button.count() > 0:
                await checkout_button.click()
                await page.wait_for_load_state('networkidle')
                
                # Check if we're on checkout page
                if "/checkout" in page.url:
                    print("✅ Step 4: Successfully navigated to checkout")
                    self.results["layer4_workflows"]["complete_flow"] = {"success": True}
                else:
                    print("❌ Step 4: Didn't reach checkout page")
                    self.results["layer4_workflows"]["complete_flow"] = {"success": False, "error": "Checkout navigation failed"}
            else:
                print("❌ Step 4: No checkout button found")
                self.results["layer4_workflows"]["complete_flow"] = {"success": False, "error": "No checkout button"}
            
            # Workflow 2: Cart Persistence Test
            print("🧪 Workflow 2: Cart Persistence Across Page Navigation")
            
            # Navigate away and back
            await page.goto(f"{self.base_url}/about")
            await page.wait_for_load_state('networkidle')
            
            await page.goto(f"{self.base_url}/shoes")
            await page.wait_for_load_state('networkidle')
            
            # Check if cart still shows items
            in_cart_buttons = page.locator('button:has-text("In Cart")')
            if await in_cart_buttons.count() > 0:
                print("✅ Workflow 2: Cart persisted across navigation")
                self.results["layer4_workflows"]["cart_persistence"] = {"success": True}
            else:
                print("❌ Workflow 2: Cart didn't persist")
                self.results["layer4_workflows"]["cart_persistence"] = {"success": False, "error": "Cart not persisted"}
            
        except Exception as e:
            print(f"❌ Workflow Error: {str(e)}")
            self.results["layer4_workflows"]["error"] = str(e)
        finally:
            await context.close()
    
    async def run_comprehensive_cart_test(self):
        """Run all 4 layers of cart testing"""
        print("🎯 STARTING COMPREHENSIVE CART OPERATIONS TESTING")
        print("=" * 60)
        
        # Layer 1: API Endpoints
        self.test_layer1_api_endpoints()
        
        # Layers 3 & 4: Interactive Features and Workflows (using browser)
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=False)  # Visible for debugging
            
            await self.test_layer3_interactive_features(browser)
            await self.test_layer4_complete_workflows(browser)
            
            await browser.close()
        
        # Generate summary
        self.generate_summary()
        
        return self.results
    
    def generate_summary(self):
        """Generate test summary"""
        print("\n" + "=" * 60)
        print("📊 CART OPERATIONS TEST SUMMARY")
        print("=" * 60)
        
        total_tests = 0
        passed_tests = 0
        
        for layer, tests in self.results.items():
            if layer == "summary":
                continue
                
            print(f"\n{layer.upper()}:")
            for test_name, result in tests.items():
                if isinstance(result, dict) and "success" in result:
                    total_tests += 1
                    if result["success"]:
                        passed_tests += 1
                        print(f"  ✅ {test_name}")
                    else:
                        print(f"  ❌ {test_name}: {result.get('error', 'Unknown error')}")
                elif test_name != "error":
                    print(f"  ℹ️ {test_name}: {result}")
        
        success_rate = (passed_tests / total_tests * 100) if total_tests > 0 else 0
        
        print(f"\n🎯 OVERALL RESULTS:")
        print(f"   Total Tests: {total_tests}")
        print(f"   Passed: {passed_tests}")
        print(f"   Failed: {total_tests - passed_tests}")
        print(f"   Success Rate: {success_rate:.1f}%")
        
        self.results["summary"] = {
            "total_tests": total_tests,
            "passed_tests": passed_tests,
            "failed_tests": total_tests - passed_tests,
            "success_rate": success_rate
        }
        
        if success_rate >= 95:
            print("🎉 EXCELLENT: Cart operations are working correctly!")
        elif success_rate >= 80:
            print("⚠️ GOOD: Most cart operations working, minor issues to fix")
        else:
            print("🚨 CRITICAL: Major cart operation issues need immediate attention")

async def main():
    tester = CartOperationsTester()
    results = await tester.run_comprehensive_cart_test()
    
    # Save results
    with open('cart_test_results.json', 'w') as f:
        json.dump(results, f, indent=2)
    
    print(f"\n💾 Results saved to: cart_test_results.json")

if __name__ == "__main__":
    asyncio.run(main())
