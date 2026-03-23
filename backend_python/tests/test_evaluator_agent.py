import pytest
from agents.evaluator_agent import EvaluatorAgent
from learner_profile import LearnerProfile

# Mock Groq Client to avoid real API calls during tests
class MockGroqClient:
    def __init__(self, *args, **kwargs):
        pass
    
    class chat:
        class completions:
            @staticmethod
            def create(*args, **kwargs):
                class Message:
                    content = '{"correct": true, "confidence": 0.95, "reasoning": "Correct answer", "weak_concepts": [], "error_type": "none"}'
                class Choice:
                    message = Message()
                class Response:
                    choices = [Choice()]
                return Response()

@pytest.fixture
def evaluator():
    agent = EvaluatorAgent()
    # Inject mock client
    agent.client = MockGroqClient()
    return agent

def test_simple_evaluation_correct(evaluator):
    assert evaluator._simple_evaluation("4", "4") == True
    assert evaluator._simple_evaluation("hello world", "Hello World") == True
    assert evaluator._simple_evaluation("3.14", "3.14") == True

def test_simple_evaluation_incorrect(evaluator):
    # This method returns None if it's not an exact match or simple numeric, 
    # letting AI decide? No, strict mismatch on numeric should be False if simple eval covers it.
    # But current logic returns None if strict match fails, to be safe?
    # Let's check implementation:
    # if u == c: return True
    # try float: if equal return True
    # return None
    # So it is conservative. It never returns False, only True or None (fallback to AI).
    assert evaluator._simple_evaluation("5", "4") == None # Falls back to AI
    assert evaluator._simple_evaluation("recursion", "iteration") == None

def test_learner_profile_update_correct(evaluator):
    initial_profile = {
        "concept_mastery": {"loops": 0.5},
        "confidence_score": 0.5,
        "attempt_history": []
    }
    eval_result = {
        "correct": True,
        "weak_concepts": [],
        "confidence": 0.9
    }
    
    updated = evaluator.update_learner_profile(
        initial_profile, 
        eval_result, 
        topic="loops", 
        concepts=["loops"],
        difficulty="medium"
    )
    
    assert updated["concept_mastery"]["loops"] > 0.5
    assert updated["confidence_score"] > 0.5
    assert len(updated["attempt_history"]) == 1
    assert updated["attempt_history"][0]["correct"] == True

def test_learner_profile_update_incorrect(evaluator):
    initial_profile = {
        "concept_mastery": {"recursion": 0.6},
        "confidence_score": 0.6,
        "attempt_history": []
    }
    eval_result = {
        "correct": False,
        "weak_concepts": ["recursion"],
        "confidence": 0.8 # AI confidence that it is wrong
    }
    
    updated = evaluator.update_learner_profile(
        initial_profile, 
        eval_result, 
        topic="recursion", 
        concepts=["recursion"],
        difficulty="medium"
    )
    
    assert updated["concept_mastery"]["recursion"] < 0.6
    # Confidence might drop or stay similar depending on logic, but specific logic for confidence update
    # self.confidence_score = (self.confidence_score * (1 - alpha)) + (target * alpha)
    # target is 0.0 for incorrect. So it should drop.
    assert updated["confidence_score"] < 0.6
    assert len(updated["attempt_history"]) == 1
    assert updated["attempt_history"][0]["correct"] == False

def test_mastery_boundary_conditions(evaluator):
    # Test High Mastery Cap
    high_profile = {"concept_mastery": {"logic": 0.99}, "confidence_score": 0.5}
    res_high = {"correct": True}
    up_high = evaluator.update_learner_profile(high_profile, res_high, "logic", ["logic"])
    assert up_high["concept_mastery"]["logic"] <= 1.0
    
    # Test Low Mastery Floor
    low_profile = {"concept_mastery": {"logic": 0.01}, "confidence_score": 0.5}
    res_low = {"correct": False}
    up_low = evaluator.update_learner_profile(low_profile, res_low, "logic", ["logic"])
    assert up_low["concept_mastery"]["logic"] >= 0.0

