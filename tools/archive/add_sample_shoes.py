#!/usr/bin/env python3
"""
Add Sample Shoes to Database
Fix Issue #1: No shoes available for cart testing
"""

import requests
import json

def add_sample_shoes():
    """Add sample shoes using admin API"""
    base_url = "http://localhost:3000"
    
    # Sample shoes data
    sample_shoes = [
        {
            "brand": "Nike",
            "modelName": "Air Max 90",
            "gender": "men",
            "size": "10",
            "color": "White/Black",
            "sport": "running",
            "condition": "good",
            "description": "Classic Nike Air Max 90 in excellent condition",
            "features": ["Air cushioning", "Leather upper", "Rubber sole"],
            "status": "available",
            "inventoryCount": 1,
            "inventoryNotes": "Added for testing"
        },
        {
            "brand": "Adidas",
            "modelName": "Ultraboost 22",
            "gender": "women",
            "size": "8",
            "color": "Black/White",
            "sport": "running",
            "condition": "excellent",
            "description": "Adidas Ultraboost with responsive cushioning",
            "features": ["Boost midsole", "Primeknit upper", "Continental rubber"],
            "status": "available",
            "inventoryCount": 1,
            "inventoryNotes": "Added for testing"
        },
        {
            "brand": "Converse",
            "modelName": "Chuck Taylor All Star",
            "gender": "unisex",
            "size": "9",
            "color": "Red",
            "sport": "casual",
            "condition": "good",
            "description": "Classic Converse high-top sneakers",
            "features": ["Canvas upper", "Rubber toe cap", "Iconic design"],
            "status": "available",
            "inventoryCount": 1,
            "inventoryNotes": "Added for testing"
        },
        {
            "brand": "Vans",
            "modelName": "Old Skool",
            "gender": "unisex",
            "size": "10.5",
            "color": "Black/White",
            "sport": "skateboarding",
            "condition": "good",
            "description": "Classic Vans Old Skool with side stripe",
            "features": ["Suede and canvas upper", "Waffle outsole", "Side stripe"],
            "status": "available",
            "inventoryCount": 1,
            "inventoryNotes": "Added for testing"
        },
        {
            "brand": "New Balance",
            "modelName": "990v5",
            "gender": "men",
            "size": "11",
            "color": "Grey",
            "sport": "running",
            "condition": "excellent",
            "description": "New Balance 990v5 Made in USA",
            "features": ["ENCAP midsole", "Pigskin and mesh upper", "Made in USA"],
            "status": "available",
            "inventoryCount": 1,
            "inventoryNotes": "Added for testing"
        }
    ]
    
    print("🔧 Adding sample shoes to database...")
    print("=" * 50)
    
    # First, check if we need admin authentication
    # We'll need to simulate admin login or use test endpoint
    
    added_count = 0
    failed_count = 0
    
    for i, shoe_data in enumerate(sample_shoes, 1):
        try:
            print(f"Adding shoe {i}/5: {shoe_data['brand']} {shoe_data['modelName']}")
            
            # Try to add shoe via admin API
            response = requests.post(
                f"{base_url}/api/admin/shoes",
                json=shoe_data,
                timeout=10
            )
            
            if response.status_code == 201:
                result = response.json()
                shoe_id = result.get('shoe', {}).get('shoeId', 'Unknown')
                print(f"✅ Added successfully - Shoe ID: {shoe_id}")
                added_count += 1
            elif response.status_code == 401:
                print("❌ Authentication required - trying test endpoint")
                # Try test endpoint if available
                test_response = requests.post(
                    f"{base_url}/api/test/shoes",
                    json=shoe_data,
                    timeout=10
                )
                if test_response.status_code in [200, 201]:
                    print("✅ Added via test endpoint")
                    added_count += 1
                else:
                    print(f"❌ Test endpoint failed: {test_response.status_code}")
                    failed_count += 1
            else:
                print(f"❌ Failed: {response.status_code} - {response.text}")
                failed_count += 1
                
        except Exception as e:
            print(f"❌ Error adding shoe: {str(e)}")
            failed_count += 1
    
    print("\n" + "=" * 50)
    print(f"📊 RESULTS:")
    print(f"   Added: {added_count}")
    print(f"   Failed: {failed_count}")
    print(f"   Total: {len(sample_shoes)}")
    
    if added_count > 0:
        print("✅ Sample shoes added successfully!")
        
        # Verify by checking shoes API
        try:
            verify_response = requests.get(f"{base_url}/api/shoes", timeout=10)
            if verify_response.status_code == 200:
                shoes = verify_response.json()
                print(f"🔍 Verification: {len(shoes)} shoes now available")
            else:
                print("⚠️ Could not verify - check manually")
        except:
            print("⚠️ Could not verify - check manually")
    else:
        print("🚨 No shoes were added - authentication issue")
        print("💡 Solution: Login as admin first, or create test endpoint")
    
    return added_count > 0

if __name__ == "__main__":
    success = add_sample_shoes()
    if success:
        print("\n🎯 Ready to re-test cart operations!")
    else:
        print("\n🔧 Need to fix authentication first")
