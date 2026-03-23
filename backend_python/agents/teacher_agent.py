
import os
import json
import re
import random
from groq import AsyncGroq
from dotenv import load_dotenv
from typing import Dict, Any, List

# Load env variables
load_dotenv()

class AutonomousTeacher:
    def __init__(self):
        # Verify API Key
        key = os.environ.get("GROQ_API_KEY")
        if not key:
            print("[ERROR] CRITICAL: GROQ_API_KEY is missing!")
        
        self.client = AsyncGroq(api_key=key)
        self.model = "llama-3.3-70b-versatile"
        print(f"[TeacherAgent] Initialized with model: {self.model}")

    async def _call_llm(self, messages: List[Dict[str, str]], temperature: float = 0.7) -> str:
        """Core LLM Call Wrapper with retries and fallback models"""
        models = ["llama-3.3-70b-versatile", "llama-3.1-70b-versatile", "llama3-70b-8192"]
        
        for model in models:
            for attempt in range(1, 3): # 2 attempts per model
                try:
                    print(f"[TeacherAgent] [CALL] Calling Groq with {model} (Attempt {attempt})...")
                    completion = await self.client.chat.completions.create(
                        model=model,
                        messages=messages,
                        temperature=temperature,
                        response_format={"type": "json_object"}
                    )
                    content = completion.choices[0].message.content
                    print(f"[TeacherAgent] [SUCCESS] Received {len(content)} chars from {model}")
                    return content
                except Exception as e:
                    print(f"[TeacherAgent] [ERROR] {model} Attempt {attempt} Failed: {str(e)}")
                    if "rate_limit" in str(e).lower():
                        import asyncio
                        await asyncio.sleep(1) # Short sleep for rate limits
                    continue # Try next attempt or model
        
        # If all fail
        print(f"[TeacherAgent] [FATAL] All LLM models failed.")
        with open("backend_logs.txt", "a", encoding="utf-8") as f:
            import time
            f.write(f"[FATAL] {time.ctime()} - All LLM models failed to respond.\n")
        return None

    def _parse_json(self, content: str) -> Dict:
        """Robust JSON Parser"""
        if not content: return None
        try:
            # 1. Strip Markdown
            cleaned = re.sub(r"```json\s*", "", content)
            cleaned = re.sub(r"```\s*$", "", cleaned).strip()
            
            # 2. Extract JSON object
            start = cleaned.find('{')
            end = cleaned.rfind('}') + 1
            if start != -1 and end != -1:
                cleaned = cleaned[start:end]
            
            return json.loads(cleaned)
        except json.JSONDecodeError as e:
            print(f"[TeacherAgent] [WARN] JSON Parse Failed: {str(e)}. Raw content start: {content[:200]}...")
            with open("backend_logs.txt", "a", encoding="utf-8") as f:
                import time
                f.write(f"[ERROR] {time.ctime()} - JSON Parse Failed. Fragment: {content[:100]}\n")
            return None

    async def run(self, topic: str, difficulty: str, mode: str = 'teach', history: List = None, weak_concepts: List[str] = None, student_profile: Dict = None, num_questions: int = 3) -> Dict:
        history = history or []
        weak_concepts = weak_concepts or []
        student_profile = student_profile or {}
        msg = f"\n--- [Teacher Request] Topic: {topic} | Mode: {mode} | Questions: {num_questions} ---"
        print(msg)
        with open("backend_logs.txt", "a", encoding="utf-8") as f:
            import time
            f.write(f"[DEBUG] {time.ctime()} - {msg}\n")

        # Step 1: Prompt Selection
        if mode == 'assessment':
            system_prompt = self._get_assessment_prompt(topic, difficulty, weak_concepts, student_profile, num_questions)
        else:
            system_prompt = self._get_teaching_prompt(topic, difficulty, student_profile)

        # Step 2: Generation Loop
        for attempt in range(3):
            try:
                messages = [{"role": "system", "content": system_prompt}]
                messages.extend(history)
                messages.append({
                    "role": "user",
                    "content": f"Topic: {topic}\nDifficulty: {difficulty}"
                })
                
                if attempt > 0:
                    messages.append({
                        "role": "user", 
                        "content": "Previous JSON was invalid. Return STRICT JSON only."
                    })

                # Call LLM
                raw_response = await self._call_llm(messages, temperature=0.7)
                
                # Parse
                data = self._parse_json(raw_response)
                
                # Validate
                if data:
                    print(f"[TeacherAgent] [SUCCESS] Successfully generated content (Attempt {attempt+1})")
                    
                    # SELF-CORRECTION LAYER
                    if mode == 'teach' and student_profile:
                        data = await self._reflect_and_improve(data, student_profile)

                    return data
                
                print(f"[TeacherAgent] [WARN] Attempt {attempt+1} produced invalid JSON. Retrying...")

            except Exception as e:
                print(f"[TeacherAgent] [ERROR] Attempt {attempt+1} Exception: {e}")
        
        # Fallback if loops fail
        print("[TeacherAgent] [ERROR] All attempts failed. Returning Fallback.")
        return self._get_fallback(topic, mode)
    
    def _get_assessment_prompt(self, topic: str, difficulty: str, weak_concepts: List[str] = [], student_profile: Dict = None, num_questions: int = 3) -> str:
        student_profile = student_profile or {}
        seed = random.randint(1, 999999)
        focus_prompt = ""
        if weak_concepts:
            focus_prompt = f"\nFOCUS AREAS: Student is weak in {', '.join(weak_concepts)}. EXPLICITLY target these concepts with trap options based on common misconceptions."

        # Dynamic Difficulty Logic based on Mastery Score
        mastery_score = student_profile.get('overall_mastery', 0.5) # Default to 0.5 if unknown
        difficulty_instruction = ""
        if mastery_score < 0.4:
            difficulty_instruction = "Mastery < 0.4 detected. Generate SIMPLE CONCEPTUAL questions. Focus on definitions and basic syntax."
        elif mastery_score < 0.7:
             difficulty_instruction = "Mastery 0.4-0.7 detected. Generate APPLICATION-BASED problems. Focus on scenarios and logic flow."
        else:
             difficulty_instruction = "Mastery > 0.7 detected. Generate TRICKY EDGE-CASE or OPTIMIZATION questions. Challenge the student."

        # Anti-Context Method (Prevent Repetition)
        recent_questions = student_profile.get('recent_questions', [])
        anti_context_prompt = ""
        if recent_questions:
            last_5 = recent_questions[-5:]
            qs_list = "\n".join([f"- {q}" for q in last_5])
            anti_context_prompt = f"\nCRITICAL INSTRUCTION: You MUST NOT generate a question similar to any of these recently asked questions. Generate completely novel scenarios:\n{qs_list}\n"

        return f"""
        You are an Elite AI Pedagogy Agent.
        Task: Create {num_questions} high-quality multiple-choice questions for the topic: "{topic}" at {difficulty} level.
        Seed: {seed}
        Student Mastery Score: {mastery_score}
        {difficulty_instruction}
        {focus_prompt}
        {anti_context_prompt}
        
        STRICT RULES:
        1. NO generic questions. Use concise code snippets or technical scenarios.
        2. Format: Return a JSON object with "thinking_steps" (list) and "questions" (list).
        3. Each question must have: "id", "q", "options", "ans", "explanation", "hint", "difficulty", "time_limit".
        4. "time_limit" should be in seconds: Easy: 45, Medium: 90, Hard: 180.
        5. "explanation" should describe the choice of "ans" clearly.
        6. "ans" must be exactly the same string as one of the items in "options".
        7. LOGIC VERIFICATION: Before outputting, simulate the code snippet or logic. Ensure the "ans" is factually correct.
        8. "hint" must be a subtle clue that doesn't give away the answer but clarifies the trick if any (e.g., "Remember 0-based indexing").
        9. Keep JSON overhead minimal to prevent truncation.

        Example:
        {{
          "thinking_steps": ["Constructing question 1", "..."],
          "questions": [
            {{ 
               "id": 1, 
               "q": "What is the result of...?", 
               "options": ["A", "B", "C", "D"], 
               "ans": "A",
               "explanation": "Brief explanation.",
               "hint": "Subtle clue.",
               "difficulty": "medium",
               "time_limit": 90
            }}
          ]
        }}
        """

    def _get_teaching_prompt(self, topic: str, difficulty: str, student_profile: Dict = None) -> str:
        student_profile = student_profile or {}
        # Extract profile data with defaults
        concept_mastery = student_profile.get('concept_mastery', 'Unknown')
        weak_concepts = student_profile.get('weak_concepts', [])
        learning_speed = student_profile.get('learning_speed', 'Average')
        confidence_score = student_profile.get('confidence_score', 'Neutral')
        recent_errors = student_profile.get('recent_errors', [])

        return f"""
        You are an adaptive AI tutor teaching the topic: "{topic}".

        Student Profile:
        - Concept mastery levels: {concept_mastery}
        - Weak concepts: {weak_concepts}
        - Learning speed: {learning_speed}
        - Confidence score: {confidence_score}
        - Recent mistakes: {recent_errors}

        Your task:
        1. Teach the requested concept.
        2. Adjust explanation complexity based on mastery level.
        3. If mastery < 0.4 → explain with simple analogy + step-by-step.
        4. If mastery 0.4–0.7 → medium explanation + one example.
        5. If mastery > 0.7 → concise explanation + challenge question.
        6. Reinforce weak areas subtly.
        7. End with a short diagnostic question.
        8. CONSIDER PREVIOUS MISTAKES: {recent_errors}. Avoid repeating ineffective styles.

        Never overload the student.
        Keep explanation personalized.
        
        You are an Elite AI Tutor specialized in deep conceptual mastery.
        Explain the topic strictly in JSON.
        
        Format:
        {{
          "thinking_steps": ["Analyzing Topic...", "Identifying Core Principles...", "Structuring Pedagogy..."],
          "explanation": "Markdown text explaining the 'Why' not just the 'What'.",
          "example": "A high-quality code example or real-world analogy.",
          "practice_question": "A challenging question to verify understanding immediately."
        }}
        """

    async def _reflect_and_improve(self, teacher_response: Dict, student_profile: Dict) -> Dict:
        """
        Self-Correction Layer: Review the generated explanation against the student profile.
        """
        try:
            print("[TeacherAgent] 🧠 Reflection Layer: Reviewing explanation...")
            reflection_prompt = f"""
            You are a Reflection Agent in an adaptive tutoring system.

            Review this explanation:
            {json.dumps(teacher_response.get('explanation', ''))}

            Student Profile:
            - Mastery: {student_profile.get('concept_mastery', 'Unknown')}
            - Weaknesses: {student_profile.get('weak_concepts', [])}
            - Recent Errors: {student_profile.get('recent_errors', [])}

            Tasks:
            1. Is the explanation aligned to mastery level?
            2. Is it too complex or too shallow?
            3. Does it address the specific weak concepts?
            4. Rate clarity from 0 to 1.
            5. Improve the explanation if needed.

            Output JSON:
            {{
                "clarity_score": 0.0-1.0,
                "critique": "Brief analysis.",
                "improved_explanation": "Markdown string (only if improvement needed, else null)",
                "improved_example": "String (optional)"
            }}
            """
            
            messages = [{"role": "system", "content": reflection_prompt}]
            raw_res = await self._call_llm(messages, temperature=0.3)
            reflection_data = self._parse_json(raw_res)

            if reflection_data and reflection_data.get('clarity_score', 0) < 0.8:
                if reflection_data.get('improved_explanation'):
                    print("[TeacherAgent] 🔧 Reflection: Improving explanation based on critique.")
                    teacher_response['explanation'] = reflection_data['improved_explanation']
                if reflection_data.get('improved_example'):
                     teacher_response['example'] = reflection_data['improved_example']
            
            return teacher_response

        except Exception as e:
            print(f"[TeacherAgent] Reflection Error: {e}")
            return teacher_response # specific failure shouldn't crash the response

    def _get_fallback(self, topic: str, mode: str) -> Dict:
        return {
            "questions": [
                {"id": 1, "q": f"I'm currently recalibrating my knowledge core for {topic}. Please try again in 30 seconds.", "options": ["Retry", "Report", "Wait", "Check Logs"], "ans": "Retry"}
            ]
        } if mode == 'assessment' else {
            "explanation": "My cognitive circuits are a bit overloaded. One moment.", "example": "Check backend health.", "practice_question": "..."
        }

# Instantiate Singleton
agent = AutonomousTeacher()

# Wrapper function
async def teacher_agent(topic: str, difficulty: str, mode: str = 'teach', history: list = [], weak_concepts: list = [], student_profile: dict = {}, num_questions: int = 3):
    return await agent.run(topic, difficulty, mode, history, weak_concepts, student_profile, num_questions)
