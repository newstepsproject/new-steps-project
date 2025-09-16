#!/usr/bin/env python3
"""
Account Page Data Validator
Specifically tests the account page to ensure it shows real user data, not hardcoded content
"""

import asyncio
import json
import requests
from playwright.async_api import async_playwright
from typing import Dict, List

class AccountPageDataValidator:
    def __init__(self, base_url: str = "http://localhost:3000"):
        self.base_url = base_url
        self.test_user = {
            "email": "test.user@example.com",
            "password": "TestPassword123!",
            "firstName": "Test",
            "lastName": "User"
        }
        
    async def run_comprehensive_test(self):
        """Run comprehensive account page data validation"""
        print("🧪 ACCOUNT PAGE DATA CONSISTENCY VALIDATION")
        print("=" * 50)
        
        # Step 1: Create test data
        print("📝 Step 1: Creating test data...")
        await self.create_test_data()
        
        # Step 2: Test account page with real data
        print("👤 Step 2: Testing account page with real user data...")
        await self.test_account_page_data_display()
        
        print("\n✅ Account page data validation complete!")
    
    async def create_test_data(self):
        """Create test user and associated data"""
        try:
            # Register test user
            register_response = requests.post(f"{self.base_url}/api/auth/register", json={
                "firstName": self.test_user["firstName"],
                "lastName": self.test_user["lastName"],
                "email": self.test_user["email"],
                "password": self.test_user["password"]
            })
            
            if register_response.status_code == 201:
                print(f"  ✅ Test user registered: {self.test_user['email']}")
            else:
                print(f"  ℹ️  User might already exist: {register_response.status_code}")
            
            # Create test shoe donation
            donation_response = requests.post(f"{self.base_url}/api/donations", json={
                "donationType": "shoes",
                "numberOfShoes": 2,
                "donorInfo": {
                    "firstName": self.test_user["firstName"],
                    "lastName": self.test_user["lastName"],
                    "email": self.test_user["email"],
                    "phone": "1234567890",
                    "address": {
                        "street": "123 Test St",
                        "city": "Test City",
                        "state": "CA",
                        "zipCode": "12345",
                        "country": "USA"
                    }
                },
                "pickupMethod": "drop_off",
                "notes": "Test donation for account page validation"
            })
            
            if donation_response.status_code == 201:
                donation_data = donation_response.json()
                print(f"  ✅ Test shoe donation created: {donation_data.get('donationId', 'Unknown ID')}")
            else:
                print(f"  ❌ Failed to create shoe donation: {donation_response.status_code}")
                print(f"      Response: {donation_response.text}")
            
            # Create test money donation
            money_donation_response = requests.post(f"{self.base_url}/api/donations/money", json={
                "firstName": self.test_user["firstName"],
                "lastName": self.test_user["lastName"],
                "email": self.test_user["email"],
                "phone": "1234567890",
                "amount": 50.00,
                "donationMethod": "check",
                "checkNumber": "12345"
            })
            
            if money_donation_response.status_code == 201:
                money_data = money_donation_response.json()
                print(f"  ✅ Test money donation created: {money_data.get('donationId', 'Unknown ID')}")
            else:
                print(f"  ❌ Failed to create money donation: {money_donation_response.status_code}")
                print(f"      Response: {money_donation_response.text}")
                
        except Exception as e:
            print(f"  ❌ Error creating test data: {e}")
    
    async def test_account_page_data_display(self):
        """Test that account page displays real user data"""
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=False)
            context = await browser.new_context()
            page = await context.new_page()
            
            try:
                # Login as test user
                print("  🔐 Logging in as test user...")
                await page.goto(f"{self.base_url}/login")
                await page.wait_for_load_state("networkidle")
                
                await page.fill('input[type="email"]', self.test_user["email"])
                await page.fill('input[type="password"]', self.test_user["password"])
                await page.click('button[type="submit"]')
                
                # Wait for login to complete
                await page.wait_for_url(f"{self.base_url}/account", timeout=10000)
                print("  ✅ Successfully logged in")
                
                # Navigate to account page
                await page.goto(f"{self.base_url}/account")
                await page.wait_for_load_state("networkidle")
                
                # Test 1: Check for dynamic data loading
                print("  📊 Testing dynamic data loading...")
                
                # Wait for potential loading states to complete
                await page.wait_for_timeout(3000)
                
                # Check for loading indicators
                loading_indicators = await page.locator('[class*="loading"], [class*="spinner"], [data-testid*="loading"]').count()
                print(f"    Loading indicators found: {loading_indicators}")
                
                # Test 2: Check for hardcoded "No data" messages
                print("  🔍 Checking for hardcoded content...")
                
                page_content = await page.content()
                hardcoded_patterns = [
                    "No donations yet",
                    "No requests yet", 
                    "No data available",
                    "Coming soon",
                    "Placeholder"
                ]
                
                found_hardcoded = []
                for pattern in hardcoded_patterns:
                    if pattern.lower() in page_content.lower():
                        found_hardcoded.append(pattern)
                
                if found_hardcoded:
                    print(f"    ⚠️  Found potentially hardcoded content: {found_hardcoded}")
                else:
                    print("    ✅ No hardcoded content detected")
                
                # Test 3: Check for actual data display
                print("  📋 Checking for actual data display...")
                
                # Look for donation data
                donation_sections = await page.locator('[data-testid*="donation"], [class*="donation"], h3:has-text("Donations")').count()
                donation_items = await page.locator('[class*="card"], [class*="item"], tr:not(:first-child)').count()
                
                print(f"    Donation sections found: {donation_sections}")
                print(f"    Data items found: {donation_items}")
                
                # Test 4: Verify API calls are being made
                print("  🌐 Monitoring API calls...")
                
                api_calls = []
                page.on("request", lambda request: api_calls.append(request.url) if "/api/" in request.url else None)
                
                # Refresh page to trigger API calls
                await page.reload()
                await page.wait_for_load_state("networkidle")
                await page.wait_for_timeout(2000)
                
                relevant_api_calls = [call for call in api_calls if any(endpoint in call for endpoint in ["/api/user/", "/api/donations", "/api/requests"])]
                
                print(f"    API calls made: {len(relevant_api_calls)}")
                for call in relevant_api_calls:
                    print(f"      • {call}")
                
                # Test 5: Check for user-specific content
                print("  👤 Checking for user-specific content...")
                
                user_email_visible = self.test_user["email"] in page_content
                user_name_visible = self.test_user["firstName"] in page_content or self.test_user["lastName"] in page_content
                
                print(f"    User email visible: {user_email_visible}")
                print(f"    User name visible: {user_name_visible}")
                
                # Test 6: Take screenshot for manual verification
                await page.screenshot(path="account_page_validation.png", full_page=True)
                print("  📸 Screenshot saved: account_page_validation.png")
                
                # Generate test report
                test_results = {
                    "timestamp": page.url,
                    "login_successful": True,
                    "loading_indicators": loading_indicators,
                    "hardcoded_content": found_hardcoded,
                    "donation_sections": donation_sections,
                    "data_items": donation_items,
                    "api_calls": relevant_api_calls,
                    "user_email_visible": user_email_visible,
                    "user_name_visible": user_name_visible,
                    "overall_status": "PASS" if not found_hardcoded and len(relevant_api_calls) > 0 else "FAIL"
                }
                
                # Save detailed results
                with open('account_page_validation_results.json', 'w') as f:
                    json.dump(test_results, f, indent=2)
                
                print(f"\n  📊 VALIDATION RESULTS:")
                print(f"    Overall Status: {test_results['overall_status']}")
                print(f"    API Calls Made: {len(relevant_api_calls) > 0}")
                print(f"    No Hardcoded Content: {len(found_hardcoded) == 0}")
                print(f"    User Data Visible: {user_email_visible or user_name_visible}")
                
            except Exception as e:
                print(f"  ❌ Error during account page testing: {e}")
            
            finally:
                await browser.close()
    
    async def cleanup_test_data(self):
        """Clean up test data (optional)"""
        print("🧹 Cleaning up test data...")
        # Note: In a real scenario, you might want to clean up test data
        # For now, we'll leave it for manual verification
        pass

async def main():
    validator = AccountPageDataValidator()
    await validator.run_comprehensive_test()

if __name__ == "__main__":
    asyncio.run(main())
