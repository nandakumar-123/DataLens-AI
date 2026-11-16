import requests
import json
import sys

# Replace with the actual session_id from the user's logs:
session_id = "82585f26-d744-467d-8556-5dfe43c32a18"
url = f"http://localhost:8000/api/analysis/{session_id}/agent-7/train"

headers = {"Content-Type": "application/json"}
data = {
    "models": ["Random Forest Classifier"] # Guessing a classification model name, or we can look at recommend endpoint output
}

try:
    response = requests.post(url, headers=headers, json=data)
    print(f"Status Code: {response.status_code}")
    print(response.text)
except Exception as e:
    print(str(e))
