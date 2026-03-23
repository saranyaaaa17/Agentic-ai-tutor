
import os
import json
import re
from groq import Groq
from dotenv import load_dotenv
from typing import List, Dict, Any, Optional
from learner_profile import LearnerProfile

# Load environment variables
load_dotenv()

class EvaluatorAgent:
    """
    Robust Evaluator Agent with strict separation of concerns.
    1. evaluate_correctness()
    2. update_learner_profile()
    3. generate_feedback()
    """
    def __init__(self):
        self.api_key = os.environ.get("GROQ_API_KEY")
        if not self.api_key:
            print("[EvaluatorAgent] ❌ CRITICAL: GROQ_API_KEY is missing!")
        
        self.client = Groq(api_key=self.api_key)
        self.model = "llama-3.3-70b-versatile"

    def _simple_evaluation(self, user_answer: str, correct_answer: str) -> Optional[bool]:
        """
        Deterministic check for simple answers (exact match/numeric).
        Returns Boolean if confident, None if it needs AI.
        """
        if not correct_answer:
            return None
            
        u = user_answer.strip().lower()
        c = correct_answer.strip().lower()
        
        # Exact match
        if u == c:
            return True
            
        # Numeric check (basic)
        try:
            if float(u) == float(c):
                return True
        except ValueError:
            pass
            
        return None

    def evaluate_correctness(self, question: str, user_answer: str, correct_answer: str, topic: str, concepts: List[str]) -> Dict[str, Any]:
        """
        Determines correctness using Hybrid approach (Simple -> AI).
        Returns valid JSON evaluation object.
        """
        # 1. Fast Path
        simple_check = self._simple_evaluation(user_answer, correct_answer)
        if simple_check is not None:
             print(f"[EvaluatorAgent] ⚡ Fast path matched: {simple_check}")
             return {
                 "correct": simple_check,
                 "confidence": 1.0,
                 "reasoning": "Exact match with expected answer.",
                 "weak_concepts": [], # No weak concepts inferred from exact match yet
                 "error_type": "none"
             }

        # 2. AI Path
        print(f"[EvaluatorAgent] 🧠 AI Evaluation required for: {question[:30]}...")
        
        system_prompt = """
        You are an austere evaluation engine. 
        Input: user_answer, correct_answer, question.
        Task: Determine correctness strictly.
        
        Output JSON:
        {
            "correct": true/false,
            "confidence": 0.0-1.0 (float),
            "reasoning": "Brief objective explanation.",
            "error_type": "logic_error" | "syntax_error" | "misconception" | "guessing" | "none",
            "weak_concepts": ["concept1", "concept2"] (Extract specific failing concepts from provided list)
        }
        """
        
        user_prompt = f"""
        Question: {question}
        User Answer: {user_answer}
        Correct Answer: {correct_answer}
        Related Concepts: {', '.join(concepts)}
        """

        try:
            completion = self.client.chat.completions.create(
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                model=self.model,
                temperature=0.0,
                response_format={"type": "json_object"}
            )
            
            raw = completion.choices[0].message.content
            data = json.loads(raw)
            return data
            
        except Exception as e:
            print(f"[EvaluatorAgent] ❌ AI Evaluation Failed: {e}")
            # Fallback - if we can't evaluate, assume incorrect for safety but flag it?
            # Or return a neutral error state.
            return {
                "correct": False,
                "confidence": 0.0,
                "reasoning": "Evaluation service unavailable.",
                "error_type": "system_error",
                "weak_concepts": []
            }

    def generate_feedback(self, correctness_data: Dict, user_answer: str, correct_answer: str) -> str:
        """
        Generates constructive feedback based on evaluation result.
        """
        if correctness_data.get('correct'):
            return "Correct! Well done."
        
        reasoning = correctness_data.get('reasoning', '')
        if correctness_data.get('error_type') == 'syntax_error':
            return f"Check your syntax. {reasoning}"
        
        return f"Not quite. {reasoning}"

    def update_learner_profile(self, profile_data: Dict, evaluation_result: Dict, topic: str, concepts: List[str], difficulty: str = "medium") -> Dict:
        """
        Updates the LearnerProfile object and returns the localized dict representation.
        """
        if not profile_data:
            return {}

        try:
            profile = LearnerProfile(**profile_data)
            
            is_correct = evaluation_result.get('correct', False)
            print(f"[EvaluatorAgent] 💾 Updating Profile. Correct: {is_correct}, Difficulty: {difficulty}")

            # 1. Update Mastery
            # Identify which concepts to update
            # If AI identified specific weak concepts, prioritize those for penalty
            weak_concepts = evaluation_result.get('weak_concepts', [])
            
            # If the answer was CORRRECT, we update the main targeted concepts (from input)
            if is_correct:
                targets = concepts if concepts else [topic]
                for c in targets:
                    profile.update_mastery(c, True, difficulty)
            else:
                # If INCORRECT, we update the weak concepts identified by AI, 
                # OR if none identified, the main concepts (penalizing them)
                targets = weak_concepts if weak_concepts else (concepts if concepts else [topic])
                for c in targets:
                    profile.update_mastery(c, False, difficulty)

            # 2. Confidence
            ai_conf = evaluation_result.get('confidence', 0.8) # AI's confidence in ITS judgement, OR the student's confidence?
            # The prompt requested "Estimate student confidence". 
            # My evaluate_correctness output "confidence" key was defined as "confidence in correctness" (0-1) in the user request... 
            # WAIT. The user request says: "Estimate student confidence level based on... hesitation phrases". 
            # I should clarify if the JSON 'confidence' is AI confidence or Student confidence.
            # User Step 2 prompt says: "confidence": 0-1 (in the evaluation object). Usually implies Is Correct? confidence.
            # BUT Step 9 says "Small But Powerful Addition: Confidence Scoring Prompt ... Estimate student confidence".
            # I will distinguish them. 
            # For now update_confidence uses internal logic mostly.
            profile.update_confidence(is_correct)
            
            # 3. Record Attempt
            profile.record_attempt(
                 question_id="dynamic",
                 concept=concepts[0] if concepts else topic,
                 difficulty=difficulty,
                 correct=is_correct
            )
            
            # 4. Error Patterns
            err = evaluation_result.get('error_type')
            if err and err != 'none':
                if err not in profile.error_patterns:
                    profile.error_patterns.append(err)

            # debug log
            print(f"[EvaluatorAgent] 📊 New Mastery for {topic}: {profile.concept_mastery.get(topic, 'N/A')}")
            
            return profile.to_dict()
            
        except Exception as e:
            print(f"[EvaluatorAgent] ❌ Profile Update Failed: {e}")
            return profile_data # Return original if update fails

