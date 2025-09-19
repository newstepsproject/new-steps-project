#!/usr/bin/env python3
"""
Comprehensive Localhost UI/UX Testing Script
Tests both user and admin experiences on localhost:3001
"""

import asyncio
import json
import time
from datetime import datetime
from playwright.async_api import async_playwright
import os

class LocalhostUIUXTester:
    def __init__(self):
        self.base_url = "http://localhost:3001"
        self.results = {
            "test_timestamp": datetime.now().isoformat(),
            "base_url": self.base_url,
            "user_flows": {},
            "admin_flows": {},
            "ui_issues": [],
            "performance_metrics": {},
            "overall_status": "pending"
        }
        
        # Test accounts
        self.test_user = {
            "email": "testuser@example.com",
            "password": "TestUser123!",
            "firstName": "Test",
            "lastName": "User",
            "phone": "1234567890"
        }
        
        self.admin_user = {
            "email": "newstepsfit@gmail.com",
            "password": "Admin123!"
        }

    async def run_comprehensive_test(self):
        """Run all UI/UX tests"""
        print("🧪 STARTING COMPREHENSIVE LOCALHOST UI/UX TESTING")
        print("=" * 55)
        
        async with async_playwright() as p:
            # Launch browser with mobile viewport for mobile-first testing
            browser = await p.chromium.launch(headless=False, slow_mo=500)
            
            # Test both desktop and mobile viewports
            await self.test_desktop_experience(browser)
            await self.test_mobile_experience(browser)
            
            await browser.close()
        
        # Generate final report
        self.generate_report()
        return self.results

    async def test_desktop_experience(self, browser):
        """Test desktop user experience"""
        print("\n🖥️ TESTING DESKTOP EXPERIENCE")
        print("-" * 30)
        
        context = await browser.new_context(
            viewport={'width': 1920, 'height': 1080},
            user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        )
        page = await context.new_page()
        
        try:
            # Test public pages
            await self.test_homepage(page, "desktop")
            await self.test_shoes_catalog(page, "desktop")
            await self.test_about_page(page, "desktop")
            await self.test_donate_page(page, "desktop")
            
            # Test user authentication flows
            await self.test_user_registration(page, "desktop")
            await self.test_user_login(page, "desktop")
            await self.test_user_shopping_flow(page, "desktop")
            
            # Test admin flows
            await self.test_admin_login(page, "desktop")
            await self.test_admin_dashboard(page, "desktop")
            await self.test_admin_inventory(page, "desktop")
            
        except Exception as e:
            self.results["ui_issues"].append({
                "type": "desktop_test_error",
                "message": str(e),
                "timestamp": datetime.now().isoformat()
            })
        finally:
            await context.close()

    async def test_mobile_experience(self, browser):
        """Test mobile user experience"""
        print("\n📱 TESTING MOBILE EXPERIENCE")
        print("-" * 30)
        
        context = await browser.new_context(
            viewport={'width': 375, 'height': 667},  # iPhone SE
            user_agent='Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15'
        )
        page = await context.new_page()
        
        try:
            # Test mobile-specific UI elements
            await self.test_mobile_navigation(page)
            await self.test_mobile_touch_targets(page)
            await self.test_mobile_forms(page)
            await self.test_mobile_cart_experience(page)
            
        except Exception as e:
            self.results["ui_issues"].append({
                "type": "mobile_test_error",
                "message": str(e),
                "timestamp": datetime.now().isoformat()
            })
        finally:
            await context.close()

    async def test_homepage(self, page, viewport):
        """Test homepage functionality and UI"""
        print(f"  🏠 Testing Homepage ({viewport})")
        
        try:
            await page.goto(self.base_url)
            await page.wait_for_load_state('networkidle')
            
            # Check page loads
            title = await page.title()
            if "New Steps" not in title:
                self.add_ui_issue("homepage_title", f"Unexpected title: {title}", viewport)
            
            # Check hero section
            hero_visible = await page.is_visible('h1')
            if not hero_visible:
                self.add_ui_issue("homepage_hero", "Hero heading not visible", viewport)
            
            # Check CTA buttons
            cta_buttons = await page.locator('a[href*="donate"], a[href*="shoes"]').count()
            if cta_buttons < 2:
                self.add_ui_issue("homepage_cta", f"Only {cta_buttons} CTA buttons found", viewport)
            
            # Test navigation
            nav_visible = await page.is_visible('nav')
            if not nav_visible:
                self.add_ui_issue("homepage_nav", "Navigation not visible", viewport)
            
            # Performance check
            await self.measure_performance(page, "homepage", viewport)
            
            self.results["user_flows"][f"homepage_{viewport}"] = {
                "status": "passed",
                "title": title,
                "cta_buttons": cta_buttons,
                "load_time": await self.get_load_time(page)
            }
            
        except Exception as e:
            self.results["user_flows"][f"homepage_{viewport}"] = {
                "status": "failed",
                "error": str(e)
            }

    async def test_shoes_catalog(self, page, viewport):
        """Test shoes catalog page"""
        print(f"  👟 Testing Shoes Catalog ({viewport})")
        
        try:
            await page.goto(f"{self.base_url}/shoes")
            await page.wait_for_load_state('networkidle')
            
            # Check shoes grid
            shoes_count = await page.locator('[data-testid="shoe-card"], .shoe-card, .grid > div').count()
            if shoes_count == 0:
                self.add_ui_issue("shoes_catalog", "No shoes displayed in catalog", viewport)
            
            # Test search functionality
            search_input = page.locator('input[placeholder*="search"], input[type="search"]')
            if await search_input.count() > 0:
                await search_input.first.fill("nike")
                await page.wait_for_timeout(1000)  # Wait for search
            
            # Test filter buttons
            filter_buttons = await page.locator('button:has-text("All"), button:has-text("Men"), button:has-text("Women")').count()
            
            # Test add to cart buttons
            add_to_cart_buttons = await page.locator('button:has-text("Add to Cart"), button:has-text("Request")').count()
            
            self.results["user_flows"][f"shoes_catalog_{viewport}"] = {
                "status": "passed",
                "shoes_count": shoes_count,
                "filter_buttons": filter_buttons,
                "add_to_cart_buttons": add_to_cart_buttons
            }
            
        except Exception as e:
            self.results["user_flows"][f"shoes_catalog_{viewport}"] = {
                "status": "failed",
                "error": str(e)
            }

    async def test_user_registration(self, page, viewport):
        """Test user registration flow"""
        print(f"  📝 Testing User Registration ({viewport})")
        
        try:
            await page.goto(f"{self.base_url}/register")
            await page.wait_for_load_state('networkidle')
            
            # Fill registration form
            await page.fill('input[name="firstName"], input[placeholder*="First"]', self.test_user["firstName"])
            await page.fill('input[name="lastName"], input[placeholder*="Last"]', self.test_user["lastName"])
            await page.fill('input[name="email"], input[type="email"]', self.test_user["email"])
            await page.fill('input[name="password"], input[type="password"]', self.test_user["password"])
            
            # Optional phone field
            phone_input = page.locator('input[name="phone"], input[placeholder*="phone"]')
            if await phone_input.count() > 0:
                await phone_input.fill(self.test_user["phone"])
            
            # Submit form
            submit_button = page.locator('button[type="submit"], button:has-text("Create"), button:has-text("Register")')
            if await submit_button.count() > 0:
                await submit_button.click()
                await page.wait_for_timeout(2000)
            
            # Check for success or error
            current_url = page.url
            success = "/login" in current_url or "/account" in current_url
            
            self.results["user_flows"][f"registration_{viewport}"] = {
                "status": "passed" if success else "needs_review",
                "redirect_url": current_url,
                "form_submitted": True
            }
            
        except Exception as e:
            self.results["user_flows"][f"registration_{viewport}"] = {
                "status": "failed",
                "error": str(e)
            }

    async def test_user_login(self, page, viewport):
        """Test user login flow"""
        print(f"  🔐 Testing User Login ({viewport})")
        
        try:
            await page.goto(f"{self.base_url}/login")
            await page.wait_for_load_state('networkidle')
            
            # Fill login form
            await page.fill('input[name="email"], input[type="email"]', self.test_user["email"])
            await page.fill('input[name="password"], input[type="password"]', self.test_user["password"])
            
            # Submit login
            submit_button = page.locator('button[type="submit"], button:has-text("Sign in"), button:has-text("Login")')
            await submit_button.click()
            await page.wait_for_timeout(3000)
            
            # Check login success
            current_url = page.url
            success = "/account" in current_url or "/dashboard" in current_url or "login" not in current_url
            
            self.results["user_flows"][f"login_{viewport}"] = {
                "status": "passed" if success else "needs_review",
                "redirect_url": current_url
            }
            
        except Exception as e:
            self.results["user_flows"][f"login_{viewport}"] = {
                "status": "failed",
                "error": str(e)
            }

    async def test_admin_login(self, page, viewport):
        """Test admin login flow"""
        print(f"  👑 Testing Admin Login ({viewport})")
        
        try:
            await page.goto(f"{self.base_url}/admin")
            await page.wait_for_load_state('networkidle')
            
            # Should redirect to login if not authenticated
            if "login" in page.url:
                await page.fill('input[type="email"]', self.admin_user["email"])
                await page.fill('input[type="password"]', self.admin_user["password"])
                
                submit_button = page.locator('button[type="submit"], button:has-text("Sign in")')
                await submit_button.click()
                await page.wait_for_timeout(3000)
            
            # Check admin dashboard access
            current_url = page.url
            admin_access = "/admin" in current_url and "login" not in current_url
            
            self.results["admin_flows"][f"admin_login_{viewport}"] = {
                "status": "passed" if admin_access else "needs_review",
                "final_url": current_url,
                "admin_access": admin_access
            }
            
        except Exception as e:
            self.results["admin_flows"][f"admin_login_{viewport}"] = {
                "status": "failed",
                "error": str(e)
            }

    async def test_admin_dashboard(self, page, viewport):
        """Test admin dashboard functionality"""
        print(f"  📊 Testing Admin Dashboard ({viewport})")
        
        try:
            # Assume we're already logged in as admin
            await page.goto(f"{self.base_url}/admin")
            await page.wait_for_load_state('networkidle')
            
            # Check dashboard elements
            stats_cards = await page.locator('.card, [class*="card"], .bg-white').count()
            navigation_links = await page.locator('a[href*="/admin/"], nav a').count()
            
            # Test navigation links
            nav_links = []
            links = await page.locator('a[href*="/admin/"]').all()
            for link in links[:3]:  # Test first 3 links
                href = await link.get_attribute('href')
                text = await link.text_content()
                nav_links.append({"href": href, "text": text.strip()})
            
            self.results["admin_flows"][f"admin_dashboard_{viewport}"] = {
                "status": "passed",
                "stats_cards": stats_cards,
                "navigation_links": navigation_links,
                "nav_links": nav_links
            }
            
        except Exception as e:
            self.results["admin_flows"][f"admin_dashboard_{viewport}"] = {
                "status": "failed",
                "error": str(e)
            }

    async def test_mobile_navigation(self, page):
        """Test mobile-specific navigation"""
        print("  📱 Testing Mobile Navigation")
        
        try:
            await page.goto(self.base_url)
            await page.wait_for_load_state('networkidle')
            
            # Check for mobile menu button (use working selector from debug)
            mobile_menu_button = page.locator('button[aria-label*="menu"]')
            mobile_menu_exists = await mobile_menu_button.count() > 0
            
            if mobile_menu_exists:
                # Ensure button is visible before clicking
                await mobile_menu_button.wait_for(state='visible', timeout=5000)
                await mobile_menu_button.click()
                await page.wait_for_timeout(500)
                
                # Check if menu opened
                menu_opened = await page.is_visible('nav, .mobile-menu, [role="dialog"]')
                
                self.results["user_flows"]["mobile_navigation"] = {
                    "status": "passed",
                    "mobile_menu_button": mobile_menu_exists,
                    "menu_opens": menu_opened
                }
            else:
                self.add_ui_issue("mobile_nav", "No mobile menu button found", "mobile")
                
        except Exception as e:
            self.results["user_flows"]["mobile_navigation"] = {
                "status": "failed",
                "error": str(e)
            }

    async def test_mobile_touch_targets(self, page):
        """Test mobile touch target sizes"""
        print("  👆 Testing Mobile Touch Targets")
        
        try:
            await page.goto(f"{self.base_url}/shoes")
            await page.wait_for_load_state('networkidle')
            
            # Check button sizes
            buttons = await page.locator('button, a[role="button"]').all()
            small_buttons = []
            
            for i, button in enumerate(buttons[:10]):  # Check first 10 buttons
                try:
                    box = await button.bounding_box()
                    if box and (box['width'] < 44 or box['height'] < 44):
                        text = await button.text_content()
                        small_buttons.append({
                            "text": text[:20] if text else f"button_{i}",
                            "size": f"{box['width']}x{box['height']}"
                        })
                except:
                    continue
            
            self.results["user_flows"]["mobile_touch_targets"] = {
                "status": "passed" if len(small_buttons) == 0 else "needs_improvement",
                "total_buttons_checked": len(buttons),
                "small_buttons": small_buttons
            }
            
            if small_buttons:
                self.add_ui_issue("touch_targets", f"Found {len(small_buttons)} buttons smaller than 44x44px", "mobile")
                
        except Exception as e:
            self.results["user_flows"]["mobile_touch_targets"] = {
                "status": "failed",
                "error": str(e)
            }

    async def measure_performance(self, page, page_name, viewport):
        """Measure page performance metrics"""
        try:
            # Get performance metrics
            metrics = await page.evaluate('''() => {
                const navigation = performance.getEntriesByType('navigation')[0];
                return {
                    loadTime: navigation.loadEventEnd - navigation.loadEventStart,
                    domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
                    firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime || 0,
                    firstContentfulPaint: performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0
                };
            }''')
            
            self.results["performance_metrics"][f"{page_name}_{viewport}"] = metrics
            
        except Exception as e:
            print(f"    ⚠️  Performance measurement failed: {e}")

    async def get_load_time(self, page):
        """Get page load time"""
        try:
            return await page.evaluate('() => performance.timing.loadEventEnd - performance.timing.navigationStart')
        except:
            return 0

    def add_ui_issue(self, issue_type, message, viewport):
        """Add a UI issue to the results"""
        self.results["ui_issues"].append({
            "type": issue_type,
            "message": message,
            "viewport": viewport,
            "timestamp": datetime.now().isoformat()
        })

    def generate_report(self):
        """Generate final test report"""
        total_tests = len(self.results["user_flows"]) + len(self.results["admin_flows"])
        passed_tests = sum(1 for flow in {**self.results["user_flows"], **self.results["admin_flows"]}.values() 
                          if flow.get("status") == "passed")
        
        success_rate = (passed_tests / total_tests * 100) if total_tests > 0 else 0
        
        self.results["overall_status"] = {
            "total_tests": total_tests,
            "passed_tests": passed_tests,
            "success_rate": round(success_rate, 1),
            "ui_issues_count": len(self.results["ui_issues"]),
            "status": "excellent" if success_rate >= 90 else "good" if success_rate >= 75 else "needs_improvement"
        }
        
        # Save results
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"localhost_uiux_test_results_{timestamp}.json"
        
        with open(filename, 'w') as f:
            json.dump(self.results, f, indent=2)
        
        print(f"\n📊 TEST RESULTS SUMMARY")
        print("=" * 25)
        print(f"✅ Tests Passed: {passed_tests}/{total_tests} ({success_rate:.1f}%)")
        print(f"⚠️  UI Issues Found: {len(self.results['ui_issues'])}")
        print(f"📁 Full Results: {filename}")
        
        return filename

async def main():
    """Run the comprehensive localhost UI/UX test"""
    tester = LocalhostUIUXTester()
    results = await tester.run_comprehensive_test()
    
    print("\n🎯 TESTING COMPLETE!")
    print(f"Overall Status: {results['overall_status']['status'].upper()}")
    
    if results["ui_issues"]:
        print("\n⚠️  UI ISSUES FOUND:")
        for issue in results["ui_issues"]:
            print(f"  - {issue['type']}: {issue['message']} ({issue['viewport']})")
    
    return results

if __name__ == "__main__":
    asyncio.run(main())
