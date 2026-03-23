import uvicorn
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from typing import Dict, Any
import json
import os

app = FastAPI()

# Simple JSON file store (replace with ChromaDB later)
DATA_DIR = "memory_store"
os.makedirs(DATA_DIR, exist_ok=True)

class Profile(BaseModel):
    user_id: str
    mastery: Dict[str, float] = Field(default_factory=dict)
    last_question: str = ""
    # Additional fields can be added as needed

def _profile_path(user_id: str) -> str:
    return os.path.join(DATA_DIR, f"{user_id}.json")

@app.get("/profile/{user_id}")
async def get_profile(user_id: str):
    path = _profile_path(user_id)
    if not os.path.exists(path):
        return Profile(user_id=user_id).dict()
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)

@app.post("/profile/{user_id}")
async def update_profile(user_id: str, payload: Dict[str, Any]):
    path = _profile_path(user_id)
    profile = {}
    if os.path.exists(path):
        with open(path, "r", encoding="utf-8") as f:
            profile = json.load(f)
    profile.update(payload)
    profile.setdefault("user_id", user_id)
    profile.setdefault("mastery", {})
    profile.setdefault("last_question", "")
    with open(path, "w", encoding="utf-8") as f:
        json.dump(profile, f, indent=2)
    return {"status": "ok", "profile": profile}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8004)
