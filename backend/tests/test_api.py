"""
Backend API Tests for Saudi Healthcare Command Theme UI App
Tests core API endpoints: sources, outputs, chat, generate
"""

import pytest
import requests
import os
from datetime import datetime

# Get BASE_URL from environment - use public URL for testing
BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://localized-theme-lab.preview.emergentagent.com').rstrip('/')

class TestAPIHealth:
    """Test API health and basic connectivity"""
    
    def test_api_root(self):
        """Test API root endpoint returns success"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        print(f"SUCCESS: API root returned: {data}")


class TestSourcesEndpoints:
    """Test source management endpoints"""
    
    def test_get_sources(self):
        """Test GET /api/sources returns sources list"""
        response = requests.get(f"{BASE_URL}/api/sources?notebook_id=default")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"SUCCESS: GET /api/sources returned {len(data)} sources")
        
        # Check source structure if sources exist
        if len(data) > 0:
            source = data[0]
            assert "id" in source
            assert "title" in source
            assert "type" in source
            assert "status" in source
            print(f"SUCCESS: Source structure valid - sample: {source.get('title', 'Unknown')}")


class TestOutputsEndpoints:
    """Test output management endpoints"""
    
    def test_get_outputs(self):
        """Test GET /api/outputs returns outputs list"""
        response = requests.get(f"{BASE_URL}/api/outputs?notebook_id=default")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"SUCCESS: GET /api/outputs returned {len(data)} outputs")
        
        # Check output structure if outputs exist
        if len(data) > 0:
            output = data[0]
            assert "id" in output
            assert "type" in output
            assert "title" in output
            print(f"SUCCESS: Output structure valid - sample: {output.get('title', 'Unknown')}")


class TestChatEndpoint:
    """Test AI chat endpoint"""
    
    def test_chat_with_sources(self):
        """Test POST /api/chat returns AI response"""
        response = requests.post(
            f"{BASE_URL}/api/chat",
            json={
                "message": "Summarize the key points from my sources",
                "notebook_id": "default"
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert "response" in data
        print(f"SUCCESS: Chat endpoint returned response with {len(data.get('response', ''))} chars")
        
        # Check for citations
        if "citations" in data:
            print(f"SUCCESS: Chat response includes {len(data['citations'])} citations")


class TestStatusEndpoint:
    """Test status check endpoint"""
    
    def test_create_status_check(self):
        """Test POST /api/status creates status check"""
        response = requests.post(
            f"{BASE_URL}/api/status",
            json={"client_name": "T1_Test_Agent"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "id" in data
        assert data["client_name"] == "T1_Test_Agent"
        print(f"SUCCESS: Status check created with id: {data['id']}")
    
    def test_get_status_checks(self):
        """Test GET /api/status returns status checks"""
        response = requests.get(f"{BASE_URL}/api/status")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"SUCCESS: GET /api/status returned {len(data)} status checks")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
