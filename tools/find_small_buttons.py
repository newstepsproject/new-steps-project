#!/usr/bin/env python3
"""
Find Small Touch Target Buttons
"""

import asyncio
from playwright.async_api import async_playwright

async def find_small_buttons():
    print("🔍 FINDING SMALL TOUCH TARGET BUTTONS")
    print("=" * 40)
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=False, slow_mo=500)
        
        # Mobile viewport
        context = await browser.new_context(
            viewport={'width': 375, 'height': 667},
            user_agent='Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)'
        )
        page = await context.new_page()
        
        try:
            # Go to shoes page (where the issue was found)
            await page.goto("http://localhost:3001/shoes")
            await page.wait_for_load_state('networkidle')
            
            print("📱 Analyzing buttons on /shoes page")
            
            # Get all buttons and clickable elements
            buttons = await page.locator('button, a[role="button"], input[type="button"], input[type="submit"]').all()
            
            print(f"\n📊 Found {len(buttons)} buttons/clickable elements")
            print("\n🔍 Analyzing button sizes:")
            
            small_buttons = []
            
            for i, button in enumerate(buttons):
                try:
                    # Get button info
                    box = await button.bounding_box()
                    if box:
                        width = box['width']
                        height = box['height']
                        
                        # Get button text and classes
                        text = await button.text_content()
                        text = text.strip()[:30] if text else ""
                        
                        class_attr = await button.get_attribute('class')
                        tag_name = await button.evaluate('el => el.tagName')
                        
                        # Check if button is too small
                        is_small = width < 44 or height < 44
                        
                        status = "❌ TOO SMALL" if is_small else "✅ OK"
                        
                        print(f"  Button {i:2d}: {width:4.0f}x{height:4.0f}px {status}")
                        print(f"           Text: '{text}'")
                        print(f"           Tag: {tag_name}")
                        print(f"           Classes: {class_attr}")
                        print()
                        
                        if is_small:
                            small_buttons.append({
                                'index': i,
                                'size': f"{width:.0f}x{height:.0f}",
                                'text': text,
                                'tag': tag_name,
                                'classes': class_attr,
                                'box': box
                            })
                            
                except Exception as e:
                    print(f"  Button {i:2d}: Error analyzing - {e}")
            
            print(f"\n🎯 SUMMARY:")
            print(f"Total buttons: {len(buttons)}")
            print(f"Small buttons: {len(small_buttons)}")
            
            if small_buttons:
                print(f"\n⚠️  SMALL BUTTONS FOUND:")
                for btn in small_buttons:
                    print(f"  - Button {btn['index']}: {btn['size']} - '{btn['text']}'")
                    print(f"    Classes: {btn['classes']}")
                    
                    # Take screenshot highlighting the small button
                    try:
                        # Scroll to button and highlight it
                        button_locator = page.locator('button, a[role="button"], input[type="button"], input[type="submit"]').nth(btn['index'])
                        await button_locator.scroll_into_view_if_needed()
                        
                        # Add red border to highlight
                        await button_locator.evaluate('el => el.style.border = "3px solid red"')
                        
                        await page.screenshot(path=f"small_button_{btn['index']}.png")
                        print(f"    📸 Screenshot: small_button_{btn['index']}.png")
                        
                    except Exception as e:
                        print(f"    ⚠️  Could not screenshot: {e}")
            else:
                print("✅ No small buttons found!")
                
        except Exception as e:
            print(f"❌ Error during analysis: {e}")
            
        finally:
            await browser.close()

if __name__ == "__main__":
    asyncio.run(find_small_buttons())

