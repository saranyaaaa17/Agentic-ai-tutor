
import os
import sys
# Project Root Configuration
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
if BASE_DIR not in sys.path:
    sys.path.append(BASE_DIR)

from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from dotenv import load_dotenv
import time
import httpx
import subprocess
import tempfile
from pathlib import Path

load_dotenv()
env_path = os.path.join(os.path.dirname(__file__), '../.env')
if os.path.exists(env_path):
    load_dotenv(env_path)
# Import our new Agents
# Import Orchestrator
from orchestrator import orchestrator
from agents.evaluator_agent import evaluator_agent # Still needed for type hinting or direct usage if any?
from agents.knowledge_gap_agent import knowledge_gap_agent, diagnostic_agent
from agents.strategy_agent import strategy_agent
from agents.chat_agent import chat_agent

app = FastAPI(title="AI Tutor Backend (Python)", version="1.0.0")

# CORS Middleware (Allow Frontend)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API Endpoint Models
class TeachRequest(BaseModel):
    topic: str
    difficulty: str = "beginner"
    mode: str = "teach"  # 'teach' or 'assessment'
    num_questions: int = 3 # New field
    history: List[dict] = []
    weak_concepts: List[str] = []
    student_profile: Dict[str, Any] = {}

class EvaluatorRequest(BaseModel):
    question: str
    user_answer: str
    correct_answer: str = "" # Optional default to allow backward compat if needed, but better to require
    concepts: List[str] = []
    topic: str
    student_profile: Dict[str, Any] = {}

class GapAnalysisRequest(BaseModel):
    questions: List[dict]
    answers: dict
    topic: str

class DiagnosisRequest(BaseModel):
    question: str
    user_answer: str
    evaluator_output: Dict[str, Any]

class StrategyRequest(BaseModel):
    proficiency_level: str
    weak_concepts: List[str]
    topic: str
    mastery_profile: Dict[str, float] = {} 
    meta_cognition: str = "balanced" # 'overconfident', 'underconfident', 'balanced'
    learning_speed: str = "medium" # 'slow', 'medium', 'fast'
    confidence_score: float = 0.5
    engagement_score: float = 0.8

class ChatRequest(BaseModel):
    message: str
    history: List[dict] = []
    complexity: int = 3
    socratic_mode: bool = False

class CodeExecutionRequest(BaseModel):
    language: str
    code: str
    stdin: str = ""

@app.middleware("http")
async def log_requests(request, call_next):
    with open("backend_logs.txt", "a", encoding="utf-8") as f:
        f.write(f"\n[REQUEST] {time.ctime()} - {request.method} {request.url}\n")
    
    try:
        response = await call_next(request)
        with open("backend_logs.txt", "a", encoding="utf-8") as f:
             f.write(f"[RESPONSE] {time.ctime()} - Status: {response.status_code}\n")
        return response
    except Exception as e:
        with open("backend_logs.txt", "a", encoding="utf-8") as f:
             f.write(f"[ERROR] {time.ctime()} - {str(e)}\n")
        raise e

@app.get("/")
def read_root():
    return {"status": "ok", "message": "AI Tutor Python Backend Running 🚀"}

@app.get("/api/status")
async def get_status():
    n8n_enabled = os.environ.get("USE_N8N", "false").lower() == "true"
    n8n_base_url = os.environ.get("N8N_BASE_URL", "http://127.0.0.1:5678/webhook")
    n8n_status = "disabled"

    if n8n_enabled:
        try:
            n8n_ping_url = n8n_base_url.split("/webhook")[0]
            async with httpx.AsyncClient(timeout=2.0) as client:
                response = await client.get(n8n_ping_url)
                n8n_status = "online" if response.status_code < 500 else "error"
        except Exception:
            n8n_status = "offline"

    return {
        "status": "ok",
        "agents": [
            {
                "id": "teacher",
                "label": "Teacher Agent",
                "status": "online",
                "role": "Generates concepts, quizzes, and coding prompts",
            },
            {
                "id": "student_model",
                "label": "Student Agent",
                "status": "online",
                "role": "Learner profile memory and personalization state",
            },
            {
                "id": "evaluator",
                "label": "Evaluator Agent",
                "status": "online",
                "role": "Checks correctness, feedback, and profile updates",
            },
            {
                "id": "knowledge_gap",
                "label": "Knowledge Gap Agent",
                "status": "online",
                "role": "Finds weak concepts and root-cause patterns",
            },
            {
                "id": "strategy",
                "label": "Strategy Agent",
                "status": "online",
                "role": "Builds roadmap, resources, and remediation path",
            },
        ],
        "orchestration": {
            "engine": "TutorOrchestrator",
            "n8n_enabled": n8n_enabled,
            "n8n_status": n8n_status,
            "workflow_steps": [
                {"label": "Teacher generates content", "agent": "Teacher Agent"},
                {"label": "Student profile is updated", "agent": "Student Agent"},
                {"label": "Evaluator scores the response", "agent": "Evaluator Agent"},
                {"label": "Knowledge gaps are diagnosed", "agent": "Knowledge Gap Agent"},
                {"label": "Roadmap and remediation are created", "agent": "Strategy Agent"},
            ],
        },
    }

