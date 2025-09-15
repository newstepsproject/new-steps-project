#!/usr/bin/env python3
"""
Frontend Form Inspector
Inspects actual HTML structure of all forms for accurate selector mapping
"""

import asyncio
import json
from playwright.async_api import async_playwright

class FrontendFormInspector:
    def __init__(self, base_url="http://localhost:3000"):
        self.base_url = base_url
        self.form_structures = {}
        self.admin_session = None
    
    async def login_admin(self, browser):
        """Login as admin to access admin forms"""
        context = await browser.new_context()
        page = await context.new_page()
        
        try:
            await page.goto(f"{self.base_url}/login")
            await page.wait_for_load_state('networkidle')
            
            # Fill login form
            await page.fill('input[type="email"]', 'admin@newsteps.fit')
            await page.fill('input[type="password"]', 'Admin123!')
            await page.click('button[type="submit"]')
            
            await page.wait_for_timeout(3000)
            return context, page
            
        except Exception as e:
            await context.close()
            raise e
    
    async def inspect_form_structure(self, page, form_name, form_url, is_modal=False, modal_trigger=None):
        """Inspect the structure of a specific form"""
        try:
            await page.goto(form_url)
            await page.wait_for_load_state('networkidle')
            
            # Handle modal forms
            if is_modal and modal_trigger:
                if modal_trigger == "donate":
                    # Money donation modal
                    donate_buttons = page.locator('button:has-text("Get Started")')
                    if await donate_buttons.count() >= 2:
                        await donate_buttons.nth(1).click()  # Financial Support
                        await page.wait_for_timeout(2000)
                elif modal_trigger == "partner":
                    # Partnership modal
                    partner_buttons = page.locator('button:has-text("Get Started")')
                    if await partner_buttons.count() >= 3:
                        await partner_buttons.nth(2).click()  # Partnership
                        await page.wait_for_timeout(2000)
            
            # Find all form elements
            forms = await page.locator('form').all()
            
            form_data = {
                "url": form_url,
                "is_modal": is_modal,
                "forms_found": len(forms),
                "fields": {},
                "submit_buttons": [],
                "success_indicators": []
            }
            
            if forms:
                form = forms[0]  # Use first form
                
                # Find all input fields
                inputs = await form.locator('input').all()
                for input_elem in inputs:
                    try:
                        input_type = await input_elem.get_attribute('type') or 'text'
                        input_name = await input_elem.get_attribute('name') or ''
                        input_id = await input_elem.get_attribute('id') or ''
                        input_placeholder = await input_elem.get_attribute('placeholder') or ''
                        input_required = await input_elem.get_attribute('required') is not None
                        input_readonly = await input_elem.get_attribute('readonly') is not None
                        
                        field_key = input_name or input_id or f"input_{input_type}"
                        form_data["fields"][field_key] = {
                            "type": "input",
                            "input_type": input_type,
                            "name": input_name,
                            "id": input_id,
                            "placeholder": input_placeholder,
                            "required": input_required,
                            "readonly": input_readonly,
                            "selectors": [
                                f'input[name="{input_name}"]' if input_name else None,
                                f'input[id="{input_id}"]' if input_id else None,
                                f'input[type="{input_type}"]' if input_type != 'text' else None
                            ]
                        }
                        form_data["fields"][field_key]["selectors"] = [s for s in form_data["fields"][field_key]["selectors"] if s]
                        
                    except Exception as e:
                        print(f"Error inspecting input: {e}")
                
                # Find all textarea fields
                textareas = await form.locator('textarea').all()
                for textarea in textareas:
                    try:
                        textarea_name = await textarea.get_attribute('name') or ''
                        textarea_id = await textarea.get_attribute('id') or ''
                        textarea_placeholder = await textarea.get_attribute('placeholder') or ''
                        textarea_required = await textarea.get_attribute('required') is not None
                        
                        field_key = textarea_name or textarea_id or "textarea"
                        form_data["fields"][field_key] = {
                            "type": "textarea",
                            "name": textarea_name,
                            "id": textarea_id,
                            "placeholder": textarea_placeholder,
                            "required": textarea_required,
                            "selectors": [
                                f'textarea[name="{textarea_name}"]' if textarea_name else None,
                                f'textarea[id="{textarea_id}"]' if textarea_id else None
                            ]
                        }
                        form_data["fields"][field_key]["selectors"] = [s for s in form_data["fields"][field_key]["selectors"] if s]
                        
                    except Exception as e:
                        print(f"Error inspecting textarea: {e}")
                
                # Find all select fields
                selects = await form.locator('select').all()
                for select in selects:
                    try:
                        select_name = await select.get_attribute('name') or ''
                        select_id = await select.get_attribute('id') or ''
                        select_required = await select.get_attribute('required') is not None
                        
                        # Get options
                        options = await select.locator('option').all()
                        option_values = []
                        for option in options:
                            value = await option.get_attribute('value') or ''
                            text = await option.text_content() or ''
                            option_values.append({"value": value, "text": text})
                        
                        field_key = select_name or select_id or "select"
                        form_data["fields"][field_key] = {
                            "type": "select",
                            "name": select_name,
                            "id": select_id,
                            "required": select_required,
                            "options": option_values,
                            "selectors": [
                                f'select[name="{select_name}"]' if select_name else None,
                                f'select[id="{select_id}"]' if select_id else None
                            ]
                        }
                        form_data["fields"][field_key]["selectors"] = [s for s in form_data["fields"][field_key]["selectors"] if s]
                        
                    except Exception as e:
                        print(f"Error inspecting select: {e}")
                
                # Find submit buttons
                submit_buttons = await form.locator('button[type="submit"], input[type="submit"]').all()
                for button in submit_buttons:
                    try:
                        button_text = await button.text_content() or ''
                        button_value = await button.get_attribute('value') or ''
                        button_class = await button.get_attribute('class') or ''
                        
                        form_data["submit_buttons"].append({
                            "text": button_text.strip(),
                            "value": button_value,
                            "class": button_class,
                            "selectors": [
                                'button[type="submit"]',
                                f'button:has-text("{button_text.strip()}")' if button_text.strip() else None,
                                f'input[type="submit"][value="{button_value}"]' if button_value else None
                            ]
                        })
                        
                    except Exception as e:
                        print(f"Error inspecting button: {e}")
            
            # Look for success indicators on the page
            success_patterns = [
                'text="Thank you"',
                'text="Success"',
                'text="submitted"',
                'text="created"',
                'text="added"',
                'text="saved"',
                '[role="alert"]',
                '.toast',
                '.success',
                '.alert-success'
            ]
            
            for pattern in success_patterns:
                try:
                    if await page.locator(pattern).count() > 0:
                        form_data["success_indicators"].append(pattern)
                except:
                    pass
            
            return form_data
            
        except Exception as e:
            return {
                "url": form_url,
                "error": str(e),
                "fields": {},
                "submit_buttons": [],
                "success_indicators": []
            }
    
    async def inspect_all_forms(self):
        """Inspect all forms in the application"""
        print("🔍 **FRONTEND FORM INSPECTION**\n")
        
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            
            # Visitor Forms
            print("📋 **INSPECTING VISITOR FORMS**")
            
            visitor_forms = [
                {
                    "name": "Shoe Donation Form",
                    "url": f"{self.base_url}/donate/shoes",
                    "is_modal": False
                },
                {
                    "name": "Money Donation Form", 
                    "url": f"{self.base_url}/get-involved",
                    "is_modal": True,
                    "modal_trigger": "donate"
                },
                {
                    "name": "Contact Form",
                    "url": f"{self.base_url}/contact",
                    "is_modal": False
                },
                {
                    "name": "Volunteer Form",
                    "url": f"{self.base_url}/volunteer", 
                    "is_modal": False
                },
                {
                    "name": "Partnership Form",
                    "url": f"{self.base_url}/get-involved",
                    "is_modal": True,
                    "modal_trigger": "partner"
                }
            ]
            
            context = await browser.new_context()
            page = await context.new_page()
            
            for form_info in visitor_forms:
                print(f"Inspecting {form_info['name']}...")
                structure = await self.inspect_form_structure(
                    page, 
                    form_info['name'],
                    form_info['url'],
                    form_info.get('is_modal', False),
                    form_info.get('modal_trigger')
                )
                self.form_structures[form_info['name']] = structure
                
                if 'error' in structure:
                    print(f"  ❌ Error: {structure['error']}")
                else:
                    print(f"  ✅ Found {len(structure['fields'])} fields, {len(structure['submit_buttons'])} submit buttons")
            
            await context.close()
            
            # User Forms
            print("\n👤 **INSPECTING USER FORMS**")
            
            user_forms = [
                {
                    "name": "Registration Form",
                    "url": f"{self.base_url}/register",
                    "is_modal": False
                },
                {
                    "name": "Login Form", 
                    "url": f"{self.base_url}/login",
                    "is_modal": False
                },
                {
                    "name": "Checkout Form",
                    "url": f"{self.base_url}/checkout",
                    "is_modal": False
                }
            ]
            
            context = await browser.new_context()
            page = await context.new_page()
            
            for form_info in user_forms:
                print(f"Inspecting {form_info['name']}...")
                structure = await self.inspect_form_structure(
                    page,
                    form_info['name'], 
                    form_info['url'],
                    form_info.get('is_modal', False)
                )
                self.form_structures[form_info['name']] = structure
                
                if 'error' in structure:
                    print(f"  ❌ Error: {structure['error']}")
                else:
                    print(f"  ✅ Found {len(structure['fields'])} fields, {len(structure['submit_buttons'])} submit buttons")
            
            await context.close()
            
            # Admin Forms (requires login)
            print("\n🔧 **INSPECTING ADMIN FORMS**")
            
            try:
                admin_context, admin_page = await self.login_admin(browser)
                print("✅ Admin login successful")
                
                admin_forms = [
                    {
                        "name": "Add Shoe Form",
                        "url": f"{self.base_url}/admin/shoes/add",
                        "is_modal": False
                    },
                    {
                        "name": "Admin Settings Form",
                        "url": f"{self.base_url}/admin/settings", 
                        "is_modal": False
                    },
                    {
                        "name": "Add Money Donation Form",
                        "url": f"{self.base_url}/admin/money-donations/add",
                        "is_modal": False
                    }
                ]
                
                for form_info in admin_forms:
                    print(f"Inspecting {form_info['name']}...")
                    structure = await self.inspect_form_structure(
                        admin_page,
                        form_info['name'],
                        form_info['url'], 
                        form_info.get('is_modal', False)
                    )
                    self.form_structures[form_info['name']] = structure
                    
                    if 'error' in structure:
                        print(f"  ❌ Error: {structure['error']}")
                    else:
                        print(f"  ✅ Found {len(structure['fields'])} fields, {len(structure['submit_buttons'])} submit buttons")
                
                await admin_context.close()
                
            except Exception as e:
                print(f"❌ Admin login failed: {e}")
            
            await browser.close()
        
        return self.form_structures
    
    def save_inspection_results(self, filename="form_inspection_results.json"):
        """Save inspection results to JSON file"""
        try:
            with open(filename, 'w') as f:
                json.dump(self.form_structures, f, indent=2)
            print(f"\n💾 **Inspection results saved to {filename}**")
        except Exception as e:
            print(f"\n⚠️ **Could not save to {filename}: {e}**")
            # Save to current directory instead
            try:
                with open("form_inspection_results.json", 'w') as f:
                    json.dump(self.form_structures, f, indent=2)
                print(f"💾 **Saved to current directory: form_inspection_results.json**")
            except Exception as e2:
                print(f"❌ **Could not save results: {e2}**")
    
    def generate_selector_report(self):
        """Generate a report of recommended selectors for each form"""
        print(f"\n📊 **SELECTOR RECOMMENDATIONS REPORT**\n")
        
        for form_name, structure in self.form_structures.items():
            if 'error' in structure:
                print(f"❌ **{form_name}**: {structure['error']}")
                continue
                
            print(f"✅ **{form_name}**")
            print(f"   URL: {structure['url']}")
            print(f"   Modal: {structure.get('is_modal', False)}")
            
            if structure['fields']:
                print("   Fields:")
                for field_name, field_info in structure['fields'].items():
                    print(f"     • {field_name} ({field_info['type']})")
                    if field_info.get('selectors'):
                        print(f"       Recommended: {field_info['selectors'][0]}")
                    if field_info.get('readonly'):
                        print(f"       ⚠️ READONLY - Skip in tests")
            
            if structure['submit_buttons']:
                print("   Submit Buttons:")
                for button in structure['submit_buttons']:
                    print(f"     • \"{button['text']}\"")
                    if button.get('selectors'):
                        recommended = [s for s in button['selectors'] if s][0]
                        print(f"       Recommended: {recommended}")
            
            print()

async def main():
    """Run frontend form inspection"""
    inspector = FrontendFormInspector()
    results = await inspector.inspect_all_forms()
    inspector.save_inspection_results("tools/form_inspection_results.json")
    inspector.generate_selector_report()

if __name__ == "__main__":
    asyncio.run(main())
