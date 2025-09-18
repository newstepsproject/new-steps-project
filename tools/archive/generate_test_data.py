#!/usr/bin/env python3
"""
Generate High-Volume Test Data
Creates realistic datasets to test pagination and performance
"""

import asyncio
import json
import random
from datetime import datetime, timedelta
import requests
import sys

class TestDataGenerator:
    def __init__(self, base_url="http://localhost:3000"):
        self.base_url = base_url
        self.results = {
            "timestamp": datetime.now().isoformat(),
            "generated_data": {},
            "api_responses": {}
        }
        
    def generate_realistic_shoes(self, count=100):
        """Generate realistic shoe data"""
        brands = ["Nike", "Adidas", "Puma", "New Balance", "ASICS", "Brooks", "Saucony", "Mizuno", "Under Armour", "Reebok"]
        models = ["Air Max", "Ultraboost", "Gel-Kayano", "Fresh Foam", "React", "Boost", "Wave", "Pegasus", "Ghost", "Clifton"]
        sports = ["running", "basketball", "soccer", "tennis", "training", "walking", "golf", "baseball"]
        conditions = ["like_new", "good", "fair"]
        genders = ["men", "women", "unisex"]
        colors = ["Black", "White", "Red", "Blue", "Gray", "Green", "Navy", "Brown", "Pink", "Purple"]
        
        shoes = []
        for i in range(count):
            shoe = {
                "brand": random.choice(brands),
                "modelName": f"{random.choice(models)} {random.randint(1, 99)}",
                "gender": random.choice(genders),
                "size": f"{random.randint(6, 14)}.{random.choice([0, 5])}",
                "color": f"{random.choice(colors)}/{random.choice(colors)}",
                "sport": random.choice(sports),
                "condition": random.choice(conditions),
                "description": f"Great {random.choice(['running', 'basketball', 'casual'])} shoe in {random.choice(['excellent', 'good', 'fair'])} condition",
                "inventoryCount": random.randint(1, 3),
                "status": "available"
            }
            shoes.append(shoe)
            
        return shoes
    
    def generate_realistic_donations(self, count=50):
        """Generate realistic donation data"""
        first_names = ["John", "Sarah", "Mike", "Lisa", "David", "Emma", "Chris", "Anna", "Tom", "Maria"]
        last_names = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez"]
        cities = ["San Francisco", "Oakland", "Berkeley", "San Jose", "Palo Alto", "Mountain View", "Fremont", "Hayward"]
        
        donations = []
        for i in range(count):
            donation = {
                "donorInfo": {
                    "firstName": random.choice(first_names),
                    "lastName": random.choice(last_names),
                    "email": f"donor{i}@example.com",
                    "phone": f"({random.randint(400, 999)}) {random.randint(100, 999)}-{random.randint(1000, 9999)}",
                    "address": {
                        "street": f"{random.randint(100, 9999)} {random.choice(['Main', 'Oak', 'Pine', 'Cedar'])} St",
                        "city": random.choice(cities),
                        "state": "CA",
                        "zipCode": f"9{random.randint(4000, 4999)}",
                        "country": "USA"
                    }
                },
                "donationType": "online",
                "donationDescription": f"Donating {random.randint(2, 8)} pairs of shoes in good condition",
                "status": random.choice(["submitted", "received", "processed"])
            }
            donations.append(donation)
            
        return donations
    
    def generate_realistic_money_donations(self, count=30):
        """Generate realistic money donation data"""
        first_names = ["Jennifer", "Michael", "Jessica", "Christopher", "Ashley", "Matthew", "Amanda", "Joshua", "Stephanie", "Andrew"]
        last_names = ["Anderson", "Taylor", "Thomas", "Hernandez", "Moore", "Martin", "Jackson", "Thompson", "White", "Lopez"]
        
        money_donations = []
        for i in range(count):
            amount = random.choice([25, 50, 100, 150, 200, 250, 500, 1000])
            donation = {
                "firstName": random.choice(first_names),
                "lastName": random.choice(last_names),
                "email": f"moneydonor{i}@example.com",
                "phone": f"({random.randint(400, 999)}) {random.randint(100, 999)}-{random.randint(1000, 9999)}",
                "amount": amount,
                "message": f"Happy to support this great cause with ${amount}!",
                "isAnonymous": random.choice([True, False]),
                "status": random.choice(["submitted", "received", "processed"])
            }
            money_donations.append(donation)
            
        return money_donations
    
    def generate_realistic_requests(self, count=25):
        """Generate realistic request data"""
        first_names = ["Alex", "Taylor", "Jordan", "Casey", "Morgan", "Riley", "Avery", "Quinn", "Sage", "River"]
        last_names = ["Wilson", "Moore", "Taylor", "Anderson", "Thomas", "Jackson", "White", "Harris", "Martin", "Garcia"]
        
        requests = []
        for i in range(count):
            request = {
                "requestorInfo": {
                    "firstName": random.choice(first_names),
                    "lastName": random.choice(last_names),
                    "email": f"requester{i}@example.com",
                    "phone": f"({random.randint(400, 999)}) {random.randint(100, 999)}-{random.randint(1000, 9999)}"
                },
                "shippingInfo": {
                    "address": {
                        "street": f"{random.randint(100, 9999)} {random.choice(['First', 'Second', 'Third', 'Fourth'])} Ave",
                        "city": random.choice(["San Francisco", "Oakland", "Berkeley", "San Jose"]),
                        "state": "CA",
                        "zipCode": f"9{random.randint(4000, 4999)}",
                        "country": "USA"
                    },
                    "shippingMethod": random.choice(["standard", "pickup"])
                },
                "items": [
                    {
                        "shoeId": random.randint(1, 50),
                        "size": f"{random.randint(6, 14)}.{random.choice([0, 5])}",
                        "gender": random.choice(["men", "women", "unisex"])
                    }
                ],
                "status": random.choice(["submitted", "approved", "shipped", "rejected"])
            }
            requests.append(request)
            
        return requests
    
    async def create_test_data_via_api(self):
        """Create test data via API calls"""
        print("🚀 Generating High-Volume Test Data...")
        
        # Generate data
        shoes = self.generate_realistic_shoes(100)
        donations = self.generate_realistic_donations(50)
        money_donations = self.generate_realistic_money_donations(30)
        requests = self.generate_realistic_requests(25)
        
        self.results["generated_data"] = {
            "shoes": len(shoes),
            "donations": len(donations),
            "money_donations": len(money_donations),
            "requests": len(requests)
        }
        
        print(f"📊 Generated:")
        print(f"   👟 {len(shoes)} shoes")
        print(f"   📦 {len(donations)} shoe donations")
        print(f"   💰 {len(money_donations)} money donations")
        print(f"   📋 {len(requests)} requests")
        
        # Note: Actually creating this data would require admin authentication
        # For now, we'll save the generated data to files for manual import
        
        # Save generated data
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        
        with open(f"test_data_shoes_{timestamp}.json", 'w') as f:
            json.dump(shoes, f, indent=2)
            
        with open(f"test_data_donations_{timestamp}.json", 'w') as f:
            json.dump(donations, f, indent=2)
            
        with open(f"test_data_money_donations_{timestamp}.json", 'w') as f:
            json.dump(money_donations, f, indent=2)
            
        with open(f"test_data_requests_{timestamp}.json", 'w') as f:
            json.dump(requests, f, indent=2)
        
        print(f"\n💾 Test data saved to files with timestamp {timestamp}")
        print(f"📋 To import this data, use the admin interface or create import scripts")
        
        return self.results
    
    def analyze_current_data_volume(self):
        """Analyze current data volume in the system"""
        print("\n📊 Analyzing Current Data Volume...")
        
        try:
            # Check shoes
            shoes_response = requests.get(f"{self.base_url}/api/shoes", timeout=10)
            if shoes_response.status_code == 200:
                shoes_data = shoes_response.json()
                shoes_count = len(shoes_data.get('shoes', []))
                print(f"   👟 Current shoes: {shoes_count}")
                
                if shoes_count < 20:
                    print(f"   ⚠️  LOW VOLUME: Need more shoes for pagination testing")
                elif shoes_count < 50:
                    print(f"   📈 MEDIUM VOLUME: Adequate for basic testing")
                else:
                    print(f"   ✅ HIGH VOLUME: Good for comprehensive testing")
            else:
                print(f"   ❌ Failed to fetch shoes: {shoes_response.status_code}")
        
        except Exception as e:
            print(f"   ❌ Error analyzing data volume: {e}")
    
    def create_pagination_test_recommendations(self):
        """Create recommendations for pagination testing"""
        print("\n💡 Pagination Testing Recommendations:")
        print("   1. ✅ Generate 100+ shoes to test pagination")
        print("   2. ✅ Generate 50+ donations to test admin lists")
        print("   3. ✅ Generate 30+ money donations for admin dashboard")
        print("   4. ✅ Generate 25+ requests for admin processing")
        print("   5. 🔍 Test pagination controls (next, previous, page numbers)")
        print("   6. 🔍 Test items per page settings (10, 25, 50, 100)")
        print("   7. 🔍 Test search and filtering with large datasets")
        print("   8. 🔍 Test sorting functionality with many items")
        print("   9. 🔍 Test performance with realistic data volumes")
        print("   10. 🔍 Test mobile responsiveness with paginated lists")

async def main():
    """Generate test data and analyze current volume"""
    print("📊 HIGH-VOLUME TEST DATA GENERATOR")
    print("=" * 50)
    
    generator = TestDataGenerator()
    
    # Analyze current data volume
    generator.analyze_current_data_volume()
    
    # Generate test data
    results = await generator.create_test_data_via_api()
    
    # Provide recommendations
    generator.create_pagination_test_recommendations()
    
    print(f"\n🎯 NEXT STEPS:")
    print(f"   1. Import generated test data via admin interface")
    print(f"   2. Run pagination tests with realistic data volumes")
    print(f"   3. Test admin dashboard performance with large datasets")
    print(f"   4. Validate search and filtering functionality")
    print(f"   5. Test mobile responsiveness with paginated data")
    
    return results

if __name__ == "__main__":
    asyncio.run(main())