@app.post("/api/teach")
async def teach_endpoint(request: TeachRequest):
    try:
        print(f"[API] 📞 /api/teach called with topic: {request.topic}, mode: {request.mode}")
        
        # Call Orchestrator Logic
        response = await orchestrator.process_teach_request(
            topic=request.topic,
            student_profile=request.student_profile,
            difficulty=request.difficulty,
            mode=request.mode,
            num_questions=request.num_questions
        )
        
        with open("backend_logs.txt", "a", encoding="utf-8") as f:
            q_count = len(response.get('questions', [])) if isinstance(response, dict) else 0
            f.write(f"[LOG] Generated {q_count} questions for {request.topic} (mode: {request.mode})\n")
        
        return response

    except Exception as e:
        import traceback
        error_msg = f"[API Error] /api/teach: {str(e)}\n{traceback.format_exc()}"
        print(f"[API] ❌ Error in /api/teach: {str(e)}")
        with open("backend_logs.txt", "a", encoding="utf-8") as f:
             f.write(f"\n[EXCEPTION] {time.ctime()} - {error_msg}\n")
        raise HTTPException(status_code=500, detail=str(e))

class LearningCycleRequest(BaseModel):
    question: str
    user_answer: str
    correct_answer: str = ""
    concepts: List[str] = []
    topic: str
    student_profile: Dict[str, Any] = {}

# ...

@app.post("/api/evaluate")
async def evaluate_endpoint(request: EvaluatorRequest, background_tasks: BackgroundTasks):
    try:
        print(f"[API] 📞 /api/evaluate called for question: {request.question[:20]}...")
        
        # Call Orchestrator Logic (using new unified method)
        unified_response = await orchestrator.run_full_learning_cycle(
            question=request.question,
            user_answer=request.user_answer,
            topic=request.topic,
            correct_answer=request.correct_answer,
            concepts=request.concepts,
            learner_profile=request.student_profile,
            background_tasks=background_tasks
        )
        
        return unified_response

    except Exception as e:
        print(f"[API] ❌ Error in /api/evaluate: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/learning-cycle")
async def learning_cycle_endpoint(request: LearningCycleRequest, background_tasks: BackgroundTasks):
    """
    Dedicated endpoint for the full orchestrator learning cycle.
    Returns: evaluation, weak_concepts, strategy, updated_profile.
    """
    try:
        print(f"[API] 🔄 /api/learning-cycle called for topic: {request.topic}")
        
        unified_response = await orchestrator.run_full_learning_cycle(
            question=request.question,
            user_answer=request.user_answer,
            topic=request.topic,
            correct_answer=request.correct_answer,
            concepts=request.concepts,
            learner_profile=request.student_profile,
            background_tasks=background_tasks
        )
        
        return unified_response

    except Exception as e:
        print(f"[API] ❌ Error in /api/learning-cycle: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/gap-analysis")
