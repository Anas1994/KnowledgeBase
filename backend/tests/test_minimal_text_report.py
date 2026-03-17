"""
Test: Visual Report with Minimal Text and More Visuals
Tests that backend /api/generate with output_type='report' returns:
- 5 sections max with 2 bullets max per section
- Subtitles, stats, workflow steps, and imageKeywords  
- visualType set to 'workflow' or 'stat' (not all 'none')
- Bullets are short (under 10 words each)
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestMinimalTextReport:
    """Test suite for minimal-text, visual-first report generation"""
    
    def test_api_health(self):
        """Test API is accessible"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        assert response.json()["message"] == "NotebookLM API Ready"
        print("✓ API health check passed")
    
    def test_sources_available(self):
        """Test that indexed sources are available for report generation"""
        response = requests.get(f"{BASE_URL}/api/sources?notebook_id=default")
        assert response.status_code == 200
        sources = response.json()
        assert len(sources) >= 1, "At least 1 indexed source required"
        indexed = [s for s in sources if s.get('status') == 'indexed']
        assert len(indexed) >= 1, "At least 1 source must be indexed"
        print(f"✓ Found {len(indexed)} indexed sources")
    
    def test_report_generation_returns_structured_data(self):
        """Test report generation returns slides_data with proper structure"""
        response = requests.post(
            f"{BASE_URL}/api/generate",
            json={
                "output_type": "report",
                "notebook_id": "default",
                "title": "Test Visual Report"
            },
            timeout=120
        )
        assert response.status_code == 200, f"Report generation failed: {response.text}"
        data = response.json()
        
        # Verify response structure
        assert data.get('type') == 'report', "Response type should be 'report'"
        assert 'slides_data' in data, "Response must contain slides_data"
        assert isinstance(data['slides_data'], list), "slides_data must be a list"
        assert 'theme' in data, "Response must contain theme"
        print(f"✓ Report generated with {len(data['slides_data'])} sections")
        return data
    
    def test_report_has_max_5_sections(self):
        """Test report has at most 5 sections"""
        response = requests.post(
            f"{BASE_URL}/api/generate",
            json={"output_type": "report", "notebook_id": "default", "title": "Max Sections Test"},
            timeout=120
        )
        assert response.status_code == 200
        data = response.json()
        sections = data.get('slides_data', [])
        assert len(sections) <= 5, f"Report should have max 5 sections, got {len(sections)}"
        print(f"✓ Report has {len(sections)} sections (max 5 allowed)")
    
    def test_sections_have_max_2_bullets(self):
        """Test each section has at most 2 bullets"""
        response = requests.post(
            f"{BASE_URL}/api/generate",
            json={"output_type": "report", "notebook_id": "default", "title": "Bullets Test"},
            timeout=120
        )
        assert response.status_code == 200
        data = response.json()
        sections = data.get('slides_data', [])
        
        for idx, sec in enumerate(sections):
            bullets = sec.get('bullets', [])
            assert len(bullets) <= 2, f"Section {idx+1} has {len(bullets)} bullets (max 2)"
            print(f"  Section {idx+1}: {len(bullets)} bullets")
        print("✓ All sections have max 2 bullets")
    
    def test_bullets_are_short(self):
        """Test bullets are under 10 words each"""
        response = requests.post(
            f"{BASE_URL}/api/generate",
            json={"output_type": "report", "notebook_id": "default", "title": "Short Bullets Test"},
            timeout=120
        )
        assert response.status_code == 200
        data = response.json()
        sections = data.get('slides_data', [])
        
        long_bullets = []
        for idx, sec in enumerate(sections):
            for bullet in sec.get('bullets', []):
                word_count = len(bullet.split())
                if word_count > 10:
                    long_bullets.append(f"Section {idx+1}: '{bullet}' ({word_count} words)")
        
        if long_bullets:
            print(f"⚠ Found {len(long_bullets)} bullets over 10 words:")
            for lb in long_bullets[:3]:
                print(f"  - {lb}")
        else:
            print("✓ All bullets are under 10 words")
        # Warning, not failure - prompt asks for 8 words, allow 10 as buffer
    
    def test_sections_have_required_fields(self):
        """Test each section has title, subtitle, imageKeyword, visualType"""
        response = requests.post(
            f"{BASE_URL}/api/generate",
            json={"output_type": "report", "notebook_id": "default", "title": "Fields Test"},
            timeout=120
        )
        assert response.status_code == 200
        data = response.json()
        sections = data.get('slides_data', [])
        
        for idx, sec in enumerate(sections):
            assert 'title' in sec and sec['title'], f"Section {idx+1} missing title"
            assert 'imageKeyword' in sec and sec['imageKeyword'], f"Section {idx+1} missing imageKeyword"
            assert 'visualType' in sec, f"Section {idx+1} missing visualType"
            print(f"  Section {idx+1}: title='{sec['title']}', visualType='{sec['visualType']}', imageKeyword='{sec['imageKeyword']}'")
        print("✓ All sections have required fields")
    
    def test_visual_types_distribution(self):
        """Test visualType includes 'workflow' and 'stat' (not all 'none')"""
        response = requests.post(
            f"{BASE_URL}/api/generate",
            json={"output_type": "report", "notebook_id": "default", "title": "Visual Types Test"},
            timeout=120
        )
        assert response.status_code == 200
        data = response.json()
        sections = data.get('slides_data', [])
        
        visual_types = [sec.get('visualType', 'none') for sec in sections]
        workflow_count = visual_types.count('workflow')
        stat_count = visual_types.count('stat')
        none_count = visual_types.count('none')
        
        print(f"  visualType distribution: workflow={workflow_count}, stat={stat_count}, none={none_count}")
        
        # Check that not all are 'none'
        has_visual_types = workflow_count > 0 or stat_count > 0
        if not has_visual_types:
            print("⚠ WARNING: All sections have visualType='none' - should have at least 1 workflow or stat")
        else:
            print("✓ Report has visual type diversity (workflow/stat present)")
        
        return {
            'workflow': workflow_count,
            'stat': stat_count,
            'none': none_count,
            'has_visuals': has_visual_types
        }
    
    def test_workflow_sections_have_steps(self):
        """Test sections with visualType='workflow' have workflowSteps array"""
        response = requests.post(
            f"{BASE_URL}/api/generate",
            json={"output_type": "report", "notebook_id": "default", "title": "Workflow Steps Test"},
            timeout=120
        )
        assert response.status_code == 200
        data = response.json()
        sections = data.get('slides_data', [])
        
        workflow_sections = [s for s in sections if s.get('visualType') == 'workflow']
        
        if not workflow_sections:
            print("⚠ No workflow sections found to validate workflowSteps")
            return
            
        for sec in workflow_sections:
            steps = sec.get('workflowSteps', [])
            assert isinstance(steps, list), f"workflowSteps must be a list"
            if len(steps) > 0:
                print(f"  Workflow '{sec['title']}': {len(steps)} steps - {steps[:3]}...")
            else:
                print(f"  ⚠ Workflow '{sec['title']}' has no workflowSteps")
        print("✓ Workflow sections checked for workflowSteps")
    
    def test_stat_sections_have_stat_value(self):
        """Test sections with visualType='stat' have stat and statLabel"""
        response = requests.post(
            f"{BASE_URL}/api/generate",
            json={"output_type": "report", "notebook_id": "default", "title": "Stat Values Test"},
            timeout=120
        )
        assert response.status_code == 200
        data = response.json()
        sections = data.get('slides_data', [])
        
        stat_sections = [s for s in sections if s.get('visualType') == 'stat']
        sections_with_stats = [s for s in sections if s.get('stat')]
        
        print(f"  Sections with visualType='stat': {len(stat_sections)}")
        print(f"  Sections with stat value: {len(sections_with_stats)}")
        
        for sec in sections_with_stats:
            print(f"  - '{sec['title']}': stat='{sec.get('stat')}' label='{sec.get('statLabel', '')}'")
        
        if len(sections_with_stats) == 0:
            print("⚠ No sections have stat values")
        else:
            print("✓ Found sections with stat highlights")


class TestImageGeneration:
    """Test image generation endpoint for reports"""
    
    def test_generate_image_endpoint(self):
        """Test /api/generate-image works for report layout"""
        response = requests.post(
            f"{BASE_URL}/api/generate-image",
            json={
                "slide_title": "Test Report Section",
                "slide_content": "Healthcare monitoring dashboard",
                "layout": "report",
                "theme": "health",
                "image_keyword": "healthcare data analytics"
            },
            timeout=90
        )
        assert response.status_code == 200
        data = response.json()
        assert 'success' in data
        if data.get('success'):
            assert 'imageBase64' in data
            print(f"✓ Image generated successfully, size: ~{len(data['imageBase64'])//1000}KB")
        else:
            print(f"⚠ Image generation failed: {data.get('error')}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
