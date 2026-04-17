
import os
import json
import re
import asyncio
from dotenv import load_dotenv
from typing import Dict, Any, List, Optional
try:
    from agents.llm_utils import llm_service
except ImportError:
    from llm_utils import llm_service

# Load env variables
load_dotenv()

class StrategyAgent:
    def __init__(self):
        # We now use the unified llm_service
        pass

    async def _call_llm(self, messages: List[Dict[str, str]], temperature: float = 0.6) -> str:
        """Core LLM Call Wrapper using llm_service"""
        return await llm_service.call_llm(messages, temperature, json_mode=True, agent_name="StrategyAgent")

    def _parse_json(self, content: str) -> Dict:
        """Robust JSON Parser"""
        return llm_service.parse_json(content)

    async def generate_path(self, proficiency_level: str, weak_concepts: List[str], topic: str, mastery_profile: Dict[str, float] = {}, meta_cognition: str = "balanced", learning_speed: str = "medium", confidence_score: float = 0.5, engagement_score: float = 0.8) -> Dict:
        print(f"\n--- [Strategy Generation] Topic: {topic} | Level: {proficiency_level} | Mindset: {meta_cognition} ---")
        
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
                 # Use mock decay if not fully implemented
                 future_score = current_score * 0.9 # Basic fallback decay
                 try:
                    future_score = concept_graph.calculate_decay(current_score, days_since_last_practice=7)
                 except: pass
                 
                 decay_amount = current_score - future_score
                 if future_score < 0.5 and current_score >= 0.5:
                     projected_risks.append(f"{concept} (Will drop to {future_score:.2f})")
                 elif decay_amount > 0.15:
                      projected_risks.append(f"{concept} (High Decay Risk: -{decay_amount:.2f})")

        risk_context = ""
        if projected_risks:
            risk_context = f"\n⚠️ PREDICTIVE RISK ALERT: Likely to forget: {', '.join(projected_risks)}."

        # 2. Get Real-World Knowledge Resources
        real_resources = []
        try:
            real_resources = resource_retriever.get_resources(topic, weak_concepts)
        except:
            print("[StrategyAgent] [WARN] Resource retriever failed.")
            
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
        2. Adjust pacing and tone.
        3. Formulate a session goal and next actions.
        4. Recommend the courses listed above in the REAL EDUCATIONAL RESOURCES list.

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
            "reasoning": "Reasoning for this path.", 
            "next_action": "practice" | "revision" | "concept_explanation" | "challenge_problem",
            "recommended_courses": [
                {{
                    "title": "Full title",
                    "platform": "YouTube",
                    "url": "...",
                    "description": "...",
                    "covered_concepts": ["concept1"]
                }}
            ],
            "roadmap": [
                {{
                    "phase": "Foundation",
                    "title": "...",
                    "focus": "...",
                    "action": "...",
                    "outcome": "..."
                }}
            ],
            "daily_practice_tip": "..."
        }}
        """

        for attempt in range(3):
            try:
                messages = [
                    {"role": "system", "content": "You are a Strategy Agent. Return JSON with 'session_goal'."},
                    {"role": "user", "content": prompt}
                ]
                
                raw_response = await self._call_llm(messages)
                data = self._parse_json(raw_response)
                
                if data and "session_goal" in data:
                    print(f"[StrategyLog] ✅ Goal Generated")
                    return data
            except Exception as e:
                print(f"[StrategyAgent] Failed Attempt {attempt}: {e}")
                
        # Final Fallback
        return {
            "teaching_style": "Visual Breakdown",
            "pace": "Moderate",
            "strategy_summary": "Review fundamentals first.",
            "recommended_courses": real_resources[:2] if real_resources else [],
            "session_goal": {"primary_objective": topic, "secondary_reinforcement": "Fundamentals", "estimated_cognitive_load": "Medium", "recommended_time_budget_minutes": 30},
            "roadmap": [{"phase": "Foundation", "title": "Review", "focus": "Basics", "action": "Read", "outcome": "Mastery"}]
        }

# Singleton
agent = StrategyAgent()

async def strategy_agent(proficiency_level: str, weak_concepts: List[str], topic: str, mastery_profile: Dict[str, float] = {}, meta_cognition: str = "balanced", learning_speed: str = "medium", confidence_score: float = 0.5, engagement_score: float = 0.8):
    return await agent.generate_path(proficiency_level, weak_concepts, topic, mastery_profile, meta_cognition, learning_speed, confidence_score, engagement_score)
