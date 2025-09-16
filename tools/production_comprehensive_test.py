#!/usr/bin/env python3
"""
Production Comprehensive Test Suite
Runs all 4-layer testing approaches on production environment
"""

import asyncio
import json
import sys
import argparse
from datetime import datetime

# Import all test modules
sys.path.append('tools')
from database_logic_test import DatabaseLogicTester
from session_injection_test import SessionInjectionTester
from authenticated_api_test import AuthenticatedAPITester
from user_api_test import UserAPITester

class ProductionComprehensiveTestSuite:
    def __init__(self, base_url="https://newsteps.fit"):
        self.base_url = base_url
        self.results = {
            "timestamp": datetime.now().isoformat(),
            "test_suite_version": "1.0 - Production",
            "base_url": base_url,
            "test_results": {},
            "summary": {}
        }
    
    async def run_all_tests(self):
        """Run all testing approaches on production"""
        print("🚀 STARTING PRODUCTION COMPREHENSIVE TEST SUITE")
        print("=" * 80)
        print(f"Testing Platform: {self.base_url}")
        print(f"Environment: PRODUCTION")
        print(f"Test Suite Version: 1.0 - Production")
        print(f"Timestamp: {datetime.now().isoformat()}")
        print("=" * 80)
        
        # Test 1: Database Logic Testing
        print("\n🧪 PHASE 1: DATABASE LOGIC TESTING")
        print("-" * 50)
        db_tester = DatabaseLogicTester(self.base_url)
        db_results = db_tester.run_database_tests()
        self.results["test_results"]["database_logic"] = db_results
        
        # Test 2: Session Injection Testing
        print("\n🔐 PHASE 2: SESSION INJECTION TESTING")
        print("-" * 50)
        session_tester = SessionInjectionTester(self.base_url)
        session_results = await session_tester.run_session_tests()
        self.results["test_results"]["session_injection"] = session_results
        
        # Test 3: Authenticated API Testing
        print("\n🔑 PHASE 3: AUTHENTICATED API TESTING")
        print("-" * 50)
        api_tester = AuthenticatedAPITester(self.base_url)
        api_results = api_tester.run_authenticated_tests()
        self.results["test_results"]["authenticated_api"] = api_results
        
        # Test 4: User API Testing
        print("\n👤 PHASE 4: USER API TESTING")
        print("-" * 50)
        user_tester = UserAPITester(self.base_url)
        user_results = user_tester.run_user_tests()
        self.results["test_results"]["user_api"] = user_results
        
        # Generate overall summary
        self.generate_overall_summary()
        self.save_results()
        
        return self.results
    
    def generate_overall_summary(self):
        """Generate comprehensive summary of all test results"""
        print("\n" + "=" * 80)
        print("📊 PRODUCTION COMPREHENSIVE TEST SUITE SUMMARY")
        print("=" * 80)
        
        # Analyze each test category
        categories = {
            "Database Logic": self.results["test_results"].get("database_logic", {}),
            "Session Injection": self.results["test_results"].get("session_injection", {}),
            "Authenticated API": self.results["test_results"].get("authenticated_api", {}),
            "User API": self.results["test_results"].get("user_api", {})
        }
        
        total_approaches = 0
        successful_approaches = 0
        total_tests = 0
        successful_tests = 0
        
        for category_name, category_data in categories.items():
            if category_data and "summary" in category_data:
                summary = category_data["summary"]
                
                # Extract success metrics
                success_rate = summary.get("overall_success_rate", 0.0)
                tests_passed = summary.get("successful_tests", 0)
                tests_total = summary.get("total_tests", 0)
                
                total_approaches += 1
                total_tests += tests_total
                successful_tests += tests_passed
                
                if success_rate >= 70.0:
                    successful_approaches += 1
                    status = "✅ PASS"
                else:
                    status = "❌ FAIL"
                
                print(f"{category_name:20} | {success_rate:6.1f}% | {tests_passed:2d}/{tests_total:2d} tests | {status}")
            else:
                print(f"{category_name:20} | {'ERROR':>6} | No data available | ❌ FAIL")
        
        # Calculate overall metrics
        overall_success_rate = (successful_tests / total_tests * 100) if total_tests > 0 else 0
        approach_success_rate = (successful_approaches / total_approaches * 100) if total_approaches > 0 else 0
        
        print("-" * 80)
        print(f"{'OVERALL RESULTS':20} | {overall_success_rate:6.1f}% | {successful_tests:2d}/{total_tests:2d} tests | {successful_approaches}/{total_approaches} approaches")
        print("=" * 80)
        
        # Final assessment
        if overall_success_rate >= 85 and approach_success_rate >= 75:
            final_status = "🎉 PRODUCTION READY"
            assessment = "System ready for full production use"
        elif overall_success_rate >= 70 and approach_success_rate >= 50:
            final_status = "✅ MOSTLY READY"
            assessment = "System mostly ready, minor issues to address"
        else:
            final_status = "❌ NOT READY"
            assessment = "Critical issues must be fixed"
        
        print(f"FINAL STATUS: {final_status}")
        print(f"ASSESSMENT: {assessment}")
        print("=" * 80)
        
        # Store summary
        self.results["summary"] = {
            "total_tests": total_tests,
            "successful_tests": successful_tests,
            "total_approaches": total_approaches,
            "successful_approaches": successful_approaches,
            "overall_success_rate": overall_success_rate,
            "approach_success_rate": approach_success_rate,
            "final_status": final_status,
            "assessment": assessment,
            "environment": "PRODUCTION",
            "base_url": self.base_url
        }
    
    def save_results(self):
        """Save comprehensive test results"""
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        
        # Save detailed results
        results_filename = f"production_comprehensive_test_results_{timestamp}.json"
        with open(results_filename, 'w') as f:
            json.dump(self.results, f, indent=2)
        print(f"\n💾 Production comprehensive results saved to: {results_filename}")
        
        # Save summary report
        summary_filename = f"production_test_summary_report_{timestamp}.md"
        with open(summary_filename, 'w') as f:
            f.write(f"# Production Comprehensive Test Summary\n\n")
            f.write(f"**Generated:** {self.results['timestamp']}\n")
            f.write(f"**Environment:** PRODUCTION\n")
            f.write(f"**Target URL:** {self.base_url}\n\n")
            f.write(f"## Overall Results\n\n")
            f.write(f"- **Success Rate:** {self.results['summary']['overall_success_rate']:.1f}%\n")
            f.write(f"- **Tests Passed:** {self.results['summary']['successful_tests']}/{self.results['summary']['total_tests']}\n")
            f.write(f"- **Approaches Working:** {self.results['summary']['successful_approaches']}/{self.results['summary']['total_approaches']}\n")
            f.write(f"- **Final Status:** {self.results['summary']['final_status']}\n")
            f.write(f"- **Assessment:** {self.results['summary']['assessment']}\n\n")
            
            # Add detailed results for each category
            for category_name, category_data in self.results["test_results"].items():
                if category_data and "summary" in category_data:
                    f.write(f"### {category_name.replace('_', ' ').title()}\n\n")
                    summary = category_data["summary"]
                    f.write(f"- Success Rate: {summary.get('overall_success_rate', 0):.1f}%\n")
                    f.write(f"- Tests: {summary.get('successful_tests', 0)}/{summary.get('total_tests', 0)}\n")
                    f.write(f"- Status: {summary.get('status', 'Unknown')}\n\n")
        
        print(f"📋 Production summary report saved to: {summary_filename}")

async def main():
    """Main function with command-line argument support"""
    parser = argparse.ArgumentParser(description='Production Comprehensive Testing')
    parser.add_argument('--url', default='https://newsteps.fit',
                       help='Target URL (default: https://newsteps.fit)')
    
    args = parser.parse_args()
    
    tester = ProductionComprehensiveTestSuite(base_url=args.url)
    await tester.run_all_tests()

if __name__ == "__main__":
    asyncio.run(main())
