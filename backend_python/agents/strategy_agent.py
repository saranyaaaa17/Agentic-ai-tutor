
import os
import json
import re
from groq import AsyncGroq
from dotenv import load_dotenv
from typing import Dict, Any, List

# Load env variables
load_dotenv()

class StrategyAgent:
    def __init__(self):
        # Verify API Key
        key = os.environ.get("GROQ_API_KEY")
        if not key:
            print("[ERROR] CRITICAL: GROQ_API_KEY is missing!")
        
        self.client = AsyncGroq(api_key=key)
        self.model = "llama-3.3-70b-versatile"
        print(f"[StrategyAgent] Initialized with model: {self.model}")

    async def _call_llm(self, messages: List[Dict[str, str]], temperature: float = 0.6) -> str:
        try:
            print(f"[StrategyAgent] [CALL] Calling Groq API...")
            completion = await self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                temperature=temperature
            )
            content = completion.choices[0].message.content
            print(f"[StrategyAgent] [SUCCESS] Received len: {len(content)}")
            return content
        except Exception as e:
            print(f"[StrategyAgent] [ERROR] LLM Error: {e}")
            raise e

    def _parse_json(self, content: str) -> Dict:
        try:
            cleaned = re.sub(r"```json\s*", "", content)
            cleaned = re.sub(r"```\s*$", "", cleaned).strip()
            start = cleaned.find('{')
            end = cleaned.rfind('}') + 1
            if start != -1 and end != -1:
                cleaned = cleaned[start:end]
            return json.loads(cleaned)
        except json.JSONDecodeError:
            print(f"[StrategyAgent] [WARN] JSON Parse Failed.")
            return None

    async def generate_path(self, proficiency_level: str, weak_concepts: List[str], topic: str, mastery_profile: Dict[str, float] = {}, meta_cognition: str = "balanced", learning_speed: str = "medium", confidence_score: float = 0.5, engagement_score: float = 0.8) -> Dict:
        print(f"\n--- [Strategy Generation] Topic: {topic} | Level: {proficiency_level} | Mindset: {meta_cognition} ---")
        
        import sys
        # ensure we can import tools and concept_network reliably
        try:
            from agents.concept_network import concept_graph
            from tools.resource_retriever import resource_retriever
        except ImportError:
            try:
                from backend_python.agents.concept_network import concept_graph
                from backend_python.tools.resource_retriever import resource_retriever
            except ImportError:
                from concept_network import concept_graph
                import sys, os
                sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
                from tools.resource_retriever import resource_retriever

        # 1. Predictive Analysis (Existing)
        projected_risks = []
        if mastery_profile:
             for concept, current_score in mastery_profile.items():
                 future_score = concept_graph.calculate_decay(current_score, days_since_last_practice=7)
                 decay_amount = current_score - future_score
                 if future_score < 0.5 and current_score >= 0.5:
                     projected_risks.append(f"{concept} (Will drop to {future_score:.2f})")
                 elif decay_amount > 0.15:
                      projected_risks.append(f"{concept} (High Decay Risk: -{decay_amount:.2f})")

        risk_context = ""
        if projected_risks:
            risk_context = f"\n⚠️ PREDICTIVE RISK ALERT: Likely to forget: {', '.join(projected_risks)}."

        # 2. Get Real-World Knowledge Resources
        real_resources = resource_retriever.get_resources(topic, weak_concepts)
        resource_json = json.dumps(real_resources, indent=2)

        prompt = f"""
        You are an expert Educational Strategy Agent.
        
        Student Profile:
        - Topic: {topic}
        - Current Proficiency: {proficiency_level}
        - Identified Weak Concepts: {', '.join(weak_concepts) if weak_concepts else 'General fundamentals'}
        - Learning Mindset (Meta-Cognition): {meta_cognition}
        - Learning Speed: {learning_speed}
        - Confidence Score (0-1): {confidence_score}
        - Engagement Level (0-1): {engagement_score}
        {risk_context}

        REAL EDUCATIONAL RESOURCES (USE THESE ONLY):
        {resource_json}

        Task:
        1. Decide best TEACHING STRATEGY (analogy, problem-solving, visual, challenge).
           - Low confidence? -> Analogy/Visual + Scaffolding.
           - High confidence + Fast? -> Challenge-based.
        2. Adjust pacing and tone.
        3. Formulate a session goal and next actions.
        4. Recommend the courses listed above in the REAL EDUCATIONAL RESOURCES list.
           - DO NOT imagine new links.
           - DO NOT change URLs.
           - You MAY select the 2 most relevant ones for the current weak concepts.

        OUTPUT STRICT JSON ONLY (no extra text):
        {{
            "teaching_style": "Analogy-Based" | "Problem-Solving" | "Visual Breakdown" | "Challenge-Based",
            "pace": "Slow & Steady" | "Moderate" | "Accelerated",
            "session_goal": {{
                "primary_objective": "Main concept to master",
                "secondary_reinforcement": "Supporting concept",
                "estimated_cognitive_load": "High" | "Medium" | "Low",
                "recommended_time_budget_minutes": 30
            }},
            "strategy_summary": "A 1-2 sentence personalized study strategy for this student.",
            "reasoning": "I chose this path because...", 
            "next_action": "practice" | "revision" | "concept_explanation" | "challenge_problem",
            "recommended_courses": [
                {{
                    "title": "Full descriptive course title",
                    "platform": "YouTube" | "Coursera" | "GeeksforGeeks" | "MIT OpenCourseWare" | "freeCodeCamp",
                    "url": "https://www.youtube.com/watch?v=REAL_VIDEO_ID",
                    "description": "2-3 sentence description of what this course covers and why it helps this student.",
                    "covered_concepts": ["concept1", "concept2"]
                }}
            ],
            "roadmap": [
                {{
                    "phase": "Foundation" | "Guided Practice" | "Transfer",
                    "title": "Short roadmap step title",
                    "focus": "What the student should focus on in this phase",
                    "action": "Specific thing to do next",
                    "outcome": "Expected result of the phase"
                }}
            ],
            "daily_practice_tip": "A specific, actionable daily practice tip for this topic."
        }}
        """

        print(f"[StrategyLog] 🧠 Decision Context: Level={proficiency_level}, Risks={len(projected_risks)}, Mindset={meta_cognition}")

        for attempt in range(3):
            try:
                messages = [
                    {"role": "system", "content": "You are a Strategy Agent. Return JSON with 'session_goal'."},
                    {"role": "user", "content": prompt}
                ]
                
                raw_response = await self._call_llm(messages)
                data = self._parse_json(raw_response)
                
                if data and "session_goal" in data:
                    print(f"[StrategyLog] ✅ Goal Generated: {data['session_goal']['primary_objective']}")
                    return data
            except Exception as e:
                print(f"[StrategyAgent] Failed Attempt {attempt}: {e}")
                
        # Fallback ...
        primary_weakness = weak_concepts[0] if weak_concepts else topic
        secondary_weakness = weak_concepts[1] if len(weak_concepts) > 1 else "problem solving"
        fallback_resources = real_resources[:4]
        return {
            "teaching_style": "Visual Breakdown",
            "pace": "Moderate",
            "session_goal": {
                "primary_objective": primary_weakness or "Review Fundamentals",
                "secondary_reinforcement": secondary_weakness,
                "estimated_cognitive_load": "Medium",
                "recommended_time_budget_minutes": 30
            },
            "strategy_summary": f"Strengthen {primary_weakness or topic} first, then reinforce it with focused practice and one transfer problem.",
            "reasoning": "Fallback strategy generated from detected weak concepts and curated resources.",
            "recommended_courses": fallback_resources,
            "roadmap": [
                {
                    "phase": "Foundation",
                    "title": f"Rebuild {primary_weakness or topic}",
                    "focus": f"Review the core idea behind {primary_weakness or topic} before pushing speed.",
                    "action": "Study one curated explanation and write 2 small examples from memory.",
                    "outcome": f"You can explain {primary_weakness or topic} clearly in your own words."
                },
                {
                    "phase": "Guided Practice",
                    "title": f"Practice {secondary_weakness}",
                    "focus": "Use small, targeted questions that directly hit the mistakes from the assessment.",
                    "action": "Solve 2 focused exercises and compare your reasoning with a model solution.",
                    "outcome": "You reduce repeat mistakes and recognize the right pattern faster."
                },
                {
                    "phase": "Transfer",
                    "title": "Apply in mixed problems",
                    "focus": f"Use {primary_weakness or topic} in broader questions so the concept sticks outside drills.",
                    "action": "Attempt one mixed-difficulty problem and note where your reasoning still slows down.",
                    "outcome": "You know whether the concept is retained or still needs another cycle."
                }
            ],
            "daily_practice_tip": f"Spend 20-30 minutes daily on {primary_weakness or topic}, then finish with one mixed application problem."
        }

# Singleton
agent = StrategyAgent()

async def strategy_agent(proficiency_level: str, weak_concepts: List[str], topic: str, mastery_profile: Dict[str, float] = {}, meta_cognition: str = "balanced", learning_speed: str = "medium", confidence_score: float = 0.5, engagement_score: float = 0.8):
    return await agent.generate_path(proficiency_level, weak_concepts, topic, mastery_profile, meta_cognition, learning_speed, confidence_score, engagement_score)
