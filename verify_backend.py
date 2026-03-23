import urllib.request
import json

url = "http://127.0.0.1:8000/api/teach"
payload = {
    "topic": "Python Loops",
    "difficulty": "beginner",
    "mode": "assessment",
    "num_questions": 3
}

req = urllib.request.Request(url, data=json.dumps(payload).encode(), headers={'Content-Type': 'application/json'}, method='POST')

try:
    with urllib.request.urlopen(req) as resp:
        print(f"Status: {resp.status}")
        print("Backend generated questions successfully!")
        print(resp.read().decode())
except Exception as e:
    print(f"Error during question generation: {e}")
