import uvicorn
"""
🎓 AGENTIC AI TUTOR - CORE ORCHESTRATOR SCHEMA
-----------------------------------------------
This microservice acts as the Hybrid Gateway (Switchboard) for the AI Swarm.
Configuration: n8n-First with Python Resilience Fallbacks.

AGENT DEFINITIONS:
1. COORDINATOR (Python):
   - Role: State routing, intent detection, and resilience management.
   - Workflow: Detects query type -> Routes to n8n Webhook -> Fallbacks to Py sub-service on failure.

2. TUTOR AGENT (n8n):
   - Role: Pedagogy and Socratic explanation.
   - Workflow: Receives topic -> Builds diagnostic logic -> Returns Markdown + Practice Question.

3. EVALUATOR AGENT (n8n):
   - Role: Logical analysis and correctness scoring.
   - Workflow: Compares User Answer vs Ground Truth -> Generates constructive feedback.

4. CURATOR AGENT (n8n):
   - Role: Web indexing and resource aggregation.
   - Workflow: Searches GFG/YouTube/Docs for topic-specific mastery materials.

5. MEMORY MANAGER (Python/Supabase):
   - Role: Long-term profile persistence.
   - Workflow: Updates PostgreSQL tables with every interaction outcome.
"""
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Any, Dict, List, Optional
import httpx
import os

app = FastAPI()

class UserRequest(BaseModel):
    user_id: str
    query: str
    context: Dict[str, Any] = {}

# Agent Endpoint Mapping (n8n Webhooks with Python Fallbacks)
N8N_BASE_URL = os.environ.get("N8N_BASE_URL", "http://127.0.0.1:5678/webhook")
USE_N8N = os.environ.get("USE_N8N", "true").lower() == "true"

# Tutor / Teacher
TUTOR_N8N = f"{N8N_BASE_URL}/teacher-agent"
TUTOR_PY = "http://127.0.0.1:8001/run"

# Curator
CURATOR_N8N = f"{N8N_BASE_URL}/curator-agent"
CURATOR_PY = "http://127.0.0.1:8002/run"

# Evaluator
EVALUATOR_N8N = f"{N8N_BASE_URL}/evaluator-agent"
EVALUATOR_PY = "http://127.0.0.1:8003/run"

# Memory Manager (Always Local for Persistence Performance)
MEMORY_URL = "http://127.0.0.1:8004/profile"

async def post_agent(url: str, payload: dict, fallback_url: Optional[str] = None) -> dict:
    async with httpx.AsyncClient() as client:
        try:
            print(f"[Coordinator] 📤 Calling: {url}...")
            resp = await client.post(url, json=payload, timeout=30.0)
            if resp.status_code >= 400:
                print(f"[Coordinator] ⚠️ {url} returned {resp.status_code}")
                if fallback_url:
                    print(f"[Coordinator] 🔄 Falling back to {fallback_url}...")
                    return await post_agent(fallback_url, payload)
                return {"error": f"Agent {url} failed."}
            return resp.json()
        except Exception as e:
            print(f"[Coordinator] 🚫 Failed to connect to {url}: {e}")
            if fallback_url:
                print(f"[Coordinator] 🔄 Falling back to {fallback_url}...")
                return await post_agent(fallback_url, payload)
            return {"error": f"Agent {url} offline."}

async def get_profile(url: str) -> dict:
    async with httpx.AsyncClient() as client:
        try:
            resp = await client.get(url, timeout=30)
            if resp.status_code != 200:
                print(f"Get failed for {url}: {resp.text}")
                raise HTTPException(status_code=502, detail=f"Agent GET failed: {url}")
            return resp.json()
        except Exception as e:
            print(f"Exception calling GET {url}: {e}")
            raise HTTPException(status_code=500, detail=str(e))

@app.get("/status")
async def status():
    status_report = {}
    async with httpx.AsyncClient() as client:
        # Check Python Sub-services (Offline if uvicorn windows are closed)
        for name, url in [("tutor", TUTOR_PY), ("curator", CURATOR_PY), ("evaluator", EVALUATOR_PY), ("memory", MEMORY_URL)]:
            try:
                ping_url = url.replace("/run", "").replace("/profile", "")
                r = await client.get(ping_url, timeout=2)
                status_report[name] = "online" if r.status_code < 500 else "error"
            except:
                status_report[name] = "offline"
        
        # Check n8n connectivity if enabled
        if USE_N8N:
            try:
                # Ping n8n base (e.g. http://127.0.0.1:5678)
                n8n_ping = N8N_BASE_URL.split("/webhook")[0]
                r = await client.get(n8n_ping, timeout=2)
                status_report["n8n_orchestration"] = "online" if r.status_code < 500 else "error"
            except:
                status_report["n8n_orchestration"] = "offline"
                
    return {"status": "ok", "agents": status_report}

@app.post("/api/chat")
async def chat_compat(request: Dict[str, Any]):
    # Compatibility with frontend Socratic component
    # Format: { message: "...", history: [], complexity: 3 }
    try:
        # Instead of static learning routes, leverage the new Groq conversational logic from the Tutor module.
        chat_endpoint = TUTOR_PY.replace("/run", "/chat")
        async with httpx.AsyncClient() as client:
            resp = await client.post(chat_endpoint, json=request, timeout=60.0)
            if resp.status_code >= 400:
                print(f"[Coordinator] ⚠️ Chat proxy failed: {resp.text}")
                return {
                    "response": "### ⚠️ Socratic Neural Core Unavailable\n\nThe LLM agent service could not be reached or returned an error. Please verify the API keys and backend node status.",
                    "thinking_steps": ["Coordinating Agents...", f"Failed to reach {chat_endpoint}"]
                }
            return resp.json()
    except Exception as e:
        print(f"[Coordinator] 🚫 Failed to proxy chat: {e}")
        return {
            "response": "### ⚠️ Socratic Neural Core Failed\n\nA critical routing error occurred.",
            "thinking_steps": ["Coordinating Agents...", str(e)]
        }

@app.post("/run")
async def run(request: UserRequest):
    # Load learner profile
    profile = await get_profile(f"{MEMORY_URL}/{request.user_id}")
    # Simple routing based on request content
    if request.query.lower().startswith("answer:"):
        # Assessment flow
        answer = request.query[len("answer:"):].strip()
        eval_payload = {"question": profile.get("last_question", "Explain Arrays"), "user_answer": answer, "correct_answer": "Reference Data"}
        
        # Call Evaluator (n8n -> Python Fallback)
        evaluation = await post_agent(EVALUATOR_N8N if USE_N8N else EVALUATOR_PY, eval_payload, fallback_url=EVALUATOR_PY if USE_N8N else None)
        
        # Update profile with new mastery
        await post_agent(MEMORY_URL + f"/{request.user_id}", evaluation)
        return {"type": "evaluation", "data": evaluation}
    else:
        # Learning flow – get explanation and resources
        
        # 1. Get Explanation (n8n -> Python Fallback)
        tutor_resp = await post_agent(TUTOR_N8N if USE_N8N else TUTOR_PY, {"topic": request.query, "difficulty": "beginner", "mode": "teach"}, fallback_url=TUTOR_PY if USE_N8N else None)
        
        # 2. Get Curation (n8n -> Python Fallback)
        curator_resp = await post_agent(CURATOR_N8N if USE_N8N else CURATOR_PY, {"topic": request.query}, fallback_url=CURATOR_PY if USE_N8N else None)
        
        return {
            "type": "learning",
            "tutor": {"id": "tutor_agent", "data": tutor_resp},
            "content": {"id": "curator_agent", "data": curator_resp.get("resources", curator_resp)}
        }

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
