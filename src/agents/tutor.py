import uvicorn
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Any, Dict, List, Optional
import httpx

app = FastAPI()

class TutorRequest(BaseModel):
    topic: str
    difficulty: str = "beginner"
    mode: str = "teach"
    user_id: Optional[str] = "default"
    context: Dict[str, Any] = {}

from groq import AsyncGroq
import os
import json
from dotenv import load_dotenv

load_dotenv()

SYSTEM_PROMPT = """
You are "Socratic" - the supreme Technical Coach of the Agentic AI Tutor.
Act just like an advanced AI such as ChatGPT or Claude. You can analyze images, generate code, create diagrams, and solve complex logic.
- If asked to GENERATE AN IMAGE, you must return a markdown image using this EXACT format: `![Description](https://image.pollinations.ai/prompt/detailed%20URL%20encoded%20prompt?width=800&height=400&nologo=true)`
- For flowcharts or system designs, generate `mermaid` code blocks.
- MERMAID SYNTAX RULE: Never use `-->|Text|>` or `|`. The ONLY valid syntax for labeled arrows is `-->|Text| Node` or `--> Node`. Using invalid combinations like `|>` causes the UI to crash.
- Provide detailed, step-by-step thinking steps before answering.
Always output valid JSON: {"thinking_steps": ["step 1", "step 2"], "response": "markdown content"}
"""

class ChatRequest(BaseModel):
    message: str
    history: List[Dict[str, str]] = []
    complexity: int = 3

# Fallback basic explanation
def generate_explanation(query: str) -> Dict[str, str]:
    return {
        "explanation": f"Here is a beginner-friendly explanation for: {query}",
        "example": "Example problem and solution",
        "next_step": "Try solving a related exercise"
    }

@app.post("/chat")
async def chat(request: ChatRequest):
    try:
        client = AsyncGroq(api_key=os.environ.get("GROQ_API_KEY"))
        messages = [{"role": "system", "content": SYSTEM_PROMPT}]
        
        # Clean history
        for msg in request.history:
            if msg.get("role") and msg.get("content"):
                messages.append({"role": msg.get("role"), "content": msg.get("content")})
                
        # Vision vs Text routing
        model_name = "llama-3.3-70b-versatile"
        
        if "data:image/" in request.message:
            model_name = "llama-3.2-90b-vision-preview"
            # Extract base64
            parts = request.message.split("data:image/")
            text_part = parts[0]
            img_part = "data:image/" + parts[1].split(' ')[0].strip() # isolate the b64
            
            prompt_content = [
                {"type": "text", "text": f"[Target Complexity: Level {request.complexity}/5]\n{text_part}"},
                {"type": "image_url", "image_url": {"url": img_part}}
            ]
            messages.append({"role": "user", "content": prompt_content})
        else:
            prompt = f"[Target Complexity: Level {request.complexity}/5]\nUser Question: {request.message}"
            messages.append({"role": "user", "content": prompt})
        
        completion = await client.chat.completions.create(
            model=model_name,
            messages=messages,
            temperature=0.8,
            response_format={"type": "json_object"}
        )
        
        result_text = completion.choices[0].message.content
        result = json.loads(result_text)
        
        if "response" not in result:
             result["response"] = "Output was missing the expected response format."
        if "thinking_steps" not in result:
             result["thinking_steps"] = ["Consulting Socratic..."]
             
        return result
    except Exception as e:
        print(f"Groq API Error: {e}")
        return {
            "thinking_steps": ["Error connecting to cognitive module"],
            "response": f"I had trouble thinking through that. Error: {str(e)}"
        }

@app.post("/run")
async def run(request: TutorRequest):
    try:
        resp = generate_explanation(request.topic)
        return {"type": "tutor", "data": resp}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8001)
