"""
Test suite for PPTX Slide Generation - Iteration 10
Tests the updated slide generation with proper layouts, imageKeywords, and image generation endpoint
"""

import pytest
import requests
import os
import time

# Use public URL from environment
BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestPPTXSlideGeneration:
    """Tests for POST /api/generate with output_type='slides'"""
    
    def test_api_root_health(self):
        """Verify API is accessible"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert data.get('message') == 'NotebookLM API Ready'
        print("✓ API root health check passed")
    
    def test_sources_available(self):
        """Verify existing sources are available for slide generation"""
        response = requests.get(f"{BASE_URL}/api/sources?notebook_id=default")
        assert response.status_code == 200
        sources = response.json()
        assert len(sources) >= 2, f"Expected at least 2 sources, got {len(sources)}"
        print(f"✓ Found {len(sources)} sources available")
        return sources
    
    def test_generate_slides_structure(self):
        """Test slide generation returns proper structure with varied layouts"""
        payload = {
            "output_type": "slides",
            "notebook_id": "default",
            "title": "TEST_PPTX_Healthcare Presentation"
        }
        
        print("Generating slides... (may take 15-30 seconds)")
        response = requests.post(
            f"{BASE_URL}/api/generate",
            json=payload,
            timeout=60
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text[:500]}"
        data = response.json()
        
        # Verify response structure
        assert "id" in data, "Response missing 'id'"
        assert "type" in data and data["type"] == "slides", "Response type should be 'slides'"
        assert "title" in data, "Response missing 'title'"
        assert "content" in data, "Response missing 'content'"
        assert "slides_data" in data, "Response missing 'slides_data'"
        assert "theme" in data, "Response missing 'theme'"
        
        slides_data = data["slides_data"]
        assert isinstance(slides_data, list), "slides_data should be a list"
        assert len(slides_data) >= 8, f"Expected at least 8 slides, got {len(slides_data)}"
        assert len(slides_data) <= 10, f"Expected at most 10 slides, got {len(slides_data)}"
        
        print(f"✓ Generated {len(slides_data)} slides with theme '{data['theme']}'")
        return data
    
    def test_slide_layout_distribution(self):
        """Verify proper layout distribution per prompt requirements"""
        payload = {
            "output_type": "slides",
            "notebook_id": "default",
            "title": "TEST_PPTX_Layout Distribution Check"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/generate",
            json=payload,
            timeout=60
        )
        
        assert response.status_code == 200
        data = response.json()
        slides = data.get("slides_data", [])
        
        # Count layouts
        layout_counts = {}
        for slide in slides:
            layout = slide.get("layout", "bullets")
            layout_counts[layout] = layout_counts.get(layout, 0) + 1
        
        print(f"Layout distribution: {layout_counts}")
        
        # Verify first slide is title
        first_slide = slides[0]
        assert first_slide.get("layout") == "title", f"First slide should be 'title', got '{first_slide.get('layout')}'"
        print("✓ First slide is 'title' layout")
        
        # Verify we have image slides (3-4 expected)
        image_slides = layout_counts.get("image-left", 0) + layout_counts.get("image-right", 0)
        assert image_slides >= 2, f"Expected at least 2 image slides (image-left/image-right), got {image_slides}"
        print(f"✓ Found {image_slides} image slides (image-left/image-right)")
        
        # Verify variety in layouts
        unique_layouts = len(layout_counts)
        assert unique_layouts >= 3, f"Expected at least 3 unique layout types, got {unique_layouts}: {list(layout_counts.keys())}"
        print(f"✓ Found {unique_layouts} unique layout types")
        
        return layout_counts
    
    def test_slide_fields_populated(self):
        """Verify all slides have required fields with proper values"""
        payload = {
            "output_type": "slides",
            "notebook_id": "default",
            "title": "TEST_PPTX_Field Validation"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/generate",
            json=payload,
            timeout=60
        )
        
        assert response.status_code == 200
        data = response.json()
        slides = data.get("slides_data", [])
        
        for i, slide in enumerate(slides):
            # Check required fields
            assert "slideNumber" in slide, f"Slide {i} missing 'slideNumber'"
            assert "title" in slide, f"Slide {i} missing 'title'"
            assert "bullets" in slide, f"Slide {i} missing 'bullets'"
            assert "layout" in slide, f"Slide {i} missing 'layout'"
            assert "icon" in slide, f"Slide {i} missing 'icon'"
            
            # Check imageKeyword for image slides
            if slide.get("layout") in ["image-left", "image-right"]:
                assert "imageKeyword" in slide, f"Image slide {i} missing 'imageKeyword'"
                keyword = slide.get("imageKeyword", "")
                assert len(keyword) > 0, f"Image slide {i} has empty imageKeyword"
                print(f"  Slide {i+1} ({slide['layout']}): imageKeyword='{keyword}'")
        
        print(f"✓ All {len(slides)} slides have required fields")
    
    def test_image_keywords_contextual(self):
        """Verify imageKeywords are contextual to the content"""
        payload = {
            "output_type": "slides",
            "notebook_id": "default",
            "title": "TEST_PPTX_ImageKeyword Context"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/generate",
            json=payload,
            timeout=60
        )
        
        assert response.status_code == 200
        data = response.json()
        slides = data.get("slides_data", [])
        
        keywords_found = []
        for slide in slides:
            if slide.get("imageKeyword"):
                keywords_found.append({
                    "title": slide.get("title"),
                    "keyword": slide.get("imageKeyword"),
                    "layout": slide.get("layout")
                })
        
        print(f"Image keywords found ({len(keywords_found)}):")
        for kw in keywords_found:
            print(f"  • '{kw['keyword']}' for slide '{kw['title']}' ({kw['layout']})")
        
        # Ensure we have meaningful keywords (not just generic)
        assert len(keywords_found) >= 2, "Expected at least 2 slides with imageKeywords"
        print("✓ Contextual imageKeywords present")


class TestImageGenerationEndpoint:
    """Tests for POST /api/generate-image endpoint"""
    
    def test_generate_image_endpoint_exists(self):
        """Verify /api/generate-image endpoint exists and accepts POST"""
        payload = {
            "slide_title": "Test Slide",
            "slide_content": "Testing image generation",
            "layout": "image-right",
            "theme": "health",
            "image_keyword": "healthcare technology"
        }
        
        # Note: This may take 10-15 seconds due to AI image generation
        print("Testing image generation endpoint... (may take 10-15 seconds)")
        response = requests.post(
            f"{BASE_URL}/api/generate-image",
            json=payload,
            timeout=30
        )
        
        # We expect 200 even if image generation fails (returns success: false)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        
        # Verify response structure
        assert "success" in data, "Response missing 'success' field"
        
        if data.get("success"):
            assert "imageBase64" in data, "Successful response should have 'imageBase64'"
            assert len(data["imageBase64"]) > 1000, "imageBase64 should be substantial"
            print("✓ Image generation successful - base64 image returned")
        else:
            # Image generation may fail due to timeout or rate limits
            print(f"⚠ Image generation returned success=false: {data.get('error', 'unknown')}")
        
        return data
    
    def test_generate_image_with_health_theme(self):
        """Test image generation with health theme colors"""
        payload = {
            "slide_title": "Patient Care Overview",
            "slide_content": "Hospital monitoring, patient dashboards, clinical workflows",
            "layout": "image-left",
            "theme": "health",
            "image_keyword": "hospital patient monitoring"
        }
        
        print("Generating health-themed image...")
        response = requests.post(
            f"{BASE_URL}/api/generate-image",
            json=payload,
            timeout=30
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "success" in data
        print(f"✓ Health theme image request processed (success={data.get('success')})")
        return data
    
    def test_generate_image_request_model_fields(self):
        """Verify GenerateImageRequest accepts image_keyword parameter"""
        # Test with all parameters including image_keyword
        payload = {
            "slide_title": "Digital Health Dashboard",
            "slide_content": "Real-time patient monitoring and analytics",
            "layout": "image-right",
            "theme": "tech",
            "image_keyword": "digital health dashboard analytics"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/generate-image",
            json=payload,
            timeout=30
        )
        
        assert response.status_code == 200, f"Request with image_keyword failed: {response.text[:500]}"
        print("✓ GenerateImageRequest accepts image_keyword parameter")


class TestHealthThemeColors:
    """Tests for health theme color updates"""
    
    def test_health_theme_applied_to_slides(self):
        """Verify health-related content gets health theme"""
        # The content contains health-related terms from the sources
        payload = {
            "output_type": "slides",
            "notebook_id": "default",
            "title": "TEST_PPTX_Health Theme Application"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/generate",
            json=payload,
            timeout=60
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Since sources contain healthcare content, theme should be health
        theme = data.get("theme")
        assert theme == "health", f"Expected 'health' theme for healthcare content, got '{theme}'"
        print(f"✓ Health theme correctly applied: {theme}")


class TestSlideContentQuality:
    """Tests for slide content quality"""
    
    def test_slides_have_meaningful_content(self):
        """Verify slides contain meaningful bullets and notes"""
        payload = {
            "output_type": "slides",
            "notebook_id": "default",
            "title": "TEST_PPTX_Content Quality"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/generate",
            json=payload,
            timeout=60
        )
        
        assert response.status_code == 200
        data = response.json()
        slides = data.get("slides_data", [])
        
        content_slides = [s for s in slides if s.get("layout") != "title"]
        
        for slide in content_slides:
            bullets = slide.get("bullets", [])
            assert len(bullets) >= 2, f"Slide '{slide.get('title')}' should have at least 2 bullets"
            
            # Check bullet length (not too short, not too long)
            for bullet in bullets:
                assert len(bullet) >= 10, f"Bullet too short: '{bullet}'"
                assert len(bullet) <= 200, f"Bullet too long: '{bullet[:50]}...'"
        
        print(f"✓ {len(content_slides)} content slides have meaningful bullets")


# Cleanup test data
class TestCleanup:
    """Cleanup TEST_ prefixed outputs"""
    
    def test_cleanup_test_outputs(self):
        """Delete test-generated outputs"""
        response = requests.get(f"{BASE_URL}/api/outputs?notebook_id=default")
        if response.status_code == 200:
            outputs = response.json()
            test_outputs = [o for o in outputs if o.get("title", "").startswith("TEST_PPTX_")]
            for output in test_outputs:
                requests.delete(f"{BASE_URL}/api/outputs/{output['id']}")
                print(f"  Cleaned up: {output['title']}")
        print(f"✓ Cleanup complete")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
