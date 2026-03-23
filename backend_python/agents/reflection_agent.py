import os
import json
from groq import AsyncGroq # type: ignore
from dotenv import load_dotenv # type: ignore
from typing import Dict, Any

load_dotenv()

class ReflectionAgent:
    """
    Reflection Agent:
    Reviews and refines the Teacher Agent's explanations to ensure
    they match the learner's current mastery level.
    """
    def __init__(self):
        self.client = AsyncGroq(api_key=os.environ.get("GROQ_API_KEY"))
        self.model = "llama-3.3-70b-versatile"

    async def refine_explanation(self, explanation: str, learner_profile: Dict[str, Any], topic: str) -> str:
        """
        Refines the explanation based on learner mastery.
        - Mastery < 0.4: Simplify, use analogies.
        - Mastery > 0.7: Deepen, add technical nuance.
        """
        from learner_profile import LearnerProfile # type: ignore
        profile = LearnerProfile(**learner_profile) if learner_profile else None
        
        mastery = profile.concept_mastery.get(topic, 0.5) if profile else 0.5
        
        # Threshold checks
        if 0.4 <= mastery <= 0.7:
            # Content is likely appropriate, skip unnecessary LLM call to save latency
            return explanation

        action = "SIMPLIFY" if mastery < 0.4 else "DEEPEN"
        
        print(f"[ReflectionAgent] 🧐 Refining explanation ({action}) for mastery {mastery:.2f}...")

        prompt = f"""
        You are an expert pedagogical editor.
        
        Task: Refine the following explanation for a student with {mastery:.2f} mastery (Scale 0-1).
        Action: {action} the content.
        
        Original Explanation:
        "{explanation}"
        
        Guidelines:
        - If SIMPLIFY: Remove jargon, use concrete analogies, break down steps further.
        - If DEEPEN: Discuss edge cases, optimizations, and underlying mechanics.
        - Keep the tone encouraging.
        - Return ONLY the refined explanation text.
        """

        try:
            completion = await self.client.chat.completions.create(
                messages=[
                    {"role": "system", "content": "You are a helpful tutor editor."},
                    {"role": "user", "content": prompt}
                ],
                model=self.model,
                temperature=0.3
            )
            refined_text = completion.choices[0].message.content
            return refined_text
        except Exception as e:
            print(f"[ReflectionAgent] ❌ Error: {e}")
            return explanation # Fallback to original

# Singleton
reflection_agent = ReflectionAgent()