async def gap_analysis_endpoint(request: GapAnalysisRequest):
    try:
        print(f"[API] 📞 /api/gap-analysis called for topic: {request.topic}")
        print(f"[API] 📊 Analyzing {len(request.questions)} questions with {len(request.answers)} answers")
        
        # Call Orchestrator Logic
        analysis = await orchestrator.run_gap_analysis_session(
            questions=request.questions,
            answers=request.answers,
            topic=request.topic
        )
        
        # Validate response structure
        if not analysis:
            raise ValueError("Orchestrator returned empty analysis")
        
        if "analysis" not in analysis:
            print(f"[API] ⚠️ Warning: Missing 'analysis' key in response")
            analysis = {"analysis": analysis, "strategy": {}}
        
        print(f"[API] ✅ Gap analysis complete. Proficiency: {analysis.get('knowledge_gap', {}).get('proficiency_level', 'unknown')}")
        print(f"[API] 📊 Weak concepts: {analysis.get('knowledge_gap', {}).get('weak_concepts', [])}")
        print(f"[API] 🛤️ Strategy generated: {bool(analysis.get('strategy'))}")
        
        return analysis

    except Exception as e:
        import traceback
        tb = traceback.format_exc()
        print(f"[API] ❌ Error in /api/gap-analysis: {tb}")
        
        # Return structured error instead of raising to prevent frontend crash
        return {
            "analysis": {
                "proficiency_level": "Intermediate",
                "gap_analysis": f"Analysis service encountered an error: {str(e)}. Your results have been saved.",
                "weak_concepts": [],
                "strong_concepts": [],
                "recommended_focus": "Review your incorrect answers",
                "mastery_profile": {},
                "error": True
            },
            "strategy": None,
            "error_details": {
                "error_type": type(e).__name__,
                "message": str(e),
                "traceback": tb
            }
        }

@app.post("/api/diagnose-mistake")
async def diagnose_mistake_endpoint(request: DiagnosisRequest):
    try:
        print(f"[API] 📞 /api/diagnose-mistake called")
        
        # Call Diagnostic Agent Logic
        diagnosis = await diagnostic_agent(
            question=request.question,
            user_answer=request.user_answer,
            evaluator_output=request.evaluator_output
        )
        
        return diagnosis

    except Exception as e:
        print(f"[API] ❌ Error in /api/diagnose-mistake: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/strategy")
async def strategy_endpoint(request: StrategyRequest):
    try:
        print(f"[API] 📞 /api/strategy called for topic: {request.topic}")
        
        # Call Strategy Agent Logic
        strategy = await strategy_agent(
            proficiency_level=request.proficiency_level,
            weak_concepts=request.weak_concepts,
            topic=request.topic,
            mastery_profile=request.mastery_profile,
            meta_cognition=request.meta_cognition,
            learning_speed=request.learning_speed,
            confidence_score=request.confidence_score,
            engagement_score=request.engagement_score
        )
        
        return strategy

    except Exception as e:
        import traceback
        tb = traceback.format_exc()
        print(f"[API] ❌ Error in /api/strategy: {tb}")
        return {
            "error_type": type(e).__name__,
            "message": str(e),
            "traceback": tb
        }

@app.post("/api/chat")
async def chat_endpoint(request: ChatRequest):
    try:
        print(f"[API] 📞 /api/chat called with complexity: {request.complexity}")
        result = await chat_agent(
            message=request.message,
            history=request.history,
            complexity=request.complexity,
            socratic_mode=request.socratic_mode
        )
        return result
    except Exception as e:
        print(f"[API] ❌ Error in /api/chat: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/code/execute")
async def execute_code_endpoint(request: CodeExecutionRequest):
    try:
        language = request.language.lower().strip()
        runtime_map = {
            "python": {"command": [sys.executable], "suffix": ".py"},
            "javascript": {"command": ["C:\\nvm4w\\nodejs\\node.exe"], "suffix": ".js"},
        }

        if language not in runtime_map:
            raise HTTPException(
                status_code=400,
                detail="Unsupported language in this environment. Use Python or JavaScript.",
            )

        runtime = runtime_map[language]

        with tempfile.TemporaryDirectory() as temp_dir:
            file_path = Path(temp_dir) / f"submission{runtime['suffix']}"
            file_path.write_text(request.code, encoding="utf-8")

            completed = subprocess.run(
                [*runtime["command"], str(file_path)],
                input=request.stdin or "",
                capture_output=True,
                text=True,
                timeout=10,
                cwd=temp_dir,
            )

        return {
            "output": completed.stdout,
            "error": completed.stderr,
            "code": completed.returncode,
        }
    except subprocess.TimeoutExpired:
        raise HTTPException(status_code=408, detail="Execution timed out after 10 seconds.")
    except FileNotFoundError as e:
        raise HTTPException(status_code=503, detail=f"Runtime not available: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    # Make sure to run on PORT 3001 to match frontend config!
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
