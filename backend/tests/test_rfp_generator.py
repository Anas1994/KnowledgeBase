"""
Test cases for RFP Generator feature endpoints:
- POST /api/rfp/parse-template: Parse uploaded RFP template file
- POST /api/rfp/generate: Generate filled RFP using template sections + knowledge base
"""
import pytest
import requests
import os
import json
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestRFPGenerator:
    """RFP Generator endpoint tests"""
    
    # ── Basic endpoint availability ──
    
    def test_api_health(self):
        """Test that API is running"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert "NotebookLM API Ready" in data.get("message", "")
        print(f"✓ API health check passed")
    
    def test_sources_available(self):
        """Test that indexed sources exist for RFP generation"""
        response = requests.get(f"{BASE_URL}/api/sources?notebook_id=default")
        assert response.status_code == 200
        sources = response.json()
        indexed = [s for s in sources if s.get('status') == 'indexed']
        assert len(indexed) > 0, "Need at least one indexed source for RFP generation"
        print(f"✓ {len(indexed)} indexed sources available for RFP generation")
        return indexed
    
    # ── /api/rfp/parse-template endpoint ──
    
    def test_parse_template_endpoint_exists(self):
        """Test that parse-template endpoint exists (even with no file)"""
        # Sending request without file should return 422 (Unprocessable Entity) not 404
        response = requests.post(f"{BASE_URL}/api/rfp/parse-template")
        # Should be 422 (missing required field) or 400, not 404
        assert response.status_code in [400, 422], f"Expected 400/422, got {response.status_code}"
        print(f"✓ /api/rfp/parse-template endpoint exists (returns {response.status_code} without file)")
    
    def test_parse_template_with_txt_file(self):
        """Test parsing a sample TXT template"""
        # Create a sample RFP template
        template_content = """
REQUEST FOR PROPOSAL TEMPLATE

1. Executive Summary
Provide a brief overview of the project.

2. Background & Context
Describe the organizational context and need.

3. Project Objectives
List the specific goals and objectives.

4. Scope of Work
Define the scope and boundaries of the project.

5. Technical Requirements
Detail technical specifications required.

6. Deliverables
List all expected deliverables.

7. Timeline & Milestones
Provide a schedule of key milestones.

