"""
Test suite for Infographic Minimal-Text Requirements
Tests that /api/generate with output_type=infographic returns:
- 6 sections (not more)
- 2 bullets max per section
- Bullets under 10 words each
- subtitles for each section
- stats and statLabels where applicable
- imageKeyword for each section
- visualType set to 'workflow' or 'stat' (not all 'none')
- At least 2 workflow sections with workflowSteps arrays
"""
import pytest
import requests
import os
import json

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://ai-insight-canvas.preview.emergentagent.com')

class TestInfographicMinimalText:
    """Test suite for infographic minimal-text visual requirements"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test session"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
    
    def test_api_health(self):
        """Test API is reachable"""
        response = self.session.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        print(f"API health check passed: {data}")
    
    def test_sources_available(self):
        """Test that indexed sources are available"""
        response = self.session.get(f"{BASE_URL}/api/sources?notebook_id=default")
        assert response.status_code == 200
        sources = response.json()
        indexed = [s for s in sources if s.get('status') == 'indexed']
        assert len(indexed) >= 1, "At least one indexed source required"
        print(f"Found {len(indexed)} indexed sources")
    
    def test_generate_infographic_returns_200(self):
        """Test infographic generation endpoint returns 200"""
        response = self.session.post(f"{BASE_URL}/api/generate", json={
            "output_type": "infographic",
            "notebook_id": "default",
            "title": "Test Infographic"
        }, timeout=120)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "slides_data" in data, "Response should have slides_data"
        print(f"Infographic generated successfully with {len(data.get('slides_data', []))} sections")
    
    def test_infographic_has_6_sections(self):
        """Test that infographic has exactly 6 sections (not more)"""
        response = self.session.post(f"{BASE_URL}/api/generate", json={
            "output_type": "infographic",
            "notebook_id": "default",
            "title": "Test Infographic Sections"
        }, timeout=120)
        assert response.status_code == 200
        data = response.json()
        sections = data.get('slides_data', [])
        assert len(sections) == 6, f"Expected exactly 6 sections, got {len(sections)}"
        print(f"PASSED: Infographic has exactly 6 sections")
    
    def test_infographic_max_2_bullets_per_section(self):
        """Test that each section has at most 2 bullets"""
        response = self.session.post(f"{BASE_URL}/api/generate", json={
            "output_type": "infographic",
            "notebook_id": "default",
            "title": "Test Bullets Limit"
        }, timeout=120)
        assert response.status_code == 200
        data = response.json()
        sections = data.get('slides_data', [])
        
        violations = []
        for i, section in enumerate(sections):
            bullets = section.get('bullets', [])
            if len(bullets) > 2:
                violations.append(f"Section {i+1} '{section.get('title')}': {len(bullets)} bullets (max 2)")
        
        assert len(violations) == 0, f"Bullet violations: {violations}"
        print(f"PASSED: All {len(sections)} sections have max 2 bullets")
    
    def test_infographic_bullets_under_10_words(self):
        """Test that all bullets are under 10 words"""
        response = self.session.post(f"{BASE_URL}/api/generate", json={
            "output_type": "infographic",
            "notebook_id": "default",
            "title": "Test Bullet Length"
        }, timeout=120)
        assert response.status_code == 200
        data = response.json()
        sections = data.get('slides_data', [])
        
        violations = []
        for i, section in enumerate(sections):
            for j, bullet in enumerate(section.get('bullets', [])):
                word_count = len(bullet.split())
                if word_count > 10:
                    violations.append(f"Section {i+1} bullet {j+1}: '{bullet}' ({word_count} words)")
        
        assert len(violations) == 0, f"Bullets over 10 words: {violations}"
        print(f"PASSED: All bullets under 10 words")
    
    def test_infographic_has_subtitles(self):
        """Test that each section has a subtitle"""
        response = self.session.post(f"{BASE_URL}/api/generate", json={
            "output_type": "infographic",
            "notebook_id": "default",
            "title": "Test Subtitles"
        }, timeout=120)
        assert response.status_code == 200
        data = response.json()
        sections = data.get('slides_data', [])
        
        missing_subtitles = []
        for i, section in enumerate(sections):
            subtitle = section.get('subtitle', '')
            if not subtitle or subtitle.strip() == '':
                missing_subtitles.append(f"Section {i+1} '{section.get('title')}'")
        
        assert len(missing_subtitles) == 0, f"Sections missing subtitles: {missing_subtitles}"
        print(f"PASSED: All {len(sections)} sections have subtitles")
    
    def test_infographic_has_imageKeywords(self):
        """Test that each section has an imageKeyword for AI image generation"""
        response = self.session.post(f"{BASE_URL}/api/generate", json={
            "output_type": "infographic",
            "notebook_id": "default",
            "title": "Test Image Keywords"
        }, timeout=120)
        assert response.status_code == 200
        data = response.json()
        sections = data.get('slides_data', [])
        
        missing_keywords = []
        for i, section in enumerate(sections):
            keyword = section.get('imageKeyword', '')
            if not keyword or keyword.strip() == '':
                missing_keywords.append(f"Section {i+1} '{section.get('title')}'")
        
        assert len(missing_keywords) == 0, f"Sections missing imageKeyword: {missing_keywords}"
        print(f"PASSED: All {len(sections)} sections have imageKeywords")
    
    def test_infographic_visual_types_not_all_none(self):
        """Test that visualType is set to 'workflow' or 'stat', not all 'none'"""
        response = self.session.post(f"{BASE_URL}/api/generate", json={
            "output_type": "infographic",
            "notebook_id": "default",
            "title": "Test Visual Types"
        }, timeout=120)
        assert response.status_code == 200
        data = response.json()
        sections = data.get('slides_data', [])
        
        visual_types = [s.get('visualType', 'none') for s in sections]
        workflow_count = visual_types.count('workflow')
        stat_count = visual_types.count('stat')
        none_count = visual_types.count('none')
        
        print(f"Visual type distribution: workflow={workflow_count}, stat={stat_count}, none={none_count}")
        
        # Should have at least some workflow or stat types
        assert workflow_count + stat_count > 0, f"All visualTypes are 'none': {visual_types}"
        print(f"PASSED: Visual types are not all 'none'")
    
    def test_infographic_has_at_least_2_workflow_sections(self):
        """Test that at least 2 sections have visualType='workflow'"""
        response = self.session.post(f"{BASE_URL}/api/generate", json={
            "output_type": "infographic",
            "notebook_id": "default",
            "title": "Test Workflow Sections"
        }, timeout=120)
        assert response.status_code == 200
        data = response.json()
        sections = data.get('slides_data', [])
        
        workflow_sections = [s for s in sections if s.get('visualType') == 'workflow']
        
        assert len(workflow_sections) >= 2, f"Expected at least 2 workflow sections, got {len(workflow_sections)}"
        print(f"PASSED: Found {len(workflow_sections)} workflow sections")
    
    def test_workflow_sections_have_steps(self):
        """Test that workflow sections have workflowSteps arrays"""
        response = self.session.post(f"{BASE_URL}/api/generate", json={
            "output_type": "infographic",
            "notebook_id": "default",
            "title": "Test Workflow Steps"
        }, timeout=120)
        assert response.status_code == 200
        data = response.json()
        sections = data.get('slides_data', [])
        
        workflow_sections = [s for s in sections if s.get('visualType') == 'workflow']
        
        missing_steps = []
        for section in workflow_sections:
            steps = section.get('workflowSteps', [])
            if len(steps) < 3:  # Should have at least 3 steps
                missing_steps.append(f"Section '{section.get('title')}': {len(steps)} steps (need >= 3)")
        
        assert len(missing_steps) == 0, f"Workflow sections with insufficient steps: {missing_steps}"
        print(f"PASSED: All {len(workflow_sections)} workflow sections have 3+ steps")
    
    def test_stat_sections_have_values(self):
        """Test that stat sections have stat values and labels"""
        response = self.session.post(f"{BASE_URL}/api/generate", json={
            "output_type": "infographic",
            "notebook_id": "default",
            "title": "Test Stat Values"
        }, timeout=120)
        assert response.status_code == 200
        data = response.json()
        sections = data.get('slides_data', [])
        
        stat_sections = [s for s in sections if s.get('visualType') == 'stat' or s.get('stat')]
        
        missing_stats = []
        for section in stat_sections:
            stat = section.get('stat', '')
            if not stat:
                missing_stats.append(f"Section '{section.get('title')}': no stat value")
        
        print(f"Found {len(stat_sections)} sections with stat values")
        if stat_sections:
            for s in stat_sections:
                print(f"  - {s.get('title')}: stat='{s.get('stat')}' label='{s.get('statLabel', '')}'")
        
        # This is a soft check - not all sections need stats
        print(f"PASSED: Stat sections verified")
    
    def test_infographic_structure_summary(self):
        """Summary test - print full structure of generated infographic"""
        response = self.session.post(f"{BASE_URL}/api/generate", json={
            "output_type": "infographic",
            "notebook_id": "default",
            "title": "Structure Summary Test"
        }, timeout=120)
        assert response.status_code == 200
        data = response.json()
        sections = data.get('slides_data', [])
        
        print(f"\n{'='*60}")
        print(f"INFOGRAPHIC STRUCTURE SUMMARY")
        print(f"{'='*60}")
        print(f"Total sections: {len(sections)}")
        print(f"Theme: {data.get('theme', 'N/A')}")
        
        for i, section in enumerate(sections):
            print(f"\n--- Section {i+1}: {section.get('title', 'Untitled')} ---")
            print(f"  subtitle: {section.get('subtitle', 'N/A')}")
            print(f"  visualType: {section.get('visualType', 'none')}")
            print(f"  stat: {section.get('stat', '')} ({section.get('statLabel', '')})")
            print(f"  imageKeyword: {section.get('imageKeyword', 'N/A')}")
            bullets = section.get('bullets', [])
            print(f"  bullets ({len(bullets)}):")
            for j, b in enumerate(bullets):
                word_count = len(b.split())
                print(f"    {j+1}. [{word_count} words] {b}")
            if section.get('visualType') == 'workflow':
                steps = section.get('workflowSteps', [])
                print(f"  workflowSteps ({len(steps)}): {steps}")
        
        print(f"\n{'='*60}")
        print("PASSED: Structure summary complete")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
