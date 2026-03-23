
import random
import time
from typing import Dict, List, Tuple
from agents.concept_network import ConceptNetwork

class LearnerSimulator:
    """
    Simulates learner behavior to stress-test the Adaptive Engine.
    """
    
    def __init__(self, profile_type: str):
        self.profile = profile_type
        self.network = ConceptNetwork()
        self.mastery_state = {} # {concept: probability}
        self.history = []
        
        # Profile Characteristics
        if profile_type == "fast_learner":
            self.learning_rate = 0.9  # High prob. of success
            self.retention_rate = 0.95 # Low Decay
        elif profile_type == "struggling_learner":
            self.learning_rate = 0.4 
            self.retention_rate = 0.7
        else: # Average
             self.learning_rate = 0.7
             self.retention_rate = 0.85

    def simulate_practice_session(self, day: int, concepts: List[str]):
        """
        Simulates a day of practice on specific concepts.
        """
        print(f"\n--- Day {day}: Practice Session ({self.profile}) ---")
        
        # 1. Apply Decay since last practice (simplified: assume daily decay check)
        for concept, score in self.mastery_state.items():
            decayed_score = self.network.calculate_decay(score, days_since_last_practice=1)
            if decayed_score < score:
                print(f"[DECAY]: {concept} dropped from {score} -> {decayed_score}")
            self.mastery_state[concept] = decayed_score

        # 2. Practice Concepts
        for concept in concepts:
            current_mastery = self.mastery_state.get(concept, 0.3)
            
            # Simulate Outcome (Probabilistic based on profile + current mastery)
            # Chance of success increases with mastery
            success_prob = (current_mastery * 0.5) + (self.learning_rate * 0.5)
            is_correct = random.random() < success_prob
            
            # Update Network
            new_mastery = self.network.calculate_mastery_probability(current_mastery, is_correct)
            self.mastery_state[concept] = new_mastery
            
            status = "[PASS]" if is_correct else "[FAIL]"
            print(f"Practice {concept}: {status} | Mastery: {current_mastery} -> {new_mastery}")
            
            # Check Dependencies
            prereqs = self.network.get_prerequisites(concept)
            if not is_correct and prereqs:
                print(f"   [Dependency Alert]: Check weak prereqs in {prereqs}")

    def run_simulation(self, days=7):
        """Standard Curriculum Simulation"""
        curriculum = [
            ["loops", "variables"], # Day 1
            ["loops", "arrays"],    # Day 2
            ["functions", "arrays"],# Day 3
            ["recursion"],          # Day 4 (Hard)
            ["recursion", "trees"], # Day 5
            ["dynamic_programming"],# Day 6 (Very Hard)
            ["dynamic_programming"] # Day 7
        ]
        
        for day in range(1, days + 1):
            todays_concepts = curriculum[min(day-1, len(curriculum)-1)]
            self.simulate_practice_session(day, todays_concepts)
            time.sleep(0.1) # Formatting pause

if __name__ == "__main__":
    print("Starting 1000-Learner Simulation (Sample Run)...")
    
    print("\n=== SIMULATION 1: The 'Fast Learner' ===")
    s1 = LearnerSimulator("fast_learner")
    s1.run_simulation(7)
    
    print("\n=== SIMULATION 2: The 'Struggling Learner' ===")
    s2 = LearnerSimulator("struggling_learner")
    s2.run_simulation(7)
