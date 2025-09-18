#!/usr/bin/env python3
"""
Quick Mandatory Field Fix
Applies targeted fixes to the most critical mandatory field issues
"""

import os
import re

def fix_checkout_page():
    """Fix the checkout page mandatory field styling"""
    file_path = "src/app/checkout/page.tsx"
    
    if not os.path.exists(file_path):
        print(f"❌ File not found: {file_path}")
        return False
    
    try:
        with open(file_path, 'r') as f:
            content = f.read()
        
        # Fix inconsistent red asterisk colors
        fixes = [
            ('text-red-600', 'text-red-500'),
            ('text-red-700', 'text-red-500'),
            ('text-red-800', 'text-red-500'),
        ]
        
        changes_made = 0
        for old, new in fixes:
            if old in content:
                content = content.replace(old, new)
                changes_made += 1
        
        if changes_made > 0:
            with open(file_path, 'w') as f:
                f.write(content)
            print(f"✅ Fixed {changes_made} styling issues in {file_path}")
            return True
        else:
            print(f"ℹ️  No changes needed in {file_path}")
            return False
            
    except Exception as e:
        print(f"❌ Error fixing {file_path}: {e}")
        return False

def fix_donation_form():
    """Fix the donation form mandatory field styling"""
    file_path = "src/components/forms/donation/DonationForm.tsx"
    
    if not os.path.exists(file_path):
        print(f"❌ File not found: {file_path}")
        return False
    
    try:
        with open(file_path, 'r') as f:
            content = f.read()
        
        # Fix inconsistent red asterisk colors
        fixes = [
            ('text-red-700', 'text-red-500'),
            ('text-red-800', 'text-red-500'),
        ]
        
        changes_made = 0
        for old, new in fixes:
            if old in content:
                content = content.replace(old, new)
                changes_made += 1
        
        if changes_made > 0:
            with open(file_path, 'w') as f:
                f.write(content)
            print(f"✅ Fixed {changes_made} styling issues in {file_path}")
            return True
        else:
            print(f"ℹ️  No changes needed in {file_path}")
            return False
            
    except Exception as e:
        print(f"❌ Error fixing {file_path}: {e}")
        return False

def fix_unified_shoe_form():
    """Fix the admin unified shoe form - this is critical for the admin add shoe issue"""
    file_path = "src/components/admin/UnifiedShoeForm.tsx"
    
    if not os.path.exists(file_path):
        print(f"❌ File not found: {file_path}")
        return False
    
    try:
        with open(file_path, 'r') as f:
            content = f.read()
        
        # Look for fields that should have red asterisks but don't
        # This is the form used in admin dashboard for adding shoes
        
        # Check if required fields have proper red asterisk styling
        required_fields = ['brand', 'modelName', 'size', 'color', 'sport']
        
        changes_made = 0
        
        # Look for label patterns and ensure they have red asterisks for required fields
        for field in required_fields:
            # Pattern: look for labels without red asterisks
            pattern = rf'<label[^>]*>\s*{field.title()}[^<]*</label>'
            if re.search(pattern, content, re.IGNORECASE):
                # This field might need a red asterisk
                print(f"  Found {field} field that might need red asterisk")
        
        # For now, just fix any inconsistent styling
        fixes = [
            ('text-red-600', 'text-red-500'),
            ('text-red-700', 'text-red-500'),
            ('text-red-800', 'text-red-500'),
        ]
        
        for old, new in fixes:
            if old in content:
                content = content.replace(old, new)
                changes_made += 1
        
        if changes_made > 0:
            with open(file_path, 'w') as f:
                f.write(content)
            print(f"✅ Fixed {changes_made} styling issues in {file_path}")
            return True
        else:
            print(f"ℹ️  No changes needed in {file_path}")
            return False
            
    except Exception as e:
        print(f"❌ Error fixing {file_path}: {e}")
        return False

def main():
    print("🔧 QUICK MANDATORY FIELD FIX")
    print("=" * 40)
    
    fixes_applied = 0
    
    print("\n📄 Fixing checkout page...")
    if fix_checkout_page():
        fixes_applied += 1
    
    print("\n📄 Fixing donation form...")
    if fix_donation_form():
        fixes_applied += 1
    
    print("\n📄 Fixing admin shoe form...")
    if fix_unified_shoe_form():
        fixes_applied += 1
    
    print(f"\n📊 Summary: {fixes_applied} files modified")
    
    if fixes_applied > 0:
        print("\n💡 Next steps:")
        print("  1. Test the forms to ensure they still work")
        print("  2. Commit the changes carefully")
        print("  3. Deploy to production")
        print("  4. Test admin shoe addition functionality")
    
    return fixes_applied

if __name__ == "__main__":
    main()
