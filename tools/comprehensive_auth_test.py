#!/usr/bin/env python3
"""
Comprehensive Authentication Testing Script
Tests login/logout functionality across all scenarios:
- Public website (desktop & mobile)
- Admin dashboard (desktop & mobile) 
- All navigation menu locations
- Console error detection
"""

import asyncio
from playwright.async_api import async_playwright
import json
from datetime import datetime
import os

class AuthenticationTester:
    def __init__(self):
        self.base_url = "http://localhost:3000"
        self.admin_email = "newstepsfit@gmail.com"
        self.admin_password = "Admin123!"
        self.results = []
        self.screenshots_dir = "auth_test_screenshots"
        
    async def setup_browser(self, mobile=False):
        """Setup browser with appropriate viewport"""
        playwright = await async_playwright().start()
        
        if mobile:
            # iPhone 12 Pro viewport
            browser = await playwright.chromium.launch(headless=False, slow_mo=1000)
            context = await browser.new_context(
                viewport={'width': 390, 'height': 844},
                user_agent='Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15'
            )
        else:
            # Desktop viewport
            browser = await playwright.chromium.launch(headless=False, slow_mo=1000)
            context = await browser.new_context(
                viewport={'width': 1280, 'height': 720}
            )
            
        page = await context.new_page()
        
        # Listen for console errors
        console_errors = []
        page.on("console", lambda msg: console_errors.append(msg.text) if msg.type == "error" else None)
        
        return playwright, browser, context, page, console_errors

    async def take_screenshot(self, page, name):
        """Take screenshot for debugging"""
        os.makedirs(self.screenshots_dir, exist_ok=True)
        screenshot_path = f"{self.screenshots_dir}/{name}.png"
        await page.screenshot(path=screenshot_path)
        return screenshot_path

    async def login_admin(self, page, console_errors):
        """Login as admin user"""
        try:
            print(f"🔑 Logging in as admin...")
            
            # Go to login page
            await page.goto(f"{self.base_url}/login")
            await page.wait_for_load_state('networkidle')
            
            # Take screenshot of login page
            await self.take_screenshot(page, "01_login_page")
            
            # Fill login form
            await page.fill('input[type="email"]', self.admin_email)
            await page.fill('input[type="password"]', self.admin_password)
            
            # Submit login
            await page.click('button[type="submit"]')
            await page.wait_for_timeout(3000)
            
            # Check if redirected properly
            current_url = page.url
            await self.take_screenshot(page, "02_after_login")
            
            # Check for successful login indicators
            is_logged_in = False
            try:
                # Look for user menu or account elements
                await page.wait_for_selector('[aria-label="User profile"], .user-menu, text="Account"', timeout=5000)
                is_logged_in = True
            except:
                pass
                
            return {
                'success': is_logged_in,
                'final_url': current_url,
                'console_errors': list(console_errors),
                'expected_redirect': '/account' in current_url or '/admin' in current_url
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'console_errors': list(console_errors)
            }

    async def test_logout_location(self, page, console_errors, location_name, selector):
        """Test logout from specific location"""
        try:
            print(f"🚪 Testing logout from: {location_name}")
            
            # Take screenshot before logout
            await self.take_screenshot(page, f"03_before_logout_{location_name.lower().replace(' ', '_')}")
            
            # Find and click logout element
            if selector.startswith('text='):
                await page.click(selector)
            else:
                # For complex selectors, try multiple approaches
                try:
                    await page.click(selector)
                except:
                    # Try clicking the text directly
                    await page.click('text="Sign out"')
            
            await page.wait_for_timeout(3000)
            
            # Check if redirected to login
            current_url = page.url
            await self.take_screenshot(page, f"04_after_logout_{location_name.lower().replace(' ', '_')}")
            
            # Verify logout success
            is_logged_out = '/login' in current_url
            
            return {
                'location': location_name,
                'success': is_logged_out,
                'final_url': current_url,
                'console_errors': list(console_errors)
            }
            
        except Exception as e:
            return {
                'location': location_name,
                'success': False,
                'error': str(e),
                'console_errors': list(console_errors)
            }

    async def test_public_website_auth(self, mobile=False):
        """Test authentication on public website"""
        device_type = "mobile" if mobile else "desktop"
        print(f"\n🌐 Testing PUBLIC WEBSITE - {device_type.upper()}")
        
        playwright, browser, context, page, console_errors = await self.setup_browser(mobile)
        
        try:
            # Test login
            login_result = await self.login_admin(page, console_errors)
            
            if login_result['success']:
                # Test logout from header menu
                if mobile:
                    # Mobile: might need to open mobile menu first
                    try:
                        await page.click('button[aria-label*="menu"], .mobile-menu-button')
                        await page.wait_for_timeout(1000)
                    except:
                        pass
                
                logout_result = await self.test_logout_location(
                    page, console_errors, 
                    f"Public Header ({device_type})", 
                    'text="Sign out"'
                )
            else:
                logout_result = {'success': False, 'error': 'Login failed'}
            
            return {
                'test_type': f'public_website_{device_type}',
                'login': login_result,
                'logout': logout_result
            }
            
        finally:
            await browser.close()
            await playwright.stop()

    async def test_admin_dashboard_auth(self, mobile=False):
        """Test authentication on admin dashboard"""
        device_type = "mobile" if mobile else "desktop"
        print(f"\n🛠️ Testing ADMIN DASHBOARD - {device_type.upper()}")
        
        playwright, browser, context, page, console_errors = await self.setup_browser(mobile)
        
        try:
            # Login first
            login_result = await self.login_admin(page, console_errors)
            
            if login_result['success']:
                # Navigate to admin dashboard
                await page.goto(f"{self.base_url}/admin")
                await page.wait_for_load_state('networkidle')
                await self.take_screenshot(page, f"05_admin_dashboard_{device_type}")
                
                # Test logout from admin interface
                if mobile:
                    # Mobile admin might have different logout location
                    logout_result = await self.test_logout_location(
                        page, console_errors,
                        f"Admin Mobile Menu ({device_type})",
                        'text="Sign out"'
                    )
                else:
                    # Desktop admin logout
                    logout_result = await self.test_logout_location(
                        page, console_errors,
                        f"Admin Desktop Menu ({device_type})",
                        'text="Sign out"'
                    )
            else:
                logout_result = {'success': False, 'error': 'Login failed'}
            
            return {
                'test_type': f'admin_dashboard_{device_type}',
                'login': login_result,
                'logout': logout_result
            }
            
        finally:
            await browser.close()
            await playwright.stop()

    async def test_account_page_logout(self):
        """Test logout from account page"""
        print(f"\n👤 Testing ACCOUNT PAGE LOGOUT")
        
        playwright, browser, context, page, console_errors = await self.setup_browser()
        
        try:
            # Login first
            login_result = await self.login_admin(page, console_errors)
            
            if login_result['success']:
                # Navigate to account page
                await page.goto(f"{self.base_url}/account")
                await page.wait_for_load_state('networkidle')
                await self.take_screenshot(page, "06_account_page")
                
                # Test logout from account page
                logout_result = await self.test_logout_location(
                    page, console_errors,
                    "Account Page",
                    'button:has-text("Sign Out"), text="Sign Out"'
                )
            else:
                logout_result = {'success': False, 'error': 'Login failed'}
            
            return {
                'test_type': 'account_page',
                'login': login_result,
                'logout': logout_result
            }
            
        finally:
            await browser.close()
            await playwright.stop()

    async def run_all_tests(self):
        """Run comprehensive authentication tests"""
        print("🚀 STARTING COMPREHENSIVE AUTHENTICATION TESTING")
        print("=" * 50)
        
        # Test all scenarios
        tests = [
            self.test_public_website_auth(mobile=False),
            self.test_public_website_auth(mobile=True),
            self.test_admin_dashboard_auth(mobile=False),
            self.test_admin_dashboard_auth(mobile=True),
            self.test_account_page_logout()
        ]
        
        results = []
        for test in tests:
            try:
                result = await test
                results.append(result)
                
                # Print immediate results
                test_name = result['test_type']
                login_success = result['login']['success']
                logout_success = result['logout']['success']
                
                print(f"\n✅ {test_name}:")
                print(f"   Login: {'✅' if login_success else '❌'}")
                print(f"   Logout: {'✅' if logout_success else '❌'}")
                
                if not login_success:
                    print(f"   Login Error: {result['login'].get('error', 'Unknown')}")
                if not logout_success:
                    print(f"   Logout Error: {result['logout'].get('error', 'Unknown')}")
                    
                # Check for console errors
                login_errors = result['login'].get('console_errors', [])
                logout_errors = result['logout'].get('console_errors', [])
                
                if login_errors:
                    print(f"   Login Console Errors: {len(login_errors)}")
                if logout_errors:
                    print(f"   Logout Console Errors: {len(logout_errors)}")
                    
            except Exception as e:
                print(f"❌ Test failed: {str(e)}")
                results.append({'error': str(e)})
        
        # Generate summary report
        await self.generate_report(results)
        return results

    async def generate_report(self, results):
        """Generate comprehensive test report"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        
        # Calculate statistics
        total_tests = len([r for r in results if 'test_type' in r])
        successful_logins = len([r for r in results if r.get('login', {}).get('success', False)])
        successful_logouts = len([r for r in results if r.get('logout', {}).get('success', False)])
        
        # Collect all console errors
        all_errors = []
        for result in results:
            if 'login' in result:
                all_errors.extend(result['login'].get('console_errors', []))
            if 'logout' in result:
                all_errors.extend(result['logout'].get('console_errors', []))
        
        unique_errors = list(set(all_errors))
        
        report = {
            'timestamp': timestamp,
            'summary': {
                'total_tests': total_tests,
                'successful_logins': successful_logins,
                'successful_logouts': successful_logouts,
                'login_success_rate': f"{(successful_logins/total_tests*100):.1f}%" if total_tests > 0 else "0%",
                'logout_success_rate': f"{(successful_logouts/total_tests*100):.1f}%" if total_tests > 0 else "0%",
                'console_errors_found': len(unique_errors)
            },
            'console_errors': unique_errors,
            'detailed_results': results
        }
        
        # Save report
        report_file = f"auth_test_results_{timestamp}.json"
        with open(report_file, 'w') as f:
            json.dump(report, f, indent=2)
        
        # Print summary
        print("\n" + "=" * 50)
        print("📊 COMPREHENSIVE AUTHENTICATION TEST SUMMARY")
        print("=" * 50)
        print(f"Total Tests: {total_tests}")
        print(f"Login Success Rate: {report['summary']['login_success_rate']}")
        print(f"Logout Success Rate: {report['summary']['logout_success_rate']}")
        print(f"Console Errors Found: {len(unique_errors)}")
        
        if unique_errors:
            print(f"\n🚨 CONSOLE ERRORS DETECTED:")
            for i, error in enumerate(unique_errors[:5], 1):  # Show first 5 errors
                print(f"   {i}. {error[:100]}...")
        
        print(f"\n📁 Detailed report saved: {report_file}")
        print(f"📸 Screenshots saved in: {self.screenshots_dir}/")
        
        return report

async def main():
    """Main test execution"""
    tester = AuthenticationTester()
    await tester.run_all_tests()

if __name__ == "__main__":
    asyncio.run(main())
