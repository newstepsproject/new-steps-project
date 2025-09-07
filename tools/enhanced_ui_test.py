#!/usr/bin/env python3
"""
Enhanced UI Testing Script with Improved Methodology
Addresses gaps identified in previous testing approach
"""

import asyncio
import json
import time
import os
import requests
from playwright.async_api import async_playwright
from urllib.parse import urljoin
import hashlib

class EnhancedUITester:
    def __init__(self, base_url="https://newsteps.fit"):
        self.base_url = base_url
        self.test_results = []
        self.critical_images = [
            "/images/home_photo-optimized.jpg",
            "/images/home_photo-400w.webp", 
            "/images/home_photo-400w.jpg",
            "/images/logo.png",
            "/images/placeholder-shoe.jpg"
        ]
        
    def log_result(self, test_name, status, details, critical=False):
        """Log test result with criticality flag"""
        result = {
            "test": test_name,
            "status": status,
            "details": details, 
            "critical": critical,
            "timestamp": time.strftime("%Y-%m-%d %H:%M:%S")
        }
        self.test_results.append(result)
        
        status_symbol = "✅" if status == "PASS" else "❌" if status == "FAIL" else "⚠️"
        critical_flag = " [CRITICAL]" if critical else ""
        print(f"{status_symbol} {test_name}{critical_flag}: {details}")

    def validate_http_response(self, url, expected_content_type=None):
        """Enhanced HTTP validation - checks status AND content"""
        try:
            response = requests.head(url, timeout=10)
            content_length = int(response.headers.get('Content-Length', 0))
            content_type = response.headers.get('Content-Type', '')
            
            validation = {
                "status_code": response.status_code,
                "content_length": content_length,
                "content_type": content_type,
                "has_content": content_length > 0,
                "headers": dict(response.headers)
            }
            
            # Critical validation for images
            if expected_content_type and "image" in expected_content_type:
                if response.status_code == 200 and content_length == 0:
                    return False, f"Empty image content (Content-Length: 0)"
                elif response.status_code != 200:
                    return False, f"HTTP {response.status_code}"
                elif content_length < 100:  # Suspiciously small image
                    return False, f"Suspicious image size: {content_length} bytes"
                    
            return response.status_code == 200 and content_length > 0, validation
                    
        except Exception as e:
            return False, f"Request failed: {str(e)}"

    async def test_critical_images(self):
        """Test all critical images with enhanced validation"""
        print("\n🖼️  **TESTING CRITICAL IMAGES**\n")
        
        failed_images = []
        
        for image_path in self.critical_images:
            image_url = urljoin(self.base_url, image_path)
            success, details = self.validate_http_response(image_url, "image")
            
            if success:
                content_info = f"✅ {details['content_length']} bytes, {details['content_type']}"
                self.log_result(f"Image: {image_path}", "PASS", content_info, critical=True)
            else:
                failed_images.append(image_path)
                self.log_result(f"Image: {image_path}", "FAIL", str(details), critical=True)
        
        return len(failed_images) == 0, failed_images

    async def test_page_with_dom_inspection(self, url, page_name):
        """Enhanced page testing with DOM inspection and console monitoring"""
        print(f"\n🔍 **TESTING PAGE: {page_name.upper()}**\n")
        
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            page = await browser.new_page()
            
            # Collect console messages and errors
            console_messages = []
            network_failures = []
            
            page.on('console', lambda msg: console_messages.append({
                'type': msg.type,
                'text': msg.text,
                'location': f"{msg.location['url']}:{msg.location['lineNumber']}" if msg.location else "unknown"
            }))
            
            page.on('requestfailed', lambda req: network_failures.append({
                'url': req.url,
                'method': req.method,
                'failure': req.failure
            }))
            
            try:
                # Load page and wait for network idle
                print(f"Loading {url}...")
                response = await page.goto(url, wait_until='networkidle', timeout=30000)
                
                # Wait additional time for dynamic content
                await page.wait_for_timeout(3000)
                
                # Test basic page loading
                status_code = response.status if response else 0
                if status_code == 200:
                    self.log_result(f"{page_name} - Page Load", "PASS", f"HTTP {status_code}")
                else:
                    self.log_result(f"{page_name} - Page Load", "FAIL", f"HTTP {status_code}", critical=True)
                    return False
                
                # Test critical images on page
                await self.test_images_on_page(page, page_name)
                
                # Test console errors
                error_messages = [msg for msg in console_messages if msg['type'] == 'error']
                if error_messages:
                    error_details = f"{len(error_messages)} errors: " + "; ".join([msg['text'][:100] for msg in error_messages[:3]])
                    self.log_result(f"{page_name} - Console Errors", "FAIL", error_details, critical=True)
                else:
                    self.log_result(f"{page_name} - Console Errors", "PASS", "No console errors")
                
                # Test network failures  
                if network_failures:
                    failure_details = f"{len(network_failures)} failures: " + "; ".join([f"{fail['url']}" for fail in network_failures[:3]])
                    self.log_result(f"{page_name} - Network Failures", "FAIL", failure_details, critical=True)
                else:
                    self.log_result(f"{page_name} - Network Failures", "PASS", "No network failures")
                
                # Take screenshot for visual verification
                screenshot_path = f"enhanced_test_{page_name.lower()}.png"
                await page.screenshot(path=screenshot_path, full_page=True)
                self.log_result(f"{page_name} - Screenshot", "PASS", f"Saved to {screenshot_path}")
                
                await browser.close()
                return len(error_messages) == 0 and len(network_failures) == 0
                
            except Exception as e:
                await browser.close()
                self.log_result(f"{page_name} - Page Test", "FAIL", f"Exception: {str(e)}", critical=True)
                return False

    async def test_images_on_page(self, page, page_name):
        """Test all images on a specific page via DOM inspection"""
        try:
            # Find all image elements
            images = await page.locator('img').all()
            picture_sources = await page.locator('picture source').all()
            
            total_images = len(images) + len(picture_sources)
            
            if total_images == 0:
                self.log_result(f"{page_name} - Images", "WARN", "No images found on page")
                return
            
            failed_images = []
            
            # Test img elements
            for i, img in enumerate(images):
                try:
                    src = await img.get_attribute('src')
                    alt = await img.get_attribute('alt')
                    is_visible = await img.is_visible()
                    
                    if src and not src.startswith('data:'):  # Skip data URLs
                        # Test if image loads
                        natural_width = await img.evaluate("img => img.naturalWidth")
                        natural_height = await img.evaluate("img => img.naturalHeight")
                        
                        if natural_width > 0 and natural_height > 0:
                            self.log_result(f"{page_name} - Image {i+1}", "PASS", 
                                          f"Loaded: {natural_width}x{natural_height}, visible: {is_visible}")
                        else:
                            failed_images.append(f"img[src='{src[:50]}...']")
                            self.log_result(f"{page_name} - Image {i+1}", "FAIL", 
                                          f"Failed to load: {src[:50]}...", critical=True)
                            
                except Exception as e:
                    failed_images.append(f"img[{i}]")
                    self.log_result(f"{page_name} - Image {i+1}", "FAIL", f"DOM error: {str(e)}", critical=True)
            
            # Test picture elements
            for i, source in enumerate(picture_sources):
                try:
                    srcset = await source.get_attribute('srcset')
                    if srcset:
                        # Test first URL in srcset
                        first_url = srcset.split(',')[0].split()[0]
                        success, details = self.validate_http_response(urljoin(self.base_url, first_url), "image")
                        
                        if success:
                            self.log_result(f"{page_name} - Picture Source {i+1}", "PASS", f"Responsive image OK")
                        else:
                            failed_images.append(f"source[srcset='{first_url}']")
                            self.log_result(f"{page_name} - Picture Source {i+1}", "FAIL", str(details), critical=True)
                            
                except Exception as e:
                    self.log_result(f"{page_name} - Picture Source {i+1}", "FAIL", f"DOM error: {str(e)}", critical=True)
            
            if failed_images:
                self.log_result(f"{page_name} - Overall Images", "FAIL", 
                              f"{len(failed_images)} images failed to load", critical=True)
            else:
                self.log_result(f"{page_name} - Overall Images", "PASS", 
                              f"All {total_images} images loaded successfully")
                
        except Exception as e:
            self.log_result(f"{page_name} - Image Testing", "FAIL", f"DOM inspection failed: {str(e)}", critical=True)

    async def run_comprehensive_test(self):
        """Run the complete enhanced test suite"""
        print("🚀 **ENHANCED UI TESTING - IMPROVED METHODOLOGY**")
        print(f"Testing: {self.base_url}")
        print(f"Started: {time.strftime('%Y-%m-%d %H:%M:%S')}")
        print("=" * 60)
        
        # Test 1: Critical Images Validation
        images_success, failed_images = await self.test_critical_images()
        
        # Test 2: Critical Pages with DOM Inspection
        critical_pages = [
            (f"{self.base_url}/", "Homepage"),
            (f"{self.base_url}/shoes", "Shoes Browse"),
            (f"{self.base_url}/shoes/1", "Shoe Detail"),
            (f"{self.base_url}/cart", "Cart"),
            (f"{self.base_url}/checkout", "Checkout"),
            (f"{self.base_url}/login", "Login"),
            (f"{self.base_url}/donate/shoes", "Donate Shoes")
        ]
        
        page_results = []
        for url, name in critical_pages:
            success = await self.test_page_with_dom_inspection(url, name)
            page_results.append(success)
        
        # Generate final report
        self.generate_final_report(images_success, page_results, failed_images)

    def generate_final_report(self, images_success, page_results, failed_images):
        """Generate comprehensive test report"""
        print("\n" + "=" * 60)
        print("📊 **ENHANCED TESTING FINAL REPORT**")
        print("=" * 60)
        
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
        
        if critical_failures == 0:
            print(f"\n🎉 **SYSTEM STATUS: FULLY OPERATIONAL**")
            print(f"✅ All critical tests passed")
            print(f"✅ No critical image failures")
            print(f"✅ No critical page failures")
        else:
            print(f"\n🚨 **SYSTEM STATUS: CRITICAL ISSUES DETECTED**")
            print(f"❌ {critical_failures} critical failures require immediate attention")
        
        if failed_images:
            print(f"\n🖼️  **FAILED IMAGES:**")
            for img in failed_images:
                print(f"   ❌ {img}")
        
        # Save detailed results
        with open("enhanced_test_results.json", "w") as f:
            json.dump({
                "summary": {
                    "total_tests": total_tests,
                    "passed": passed_tests,
                    "failed": failed_tests,
                    "critical_failures": critical_failures,
                    "success_rate": success_rate,
                    "images_success": images_success,
                    "failed_images": failed_images
                },
                "detailed_results": self.test_results
            }, f, indent=2)
        
        print(f"\n📄 Detailed results saved to: enhanced_test_results.json")
        print(f"🖼️  Screenshots saved with prefix: enhanced_test_")

# Main execution
async def main():
    tester = EnhancedUITester()
    await tester.run_comprehensive_test()

if __name__ == "__main__":
    asyncio.run(main()) 