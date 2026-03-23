from typing import Dict, List, Optional, Any
import math
import statistics

class LearnerProfile:
    """
    Robust LearnerProfile class for tracking student progress.
    Includes logic for weighted mastery updates, confidence scoring, 
    and error pattern detection.
    """
    def __init__(self, 
                 concept_mastery: Optional[Dict[str, float]] = None, 
                 error_patterns: Optional[List[str]] = None,
                 learning_speed: float = 0.5,
                 confidence_score: float = 0.5,
                 attempt_history: Optional[List[Dict[str, Any]]] = None,
                 **kwargs):
        
        self.concept_mastery = concept_mastery if concept_mastery else {}
        self.error_patterns = error_patterns if error_patterns else []
        self.learning_speed = learning_speed
        self.confidence_score = confidence_score
        self.attempt_history = attempt_history if attempt_history else []

    def update_mastery(self, concept: str, correct: bool, difficulty: str = "medium"):
        """
        Updates concept mastery score based on performance and difficulty.
        
        Requirements:
        - Mastery increases more for hard questions.
        - Mastery decreases for incorrect answers.
        - Repeated mistakes reduce mastery aggressively.
        - Bounded 0.0 to 1.0.
        """
        current_score = self.concept_mastery.get(concept, 0.5)
        
        # Difficulty Weights
        weights = {
            "easy": 0.05,
            "medium": 0.10,
            "hard": 0.15
        }
        weight = weights.get(difficulty.lower(), 0.1)
        
        if correct:
            # Diminishing returns: Harder to get from 0.9 to 1.0 than 0.5 to 0.6
            # New Score = Old + Weight * (1 - Old)
            # Hard question gives bigger boost
            delta = weight * (1.0 - current_score)
            new_score = current_score + delta
        else:
            # Penalty Factor logic
            penalty_factor = 1.0
            
            # Check for repeated mistakes in history
            recent_attempts = [a for a in self.attempt_history if a.get('concept') == concept]
            if recent_attempts and not recent_attempts[-1]['correct']:
                penalty_factor = 1.5 # Aggressive penalty for repeated error
            
            # New Score = Old - Weight * Penalty
            # Hard question penalty is same as weight? 
            # Usually failing a hard question shouldn't penalize as much as failing an easy one.
            # So maybe reverse difficulty weight for penalty?
            # User requirement: "Use weighted adjustment based on difficulty: easy: 0.05..."
            # Let's interpret simplisticly first: failure on easy = big penalty?
            # Prompt says "Mastery should increase more for hard questions than easy ones."
            # Implicitly: Failing an easy question implies lower mastery than failing a hard one.
            
            if difficulty == "easy":
                fail_weight = 0.15 # Fail easy -> big drop
            elif difficulty == "hard":
                fail_weight = 0.05 # Fail hard -> small drop
            else:
                fail_weight = 0.10, 

            # Just use standard weight from prompt but maybe invert for logic if implied? 
            # Prompt: "Use weighted adjustment based on difficulty: easy: 0.05, medium: 0.1, hard: 0.15"
            # It lists these weights generally. I will follow the explicit values given for *updates* generally
            # bur assume for penalty it should be sensible.
            # Let's stick to the user's specific values for now to avoid over-interpreting.
            # But the requirement "Incorrect answers should decrease mastery slightly" suggests not too harsh.
            
            delta = weight * penalty_factor
            new_score = current_score - delta

        # Clamp 0 to 1
        self.concept_mastery[concept] = max(0.0, min(1.0, new_score))
        return self.concept_mastery[concept]

    def update_confidence(self, correct: bool):
        """
        Updates internal confidence score based on success streak.
        """
        alpha = 0.1 # Smoothing factor
        target = 1.0 if correct else 0.0
        # Exponential Moving Average
        self.confidence_score = (self.confidence_score * (1 - alpha)) + (target * alpha)
        return self.confidence_score

    def detect_error_pattern(self, answer_text: str, expected_answer: str) -> Optional[str]:
        """
        Simple heuristic logic to detect basic error types.
        Ideally this uses an LLM, but we put basic regex/logic here for speed.
        """
        # Placeholder logic
        if not answer_text:
            return "Empty Answer"
        if "recursion" in expected_answer.lower() and "loop" in answer_text.lower():
            pattern = "Used Iteration instead of Recursion"
            if pattern not in self.error_patterns:
                self.error_patterns.append(pattern)
            return pattern
        return None

    def record_attempt(self, question_id: str, concept: str, difficulty: str, correct: bool):
        """
        Log an attempt to history.
        """
        self.attempt_history.append({
            "question_id": question_id,
            "concept": concept,
            "difficulty": difficulty,
            "correct": correct,
            "timestamp": "now" # In real app use datetime
        })

    def get_weak_concepts(self, threshold: float = 0.4) -> List[str]:
        return [c for c, score in self.concept_mastery.items() if score < threshold]

    def to_dict(self) -> Dict[str, Any]:
        return {
            "concept_mastery": self.concept_mastery,
            "error_patterns": self.error_patterns,
            "learning_speed": self.learning_speed,
            "confidence_score": self.confidence_score,
            "attempt_history": self.attempt_history
        }

    # Analytics Methods
    def overall_mastery_score(self) -> float:
        if not self.concept_mastery:
            return 0.0
        return statistics.mean(self.concept_mastery.values())

    def learning_velocity(self, window: int = 5) -> float:
        """Improvement rate over last N attempts (for same concepts)."""
        if len(self.attempt_history) < 2:
            return 0.0
        
        # Simple heuristic: Ratio of correct in last window vs previous window
        recent = self.attempt_history[-window:] # type: ignore
        correct_count = sum(1 for a in recent if a['correct'])
        return correct_count / len(recent) # 0 to 1 scale roughly

    def error_rate(self) -> float:
        if not self.attempt_history:
            return 0.0
        incorrect = sum(1 for a in self.attempt_history if not a['correct'])
        return incorrect / len(self.attempt_history)

    def improvement_trend(self) -> str:
        # Compare first half of history vs second half
        if len(self.attempt_history) < 10:
            return "Stable"
        mid = len(self.attempt_history) // 2
        first_half = self.attempt_history[:mid] # type: ignore
        second_half = self.attempt_history[mid:] # type: ignore
        
        acc1 = sum(1 for a in first_half if a['correct']) / len(first_half)
        acc2 = sum(1 for a in second_half if a['correct']) / len(second_half)
        
        if acc2 > acc1 + 0.1: return "Positive"
        if acc2 < acc1 - 0.1: return "Negative"
        return "Stable"

