#!/usr/bin/env python3
"""
Production End-to-End Lifecycle Validation (Final)
==================================================

Final version with all fixes:
- Correct gender enum values (lowercase)
- Better success detection
- Specific button selectors to avoid conflicts
- Improved error handling
"""

import asyncio
import json
import requests
import time
from datetime import datetime
from playwright.async_api import async_playwright
from pathlib import Path

class ProductionE2EValidator:
    def __init__(self):
        self.base_url = "https://newsteps.fit"
        self.admin_email = "admin@newsteps.fit"
        self.admin_password = "Admin123!"
        self.test_timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        self.screenshots_dir = Path(f"production_e2e_final_{self.test_timestamp}")
        self.screenshots_dir.mkdir(exist_ok=True)
        self.results = {
            "timestamp": self.test_timestamp,
            "base_url": self.base_url,
            "steps": {},
            "screenshots": [],
            "summary": {}
        }
        
    async def take_screenshot(self, page, step_name, description=""):
        """Take screenshot and save with metadata"""
        screenshot_path = self.screenshots_dir / f"{step_name}_{self.test_timestamp}.png"
        await page.screenshot(path=str(screenshot_path), full_page=True)
        
        screenshot_info = {
            "step": step_name,
            "description": description,
            "path": str(screenshot_path),
            "url": page.url,
            "timestamp": datetime.now().isoformat()
        }
        self.results["screenshots"].append(screenshot_info)
        print(f"📸 Screenshot saved: {screenshot_path}")
        return screenshot_path

    async def safe_fill_field(self, page, field_name, value):
        """Safely fill a field, handling readonly and missing fields"""
        selectors = [
            f'input[name="{field_name}"]',
            f'textarea[name="{field_name}"]',
            f'select[name="{field_name}"]',
            f'input[id="{field_name}"]',
            f'textarea[id="{field_name}"]'
        ]
        
        for selector in selectors:
            try:
                element = page.locator(selector)
                if await element.count() > 0:
                    # Check if field is readonly
                    is_readonly = await element.get_attribute('readonly')
                    if is_readonly:
                        print(f"⚠️  Skipping readonly field: {field_name}")
                        return True
                    
                    await element.fill(value)
                    print(f"✅ Filled {field_name}: {value}")
                    return True
            except Exception as e:
                continue
                
        print(f"⚠️  Could not fill field: {field_name}")
        return False

    async def step_1_anonymous_donation(self, browser):
        """Step 1: Anonymous user submits shoe donation"""
        print("\n🎯 STEP 1: Anonymous Shoe Donation")
        
        context = await browser.new_context()
        page = await context.new_page()
        
        try:
            # Navigate to donation page
            await page.goto(f"{self.base_url}/donate/shoes")
            await page.wait_for_load_state('networkidle')
            await page.wait_for_timeout(2000)  # Let React hydrate
            await self.take_screenshot(page, "01_donation_form", "Donation form loaded")
            
            # Fill donation form with safe filling
            donation_data = {
                "firstName": "Production",
                "lastName": "Tester",
                "email": "production.test@example.com",
                "phone": "4155551234",
                "street": "123 Test Street",
                "city": "San Francisco",
                "state": "CA",
                "zipCode": "94102",
                # Skip country - it's readonly with default "USA"
                "numberOfShoes": "2",
                "donationDescription": "Nike Air Max size 10 and Adidas Ultraboost size 9.5, both in good condition"
            }
            
            for field, value in donation_data.items():
                await self.safe_fill_field(page, field, value)
                await page.wait_for_timeout(500)  # Small delay between fields
                    
            # Handle Bay Area checkbox
            try:
                bay_area_checkbox = page.locator('input[name="isBayArea"], input[id="isBayArea"]')
                if await bay_area_checkbox.count() > 0:
                    await bay_area_checkbox.check()
                    print("✅ Checked Bay Area checkbox")
            except Exception as e:
                print(f"⚠️  Could not check Bay Area checkbox: {e}")
                
            await self.take_screenshot(page, "02_donation_filled", "Donation form filled")
            
            # Submit form
            submit_selectors = [
                'button[type="submit"]',
                'button:has-text("Submit")',
                'button:has-text("Donate")'
            ]
            
            submitted = False
            for selector in submit_selectors:
                try:
                    submit_button = page.locator(selector)
                    if await submit_button.count() > 0:
                        await submit_button.click()
                        submitted = True
                        print("✅ Submitted donation form")
                        break
                except Exception as e:
                    continue
                    
            if not submitted:
                raise Exception("Could not find submit button")
                
            await page.wait_for_timeout(5000)
            
            # Check for success and capture reference ID
            success = False
            reference_id = None
            
            # Look for success indicators - check page content
            page_content = await page.content()
            
            # Check for success patterns
            success_patterns = [
                "donation submitted successfully",
                "submitted successfully", 
                "DS-",
                "thank you"
            ]
            
            for pattern in success_patterns:
                if pattern.lower() in page_content.lower():
                    success = True
                    print(f"✅ Found success pattern: {pattern}")
                    break
                    
            # Try to extract reference ID
            try:
                ref_elements = await page.locator('text=/DS-[A-Z]{4}-\\d{4}/').all()
                if ref_elements:
                    reference_id = await ref_elements[0].text_content()
                    reference_id = reference_id.strip()
                    print(f"✅ Found reference ID: {reference_id}")
                    success = True  # If we found a reference ID, it's definitely successful
            except Exception as e:
                print(f"⚠️  Could not extract reference ID: {e}")
                    
            await self.take_screenshot(page, "03_donation_result", f"Donation result - Success: {success}")
            
            self.results["steps"]["step_1"] = {
                "success": success,
                "reference_id": reference_id,
                "donation_data": donation_data,
                "url": page.url
            }
            
            print(f"✅ Step 1 Result: Success={success}, Reference={reference_id}")
            return success, reference_id
            
        except Exception as e:
            print(f"❌ Step 1 Error: {e}")
            await self.take_screenshot(page, "03_donation_error", f"Error: {e}")
            self.results["steps"]["step_1"] = {"success": False, "error": str(e)}
            return False, None
        finally:
            await context.close()

    async def admin_login(self, page):
        """Helper function to log in admin with better selectors"""
        try:
            await page.goto(f"{self.base_url}/login")
            await page.wait_for_load_state('networkidle')
            await page.wait_for_timeout(2000)  # Let React hydrate
            
            # Try multiple email selectors
            email_selectors = [
                'input[name="email"]',
                'input[type="email"]',
                'input[id="email"]',
                'input[placeholder*="email" i]'
            ]
            
            email_filled = False
            for selector in email_selectors:
                try:
                    email_field = page.locator(selector)
                    if await email_field.count() > 0:
                        await email_field.fill(self.admin_email)
                        email_filled = True
                        print("✅ Filled admin email")
                        break
                except:
                    continue
                    
            if not email_filled:
                raise Exception("Could not find email field")
                
            # Try multiple password selectors
            password_selectors = [
                'input[name="password"]',
                'input[type="password"]',
                'input[id="password"]'
            ]
            
            password_filled = False
            for selector in password_selectors:
                try:
                    password_field = page.locator(selector)
                    if await password_field.count() > 0:
                        await password_field.fill(self.admin_password)
                        password_filled = True
                        print("✅ Filled admin password")
                        break
                except:
                    continue
                    
            if not password_filled:
                raise Exception("Could not find password field")
                
            # Submit login - use specific selector to avoid Google OAuth button
            login_button = page.locator('button[type="submit"]:has-text("Sign in")')
            if await login_button.count() > 0:
                await login_button.click()
                print("✅ Clicked login button")
            else:
                # Fallback to first submit button
                await page.locator('button[type="submit"]').first.click()
                print("✅ Clicked first submit button")
                    
            await page.wait_for_timeout(5000)
            
            # Check if login successful
            if '/account' in page.url or '/admin' in page.url or 'dashboard' in page.url:
                print("✅ Admin login successful")
                return True
            else:
                print(f"⚠️  Login may have failed - URL: {page.url}")
                return False
                
        except Exception as e:
            print(f"❌ Admin login error: {e}")
            return False

    async def step_2_admin_donation_processing(self, browser, donation_ref_id):
        """Step 2: Admin processes donation and adds to inventory"""
        print(f"\n🎯 STEP 2: Admin Processing Donation {donation_ref_id}")
        
        context = await browser.new_context()
        page = await context.new_page()
        
        try:
            await self.take_screenshot(page, "04_admin_login_start", "Starting admin login")
            
            # Admin login with improved method
            login_success = await self.admin_login(page)
            if not login_success:
                raise Exception("Admin login failed")
                
            await self.take_screenshot(page, "05_admin_logged_in", "Admin logged in successfully")
            
            # Navigate to admin donations
            await page.goto(f"{self.base_url}/admin/shoe-donations")
            await page.wait_for_load_state('networkidle')
            await self.take_screenshot(page, "06_admin_donations", "Admin donations dashboard")
            
            # Look for the donation
            donation_found = False
            if donation_ref_id:
                try:
                    donation_elements = await page.locator(f'text="{donation_ref_id}"').count()
                    if donation_elements > 0:
                        donation_found = True
                        print(f"✅ Found donation {donation_ref_id} in admin dashboard")
                    else:
                        print(f"⚠️  Donation {donation_ref_id} not found in admin dashboard")
                except Exception as e:
                    print(f"⚠️  Error searching for donation: {e}")
                    
            # Navigate to add shoes (simulating inventory addition)
            await page.goto(f"{self.base_url}/admin/shoes/add")
            await page.wait_for_load_state('networkidle')
            await self.take_screenshot(page, "07_admin_add_shoes", "Admin add shoes form")
            
            # Add sample shoes to inventory via API (more reliable) with CORRECT gender values
            shoes_added = []
            for i, shoe_data in enumerate([
                {"brand": "Nike", "model": "Air Max", "size": "10", "color": "Black/White", "gender": "men"},  # Fixed: lowercase
                {"brand": "Adidas", "model": "Ultraboost", "size": "9.5", "color": "Blue/White", "gender": "women"}  # Fixed: lowercase
            ]):
                try:
                    # Get session cookies for API call
                    cookies = await page.context.cookies()
                    cookie_header = "; ".join([f"{c['name']}={c['value']}" for c in cookies])
                    
                    api_data = {
                        "brand": shoe_data["brand"],
                        "modelName": shoe_data["model"],
                        "size": shoe_data["size"],
                        "color": shoe_data["color"],
                        "sport": "Running",
                        "gender": shoe_data["gender"],  # Now using correct lowercase values
                        "condition": "good",
                        "status": "available",
                        "inventoryCount": 1,
                        "notes": f"From production test donation {donation_ref_id or 'test'}"
                    }
                    
                    response = requests.post(
                        f"{self.base_url}/api/admin/shoes",
                        json=api_data,
                        headers={
                            "Cookie": cookie_header,
                            "Content-Type": "application/json"
                        },
                        timeout=10
                    )
                    
                    if response.status_code == 201:
                        result = response.json()
                        shoes_added.append({
                            "shoe_data": shoe_data,
                            "api_response": result
                        })
                        print(f"✅ Added shoe {i+1}: {shoe_data['brand']} {shoe_data['model']} ({shoe_data['gender']})")
                    else:
                        print(f"❌ Failed to add shoe {i+1}: {response.status_code} - {response.text}")
                        
                except Exception as e:
                    print(f"❌ Error adding shoe {i+1}: {e}")
                    
            await self.take_screenshot(page, "08_shoes_added", f"Added {len(shoes_added)} shoes to inventory")
            
            self.results["steps"]["step_2"] = {
                "success": len(shoes_added) > 0,
                "donation_found": donation_found,
                "shoes_added": len(shoes_added),
                "shoes_data": shoes_added
            }
            
            print(f"✅ Step 2 Result: Added {len(shoes_added)} shoes to inventory")
            return len(shoes_added) > 0, shoes_added
            
        except Exception as e:
            print(f"❌ Step 2 Error: {e}")
            await self.take_screenshot(page, "08_admin_error", f"Error: {e}")
            self.results["steps"]["step_2"] = {"success": False, "error": str(e)}
            return False, []
        finally:
            await context.close()

    async def step_3_user_registration_and_request(self, browser):
        """Step 3: User registers and makes shoe request"""
        print("\n🎯 STEP 3: User Registration and Shoe Request")
        
        context = await browser.new_context()
        page = await context.new_page()
        
        try:
            # Check public inventory first
            await page.goto(f"{self.base_url}/shoes")
            await page.wait_for_load_state('networkidle')
            await self.take_screenshot(page, "09_public_inventory", "Public shoe inventory")
            
            # Count available shoes
            shoe_cards = await page.locator('[data-testid="shoe-card"], .shoe-card, .grid > div').count()
            print(f"📊 Found {shoe_cards} shoes in public inventory")
            
            # User registration
            test_user_email = f"testuser_{self.test_timestamp}@example.com"
            await page.goto(f"{self.base_url}/register")
            await page.wait_for_load_state('networkidle')
            await page.wait_for_timeout(2000)
            await self.take_screenshot(page, "10_user_registration", "User registration form")
            
            registration_data = {
                "firstName": "Test",
                "lastName": "User",
                "email": test_user_email,
                "password": "TestPass123!",
                "confirmPassword": "TestPass123!",
                "phone": "4155559999"
            }
            
            # Fill registration form
            for field, value in registration_data.items():
                await self.safe_fill_field(page, field, value)
                await page.wait_for_timeout(300)
                    
            # Submit registration
            register_button = page.locator('button[type="submit"], button:has-text("Register"), button:has-text("Sign Up")')
            if await register_button.count() > 0:
                await register_button.click()
                await page.wait_for_timeout(5000)
                print("✅ Submitted registration")
            else:
                raise Exception("Could not find registration submit button")
                
            await self.take_screenshot(page, "11_registration_result", "Registration result")
            
            # User might be redirected to login - handle this
            if '/login' in page.url:
                print("🔄 User redirected to login, logging in...")
                
                # Fill login form
                await self.safe_fill_field(page, "email", test_user_email)
                await self.safe_fill_field(page, "password", "TestPass123!")
                
                # Use specific selector to avoid Google OAuth button
                login_button = page.locator('button[type="submit"]:has-text("Sign in")')
                if await login_button.count() > 0:
                    await login_button.click()
                    await page.wait_for_timeout(5000)
                    print("✅ User logged in")
                else:
                    # Fallback
                    await page.locator('button[type="submit"]').first.click()
                    await page.wait_for_timeout(5000)
                    print("✅ User logged in (fallback)")
            
            # Navigate back to shoes and add to cart
            await page.goto(f"{self.base_url}/shoes")
            await page.wait_for_load_state('networkidle')
            
            # Try to add first available shoe to cart
            add_buttons = page.locator('button:has-text("Add to Cart"), button:has-text("Request These Shoes")')
            if await add_buttons.count() > 0:
                await add_buttons.first.click()
                await page.wait_for_timeout(2000)
                print("✅ Added shoe to cart")
            else:
                print("⚠️  No add to cart buttons found")
                
            await self.take_screenshot(page, "12_shoe_added_to_cart", "Shoe added to cart")
            
            # Go to checkout
            await page.goto(f"{self.base_url}/checkout")
            await page.wait_for_load_state('networkidle')
            await page.wait_for_timeout(2000)
            await self.take_screenshot(page, "13_checkout_page", "Checkout page")
            
            # Check if we're still on login page (authentication required)
            if '/login' in page.url:
                print("🔄 Checkout requires authentication, already handled")
                # We should already be logged in from above
                await page.goto(f"{self.base_url}/checkout")
                await page.wait_for_load_state('networkidle')
                await page.wait_for_timeout(2000)
            
            # Fill shipping information if we're on checkout page
            request_success = False
            request_ref_id = None
            
            if '/checkout' in page.url:
                shipping_data = {
                    "firstName": "Test",
                    "lastName": "User", 
                    "email": test_user_email,
                    "phone": "4155559999",
                    "street": "456 Test Ave",
                    "city": "Oakland",
                    "state": "CA",
                    "zipCode": "94601"
                }
                
                for field, value in shipping_data.items():
                    await self.safe_fill_field(page, field, value)
                    await page.wait_for_timeout(300)
                        
                # Select shipping method (pickup to avoid payment)
                try:
                    pickup_options = [
                        'input[value="pickup"]',
                        'label:has-text("pickup")',
                        'input[name="shippingMethod"][value="pickup"]'
                    ]
                    
                    for selector in pickup_options:
                        pickup_element = page.locator(selector)
                        if await pickup_element.count() > 0:
                            await pickup_element.click()
                            print("✅ Selected pickup option")
                            break
                except Exception as e:
                    print(f"⚠️  Could not select pickup: {e}")
                    
                await self.take_screenshot(page, "14_checkout_filled", "Checkout form filled")
                
                # Submit request
                submit_selectors = [
                    'button[type="submit"]:has-text("Complete Request")',
                    'button:has-text("Submit Request")',
                    'button[type="submit"]'
                ]
                
                for selector in submit_selectors:
                    try:
                        submit_button = page.locator(selector)
                        if await submit_button.count() > 0:
                            await submit_button.click()
                            await page.wait_for_timeout(5000)
                            print("✅ Submitted request")
                            break
                    except Exception as e:
                        continue
                        
                await self.take_screenshot(page, "15_request_submitted", "Request submission result")
                
                # Check for success - use page content
                page_content = await page.content()
                
                success_patterns = [
                    "request submitted successfully",
                    "submitted successfully",
                    "REQ-",
                    "thank you"
                ]
                
                for pattern in success_patterns:
                    if pattern.lower() in page_content.lower():
                        request_success = True
                        print(f"✅ Found request success pattern: {pattern}")
                        break
                        
                # Try to extract reference ID
                try:
                    ref_elements = await page.locator('text=/REQ-[A-Z0-9-]+/').all()
                    if ref_elements:
                        reference_id = await ref_elements[0].text_content()
                        request_ref_id = reference_id.strip()
                        request_success = True  # If we found a reference ID, it's successful
                        print(f"✅ Found request reference ID: {request_ref_id}")
                except Exception as e:
                    print(f"⚠️  Could not extract request reference ID: {e}")
                    
            else:
                print("⚠️  Could not reach checkout page")
                
            self.results["steps"]["step_3"] = {
                "success": request_success,
                "request_ref_id": request_ref_id,
                "user_email": test_user_email,
                "shoes_in_inventory": shoe_cards,
                "final_url": page.url
            }
            
            print(f"✅ Step 3 Result: Success={request_success}, Reference={request_ref_id}")
            return request_success, request_ref_id, test_user_email
            
        except Exception as e:
            print(f"❌ Step 3 Error: {e}")
            await self.take_screenshot(page, "15_request_error", f"Error: {e}")
            self.results["steps"]["step_3"] = {"success": False, "error": str(e)}
            return False, None, None
        finally:
            await context.close()

    async def step_4_admin_request_processing(self, browser, request_ref_id):
        """Step 4: Admin processes user request"""
        print(f"\n🎯 STEP 4: Admin Processing Request {request_ref_id}")
        
        context = await browser.new_context()
        page = await context.new_page()
        
        try:
            # Admin login
            login_success = await self.admin_login(page)
            if not login_success:
                raise Exception("Admin login failed")
                
            await self.take_screenshot(page, "16_admin_logged_in", "Admin logged in for requests")
            
            # Navigate to admin requests
            await page.goto(f"{self.base_url}/admin/requests")
            await page.wait_for_load_state('networkidle')
            await self.take_screenshot(page, "17_admin_requests", "Admin requests dashboard")
            
            # Look for the request
            request_found = False
            if request_ref_id:
                try:
                    request_elements = await page.locator(f'text="{request_ref_id}"').count()
                    if request_elements > 0:
                        request_found = True
                        print(f"✅ Found request {request_ref_id} in admin dashboard")
                    else:
                        print(f"⚠️  Request {request_ref_id} not found in admin dashboard")
                except Exception as e:
                    print(f"⚠️  Error searching for request: {e}")
                    
            # Check admin settings
            await page.goto(f"{self.base_url}/admin/settings")
            await page.wait_for_load_state('networkidle')
            await self.take_screenshot(page, "18_admin_settings", "Admin settings page")
            
            self.results["steps"]["step_4"] = {
                "success": request_found,
                "request_found": request_found,
                "admin_access": True
            }
            
            print(f"✅ Step 4 Result: Request found={request_found}")
            return request_found
            
        except Exception as e:
            print(f"❌ Step 4 Error: {e}")
            await self.take_screenshot(page, "18_admin_request_error", f"Error: {e}")
            self.results["steps"]["step_4"] = {"success": False, "error": str(e)}
            return False
        finally:
            await context.close()

    async def step_5_email_verification(self):
        """Step 5: Verify email configuration and templates"""
        print("\n🎯 STEP 5: Email System Verification")
        
        try:
            # Test email configuration endpoint
            response = requests.get(f"{self.base_url}/api/test-email", timeout=10)
            
            email_config_working = response.status_code == 200
            
            self.results["steps"]["step_5"] = {
                "success": email_config_working,
                "email_endpoint_status": response.status_code,
                "email_response": response.text[:200] if response.text else None
            }
            
            print(f"✅ Step 5 Result: Email config working={email_config_working}")
            return email_config_working
            
        except Exception as e:
            print(f"❌ Step 5 Error: {e}")
            self.results["steps"]["step_5"] = {"success": False, "error": str(e)}
            return False

    async def generate_summary_report(self):
        """Generate comprehensive summary report"""
        print("\n📊 GENERATING SUMMARY REPORT")
        
        total_steps = len(self.results["steps"])
        successful_steps = sum(1 for step in self.results["steps"].values() if step.get("success", False))
        success_rate = (successful_steps / total_steps * 100) if total_steps > 0 else 0
        
        self.results["summary"] = {
            "total_steps": total_steps,
            "successful_steps": successful_steps,
            "success_rate": success_rate,
            "critical_issues": [],
            "recommendations": []
        }
        
        # Analyze critical issues
        if not self.results["steps"].get("step_1", {}).get("success", False):
            self.results["summary"]["critical_issues"].append("Anonymous donation submission failed")
            
        if not self.results["steps"].get("step_3", {}).get("success", False):
            self.results["summary"]["critical_issues"].append("User registration/request flow failed")
            
        if not self.results["steps"].get("step_5", {}).get("success", False):
            self.results["summary"]["recommendations"].append("Email system needs configuration review")
            
        # Save detailed report
        report_path = self.screenshots_dir / f"e2e_validation_report_final_{self.test_timestamp}.json"
        with open(report_path, 'w') as f:
            json.dump(self.results, f, indent=2)
            
        print(f"\n🎉 E2E VALIDATION COMPLETE!")
        print(f"📊 Success Rate: {success_rate:.1f}% ({successful_steps}/{total_steps})")
        print(f"📁 Screenshots: {len(self.results['screenshots'])} captured")
        print(f"📄 Report saved: {report_path}")
        
        if self.results["summary"]["critical_issues"]:
            print(f"⚠️  Critical Issues: {len(self.results['summary']['critical_issues'])}")
            for issue in self.results["summary"]["critical_issues"]:
                print(f"   - {issue}")
        else:
            print("✅ No critical issues found!")
                
        return success_rate >= 80.0

    async def run_complete_validation(self):
        """Run the complete end-to-end validation"""
        print("🚀 STARTING PRODUCTION E2E LIFECYCLE VALIDATION (FINAL)")
        print(f"🎯 Target: {self.base_url}")
        print(f"📸 Screenshots: {self.screenshots_dir}")
        
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=False)
            
            try:
                # Step 1: Anonymous donation
                donation_success, donation_ref = await self.step_1_anonymous_donation(browser)
                
                # Step 2: Admin processing
                inventory_success, shoes_added = await self.step_2_admin_donation_processing(browser, donation_ref)
                
                # Step 3: User request
                request_success, request_ref, user_email = await self.step_3_user_registration_and_request(browser)
                
                # Step 4: Admin request processing
                admin_success = await self.step_4_admin_request_processing(browser, request_ref)
                
                # Step 5: Email verification
                email_success = await self.step_5_email_verification()
                
                # Generate summary
                validation_passed = await self.generate_summary_report()
                
                return validation_passed
                
            finally:
                await browser.close()

async def main():
    """Main execution function"""
    validator = ProductionE2EValidator()
    success = await validator.run_complete_validation()
    
    if success:
        print("\n✅ PRODUCTION E2E VALIDATION PASSED!")
        print("🎯 Ready for next phase: External service configuration")
    else:
        print("\n⚠️  PRODUCTION E2E VALIDATION NEEDS ATTENTION")
        print("🔧 Review issues before proceeding to external services")
        
    return success

if __name__ == "__main__":
    asyncio.run(main())
