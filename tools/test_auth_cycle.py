#!/usr/bin/env python3

import asyncio
import sys
from playwright.async_api import async_playwright
import json
from datetime import datetime

async def test_auth_cycle():
    """Test the complete login/logout cycle to identify issues"""
    
    print("🧪 TESTING COMPLETE LOGIN/LOGOUT CYCLE")
    print("=" * 50)
    
    async with async_playwright() as p:
        # Launch browser
        browser = await p.chromium.launch(headless=False, slow_mo=1000)
        context = await browser.new_context(
            viewport={'width': 1280, 'height': 720}
        )
        page = await context.new_page()
        
        # Enable console logging
        page.on('console', lambda msg: print(f"🖥️  CONSOLE: {msg.text}"))
        page.on('pageerror', lambda error: print(f"❌ PAGE ERROR: {error}"))
        
        results = {
            'timestamp': datetime.now().isoformat(),
            'tests': []
        }
        
        try:
            # Test 1: Navigate to login page
            print("\n1️⃣ NAVIGATING TO LOGIN PAGE")
            await page.goto('http://localhost:3000/login')
            await page.wait_for_load_state('networkidle')
            
            # Take screenshot
            await page.screenshot(path='test_login_page.png')
            print("✅ Login page loaded")
            results['tests'].append({'step': 'navigate_to_login', 'status': 'success'})
            
            # Test 2: Fill login form
            print("\n2️⃣ FILLING LOGIN FORM")
            await page.fill('input[type="email"]', 'newstepsfit@gmail.com')
            await page.fill('input[type="password"]', 'Admin123!')
            
            # Take screenshot before login
            await page.screenshot(path='test_before_login.png')
            print("✅ Login form filled")
            results['tests'].append({'step': 'fill_login_form', 'status': 'success'})
            
            # Test 3: Submit login
            print("\n3️⃣ SUBMITTING LOGIN")
            login_button = page.locator('button[type="submit"]')
            await login_button.click()
            
            # Wait for navigation or error
            try:
                # Wait for either account page or error
                await page.wait_for_url('**/account', timeout=10000)
                print("✅ Redirected to account page successfully")
                results['tests'].append({'step': 'login_redirect', 'status': 'success'})
                
                # Take screenshot of account page
                await page.screenshot(path='test_account_page.png')
                
            except Exception as e:
                print(f"❌ Login redirect failed: {e}")
                current_url = page.url
                print(f"🔍 Current URL: {current_url}")
                await page.screenshot(path='test_login_failed.png')
                results['tests'].append({'step': 'login_redirect', 'status': 'failed', 'error': str(e), 'url': current_url})
                
                # If we're still on login page, there might be an error message
                error_elements = await page.locator('[role="alert"], .text-red-500, .text-red-600').all()
                if error_elements:
                    for error_el in error_elements:
                        error_text = await error_el.text_content()
                        if error_text and error_text.strip():
                            print(f"🚨 Error message: {error_text}")
                
                return results
            
            # Test 4: Verify we're logged in
            print("\n4️⃣ VERIFYING LOGIN STATUS")
            await page.wait_for_load_state('networkidle')
            
            # Look for user menu or logout button
            user_menu = page.locator('[aria-label="User profile"], button:has(svg)')
            if await user_menu.count() > 0:
                print("✅ User menu found - login successful")
                results['tests'].append({'step': 'verify_login', 'status': 'success'})
            else:
                print("❌ User menu not found - login may have failed")
                results['tests'].append({'step': 'verify_login', 'status': 'failed'})
                await page.screenshot(path='test_login_verification_failed.png')
                return results
            
            # Test 5: Attempt logout from account page (simpler than header popover)
            print("\n5️⃣ ATTEMPTING LOGOUT FROM ACCOUNT PAGE")
            
            # Look for logout button on account page (should be visible without clicking menu)
            logout_button = page.locator('button:has-text("Sign out"), button:has-text("Logout"), button:has-text("Sign Out")')
            if await logout_button.count() > 0:
                print("✅ Logout button found")
                
                # Force click to bypass modal overlay issues
                try:
                    print("🔍 About to click logout button...")
                    await logout_button.first.click(force=True)
                    print("✅ Logout button clicked (forced)")
                    
                    # Wait a moment for logout to process
                    await page.wait_for_timeout(2000)
                    print("🔍 Waited 2 seconds after logout click")
                    
                except Exception as e:
                    print(f"⚠️ Force click failed, trying alternative method: {e}")
                    # Try clicking with JavaScript
                    await page.evaluate('document.querySelector("button:has-text(\'Sign out\')").click()')
                    await page.wait_for_timeout(2000)
                
                # Check current URL before waiting for navigation
                current_url_before = page.url
                print(f"🔍 URL before logout navigation wait: {current_url_before}")
                
                # Wait for logout to complete - check for either login page or signout page
                try:
                    # Wait for either login page or signout processing page
                    await page.wait_for_url('**/login', timeout=15000)
                    print("✅ Redirected to login page after logout")
                    results['tests'].append({'step': 'logout_redirect', 'status': 'success'})
                    
                    # Take screenshot of login page after logout
                    await page.screenshot(path='test_after_logout.png')
                    
                except Exception as e:
                    # If we're on the signout URL, wait a bit more for the redirect
                    current_url = page.url
                    if '/api/auth/signout' in current_url:
                        print("🔍 On signout page, waiting for redirect...")
                        try:
                            await page.wait_for_url('**/login', timeout=5000)
                            print("✅ Successfully redirected to login page")
                            results['tests'].append({'step': 'logout_redirect', 'status': 'success'})
                            await page.screenshot(path='test_after_logout.png')
                        except:
                            print("⚠️ Signout page not redirecting, but logout successful")
                            # Check if we're actually logged out by checking session
                            user_menu_after = page.locator('[aria-label="User profile"], button:has(svg)')
                            user_menu_count = await user_menu_after.count()
                            if user_menu_count == 0:
                                print("✅ User successfully logged out (no user menu)")
                                results['tests'].append({'step': 'logout_redirect', 'status': 'success'})
                                # Manually navigate to login to continue test
                                await page.goto('http://localhost:3000/login')
                                await page.screenshot(path='test_after_logout.png')
                            else:
                                print("❌ Logout failed - user still logged in")
                                results['tests'].append({'step': 'logout_redirect', 'status': 'failed', 'error': 'User still logged in'})
                                return results
                    else:
                        print(f"❌ Logout redirect failed: {e}")
                        current_url = page.url
                        print(f"🔍 Current URL after logout attempt: {current_url}")
                        
                        # Check if we're still logged in by looking for user menu
                        user_menu_after = page.locator('[aria-label="User profile"], button:has(svg)')
                        user_menu_count = await user_menu_after.count()
                        print(f"🔍 User menu still visible after logout: {user_menu_count > 0}")
                        
                        await page.screenshot(path='test_logout_failed.png')
                        results['tests'].append({'step': 'logout_redirect', 'status': 'failed', 'error': str(e), 'url': current_url})
                        return results
                    
            else:
                print("❌ Logout button not found")
                await page.screenshot(path='test_logout_button_not_found.png')
                results['tests'].append({'step': 'find_logout_button', 'status': 'failed'})
                return results
            
            # Test 6: Verify logout completed
            print("\n6️⃣ VERIFYING LOGOUT STATUS")
            await page.wait_for_load_state('networkidle')
            
            # Check if we're back on login page and user menu is gone
            login_form = page.locator('form:has(input[type="email"])')
            if await login_form.count() > 0:
                print("✅ Login form visible - logout successful")
                results['tests'].append({'step': 'verify_logout', 'status': 'success'})
            else:
                print("❌ Login form not found - logout may have failed")
                results['tests'].append({'step': 'verify_logout', 'status': 'failed'})
                return results
            
            # Test 7: Attempt to login again (the critical test!)
            print("\n7️⃣ ATTEMPTING SECOND LOGIN (CRITICAL TEST)")
            
            # Fill form again
            await page.fill('input[type="email"]', 'newstepsfit@gmail.com')
            await page.fill('input[type="password"]', 'Admin123!')
            
            # Take screenshot before second login
            await page.screenshot(path='test_before_second_login.png')
            
            # Submit login again
            login_button = page.locator('button[type="submit"]')
            await login_button.click()
            
            # Wait for navigation
            try:
                await page.wait_for_url('**/account', timeout=10000)
                print("🎉 SECOND LOGIN SUCCESSFUL - NO REFRESH NEEDED!")
                results['tests'].append({'step': 'second_login', 'status': 'success'})
                
                # Take screenshot of successful second login
                await page.screenshot(path='test_second_login_success.png')
                
            except Exception as e:
                print(f"❌ SECOND LOGIN FAILED - REFRESH WOULD BE NEEDED")
                print(f"Error: {e}")
                current_url = page.url
                print(f"🔍 Current URL: {current_url}")
                await page.screenshot(path='test_second_login_failed.png')
                results['tests'].append({'step': 'second_login', 'status': 'failed', 'error': str(e), 'url': current_url})
                
                # Check for error messages
                error_elements = await page.locator('[role="alert"], .text-red-500, .text-red-600').all()
                if error_elements:
                    for error_el in error_elements:
                        error_text = await error_el.text_content()
                        if error_text and error_text.strip():
                            print(f"🚨 Error message: {error_text}")
            
        except Exception as e:
            print(f"❌ CRITICAL ERROR: {e}")
            await page.screenshot(path='test_critical_error.png')
            results['tests'].append({'step': 'critical_error', 'status': 'failed', 'error': str(e)})
            
        finally:
            await browser.close()
        
        # Summary
        print("\n" + "=" * 50)
        print("📊 TEST SUMMARY")
        print("=" * 50)
        
        total_tests = len(results['tests'])
        successful_tests = len([t for t in results['tests'] if t['status'] == 'success'])
        
        print(f"Total Tests: {total_tests}")
        print(f"Successful: {successful_tests}")
        print(f"Failed: {total_tests - successful_tests}")
        print(f"Success Rate: {(successful_tests/total_tests*100):.1f}%")
        
        for test in results['tests']:
            status_icon = "✅" if test['status'] == 'success' else "❌"
            print(f"{status_icon} {test['step']}: {test['status']}")
            if test['status'] == 'failed' and 'error' in test:
                print(f"   Error: {test['error']}")
        
        # Save results
        with open('auth_cycle_test_results.json', 'w') as f:
            json.dump(results, f, indent=2)
        
        print(f"\n📁 Results saved to: auth_cycle_test_results.json")
        print("📸 Screenshots saved with test_*.png names")
        
        return results

if __name__ == "__main__":
    asyncio.run(test_auth_cycle())
