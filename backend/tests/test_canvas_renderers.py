"""
Test Canvas Renderers - Backend API Tests
Tests for mindmap, flashcards, quiz, and datatable output types
that return structured JSON for frontend canvas rendering
"""
import pytest
import requests
import os
import json

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestGenerateEndpointStructure:
    """Test /api/generate endpoint returns correct JSON structure for canvas renderers"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get sources for testing"""
        response = requests.get(f"{BASE_URL}/api/sources?notebook_id=default")
        assert response.status_code == 200, f"Failed to get sources: {response.text}"
        self.sources = response.json()
        assert len(self.sources) > 0, "No sources available for testing"
    
    def test_mindmap_returns_structured_json(self):
        """Test mindmap output returns proper JSON structure for canvas renderer"""
        response = requests.post(
            f"{BASE_URL}/api/generate",
            json={
                "output_type": "mindmap",
                "notebook_id": "default",
                "title": "Test Mind Map"
            },
            timeout=120
        )
        
        assert response.status_code == 200, f"Mindmap generation failed: {response.text}"
        data = response.json()
        
        # Verify response structure
        assert "id" in data, "Response missing 'id'"
        assert "type" in data, "Response missing 'type'"
        assert data["type"] == "mindmap", f"Expected type 'mindmap', got '{data['type']}'"
        assert "title" in data, "Response missing 'title'"
        assert "content" in data, "Response missing 'content'"
        assert "slides_data" in data, "Response missing 'slides_data' (required for canvas renderer)"
        
        # Verify slides_data structure for mindmap
        slides_data = data["slides_data"]
        assert slides_data is not None, "slides_data is None"
        assert isinstance(slides_data, dict), f"slides_data should be dict, got {type(slides_data)}"
        
        # Mindmap requires: center (string), branches (array)
        assert "center" in slides_data, "Mindmap missing 'center' field"
        assert "branches" in slides_data, "Mindmap missing 'branches' field"
        assert isinstance(slides_data["branches"], list), "branches should be a list"
        
        # Verify branch structure
        if len(slides_data["branches"]) > 0:
            branch = slides_data["branches"][0]
            assert "label" in branch, "Branch missing 'label'"
            assert "color" in branch, "Branch missing 'color'"
            assert "children" in branch, "Branch missing 'children'"
            assert isinstance(branch["children"], list), "children should be a list"
            
            # Verify child structure
            if len(branch["children"]) > 0:
                child = branch["children"][0]
                assert "label" in child, "Child missing 'label'"
        
        print(f"✓ Mindmap structure valid: center='{slides_data['center'][:30]}...', {len(slides_data['branches'])} branches")
    
    def test_flashcards_returns_structured_json(self):
        """Test flashcards output returns proper JSON structure for canvas renderer"""
        response = requests.post(
            f"{BASE_URL}/api/generate",
            json={
                "output_type": "flashcards",
                "notebook_id": "default",
                "title": "Test Flashcards"
            },
            timeout=120
        )
        
        assert response.status_code == 200, f"Flashcards generation failed: {response.text}"
        data = response.json()
        
        # Verify response structure
        assert "id" in data
        assert "type" in data
        assert data["type"] == "flashcards"
        assert "slides_data" in data, "Response missing 'slides_data'"
        
        # Verify slides_data structure for flashcards
        slides_data = data["slides_data"]
        assert slides_data is not None, "slides_data is None"
        assert isinstance(slides_data, list), f"slides_data should be list, got {type(slides_data)}"
        assert len(slides_data) > 0, "slides_data is empty"
        
        # Verify flashcard structure
        card = slides_data[0]
        assert "id" in card, "Flashcard missing 'id'"
        assert "question" in card, "Flashcard missing 'question'"
        assert "answer" in card, "Flashcard missing 'answer'"
        assert "category" in card, "Flashcard missing 'category'"
        assert "difficulty" in card, "Flashcard missing 'difficulty'"
        
        # Verify difficulty is valid
        valid_difficulties = ["Easy", "Medium", "Hard"]
        assert card["difficulty"] in valid_difficulties, f"Invalid difficulty: {card['difficulty']}"
        
        print(f"✓ Flashcards structure valid: {len(slides_data)} cards")
    
    def test_quiz_returns_structured_json(self):
        """Test quiz output returns proper JSON structure for canvas renderer"""
        response = requests.post(
            f"{BASE_URL}/api/generate",
            json={
                "output_type": "quiz",
                "notebook_id": "default",
                "title": "Test Quiz"
            },
            timeout=120
        )
        
        assert response.status_code == 200, f"Quiz generation failed: {response.text}"
        data = response.json()
        
        # Verify response structure
        assert "id" in data
        assert "type" in data
        assert data["type"] == "quiz"
        assert "slides_data" in data, "Response missing 'slides_data'"
        
        # Verify slides_data structure for quiz
        slides_data = data["slides_data"]
        assert slides_data is not None, "slides_data is None"
        assert isinstance(slides_data, dict), f"slides_data should be dict, got {type(slides_data)}"
        
        # Quiz requires: mcq, truefalse, short arrays
        assert "mcq" in slides_data, "Quiz missing 'mcq' array"
        assert "truefalse" in slides_data, "Quiz missing 'truefalse' array"
        assert "short" in slides_data, "Quiz missing 'short' array"
        
        assert isinstance(slides_data["mcq"], list), "mcq should be a list"
        assert isinstance(slides_data["truefalse"], list), "truefalse should be a list"
        assert isinstance(slides_data["short"], list), "short should be a list"
        
        # Verify MCQ structure if present
        if len(slides_data["mcq"]) > 0:
            mcq = slides_data["mcq"][0]
            assert "id" in mcq, "MCQ missing 'id'"
            assert "question" in mcq, "MCQ missing 'question'"
            assert "options" in mcq, "MCQ missing 'options'"
            assert "correct" in mcq, "MCQ missing 'correct'"
            assert isinstance(mcq["options"], list), "options should be a list"
        
        # Verify True/False structure if present
        if len(slides_data["truefalse"]) > 0:
            tf = slides_data["truefalse"][0]
            assert "id" in tf, "TF missing 'id'"
            assert "statement" in tf, "TF missing 'statement'"
            assert "answer" in tf, "TF missing 'answer'"
        
        # Verify Short Answer structure if present
        if len(slides_data["short"]) > 0:
            short = slides_data["short"][0]
            assert "id" in short, "Short missing 'id'"
            assert "question" in short, "Short missing 'question'"
            assert "sampleAnswer" in short, "Short missing 'sampleAnswer'"
        
        total = len(slides_data["mcq"]) + len(slides_data["truefalse"]) + len(slides_data["short"])
        print(f"✓ Quiz structure valid: {len(slides_data['mcq'])} MCQ, {len(slides_data['truefalse'])} T/F, {len(slides_data['short'])} Short = {total} total")
    
    def test_datatable_returns_structured_json(self):
        """Test datatable output returns proper JSON structure for canvas renderer"""
        response = requests.post(
            f"{BASE_URL}/api/generate",
            json={
                "output_type": "datatable",
                "notebook_id": "default",
                "title": "Test Data Table"
            },
            timeout=120
        )
        
        assert response.status_code == 200, f"Datatable generation failed: {response.text}"
        data = response.json()
        
        # Verify response structure
        assert "id" in data
        assert "type" in data
        assert data["type"] == "datatable"
        assert "slides_data" in data, "Response missing 'slides_data'"
        
        # Verify slides_data structure for datatable
        slides_data = data["slides_data"]
        assert slides_data is not None, "slides_data is None"
        assert isinstance(slides_data, dict), f"slides_data should be dict, got {type(slides_data)}"
        
        # Datatable requires: tables, stats arrays
        assert "tables" in slides_data, "Datatable missing 'tables' array"
        assert "stats" in slides_data, "Datatable missing 'stats' array"
        
        assert isinstance(slides_data["tables"], list), "tables should be a list"
        assert isinstance(slides_data["stats"], list), "stats should be a list"
        
        # Verify table structure if present
        if len(slides_data["tables"]) > 0:
            table = slides_data["tables"][0]
            assert "title" in table, "Table missing 'title'"
            assert "headers" in table, "Table missing 'headers'"
            assert "rows" in table, "Table missing 'rows'"
            assert isinstance(table["headers"], list), "headers should be a list"
            assert isinstance(table["rows"], list), "rows should be a list"
        
        # Verify stat structure if present
        if len(slides_data["stats"]) > 0:
            stat = slides_data["stats"][0]
            assert "label" in stat, "Stat missing 'label'"
            assert "value" in stat, "Stat missing 'value'"
        
        print(f"✓ Datatable structure valid: {len(slides_data['tables'])} tables, {len(slides_data['stats'])} stats")


