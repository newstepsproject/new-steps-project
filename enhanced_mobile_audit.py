#!/usr/bin/env python3
"""
Enhanced Mobile UI/UX Audit with Authentication
Tests all pages including authenticated user and admin areas
"""

import asyncio
import os
import sys
from playwright.async_api import async_playwright
import json
from datetime import datetime

class EnhancedMobileAuditor:
    def __init__(self):
        self.base_url = "http://localhost:3000"
        self.screenshots_dir = "enhanced_mobile_audit"
        self.mobile_viewport = {"width": 375, "height": 812}  # iPhone 13 Pro
        self.audit_results = []
        
        # Test credentials
        self.test_user = {
            "email": "mobile.test@example.com",
            "password": "MobileTest123!"
        }
        self.admin_user = {
            "email": "admin@newsteps.fit", 
            "password": "Admin123!"
        }
        
    async def setup(self):
        """Setup browser and create screenshots directory"""
        if not os.path.exists(self.screenshots_dir):
            os.makedirs(self.screenshots_dir)
            
        self.playwright = await async_playwright().start()
        self.browser = await self.playwright.chromium.launch(headless=False)
        
    async def create_context(self):
        """Create a new browser context with mobile viewport"""
        return await self.browser.new_context(
            viewport=self.mobile_viewport,
            user_agent="Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1"
        )
        
    async def take_screenshot(self, page, name, description=""):
        """Take a screenshot and analyze mobile UX"""
        screenshot_path = f"{self.screenshots_dir}/{name}.png"
        await page.screenshot(path=screenshot_path, full_page=True)
        
        # Analyze touch targets
        touch_issues = await self.analyze_touch_targets(page)
        
        self.audit_results.append({
            "page": name,
            "description": description,
            "screenshot": screenshot_path,
            "url": page.url,
            "touch_issues": touch_issues,
            "timestamp": datetime.now().isoformat()
        })
        
        print(f"📱 {name}: {description}")
        if touch_issues:
            print(f"   ⚠️  Touch issues: {len(touch_issues)}")
            for issue in touch_issues[:2]:  # Show first 2 issues
                print(f"      - {issue}")
        else:
            print(f"   ✅ Touch targets look good")
            
    async def analyze_touch_targets(self, page):
        """Analyze touch targets for mobile usability"""
        issues = []
        
        try:
            # Find small touch targets
            small_targets = await page.evaluate("""
                () => {
                    const targets = Array.from(document.querySelectorAll('button, a, input[type="submit"], input[type="button"], [role="button"]'));
                    const small = [];
                    
                    targets.forEach(el => {
                        const rect = el.getBoundingClientRect();
                        const isVisible = rect.width > 0 && rect.height > 0;
                        const isSmall = rect.width < 44 || rect.height < 44;
                        
                        if (isVisible && isSmall) {
                            const text = el.textContent?.trim() || el.getAttribute('aria-label') || 'unnamed';
                            small.push({
                                text: text.substring(0, 30),
                                width: Math.round(rect.width),
                                height: Math.round(rect.height),
                                tag: el.tagName.toLowerCase()
                            });
                        }
                    });
                    
                    return small;
                }
            """)
            
            for target in small_targets:
                issues.append(f"{target['tag']} '{target['text']}' is {target['width']}x{target['height']}px (needs 44x44px)")
                
        except Exception as e:
            issues.append(f"Analysis error: {str(e)}")
            
        return issues
    
    async def login_user(self, page, email, password):
        """Login as a user"""
        try:
            await page.goto(f"{self.base_url}/login")
            await page.wait_for_load_state("networkidle")
            
            # Fill login form
            await page.fill('input[type="email"]', email)
            await page.fill('input[type="password"]', password)
            
            # Submit form
            await page.click('button[type="submit"]')
            await page.wait_for_timeout(3000)
            
            # Check if login was successful
            current_url = page.url
            if "/login" not in current_url:
                print(f"   ✅ Login successful for {email}")
                return True
            else:
                print(f"   ❌ Login failed for {email}")
                return False
                
        except Exception as e:
            print(f"   ❌ Login error for {email}: {str(e)}")
            return False
    
    async def test_public_pages(self):
        """Test public pages"""
        print("\n🌐 TESTING PUBLIC PAGES (Mobile UX Focus)")
        print("=" * 60)
        
        context = await self.create_context()
        page = await context.new_page()
        
        public_pages = [
            ("/", "Homepage - Hero & Navigation"),
            ("/shoes", "Browse Shoes - Grid & Filters"),
            ("/about", "About Us - Content Layout"),
            ("/donate", "Donate Landing - Call to Action"),
            ("/donate/shoes", "Shoe Donation Form"),
            ("/contact", "Contact Form"),
            ("/login", "Login Form"),
            ("/register", "Registration Form"),
        ]
        
        for path, description in public_pages:
            try:
                await page.goto(f"{self.base_url}{path}")
                await page.wait_for_load_state("networkidle", timeout=15000)
                await self.take_screenshot(page, f"public_{path.replace('/', '_').replace('__', '_home')}", description)
                await asyncio.sleep(1)
            except Exception as e:
                print(f"   ❌ Error loading {path}: {str(e)}")
                
        await context.close()
    
    async def test_authenticated_pages(self):
        """Test authenticated user pages"""
        print("\n👤 TESTING AUTHENTICATED USER PAGES")
        print("=" * 60)
        
        context = await self.create_context()
        page = await context.new_page()
        
        # Login as test user
        if await self.login_user(page, self.test_user["email"], self.test_user["password"]):
            
            auth_pages = [
                ("/account", "User Account Dashboard"),
                ("/cart", "Shopping Cart (Empty)"),
                ("/checkout", "Checkout Process"),
            ]
            
            for path, description in auth_pages:
                try:
                    await page.goto(f"{self.base_url}{path}")
                    await page.wait_for_load_state("networkidle", timeout=15000)
                    await self.take_screenshot(page, f"auth_{path.replace('/', '_')}", description)
                    await asyncio.sleep(1)
                except Exception as e:
                    print(f"   ⚠️  {path}: {str(e)}")
                    
            # Test adding shoes to cart
            try:
                await page.goto(f"{self.base_url}/shoes")
                await page.wait_for_load_state("networkidle")
                
                # Try to add a shoe to cart
                add_buttons = await page.query_selector_all('button:has-text("Get These Free Shoes")')
                if add_buttons:
                    await add_buttons[0].click()
                    await page.wait_for_timeout(2000)
                    await self.take_screenshot(page, "auth_cart_with_item", "Cart with Added Shoe")
                    
            except Exception as e:
                print(f"   ⚠️  Cart test: {str(e)}")
        
        await context.close()
    
    async def test_admin_pages(self):
        """Test admin dashboard pages"""
        print("\n🔐 TESTING ADMIN DASHBOARD (Mobile Layout)")
        print("=" * 60)
        
        context = await self.create_context()
        page = await context.new_page()
        
        # Login as admin
        if await self.login_user(page, self.admin_user["email"], self.admin_user["password"]):
            
            admin_pages = [
                ("/admin", "Admin Dashboard - Overview"),
                ("/admin/shoes", "Shoe Inventory - Table Layout"),
                ("/admin/requests", "Shoe Requests - Management"),
                ("/admin/shoe-donations", "Shoe Donations - Processing"),
                ("/admin/money-donations", "Money Donations - Tracking"),
                ("/admin/users", "User Management - Admin Tools"),
                ("/admin/settings", "Admin Settings - Configuration"),
            ]
            
            for path, description in admin_pages:
                try:
                    await page.goto(f"{self.base_url}{path}")
                    await page.wait_for_load_state("networkidle", timeout=15000)
                    await self.take_screenshot(page, f"admin_{path.replace('/admin/', '').replace('/admin', 'dashboard')}", description)
                    await asyncio.sleep(1)
                except Exception as e:
                    print(f"   ⚠️  {path}: {str(e)}")
        
        await context.close()
    
    async def generate_mobile_ux_report(self):
        """Generate mobile UX focused report"""
        print(f"\n📊 MOBILE UX AUDIT REPORT")
        print("=" * 60)
        
        # Analyze touch target issues
        all_touch_issues = []
        pages_with_issues = 0
        
        for result in self.audit_results:
            if result["touch_issues"]:
                pages_with_issues += 1
                all_touch_issues.extend(result["touch_issues"])
        
        print(f"📱 Pages tested: {len(self.audit_results)}")
        print(f"📸 Screenshots captured: {len(self.audit_results)}")
        print(f"⚠️  Pages with touch issues: {pages_with_issues}")
        print(f"🔍 Total touch target issues: {len(all_touch_issues)}")
        
        # Save detailed report
        report = {
            "audit_date": datetime.now().isoformat(),
            "total_pages": len(self.audit_results),
            "pages_with_issues": pages_with_issues,
            "total_touch_issues": len(all_touch_issues),
            "viewport": self.mobile_viewport,
            "test_credentials": {
                "user_email": self.test_user["email"],
                "admin_email": self.admin_user["email"]
            },
            "pages": self.audit_results
        }
        
        with open(f"{self.screenshots_dir}/mobile_ux_report.json", "w") as f:
            json.dump(report, f, indent=2)
        
        print(f"📁 Screenshots: {self.screenshots_dir}/")
        print(f"📄 Detailed report: {self.screenshots_dir}/mobile_ux_report.json")
        
        # Show critical issues to fix
        if all_touch_issues:
            print(f"\n🔧 CRITICAL TOUCH TARGET FIXES NEEDED:")
            issue_counts = {}
            for issue in all_touch_issues:
                key = issue.split("'")[0] if "'" in issue else issue[:50]
                issue_counts[key] = issue_counts.get(key, 0) + 1
            
            for issue, count in sorted(issue_counts.items(), key=lambda x: x[1], reverse=True)[:10]:
                print(f"   - {issue} ({count} instances)")
        else:
            print(f"\n✅ NO CRITICAL TOUCH TARGET ISSUES FOUND!")
    
    async def cleanup(self):
        """Cleanup browser resources"""
        await self.browser.close()
        await self.playwright.stop()
    
    async def run_full_audit(self):
        """Run complete mobile UX audit with authentication"""
        print("🚀 ENHANCED MOBILE UI/UX AUDIT WITH AUTHENTICATION")
        print("=" * 70)
        
        await self.setup()
        
        try:
            await self.test_public_pages()
            await self.test_authenticated_pages()
            await self.test_admin_pages()
            await self.generate_mobile_ux_report()
        finally:
            await self.cleanup()

async def main():
    auditor = EnhancedMobileAuditor()
    await auditor.run_full_audit()

if __name__ == "__main__":
    asyncio.run(main())
