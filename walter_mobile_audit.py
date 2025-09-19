#!/usr/bin/env python3
"""
Comprehensive Mobile UI/UX Audit using Walter's account
Tests both localhost and production environments
"""

import asyncio
import os
import sys
from playwright.async_api import async_playwright
import json
from datetime import datetime

class WalterMobileAuditor:
    def __init__(self, environment="localhost"):
        if environment == "localhost":
            self.base_url = "http://localhost:3000"
            self.env_name = "localhost"
        else:
            self.base_url = "https://newsteps.fit"
            self.env_name = "production"
            
        self.screenshots_dir = f"walter_mobile_audit_{self.env_name}"
        self.mobile_viewport = {"width": 375, "height": 812}  # iPhone 13 Pro
        self.audit_results = []
        
        # Walter's credentials
        self.test_user = {
            "email": "walterzhang10@gmail.com",
            "password": "TestPass123!"
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
        """Login as a user with better form handling"""
        try:
            await page.goto(f"{self.base_url}/login")
            await page.wait_for_load_state("networkidle")
            
            # Fill login form with more specific selectors
            await page.fill('input[name="email"], input[type="email"]', email)
            await page.fill('input[name="password"], input[type="password"]', password)
            
            # Submit form and wait for navigation
            await Promise.all([
                page.wait_for_navigation(timeout=10000),
                page.click('button[type="submit"], button:has-text("Sign in"), button:has-text("Login")')
            ])
            
            # Check if login was successful
            await page.wait_for_timeout(2000)
            current_url = page.url
            if "/login" not in current_url and "/register" not in current_url:
                print(f"   ✅ Login successful for {email}")
                return True
            else:
                print(f"   ❌ Login failed for {email} - still on login page")
                return False
                
        except Exception as e:
            print(f"   ❌ Login error for {email}: {str(e)}")
            return False
    
    async def test_public_pages(self):
        """Test public pages with mobile focus"""
        print(f"\n🌐 TESTING PUBLIC PAGES - {self.env_name.upper()}")
        print("=" * 60)
        
        context = await self.create_context()
        page = await context.new_page()
        
        public_pages = [
            ("/", "Homepage - Hero & Mobile Navigation"),
            ("/shoes", "Browse Shoes - Grid & Touch Targets"),
            ("/about", "About Us - Content & Links"),
            ("/donate", "Donate Landing - CTA Buttons"),
            ("/contact", "Contact Form - Input Fields"),
            ("/login", "Login Form - Touch Targets"),
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
        print(f"\n👤 TESTING AUTHENTICATED PAGES - {self.env_name.upper()}")
        print("=" * 60)
        
        context = await self.create_context()
        page = await context.new_page()
        
        # Login as Walter
        if await self.login_user(page, self.test_user["email"], self.test_user["password"]):
            
            auth_pages = [
                ("/account", "User Account Dashboard"),
                ("/cart", "Shopping Cart"),
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
        
        await context.close()
    
    async def test_admin_pages(self):
        """Test admin dashboard pages"""
        print(f"\n🔐 TESTING ADMIN DASHBOARD - {self.env_name.upper()}")
        print("=" * 60)
        
        context = await self.create_context()
        page = await context.new_page()
        
        # Login as admin
        if await self.login_user(page, self.admin_user["email"], self.admin_user["password"]):
            
            admin_pages = [
                ("/admin", "Admin Dashboard - Mobile Layout"),
                ("/admin/shoes", "Shoe Inventory - Table Mobile"),
                ("/admin/requests", "Shoe Requests - Mobile Management"),
                ("/admin/settings", "Admin Settings - Mobile Config"),
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
    
    async def generate_report(self):
        """Generate mobile UX report"""
        print(f"\n📊 MOBILE UX REPORT - {self.env_name.upper()}")
        print("=" * 60)
        
        # Count issues
        total_issues = sum(len(result["touch_issues"]) for result in self.audit_results)
        pages_with_issues = len([r for r in self.audit_results if r["touch_issues"]])
        
        print(f"📱 Pages tested: {len(self.audit_results)}")
        print(f"📸 Screenshots: {len(self.audit_results)}")
        print(f"⚠️  Pages with issues: {pages_with_issues}")
        print(f"🔍 Total touch issues: {total_issues}")
        
        # Save report
        report = {
            "environment": self.env_name,
            "base_url": self.base_url,
            "audit_date": datetime.now().isoformat(),
            "total_pages": len(self.audit_results),
            "total_touch_issues": total_issues,
            "viewport": self.mobile_viewport,
            "test_user": self.test_user["email"],
            "pages": self.audit_results
        }
        
        with open(f"{self.screenshots_dir}/mobile_ux_report.json", "w") as f:
            json.dump(report, f, indent=2)
        
        print(f"📁 Screenshots: {self.screenshots_dir}/")
        print(f"📄 Report: {self.screenshots_dir}/mobile_ux_report.json")
        
        # Show critical issues
        if total_issues > 0:
            print(f"\n🔧 CRITICAL FIXES NEEDED:")
            all_issues = []
            for result in self.audit_results:
                all_issues.extend(result["touch_issues"])
            
            # Group similar issues
            issue_counts = {}
            for issue in all_issues:
                key = issue.split("'")[0] if "'" in issue else issue[:30]
                issue_counts[key] = issue_counts.get(key, 0) + 1
            
            for issue, count in sorted(issue_counts.items(), key=lambda x: x[1], reverse=True)[:8]:
                print(f"   - {issue} ({count} instances)")
        else:
            print(f"\n✅ NO CRITICAL TOUCH TARGET ISSUES!")
    
    async def cleanup(self):
        """Cleanup browser resources"""
        await self.browser.close()
        await self.playwright.stop()
    
    async def run_audit(self):
        """Run complete mobile audit"""
        print(f"🚀 WALTER'S MOBILE UI/UX AUDIT - {self.env_name.upper()}")
        print("=" * 70)
        
        await self.setup()
        
        try:
            await self.test_public_pages()
            await self.test_authenticated_pages()
            await self.test_admin_pages()
            await self.generate_report()
        finally:
            await self.cleanup()

async def main():
    # Test localhost first
    print("🏠 TESTING LOCALHOST ENVIRONMENT")
    localhost_auditor = WalterMobileAuditor("localhost")
    await localhost_auditor.run_audit()
    
    print("\n" + "="*80 + "\n")
    
    # Test production
    print("🌐 TESTING PRODUCTION ENVIRONMENT")
    prod_auditor = WalterMobileAuditor("production")
    await prod_auditor.run_audit()

if __name__ == "__main__":
    asyncio.run(main())
