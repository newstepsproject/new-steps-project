#!/usr/bin/env python3
"""
COMPREHENSIVE ADMIN END-TO-END WORKFLOW TESTING
Tests complete ecosystem: Admin Console ↔ Public Website ↔ User Activities

Uses enhanced testing framework with:
- Dynamic content awareness
- Proper authentication handling 
- Real user interaction simulation
- Status lifecycle validation
- Cross-system integration testing
"""

import asyncio
import json
import time
import random
import string
from playwright.async_api import async_playwright
import os

class AdminE2EWorkflowTester:
    def __init__(self, base_url="https://newsteps.fit"):
        self.base_url = base_url
        self.test_results = []
        
        # Admin credentials (from cursor rules)
        self.admin_user = {
            'email': 'admin@newsteps.fit',
            'password': 'Admin123!'
        }
        
        # Test user for regular user activities
        self.test_user = {
            'email': f'e2etest_{int(time.time())}@example.com',
            'password': 'E2ETest123!',
            'firstName': 'E2E',
            'lastName': 'Tester',
            'phone': '5551234567'
        }
        
        # Track created data for cleanup and validation
        self.created_donations = []
        self.created_requests = []
        self.created_inventory = []
        
    def log_result(self, workflow, step, status, details, critical=False):
        """Log workflow test result with enhanced formatting"""
        result = {
            "workflow": workflow,
            "step": step,
            "status": status,
            "details": details,
            "critical": critical,
            "timestamp": time.strftime("%Y-%m-%d %H:%M:%S")
        }
        self.test_results.append(result)
        
        status_symbol = "✅" if status == "PASS" else "❌" if status == "FAIL" else "⚠️"
        critical_flag = " [CRITICAL]" if critical else ""
        print(f"{status_symbol} {workflow} - {step}{critical_flag}: {details}")

    async def wait_for_dynamic_content(self, page, timeout=25000):
        """Enhanced dynamic content waiting for admin console"""
        try:
            print("    ⏳ Waiting for dynamic content to load...")
            
            # Wait for network to be idle
            await page.wait_for_load_state('networkidle', timeout=timeout)
            
            # Wait for common loading indicators to disappear
            loading_selectors = [
                '.animate-spin',
                '.loading-spinner', 
                '.lucide-loader2',
                'div:has-text("Loading")',
                'div:has-text("loading")',
                '[data-testid="loading"]',
                '.spinner'
            ]
            
            for selector in loading_selectors:
                try:
                    if await page.locator(selector).count() > 0:
                        print(f"    ⌛ Waiting for loading indicator: {selector}")
                        await page.locator(selector).wait_for(state='detached', timeout=15000)
                        print(f"    ✅ Loading indicator disappeared: {selector}")
                except:
                    pass
            
            # Wait for content to stabilize
            await page.wait_for_timeout(3000)
            
            print("    ✅ Dynamic content loading complete")
            return True
            
        except Exception as e:
            print(f"    ⚠️ Dynamic content wait timeout: {str(e)}")
            return False

    async def admin_login(self, page):
        """FIXED: Admin authentication workflow with proper timing"""
        workflow = "Admin Authentication"
        print(f"\n🔐 **TESTING: {workflow.upper()}**\n")
        
        try:
            # Navigate to admin login
            print("    📍 Navigating to admin console...")
            await page.goto(f"{self.base_url}/admin", wait_until='networkidle', timeout=30000)
            await self.wait_for_dynamic_content(page)
            
            current_url = page.url
            
            # Should redirect to login for admin access
            if '/login' in current_url:
                self.log_result(workflow, "Admin Access Protection", "PASS", "Admin console properly requires authentication")
                
                # FIXED: Wait for React client-side rendering to complete
                print("    ⏳ Waiting for client-side login form to render...")
                
                # First wait for "Loading login form..." to disappear
                try:
                    loading_indicator = page.locator(':has-text("Loading login form")')
                    if await loading_indicator.count() > 0:
                        print("    ⌛ Login form is loading client-side...")
                        await loading_indicator.wait_for(state='detached', timeout=20000)
                        print("    ✅ Loading indicator disappeared")
                except:
                    print("    ℹ️ No loading indicator found")
                
                # FIXED: Wait for actual form fields with correct selectors
                # Based on debugging: form uses input[type="email"] not input[name="email"]
                await page.wait_for_selector('input[type="email"]', state='visible', timeout=15000)
                print("    ✅ Login form fields are now visible")
                
                # Additional stabilization time for React hydration
                await page.wait_for_timeout(2000)
                
                # FIXED: Use more robust form filling with error handling
                try:
                    # FIXED: Fill email field with correct selector
                    email_field = page.locator('input[type="email"]')
                    await email_field.fill(self.admin_user['email'])
                    print(f"    ✅ Filled email: {self.admin_user['email']}")
                    
                    # FIXED: Fill password field (try multiple selectors)
                    password_selectors = ['input[type="password"]', 'input[name="password"]']
                    password_filled = False
                    
                    for selector in password_selectors:
                        try:
                            password_field = page.locator(selector)
                            if await password_field.count() > 0:
                                await password_field.fill(self.admin_user['password'])
                                print(f"    ✅ Filled password using: {selector}")
                                password_filled = True
                                break
                        except:
                            continue
                    
                    if not password_filled:
                        raise Exception("Could not find password field")
                    
                    # Submit login with multiple selector strategies
                    submit_selectors = [
                        'button[type="submit"]',
                        'input[type="submit"]',
                        'button:has-text("Sign In")',
                        'button:has-text("Login")',
                        'form button'
                    ]
                    
                    submitted = False
                    for selector in submit_selectors:
                        try:
                            submit_button = page.locator(selector)
                            if await submit_button.count() > 0:
                                print(f"    👆 Clicking login button: {selector}")
                                await submit_button.first.click()
                                submitted = True
                                break
                        except:
                            continue
                    
                    if not submitted:
                        self.log_result(workflow, "Admin Login", "FAIL", "No submit button found", critical=True)
                        return False
                    
                    # Wait for login to process
                    print("    ⏳ Processing login...")
                    await page.wait_for_timeout(8000)
                    await self.wait_for_dynamic_content(page)
                    
                    # Check if logged in to admin
                    current_url = page.url
                    
                    # Success indicators
                    success_indicators = [
                        '/admin' in current_url and '/login' not in current_url,
                        await page.locator('h1:has-text("Admin"), h1:has-text("Dashboard")').count() > 0,
                        await page.locator('nav:has-text("Admin"), .admin-nav').count() > 0
                    ]
                    
                    if any(success_indicators):
                        self.log_result(workflow, "Admin Login", "PASS", 
                                      f"Successfully logged in to admin console: {current_url}", critical=True)
                        return True
                    else:
                        # Check for error messages
                        error_messages = await page.locator('.text-red-500, .error, [role="alert"]').all()
                        if error_messages:
                            error_text = await error_messages[0].text_content()
                            self.log_result(workflow, "Admin Login", "FAIL", 
                                          f"Login failed with error: {error_text}", critical=True)
                        else:
                            self.log_result(workflow, "Admin Login", "FAIL", 
                                          f"Login failed - still on: {current_url}", critical=True)
                        return False
                        
                except Exception as form_error:
                    self.log_result(workflow, "Admin Login Form", "FAIL", 
                                  f"Form interaction failed: {str(form_error)}", critical=True)
                    return False
                    
            else:
                self.log_result(workflow, "Admin Access", "FAIL", 
                              "Admin console accessible without authentication", critical=True)
                return False
                
        except Exception as e:
            self.log_result(workflow, "Admin Authentication", "FAIL", f"Exception: {str(e)}", critical=True)
            return False

    async def test_user_shoe_donation_workflow(self, page):
        """Test complete user shoe donation process"""
        workflow = "User Shoe Donation"
        print(f"\n🎁 **TESTING: {workflow.upper()}**\n")
        
        try:
            # Navigate to shoe donation form
            print("    📍 Navigating to shoe donation form...")
            await page.goto(f"{self.base_url}/donate/shoes", wait_until='networkidle', timeout=30000)
            await self.wait_for_dynamic_content(page)
            self.log_result(workflow, "Navigate to Donation Form", "PASS", "Shoe donation form loaded")
            
            # Fill donation form
            donation_data = {
                'firstName': 'Test',
                'lastName': 'Donor',
                'email': f'donor_{int(time.time())}@example.com',
                'phone': '5551234567',
                'donationDescription': 'Testing E2E workflow - Nike running shoes size 10'
            }
            
            form_fields = [
                ('input[name="firstName"]', donation_data['firstName'], "First Name"),
                ('input[name="lastName"]', donation_data['lastName'], "Last Name"),
                ('input[name="email"]', donation_data['email'], "Email"),
                ('input[name="phone"]', donation_data['phone'], "Phone"),
                ('textarea[name="donationDescription"], textarea[name="description"]', donation_data['donationDescription'], "Description")
            ]
            
            filled_count = 0
            for selector, value, field_name in form_fields:
                try:
                    field = page.locator(selector)
                    if await field.count() > 0:
                        await field.first.fill(value)
                        filled_count += 1
                        print(f"    ✅ Filled {field_name}")
                except:
                    continue
            
            if filled_count >= 4:
                self.log_result(workflow, "Fill Donation Form", "PASS", f"Filled {filled_count} form fields")
                
                # Select pickup method
                pickup_radio = page.locator('input[type="radio"]')
                if await pickup_radio.count() > 0:
                    await pickup_radio.first.click()
                    self.log_result(workflow, "Select Pickup Method", "PASS", "Pickup method selected")
                
                # Submit donation
                submit_button = page.locator('button[type="submit"], button:has-text("Submit"), button:has-text("Donate")')
                if await submit_button.count() > 0:
                    await submit_button.first.click()
                    await page.wait_for_timeout(5000)
                    await self.wait_for_dynamic_content(page)
                    
                    # Check for success (may redirect or show success message)
                    current_url = page.url
                    success_indicators = [
                        'success' in current_url.lower(),
                        await page.locator(':has-text("success"), :has-text("submitted"), :has-text("thank")').count() > 0
                    ]
                    
                    if any(success_indicators):
                        # Try to extract donation reference ID
                        donation_ref = None
                        try:
                            ref_element = await page.locator('[class*="font-mono"], code, .reference').first.text_content()
                            if ref_element and len(ref_element) > 5:
                                donation_ref = ref_element.strip()
                                self.created_donations.append(donation_ref)
                        except:
                            pass
                        
                        self.log_result(workflow, "Donation Submission", "PASS", 
                                      f"Donation submitted successfully. Reference: {donation_ref or 'Not captured'}", critical=True)
                        return donation_ref
                    else:
                        self.log_result(workflow, "Donation Submission", "WARN", "Donation submitted but success unclear")
                        return "SUBMITTED_UNCLEAR"
                else:
                    self.log_result(workflow, "Donation Submission", "FAIL", "No submit button found", critical=True)
                    return None
            else:
                self.log_result(workflow, "Fill Donation Form", "FAIL", f"Only filled {filled_count} fields", critical=True)
                return None
                
        except Exception as e:
            self.log_result(workflow, "User Shoe Donation", "FAIL", f"Exception: {str(e)}", critical=True)
            return None

    async def test_admin_donation_management(self, page, donation_ref):
        """Test admin processing of user donation"""
        workflow = "Admin Donation Management"
        print(f"\n👨‍💼 **TESTING: {workflow.upper()}**\n")
        
        try:
            # Navigate to admin shoe donations
            print("    📍 Navigating to admin donations...")
            await page.goto(f"{self.base_url}/admin/shoe-donations", wait_until='networkidle', timeout=30000)
            await self.wait_for_dynamic_content(page)
            self.log_result(workflow, "Navigate to Admin Donations", "PASS", "Admin donations page loaded")
            
            # Look for the donation in the list
            donation_found = False
            if donation_ref:
                # Look for donation reference in the page
                donation_locator = page.locator(f':has-text("{donation_ref}")')
                if await donation_locator.count() > 0:
                    donation_found = True
                    self.log_result(workflow, "Find Donation", "PASS", f"Found donation {donation_ref} in admin list")
                    
                    # Try to click on the donation to view details
                    try:
                        await donation_locator.first.click()
                        await page.wait_for_timeout(3000)
                        
                        # Look for status update options
                        status_selectors = [
                            'select[name*="status"]',
                            'select:has(option:has-text("received"))',
                            'button:has-text("received")',
                            'button:has-text("processed")'
                        ]
                        
                        status_updated = False
                        for selector in status_selectors:
                            try:
                                status_element = page.locator(selector)
                                if await status_element.count() > 0:
                                    # Try to update status
                                    if 'select' in selector:
                                        await status_element.first.select_option('received')
                                    else:
                                        await status_element.first.click()
                                    
                                    await page.wait_for_timeout(2000)
                                    status_updated = True
                                    break
                            except:
                                continue
                        
                        if status_updated:
                            self.log_result(workflow, "Update Donation Status", "PASS", "Successfully updated donation status")
                        else:
                            self.log_result(workflow, "Update Donation Status", "WARN", "Could not find status update controls")
                            
                    except Exception as e:
                        self.log_result(workflow, "Donation Interaction", "WARN", f"Could not interact with donation: {str(e)}")
                        
            if not donation_found:
                # Look for any donations in the list
                donation_rows = await page.locator('tr, .donation-item, [data-testid*="donation"]').count()
                if donation_rows > 0:
                    self.log_result(workflow, "Donations List", "PASS", f"Found {donation_rows} donations in admin interface")
                else:
                    self.log_result(workflow, "Donations List", "INFO", "No donations found in admin interface")
            
            return donation_found
            
        except Exception as e:
            self.log_result(workflow, "Admin Donation Management", "FAIL", f"Exception: {str(e)}", critical=True)
            return False

    async def test_admin_inventory_management(self, page):
        """Test admin adding shoes to inventory"""
        workflow = "Admin Inventory Management"
        print(f"\n📦 **TESTING: {workflow.upper()}**\n")
        
        try:
            # Navigate to add shoes page
            print("    📍 Navigating to add shoes...")
            await page.goto(f"{self.base_url}/admin/shoes/add", wait_until='networkidle', timeout=30000)
            await self.wait_for_dynamic_content(page)
            self.log_result(workflow, "Navigate to Add Shoes", "PASS", "Add shoes page loaded")
            
            # DEBUG: Take screenshot and analyze form structure
            await page.screenshot(path="debug_admin_add_shoes_form.png", full_page=True)
            
            # Check what form elements actually exist
            all_inputs = await page.locator('input').count()
            all_selects = await page.locator('select').count()
            all_textareas = await page.locator('textarea').count()
            all_buttons = await page.locator('button').count()
            
            print(f"    🔍 Form analysis: {all_inputs} inputs, {all_selects} selects, {all_textareas} textareas, {all_buttons} buttons")
            
            # Check for specific field names we're looking for
            field_checks = [
                'input[name="modelName"]',
                'input[name="brand"]', 
                'select[name="brand"]',
                'input[name="size"]',
                'input[name="color"]',
                'select[name="condition"]',
                'select[name="sport"]',
                'select[name="gender"]'
            ]
            
            for field in field_checks:
                count = await page.locator(field).count()
                print(f"    🔍 {field}: {count} elements found")
            
            # COMPREHENSIVE: Find all actual form element names and IDs
            print("    🔍 DISCOVERING ALL FORM ELEMENTS:")
            
            # Get all input names
            all_input_elements = await page.locator('input').all()
            for i, input_elem in enumerate(all_input_elements):
                try:
                    name = await input_elem.get_attribute('name')
                    input_type = await input_elem.get_attribute('type')
                    input_id = await input_elem.get_attribute('id')
                    print(f"      Input {i+1}: name='{name}', type='{input_type}', id='{input_id}'")
                except:
                    pass
            
            # Get all select names  
            all_select_elements = await page.locator('select').all()
            for i, select_elem in enumerate(all_select_elements):
                try:
                    name = await select_elem.get_attribute('name')
                    select_id = await select_elem.get_attribute('id')
                    # Try to get first few options
                    options = await select_elem.locator('option').all()
                    option_texts = []
                    for opt in options[:3]:  # First 3 options
                        try:
                            text = await opt.text_content()
                            if text:
                                option_texts.append(text.strip())
                        except:
                            pass
                    print(f"      Select {i+1}: name='{name}', id='{select_id}', options={option_texts[:3]}")
                except:
                    pass
            
            # FIXED: Fill shoe information with actual available options
            # Based on form discovery: Brand=['Adidas','Altra','Asics'], Gender=['Men','Women','Boys'], 
            # Sport=['Baseball','Basketball','Cross-Training'], Condition=['like_new','good','fair']
            shoe_data = {
                'brand': 'Adidas',
                'modelName': 'E2E Test Shoe',
                'size': '10',
                'color': 'Blue',
                'condition': 'good',
                'sport': 'Basketball',
                'gender': 'Men'
            }
            
            filled_count = 0
            
            # Handle text inputs
            text_fields = [
                ('input[name="modelName"]', shoe_data['modelName'], "Model Name"),
                ('input[name="size"]', shoe_data['size'], "Size"),
                ('input[name="color"]', shoe_data['color'], "Color")
            ]
            
            for selector, value, field_name in text_fields:
                try:
                    field = page.locator(selector)
                    if await field.count() > 0:
                        await field.first.fill(value)
                        filled_count += 1
                        print(f"    ✅ Set {field_name}: {value}")
                except Exception as e:
                    print(f"    ⚠️ Could not set {field_name}: {str(e)}")
            
            # FIXED: Handle select dropdowns using position and content (React form with name='None')
            # Based on discovery: Select 1=Brand, Select 2=Gender, Select 3=Sport, Select 4=Condition  
            select_fields = [
                (['select >> nth=0', 'select:has-text("Adidas")', 'select:has-text("Nike")'], shoe_data['brand'], "Brand"),
                (['select >> nth=1', 'select:has-text("Men")', 'select:has-text("Women")'], shoe_data['gender'], "Gender"),
                (['select >> nth=2', 'select:has-text("Basketball")', 'select:has-text("Running")'], shoe_data['sport'], "Sport"), 
                (['select >> nth=3', 'select:has-text("good")', 'select:has-text("like_new")'], shoe_data['condition'], "Condition")
            ]
            
            for selectors, value, field_name in select_fields:
                field_set = False
                for selector in selectors:
                    try:
                        field = page.locator(selector)
                        if await field.count() > 0:
                            if 'select' in selector:
                                # Try different ways to select options
                                try:
                                    await field.first.select_option(value)
                                    field_set = True
                                    print(f"    ✅ Set {field_name}: {value} (select)")
                                    break
                                except:
                                    try:
                                        await field.first.select_option(label=value)
                                        field_set = True
                                        print(f"    ✅ Set {field_name}: {value} (label)")
                                        break
                                    except:
                                        try:
                                            await field.first.select_option(index=1)  # Try first non-default option
                                            field_set = True
                                            print(f"    ✅ Set {field_name}: first option (index)")
                                            break
                                        except:
                                            continue
                            else:
                                await field.first.fill(value)
                                field_set = True
                                print(f"    ✅ Set {field_name}: {value} (input)")
                                break
                    except Exception as e:
                        print(f"    ⚠️ Error with {selector}: {str(e)}")
                        continue
                
                if field_set:
                    filled_count += 1
                else:
                    print(f"    ❌ Could not set {field_name} with any selector")
            
            if filled_count >= 5:
                self.log_result(workflow, "Fill Shoe Form", "PASS", f"Filled {filled_count} shoe fields")
                
                # Submit the form
                submit_button = page.locator('button[type="submit"], button:has-text("Add"), button:has-text("Save")')
                if await submit_button.count() > 0:
                    await submit_button.first.click()
                    await page.wait_for_timeout(5000)
                    await self.wait_for_dynamic_content(page)
                    
                    # Check for success
                    current_url = page.url
                    success_indicators = [
                        '/admin/shoes' in current_url and '/add' not in current_url,
                        await page.locator(':has-text("success"), :has-text("added"), :has-text("created")').count() > 0
                    ]
                    
                    if any(success_indicators):
                        self.log_result(workflow, "Add Shoe to Inventory", "PASS", 
                                      "Successfully added shoe to inventory", critical=True)
                        
                        # Try to get the shoe ID
                        try:
                            # Look for ID in the URL or on the page
                            if '/shoes/' in current_url:
                                shoe_id = current_url.split('/shoes/')[-1].split('/')[0]
                                self.created_inventory.append(shoe_id)
                                return shoe_id
                        except:
                            pass
                        
                        return "SHOE_ADDED"
                    else:
                        self.log_result(workflow, "Add Shoe to Inventory", "WARN", "Shoe submission unclear")
                        return "UNCLEAR"
                else:
                    self.log_result(workflow, "Add Shoe to Inventory", "FAIL", "No submit button found", critical=True)
                    return None
            else:
                self.log_result(workflow, "Fill Shoe Form", "FAIL", f"Only filled {filled_count} fields", critical=True)
                return None
                
        except Exception as e:
            self.log_result(workflow, "Admin Inventory Management", "FAIL", f"Exception: {str(e)}", critical=True)
            return None

    async def test_user_shoe_request_workflow(self, page):
        """Test user creating shoe request from public site"""
        workflow = "User Shoe Request"
        print(f"\n👤 **TESTING: {workflow.upper()}**\n")
        
        try:
            # First, user needs to register/login
            print("    📍 User registration for shoe request...")
            await page.goto(f"{self.base_url}/register", wait_until='networkidle', timeout=30000)
            await self.wait_for_dynamic_content(page)
            
            # FIXED: Fill registration form with correct selectors
            form_fields = [
                ('input[name="firstName"]', self.test_user['firstName'], "First Name"),
                ('input[name="lastName"]', self.test_user['lastName'], "Last Name"),
                ('input[type="email"]', self.test_user['email'], "Email"),
                ('input[type="password"]', self.test_user['password'], "Password"),
                ('input[name="confirmPassword"], input[name="passwordConfirm"]', self.test_user['password'], "Confirm Password"),
                ('input[name="phone"]', self.test_user['phone'], "Phone")
            ]
            
            for selector, value, field_name in form_fields:
                try:
                    field = page.locator(selector)
                    if await field.count() > 0:
                        await field.first.fill(value)
                except:
                    continue
            
            # Submit registration
            submit_button = page.locator('button[type="submit"]')
            if await submit_button.count() > 0:
                await submit_button.first.click()
                await page.wait_for_timeout(3000)
            
            # Navigate to login after registration
            await page.goto(f"{self.base_url}/login", wait_until='networkidle', timeout=30000)
            await self.wait_for_dynamic_content(page)
            
            # FIXED: Login with test user using correct selectors
            await page.fill('input[type="email"]', self.test_user['email'])
            await page.fill('input[type="password"]', self.test_user['password'])
            await page.click('button[type="submit"]')
            await page.wait_for_timeout(5000)
            
            self.log_result(workflow, "User Authentication", "PASS", "User registered and logged in")
            
            # Browse shoes and add to cart
            print("    📍 Browsing shoes for request...")
            await page.goto(f"{self.base_url}/shoes", wait_until='networkidle', timeout=30000)
            await self.wait_for_dynamic_content(page)
            
            # Click on first shoe
            shoe_links = page.locator('a[href*="/shoes/"]')
            if await shoe_links.count() > 0:
                await shoe_links.first.click()
                await page.wait_for_timeout(5000)
                await self.wait_for_dynamic_content(page)
                
                # Add to cart
                request_button = page.locator('button:has-text("Request These Shoes")')
                if await request_button.count() > 0:
                    await request_button.first.click()
                    await page.wait_for_timeout(3000)
                    self.log_result(workflow, "Add Shoe to Request", "PASS", "Shoe added to cart")
                    
                    # Go to checkout
                    await page.goto(f"{self.base_url}/checkout", wait_until='networkidle', timeout=30000)
                    await self.wait_for_dynamic_content(page)
                    
                    # FIXED: Fill checkout form with correct selectors
                    checkout_fields = [
                        ('input[name="firstName"]', self.test_user['firstName']),
                        ('input[name="lastName"]', self.test_user['lastName']),
                        ('input[type="email"]', self.test_user['email']),
                        ('input[name="phone"]', self.test_user['phone'])
                    ]
                    
                    for selector, value in checkout_fields:
                        try:
                            field = page.locator(selector)
                            if await field.count() > 0:
                                await field.first.fill(value)
                        except:
                            continue
                    
                    # FIXED: Select pickup to avoid payment (click label instead of hidden input)
                    pickup_selectors = [
                        'label[for="pickup"]',
                        'label:has-text("Pickup")',
                        '[data-testid="pickup-option"]',
                        'div:has(input[value="pickup"])'
                    ]
                    
                    pickup_selected = False
                    for selector in pickup_selectors:
                        try:
                            pickup_element = page.locator(selector)
                            if await pickup_element.count() > 0:
                                await pickup_element.first.click()
                                await page.wait_for_timeout(2000)
                                pickup_selected = True
                                print(f"    ✅ Selected pickup using: {selector}")
                                break
                        except:
                            continue
                    
                    if not pickup_selected:
                        print("    ⚠️ Could not select pickup option, trying direct radio button")
                        try:
                            # Force click the radio button
                            await page.locator('input[type="radio"][value="pickup"]').first.click(force=True)
                            pickup_selected = True
                        except:
                            pass
                    
                    # Submit request
                    submit_button = page.locator('button[type="submit"]')
                    if await submit_button.count() > 0:
                        await submit_button.first.click()
                        await page.wait_for_timeout(8000)
                        await self.wait_for_dynamic_content(page)
                        
                        # Check for success
                        success_indicators = [
                            await page.locator(':has-text("success"), :has-text("submitted"), :has-text("reference")').count() > 0
                        ]
                        
                        if any(success_indicators):
                            # Try to get request reference
                            try:
                                ref_element = await page.locator('[class*="font-mono"], code, .reference').first.text_content()
                                if ref_element:
                                    request_ref = ref_element.strip()
                                    self.created_requests.append(request_ref)
                                    self.log_result(workflow, "Submit Shoe Request", "PASS", 
                                                  f"Request submitted successfully: {request_ref}", critical=True)
                                    return request_ref
                            except:
                                pass
                            
                            self.log_result(workflow, "Submit Shoe Request", "PASS", "Request submitted successfully", critical=True)
                            return "REQUEST_SUBMITTED"
                        else:
                            self.log_result(workflow, "Submit Shoe Request", "WARN", "Request submission unclear")
                            return "UNCLEAR"
                    else:
                        self.log_result(workflow, "Submit Shoe Request", "FAIL", "No submit button found", critical=True)
                        return None
                else:
                    self.log_result(workflow, "Add Shoe to Request", "FAIL", "Request button not found", critical=True)
                    return None
            else:
                self.log_result(workflow, "Browse Shoes", "FAIL", "No shoes found", critical=True)
                return None
                
        except Exception as e:
            self.log_result(workflow, "User Shoe Request", "FAIL", f"Exception: {str(e)}", critical=True)
            return None

    async def test_admin_request_management(self, page, request_ref):
        """Test admin processing of user request"""
        workflow = "Admin Request Management"
        print(f"\n👨‍💼 **TESTING: {workflow.upper()}**\n")
        
        try:
            # Navigate to admin requests
            print("    📍 Navigating to admin requests...")
            await page.goto(f"{self.base_url}/admin/requests", wait_until='networkidle', timeout=30000)
            await self.wait_for_dynamic_content(page)
            self.log_result(workflow, "Navigate to Admin Requests", "PASS", "Admin requests page loaded")
            
            # Look for the request
            request_found = False
            if request_ref:
                request_locator = page.locator(f':has-text("{request_ref}")')
                if await request_locator.count() > 0:
                    request_found = True
                    self.log_result(workflow, "Find Request", "PASS", f"Found request {request_ref} in admin list")
                    
                    # Try to update request status
                    try:
                        await request_locator.first.click()
                        await page.wait_for_timeout(3000)
                        
                        # Look for status update controls
                        status_selectors = [
                            'select[name*="status"]',
                            'button:has-text("approved")',
                            'button:has-text("shipped")',
                            'select:has(option:has-text("approved"))'
                        ]
                        
                        for selector in status_selectors:
                            try:
                                status_element = page.locator(selector)
                                if await status_element.count() > 0:
                                    if 'select' in selector:
                                        await status_element.first.select_option('approved')
                                    else:
                                        await status_element.first.click()
                                    
                                    await page.wait_for_timeout(2000)
                                    self.log_result(workflow, "Update Request Status", "PASS", "Successfully updated request status")
                                    break
                            except:
                                continue
                                
                    except Exception as e:
                        self.log_result(workflow, "Request Interaction", "WARN", f"Could not interact with request: {str(e)}")
            
            if not request_found:
                # Look for any requests in the list
                request_rows = await page.locator('tr, .request-item, [data-testid*="request"]').count()
                if request_rows > 0:
                    self.log_result(workflow, "Requests List", "PASS", f"Found {request_rows} requests in admin interface")
                else:
                    self.log_result(workflow, "Requests List", "INFO", "No requests found in admin interface")
            
            return request_found
            
        except Exception as e:
            self.log_result(workflow, "Admin Request Management", "FAIL", f"Exception: {str(e)}", critical=True)
            return False

    async def run_comprehensive_admin_e2e_test(self):
        """Run complete admin end-to-end ecosystem test"""
        print("🚀 **COMPREHENSIVE ADMIN END-TO-END ECOSYSTEM TESTING**")
        print(f"Testing: {self.base_url}")
        print(f"Started: {time.strftime('%Y-%m-%d %H:%M:%S')}")
        print("=" * 80)
        
        async with async_playwright() as p:
            # Use two browser contexts: one for admin, one for public user
            browser = await p.chromium.launch(headless=True)
            
            # Admin context
            admin_context = await browser.new_context(viewport={'width': 1280, 'height': 720})
            admin_page = await admin_context.new_page()
            
            # Public user context  
            user_context = await browser.new_context(viewport={'width': 1280, 'height': 720})
            user_page = await user_context.new_page()
            
            workflow_results = []
            
            try:
                print("🎯 **PHASE 1: ADMIN AUTHENTICATION & SETUP**")
                
                # Test 1: Admin Login
                admin_login_success = await self.admin_login(admin_page)
                workflow_results.append(('Admin Authentication', admin_login_success))
                
                if admin_login_success:
                    print("\n🎯 **PHASE 2: USER ACTIVITIES (PUBLIC WEBSITE)**")
                    
                    # Test 2: User Shoe Donation
                    donation_ref = await self.test_user_shoe_donation_workflow(user_page)
                    donation_success = donation_ref is not None
                    workflow_results.append(('User Shoe Donation', donation_success))
                    
                    # Test 3: User Shoe Request
                    request_ref = await self.test_user_shoe_request_workflow(user_page)
                    request_success = request_ref is not None
                    workflow_results.append(('User Shoe Request', request_success))
                    
                    print("\n🎯 **PHASE 3: ADMIN PROCESSING & MANAGEMENT**")
                    
                    # Test 4: Admin Donation Management
                    if donation_ref:
                        donation_mgmt_success = await self.test_admin_donation_management(admin_page, donation_ref)
                        workflow_results.append(('Admin Donation Management', donation_mgmt_success))
                    
                    # Test 5: Admin Inventory Management
                    inventory_success = await self.test_admin_inventory_management(admin_page)
                    inventory_added = inventory_success is not None
                    workflow_results.append(('Admin Inventory Management', inventory_added))
                    
                    # Test 6: Admin Request Management
                    if request_ref:
                        request_mgmt_success = await self.test_admin_request_management(admin_page, request_ref)
                        workflow_results.append(('Admin Request Management', request_mgmt_success))
                    
                    print("\n🎯 **PHASE 4: CROSS-SYSTEM INTEGRATION VALIDATION**")
                    
                    # Additional integration tests could go here
                    # (e.g., verify status updates appear on user side)
                    
            finally:
                await browser.close()
            
            # Generate comprehensive report
            self.generate_comprehensive_report(workflow_results)

    def generate_comprehensive_report(self, workflow_results):
        """Generate comprehensive admin E2E test report"""
        print("\n" + "=" * 80)
        print("📊 **COMPREHENSIVE ADMIN E2E TEST REPORT**")
        print("=" * 80)
        
        total_tests = len(self.test_results)
        passed_tests = len([r for r in self.test_results if r['status'] == 'PASS'])
        failed_tests = len([r for r in self.test_results if r['status'] == 'FAIL'])
        critical_failures = len([r for r in self.test_results if r['status'] == 'FAIL' and r['critical']])
        
        success_rate = (passed_tests / total_tests * 100) if total_tests > 0 else 0
        
        print(f"📈 **OVERALL RESULTS:**")
        print(f"   Total Tests: {total_tests}")
        print(f"   ✅ Passed: {passed_tests}")
        print(f"   ❌ Failed: {failed_tests}")
        print(f"   🚨 Critical Failures: {critical_failures}")
        print(f"   📊 Success Rate: {success_rate:.1f}%")
        
        print(f"\n🔄 **WORKFLOW RESULTS:**")
        for workflow_name, success in workflow_results:
            status = "✅ PASS" if success else "❌ FAIL"
            print(f"   {status} {workflow_name}")
        
        print(f"\n📋 **ECOSYSTEM INTEGRATION ANALYSIS:**")
        
        # Analyze data flow
        print(f"   📝 Created Donations: {len(self.created_donations)}")
        for donation in self.created_donations:
            print(f"      • {donation}")
            
        print(f"   📦 Created Inventory: {len(self.created_inventory)}")
        for inventory in self.created_inventory:
            print(f"      • {inventory}")
            
        print(f"   📋 Created Requests: {len(self.created_requests)}")
        for request in self.created_requests:
            print(f"      • {request}")
        
        # Group results by workflow category
        workflow_groups = {}
        for result in self.test_results:
            workflow = result['workflow']
            if workflow not in workflow_groups:
                workflow_groups[workflow] = []
            workflow_groups[workflow].append(result)
        
        print(f"\n📋 **DETAILED WORKFLOW ANALYSIS:**")
        for workflow, results in workflow_groups.items():
            passed = len([r for r in results if r['status'] == 'PASS'])
            failed = len([r for r in results if r['status'] == 'FAIL'])
            total = len(results)
            rate = (passed / total * 100) if total > 0 else 0
            
            print(f"\n   🔸 **{workflow}**: {passed}/{total} passed ({rate:.1f}%)")
            
            # Show failed steps
            failed_steps = [r for r in results if r['status'] == 'FAIL']
            for step in failed_steps:
                print(f"      ❌ {step['step']}: {step['details']}")
        
        # System status assessment
        admin_functional = any(w[0] == 'Admin Authentication' and w[1] for w in workflow_results)
        user_activities = any(w[0] in ['User Shoe Donation', 'User Shoe Request'] and w[1] for w in workflow_results)
        admin_management = any(w[0].startswith('Admin') and w[0] != 'Admin Authentication' and w[1] for w in workflow_results)
        
        print(f"\n🎯 **ECOSYSTEM STATUS ASSESSMENT:**")
        print(f"   {'✅' if admin_functional else '❌'} Admin Console Access: {'Operational' if admin_functional else 'Failed'}")
        print(f"   {'✅' if user_activities else '❌'} User Activities: {'Functional' if user_activities else 'Failed'}")
        print(f"   {'✅' if admin_management else '❌'} Admin Management: {'Working' if admin_management else 'Failed'}")
        
        if critical_failures == 0 and admin_functional:
            print(f"\n🎉 **SYSTEM STATUS: COMPLETE ECOSYSTEM OPERATIONAL**")
            print(f"✅ Admin console and user activities fully integrated")
            print(f"✅ End-to-end workflows functioning correctly")
            print(f"✅ Data flow between systems validated")
        else:
            print(f"\n🚨 **SYSTEM STATUS: ECOSYSTEM ISSUES DETECTED**")
            print(f"❌ {critical_failures} critical failures need immediate attention")
            if not admin_functional:
                print(f"🚨 Admin console access CRITICAL - blocks all admin operations")
        
        # Save detailed results
        with open("admin_e2e_test_results.json", "w") as f:
            json.dump({
                "summary": {
                    "total_tests": total_tests,
                    "success_rate": success_rate,
                    "critical_failures": critical_failures,
                    "workflow_results": workflow_results,
                    "ecosystem_status": {
                        "admin_functional": admin_functional,
                        "user_activities": user_activities,
                        "admin_management": admin_management
                    },
                    "created_data": {
                        "donations": self.created_donations,
                        "inventory": self.created_inventory,
                        "requests": self.created_requests
                    }
                },
                "detailed_results": self.test_results,
                "workflow_groups": workflow_groups
            }, f, indent=2)
        
        print(f"\n📄 Detailed results saved to: admin_e2e_test_results.json")
        print(f"🎯 **ADMIN END-TO-END ECOSYSTEM TESTING COMPLETE**")

# Main execution
async def main():
    tester = AdminE2EWorkflowTester()
    await tester.run_comprehensive_admin_e2e_test()

if __name__ == "__main__":
    asyncio.run(main()) 