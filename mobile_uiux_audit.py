#!/usr/bin/env python3
"""
Comprehensive Mobile UI/UX Audit Script
Tests all pages across public, authenticated, and admin areas
"""

import asyncio
import os
import sys
from playwright.async_api import async_playwright
import json
from datetime import datetime

class MobileUIUXAuditor:
    def __init__(self):
        self.base_url = "http://localhost:3000"
        self.screenshots_dir = "mobile_audit_screenshots"
        self.mobile_viewport = {"width": 375, "height": 812}  # iPhone 13 Pro size
        self.audit_results = []
        
    async def setup(self):
        """Setup browser and create screenshots directory"""
        if not os.path.exists(self.screenshots_dir):
            os.makedirs(self.screenshots_dir)
            
        self.playwright = await async_playwright().start()
        self.browser = await self.playwright.chromium.launch(headless=False)
        self.context = await self.browser.new_context(
            viewport=self.mobile_viewport,
            user_agent="Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1"
        )
        
    async def take_screenshot(self, page, name, description=""):
        """Take a screenshot and record audit info"""
        screenshot_path = f"{self.screenshots_dir}/{name}.png"
        await page.screenshot(path=screenshot_path, full_page=True)
        
        # Analyze page for common mobile UX issues
        issues = await self.analyze_mobile_ux(page)
        
        self.audit_results.append({
            "page": name,
            "description": description,
            "screenshot": screenshot_path,
            "url": page.url,
            "issues": issues,
            "timestamp": datetime.now().isoformat()
        })
        
        print(f"📱 Screenshot: {name} - {description}")
        if issues:
            print(f"   ⚠️  Issues found: {len(issues)}")
            for issue in issues[:3]:  # Show first 3 issues
                print(f"      - {issue}")
        else:
            print(f"   ✅ No major issues detected")
            
    async def analyze_mobile_ux(self, page):
        """Analyze page for mobile UX issues"""
        issues = []
        
        try:
            # Check for horizontal scrolling
            scroll_width = await page.evaluate("document.documentElement.scrollWidth")
            client_width = await page.evaluate("document.documentElement.clientWidth")
            if scroll_width > client_width + 5:  # 5px tolerance
                issues.append(f"Horizontal scrolling detected ({scroll_width}px > {client_width}px)")
            
            # Check for small touch targets
            small_buttons = await page.evaluate("""
                Array.from(document.querySelectorAll('button, a, input[type="submit"], input[type="button"]'))
                    .filter(el => {
                        const rect = el.getBoundingClientRect();
                        return rect.width > 0 && rect.height > 0 && (rect.width < 44 || rect.height < 44);
                    }).length
            """)
            if small_buttons > 0:
                issues.append(f"{small_buttons} touch targets smaller than 44px")
            
            # Check for text readability
            small_text = await page.evaluate("""
                Array.from(document.querySelectorAll('*'))
                    .filter(el => {
                        const style = window.getComputedStyle(el);
                        const fontSize = parseFloat(style.fontSize);
                        return fontSize > 0 && fontSize < 14 && el.innerText && el.innerText.trim().length > 10;
                    }).length
            """)
            if small_text > 5:
                issues.append(f"{small_text} text elements smaller than 14px")
            
            # Check for overlapping elements
            overlapping = await page.evaluate("""
                const elements = Array.from(document.querySelectorAll('*'));
                let overlaps = 0;
                elements.forEach((el, i) => {
                    if (i < elements.length - 1) {
                        const rect1 = el.getBoundingClientRect();
                        const rect2 = elements[i + 1].getBoundingClientRect();
                        if (rect1.right > rect2.left && rect1.left < rect2.right && 
                            rect1.bottom > rect2.top && rect1.top < rect2.bottom) {
                            overlaps++;
                        }
                    }
                });
                return overlaps;
            """)
            if overlapping > 10:
                issues.append(f"Potential element overlapping detected ({overlapping} cases)")
                
        except Exception as e:
            issues.append(f"Analysis error: {str(e)}")
            
        return issues
    
    async def test_public_pages(self):
        """Test all public pages"""
        print("\n🌐 TESTING PUBLIC PAGES")
        print("=" * 50)
        
        page = await self.context.new_page()
        
        public_pages = [
            ("/", "Homepage"),
            ("/about", "About Us"),
            ("/shoes", "Browse Shoes"),
            ("/donate", "Donate Shoes"),
            ("/donate/shoes", "Shoe Donation Form"),
            ("/donate/money", "Money Donation"),
            ("/get-involved", "Get Involved"),
            ("/contact", "Contact Us"),
            ("/login", "Login Page"),
            ("/register", "Registration Page"),
        ]
        
        for path, description in public_pages:
            try:
                await page.goto(f"{self.base_url}{path}")
                await page.wait_for_load_state("networkidle", timeout=10000)
                await self.take_screenshot(page, f"public_{path.replace('/', '_').replace('__', '_home')}", description)
                await asyncio.sleep(1)  # Brief pause between pages
            except Exception as e:
                print(f"   ❌ Error loading {path}: {str(e)}")
                
        await page.close()
    
    async def test_authenticated_pages(self):
        """Test pages that require user authentication"""
        print("\n👤 TESTING AUTHENTICATED USER PAGES")
        print("=" * 50)
        
        page = await self.context.new_page()
        
        try:
            # Login as regular user
            await page.goto(f"{self.base_url}/login")
            await page.wait_for_load_state("networkidle")
            
            # Try to login (you may need to adjust credentials)
            await page.fill('input[type="email"]', 'test@example.com')
            await page.fill('input[type="password"]', 'password123')
            await page.click('button[type="submit"]')
            await page.wait_for_timeout(2000)
            
            # Test authenticated pages
            auth_pages = [
                ("/account", "User Account Dashboard"),
                ("/cart", "Shopping Cart"),
                ("/checkout", "Checkout Process"),
            ]
            
            for path, description in auth_pages:
                try:
                    await page.goto(f"{self.base_url}{path}")
                    await page.wait_for_load_state("networkidle", timeout=10000)
                    await self.take_screenshot(page, f"auth_{path.replace('/', '_')}", description)
                    await asyncio.sleep(1)
                except Exception as e:
                    print(f"   ⚠️  {path}: {str(e)} (may require authentication)")
                    
        except Exception as e:
            print(f"   ⚠️  Authentication flow: {str(e)}")
            
        await page.close()
    
    async def test_admin_pages(self):
        """Test admin dashboard pages"""
        print("\n🔐 TESTING ADMIN DASHBOARD")
        print("=" * 50)
        
        page = await self.context.new_page()
        
        try:
            # Login as admin
            await page.goto(f"{self.base_url}/login")
            await page.wait_for_load_state("networkidle")
            
            # Try admin login
            await page.fill('input[type="email"]', 'admin@newsteps.fit')
            await page.fill('input[type="password"]', 'Admin123!')
            await page.click('button[type="submit"]')
            await page.wait_for_timeout(3000)
            
            # Test admin pages
            admin_pages = [
                ("/admin", "Admin Dashboard"),
                ("/admin/shoes", "Shoe Inventory Management"),
                ("/admin/requests", "Shoe Requests Management"),
                ("/admin/shoe-donations", "Shoe Donations Management"),
                ("/admin/money-donations", "Money Donations Management"),
                ("/admin/users", "User Management"),
                ("/admin/analytics", "Analytics Dashboard"),
                ("/admin/settings", "Admin Settings"),
            ]
            
            for path, description in admin_pages:
                try:
                    await page.goto(f"{self.base_url}{path}")
                    await page.wait_for_load_state("networkidle", timeout=10000)
                    await self.take_screenshot(page, f"admin_{path.replace('/', '_').replace('admin_', '')}", description)
                    await asyncio.sleep(1)
                except Exception as e:
                    print(f"   ⚠️  {path}: {str(e)}")
                    
        except Exception as e:
            print(f"   ⚠️  Admin authentication: {str(e)}")
            
        await page.close()
    
    async def generate_report(self):
        """Generate comprehensive audit report"""
        print(f"\n📊 GENERATING AUDIT REPORT")
        print("=" * 50)
        
        report = {
            "audit_date": datetime.now().isoformat(),
            "total_pages_tested": len(self.audit_results),
            "viewport": self.mobile_viewport,
            "pages": self.audit_results
        }
        
        # Save detailed report
        with open(f"{self.screenshots_dir}/audit_report.json", "w") as f:
            json.dump(report, f, indent=2)
        
        # Generate summary
        total_issues = sum(len(page["issues"]) for page in self.audit_results)
        pages_with_issues = len([page for page in self.audit_results if page["issues"]])
        
        print(f"📱 Pages tested: {len(self.audit_results)}")
        print(f"📸 Screenshots taken: {len(self.audit_results)}")
        print(f"⚠️  Total issues found: {total_issues}")
        print(f"🔍 Pages with issues: {pages_with_issues}")
        print(f"📁 Screenshots saved to: {self.screenshots_dir}/")
        print(f"📄 Detailed report: {self.screenshots_dir}/audit_report.json")
        
        # Show top issues
        all_issues = []
        for page in self.audit_results:
            for issue in page["issues"]:
                all_issues.append(f"{page['page']}: {issue}")
        
        if all_issues:
            print(f"\n🔍 TOP ISSUES TO ADDRESS:")
            for issue in all_issues[:10]:  # Show top 10
                print(f"   - {issue}")
        else:
            print(f"\n✅ NO MAJOR MOBILE UX ISSUES DETECTED!")
    
    async def cleanup(self):
        """Cleanup browser resources"""
        await self.browser.close()
        await self.playwright.stop()
    
    async def run_full_audit(self):
        """Run complete mobile UI/UX audit"""
        print("🚀 STARTING COMPREHENSIVE MOBILE UI/UX AUDIT")
        print("=" * 60)
        
        await self.setup()
        
        try:
            await self.test_public_pages()
            await self.test_authenticated_pages()
            await self.test_admin_pages()
            await self.generate_report()
        finally:
            await self.cleanup()

async def main():
    auditor = MobileUIUXAuditor()
    await auditor.run_full_audit()

if __name__ == "__main__":
    asyncio.run(main())
