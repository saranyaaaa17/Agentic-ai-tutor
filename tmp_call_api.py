
import requests
import json

url = "http://127.0.0.1:8000/api/teach"
payload = {
    "topic": "Recursion",
    "difficulty": "intermediate",
    "mode": "assessment",
    "num_questions": 3
}
headers = {
    "Content-Type": "application/json"
}

print(f"Calling {url}...")
try:
    response = requests.post(url, data=json.dumps(payload), headers=headers)
    print(f"Status Code: {response.status_code}")
    print("Response Body:")
    print(json.dumps(response.json(), indent=2))
except Exception as e:
    print(f"Error: {e}")
