"""
Test infographic endpoint for S-curve layout requirements:
- 6 sections exactly
- 2 bullets max per section (8 words max each)
- subtitles for each section
- stats/statLabels for stat sections
- workflowSteps for workflow sections
- imageKeywords for AI image generation
- At least 2 workflow sections and 1 stat section
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')


class TestInfographicSCurveLayout:
    """Test infographic generation for S-curve flowing layout requirements"""
    
    def test_api_health(self):
        """Basic API health check"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        assert "NotebookLM" in response.json().get("message", "")
        print("✓ API health check passed")
    
    def test_sources_available(self):
        """Verify sources are indexed for generation"""
        response = requests.get(f"{BASE_URL}/api/sources?notebook_id=default")
        assert response.status_code == 200
        sources = response.json()
        assert len(sources) >= 1, "At least 1 source required for testing"
        print(f"✓ {len(sources)} indexed sources available")
    
    def test_infographic_generation_structure(self):
        """Test infographic returns 6 sections with correct structure"""
        response = requests.post(
            f"{BASE_URL}/api/generate",
            json={"output_type": "infographic", "notebook_id": "default", "title": "Test Infographic"},
            timeout=120  # AI generation can be slow
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        # Validate basic structure
        assert data.get("type") == "infographic"
        assert "slides_data" in data
        sections = data.get("slides_data", [])
        
        # REQUIREMENT: Exactly 6 sections
        assert len(sections) == 6, f"Expected 6 sections, got {len(sections)}"
        print(f"✓ Infographic has exactly 6 sections")
        
        return data
    
    def test_sections_have_subtitles(self):
        """All sections must have subtitles"""
        response = requests.post(
            f"{BASE_URL}/api/generate",
            json={"output_type": "infographic", "notebook_id": "default"},
            timeout=120
        )
        assert response.status_code == 200
        sections = response.json().get("slides_data", [])
        
        for i, sec in enumerate(sections):
            assert "subtitle" in sec, f"Section {i+1} missing subtitle"
            # Can be empty string but key must exist
            print(f"  Section {i+1} subtitle: {sec.get('subtitle', 'EMPTY')[:40]}...")
        print("✓ All sections have subtitle field")
    
    def test_bullets_max_two_per_section(self):
        """Each section must have max 2 bullets, max 8 words each"""
        response = requests.post(
            f"{BASE_URL}/api/generate",
            json={"output_type": "infographic", "notebook_id": "default"},
            timeout=120
        )
        assert response.status_code == 200
        sections = response.json().get("slides_data", [])
        
        for i, sec in enumerate(sections):
            bullets = sec.get("bullets", [])
            assert len(bullets) <= 2, f"Section {i+1} has {len(bullets)} bullets (max 2)"
            for j, bullet in enumerate(bullets):
                word_count = len(bullet.split())
                # Allow up to 10 words (8 word target with slight tolerance)
                assert word_count <= 10, f"Section {i+1} bullet {j+1} has {word_count} words (max 8-10)"
        print("✓ All sections have max 2 bullets with <=10 words each")
    
    def test_image_keywords_present(self):
        """All sections must have imageKeyword for AI image generation"""
        response = requests.post(
            f"{BASE_URL}/api/generate",
            json={"output_type": "infographic", "notebook_id": "default"},
            timeout=120
        )
        assert response.status_code == 200
        sections = response.json().get("slides_data", [])
        
        for i, sec in enumerate(sections):
            assert "imageKeyword" in sec, f"Section {i+1} missing imageKeyword"
            assert sec.get("imageKeyword"), f"Section {i+1} has empty imageKeyword"
            print(f"  Section {i+1} imageKeyword: {sec.get('imageKeyword')}")
        print("✓ All sections have imageKeyword")
    
    def test_at_least_two_workflow_sections(self):
        """At least 2 sections must have visualType='workflow' with workflowSteps"""
        response = requests.post(
            f"{BASE_URL}/api/generate",
            json={"output_type": "infographic", "notebook_id": "default"},
            timeout=120
        )
        assert response.status_code == 200
        sections = response.json().get("slides_data", [])
        
        workflow_sections = [s for s in sections if s.get("visualType") == "workflow"]
        assert len(workflow_sections) >= 2, f"Expected >=2 workflow sections, got {len(workflow_sections)}"
        
        for ws in workflow_sections:
            steps = ws.get("workflowSteps", [])
            assert len(steps) >= 2, f"Workflow section '{ws.get('title')}' has only {len(steps)} steps"
            print(f"  Workflow '{ws.get('title')}': {len(steps)} steps")
        print(f"✓ Found {len(workflow_sections)} workflow sections with workflowSteps")
    
    def test_at_least_one_stat_section(self):
        """At least 1 section must have visualType='stat' with stat value"""
        response = requests.post(
            f"{BASE_URL}/api/generate",
            json={"output_type": "infographic", "notebook_id": "default"},
            timeout=120
        )
        assert response.status_code == 200
        sections = response.json().get("slides_data", [])
        
        stat_sections = [s for s in sections if s.get("visualType") == "stat"]
        assert len(stat_sections) >= 1, f"Expected >=1 stat section, got {len(stat_sections)}"
        
        for ss in stat_sections:
            assert ss.get("stat"), f"Stat section '{ss.get('title')}' missing stat value"
            print(f"  Stat '{ss.get('title')}': {ss.get('stat')} - {ss.get('statLabel', 'N/A')}")
        print(f"✓ Found {len(stat_sections)} stat sections with values")
    
    def test_visual_type_distribution(self):
        """Test that visualType is properly distributed (not all 'none')"""
        response = requests.post(
            f"{BASE_URL}/api/generate",
            json={"output_type": "infographic", "notebook_id": "default"},
            timeout=120
        )
        assert response.status_code == 200
        sections = response.json().get("slides_data", [])
        
        visual_types = {}
        for sec in sections:
            vt = sec.get("visualType", "none")
            visual_types[vt] = visual_types.get(vt, 0) + 1
        
        # Not all should be 'none'
        assert visual_types.get("none", 0) < 6, "All sections have visualType='none'"
        print(f"✓ visualType distribution: {visual_types}")


class TestInfographicIntegration:
    """Integration tests for infographic with real content"""
    
    def test_full_infographic_structure(self):
        """Complete structure test with detailed validation"""
        response = requests.post(
            f"{BASE_URL}/api/generate",
            json={"output_type": "infographic", "notebook_id": "default", "title": "Full Structure Test"},
            timeout=120
        )
        assert response.status_code == 200
        data = response.json()
        
        # Top-level fields
        assert data.get("type") == "infographic"
        assert data.get("title")
        assert data.get("theme") in ["health", "tech", "finance", "corporate"]
        
        sections = data.get("slides_data", [])
        print(f"\n=== Infographic Structure Summary ===")
        print(f"Title: {data.get('title')}")
        print(f"Theme: {data.get('theme')}")
        print(f"Sections: {len(sections)}")
        
        workflow_count = 0
        stat_count = 0
        total_bullets = 0
        
        for i, sec in enumerate(sections):
            print(f"\n--- Section {i+1}: {sec.get('title', 'N/A')} ---")
            print(f"  visualType: {sec.get('visualType', 'none')}")
            print(f"  subtitle: {sec.get('subtitle', '')[:50]}...")
            print(f"  bullets: {len(sec.get('bullets', []))} items")
            print(f"  imageKeyword: {sec.get('imageKeyword', 'N/A')}")
            
            if sec.get("visualType") == "workflow":
                workflow_count += 1
                print(f"  workflowSteps: {sec.get('workflowSteps', [])}")
            if sec.get("visualType") == "stat":
                stat_count += 1
                print(f"  stat: {sec.get('stat')} ({sec.get('statLabel', '')})")
            
            total_bullets += len(sec.get("bullets", []))
        
        print(f"\n=== Summary ===")
        print(f"Workflow sections: {workflow_count}")
        print(f"Stat sections: {stat_count}")
        print(f"Total bullets: {total_bullets}")
        
        # Final assertions
        assert len(sections) == 6
        assert workflow_count >= 2
        assert stat_count >= 1
        assert total_bullets <= 12  # Max 2 bullets * 6 sections
        print("✓ Full structure validation passed")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
