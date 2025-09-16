#!/usr/bin/env python3
"""
Comprehensive Application Scanner
Systematically scans the entire Next.js application for potential issues
"""

import os
import re
import json
from pathlib import Path
from typing import Dict, List, Set, Tuple
import subprocess

class ApplicationScanner:
    def __init__(self, project_root: str = "."):
        self.project_root = Path(project_root)
        self.src_dir = self.project_root / "src"
        self.issues = []
        
    def scan_all(self) -> Dict:
        """Run all scanning methods and return comprehensive report"""
        print("🔍 Starting Comprehensive Application Scan...")
        
        results = {
            "pages": self.scan_pages(),
            "components": self.scan_components(),
            "apis": self.scan_apis(),
            "forms": self.scan_forms(),
            "hardcoded_content": self.scan_hardcoded_content(),
            "data_fetching": self.scan_data_fetching(),
            "state_management": self.scan_state_management(),
            "interactive_elements": self.scan_interactive_elements(),
            "data_consistency_risks": self.analyze_data_consistency(),
            "issues": self.issues
        }
        
        self.generate_report(results)
        return results
    
    def scan_pages(self) -> List[Dict]:
        """Scan all pages and their characteristics"""
        print("📄 Scanning pages...")
        pages = []
        
        for page_file in self.src_dir.rglob("**/page.tsx"):
            relative_path = page_file.relative_to(self.project_root)
            route = self.extract_route_from_path(page_file)
            
            content = page_file.read_text()
            
            page_info = {
                "file": str(relative_path),
                "route": route,
                "has_useEffect": "useEffect" in content,
                "has_useState": "useState" in content,
                "has_fetch": any(pattern in content for pattern in ["fetch(", "axios.", "useSWR", "useQuery"]),
                "has_forms": any(pattern in content for pattern in ["<form", "onSubmit", "useForm"]),
                "has_dynamic_content": self.check_dynamic_content(content),
                "potential_hardcoded": self.find_hardcoded_patterns(content),
                "interactive_elements": self.count_interactive_elements(content)
            }
            
            pages.append(page_info)
            
            # Flag potential issues
            if page_info["potential_hardcoded"]:
                self.issues.append({
                    "type": "hardcoded_content",
                    "file": str(relative_path),
                    "route": route,
                    "patterns": page_info["potential_hardcoded"]
                })
        
        return pages
    
    def scan_components(self) -> List[Dict]:
        """Scan all components for interactive elements and data usage"""
        print("🧩 Scanning components...")
        components = []
        
        for comp_file in self.src_dir.rglob("components/**/*.tsx"):
            relative_path = comp_file.relative_to(self.project_root)
            content = comp_file.read_text()
            
            comp_info = {
                "file": str(relative_path),
                "has_props": "interface" in content or "type.*Props" in content,
                "has_state": "useState" in content,
                "has_effects": "useEffect" in content,
                "interactive_elements": self.count_interactive_elements(content),
                "data_props": self.find_data_props(content),
                "event_handlers": self.find_event_handlers(content)
            }
            
            components.append(comp_info)
        
        return components
    
    def scan_apis(self) -> List[Dict]:
        """Scan all API endpoints and their methods"""
        print("🔌 Scanning API endpoints...")
        apis = []
        
        for api_file in self.src_dir.rglob("app/api/**/route.ts"):
            relative_path = api_file.relative_to(self.project_root)
            endpoint = self.extract_api_endpoint(api_file)
            content = api_file.read_text()
            
            api_info = {
                "file": str(relative_path),
                "endpoint": endpoint,
                "methods": self.extract_http_methods(content),
                "has_auth": any(pattern in content for pattern in ["getServerSession", "auth", "session"]),
                "has_validation": any(pattern in content for pattern in ["validate", "schema", "zod"]),
                "has_error_handling": "try" in content and "catch" in content,
                "returns_data": "NextResponse.json" in content
            }
            
            apis.append(api_info)
        
        return apis
    
    def scan_forms(self) -> List[Dict]:
        """Scan all forms and their submission handling"""
        print("📝 Scanning forms...")
        forms = []
        
        for tsx_file in self.src_dir.rglob("**/*.tsx"):
            content = tsx_file.read_text()
            
            if any(pattern in content for pattern in ["<form", "onSubmit", "useForm"]):
                relative_path = tsx_file.relative_to(self.project_root)
                
                form_info = {
                    "file": str(relative_path),
                    "has_onSubmit": "onSubmit" in content,
                    "has_validation": any(pattern in content for pattern in ["required", "validate", "schema"]),
                    "has_error_handling": any(pattern in content for pattern in ["error", "Error", "catch"]),
                    "has_loading_state": any(pattern in content for pattern in ["loading", "Loading", "isLoading"]),
                    "has_success_feedback": any(pattern in content for pattern in ["success", "Success", "toast"]),
                    "form_fields": self.extract_form_fields(content)
                }
                
                forms.append(form_info)
                
                # Flag forms with missing error handling
                if not form_info["has_error_handling"]:
                    self.issues.append({
                        "type": "missing_error_handling",
                        "file": str(relative_path),
                        "description": "Form lacks proper error handling"
                    })
        
        return forms
    
    def scan_hardcoded_content(self) -> List[Dict]:
        """Find potentially hardcoded content that should be dynamic"""
        print("🔒 Scanning for hardcoded content...")
        hardcoded = []
        
        suspicious_patterns = [
            r'"No.*[Yy]et"',
            r'"Coming [Ss]oon"',
            r'"[Pp]laceholder"',
            r'"TODO"',
            r'"FIXME"',
            r'"No data"',
            r'"Empty"',
            r'"Not found"',
            r'"Loading\.\.\."'
        ]
        
        for tsx_file in self.src_dir.rglob("**/*.tsx"):
            content = tsx_file.read_text()
            relative_path = tsx_file.relative_to(self.project_root)
            
            for pattern in suspicious_patterns:
                matches = re.findall(pattern, content, re.IGNORECASE)
                if matches:
                    hardcoded.append({
                        "file": str(relative_path),
                        "pattern": pattern,
                        "matches": matches,
                        "line_numbers": self.get_line_numbers(content, pattern)
                    })
        
        return hardcoded
    
    def scan_data_fetching(self) -> List[Dict]:
        """Analyze data fetching patterns"""
        print("📡 Scanning data fetching patterns...")
        data_fetching = []
        
        for tsx_file in self.src_dir.rglob("**/*.tsx"):
            content = tsx_file.read_text()
            relative_path = tsx_file.relative_to(self.project_root)
            
            if any(pattern in content for pattern in ["useEffect", "fetch", "axios"]):
                fetching_info = {
                    "file": str(relative_path),
                    "has_useEffect": "useEffect" in content,
                    "fetch_calls": len(re.findall(r'fetch\s*\(', content)),
                    "api_calls": self.extract_api_calls(content),
                    "has_error_handling": "catch" in content,
                    "has_loading_state": any(pattern in content for pattern in ["loading", "Loading", "isLoading"]),
                    "dependency_arrays": self.extract_useEffect_dependencies(content)
                }
                
                data_fetching.append(fetching_info)
                
                # Flag missing error handling in data fetching
                if fetching_info["fetch_calls"] > 0 and not fetching_info["has_error_handling"]:
                    self.issues.append({
                        "type": "missing_fetch_error_handling",
                        "file": str(relative_path),
                        "description": "Data fetching without proper error handling"
                    })
        
        return data_fetching
    
    def scan_state_management(self) -> List[Dict]:
        """Analyze state management patterns"""
        print("🏪 Scanning state management...")
        state_management = []
        
        for tsx_file in self.src_dir.rglob("**/*.tsx"):
            content = tsx_file.read_text()
            relative_path = tsx_file.relative_to(self.project_root)
            
            if "useState" in content:
                state_info = {
                    "file": str(relative_path),
                    "useState_count": len(re.findall(r'useState', content)),
                    "empty_initial_states": self.find_empty_initial_states(content),
                    "state_variables": self.extract_state_variables(content)
                }
                
                state_management.append(state_info)
        
        return state_management
    
    def scan_interactive_elements(self) -> List[Dict]:
        """Scan all interactive elements (buttons, links, etc.)"""
        print("🖱️ Scanning interactive elements...")
        interactive = []
        
        for tsx_file in self.src_dir.rglob("**/*.tsx"):
            content = tsx_file.read_text()
            relative_path = tsx_file.relative_to(self.project_root)
            
            elements = {
                "file": str(relative_path),
                "buttons": len(re.findall(r'<[Bb]utton|<button', content)),
                "links": len(re.findall(r'<[Ll]ink|href=', content)),
                "forms": len(re.findall(r'<form', content)),
                "inputs": len(re.findall(r'<input', content)),
                "onClick_handlers": len(re.findall(r'onClick', content)),
                "onSubmit_handlers": len(re.findall(r'onSubmit', content)),
                "event_handlers": self.count_event_handlers(content)
            }
            
            if any(elements[key] > 0 for key in ["buttons", "links", "forms", "inputs"]):
                interactive.append(elements)
        
        return interactive
    
    def analyze_data_consistency(self) -> List[Dict]:
        """Analyze potential data consistency issues"""
        print("🔄 Analyzing data consistency risks...")
        consistency_risks = []
        
        # Find pages that display user data
        user_data_pages = []
        for tsx_file in self.src_dir.rglob("**/*.tsx"):
            content = tsx_file.read_text()
            relative_path = tsx_file.relative_to(self.project_root)
            
            # Look for patterns that suggest user data display
            user_data_patterns = [
                r'user\.',
                r'session\.',
                r'profile\.',
                r'account\.',
                r'donation',
                r'request',
                r'order'
            ]
            
            if any(re.search(pattern, content, re.IGNORECASE) for pattern in user_data_patterns):
                user_data_pages.append({
                    "file": str(relative_path),
                    "patterns_found": [pattern for pattern in user_data_patterns if re.search(pattern, content, re.IGNORECASE)],
                    "has_data_fetching": any(pattern in content for pattern in ["useEffect", "fetch", "api/"]),
                    "potential_static_content": self.find_hardcoded_patterns(content)
                })
        
        # Flag pages with user data patterns but no data fetching
        for page in user_data_pages:
            if not page["has_data_fetching"] and page["potential_static_content"]:
                consistency_risks.append({
                    "type": "static_user_data",
                    "file": page["file"],
                    "description": "Page displays user data patterns but lacks dynamic data fetching",
                    "static_content": page["potential_static_content"]
                })
        
        return consistency_risks
    
    # Helper methods
    def extract_route_from_path(self, path: Path) -> str:
        """Extract route from file path"""
        parts = path.parts
        app_index = parts.index("app") if "app" in parts else -1
        if app_index >= 0:
            route_parts = parts[app_index + 1:-1]  # Exclude 'app' and 'page.tsx'
            route = "/" + "/".join(route_parts) if route_parts else "/"
            return route.replace("(", "").replace(")", "")  # Remove route groups
        return "/"
    
    def extract_api_endpoint(self, path: Path) -> str:
        """Extract API endpoint from file path"""
        parts = path.parts
        api_index = parts.index("api") if "api" in parts else -1
        if api_index >= 0:
            endpoint_parts = parts[api_index + 1:-1]  # Exclude 'api' and 'route.ts'
            return "/api/" + "/".join(endpoint_parts) if endpoint_parts else "/api"
        return "/api"
    
    def extract_http_methods(self, content: str) -> List[str]:
        """Extract HTTP methods from API route content"""
        methods = []
        for method in ["GET", "POST", "PUT", "PATCH", "DELETE"]:
            if f"export async function {method}" in content:
                methods.append(method)
        return methods
    
    def check_dynamic_content(self, content: str) -> bool:
        """Check if content has dynamic data patterns"""
        dynamic_patterns = [
            "useEffect",
            "fetch(",
            "axios.",
            "useSWR",
            "useQuery",
            ".map(",
            "{data",
            "loading",
            "error"
        ]
        return any(pattern in content for pattern in dynamic_patterns)
    
    def find_hardcoded_patterns(self, content: str) -> List[str]:
        """Find potentially hardcoded content patterns"""
        patterns = [
            r'"No.*[Yy]et"',
            r'"Coming [Ss]oon"',
            r'"[Pp]laceholder"',
            r'"Empty"',
            r'"Not found"'
        ]
        
        found = []
        for pattern in patterns:
            matches = re.findall(pattern, content, re.IGNORECASE)
            found.extend(matches)
        
        return found
    
    def count_interactive_elements(self, content: str) -> Dict[str, int]:
        """Count interactive elements in content"""
        return {
            "buttons": len(re.findall(r'<[Bb]utton|<button', content)),
            "links": len(re.findall(r'<[Ll]ink|href=', content)),
            "forms": len(re.findall(r'<form', content)),
            "inputs": len(re.findall(r'<input', content)),
            "onClick": len(re.findall(r'onClick', content))
        }
    
    def find_data_props(self, content: str) -> List[str]:
        """Find data-related props in component"""
        prop_patterns = [
            r'(\w+):\s*\w+\[\]',  # Array props
            r'(\w+):\s*\w+\|null',  # Nullable props
            r'data\w*:',  # Data props
            r'items:',  # Items props
            r'user:',  # User props
        ]
        
        props = []
        for pattern in prop_patterns:
            matches = re.findall(pattern, content)
            props.extend(matches)
        
        return props
    
    def find_event_handlers(self, content: str) -> List[str]:
        """Find event handlers in content"""
        handler_patterns = [
            r'on\w+\s*=',
            r'handle\w+',
            r'onClick',
            r'onSubmit',
            r'onChange'
        ]
        
        handlers = []
        for pattern in handler_patterns:
            matches = re.findall(pattern, content)
            handlers.extend(matches)
        
        return list(set(handlers))  # Remove duplicates
    
    def extract_form_fields(self, content: str) -> List[str]:
        """Extract form field names"""
        field_patterns = [
            r'name="([^"]+)"',
            r'id="([^"]+)"',
            r'register\("([^"]+)"\)'
        ]
        
        fields = []
        for pattern in field_patterns:
            matches = re.findall(pattern, content)
            fields.extend(matches)
        
        return list(set(fields))
    
    def extract_api_calls(self, content: str) -> List[str]:
        """Extract API call URLs"""
        api_patterns = [
            r'fetch\s*\(\s*[\'"`]([^\'"]+)[\'"`]',
            r'axios\.\w+\s*\(\s*[\'"`]([^\'"]+)[\'"`]',
            r'[\'"`](/api/[^\'"]+)[\'"`]'
        ]
        
        calls = []
        for pattern in api_patterns:
            matches = re.findall(pattern, content)
            calls.extend(matches)
        
        return calls
    
    def extract_useEffect_dependencies(self, content: str) -> List[str]:
        """Extract useEffect dependency arrays"""
        dep_pattern = r'useEffect\s*\([^,]+,\s*\[([^\]]*)\]'
        matches = re.findall(dep_pattern, content)
        return [match.strip() for match in matches]
    
    def find_empty_initial_states(self, content: str) -> List[str]:
        """Find useState with empty initial values"""
        empty_patterns = [
            r'useState\s*\(\s*\[\s*\]\s*\)',  # Empty array
            r'useState\s*\(\s*null\s*\)',     # Null
            r'useState\s*\(\s*[\'"`][\'"`]\s*\)',  # Empty string
            r'useState\s*\(\s*false\s*\)'     # False
        ]
        
        empty_states = []
        for pattern in empty_patterns:
            matches = re.findall(pattern, content)
            empty_states.extend(matches)
        
        return empty_states
    
    def extract_state_variables(self, content: str) -> List[str]:
        """Extract state variable names"""
        state_pattern = r'const\s*\[\s*(\w+)\s*,'
        matches = re.findall(state_pattern, content)
        return matches
    
    def count_event_handlers(self, content: str) -> int:
        """Count total event handlers"""
        handler_patterns = [
            r'on\w+\s*=',
            r'handle\w+'
        ]
        
        total = 0
        for pattern in handler_patterns:
            total += len(re.findall(pattern, content))
        
        return total
    
    def get_line_numbers(self, content: str, pattern: str) -> List[int]:
        """Get line numbers where pattern appears"""
        lines = content.split('\n')
        line_numbers = []
        
        for i, line in enumerate(lines, 1):
            if re.search(pattern, line, re.IGNORECASE):
                line_numbers.append(i)
        
        return line_numbers
    
    def generate_report(self, results: Dict):
        """Generate comprehensive report"""
        print("\n" + "="*60)
        print("📊 COMPREHENSIVE APPLICATION SCAN REPORT")
        print("="*60)
        
        print(f"\n📄 Pages Scanned: {len(results['pages'])}")
        print(f"🧩 Components Scanned: {len(results['components'])}")
        print(f"🔌 API Endpoints: {len(results['apis'])}")
        print(f"📝 Forms Found: {len(results['forms'])}")
        
        print(f"\n🚨 Issues Found: {len(results['issues'])}")
        for issue in results['issues']:
            print(f"  • {issue['type']}: {issue['file']}")
            if 'description' in issue:
                print(f"    {issue['description']}")
        
        print(f"\n🔒 Hardcoded Content Instances: {len(results['hardcoded_content'])}")
        for hc in results['hardcoded_content'][:5]:  # Show first 5
            print(f"  • {hc['file']}: {hc['matches']}")
        
        print(f"\n🔄 Data Consistency Risks: {len(results['data_consistency_risks'])}")
        for risk in results['data_consistency_risks']:
            print(f"  • {risk['file']}: {risk['description']}")
        
        # Save detailed report
        with open('comprehensive_scan_report.json', 'w') as f:
            json.dump(results, f, indent=2)
        
        print(f"\n💾 Detailed report saved to: comprehensive_scan_report.json")
        print("="*60)

if __name__ == "__main__":
    scanner = ApplicationScanner()
    results = scanner.scan_all()
