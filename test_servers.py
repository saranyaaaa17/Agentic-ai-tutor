import sys
import httpx
import asyncio

async def test_servers():
    print("Testing Backend...")
    try:
        async with httpx.AsyncClient() as client:
            res = await client.get('http://localhost:8000/docs')
            print(f"Backend running, status: {res.status_code}")
    except Exception as e:
        print("Backend is NOT running.", str(e))
        
    print("\nTesting Frontend...")
    try:
        async with httpx.AsyncClient() as client:
            res = await client.get('http://localhost:5173')
            print(f"Frontend running, status: {res.status_code}")
    except Exception as e:
        print("Frontend is NOT running.", str(e))

asyncio.run(test_servers())
