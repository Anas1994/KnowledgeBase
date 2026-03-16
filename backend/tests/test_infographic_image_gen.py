"""
Test suite for Infographic Image Generation feature
Tests the imageKeyword field in infographic sections and image generation endpoint
"""
import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestInfographicImageGeneration:
    """Tests for infographic generation with imageKeyword field"""
    
    def test_api_health(self):
        """Test API is accessible"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert data.get("message") == "NotebookLM API Ready"
        print("✓ API health check passed")
    
    def test_sources_available(self):
        """Verify indexed sources exist for testing"""
        response = requests.get(f"{BASE_URL}/api/sources?notebook_id=default")
        assert response.status_code == 200
        sources = response.json()
        assert len(sources) >= 1, "Need at least 1 indexed source for testing"
        print(f"✓ Found {len(sources)} indexed sources")
        return sources
    
    def test_infographic_generation_returns_image_keyword(self):
        """Test POST /api/generate with output_type='infographic' returns sections with imageKeyword"""
        response = requests.post(
            f"{BASE_URL}/api/generate",
            json={
                "output_type": "infographic",
                "notebook_id": "default",
                "title": "Test Infographic"
            },
            timeout=120  # AI generation can take time
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        
        # Verify response structure
        assert "id" in data
        assert data.get("type") == "infographic"
        assert "slides_data" in data
        assert "theme" in data
        
        sections = data.get("slides_data", [])
        assert len(sections) >= 4, f"Expected at least 4 sections, got {len(sections)}"
        
        # Check each section has imageKeyword field
        for i, section in enumerate(sections):
            assert "imageKeyword" in section, f"Section {i+1} missing imageKeyword field"
            assert len(section["imageKeyword"]) > 0, f"Section {i+1} has empty imageKeyword"
            print(f"  Section {i+1}: {section.get('title', 'Untitled')} | imageKeyword: {section['imageKeyword']}")
        
        print(f"✓ Infographic generated with {len(sections)} sections, all with imageKeyword")
        return data
    
    def test_image_generation_endpoint_infographic_layout(self):
        """Test POST /api/generate-image with layout='infographic' returns compressed JPEG"""
        response = requests.post(
            f"{BASE_URL}/api/generate-image",
            json={
                "slide_title": "Hospital Patient Monitoring",
                "slide_content": "Remote patient monitoring, vital signs tracking, telehealth integration",
                "layout": "infographic",
                "theme": "health",
                "image_keyword": "hospital patient monitoring"
            },
            timeout=120  # Image generation takes 10-15 seconds
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert data.get("success") == True, f"Image generation failed: {data.get('error')}"
        
        image_base64 = data.get("imageBase64", "")
        assert len(image_base64) > 0, "imageBase64 is empty"
        
        # Calculate approximate size (base64 is ~4/3 of original size)
        approx_size_kb = len(image_base64) * 3 / 4 / 1024
        print(f"  Generated image size: ~{approx_size_kb:.1f} KB")
        
        # Should be compressed JPEG around 40-60KB
        assert approx_size_kb < 100, f"Image too large: {approx_size_kb:.1f} KB (expected < 100KB)"
        
        print(f"✓ Image generation returned {len(image_base64)} chars (~{approx_size_kb:.1f} KB)")
        return data
    
    def test_image_generation_with_image_keyword_parameter(self):
        """Test that image_keyword parameter is accepted and used"""
        response = requests.post(
            f"{BASE_URL}/api/generate-image",
            json={
                "slide_title": "Clinical Workflow",
                "slide_content": "Workflow automation, clinical decision support",
                "layout": "infographic",
                "theme": "health",
                "image_keyword": "clinical workflow automation"  # Specific keyword
            },
            timeout=120
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data.get("success") == True
        print("✓ Image generation with custom image_keyword succeeded")


class TestInfographicDataStructure:
    """Tests for infographic data structure validation"""
    
    def test_infographic_section_fields(self):
        """Verify infographic sections have all required fields"""
        response = requests.post(
            f"{BASE_URL}/api/generate",
            json={
                "output_type": "infographic",
                "notebook_id": "default",
                "title": "Data Structure Test"
            },
            timeout=120
        )
        
        assert response.status_code == 200
        data = response.json()
        sections = data.get("slides_data", [])
        
        required_fields = ["title", "bullets", "icon", "visualType", "imageKeyword"]
        
        for i, section in enumerate(sections[:3]):  # Check first 3 sections
            for field in required_fields:
                assert field in section, f"Section {i+1} missing required field: {field}"
            
            # Validate field types
            assert isinstance(section.get("title"), str)
            assert isinstance(section.get("bullets"), list)
            assert isinstance(section.get("icon"), str)
            assert isinstance(section.get("visualType"), str)
            assert isinstance(section.get("imageKeyword"), str)
        
        print(f"✓ All required fields present in infographic sections")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
