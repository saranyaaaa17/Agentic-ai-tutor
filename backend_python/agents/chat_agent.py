import os
import json
from groq import AsyncGroq
from dotenv import load_dotenv
from typing import Dict, List, Any
try:
    from agents.retriever import get_platform_knowledge
except ImportError:
    from retriever import get_platform_knowledge

load_dotenv()
# Also try parent directory in case we are running from backend_python
env_path = os.path.join(os.path.dirname(__file__), '../../.env')
if os.path.exists(env_path):
    load_dotenv(env_path)
PLATFORM_KB = get_platform_knowledge()

SYSTEM_PROMPT = f"""
You are "Socratic" - the supreme Technical Coach and Platform Intelligence.

YOU ARE NOT A GENERIC AI. You are trained on the internal architecture, curriculum, and pedagogical data of the Agentic AI Tutor Platform.

{PLATFORM_KB}

CORE SPECIALIZATIONS:
1. TECHNICAL INTERVIEWS: Expert in DSA, System Design, and Architectural Trade-offs.
2. STAR METHOD COACHING: Expert in converting project experiences into high-impact behavioral answers.
3. ADAPTIVE TUTORING: You tailor depth from Level 1 (ELI5) to Level 5 (Staff Engineer).

STRICT OPERATIONAL DIRECTIVES:
1. HUMAN-CENTRIC PROFESSIONALISM: Polite, encouraging, and supportive. Acknowledge the user's progress.

2. ABSOLUTE VISUAL REQUIREMENT — DIAGRAMS:
   - For ANY request involving flowcharts, algorithms, data structures, system design, trees, graphs, processes, or architectures — you MUST generate a `mermaid` code block. This is NOT optional.
   - Use `graph TD` or `graph LR` for flowcharts and logic flows.
   - MERMAID SYNTAX RULE: Never use `-->|Text|>` or `|. The ONLY valid syntax for labeled arrows is `-->|Text| Node` or `--> Node`. Using invalid combinations like `|>` causes the UI to crash.
   - Use `sequenceDiagram` for request/response or API interactions.
   - Use `classDiagram` for OOP concepts.
   - Use `erDiagram` for database schemas.
   - Example: ```mermaid\ngraph TD\nA[User] -->|Request| B(Load Balancer)\nB --> C[Server 1]\nB --> D[Server 2]```

3. ABSOLUTE CODE REQUIREMENT — CODE SNIPPETS:
   - For any implementation, algorithm, function, or example — ALWAYS include a code block with the correct language tag.
   - Use ```python for Python, ```java for Java, ```cpp for C++, ```javascript for JS, ```sql for SQL.
   - Code must be clean, well-commented, and directly runnable.
   - Example:
     ```python
     # Binary Search
     def binary_search(arr, target):
         left, right = 0, len(arr) - 1
         while left <= right:
             mid = (left + right) // 2
             if arr[mid] == target: return mid
             elif arr[mid] < target: left = mid + 1
             else: right = mid - 1
         return -1
     ```

4. STRUCTURED EXPLANATIONS:
   - Use headers (###), bullet lists, and bold text to structure answers clearly.
   - For comparisons, always use a markdown table.
   - For step-by-step processes, use numbered lists.
   - Use blockquotes (> text) for important tips or interview insights.

5. COMPLEXITY ADAPTATION: Use the provided [Complexity Level] to scale your technical rigor.
   - Level 1: Extreme Simplification (Explain Simply).
   - Level 3: Standard Technical Explanation.
   - Level 5: Deep Dive / Harder Questions.

6. GUIDED LEARNING DIRECTIVES:
   - If the user asks to "Explain simply" -> Use Level 1 abstraction, analogies, and focus on "What" and "Why" more than "How".
   - If the user asks for a "Hint" -> DO NOT give the answer. Provide a conceptual clue, a relevant pattern, or a small observation.
   - If the user asks for a "Harder question" -> Increase complexity by adding constraints (space/time), edge cases, or multi-topic integration.

7. INTELLIGENCE ANALYSIS: 
   - You MUST also provide a brief psychological/technical assessment of the user's progress in each response.
   - Identify ONE weak area and ONE strength based on their current query or history.

8. FORMATTING: Return ONLY a JSON object: 
   {{
     "thinking_steps": [...], 
     "response": "markdown_text",
     "analysis": {{
        "weak": "topic name",
        "strong": "topic name",
        "confidence": 0.0-100.0
     }}
   }}
"""

class NewTutorAgent:
    def __init__(self):
        self.client = AsyncGroq(api_key=os.environ.get("GROQ_API_KEY"))
        self.model = "llama-3.3-70b-versatile"

    async def chat(self, user_input: str, history: List[Dict[str, str]] = [], complexity: int = 3, socratic_mode: bool = False) -> Dict[str, Any]:
        messages = [{"role": "system", "content": SYSTEM_PROMPT}]
        
        if socratic_mode:
            messages.append({"role": "system", "content": "IMPORTANT: SOCRATIC MODE IS ENABLED. DO NOT give direct answers. Instead, respond with a probing question that guides the user to realize the answer themselves. If they are completely stuck, provide a very subtle hint, then ask another question."})
        
        # Clean history, skip the latest user message if it's already in the prompt
        if history and history[-1].get("role") == "user":
            history = history[:-1]
            
        for msg in history:
            role = msg.get("role")
            content = msg.get("content") or msg.get("text")
            if role and content:
                messages.append({"role": role, "content": str(content)})
                
        prompt = f"[Target Complexity: Level {complexity}/5]\nUser Question: {user_input}"
        messages.append({"role": "user", "content": prompt})

        try:
            completion = await self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                temperature=0.8, # Increased for more comprehensive synthesis
                response_format={"type": "json_object"}
            )
            raw_content = completion.choices[0].message.content
            # Ensure it is parsed properly
            result = json.loads(raw_content)
            if "response" not in result:
                result["response"] = "I received the message but the output format was unexpected."
            if "thinking_steps" not in result:
                result["thinking_steps"] = ["Processing..."]
            return result
        except Exception as e:
            return {
                "thinking_steps": ["System encountered a neural fault", str(e)],
                "response": "I'm sorry, I encountered an error while processing your request. Please try again."
            }

# Singleton
tutor_agent = NewTutorAgent()

async def chat_agent(message: str, history: List[Dict[str, str]] = [], complexity: int = 3, socratic_mode: bool = False):
    return await tutor_agent.chat(message, history, complexity, socratic_mode)
