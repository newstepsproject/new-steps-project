#!/usr/bin/env python3
"""
Real Login Test - Comprehensive Browser Testing
"""

import asyncio
from playwright.async_api import async_playwright
import time

async def real_login_test():
    print("🔍 COMPREHENSIVE REAL LOGIN TEST")
    print("=" * 35)
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=False, slow_mo=1500)
        context = await browser.new_context()
        page = await context.new_page()
        
        # Capture all console messages and errors
        console_messages = []
        errors = []
        
        page.on("console", lambda msg: console_messages.append(f"{msg.type}: {msg.text}"))
        page.on("pageerror", lambda error: errors.append(str(error)))
        page.on("requestfailed", lambda request: print(f"❌ REQUEST FAILED: {request.url} - {request.failure}"))
        
        try:
            print("\n1. 🌐 Loading localhost homepage...")
            await page.goto("http://localhost:3000")
            await page.wait_for_load_state('networkidle')
            
            homepage_title = await page.title()
            print(f"   Homepage title: {homepage_title}")
            
            print("\n2. 🔐 Navigating to login page...")
            await page.goto("http://localhost:3000/login")
            await page.wait_for_load_state('networkidle')
            
            login_title = await page.title()
            print(f"   Login page title: {login_title}")
            
            # Take screenshot of login page
            await page.screenshot(path="real_test_login_page.png")
            print("   📸 Login page screenshot: real_test_login_page.png")
            
            print("\n3. 🔍 Checking login form elements...")
            
            # Check form elements exist
            email_input = page.locator('input[type="email"]')
            password_input = page.locator('input[type="password"]')
            submit_button = page.locator('button[type="submit"]')
            
            email_count = await email_input.count()
            password_count = await password_input.count()
            submit_count = await submit_button.count()
            
            print(f"   Email inputs: {email_count}")
            print(f"   Password inputs: {password_count}")
            print(f"   Submit buttons: {submit_count}")
            
            if email_count == 0 or password_count == 0 or submit_count == 0:
                print("   ❌ Login form elements missing!")
                return False
            
            print("\n4. 🔑 Filling login credentials...")
            
            # Clear and fill email
            await email_input.clear()
            await email_input.fill('newstepsfit@gmail.com')
            email_value = await email_input.input_value()
            print(f"   Email filled: {email_value}")
            
            # Clear and fill password
            await password_input.clear()
            await password_input.fill('Admin123!')
            password_value = await password_input.input_value()
            print(f"   Password filled: {'*' * len(password_value)}")
            
            print("\n5. 🚀 Submitting login form...")
            
            # Get current URL before submit
            before_url = page.url
            print(f"   URL before submit: {before_url}")
            
            # Submit the form
            await submit_button.click()
            print("   ✅ Submit button clicked")
            
            # Wait for navigation or response
            print("   ⏳ Waiting for response...")
            await page.wait_for_timeout(5000)  # Wait 5 seconds
            
            # Check final URL
            after_url = page.url
            print(f"   URL after submit: {after_url}")
            
            # Take screenshot after login attempt
            await page.screenshot(path="real_test_after_login.png")
            print("   📸 After login screenshot: real_test_after_login.png")
            
            print("\n6. 🔍 Analyzing login result...")
            
            # Check if we're still on login page
            if "/login" in after_url:
                print("   ❌ STILL ON LOGIN PAGE - Login failed")
                
                # Look for error messages
                error_selectors = [
                    '.error', '[class*="error"]', '.text-red-500', '.text-red-600',
                    '[role="alert"]', '.alert-error', '.form-error'
                ]
                
                for selector in error_selectors:
                    error_elements = await page.locator(selector).all()
                    if error_elements:
                        for element in error_elements:
                            text = await element.text_content()
                            if text and text.strip():
                                print(f"   🚨 Error message: {text.strip()}")
                
                # Check console for errors
                print("   📋 Console messages during login:")
                for msg in console_messages[-10:]:  # Last 10 messages
                    if 'error' in msg.lower() or 'fail' in msg.lower():
                        print(f"      ❌ {msg}")
                    elif 'login' in msg.lower():
                        print(f"      ℹ️  {msg}")
                
                return False
                
            else:
                print("   ✅ REDIRECTED AWAY FROM LOGIN - Login appears successful")
                print(f"   🎯 Final destination: {after_url}")
                
                # Try to access admin dashboard
                print("\n7. 👑 Testing admin dashboard access...")
                await page.goto("http://localhost:3000/admin")
                await page.wait_for_load_state('networkidle')
                
                admin_url = page.url
                admin_title = await page.title()
                
                print(f"   Admin URL: {admin_url}")
                print(f"   Admin title: {admin_title}")
                
                if "/admin" in admin_url and "/login" not in admin_url:
                    print("   ✅ ADMIN DASHBOARD ACCESS SUCCESSFUL")
                    await page.screenshot(path="real_test_admin_dashboard.png")
                    print("   📸 Admin dashboard screenshot: real_test_admin_dashboard.png")
                    return True
                else:
                    print("   ❌ ADMIN DASHBOARD ACCESS FAILED")
                    return False
            
        except Exception as e:
            print(f"❌ Test error: {e}")
            return False
            
        finally:
            print(f"\n📋 FINAL CONSOLE MESSAGES ({len(console_messages)} total):")
            for msg in console_messages[-5:]:  # Last 5 messages
                print(f"   {msg}")
            
            if errors:
                print(f"\n🚨 PAGE ERRORS ({len(errors)} total):")
                for error in errors:
                    print(f"   ❌ {error}")
            
            await browser.close()

async def main():
    success = await real_login_test()
    
    print(f"\n🎯 FINAL RESULT:")
    if success:
        print("✅ LOGIN TEST PASSED - Authentication working correctly")
    else:
        print("❌ LOGIN TEST FAILED - Authentication not working")
        print("\n🔧 TROUBLESHOOTING STEPS:")
        print("1. Check screenshots for visual clues")
        print("2. Verify admin user exists in database")
        print("3. Check NextAuth configuration")
        print("4. Verify environment variables")
    
    return success

if __name__ == "__main__":
    asyncio.run(main())

