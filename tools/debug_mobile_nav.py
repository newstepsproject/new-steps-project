#!/usr/bin/env python3
"""
Debug Mobile Navigation Button Visibility
"""

import asyncio
from playwright.async_api import async_playwright

async def debug_mobile_nav():
    print("🔍 DEBUGGING MOBILE NAVIGATION BUTTON")
    print("=" * 40)
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=False, slow_mo=1000)
        
        # Mobile viewport
        context = await browser.new_context(
            viewport={'width': 375, 'height': 667},
            user_agent='Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)'
        )
        page = await context.new_page()
        
        try:
            # Go to homepage
            await page.goto("http://localhost:3001")
            await page.wait_for_load_state('networkidle')
            
            print("📱 Page loaded on mobile viewport (375x667)")
            
            # Take screenshot for debugging
            await page.screenshot(path="debug_mobile_nav_before.png")
            print("📸 Screenshot saved: debug_mobile_nav_before.png")
            
            # Check all possible mobile menu button selectors
            selectors = [
                'button[aria-label*="menu"]',
                'button[aria-label*="Menu"]', 
                '.hamburger',
                'button:has(svg)',
                'button.md\\:hidden',
                '[class*="md:hidden"] button',
                'button:has(.lucide-menu)',
                'button:has(.lucide-x)'
            ]
            
            print("\n🔍 Checking mobile menu button selectors:")
            for selector in selectors:
                try:
                    count = await page.locator(selector).count()
                    if count > 0:
                        element = page.locator(selector).first
                        is_visible = await element.is_visible()
                        is_enabled = await element.is_enabled()
                        box = await element.bounding_box()
                        
                        print(f"  ✅ {selector}: {count} found")
                        print(f"     - Visible: {is_visible}")
                        print(f"     - Enabled: {is_enabled}")
                        print(f"     - Bounding box: {box}")
                        
                        if count > 0 and is_visible:
                            print(f"     - 🎯 FOUND WORKING BUTTON: {selector}")
                            
                            # Try to click it
                            try:
                                await element.click()
                                await page.wait_for_timeout(1000)
                                print(f"     - ✅ Click successful!")
                                
                                # Take screenshot after click
                                await page.screenshot(path="debug_mobile_nav_after_click.png")
                                print("     - 📸 Screenshot after click: debug_mobile_nav_after_click.png")
                                
                            except Exception as click_error:
                                print(f"     - ❌ Click failed: {click_error}")
                    else:
                        print(f"  ❌ {selector}: 0 found")
                        
                except Exception as e:
                    print(f"  ⚠️  {selector}: Error - {e}")
            
            # Check CSS classes and computed styles
            print("\n🎨 Checking CSS classes on mobile menu buttons:")
            mobile_buttons = await page.locator('button').all()
            for i, button in enumerate(mobile_buttons):
                try:
                    class_name = await button.get_attribute('class')
                    if class_name and ('md:hidden' in class_name or 'menu' in class_name.lower()):
                        print(f"  Button {i}: {class_name}")
                        
                        # Get computed styles
                        display = await button.evaluate('el => getComputedStyle(el).display')
                        visibility = await button.evaluate('el => getComputedStyle(el).visibility')
                        opacity = await button.evaluate('el => getComputedStyle(el).opacity')
                        
                        print(f"    - Display: {display}")
                        print(f"    - Visibility: {visibility}")  
                        print(f"    - Opacity: {opacity}")
                        
                except Exception as e:
                    print(f"  Button {i}: Error getting styles - {e}")
            
        except Exception as e:
            print(f"❌ Error during debugging: {e}")
            
        finally:
            await browser.close()

if __name__ == "__main__":
    asyncio.run(debug_mobile_nav())

