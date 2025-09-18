#!/usr/bin/env python3
"""
Comprehensive Test Suite
Integrates all testing approaches for complete platform validation
"""

import asyncio
import json
from datetime import datetime
from database_logic_test import DatabaseLogicTester
from session_injection_test import SessionInjectionTester
from authenticated_api_test import AuthenticatedAPITester
from user_api_test import UserAPITester

class ComprehensiveTestSuite:
    def __init__(self, base_url="http://localhost:3000"):
        self.base_url = base_url
        self.results = {
            "timestamp": datetime.now().isoformat(),
            "test_suite_version": "1.0",
            "base_url": base_url,
            "test_results": {},
            "summary": {}
        }
    
    async def run_all_tests(self):
        """Run all testing approaches"""
        print("🚀 STARTING COMPREHENSIVE TEST SUITE")
        print("=" * 80)
        print(f"Testing Platform: {self.base_url}")
        print(f"Test Suite Version: 1.0")
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
        
        # Generate comprehensive summary
        self.generate_comprehensive_summary()
        self.save_results()
        
        return self.results
    
    def generate_comprehensive_summary(self):
        """Generate comprehensive test summary across all approaches"""
        print("\n" + "=" * 80)
        print("📊 COMPREHENSIVE TEST SUITE SUMMARY")
        print("=" * 80)
        
        # Extract results from each test approach
        test_approaches = {
            "Database Logic": self.results["test_results"].get("database_logic", {}),
            "Session Injection": self.results["test_results"].get("session_injection", {}),
            "Authenticated API": self.results["test_results"].get("authenticated_api", {}),
            "User API": self.results["test_results"].get("user_api", {})
        }
        
        overall_stats = {
            "total_approaches": len(test_approaches),
            "successful_approaches": 0,
            "total_tests": 0,
            "total_passed": 0,
            "approach_details": {}
        }
        
        # Analyze each approach
        for approach_name, approach_results in test_approaches.items():
            summary = approach_results.get("summary", {})
            success_rate = summary.get("overall_success_rate", 0)
            total_tests = summary.get("total_tests", 0)
            total_passed = summary.get("total_passed", 0)
            
            # Consider approach successful if >= 80% success rate
            is_successful = success_rate >= 80.0
            
            if is_successful:
                overall_stats["successful_approaches"] += 1
            
            overall_stats["total_tests"] += total_tests
            overall_stats["total_passed"] += total_passed
            
            overall_stats["approach_details"][approach_name] = {
                "success_rate": success_rate,
                "total_tests": total_tests,
                "total_passed": total_passed,
                "is_successful": is_successful,
                "status": "✅ EXCELLENT" if success_rate >= 90 else "✅ GOOD" if success_rate >= 80 else "⚠️ NEEDS WORK" if success_rate >= 60 else "❌ CRITICAL"
            }
            
            print(f"{approach_name:20} | {success_rate:6.1f}% | {total_passed:2d}/{total_tests:2d} tests | {overall_stats['approach_details'][approach_name]['status']}")
        
        # Calculate overall success rate
        overall_success_rate = (overall_stats["total_passed"] / overall_stats["total_tests"] * 100) if overall_stats["total_tests"] > 0 else 0
        approach_success_rate = (overall_stats["successful_approaches"] / overall_stats["total_approaches"] * 100) if overall_stats["total_approaches"] > 0 else 0
        
        print("-" * 80)
        print(f"{'OVERALL RESULTS':20} | {overall_success_rate:6.1f}% | {overall_stats['total_passed']:2d}/{overall_stats['total_tests']:2d} tests | {overall_stats['successful_approaches']}/{overall_stats['total_approaches']} approaches")
        
        # Determine overall status
        if approach_success_rate >= 75 and overall_success_rate >= 85:
            overall_status = "🎉 PRODUCTION READY"
            status_message = "All critical systems operational!"
        elif approach_success_rate >= 50 and overall_success_rate >= 70:
            overall_status = "✅ MOSTLY READY"
            status_message = "Minor issues to address before production"
        elif approach_success_rate >= 25 and overall_success_rate >= 50:
            overall_status = "⚠️ NEEDS WORK"
            status_message = "Significant issues need resolution"
        else:
            overall_status = "❌ NOT READY"
            status_message = "Critical issues must be fixed"
        
        print("=" * 80)
        print(f"FINAL STATUS: {overall_status}")
        print(f"ASSESSMENT: {status_message}")
        print("=" * 80)
        
        # Store summary
        self.results["summary"] = {
            "overall_success_rate": overall_success_rate,
            "approach_success_rate": approach_success_rate,
            "total_approaches": overall_stats["total_approaches"],
            "successful_approaches": overall_stats["successful_approaches"],
            "total_tests": overall_stats["total_tests"],
            "total_passed": overall_stats["total_passed"],
            "overall_status": overall_status,
            "status_message": status_message,
            "approach_details": overall_stats["approach_details"],
            "recommendations": self.generate_recommendations(overall_stats)
        }
    
    def generate_recommendations(self, stats):
        """Generate recommendations based on test results"""
        recommendations = []
        
        for approach_name, details in stats["approach_details"].items():
            if details["success_rate"] < 80:
                if approach_name == "Database Logic":
                    recommendations.append("Review database operations and business logic validation")
                elif approach_name == "Session Injection":
                    recommendations.append("Investigate admin form accessibility and session management")
                elif approach_name == "Authenticated API":
                    recommendations.append("Fix admin API authentication and endpoint functionality")
                elif approach_name == "User API":
                    recommendations.append("Resolve user authentication issues for requests and profile APIs")
        
        if stats["successful_approaches"] < stats["total_approaches"]:
            recommendations.append("Address failing test approaches before production deployment")
        
        if len(recommendations) == 0:
            recommendations.append("All systems operational - ready for production testing")
        
        return recommendations
    
    def save_results(self):
        """Save comprehensive results to JSON file"""
        filename = f"comprehensive_test_results_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        with open(filename, 'w') as f:
            json.dump(self.results, f, indent=2)
        print(f"\n💾 Comprehensive results saved to: {filename}")
        
        # Also create a summary report
        summary_filename = f"test_summary_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.md"
        self.create_summary_report(summary_filename)
        print(f"📋 Summary report saved to: {summary_filename}")
    
    def create_summary_report(self, filename):
        """Create a markdown summary report"""
        with open(filename, 'w') as f:
            f.write("# Comprehensive Test Suite Report\n\n")
            f.write(f"**Generated:** {self.results['timestamp']}\\n")
            f.write(f"**Platform:** {self.base_url}\\n")
            f.write(f"**Test Suite Version:** {self.results['test_suite_version']}\\n\\n")
            
            f.write("## Overall Results\n\n")
            summary = self.results["summary"]
            f.write(f"- **Final Status:** {summary['overall_status']}\\n")
            f.write(f"- **Assessment:** {summary['status_message']}\\n")
            f.write(f"- **Overall Success Rate:** {summary['overall_success_rate']:.1f}%\\n")
            f.write(f"- **Successful Approaches:** {summary['successful_approaches']}/{summary['total_approaches']}\\n")
            f.write(f"- **Total Tests Passed:** {summary['total_passed']}/{summary['total_tests']}\\n\\n")
            
            f.write("## Test Approach Results\n\n")
            f.write("| Approach | Success Rate | Tests Passed | Status |\\n")
            f.write("|----------|--------------|--------------|--------|\\n")
            
            for approach_name, details in summary["approach_details"].items():
                f.write(f"| {approach_name} | {details['success_rate']:.1f}% | {details['total_passed']}/{details['total_tests']} | {details['status']} |\\n")
            
            f.write("\\n## Recommendations\n\n")
            for i, rec in enumerate(summary["recommendations"], 1):
                f.write(f"{i}. {rec}\\n")
            
            f.write("\\n## Next Steps\n\n")
            if summary["overall_success_rate"] >= 85:
                f.write("✅ **Ready for Production Testing** - All critical systems operational\\n")
                f.write("- Deploy to production environment\\n")
                f.write("- Conduct user acceptance testing\\n")
                f.write("- Monitor system performance\\n")
            else:
                f.write("⚠️ **Address Issues Before Production** - Some systems need attention\\n")
                f.write("- Fix failing test approaches\\n")
                f.write("- Re-run comprehensive testing\\n")
                f.write("- Validate fixes in development environment\\n")

async def main():
    """Main function to run comprehensive test suite"""
    suite = ComprehensiveTestSuite()
    await suite.run_all_tests()

if __name__ == "__main__":
    asyncio.run(main())
