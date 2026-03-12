#!/usr/bin/env python3

import requests
import sys
import json
import time
from datetime import datetime
import tempfile
import os

class NotebookLMAPITester:
    def __init__(self, base_url="https://moh-theme-preview.preview.emergentagent.com"):
        self.base_url = base_url
        self.session = requests.Session()
        self.session.headers.update({
            'Content-Type': 'application/json',
            'User-Agent': 'NotebookLM-API-Tester/1.0'
        })
        self.tests_run = 0
        self.tests_passed = 0
        self.test_sources = []  # Store created sources for cleanup

    def log(self, message, level="INFO"):
        timestamp = datetime.now().strftime("%H:%M:%S")
        print(f"[{timestamp}] {level}: {message}")

    def run_test(self, test_name, method, endpoint, expected_status, data=None, files=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        self.tests_run += 1
        
        print(f"\n🔍 Test {self.tests_run}: {test_name}")
        print(f"   URL: {method} {url}")
        
        try:
            headers = {}
            if files:
                # For file uploads, don't set Content-Type header
                headers = {k: v for k, v in self.session.headers.items() if k.lower() != 'content-type'}
                response = self.session.request(method, url, data=data, files=files, headers=headers)
            else:
                response = self.session.request(method, url, json=data)
            
            # Check status code
            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ PASSED - Status: {response.status_code}")
                
                # Try to parse JSON response for additional info
                try:
                    json_data = response.json()
                    if endpoint == "api/sources/upload" or endpoint == "api/sources/url":
                        source_id = json_data.get('id')
                        if source_id:
                            self.test_sources.append(source_id)
                            print(f"   Source ID: {source_id}")
                    
                    # Show key response data
                    if isinstance(json_data, dict):
                        if 'message' in json_data:
                            print(f"   Message: {json_data['message']}")
                        if 'id' in json_data:
                            print(f"   ID: {json_data['id']}")
                        if 'type' in json_data:
                            print(f"   Type: {json_data['type']}")
                        if 'status' in json_data:
                            print(f"   Status: {json_data['status']}")
                except:
                    print(f"   Response length: {len(response.text)} chars")
            else:
                print(f"❌ FAILED - Expected {expected_status}, got {response.status_code}")
                print(f"   Response: {response.text[:200]}...")
                
            return success, response

        except requests.exceptions.RequestException as e:
            print(f"❌ FAILED - Network Error: {str(e)}")
            return False, None
        except Exception as e:
            print(f"❌ FAILED - Error: {str(e)}")
            return False, None

    def test_health_check(self):
        """Test API health endpoint"""
        return self.run_test(
            "API Health Check",
            "GET",
            "api/",
            200
        )

    def test_file_upload_direct(self):
        """Test file upload endpoint with direct call"""
        print(f"\n🔍 Test {self.tests_run + 1}: File Upload")
        self.tests_run += 1
        
        # Create a temporary test file
        with tempfile.NamedTemporaryFile(mode='w', suffix='.txt', delete=False) as f:
            test_content = """This is a test document for NotebookLM API testing.

It contains multiple paragraphs to test text extraction and indexing.

Key topics covered:
- API testing methodologies
- Text processing capabilities  
- Integration testing best practices

The document should be processed and made available for AI analysis."""
            f.write(test_content)
            temp_file_path = f.name

        try:
            # Test file upload using multipart/form-data
            url = f"{self.base_url}/api/sources/upload"
            print(f"   URL: POST {url}")
            
            with open(temp_file_path, 'rb') as file:
                files = {'file': ('test_document.txt', file, 'text/plain')}
                data = {'notebook_id': 'default'}
                
                # Don't use session for file upload, use direct requests
                response = requests.post(url, files=files, data=data)
                
                success = response.status_code == 200
                if success:
                    self.tests_passed += 1
                    print(f"✅ PASSED - Status: {response.status_code}")
                    
                    try:
                        json_data = response.json()
                        source_id = json_data.get('id')
                        if source_id:
                            self.test_sources.append(source_id)
                            print(f"   Source ID: {source_id}")
                        if 'title' in json_data:
                            print(f"   Title: {json_data['title']}")
                        if 'status' in json_data:
                            print(f"   Status: {json_data['status']}")
                    except:
                        print(f"   Response length: {len(response.text)} chars")
                else:
                    print(f"❌ FAILED - Expected 200, got {response.status_code}")
                    print(f"   Response: {response.text[:200]}...")
                
                return success, response
                
        except Exception as e:
            print(f"❌ FAILED - Error: {str(e)}")
            return False, None
        finally:
            # Clean up temp file
            try:
                os.unlink(temp_file_path)
            except:
                pass
        """Test file upload endpoint"""
        # Create a temporary test file
        with tempfile.NamedTemporaryFile(mode='w', suffix='.txt', delete=False) as f:
            test_content = """This is a test document for NotebookLM API testing.

It contains multiple paragraphs to test text extraction and indexing.

Key topics covered:
- API testing methodologies
- Text processing capabilities  
- Integration testing best practices

The document should be processed and made available for AI analysis."""
            f.write(test_content)
            temp_file_path = f.name

        try:
            # Test file upload using multipart/form-data
            url = f"{self.base_url}/api/sources/upload"
            
            with open(temp_file_path, 'rb') as file:
                files = {'file': ('test_document.txt', file, 'text/plain')}
                data = {'notebook_id': 'default'}
                
                # Don't use session for file upload, use direct requests
                response = requests.post(url, files=files, data=data)
                
                success = response.status_code == 200
                if success:
                    self.tests_passed += 1
                    print(f"✅ PASSED - Status: {response.status_code}")
                    
                    try:
                        json_data = response.json()
                        source_id = json_data.get('id')
                        if source_id:
                            self.test_sources.append(source_id)
                            print(f"   Source ID: {source_id}")
                        if 'title' in json_data:
                            print(f"   Title: {json_data['title']}")
                        if 'status' in json_data:
                            print(f"   Status: {json_data['status']}")
                    except:
                        print(f"   Response length: {len(response.text)} chars")
                else:
                    print(f"❌ FAILED - Expected 200, got {response.status_code}")
                    print(f"   Response: {response.text[:200]}...")
                
                return success, response
                
        except Exception as e:
            print(f"❌ FAILED - Error: {str(e)}")
            return False, None
        finally:
            # Clean up temp file
            try:
                os.unlink(temp_file_path)
            except:
                pass

    def test_url_source(self):
        """Test URL source addition"""
        url_data = {
            "title": "Test URL Source",
            "type": "url",
            "url": "https://httpbin.org/json",
            "notebook_id": "default"
        }
        
        return self.run_test(
            "Add URL Source",
            "POST",
            "api/sources/url", 
            200,
            data=url_data
        )

    def test_get_sources(self):
        """Test get sources endpoint"""
        return self.run_test(
            "Get Sources List",
            "GET",
            "api/sources?notebook_id=default",
            200
        )

    def test_ai_chat(self):
        """Test AI chat endpoint"""
        chat_data = {
            "message": "What are the key topics covered in the uploaded sources?",
            "notebook_id": "default"
        }
        
        success, response = self.run_test(
            "AI Chat Query",
            "POST",
            "api/chat",
            200,
            data=chat_data
        )
        
        if success and response:
            try:
                json_data = response.json()
                if 'response' in json_data:
                    print(f"   AI Response: {json_data['response'][:100]}...")
                if 'citations' in json_data:
                    print(f"   Citations: {len(json_data['citations'])} sources")
            except:
                pass
        
        return success, response

    def test_ai_generation(self):
        """Test AI generation endpoint for slides"""
        gen_data = {
            "output_type": "slides",
            "notebook_id": "default", 
            "title": "Test Presentation - API Testing"
        }
        
        print("   Note: AI generation may take 10-30 seconds...")
        success, response = self.run_test(
            "AI Generate Slides",
            "POST",
            "api/generate",
            200,
            data=gen_data
        )
        
        if success and response:
            try:
                json_data = response.json()
                if 'content' in json_data:
                    print(f"   Generated content: {len(json_data['content'])} chars")
                if 'slides_data' in json_data and json_data['slides_data']:
                    print(f"   Slides count: {len(json_data['slides_data'])}")
            except:
                pass
        
        return success, response

    def cleanup_test_sources(self):
        """Clean up test sources created during testing"""
        print("\n🧹 Cleaning up test sources...")
        
        for source_id in self.test_sources:
            try:
                response = self.session.delete(f"{self.base_url}/api/sources/{source_id}")
                if response.status_code in [200, 204, 404]:
                    print(f"   Deleted source: {source_id}")
                else:
                    print(f"   Failed to delete source: {source_id}")
            except Exception as e:
                print(f"   Error deleting source {source_id}: {e}")

    def run_full_test_suite(self):
        """Run all API tests in sequence"""
        print("="*60)
        print("🚀 Starting NotebookLM API Test Suite")
        print(f"   Target URL: {self.base_url}")
        print(f"   Timestamp: {datetime.now().isoformat()}")
        print("="*60)

        # Test sequence
        tests = [
            ("Health Check", self.test_health_check),
            ("File Upload", self.test_file_upload_direct),
            ("URL Source", self.test_url_source), 
            ("Get Sources", self.test_get_sources),
            ("AI Chat", self.test_ai_chat),
            ("AI Generation", self.test_ai_generation),
        ]
        
        failed_tests = []
        
        for test_name, test_func in tests:
            try:
                success, _ = test_func()
                if not success:
                    failed_tests.append(test_name)
            except Exception as e:
                print(f"❌ FAILED - {test_name}: {str(e)}")
                failed_tests.append(test_name)
                
            # Short delay between tests
            time.sleep(0.5)

        # Cleanup
        self.cleanup_test_sources()

        # Final Results
        print("\n" + "="*60)
        print("📊 TEST RESULTS SUMMARY")
        print("="*60)
        print(f"Total Tests: {self.tests_run}")
        print(f"Passed: {self.tests_passed}")
        print(f"Failed: {self.tests_run - self.tests_passed}")
        print(f"Success Rate: {(self.tests_passed/self.tests_run*100):.1f}%" if self.tests_run > 0 else "0%")
        
        if failed_tests:
            print(f"\n❌ Failed Tests: {', '.join(failed_tests)}")
        else:
            print(f"\n✅ All tests passed!")
            
        print("="*60)

        return self.tests_passed == self.tests_run

def main():
    """Main test execution"""
    print("NotebookLM API Testing Suite")
    print("-" * 30)
    
    tester = NotebookLMAPITester()
    
    try:
        success = tester.run_full_test_suite()
        return 0 if success else 1
    except KeyboardInterrupt:
        print("\n\n⚠️  Testing interrupted by user")
        return 2
    except Exception as e:
        print(f"\n\n❌ Testing failed with error: {e}")
        return 3

if __name__ == "__main__":
    exit_code = main()
    sys.exit(exit_code)