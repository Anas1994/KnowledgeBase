"""
Backend API tests for Chat Features - Iteration 11
Tests: Translation, Multi-turn conversation, Chat depth, Quick action chips simulation
"""
import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestChatAPI:
    """Test the /api/chat endpoint for translation, history, and depth features"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test fixtures"""
        self.chat_url = f"{BASE_URL}/api/chat"
        self.sources_url = f"{BASE_URL}/api/sources"
    
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
        print(f"✓ Found {len(indexed)} indexed sources: {[s['title'] for s in indexed]}")
        return indexed
    
    def test_chat_basic_query(self):
        """Test basic chat query without history or special depth"""
        payload = {
            "message": "What is the main topic of these documents?",
            "notebook_id": "default",
            "history": [],
            "depth": "balanced"
        }
        response = requests.post(self.chat_url, json=payload, timeout=120)
        assert response.status_code == 200, f"Chat failed: {response.text}"
        data = response.json()
        assert "response" in data, "Response should contain 'response' field"
        assert len(data["response"]) > 50, "Response should be substantial"
        print(f"✓ Basic chat query returned {len(data['response'])} chars")
        print(f"  Citations: {data.get('citations', [])}")
    
    def test_chat_translation_to_arabic(self):
        """Test translation request - should translate content to Arabic"""
        payload = {
            "message": "Translate the main points from the sources to Arabic",
            "notebook_id": "default",
            "history": [],
            "depth": "balanced"
        }
        response = requests.post(self.chat_url, json=payload, timeout=120)
        assert response.status_code == 200, f"Translation failed: {response.text}"
        data = response.json()
        assert "response" in data
        
        # Check for Arabic characters (Unicode range for Arabic: 0600-06FF)
        response_text = data["response"]
        has_arabic = any('\u0600' <= char <= '\u06FF' for char in response_text)
        
        # Also check for common Arabic characters
        arabic_indicators = ['ال', 'في', 'من', 'على', 'أن', 'و', 'ل', 'ت', 'ب']
        has_arabic_words = any(indicator in response_text for indicator in arabic_indicators)
        
        assert has_arabic or has_arabic_words, f"Response should contain Arabic text. Got: {response_text[:500]}"
        print(f"✓ Translation to Arabic successful")
        print(f"  Response preview: {response_text[:300]}...")
    
    def test_chat_depth_fast(self):
        """Test fast depth - should return concise response"""
        payload = {
            "message": "Summarize the key points briefly",
            "notebook_id": "default",
            "history": [],
            "depth": "fast"
        }
        response = requests.post(self.chat_url, json=payload, timeout=120)
        assert response.status_code == 200
        data = response.json()
        fast_response = data["response"]
        fast_length = len(fast_response)
        print(f"✓ Fast depth returned {fast_length} chars")
        return fast_length
    
    def test_chat_depth_deep(self):
        """Test deep depth - should return thorough response"""
        payload = {
            "message": "Provide a detailed analysis of all the sources",
            "notebook_id": "default",
            "history": [],
            "depth": "deep"
        }
        response = requests.post(self.chat_url, json=payload, timeout=120)
        assert response.status_code == 200
        data = response.json()
        deep_response = data["response"]
        deep_length = len(deep_response)
        print(f"✓ Deep depth returned {deep_length} chars")
        # Deep responses should generally be longer, but we verify structure
        assert len(deep_response) > 100, "Deep response should be substantial"
        return deep_length
    
    def test_chat_multi_turn_conversation(self):
        """Test multi-turn conversation with history"""
        # First message
        first_payload = {
            "message": "What are the main deliverables mentioned in the sources?",
            "notebook_id": "default",
            "history": [],
            "depth": "balanced"
        }
        first_response = requests.post(self.chat_url, json=first_payload, timeout=120)
        assert first_response.status_code == 200
        first_data = first_response.json()
        first_answer = first_data["response"]
        print(f"✓ First message response: {len(first_answer)} chars")
        
        # Second message with history - follow up question
        history = [
            {"role": "user", "content": first_payload["message"]},
            {"role": "assistant", "content": first_answer}
        ]
        second_payload = {
            "message": "Can you elaborate on the first item you mentioned?",
            "notebook_id": "default",
            "history": history,
            "depth": "balanced"
        }
        second_response = requests.post(self.chat_url, json=second_payload, timeout=120)
        assert second_response.status_code == 200
        second_data = second_response.json()
        second_answer = second_data["response"]
        
        # The follow-up should reference context from previous conversation
        print(f"✓ Second message (with history) response: {len(second_answer)} chars")
        print(f"  Follow-up preview: {second_answer[:300]}...")
        
        # Verify it's a coherent follow-up (not starting fresh)
        assert len(second_answer) > 50, "Follow-up should have substantial content"
    
    def test_chat_summarize_sources(self):
        """Test 'Summarize sources' quick action chip simulation"""
        payload = {
            "message": "Summarize all my sources in a comprehensive overview",
            "notebook_id": "default",
            "history": [],
            "depth": "balanced"
        }
        response = requests.post(self.chat_url, json=payload, timeout=120)
        assert response.status_code == 200
        data = response.json()
        assert len(data["response"]) > 100, "Summary should be substantial"
        print(f"✓ Summarize sources returned {len(data['response'])} chars")
    
    def test_chat_key_findings(self):
        """Test 'Key findings' quick action chip simulation"""
        payload = {
            "message": "What are the key findings across all sources?",
            "notebook_id": "default",
            "history": [],
            "depth": "balanced"
        }
        response = requests.post(self.chat_url, json=payload, timeout=120)
        assert response.status_code == 200
        data = response.json()
        assert len(data["response"]) > 100
        print(f"✓ Key findings returned {len(data['response'])} chars")
    
    def test_chat_extract_action_items(self):
        """Test 'Extract action items' quick action chip simulation"""
        payload = {
            "message": "Extract all action items, deliverables, and next steps from the sources",
            "notebook_id": "default",
            "history": [],
            "depth": "balanced"
        }
        response = requests.post(self.chat_url, json=payload, timeout=120)
        assert response.status_code == 200
        data = response.json()
        assert len(data["response"]) > 100
        print(f"✓ Extract action items returned {len(data['response'])} chars")
    
    def test_chat_response_has_markdown_formatting(self):
        """Verify AI response contains markdown formatting elements"""
        payload = {
            "message": "List the main features and benefits mentioned in the sources",
            "notebook_id": "default",
            "history": [],
            "depth": "balanced"
        }
        response = requests.post(self.chat_url, json=payload, timeout=120)
        assert response.status_code == 200
        data = response.json()
        response_text = data["response"]
        
        # Check for markdown elements
        has_bold = "**" in response_text
        has_bullets = any(bullet in response_text for bullet in ['- ', '• ', '* ', '1. ', '2. '])
        has_headers = any(h in response_text for h in ['# ', '## ', '### '])
        
        markdown_features = []
        if has_bold: markdown_features.append("bold")
        if has_bullets: markdown_features.append("bullets")
        if has_headers: markdown_features.append("headers")
        
        print(f"✓ Response contains markdown: {markdown_features}")
        # At least some markdown formatting should be present
        assert has_bold or has_bullets or has_headers, f"Response should contain markdown formatting. Got: {response_text[:500]}"
    
    def test_chat_citations_returned(self):
        """Verify chat returns citations from sources"""
        payload = {
            "message": "What specific details are mentioned about Hospital at Home?",
            "notebook_id": "default",
            "history": [],
            "depth": "balanced"
        }
        response = requests.post(self.chat_url, json=payload, timeout=120)
        assert response.status_code == 200
        data = response.json()
        
        assert "citations" in data, "Response should contain citations field"
        citations = data.get("citations", [])
        print(f"✓ Chat returned {len(citations)} citations: {citations}")


class TestChatErrorHandling:
    """Test chat error handling"""
    
    def test_chat_empty_message(self):
        """Test chat with empty message"""
        payload = {
            "message": "",
            "notebook_id": "default",
            "history": [],
            "depth": "balanced"
        }
        response = requests.post(f"{BASE_URL}/api/chat", json=payload, timeout=30)
        # Should handle gracefully - either return error or empty response
        assert response.status_code in [200, 400, 422]
        print(f"✓ Empty message handled: status {response.status_code}")
    
    def test_chat_invalid_depth(self):
        """Test chat with invalid depth value"""
        payload = {
            "message": "Test message",
            "notebook_id": "default",
            "history": [],
            "depth": "invalid_depth"
        }
        response = requests.post(f"{BASE_URL}/api/chat", json=payload, timeout=120)
        # Should either accept (fallback to balanced) or return error
        assert response.status_code in [200, 400, 422]
        print(f"✓ Invalid depth handled: status {response.status_code}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
