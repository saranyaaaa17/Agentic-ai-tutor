import uvicorn
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Dict, Any

app = FastAPI()

class EvaluationRequest(BaseModel):
    user_id: str
    question: str
    answer: str
    context: Dict[str, Any] = {}

def evaluate_answer(question: str, answer: str) -> Dict[str, Any]:
    # Placeholder implementation – in production call Gemini/LLM to score
    is_correct = "correct" in answer.lower()
    score = 1.0 if is_correct else 0.0
    feedback = "Excellent work!" if is_correct else "Not quite, try again bit more specifically."
    
    return {
        "score": score,
        "feedback": feedback,
        "is_correct": is_correct,
        "updated_mastery": {"concept": score}
    }

@app.post("/run")
async def run(request: EvaluationRequest):
    try:
        evaluation = evaluate_answer(request.question, request.answer)
        return {"type": "evaluation", "data": evaluation}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8003)
