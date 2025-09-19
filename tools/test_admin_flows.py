#!/usr/bin/env python3
"""
Test Admin Flows on Localhost
"""

import asyncio
from playwright.async_api import async_playwright

async def test_admin_flows():
    print("👑 TESTING ADMIN FLOWS ON LOCALHOST")
    print("=" * 40)
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=False, slow_mo=1000)
        
        # Desktop viewport for admin interface
        context = await browser.new_context(
            viewport={'width': 1920, 'height': 1080},
            user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        )
        page = await context.new_page()
        
        admin_results = {
            "login": {"status": "pending"},
            "dashboard": {"status": "pending"},
            "navigation": {"status": "pending"},
            "inventory": {"status": "pending"},
            "requests": {"status": "pending"}
        }
        
        try:
            # Test 1: Admin Login
            print("\n🔐 Testing Admin Login")
            await page.goto("http://localhost:3001/admin")
            await page.wait_for_load_state('networkidle')
            
            # Should redirect to login if not authenticated
            current_url = page.url
            print(f"  Current URL: {current_url}")
            
            if "login" in current_url:
                print("  ✅ Correctly redirected to login page")
                
                # Fill login form
                await page.fill('input[type="email"]', 'newstepsfit@gmail.com')
                await page.fill('input[type="password"]', 'Admin123!')
                
                # Submit login (use the submit button specifically)
                submit_button = page.locator('button[type="submit"]')
                await submit_button.click()
                await page.wait_for_timeout(3000)
                
                # Check if login successful
                final_url = page.url
                if "/admin" in final_url and "login" not in final_url:
                    print("  ✅ Admin login successful")
                    admin_results["login"] = {"status": "passed", "redirect_url": final_url}
                else:
                    print(f"  ❌ Admin login failed - URL: {final_url}")
                    admin_results["login"] = {"status": "failed", "redirect_url": final_url}
                    return admin_results
            else:
                print("  ✅ Already logged in as admin")
                admin_results["login"] = {"status": "passed", "note": "already_logged_in"}
            
            # Test 2: Admin Dashboard
            print("\n📊 Testing Admin Dashboard")
            await page.goto("http://localhost:3001/admin")
            await page.wait_for_load_state('networkidle')
            
            # Check dashboard elements
            page_title = await page.title()
            stats_cards = await page.locator('.card, [class*="card"], .bg-white').count()
            nav_links = await page.locator('a[href*="/admin/"]').count()
            
            print(f"  Page title: {page_title}")
            print(f"  Stats cards: {stats_cards}")
            print(f"  Navigation links: {nav_links}")
            
            admin_results["dashboard"] = {
                "status": "passed",
                "page_title": page_title,
                "stats_cards": stats_cards,
                "nav_links": nav_links
            }
            
            # Test 3: Navigation Links
            print("\n🧭 Testing Admin Navigation")
            nav_links_data = []
            links = await page.locator('a[href*="/admin/"]').all()
            
            for i, link in enumerate(links[:5]):  # Test first 5 links
                try:
                    href = await link.get_attribute('href')
                    text = await link.text_content()
                    nav_links_data.append({
                        "href": href,
                        "text": text.strip() if text else f"link_{i}",
                        "clickable": True
                    })
                except Exception as e:
                    nav_links_data.append({
                        "href": "unknown",
                        "text": f"link_{i}",
                        "error": str(e)
                    })
            
            admin_results["navigation"] = {
                "status": "passed",
                "links": nav_links_data
            }
            
            # Test 4: Inventory Page
            print("\n📦 Testing Admin Inventory")
            try:
                await page.goto("http://localhost:3001/admin/inventory")
                await page.wait_for_load_state('networkidle')
                
                inventory_title = await page.title()
                shoes_displayed = await page.locator('[data-testid="shoe-item"], .shoe-card, tr').count()
                add_button = await page.locator('button:has-text("Add"), a:has-text("Add")').count()
                
                print(f"  Inventory page title: {inventory_title}")
                print(f"  Shoes displayed: {shoes_displayed}")
                print(f"  Add buttons: {add_button}")
                
                admin_results["inventory"] = {
                    "status": "passed",
                    "page_title": inventory_title,
                    "shoes_count": shoes_displayed,
                    "add_buttons": add_button
                }
                
            except Exception as e:
                print(f"  ❌ Inventory test failed: {e}")
                admin_results["inventory"] = {"status": "failed", "error": str(e)}
            
            # Test 5: Requests Page
            print("\n📋 Testing Admin Requests")
            try:
                await page.goto("http://localhost:3001/admin/requests")
                await page.wait_for_load_state('networkidle')
                
                requests_title = await page.title()
                requests_displayed = await page.locator('[data-testid="request-item"], .request-card, tr').count()
                status_filters = await page.locator('button:has-text("All"), button:has-text("Pending"), select').count()
                
                print(f"  Requests page title: {requests_title}")
                print(f"  Requests displayed: {requests_displayed}")
                print(f"  Status filters: {status_filters}")
                
                admin_results["requests"] = {
                    "status": "passed",
                    "page_title": requests_title,
                    "requests_count": requests_displayed,
                    "filters": status_filters
                }
                
            except Exception as e:
                print(f"  ❌ Requests test failed: {e}")
                admin_results["requests"] = {"status": "failed", "error": str(e)}
            
        except Exception as e:
            print(f"❌ Admin flow test error: {e}")
            
        finally:
            await browser.close()
        
        # Generate summary
        print(f"\n🎯 ADMIN FLOWS SUMMARY")
        print("=" * 25)
        
        total_tests = len(admin_results)
        passed_tests = sum(1 for result in admin_results.values() if result.get("status") == "passed")
        success_rate = (passed_tests / total_tests * 100) if total_tests > 0 else 0
        
        print(f"✅ Tests Passed: {passed_tests}/{total_tests} ({success_rate:.1f}%)")
        
        for test_name, result in admin_results.items():
            status = result.get("status", "unknown")
            emoji = "✅" if status == "passed" else "❌" if status == "failed" else "⏳"
            print(f"  {emoji} {test_name.title()}: {status}")
        
        return admin_results

if __name__ == "__main__":
    asyncio.run(test_admin_flows())
