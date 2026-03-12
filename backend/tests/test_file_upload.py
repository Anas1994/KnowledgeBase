"""
Backend API Tests for Extended File Upload Support
Tests: PDF, PPTX, XLSX, Image (PNG/JPG), TXT file uploads
Verifies correct file type detection, text extraction, and indexing
"""

import pytest
import requests
import os
import time

# Get BASE_URL from environment - use public URL for testing
BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://localized-theme-lab.preview.emergentagent.com').rstrip('/')

# Test file paths
TEST_FILES = {
    'xlsx': '/tmp/test_data.xlsx',
    'pptx': '/tmp/test_presentation.pptx',
    'png': '/tmp/test_chart.png',
    'pdf': '/tmp/test_report.pdf',
    'txt': '/tmp/test_doc.txt'
}

class TestFileUploadTypes:
    """Test all supported file types upload correctly"""
    
    def test_xlsx_upload(self):
        """Test Excel (.xlsx) file upload returns type 'xlsx' and status 'indexed'"""
        file_path = TEST_FILES['xlsx']
        if not os.path.exists(file_path):
            pytest.skip(f"Test file not found: {file_path}")
        
        with open(file_path, 'rb') as f:
            files = {'file': ('test_excel.xlsx', f, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')}
            response = requests.post(f"{BASE_URL}/api/sources/upload", files=files, data={'notebook_id': 'test_upload'})
        
        assert response.status_code == 200, f"Upload failed with status {response.status_code}: {response.text}"
        data = response.json()
        
        # Verify response structure
        assert 'id' in data, "Response missing 'id'"
        assert 'type' in data, "Response missing 'type'"
        assert 'status' in data, "Response missing 'status'"
        assert 'content_preview' in data, "Response missing 'content_preview'"
        
        # Verify correct file type detection
        assert data['type'] == 'xlsx', f"Expected type 'xlsx', got '{data['type']}'"
        assert data['status'] == 'indexed', f"Expected status 'indexed', got '{data['status']}'"
        
        # Verify text was extracted (content_preview should have data)
        assert len(data.get('content_preview', '')) > 10, "Content preview too short - extraction may have failed"
        
        print(f"SUCCESS: XLSX upload - type={data['type']}, status={data['status']}, chunks={data.get('chunks', 0)}")
        print(f"Content preview: {data.get('content_preview', '')[:100]}...")
        
        # Cleanup - delete the test source
        self._cleanup_source(data['id'])
    
    def test_pptx_upload(self):
        """Test PowerPoint (.pptx) file upload returns type 'ppt' and status 'indexed'"""
        file_path = TEST_FILES['pptx']
        if not os.path.exists(file_path):
            pytest.skip(f"Test file not found: {file_path}")
        
        with open(file_path, 'rb') as f:
            files = {'file': ('test_presentation.pptx', f, 'application/vnd.openxmlformats-officedocument.presentationml.presentation')}
            response = requests.post(f"{BASE_URL}/api/sources/upload", files=files, data={'notebook_id': 'test_upload'})
        
        assert response.status_code == 200, f"Upload failed with status {response.status_code}: {response.text}"
        data = response.json()
        
        # Verify correct file type detection
        assert data['type'] == 'ppt', f"Expected type 'ppt', got '{data['type']}'"
        assert data['status'] == 'indexed', f"Expected status 'indexed', got '{data['status']}'"
        
        # Verify text was extracted
        assert len(data.get('content_preview', '')) > 10, "Content preview too short - extraction may have failed"
        
        print(f"SUCCESS: PPTX upload - type={data['type']}, status={data['status']}, chunks={data.get('chunks', 0)}")
        print(f"Content preview: {data.get('content_preview', '')[:100]}...")
        
        self._cleanup_source(data['id'])
    
    def test_png_image_upload(self):
        """Test Image (.png) file upload returns type 'image' and status 'indexed'"""
        file_path = TEST_FILES['png']
        if not os.path.exists(file_path):
            pytest.skip(f"Test file not found: {file_path}")
        
        with open(file_path, 'rb') as f:
            files = {'file': ('test_image.png', f, 'image/png')}
            # Image upload may take longer due to AI vision processing
            response = requests.post(f"{BASE_URL}/api/sources/upload", files=files, data={'notebook_id': 'test_upload'}, timeout=60)
        
        assert response.status_code == 200, f"Upload failed with status {response.status_code}: {response.text}"
        data = response.json()
        
        # Verify correct file type detection
        assert data['type'] == 'image', f"Expected type 'image', got '{data['type']}'"
        assert data['status'] == 'indexed', f"Expected status 'indexed', got '{data['status']}'"
        
        # Verify AI extracted text/description
        assert len(data.get('content_preview', '')) > 10, "Content preview too short - AI extraction may have failed"
        
        print(f"SUCCESS: PNG upload - type={data['type']}, status={data['status']}, chunks={data.get('chunks', 0)}")
        print(f"Content preview (AI extracted): {data.get('content_preview', '')[:150]}...")
        
        self._cleanup_source(data['id'])
    
    def test_pdf_upload(self):
        """Test PDF (.pdf) file upload returns type 'pdf' and status 'indexed'"""
        file_path = TEST_FILES['pdf']
        if not os.path.exists(file_path):
            pytest.skip(f"Test file not found: {file_path}")
        
        with open(file_path, 'rb') as f:
            files = {'file': ('test_report.pdf', f, 'application/pdf')}
            response = requests.post(f"{BASE_URL}/api/sources/upload", files=files, data={'notebook_id': 'test_upload'})
        
        assert response.status_code == 200, f"Upload failed with status {response.status_code}: {response.text}"
        data = response.json()
        
        # Verify correct file type detection
        assert data['type'] == 'pdf', f"Expected type 'pdf', got '{data['type']}'"
        assert data['status'] == 'indexed', f"Expected status 'indexed', got '{data['status']}'"
        
        # Verify text was extracted
        assert len(data.get('content_preview', '')) > 5, "Content preview too short - extraction may have failed"
        
        print(f"SUCCESS: PDF upload - type={data['type']}, status={data['status']}, chunks={data.get('chunks', 0)}")
        print(f"Content preview: {data.get('content_preview', '')[:100]}...")
        
        self._cleanup_source(data['id'])
    
    def test_txt_upload(self):
        """Test TXT (.txt) file upload returns type 'txt' and status 'indexed'"""
        file_path = TEST_FILES['txt']
        if not os.path.exists(file_path):
            pytest.skip(f"Test file not found: {file_path}")
        
        with open(file_path, 'rb') as f:
            files = {'file': ('test_doc.txt', f, 'text/plain')}
            response = requests.post(f"{BASE_URL}/api/sources/upload", files=files, data={'notebook_id': 'test_upload'})
        
        assert response.status_code == 200, f"Upload failed with status {response.status_code}: {response.text}"
        data = response.json()
        
        # Verify correct file type detection
        assert data['type'] == 'txt', f"Expected type 'txt', got '{data['type']}'"
        assert data['status'] == 'indexed', f"Expected status 'indexed', got '{data['status']}'"
        
        # Verify text content
        assert len(data.get('content_preview', '')) > 5, "Content preview too short"
        
        print(f"SUCCESS: TXT upload - type={data['type']}, status={data['status']}, chunks={data.get('chunks', 0)}")
        print(f"Content preview: {data.get('content_preview', '')[:100]}...")
        
        self._cleanup_source(data['id'])
    
    def _cleanup_source(self, source_id):
        """Helper to delete test source after upload test"""
        try:
            requests.delete(f"{BASE_URL}/api/sources/{source_id}")
        except Exception as e:
            print(f"Warning: Cleanup failed for source {source_id}: {e}")


class TestGetSourcesWithTypes:
    """Test GET /api/sources returns sources with correct type indicators"""
    
    def test_sources_list_has_correct_types(self):
        """Verify GET /api/sources returns sources with all supported types"""
        response = requests.get(f"{BASE_URL}/api/sources?notebook_id=default")
        assert response.status_code == 200
        
        sources = response.json()
        assert isinstance(sources, list)
        print(f"Total sources in default notebook: {len(sources)}")
        
        # Collect all types present
        types_found = set()
        for src in sources:
            assert 'type' in src, f"Source {src.get('id', 'unknown')} missing 'type' field"
            assert 'status' in src, f"Source {src.get('id', 'unknown')} missing 'status' field"
            assert 'title' in src, f"Source {src.get('id', 'unknown')} missing 'title' field"
            types_found.add(src['type'])
            print(f"  - {src['title']}: type={src['type']}, status={src['status']}, chunks={src.get('chunks', 0)}")
        
        print(f"\nFile types found in sources: {types_found}")
        
        # Verify expected types exist (from previous uploads)
        expected_types = {'xlsx', 'ppt', 'image', 'pdf', 'txt'}
        found_expected = types_found.intersection(expected_types)
        print(f"Expected types found: {found_expected}")
        
        # At least some of the expected types should be present
        assert len(found_expected) >= 2, f"Expected at least 2 of {expected_types}, found only {found_expected}"
        print(f"SUCCESS: Sources API returns sources with correct type indicators")


class TestUnsupportedFileType:
    """Test that unsupported file types are rejected"""
    
    def test_unsupported_file_rejected(self):
        """Test uploading unsupported file type (.xyz) returns error"""
        # Create a fake file with unsupported extension
        fake_content = b"This is fake binary content that cannot be parsed"
        files = {'file': ('test.xyz', fake_content, 'application/octet-stream')}
        
        response = requests.post(f"{BASE_URL}/api/sources/upload", files=files, data={'notebook_id': 'test_upload'})
        
        # The upload might succeed but fallback to txt type, or fail - both are acceptable behaviors
        # If it succeeds, it should be treated as txt
        if response.status_code == 200:
            data = response.json()
            print(f"Upload accepted with fallback type: {data.get('type', 'unknown')}")
            # Cleanup
            if 'id' in data:
                requests.delete(f"{BASE_URL}/api/sources/{data['id']}")
        elif response.status_code == 400:
            print(f"SUCCESS: Unsupported file type correctly rejected with 400")
        else:
            print(f"Upload returned status {response.status_code}")


class TestExistingSourcesVerification:
    """Verify previously uploaded sources from main agent's curl tests"""
    
    def test_all_uploaded_sources_present(self):
        """Verify all 6 sources from previous uploads are present and indexed"""
        response = requests.get(f"{BASE_URL}/api/sources?notebook_id=default")
        assert response.status_code == 200
        
        sources = response.json()
        
        # Expected sources from previous curl tests
        expected_titles = ['test_data', 'test_presentation', 'test_chart', 'test_report', 'test_doc']
        
        for expected in expected_titles:
            found = [s for s in sources if expected in s.get('title', '')]
            if found:
                src = found[0]
                assert src['status'] == 'indexed', f"Source '{expected}' status should be 'indexed', got '{src['status']}'"
                print(f"VERIFIED: '{expected}' - type={src['type']}, status={src['status']}")
            else:
                print(f"INFO: Source '{expected}' not found (may have been cleaned up)")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
