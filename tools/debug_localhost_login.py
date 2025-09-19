#!/usr/bin/env python3
"""
Debug Localhost Login Issue
"""

import asyncio
from playwright.async_api import async_playwright

async def debug_login():
    print("🔍 DEBUGGING LOCALHOST LOGIN")
    print("=" * 30)
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=False, slow_mo=1000)
        context = await browser.new_context()
        page = await context.new_page()
        
        # Listen for console messages
        page.on("console", lambda msg: print(f"🖥️  CONSOLE: {msg.text}"))
        page.on("pageerror", lambda error: print(f"❌ PAGE ERROR: {error}"))
        
        try:
            print("\n1. 🌐 Loading login page...")
            await page.goto("http://localhost:3000/login")
            await page.wait_for_load_state('networkidle')
            
            # Take screenshot
            await page.screenshot(path="debug_login_page.png")
            print("   📸 Screenshot saved: debug_login_page.png")
            
            # Check page title and content
            title = await page.title()
            print(f"   📄 Page title: {title}")
            
            # Check for login form elements
            email_input = await page.locator('input[type="email"]').count()
            password_input = await page.locator('input[type="password"]').count()
            submit_button = await page.locator('button[type="submit"]').count()
            
            print(f"   📧 Email inputs found: {email_input}")
            print(f"   🔒 Password inputs found: {password_input}")
            print(f"   🔘 Submit buttons found: {submit_button}")
            
            if email_input > 0 and password_input > 0:
                print("\n2. 🔐 Attempting login...")
                
                # Fill login form
                await page.fill('input[type="email"]', 'newstepsfit@gmail.com')
                await page.fill('input[type="password"]', 'Admin123!')
                
                print("   ✅ Credentials filled")
                
                # Click submit and watch for errors
                print("   🔄 Submitting form...")
                await page.click('button[type="submit"]')
                
                # Wait and see what happens
                await page.wait_for_timeout(3000)
                
                # Check final URL
                final_url = page.url
                print(f"   🌐 Final URL: {final_url}")
                
                # Take screenshot after login attempt
                await page.screenshot(path="debug_login_after.png")
                print("   📸 After-login screenshot: debug_login_after.png")
                
                # Check for error messages
                error_messages = await page.locator('.error, [class*="error"], .text-red').all()
                if error_messages:
                    print("   ❌ Error messages found:")
                    for i, error in enumerate(error_messages):
                        text = await error.text_content()
                        print(f"      {i+1}. {text}")
                else:
                    print("   ℹ️  No visible error messages")
                
                # Check if redirected successfully
                if "/login" not in final_url:
                    print("   ✅ Login appears successful (redirected away from login)")
                else:
                    print("   ❌ Still on login page - login failed")
                    
            else:
                print("   ❌ Login form not found properly")
                
        except Exception as e:
            print(f"❌ Debug error: {e}")
            
        finally:
            await browser.close()

if __name__ == "__main__":
    asyncio.run(debug_login())

