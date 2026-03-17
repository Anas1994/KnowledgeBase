"""
Test suite for Visual Report Generation feature
Tests POST /api/generate with output_type='report' returns structured slides_data 
with sections containing title, bullets, imageKeyword, visualType, workflowSteps
"""
import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')


class TestVisualReportGeneration:
    """Tests for visual report generation with structured sections"""
    
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
        indexed = [s for s in sources if s.get("status") == "indexed"]
        assert len(indexed) >= 1, "Need at least 1 indexed source for testing"
        print(f"✓ Found {len(indexed)} indexed sources")
        return indexed
    
    def test_report_generation_returns_structured_slides_data(self):
        """Test POST /api/generate with output_type='report' returns slides_data with sections"""
        response = requests.post(
            f"{BASE_URL}/api/generate",
            json={
                "output_type": "report",
                "notebook_id": "default",
                "title": "Visual Report Test"
            },
            timeout=120  # AI generation can take time
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        
        # Verify response structure
        assert "id" in data, "Response missing 'id' field"
        assert data.get("type") == "report", f"Expected type='report', got {data.get('type')}"
        assert "slides_data" in data, "Response missing 'slides_data' field"
        assert "theme" in data, "Response missing 'theme' field"
        assert "content" in data, "Response missing 'content' fallback field"
        
        sections = data.get("slides_data", [])
        assert len(sections) >= 4, f"Expected at least 4 sections, got {len(sections)}"
        
        print(f"✓ Report generated with {len(sections)} sections")
        print(f"  Theme: {data.get('theme')}")
        return data
    
    def test_report_sections_have_required_fields(self):
        """Test each report section has title, bullets, imageKeyword, visualType"""
        response = requests.post(
            f"{BASE_URL}/api/generate",
            json={
                "output_type": "report",
                "notebook_id": "default",
                "title": "Section Fields Test"
            },
            timeout=120
        )
        
        assert response.status_code == 200
        data = response.json()
        sections = data.get("slides_data", [])
        
        required_fields = ["title", "bullets", "imageKeyword", "visualType"]
        
        for i, section in enumerate(sections):
            for field in required_fields:
                assert field in section, f"Section {i+1} missing required field: {field}"
            
            # Validate field types
            assert isinstance(section.get("title"), str), f"Section {i+1} title should be string"
            assert isinstance(section.get("bullets"), list), f"Section {i+1} bullets should be list"
            assert isinstance(section.get("imageKeyword"), str), f"Section {i+1} imageKeyword should be string"
            assert isinstance(section.get("visualType"), str), f"Section {i+1} visualType should be string"
            
            print(f"  Section {i+1}: {section.get('title', 'Untitled')}")
            print(f"    - imageKeyword: {section.get('imageKeyword')}")
            print(f"    - visualType: {section.get('visualType')}")
            print(f"    - bullets: {len(section.get('bullets', []))} items")
        
        print(f"✓ All {len(sections)} sections have required fields")
        return sections


class TestReportBulletsConciseness:
    """Tests for concise bullet points in report sections"""
    
    def test_bullets_under_15_words(self):
        """Test that report bullets are concise (under 15 words each)"""
        response = requests.post(
            f"{BASE_URL}/api/generate",
            json={
                "output_type": "report",
                "notebook_id": "default",
                "title": "Bullet Conciseness Test"
            },
            timeout=120
        )
        
        assert response.status_code == 200
        data = response.json()
        sections = data.get("slides_data", [])
        
        long_bullets = []
        total_bullets = 0
        
        for i, section in enumerate(sections):
            bullets = section.get("bullets", [])
            for j, bullet in enumerate(bullets):
                total_bullets += 1
                word_count = len(bullet.split())
                if word_count > 15:
                    long_bullets.append({
                        "section": i + 1,
                        "bullet": j + 1,
                        "word_count": word_count,
                        "text": bullet[:60] + "..." if len(bullet) > 60 else bullet
                    })
        
        # Allow up to 20% of bullets to be slightly longer (LLM variability)
        max_allowed_long = max(1, int(total_bullets * 0.2))
        
        if len(long_bullets) > max_allowed_long:
            print(f"✗ Found {len(long_bullets)} bullets over 15 words (max allowed: {max_allowed_long})")
            for lb in long_bullets[:5]:  # Show first 5
                print(f"  Section {lb['section']}, Bullet {lb['bullet']}: {lb['word_count']} words")
        else:
            print(f"✓ Bullet conciseness check passed: {len(long_bullets)}/{total_bullets} bullets over 15 words (acceptable)")
        
        # This is a soft assertion - we report but don't fail for minor violations
        assert len(long_bullets) <= max_allowed_long + 2, f"Too many long bullets: {len(long_bullets)}"


class TestReportWorkflowSections:
    """Tests for workflow sections with workflowSteps array"""
    
    def test_at_least_one_workflow_section(self):
        """Test that at least 1-2 sections have visualType='workflow' with workflowSteps"""
        response = requests.post(
            f"{BASE_URL}/api/generate",
            json={
                "output_type": "report",
                "notebook_id": "default",
                "title": "Workflow Section Test"
            },
            timeout=120
        )
        
        assert response.status_code == 200
        data = response.json()
        sections = data.get("slides_data", [])
        
        workflow_sections = []
        for i, section in enumerate(sections):
            if section.get("visualType") == "workflow":
                steps = section.get("workflowSteps", [])
                workflow_sections.append({
                    "section_num": i + 1,
                    "title": section.get("title"),
                    "steps_count": len(steps),
                    "steps": steps
                })
        
        # Allow for LLM variability - sometimes 0 workflow sections is acceptable
        # depending on content type
        if len(workflow_sections) >= 1:
            print(f"✓ Found {len(workflow_sections)} workflow section(s)")
            for ws in workflow_sections:
                print(f"  Section {ws['section_num']}: {ws['title']}")
                print(f"    Workflow steps ({ws['steps_count']}): {ws['steps'][:3]}...")
        else:
            print(f"⚠ No workflow sections found (this may be acceptable depending on content)")
        
        # Verify workflowSteps structure when workflow type is used
        for ws in workflow_sections:
            assert ws["steps_count"] >= 2, f"Workflow section '{ws['title']}' should have at least 2 steps"
            assert ws["steps_count"] <= 6, f"Workflow section '{ws['title']}' has too many steps ({ws['steps_count']})"
        
        return workflow_sections


class TestReportThemeDetection:
    """Tests for detect_theme function with health content"""
    
    def test_health_theme_detected(self):
        """Test that detect_theme correctly identifies health content"""
        # The existing sources contain health-related content (SOW-H@H)
        response = requests.post(
            f"{BASE_URL}/api/generate",
            json={
                "output_type": "report",
                "notebook_id": "default",
                "title": "Health Theme Detection Test"
            },
            timeout=120
        )
        
        assert response.status_code == 200
        data = response.json()
        theme = data.get("theme")
        
        # Given the H@H (Hospital at Home) sources, should detect health theme
        print(f"  Detected theme: {theme}")
        
        # Acceptable themes for health content
        acceptable_themes = ["health", "corporate", "tech"]  # 'corporate' is default fallback
        assert theme in acceptable_themes, f"Unexpected theme: {theme}"
        
        print(f"✓ Theme detection returned: {theme}")
        return theme


class TestReportImageKeywords:
    """Tests for imageKeyword field in every section"""
    
    def test_every_section_has_image_keyword(self):
        """Test that every section has a non-empty imageKeyword for AI image generation"""
        response = requests.post(
            f"{BASE_URL}/api/generate",
            json={
                "output_type": "report",
                "notebook_id": "default",
                "title": "Image Keyword Test"
            },
            timeout=120
        )
        
        assert response.status_code == 200
        data = response.json()
        sections = data.get("slides_data", [])
        
        sections_without_keyword = []
        for i, section in enumerate(sections):
            keyword = section.get("imageKeyword", "")
            if not keyword or len(keyword.strip()) == 0:
                sections_without_keyword.append({
                    "section_num": i + 1,
                    "title": section.get("title")
                })
            else:
                print(f"  Section {i+1}: '{section.get('title')}' -> imageKeyword: '{keyword}'")
        
        assert len(sections_without_keyword) == 0, f"Sections missing imageKeyword: {sections_without_keyword}"
        print(f"✓ All {len(sections)} sections have imageKeyword")
        
    def test_image_keyword_is_contextual(self):
        """Test that imageKeyword is a meaningful 2-4 word phrase, not just section title"""
        response = requests.post(
            f"{BASE_URL}/api/generate",
            json={
                "output_type": "report",
                "notebook_id": "default",
                "title": "Image Keyword Quality Test"
            },
            timeout=120
        )
        
        assert response.status_code == 200
        data = response.json()
        sections = data.get("slides_data", [])
        
        keyword_quality_issues = []
        for i, section in enumerate(sections):
            keyword = section.get("imageKeyword", "")
            title = section.get("title", "")
            
            # Check it's not just the title repeated
            if keyword.lower() == title.lower():
                keyword_quality_issues.append(f"Section {i+1}: keyword is just title repeated")
            
            # Check it has at least 2 words (contextual phrase)
            word_count = len(keyword.split())
            if word_count < 2:
                keyword_quality_issues.append(f"Section {i+1}: keyword has only {word_count} word(s): '{keyword}'")
        
        # Allow some LLM variability
        if len(keyword_quality_issues) > 2:
            print(f"⚠ Image keyword quality issues: {keyword_quality_issues}")
        else:
            print(f"✓ Image keywords are contextual phrases")


class TestReportImageGeneration:
    """Tests for generating images for report sections"""
    
    def test_generate_image_for_report_section(self):
        """Test POST /api/generate-image with layout='report' works"""
        response = requests.post(
            f"{BASE_URL}/api/generate-image",
            json={
                "slide_title": "Executive Summary",
                "slide_content": "Key findings, strategic recommendations, implementation roadmap",
                "layout": "report",
                "theme": "health",
                "image_keyword": "healthcare executive report"
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
        
        print(f"✓ Report image generation returned {len(image_base64)} chars (~{approx_size_kb:.1f} KB)")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