class TestExistingRenderersNoRegression:
    """Test that existing report and infographic renderers still work"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get sources for testing"""
        response = requests.get(f"{BASE_URL}/api/sources?notebook_id=default")
        assert response.status_code == 200
        self.sources = response.json()
        assert len(self.sources) > 0
    
    def test_report_still_returns_slides_data(self):
        """Test report output still returns slides_data for visual report renderer"""
        response = requests.post(
            f"{BASE_URL}/api/generate",
            json={
                "output_type": "report",
                "notebook_id": "default",
                "title": "Test Report"
            },
            timeout=120
        )
        
        assert response.status_code == 200, f"Report generation failed: {response.text}"
        data = response.json()
        
        assert data["type"] == "report"
        assert "slides_data" in data, "Report missing slides_data"
        assert data["slides_data"] is not None
        assert isinstance(data["slides_data"], list), "Report slides_data should be list"
        
        # Verify section structure
        if len(data["slides_data"]) > 0:
            section = data["slides_data"][0]
            assert "title" in section, "Section missing 'title'"
        
        print(f"✓ Report structure valid: {len(data['slides_data'])} sections")
    
    def test_infographic_still_returns_slides_data(self):
        """Test infographic output still returns slides_data for infographic renderer"""
        response = requests.post(
            f"{BASE_URL}/api/generate",
            json={
                "output_type": "infographic",
                "notebook_id": "default",
                "title": "Test Infographic"
            },
            timeout=120
        )
        
        assert response.status_code == 200, f"Infographic generation failed: {response.text}"
        data = response.json()
        
        assert data["type"] == "infographic"
        assert "slides_data" in data, "Infographic missing slides_data"
        assert data["slides_data"] is not None
        assert isinstance(data["slides_data"], list), "Infographic slides_data should be list"
        
        print(f"✓ Infographic structure valid: {len(data['slides_data'])} sections")


class TestGenerateEndpointErrors:
    """Test error handling for generate endpoint"""
    
    def test_generate_without_sources_returns_400(self):
        """Test that generate fails gracefully when no sources exist"""
        # Use a notebook_id that doesn't exist
        response = requests.post(
            f"{BASE_URL}/api/generate",
            json={
                "output_type": "mindmap",
                "notebook_id": "nonexistent_notebook_12345",
                "title": "Test"
            },
            timeout=30
        )
        
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
        data = response.json()
        assert "detail" in data
        print(f"✓ Proper error for missing sources: {data['detail']}")
    
    def test_unknown_output_type_returns_400(self):
        """Test that unknown output type returns 400"""
        response = requests.post(
            f"{BASE_URL}/api/generate",
            json={
                "output_type": "unknown_type_xyz",
                "notebook_id": "default",
                "title": "Test"
            },
            timeout=30
        )
        
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
        data = response.json()
        assert "detail" in data
        print(f"✓ Proper error for unknown type: {data['detail']}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
