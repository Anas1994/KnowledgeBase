"""
Test suite for new export formats:
- Quiz export as DOCX (backend endpoint)
- Data Table export as XLSX (backend endpoint)
- Flashcards export as PPTX (frontend pptxgenjs)
- Mind Map still exports as PNG (no regression)
"""
import pytest
import requests
import os
import io
import zipfile

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestQuizDocxExport:
    """Test /api/export/quiz-docx endpoint"""
    
    def test_quiz_docx_export_success(self):
        """Test quiz DOCX export with valid data"""
        payload = {
            "title": "Test Quiz Export",
            "quiz_data": {
                "mcq": [
                    {
                        "id": 1,
                        "question": "What is the capital of France?",
                        "options": ["A) London", "B) Paris", "C) Berlin", "D) Madrid"],
                        "correct": "B",
                        "explanation": "Paris is the capital of France"
                    },
                    {
                        "id": 2,
                        "question": "Which planet is closest to the Sun?",
                        "options": ["A) Venus", "B) Earth", "C) Mercury", "D) Mars"],
                        "correct": "C",
                        "explanation": "Mercury is the closest planet to the Sun"
                    }
                ],
                "truefalse": [
                    {
                        "id": 1,
                        "statement": "The Earth is flat.",
                        "answer": False,
                        "explanation": "The Earth is approximately spherical"
                    },
                    {
                        "id": 2,
                        "statement": "Water boils at 100°C at sea level.",
                        "answer": True,
                        "explanation": "Standard boiling point of water"
                    }
                ],
                "short": [
                    {
                        "id": 1,
                        "question": "Explain photosynthesis in one sentence.",
                        "sampleAnswer": "Photosynthesis is the process by which plants convert sunlight into energy."
                    }
                ]
            }
        }
        
        response = requests.post(
            f"{BASE_URL}/api/export/quiz-docx",
            json=payload,
            headers={"Content-Type": "application/json"}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        # Verify content type is DOCX
        content_type = response.headers.get('content-type', '')
        assert 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' in content_type, \
            f"Expected DOCX content type, got: {content_type}"
        
        # Verify content disposition header
        content_disp = response.headers.get('content-disposition', '')
        assert 'attachment' in content_disp, f"Expected attachment disposition, got: {content_disp}"
        assert '.docx' in content_disp, f"Expected .docx in filename, got: {content_disp}"
        
        # Verify file is valid DOCX (DOCX is a ZIP file)
        content = response.content
        assert len(content) > 0, "Response content is empty"
        
        # DOCX files start with PK (ZIP signature)
        assert content[:2] == b'PK', "File does not have ZIP/DOCX signature"
        
        # Verify it's a valid ZIP/DOCX
        try:
            with zipfile.ZipFile(io.BytesIO(content)) as zf:
                # DOCX must contain [Content_Types].xml
                assert '[Content_Types].xml' in zf.namelist(), "Missing [Content_Types].xml - not a valid DOCX"
                # DOCX must contain word/document.xml
                assert 'word/document.xml' in zf.namelist(), "Missing word/document.xml - not a valid DOCX"
        except zipfile.BadZipFile:
            pytest.fail("Response is not a valid ZIP/DOCX file")
        
        print(f"✓ Quiz DOCX export successful - {len(content)} bytes")
    
    def test_quiz_docx_export_empty_sections(self):
        """Test quiz DOCX export with empty sections"""
        payload = {
            "title": "Empty Quiz Test",
            "quiz_data": {
                "mcq": [],
                "truefalse": [],
                "short": []
            }
        }
        
        response = requests.post(
            f"{BASE_URL}/api/export/quiz-docx",
            json=payload,
            headers={"Content-Type": "application/json"}
        )
        
        # Should still return 200 with valid DOCX (just empty sections)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        assert response.content[:2] == b'PK', "File does not have ZIP/DOCX signature"
        print("✓ Quiz DOCX export with empty sections successful")
    
    def test_quiz_docx_export_mcq_only(self):
        """Test quiz DOCX export with only MCQ questions"""
        payload = {
            "title": "MCQ Only Quiz",
            "quiz_data": {
                "mcq": [
                    {
                        "id": 1,
                        "question": "Test question?",
                        "options": ["A) Option 1", "B) Option 2"],
                        "correct": "A",
                        "explanation": "Test explanation"
                    }
                ]
            }
        }
        
        response = requests.post(
            f"{BASE_URL}/api/export/quiz-docx",
            json=payload,
            headers={"Content-Type": "application/json"}
        )
        
        assert response.status_code == 200
        assert response.content[:2] == b'PK'
        print("✓ Quiz DOCX export with MCQ only successful")


class TestDataTableXlsxExport:
    """Test /api/export/datatable-xlsx endpoint"""
    
    def test_datatable_xlsx_export_success(self):
        """Test data table XLSX export with valid data"""
        payload = {
            "title": "Test Data Export",
            "table_data": {
                "tables": [
                    {
                        "title": "Sales Data",
                        "headers": ["Product", "Q1", "Q2", "Q3", "Q4"],
                        "rows": [
                            ["Widget A", "100", "150", "200", "250"],
                            ["Widget B", "80", "90", "110", "130"],
                            ["Widget C", "200", "220", "240", "260"]
                        ]
                    },
                    {
                        "title": "Employee Data",
                        "headers": ["Name", "Department", "Role"],
                        "rows": [
                            ["John Doe", "Engineering", "Developer"],
                            ["Jane Smith", "Marketing", "Manager"]
                        ]
                    }
                ],
                "stats": [
                    {"label": "Total Revenue", "value": "$1.2M", "description": "Annual revenue"},
                    {"label": "Growth Rate", "value": "15%", "description": "Year over year"},
                    {"label": "Employees", "value": "50", "description": "Full-time staff"}
                ]
            }
        }
        
        response = requests.post(
            f"{BASE_URL}/api/export/datatable-xlsx",
            json=payload,
            headers={"Content-Type": "application/json"}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        # Verify content type is XLSX
        content_type = response.headers.get('content-type', '')
        assert 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' in content_type, \
            f"Expected XLSX content type, got: {content_type}"
        
        # Verify content disposition header
        content_disp = response.headers.get('content-disposition', '')
        assert 'attachment' in content_disp, f"Expected attachment disposition, got: {content_disp}"
        assert '.xlsx' in content_disp, f"Expected .xlsx in filename, got: {content_disp}"
        
        # Verify file is valid XLSX (XLSX is a ZIP file)
        content = response.content
        assert len(content) > 0, "Response content is empty"
        
        # XLSX files start with PK (ZIP signature)
        assert content[:2] == b'PK', "File does not have ZIP/XLSX signature"
        
        # Verify it's a valid ZIP/XLSX
        try:
            with zipfile.ZipFile(io.BytesIO(content)) as zf:
                # XLSX must contain [Content_Types].xml
                assert '[Content_Types].xml' in zf.namelist(), "Missing [Content_Types].xml - not a valid XLSX"
                # XLSX must contain xl/workbook.xml
                assert 'xl/workbook.xml' in zf.namelist(), "Missing xl/workbook.xml - not a valid XLSX"
        except zipfile.BadZipFile:
            pytest.fail("Response is not a valid ZIP/XLSX file")
        
        print(f"✓ Data Table XLSX export successful - {len(content)} bytes")
    
    def test_datatable_xlsx_export_empty_tables(self):
        """Test data table XLSX export with empty tables"""
        payload = {
            "title": "Empty Data Test",
            "table_data": {
                "tables": [],
                "stats": []
            }
        }
        
        response = requests.post(
            f"{BASE_URL}/api/export/datatable-xlsx",
            json=payload,
            headers={"Content-Type": "application/json"}
        )
        
        # Should still return 200 with valid XLSX (just summary sheet)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        assert response.content[:2] == b'PK', "File does not have ZIP/XLSX signature"
        print("✓ Data Table XLSX export with empty tables successful")
    
    def test_datatable_xlsx_export_stats_only(self):
        """Test data table XLSX export with only stats"""
        payload = {
            "title": "Stats Only Export",
            "table_data": {
                "tables": [],
                "stats": [
                    {"label": "Metric 1", "value": "100", "description": "Test metric"}
                ]
            }
        }
        
        response = requests.post(
            f"{BASE_URL}/api/export/datatable-xlsx",
            json=payload,
            headers={"Content-Type": "application/json"}
        )
        
        assert response.status_code == 200
        assert response.content[:2] == b'PK'
        print("✓ Data Table XLSX export with stats only successful")


class TestGenerateEndpointStructures:
    """Test that /api/generate returns correct data structures for export"""
    
    def test_generate_quiz_returns_correct_structure(self):
        """Verify quiz generation returns mcq, truefalse, short arrays"""
        response = requests.post(
            f"{BASE_URL}/api/generate",
            json={
                "output_type": "quiz",
                "notebook_id": "default",
                "title": "Test Quiz"
            },
            headers={"Content-Type": "application/json"},
            timeout=120
        )
        
        if response.status_code == 400:
            # No sources indexed - skip
            pytest.skip("No indexed sources available for quiz generation")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert 'slides_data' in data, "Missing slides_data in response"
        
        quiz_data = data['slides_data']
        assert isinstance(quiz_data, dict), f"Expected dict, got {type(quiz_data)}"
        assert 'mcq' in quiz_data, "Missing 'mcq' key in quiz_data"
        assert 'truefalse' in quiz_data, "Missing 'truefalse' key in quiz_data"
        assert 'short' in quiz_data, "Missing 'short' key in quiz_data"
        
        print(f"✓ Quiz structure valid: {len(quiz_data.get('mcq', []))} MCQ, {len(quiz_data.get('truefalse', []))} T/F, {len(quiz_data.get('short', []))} Short")
    
    def test_generate_datatable_returns_correct_structure(self):
        """Verify datatable generation returns tables and stats arrays"""
        response = requests.post(
            f"{BASE_URL}/api/generate",
            json={
                "output_type": "datatable",
                "notebook_id": "default",
                "title": "Test Data Table"
            },
            headers={"Content-Type": "application/json"},
            timeout=120
        )
        
        if response.status_code == 400:
            pytest.skip("No indexed sources available for datatable generation")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert 'slides_data' in data, "Missing slides_data in response"
        
        table_data = data['slides_data']
        assert isinstance(table_data, dict), f"Expected dict, got {type(table_data)}"
        assert 'tables' in table_data, "Missing 'tables' key in table_data"
        assert 'stats' in table_data, "Missing 'stats' key in table_data"
        
        print(f"✓ Data Table structure valid: {len(table_data.get('tables', []))} tables, {len(table_data.get('stats', []))} stats")
    
    def test_generate_flashcards_returns_array(self):
        """Verify flashcards generation returns array of card objects"""
        response = requests.post(
            f"{BASE_URL}/api/generate",
            json={
                "output_type": "flashcards",
                "notebook_id": "default",
                "title": "Test Flashcards"
            },
            headers={"Content-Type": "application/json"},
            timeout=120
        )
        
        if response.status_code == 400:
            pytest.skip("No indexed sources available for flashcards generation")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert 'slides_data' in data, "Missing slides_data in response"
        
        cards = data['slides_data']
        assert isinstance(cards, list), f"Expected list, got {type(cards)}"
        
        if len(cards) > 0:
            card = cards[0]
            assert 'question' in card, "Missing 'question' in card"
            assert 'answer' in card, "Missing 'answer' in card"
            assert 'category' in card, "Missing 'category' in card"
            assert 'difficulty' in card, "Missing 'difficulty' in card"
        
        print(f"✓ Flashcards structure valid: {len(cards)} cards")
    
    def test_generate_mindmap_returns_dict(self):
        """Verify mindmap generation returns dict with center and branches"""
        response = requests.post(
            f"{BASE_URL}/api/generate",
            json={
                "output_type": "mindmap",
                "notebook_id": "default",
                "title": "Test Mind Map"
            },
            headers={"Content-Type": "application/json"},
            timeout=120
        )
        
        if response.status_code == 400:
            pytest.skip("No indexed sources available for mindmap generation")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert 'slides_data' in data, "Missing slides_data in response"
        
        mm_data = data['slides_data']
        assert isinstance(mm_data, dict), f"Expected dict, got {type(mm_data)}"
        assert 'center' in mm_data, "Missing 'center' key in mindmap data"
        assert 'branches' in mm_data, "Missing 'branches' key in mindmap data"
        
        print(f"✓ Mind Map structure valid: center='{mm_data.get('center', '')}', {len(mm_data.get('branches', []))} branches")


class TestNoRegression:
    """Test that existing export formats still work"""
    
    def test_slides_pptx_generation_structure(self):
        """Verify slides generation returns array for PPTX export"""
        response = requests.post(
            f"{BASE_URL}/api/generate",
            json={
                "output_type": "slides",
                "notebook_id": "default",
                "title": "Test Slides"
            },
            headers={"Content-Type": "application/json"},
            timeout=120
        )
        
        if response.status_code == 400:
            pytest.skip("No indexed sources available")
        
        assert response.status_code == 200
        data = response.json()
        assert 'slides_data' in data
        assert isinstance(data['slides_data'], list), "Slides should return list"
        print(f"✓ Slides structure valid: {len(data['slides_data'])} slides")
    
    def test_report_generation_structure(self):
        """Verify report generation returns array for visual report"""
        response = requests.post(
            f"{BASE_URL}/api/generate",
            json={
                "output_type": "report",
                "notebook_id": "default",
                "title": "Test Report"
            },
            headers={"Content-Type": "application/json"},
            timeout=120
        )
        
        if response.status_code == 400:
            pytest.skip("No indexed sources available")
        
        assert response.status_code == 200
        data = response.json()
        assert 'slides_data' in data
        assert isinstance(data['slides_data'], list), "Report should return list"
        print(f"✓ Report structure valid: {len(data['slides_data'])} sections")
    
    def test_infographic_generation_structure(self):
        """Verify infographic generation returns array"""
        response = requests.post(
            f"{BASE_URL}/api/generate",
            json={
                "output_type": "infographic",
                "notebook_id": "default",
                "title": "Test Infographic"
            },
            headers={"Content-Type": "application/json"},
            timeout=120
        )
        
        if response.status_code == 400:
            pytest.skip("No indexed sources available")
        
        assert response.status_code == 200
        data = response.json()
        assert 'slides_data' in data
        assert isinstance(data['slides_data'], list), "Infographic should return list"
        print(f"✓ Infographic structure valid: {len(data['slides_data'])} sections")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
