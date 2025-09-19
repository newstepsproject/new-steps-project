#!/usr/bin/env python3

import asyncio
import json
from playwright.async_api import async_playwright

async def test_hydration_fix():
    """Test that hydration errors are fixed"""
    
    print("🧪 TESTING HYDRATION FIX")
    print("=" * 40)
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        
        # Collect console errors
        console_errors = []
        page.on("console", lambda msg: console_errors.append(msg.text) if msg.type == "error" else None)
        
        try:
            print("1️⃣ NAVIGATING TO HOMEPAGE")
            await page.goto('http://localhost:3000')
            await page.wait_for_load_state('networkidle')
            
            # Wait a bit for any hydration to complete
            await page.wait_for_timeout(2000)
            
            print("2️⃣ CHECKING FOR HYDRATION ERRORS")
            hydration_errors = [error for error in console_errors if 'hydration' in error.lower() or 'mismatch' in error.lower()]
            
            if hydration_errors:
                print("❌ HYDRATION ERRORS FOUND:")
                for error in hydration_errors:
                    print(f"   - {error}")
                return False
            else:
                print("✅ NO HYDRATION ERRORS FOUND")
            
            print("3️⃣ CHECKING CART BADGE BEHAVIOR")
            # Check if cart badge is properly hidden when empty
            cart_badge = page.locator('[data-testid="cart-badge"], .bg-energy')
            badge_count = await cart_badge.count()
            
            if badge_count == 0:
                print("✅ Cart badge properly hidden when empty")
            else:
                badge_text = await cart_badge.first.text_content()
                print(f"⚠️ Cart badge visible with text: '{badge_text}'")
            
            print("4️⃣ CHECKING MOBILE MENU BUTTON")
            mobile_menu_button = page.locator('button[aria-label*="menu"]')
            button_exists = await mobile_menu_button.count() > 0
            
            if button_exists:
                print("✅ Mobile menu button found")
                # Check button classes
                button_class = await mobile_menu_button.get_attribute('class')
                if 'p-3' in button_class:
                    print("✅ Mobile menu button has correct padding (p-3)")
                else:
                    print(f"⚠️ Mobile menu button padding: {button_class}")
            else:
                print("❌ Mobile menu button not found")
            
            await page.screenshot(path='test_hydration_fix.png')
            
            print("\n📊 RESULTS:")
            print(f"Console Errors: {len(console_errors)}")
            print(f"Hydration Errors: {len(hydration_errors)}")
            print(f"Cart Badge Count: {badge_count}")
            print(f"Mobile Button: {'✅' if button_exists else '❌'}")
            
            success = len(hydration_errors) == 0
            print(f"\n🎯 HYDRATION FIX: {'✅ SUCCESS' if success else '❌ FAILED'}")
            
            return success
            
        except Exception as e:
            print(f"❌ ERROR: {e}")
            return False
        finally:
            await browser.close()

if __name__ == '__main__':
    success = asyncio.run(test_hydration_fix())
    exit(0 if success else 1)
