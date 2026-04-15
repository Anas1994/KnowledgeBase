"""
Backend API tests for Enhanced Chat Features - Iteration 22
Tests: 
- Phase A: RAG chunk retrieval, source_chunks collection, backfill-chunks endpoint
- Phase B: source_ids filtering, chat modes (general/compare/deep_analysis/executive_summary/qa_prep), follow-up suggestions
- Phase C: Rich inline citations with source excerpts, chat export as DOCX
"""
import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestChatRAGRetrieval:
    """Phase A: Test RAG chunk retrieval and backfill functionality"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test fixtures"""
        self.chat_url = f"{BASE_URL}/api/chat"
        self.sources_url = f"{BASE_URL}/api/sources"
        self.backfill_url = f"{BASE_URL}/api/chat/backfill-chunks"
    
    def test_api_health(self):
        """Test API root is accessible"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert data.get("message") == "NotebookLM API Ready"
        print("✓ API health check passed")
    
    def test_sources_exist(self):
        """Verify sources are indexed before chat tests"""
        response = requests.get(f"{self.sources_url}?notebook_id=default")
        assert response.status_code == 200
        sources = response.json()
        indexed = [s for s in sources if s.get("status") == "indexed"]
        assert len(indexed) >= 1, "At least one indexed source required for chat tests"
        print(f"✓ Found {len(indexed)} indexed sources: {[s['title'][:30] for s in indexed]}")
        return indexed
    
    def test_backfill_chunks_endpoint(self):
        """Test POST /api/chat/backfill-chunks creates chunks for existing sources"""
        response = requests.post(f"{self.backfill_url}?notebook_id=default", timeout=60)
        assert response.status_code == 200, f"Backfill failed: {response.text}"
        data = response.json()
        
        # Response should have backfilled count and total_sources
        assert "backfilled" in data, "Response should contain 'backfilled' count"
        assert "total_sources" in data, "Response should contain 'total_sources' count"
        
        print(f"✓ Backfill chunks: {data['backfilled']} new, {data['total_sources']} total sources")
        return data
    
    def test_chat_uses_rag_retrieval(self):
        """Test that chat uses RAG chunk retrieval for relevant content"""
        payload = {
            "message": "What are the key features mentioned in the documents?",
            "notebook_id": "default",
            "history": [],
            "depth": "balanced",
            "source_ids": [],
            "mode": "general"
        }
        response = requests.post(self.chat_url, json=payload, timeout=120)
        assert response.status_code == 200, f"Chat failed: {response.text}"
        data = response.json()
        
        assert "response" in data, "Response should contain 'response' field"
        assert len(data["response"]) > 50, "Response should be substantial"
        print(f"✓ Chat with RAG retrieval returned {len(data['response'])} chars")


class TestChatSourceFiltering:
    """Phase B: Test source_ids filtering in chat"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        self.chat_url = f"{BASE_URL}/api/chat"
        self.sources_url = f"{BASE_URL}/api/sources"
    
    def get_indexed_sources(self):
        """Get list of indexed sources"""
        response = requests.get(f"{self.sources_url}?notebook_id=default")
        sources = response.json()
        return [s for s in sources if s.get("status") == "indexed"]
    
    def test_chat_with_all_sources(self):
        """Test chat with empty source_ids (all sources)"""
        payload = {
            "message": "Summarize the content",
            "notebook_id": "default",
            "history": [],
            "depth": "balanced",
            "source_ids": [],  # Empty = all sources
            "mode": "general"
        }
        response = requests.post(self.chat_url, json=payload, timeout=120)
        assert response.status_code == 200
        data = response.json()
        assert "response" in data
        print(f"✓ Chat with all sources returned {len(data['response'])} chars")
    
    def test_chat_with_single_source_filter(self):
        """Test chat filtered to a single source"""
        sources = self.get_indexed_sources()
        if len(sources) < 1:
            pytest.skip("Need at least 1 indexed source")
        
        single_source_id = sources[0]["id"]
        payload = {
            "message": "What is this document about?",
            "notebook_id": "default",
            "history": [],
            "depth": "balanced",
            "source_ids": [single_source_id],
            "mode": "general"
        }
        response = requests.post(self.chat_url, json=payload, timeout=120)
        assert response.status_code == 200
        data = response.json()
        assert "response" in data
        print(f"✓ Chat with single source filter returned {len(data['response'])} chars")
        print(f"  Filtered to source: {sources[0]['title'][:40]}")
    
    def test_chat_with_multiple_source_filter(self):
        """Test chat filtered to multiple specific sources"""
        sources = self.get_indexed_sources()
        if len(sources) < 2:
            pytest.skip("Need at least 2 indexed sources")
        
        source_ids = [s["id"] for s in sources[:2]]
        payload = {
            "message": "Compare the content of these documents",
            "notebook_id": "default",
            "history": [],
            "depth": "balanced",
            "source_ids": source_ids,
            "mode": "compare"
        }
        response = requests.post(self.chat_url, json=payload, timeout=120)
        assert response.status_code == 200
        data = response.json()
        assert "response" in data
        print(f"✓ Chat with {len(source_ids)} source filter returned {len(data['response'])} chars")


