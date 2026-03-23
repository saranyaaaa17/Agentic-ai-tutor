import uvicorn
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Dict, Any, List

app = FastAPI()

class CuratorRequest(BaseModel):
    topic: str
    user_id: str = "default"
    context: Dict[str, Any] = {}

def generate_resources(query: str) -> List[Dict[str, str]]:
    # Simple placeholder – in production this would query a vector DB / web search
    return [
        {"title": f"{query} – Intro Article", "url": "https://example.com/intro"},
        {"title": f"{query} – Video Lecture", "url": "https://example.com/video"},
        {"title": f"{query} – Practice Problems", "url": "https://example.com/practice"},
    ]

@app.post("/run")
async def run(request: CuratorRequest):
    try:
        resources = generate_resources(request.topic)
        return {"type": "curator", "data": resources}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8002)
