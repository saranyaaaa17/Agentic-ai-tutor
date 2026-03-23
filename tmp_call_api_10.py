
import requests
import json

url = "http://127.0.0.1:8000/api/teach"
payload = {
    "topic": "Recursion",
    "difficulty": "intermediate",
    "mode": "assessment",
    "num_questions": 10
}
headers = {
    "Content-Type": "application/json"
}

print(f"Calling {url} with 10 questions...")
try:
    response = requests.post(url, data=json.dumps(payload), headers=headers)
    print(f"Status Code: {response.status_code}")
    data = response.json()
    print(f"Number of questions: {len(data.get('questions', []))}")
except Exception as e:
    print(f"Error: {e}")