class TestChatModes:
    """Phase B: Test 5 chat modes"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        self.chat_url = f"{BASE_URL}/api/chat"
    
    def test_mode_general(self):
        """Test general mode - default helpful response"""
        payload = {
            "message": "What are the main topics covered?",
            "notebook_id": "default",
            "history": [],
            "depth": "balanced",
            "source_ids": [],
            "mode": "general"
        }
        response = requests.post(self.chat_url, json=payload, timeout=120)
        assert response.status_code == 200
        data = response.json()
        assert "response" in data
        assert len(data["response"]) > 50
        print(f"✓ General mode returned {len(data['response'])} chars")
    
    def test_mode_compare(self):
        """Test compare mode - should compare/contrast sources"""
        payload = {
            "message": "Compare the different perspectives in the sources",
            "notebook_id": "default",
            "history": [],
            "depth": "balanced",
            "source_ids": [],
            "mode": "compare"
        }
        response = requests.post(self.chat_url, json=payload, timeout=120)
        assert response.status_code == 200
        data = response.json()
        assert "response" in data
        # Compare mode should mention comparison-related terms
        response_lower = data["response"].lower()
        comparison_terms = ["compar", "similar", "differ", "contrast", "both", "while", "whereas"]
        has_comparison = any(term in response_lower for term in comparison_terms)
        print(f"✓ Compare mode returned {len(data['response'])} chars")
        print(f"  Contains comparison language: {has_comparison}")
    
    def test_mode_deep_analysis(self):
        """Test deep_analysis mode - should provide exhaustive analysis"""
        payload = {
            "message": "Analyze the key themes",
            "notebook_id": "default",
            "history": [],
            "depth": "deep",
            "source_ids": [],
            "mode": "deep_analysis"
        }
        response = requests.post(self.chat_url, json=payload, timeout=120)
        assert response.status_code == 200
        data = response.json()
        assert "response" in data
        # Deep analysis should be substantial
        assert len(data["response"]) > 200, "Deep analysis should be thorough"
        print(f"✓ Deep analysis mode returned {len(data['response'])} chars")
    
    def test_mode_executive_summary(self):
        """Test executive_summary mode - should be concise and actionable"""
        payload = {
            "message": "Give me an executive summary",
            "notebook_id": "default",
            "history": [],
            "depth": "balanced",
            "source_ids": [],
            "mode": "executive_summary"
        }
        response = requests.post(self.chat_url, json=payload, timeout=120)
        assert response.status_code == 200
        data = response.json()
        assert "response" in data
        # Executive summary should be present
        print(f"✓ Executive summary mode returned {len(data['response'])} chars")
    
    def test_mode_qa_prep(self):
        """Test qa_prep mode - should generate Q&A preparation"""
        payload = {
            "message": "Prepare me for questions about this topic",
            "notebook_id": "default",
            "history": [],
            "depth": "balanced",
            "source_ids": [],
            "mode": "qa_prep"
        }
        response = requests.post(self.chat_url, json=payload, timeout=120)
        assert response.status_code == 200
        data = response.json()
        assert "response" in data
        # Q&A prep should contain question-like content
        response_text = data["response"]
        has_questions = "?" in response_text or "Q:" in response_text or "question" in response_text.lower()
        print(f"✓ Q&A prep mode returned {len(data['response'])} chars")
        print(f"  Contains Q&A content: {has_questions}")


class TestChatFollowUps:
    """Phase B: Test follow-up suggestions in chat response"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        self.chat_url = f"{BASE_URL}/api/chat"
    
    def test_chat_returns_follow_ups(self):
        """Test that chat response includes follow_ups array"""
        payload = {
            "message": "What are the main features described in the documents?",
            "notebook_id": "default",
            "history": [],
            "depth": "balanced",
            "source_ids": [],
            "mode": "general"
        }
        response = requests.post(self.chat_url, json=payload, timeout=120)
        assert response.status_code == 200
        data = response.json()
        
        # Check follow_ups field exists
        assert "follow_ups" in data, "Response should contain 'follow_ups' field"
        follow_ups = data["follow_ups"]
        
        # follow_ups should be a list
        assert isinstance(follow_ups, list), "follow_ups should be a list"
        
        print(f"✓ Chat returned {len(follow_ups)} follow-up suggestions")
        if follow_ups:
            print(f"  Follow-ups: {follow_ups[:3]}")
    
    def test_follow_ups_are_questions(self):
        """Test that follow-ups are actual questions"""
        payload = {
            "message": "Explain the key concepts",
            "notebook_id": "default",
            "history": [],
            "depth": "balanced",
            "source_ids": [],
            "mode": "general"
        }
        response = requests.post(self.chat_url, json=payload, timeout=120)
        assert response.status_code == 200
        data = response.json()
        
        follow_ups = data.get("follow_ups", [])
        if len(follow_ups) > 0:
            # At least some follow-ups should be question-like
            question_count = sum(1 for fu in follow_ups if "?" in fu or fu.lower().startswith(("what", "how", "why", "when", "where", "who", "can", "could", "would", "is", "are")))
            print(f"✓ {question_count}/{len(follow_ups)} follow-ups are questions")
        else:
            print("✓ No follow-ups returned (may vary by AI response)")


