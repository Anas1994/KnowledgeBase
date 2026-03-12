"""
Test suite for infographic visual relevance feature.
Tests that visualType='none' is correctly used for descriptive content
and appropriate types (stat/process/comparison) are only used when real data exists.
"""
import pytest
import requests
import os
import json

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestSourcesAPI:
    """Test source listing API to verify data availability"""
    
    def test_get_sources_returns_200(self):
        """Verify sources endpoint returns 200"""
        response = requests.get(f"{BASE_URL}/api/sources")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        print(f"✓ GET /api/sources returned 200")
    
    def test_sources_list_not_empty(self):
        """Verify sources list contains indexed sources"""
        response = requests.get(f"{BASE_URL}/api/sources")
        assert response.status_code == 200
        sources = response.json()
        assert len(sources) > 0, "No sources found in database"
        print(f"✓ Found {len(sources)} sources")
        
        # Verify expected sources exist
        source_titles = [s['title'] for s in sources]
        expected_sources = ['SOW-H@H', 'H@H Phased Scope']
        for expected in expected_sources:
            found = any(expected in title for title in source_titles)
            print(f"  - Source '{expected}': {'Found' if found else 'NOT FOUND'}")

class TestInfographicGeneration:
    """Test infographic generation with visual relevance checks"""
    
    def test_generate_infographic_endpoint(self):
        """Test POST /api/generate with output_type='infographic'"""
        payload = {
            "output_type": "infographic",
            "notebook_id": "default",
            "title": "Visual Relevance Test Infographic"
        }
        response = requests.post(f"{BASE_URL}/api/generate", json=payload, timeout=120)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        print(f"✓ POST /api/generate returned 200")
        
        data = response.json()
        assert 'id' in data, "Response missing 'id'"
        assert 'type' in data, "Response missing 'type'"
        assert data['type'] == 'infographic', f"Expected type 'infographic', got '{data['type']}'"
        print(f"✓ Response has correct type 'infographic'")
        return data
    
    def test_infographic_has_slides_data(self):
        """Test that infographic response includes slides_data (sections)"""
        payload = {
            "output_type": "infographic",
            "notebook_id": "default",
            "title": "Test Infographic Sections"
        }
        response = requests.post(f"{BASE_URL}/api/generate", json=payload, timeout=120)
        assert response.status_code == 200
        
        data = response.json()
        assert 'slides_data' in data, "Response missing 'slides_data' field"
        sections = data['slides_data']
        assert isinstance(sections, list), f"slides_data should be a list, got {type(sections)}"
        assert len(sections) > 0, "slides_data should not be empty"
        print(f"✓ Infographic has {len(sections)} sections")
        return sections
    
    def test_visual_type_defaults_to_none_for_descriptive_content(self):
        """Test that visualType='none' is used for descriptive/qualitative content"""
        payload = {
            "output_type": "infographic",
            "notebook_id": "default",
            "title": "Visual Type Test"
        }
        response = requests.post(f"{BASE_URL}/api/generate", json=payload, timeout=120)
        assert response.status_code == 200
        
        data = response.json()
        sections = data.get('slides_data', [])
        
        visual_type_counts = {'none': 0, 'stat': 0, 'process': 0, 'comparison': 0, 'other': 0}
        sections_with_none = []
        sections_with_visuals = []
        
        for idx, section in enumerate(sections):
            vtype = section.get('visualType', 'none')
            stat = section.get('stat', '')
            title = section.get('title', f'Section {idx+1}')
            
            if vtype in visual_type_counts:
                visual_type_counts[vtype] += 1
            else:
                visual_type_counts['other'] += 1
            
            if vtype == 'none':
                sections_with_none.append((title, stat))
            else:
                sections_with_visuals.append((title, vtype, stat))
        
        print("\n=== VISUAL TYPE DISTRIBUTION ===")
        for vtype, count in visual_type_counts.items():
            print(f"  {vtype}: {count}")
        
        print(f"\n=== SECTIONS WITH visualType='none' ({len(sections_with_none)}) ===")
        for title, stat in sections_with_none:
            print(f"  - {title} (stat: '{stat or 'empty'}')")
        
        print(f"\n=== SECTIONS WITH VISUALS ({len(sections_with_visuals)}) ===")
        for title, vtype, stat in sections_with_visuals:
            print(f"  - {title} | type={vtype} | stat='{stat or 'empty'}'")
        
        # Validation: At least some sections should have 'none' type
        # (since not all content genuinely warrants visuals)
        assert visual_type_counts['none'] > 0 or len(sections) <= 2, \
            "Expected at least one section with visualType='none' for descriptive content"
        print(f"\n✓ Visual relevance validated: {visual_type_counts['none']} sections use 'none' type")
        
        # Validation: Sections with visuals should have real stats
        for title, vtype, stat in sections_with_visuals:
            if vtype == 'stat':
                # Stat type should have a stat value
                assert stat, f"Section '{title}' has visualType='stat' but no stat value"
            elif vtype == 'process':
                # Process type should have meaningful step indication
                pass  # process can work without stats (uses bullet count)
            elif vtype == 'comparison':
                # Comparison should have quantifiable data
                assert stat, f"Section '{title}' has visualType='comparison' but no stat value"
        
        print("✓ All sections with visuals have appropriate data")
        return data
    
    def test_infographic_section_structure(self):
        """Test that each section has required fields"""
        payload = {
            "output_type": "infographic",
            "notebook_id": "default",
            "title": "Section Structure Test"
        }
        response = requests.post(f"{BASE_URL}/api/generate", json=payload, timeout=120)
        assert response.status_code == 200
        
        data = response.json()
        sections = data.get('slides_data', [])
        
        required_fields = ['title', 'bullets', 'icon']
        optional_fields = ['sectionNumber', 'stat', 'statLabel', 'visualType', 'visualReason', 'color']
        
        for idx, section in enumerate(sections):
            for field in required_fields:
                assert field in section, f"Section {idx+1} missing required field '{field}'"
            
            # Validate visualType is one of allowed values
            vtype = section.get('visualType', 'none')
            allowed_types = ['none', 'stat', 'process', 'comparison']
            assert vtype in allowed_types, f"Section {idx+1} has invalid visualType: '{vtype}'"
            
            # Validate bullets is a list
            assert isinstance(section.get('bullets', []), list), f"Section {idx+1} bullets should be a list"
        
        print(f"✓ All {len(sections)} sections have valid structure")


class TestAPIHealth:
    """Test basic API health"""
    
    def test_api_root(self):
        """Test API root endpoint"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert 'message' in data
        print(f"✓ API root: {data['message']}")


class TestOutputsAPI:
    """Test outputs storage and retrieval"""
    
    def test_get_outputs(self):
        """Test GET /api/outputs"""
        response = requests.get(f"{BASE_URL}/api/outputs", params={"notebook_id": "default"})
        assert response.status_code == 200
        outputs = response.json()
        assert isinstance(outputs, list)
        print(f"✓ GET /api/outputs returned {len(outputs)} outputs")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