8. Budget Considerations
Outline budget constraints and expectations.
"""
        files = {'file': ('template.txt', template_content.encode('utf-8'), 'text/plain')}
        response = requests.post(f"{BASE_URL}/api/rfp/parse-template", files=files)
        assert response.status_code == 200, f"Parse template failed: {response.text}"
        
        data = response.json()
        assert 'sections' in data, "Response should include 'sections' array"
        assert isinstance(data['sections'], list), "Sections should be a list"
        assert len(data['sections']) > 0, "Should detect at least some sections"
        
        print(f"✓ Template parsed successfully: {len(data['sections'])} sections detected")
        print(f"  Sections: {data['sections'][:5]}..." if len(data['sections']) > 5 else f"  Sections: {data['sections']}")
        return data['sections']
    
    def test_parse_template_unsupported_type(self):
        """Test that unsupported file types are rejected"""
        files = {'file': ('template.json', b'{"test": "data"}', 'application/json')}
        response = requests.post(f"{BASE_URL}/api/rfp/parse-template", files=files)
        assert response.status_code == 400, "Should reject unsupported file types"
        print(f"✓ Unsupported file type correctly rejected")
    
    # ── /api/rfp/generate endpoint ──
    
    def test_generate_endpoint_exists(self):
        """Test that generate endpoint exists"""
        # Send empty body - should return 422 (missing required fields) not 404
        response = requests.post(
            f"{BASE_URL}/api/rfp/generate",
            headers={'Content-Type': 'application/json'},
            json={}
        )
        # Should be 422 or validation error, not 404
        assert response.status_code != 404, "/api/rfp/generate endpoint should exist"
        print(f"✓ /api/rfp/generate endpoint exists (returns {response.status_code} with empty body)")
    
    def test_generate_requires_indexed_sources(self):
        """Test that generate fails gracefully without sources"""
        response = requests.post(
            f"{BASE_URL}/api/rfp/generate",
            headers={'Content-Type': 'application/json'},
            json={
                "template_sections": ["Executive Summary"],
                "project_name": "Test",
                "client_name": "Test Client",
                "tone": "Formal",
                "notebook_id": "nonexistent_notebook"  # This won't have sources
            }
        )
        # Should return 400 (no indexed sources) not 500
        assert response.status_code == 400, f"Expected 400 for missing sources, got {response.status_code}"
        data = response.json()
        assert "sources" in data.get('detail', '').lower(), "Error should mention sources"
        print(f"✓ Generate correctly requires indexed sources")
    
    def test_generate_rfp_full_flow(self):
        """Test full RFP generation with all 12 standard sections"""
        # Standard RFP sections (as defined in frontend)
        SAMPLE_SECTIONS = [
            "Executive Summary",
            "Background & Context",
            "Project Objectives",
            "Scope of Work",
            "Technical Requirements",
            "Deliverables",
            "Timeline & Milestones",
            "Budget Considerations",
            "Evaluation Criteria",
            "Submission Requirements",
            "Terms & Conditions",
            "Appendices"
        ]
        
        print("  Starting RFP generation (this may take 30-60 seconds)...")
        start_time = time.time()
        
        response = requests.post(
            f"{BASE_URL}/api/rfp/generate",
            headers={'Content-Type': 'application/json'},
            json={
                "template_sections": SAMPLE_SECTIONS,
                "project_name": "Hospital at Home Platform",
                "client_name": "Ministry of Health",
                "tone": "Formal",
                "additional_context": "Focus on digital health transformation",
                "notebook_id": "default"
            },
            timeout=120  # 2 minute timeout for LLM generation
        )
        
        elapsed = time.time() - start_time
        print(f"  Generation completed in {elapsed:.1f} seconds")
        
        assert response.status_code == 200, f"RFP generation failed: {response.text[:200]}"
        
        data = response.json()
        
        # Verify response structure
        assert 'sections' in data, "Response should include 'sections'"
        assert 'full_text' in data, "Response should include 'full_text'"
        assert 'project_name' in data, "Response should include 'project_name'"
        assert 'client_name' in data, "Response should include 'client_name'"
        assert 'tone' in data, "Response should include 'tone'"
        
        # Verify sections
        sections = data['sections']
        assert isinstance(sections, list), "Sections should be a list"
        assert len(sections) >= len(SAMPLE_SECTIONS) - 2, f"Should return most sections, got {len(sections)}"
        
        # Verify each section has content and citations
        sections_with_citations = 0
        for sec in sections:
            assert 'section' in sec, "Each section should have 'section' (title)"
            assert 'content' in sec, "Each section should have 'content'"
            assert len(sec['content']) > 50, f"Section '{sec['section']}' content too short"
            
            # Check for inline citations
            if '[Source:' in sec['content']:
                sections_with_citations += 1
        
        print(f"✓ RFP generated successfully:")
        print(f"  - {len(sections)} sections filled")
        print(f"  - {sections_with_citations}/{len(sections)} sections have inline citations")
        print(f"  - Full text length: {len(data['full_text'])} chars")
        print(f"  - Project: {data['project_name']}")
        print(f"  - Client: {data['client_name']}")
        print(f"  - Tone: {data['tone']}")
        
        return data
    
    def test_generate_rfp_different_tones(self):
        """Test RFP generation with different tones"""
        tones = ["Formal", "Technical", "Executive", "Proposal-style"]
        
        for tone in tones:
            print(f"  Testing {tone} tone...")
            response = requests.post(
                f"{BASE_URL}/api/rfp/generate",
                headers={'Content-Type': 'application/json'},
                json={
                    "template_sections": ["Executive Summary", "Project Objectives"],
                    "project_name": f"Test Project ({tone})",
                    "client_name": "Test Client",
                    "tone": tone,
                    "notebook_id": "default"
                },
                timeout=90
            )
            
            assert response.status_code == 200, f"RFP generation with {tone} tone failed"
            data = response.json()
            assert data['tone'] == tone, f"Response tone should match request"
        
        print(f"✓ All 4 tone options work correctly")
    
    def test_generate_rfp_response_structure(self):
        """Test RFP generate response has correct structure"""
        response = requests.post(
            f"{BASE_URL}/api/rfp/generate",
            headers={'Content-Type': 'application/json'},
            json={
                "template_sections": ["Executive Summary"],
                "project_name": "Structure Test",
                "client_name": "Test",
                "tone": "Formal",
                "notebook_id": "default"
            },
            timeout=90
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify all expected fields
        expected_fields = ['sections', 'full_text', 'project_name', 'client_name', 'tone', 'source_names']
        for field in expected_fields:
            assert field in data, f"Response missing '{field}' field"
        
        assert isinstance(data['source_names'], list), "source_names should be a list"
        assert len(data['source_names']) > 0, "Should have source names from knowledge base"
        
        print(f"✓ Response structure is correct with all expected fields")
        print(f"  Source names: {data['source_names']}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