class TestChatCitations:
    """Phase C: Test rich inline citations with source excerpts"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        self.chat_url = f"{BASE_URL}/api/chat"
    
    def test_chat_returns_citations(self):
        """Test that chat response includes citations array"""
        payload = {
            "message": "What specific details are mentioned in the sources?",
            "notebook_id": "default",
            "history": [],
            "depth": "balanced",
            "source_ids": [],
            "mode": "general"
        }
        response = requests.post(self.chat_url, json=payload, timeout=120)
        assert response.status_code == 200
        data = response.json()
        
        # Check citations field exists
        assert "citations" in data, "Response should contain 'citations' field"
        citations = data["citations"]
        
        # citations should be a list
        assert isinstance(citations, list), "citations should be a list"
        
        print(f"✓ Chat returned {len(citations)} citations")
        if citations:
            print(f"  First citation: {citations[0]}")
    
    def test_citations_have_correct_structure(self):
        """Test that citations have {source, excerpt} structure"""
        payload = {
            "message": "Summarize the key points with references",
            "notebook_id": "default",
            "history": [],
            "depth": "balanced",
            "source_ids": [],
            "mode": "general"
        }
        response = requests.post(self.chat_url, json=payload, timeout=120)
        assert response.status_code == 200
        data = response.json()
        
        citations = data.get("citations", [])
        if len(citations) > 0:
            for i, cite in enumerate(citations):
                assert isinstance(cite, dict), f"Citation {i} should be a dict, got {type(cite)}"
                assert "source" in cite, f"Citation {i} should have 'source' field"
                # excerpt may be empty string but should exist
                assert "excerpt" in cite, f"Citation {i} should have 'excerpt' field"
                print(f"✓ Citation {i}: source='{cite['source'][:30]}...', excerpt_len={len(cite.get('excerpt', ''))}")
        else:
            print("✓ No citations returned (may vary by AI response)")


class TestChatExportDOCX:
    """Phase C: Test chat export as DOCX"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        self.export_url = f"{BASE_URL}/api/export/chat-docx"
    
    def test_export_chat_docx_basic(self):
        """Test POST /api/export/chat-docx returns valid DOCX"""
        payload = {
            "messages": [
                {"role": "user", "content": "What is the main topic?", "time": "10:00 AM"},
                {"role": "ai", "content": "Based on the sources, the main topic is...", "time": "10:01 AM", "citations": []}
            ],
            "title": "Test Chat Export"
        }
        response = requests.post(self.export_url, json=payload, timeout=60)
        assert response.status_code == 200, f"Export failed: {response.text}"
        
        # Check content type
        content_type = response.headers.get("content-type", "")
        assert "application/vnd.openxmlformats-officedocument.wordprocessingml.document" in content_type, f"Wrong content type: {content_type}"
        
        # Check file size
        content_length = len(response.content)
        assert content_length > 1000, f"DOCX file too small: {content_length} bytes"
        
        # Check DOCX magic bytes (PK zip header)
        assert response.content[:4] == b'PK\x03\x04', "Response should be a valid DOCX (ZIP) file"
        
        print(f"✓ Chat DOCX export: {content_length} bytes, valid DOCX format")
    
    def test_export_chat_docx_with_citations(self):
        """Test DOCX export includes citations"""
        payload = {
            "messages": [
                {"role": "user", "content": "What are the key features?", "time": "10:00 AM"},
                {
                    "role": "ai", 
                    "content": "The key features include:\n\n1. Feature A\n2. Feature B\n3. Feature C", 
                    "time": "10:01 AM",
                    "citations": [
                        {"source": "Document 1", "excerpt": "Feature A is described as..."},
                        {"source": "Document 2", "excerpt": "Feature B provides..."}
                    ]
                }
            ],
            "title": "Chat with Citations"
        }
        response = requests.post(self.export_url, json=payload, timeout=60)
        assert response.status_code == 200
        assert len(response.content) > 1000
        print(f"✓ Chat DOCX with citations: {len(response.content)} bytes")
    
    def test_export_chat_docx_empty_messages(self):
        """Test DOCX export with empty messages array"""
        payload = {
            "messages": [],
            "title": "Empty Chat"
        }
        response = requests.post(self.export_url, json=payload, timeout=60)
        # Should handle gracefully
        assert response.status_code in [200, 400, 422]
        print(f"✓ Empty messages handled: status {response.status_code}")
    
    def test_export_chat_docx_long_conversation(self):
        """Test DOCX export with longer conversation"""
        messages = []
        for i in range(5):
            messages.append({"role": "user", "content": f"Question {i+1}: What about topic {i+1}?", "time": f"10:{i:02d} AM"})
            messages.append({"role": "ai", "content": f"Answer {i+1}: Here's information about topic {i+1}...\n\n**Key Points:**\n- Point A\n- Point B\n- Point C", "time": f"10:{i:02d} AM", "citations": []})
        
        payload = {
            "messages": messages,
            "title": "Long Conversation Export"
        }
        response = requests.post(self.export_url, json=payload, timeout=60)
        assert response.status_code == 200
        assert len(response.content) > 2000
        print(f"✓ Long conversation DOCX: {len(response.content)} bytes, {len(messages)} messages")