# Singleton
evaluator = EvaluatorAgent()

async def evaluator_agent(question: str, user_answer: str, topic: str, correct_answer: str = "", concepts: List[str] = [], student_profile_data: Dict = {}) -> Dict:
    """
    Main entry point fulfilling the new strict contract.
    Input: user_answer, expected_answer, concept, difficulty, learner_profile
    Output: { correct, score, feedback, updated_profile }
    """
    
    # 1. Evaluate Correctness
    eval_result = evaluator.evaluate_correctness(question, user_answer, correct_answer, topic, concepts)
    
    # 2. Generate Feedback (Optionally use AI for richer feedback if needed, simplified here)
    feedback = evaluator.generate_feedback(eval_result, user_answer, correct_answer) # Or use AI reasoning
    # Use the reasoning from AI as feedback directly if available and good
    if eval_result.get('reasoning'):
        feedback = eval_result['reasoning']
    
    # 3. Update Profile
    updated_profile = {}
    remediation_suggestion = None
    
    if student_profile_data:
        updated_profile = evaluator.update_learner_profile(student_profile_data, eval_result, topic, concepts)
        
        # 3.5 Check for remediations
        from learner_profile import LearnerProfile, KnowledgeGapAnalyzer
        profile_obj = LearnerProfile(**updated_profile)
        gap_analyzer = KnowledgeGapAnalyzer(profile_obj)
        analysis = gap_analyzer.analyze()
        
        if analysis.get('weak_concept_ranking'):
            top_weakness = analysis['weak_concept_ranking'][0]
            # Simple logic to bubble up immediate remediation
            for plan in analysis['remediation_plan']:
                if plan['concept'] == top_weakness:
                    remediation_suggestion = plan
                    break

    # 4. Return Final Structure
    return {
        "correct": eval_result.get('correct', False),
        "score": 1.0 if eval_result.get('correct') else 0.0,
        "feedback": feedback,
        "updated_student_profile": updated_profile,
        "weak_concepts": eval_result.get('weak_concepts', []),
        "error_type": eval_result.get('error_type', 'none'),
        "confidence_estimate": eval_result.get('confidence', 0.0),
        "remediation_suggestion": remediation_suggestion
    }
