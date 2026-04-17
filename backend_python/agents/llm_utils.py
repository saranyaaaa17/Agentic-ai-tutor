
import os
import json
import asyncio
import re
from typing import List, Dict, Any, Optional
from groq import AsyncGroq
from openai import AsyncOpenAI
from dotenv import load_dotenv

load_dotenv()

class LLMService:
    def __init__(self):
        self.groq_client = None
        self.openai_client = None
        
        # Initialize Groq
        groq_key = os.environ.get("GROQ_API_KEY")
        if groq_key:
            self.groq_client = AsyncGroq(api_key=groq_key)
            
        # Initialize OpenAI
        openai_key = os.environ.get("OPENAI_API_KEY")
        if openai_key:
            self.openai_client = AsyncOpenAI(api_key=openai_key)
            
        # Groq Fallback Chain (Active Models)
        self.groq_models = [
            "llama-3.3-70b-versatile",
            "llama-3.1-8b-instant",
            "mixtral-8x7b-32768",
            "gemma2-9b-it"
        ]
        
        # OpenAI Fallback
        self.openai_model = "gpt-4o-mini"

    async def call_llm(self, messages: List[Dict[str, str]], temperature: float = 0.7, json_mode: bool = False, agent_name: str = "Agent") -> Optional[str]:
        """
        Unified LLM call with fallback: Groq (multiple models) -> OpenAI -> None
        """
        last_error = "No models available"
        
        # 1. Try Groq Models
        if self.groq_client:
            for model in self.groq_models:
                for attempt in range(1, 4): # Increased retries to 3
                    try:
                        print(f"[{agent_name}] [CALL] Groq {model} (Attempt {attempt})...")
                        params = {
                            "model": model,
                            "messages": messages,
                            "temperature": temperature,
                        }
                        if json_mode:
                            params["response_format"] = {"type": "json_object"}
                            
                        completion = await self.groq_client.chat.completions.create(**params)
                        content = completion.choices[0].message.content
                        if content:
                            print(f"[{agent_name}] [SUCCESS] Received response from Groq {model}")
                            return content
                    except Exception as e:
                        last_error = str(e)
                        error_msg = last_error.lower()
                        print(f"[{agent_name}] [ERROR] Groq {model} Failed: {str(e)[:150]}")
                        
                        # Categorize error
                        is_rate_limit = any(x in error_msg for x in ["rate_limit", "429", "quota", "too many requests"])
                        is_unrecoverable = any(x in error_msg for x in ["decommissioned", "not found", "invalid_request_error", "api_key"])

                        if is_unrecoverable:
                            print(f"[{agent_name}] [SKIP] {model} unrecoverable, trying next model...")
                            break 
                        
                        if is_rate_limit and attempt < 3:
                            wait_time = attempt * 1.5 # Incremental wait
                            print(f"[{agent_name}] [WAIT] Rate limited. Waiting {wait_time}s...")
                            await asyncio.sleep(wait_time)
                            continue
                        
                        if attempt < 3:
                            await asyncio.sleep(0.5)
                        else:
                            print(f"[{agent_name}] [FAIL] All retries for {model} exhausted.")
                            break
                            
        # 2. Try OpenAI Fallback
        if self.openai_client:
            for attempt in range(1, 3):
                try:
                    print(f"[{agent_name}] [CALL] OpenAI {self.openai_model} Fallback (Attempt {attempt})...")
                    params = {
                        "model": self.openai_model,
                        "messages": messages,
                        "temperature": temperature,
                        "max_tokens": 2048
                    }
                    if json_mode:
                        params["response_format"] = {"type": "json_object"}
                        
                    completion = await self.openai_client.chat.completions.create(**params)
                    content = completion.choices[0].message.content
                    if content:
                        print(f"[{agent_name}] [SUCCESS] Received response from OpenAI {self.openai_model}")
                        return content
                except Exception as e:
                    last_error = str(e)
                    print(f"[{agent_name}] [FATAL] OpenAI Fallback Failed: {e}")
                    if attempt < 2: await asyncio.sleep(1)

        print(f"[{agent_name}] [CRITICAL] All LLM options exhausted. Last Error: {last_error}")
        with open("backend_logs.txt", "a", encoding="utf-8") as f:
             import time
             f.write(f"\n[LLM_FAILURE] {time.ctime()} - {agent_name}: All models failed. Last Error: {last_error}\n")
        return None

    def parse_json(self, content: str) -> Optional[Dict]:
        """Robust JSON Parser"""
        if not content: return None
        try:
            # Strip Markdown
            cleaned = re.sub(r"```json\s*", "", content)
            cleaned = re.sub(r"```\s*$", "", cleaned).strip()
            
            # Extract JSON object
            start = cleaned.find('{')
            end = cleaned.rfind('}') + 1
            if start != -1 and end != -1:
                cleaned = cleaned[start:end]
            
            return json.loads(cleaned)
        except Exception:
            return None

# Singleton
llm_service = LLMService()
