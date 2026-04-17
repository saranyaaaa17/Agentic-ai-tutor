
import requests
import json

def test_socratic_chat():
    print("Testing Socratic Chat Endpoint...")
    url = "http://localhost:8000/api/chat"
    payload = {
        "message": "hello",
        "history": [],
        "complexity": 3,
        "socratic_mode": False
    }
    try:
        r = requests.post(url, json=payload, timeout=10)
        print(f"Status: {r.status_code}")
        if r.status_code == 200:
            print(f"Response preview: {r.json().get('response', '')[:50]}...")
        else:
            print(f"Response: {r.text}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_socratic_chat()
