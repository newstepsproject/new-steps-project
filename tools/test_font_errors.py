#!/usr/bin/env python3

import asyncio
import sys
from playwright.async_api import async_playwright

async def test_font_errors():
    """Test if font 404 errors are resolved"""
    
    print("🔍 TESTING FONT ERRORS")
    print("=" * 30)
    
    async with async_playwright() as p:
        # Launch browser
        browser = await p.chromium.launch(headless=False, slow_mo=500)
        context = await browser.new_context(
            viewport={'width': 1280, 'height': 720}
        )
        page = await context.new_page()
        
        # Collect console messages
        console_messages = []
        error_messages = []
        
        def handle_console(msg):
            console_messages.append(msg.text)
            print(f"🖥️  CONSOLE: {msg.text}")
            
        def handle_error(error):
            error_messages.append(str(error))
            print(f"❌ PAGE ERROR: {error}")
            
        page.on('console', handle_console)
        page.on('pageerror', handle_error)
        
        try:
            # Navigate to homepage
            print("\n1️⃣ NAVIGATING TO HOMEPAGE")
            await page.goto('http://localhost:3000')
            await page.wait_for_load_state('networkidle')
            
            # Wait a bit for any delayed font loading
            await page.wait_for_timeout(3000)
            
            # Take screenshot
            await page.screenshot(path='test_font_errors.png')
            print("✅ Homepage loaded")
            
            # Check for font-related errors
            font_errors = []
            for msg in console_messages:
                if 'font' in msg.lower() and ('404' in msg or 'not found' in msg.lower() or 'err_aborted' in msg.lower()):
                    font_errors.append(msg)
            
            # Check for specific font files
            woff2_errors = []
            for msg in console_messages:
                if 'woff2' in msg.lower() and ('404' in msg or 'not found' in msg.lower() or 'err_aborted' in msg.lower()):
                    woff2_errors.append(msg)
            
            print(f"\n📊 RESULTS:")
            print(f"Total console messages: {len(console_messages)}")
            print(f"Font-related errors: {len(font_errors)}")
            print(f"WOFF2 file errors: {len(woff2_errors)}")
            
            if font_errors:
                print(f"\n❌ FONT ERRORS FOUND:")
                for error in font_errors:
                    print(f"   - {error}")
            else:
                print(f"\n✅ NO FONT ERRORS FOUND!")
                
            if woff2_errors:
                print(f"\n❌ WOFF2 ERRORS FOUND:")
                for error in woff2_errors:
                    print(f"   - {error}")
            else:
                print(f"\n✅ NO WOFF2 ERRORS FOUND!")
            
            # Check for MobilePerformanceOptimizer debug message
            debug_messages = [msg for msg in console_messages if 'MobilePerformanceOptimizer' in msg]
            if debug_messages:
                print(f"\n✅ MobilePerformanceOptimizer loaded:")
                for msg in debug_messages:
                    print(f"   - {msg}")
            else:
                print(f"\n⚠️ MobilePerformanceOptimizer debug message not found")
            
            # Overall result
            if not font_errors and not woff2_errors:
                print(f"\n🎉 SUCCESS: No font loading errors detected!")
                return True
            else:
                print(f"\n❌ FAILURE: Font loading errors still present")
                return False
                
        except Exception as e:
            print(f"❌ CRITICAL ERROR: {e}")
            await page.screenshot(path='test_font_errors_failed.png')
            return False
            
        finally:
            await browser.close()

if __name__ == "__main__":
    result = asyncio.run(test_font_errors())
    sys.exit(0 if result else 1)
