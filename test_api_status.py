
import requests
import json

def test_api():
    print("Testing Backend API Status...")
    try:
        r = requests.get("http://localhost:8000/api/status", timeout=5)
        print(f"Status: {r.status_code}")
        print(f"Response: {r.json()}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_api()