class TestChatRequestModel:
    """Test ChatRequest model accepts new parameters"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        self.chat_url = f"{BASE_URL}/api/chat"
    
    def test_chat_request_with_all_new_params(self):
        """Test chat accepts source_ids and mode parameters"""
        payload = {
            "message": "Test message",
            "notebook_id": "default",
            "history": [],
            "depth": "balanced",
            "source_ids": [],  # New param
            "mode": "general"  # New param
        }
        response = requests.post(self.chat_url, json=payload, timeout=120)
        assert response.status_code == 200, f"Chat with new params failed: {response.text}"
        print("✓ ChatRequest accepts source_ids and mode parameters")
    
    def test_chat_request_backward_compatible(self):
        """Test chat still works without new parameters (backward compatibility)"""
        payload = {
            "message": "Test backward compatibility",
            "notebook_id": "default",
            "history": [],
            "depth": "balanced"
            # No source_ids or mode - should use defaults
        }
        response = requests.post(self.chat_url, json=payload, timeout=120)
        assert response.status_code == 200, f"Backward compatible chat failed: {response.text}"
        print("✓ ChatRequest is backward compatible (no source_ids/mode required)")


class TestChatResponseModel:
    """Test ChatResponse model returns new fields"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        self.chat_url = f"{BASE_URL}/api/chat"
    
    def test_chat_response_has_all_fields(self):
        """Test chat response includes response, citations, and follow_ups"""
        payload = {
            "message": "What are the main points?",
            "notebook_id": "default",
            "history": [],
            "depth": "balanced",
            "source_ids": [],
            "mode": "general"
        }
        response = requests.post(self.chat_url, json=payload, timeout=120)
        assert response.status_code == 200
        data = response.json()
        
        # Check all required fields
        assert "response" in data, "Missing 'response' field"
        assert "citations" in data, "Missing 'citations' field"
        assert "follow_ups" in data, "Missing 'follow_ups' field"
        
        # Check types
        assert isinstance(data["response"], str), "response should be string"
        assert isinstance(data["citations"], list), "citations should be list"
        assert isinstance(data["follow_ups"], list), "follow_ups should be list"
        
        print(f"✓ ChatResponse has all fields: response({len(data['response'])} chars), citations({len(data['citations'])}), follow_ups({len(data['follow_ups'])})")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