class KnowledgeGapAnalyzer:
    """
    Module to identify gaps and recommend remediation strategies.
    """
    def __init__(self, profile: LearnerProfile):
        self.profile = profile

    def analyze(self) -> Dict[str, Any]:
        weak_concepts = self.profile.get_weak_concepts(threshold=0.6)
        # Rank by lowest mastery
        ranked_weakness = sorted(weak_concepts, key=lambda c: self.profile.concept_mastery.get(c, 0))
        
        remediation_plan = []
        for concept in ranked_weakness:
            score = float(self.profile.concept_mastery.get(concept, 0.0))
            strategy = "General Review"
            if score < 0.3:
                strategy = "Foundational Lesson (Definitions & Syntax)"
            elif score < 0.5:
                strategy = "Targeted Practice Questions (Simple Application)"
            elif score < 0.7:
                strategy = "Mixed Difficulty Quiz (Strengthen Weakness)"
            
            remediation_plan.append({
                "concept": concept,
                "score": round(score, 2), # type: ignore
                "strategy": strategy
            })

        return {
            "weak_concept_ranking": ranked_weakness,
            "remediation_plan": remediation_plan,
            "overall_health": self.profile.improvement_trend()
        }

def select_difficulty(master_score: float, learning_velocity: float) -> str:
    """
    Probabilistic difficulty selection based on mastery and learning velocity.
    Formula: difficulty_score = (0.7 * master_score) + (0.3 * learning_velocity)
    """
    difficulty_score = (0.7 * master_score) + (0.3 * learning_velocity)
    
    if difficulty_score < 0.4:
        return "easy"
    elif difficulty_score < 0.7:
        return "medium"
    else:
        return "hard"

def select_next_question(profile: LearnerProfile, question_bank: Optional[List[Dict[str, Any]]] = None) -> Optional[Dict[str, Any]]:
    """
    Adaptive Question Selection Logic.
    1. Retrieve learner weak concepts.
    2. Select questions mapped to weakest concept.
    3. Adjust difficulty based on mastery and velocity.
    """
    weak_concepts = profile.get_weak_concepts(0.6)
    target_concept = weak_concepts[0] if weak_concepts else None
    
    # Filter bank by concept if target exists
    if question_bank is None:
        question_bank = []
    candidates = question_bank
    if target_concept:
        candidates = [q for q in question_bank if q.get('concept') == target_concept]
        if not candidates:
            # Fallback to general bank if no concept overlap
            candidates = question_bank
    
    if not candidates:
        return None

    # Determine optimal difficulty using probabilistic model
    current_mastery = profile.concept_mastery.get(target_concept, 0.5) if target_concept else profile.overall_mastery_score()
    current_velocity = profile.learning_velocity()
    
    target_difficulty = select_difficulty(current_mastery, current_velocity)
        
    # Find matching difficulty
    final_selection = [q for q in candidates if q.get('difficulty') == target_difficulty]
    
    # If no exact match, fallback to any candidate
    if not final_selection:
        import random
        return random.choice(candidates)
        
    import random
    return random.choice(final_selection)
