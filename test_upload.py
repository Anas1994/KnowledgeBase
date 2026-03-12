import requests
import tempfile
import os

# Create test file
with tempfile.NamedTemporaryFile(mode='w', suffix='.txt', delete=False) as f:
    f.write("Test content for API")
    temp_path = f.name

try:
    url = "https://localized-theme-lab.preview.emergentagent.com/api/sources/upload"
    
    with open(temp_path, 'rb') as file:
        files = {'file': ('test.txt', file, 'text/plain')}
        data = {'notebook_id': 'default'}
        
        print(f"Testing upload to: {url}")
        response = requests.post(url, files=files, data=data)
        
        print(f"Status: {response.status_code}")
        print(f"Response: {response.text}")
        
finally:
    os.unlink(temp_path)
