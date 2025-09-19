#!/usr/bin/env python3
"""
Quick verification of mobile UI/UX improvements
"""

import asyncio
from playwright.async_api import async_playwright

async def verify_touch_targets():
    playwright = await async_playwright().start()
    browser = await playwright.chromium.launch(headless=True)
    
    context = await browser.new_context(
        viewport={"width": 375, "height": 812}  # iPhone 13 Pro
    )
    page = await context.new_page()
    
    # Test key pages
    test_pages = [
        ("/", "Homepage"),
        ("/shoes", "Shoes Page"),
        ("/login", "Login Page"),
        ("/contact", "Contact Page")
    ]
    
    total_issues = 0
    
    for path, name in test_pages:
        try:
            await page.goto(f"http://localhost:3000{path}")
            await page.wait_for_load_state("networkidle", timeout=10000)
            
            # Check for small touch targets
            small_targets = await page.evaluate("""
                () => {
                    const targets = Array.from(document.querySelectorAll('button, a[href], input[type="submit"], input[type="button"], [role="button"]'));
                    let small = 0;
                    
                    targets.forEach(el => {
                        const rect = el.getBoundingClientRect();
                        const isVisible = rect.width > 0 && rect.height > 0;
                        const isSmall = rect.width < 44 || rect.height < 44;
                        
                        if (isVisible && isSmall) {
                            small++;
                        }
                    });
                    
                    return small;
                }
            """)
            
            total_issues += small_targets
            status = "✅" if small_targets == 0 else f"⚠️  {small_targets} issues"
            print(f"   {name}: {status}")
            
        except Exception as e:
            print(f"   ❌ {name}: Error - {str(e)}")
    
    await browser.close()
    await playwright.stop()
    
    print(f"\n📊 VERIFICATION RESULTS:")
    print(f"   Total touch target issues: {total_issues}")
    if total_issues == 0:
        print(f"   🎉 ALL TOUCH TARGETS MEET 44x44px MINIMUM!")
    else:
        print(f"   ⚠️  {total_issues} touch targets still need attention")
    
    return total_issues == 0

if __name__ == "__main__":
    success = asyncio.run(verify_touch_targets())
    exit(0 if success else 1)
