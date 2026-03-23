
from typing import Dict, List, Optional

class ConceptNetwork:
    """
    A simple Concept Dependency Graph to model prerequisite relationships.
    Tracks concept dependencies and calculates cascading mastery updates.
    """
    
    # Static Graph Definition (Extensible)
    DEPENDENCIES = {
        # Programming Fundamentals (Language Agnostic / C focus)
        "variables": [],
        "control_flow": ["variables"],
        "loops": ["control_flow"],
        "functions": ["control_flow"],
        "pointers": ["variables", "memory_management"],
        "memory_management": ["variables"],
        "structures": ["variables", "pointers"],
        "file_io": ["functions", "streams"],
        
        # C Specific
        "c_programming": ["loops", "functions"],
        "dynamic_memory": ["pointers", "memory_management"],
        
        # C++ Specific
        "classes": ["functions", "structures"],
        "templates": ["classes", "functions"],
        "stl": ["classes", "containers"],
        "inheritance": ["classes"],
        
        # Data Structures
        "arrays": ["variables", "loops"],
        "linked_lists": ["classes", "pointers"],
        "stacks": ["arrays", "linked_lists"],
        "queues": ["arrays", "linked_lists"],
        "trees": ["linked_lists", "recursion"],
        "binary_search_trees": ["trees"],
        "graphs": ["trees", "arrays", "recursion"],
        "hash_maps": ["arrays", "functions"],
        "hashing": ["arrays", "functions"],
        
        # Algorithms
        "recursion": ["functions", "control_flow"],
        "sorting": ["arrays", "loops"],
        "searching": ["arrays", "loops"],
        "binary_search": ["searching", "arrays"],
        "dfs": ["graphs", "recursion", "stacks"],
        "bfs": ["graphs", "queues", "loops"],
        "dynamic_programming": ["recursion", "arrays", "memoization"],
        "memoization": ["recursion", "hash_maps"],
        
        # Web Development
        "html": [],
        "css": ["html"],
        "javascript": ["loops", "functions"],
        "dom_manipulation": ["javascript", "html"],
        "react": ["javascript", "components"],
        "hooks": ["react"],
        "state_management": ["react", "hooks"],
        
        # SQL / DBMS
        "sql_basics": [],
        "select": ["sql_basics"],
        "joins": ["select", "where"],
        "aggregates": ["select", "group_by"],
        "subqueries": ["select", "where", "joins"],
        "normalization": ["sql_basics"],
        "indexing": ["sql_basics"],
        
        # Operating Systems
        "processes": ["control_flow"],
        "threads": ["processes"],
        "deadlocks": ["threads", "mutex"],
        "memory_segmentation": ["memory_management"],
        "paging": ["memory_segmentation"],
        
        # Machine Learning
        "linear_regression": ["variables", "statistics"],
        "neural_networks": ["linear_regression", "calculus"],
        "cnn": ["neural_networks"],
        "nlp": ["neural_networks", "strings"]
    }

    def __init__(self):
        pass

    def get_prerequisites(self, concept: str) -> List[str]:
        """Returns direct prerequisites for a concept."""
        return self.DEPENDENCIES.get(concept.lower(), [])

    def get_all_dependencies(self, concept: str) -> List[str]:
        """Returns recursive list of all dependencies (ancestors)."""
        deps = set()
        queue = [concept.lower()]
        
        while queue:
            current = queue.pop(0)
            prereqs = self.DEPENDENCIES.get(current, [])
            for p in prereqs:
                if p not in deps:
                    deps.add(p)
                    queue.append(p)
        
        return list(deps)

    def calculate_mastery_probability(self, current_mastery: float, success: bool, complexity: float = 0.5) -> float:
        """
        Bayesian-inspired update for mastery probability.
        """
        prior = current_mastery
        
        # Likelihoods
        p_success_given_mastery = 0.9 - (0.1 * complexity)
        p_success_given_no_mastery = 0.2
        
        if success:
            likelihood = p_success_given_mastery
            marginal = (likelihood * prior) + (p_success_given_no_mastery * (1 - prior))
            posterior = (likelihood * prior) / marginal
        else:
            learning_rate = 0.15
            posterior = max(0.0, prior - learning_rate)

        return round(posterior, 4)

    def calculate_decay(self, current_mastery: float, days_since_last_practice: int) -> float:
        """
        Models concept decay over time using a simplified Ebbinghaus Forgetting Curve.
        
        Formula: Retention = e^(-time / strength)
        
        We approximate 'strength' with current_mastery. 
        Higher mastery = Slower decay.
        """
        import math
        
        if days_since_last_practice <= 0:
            return current_mastery
            
        # Decay constant (tuning parameter)
        # Low mastery (0.3) decays fast. High mastery (0.9) decays slow.
        stability = max(0.5, current_mastery * 10) 
        
        retention = math.exp(-days_since_last_practice / stability)
        
        # Apply decay to the probability
        new_mastery = current_mastery * retention
        
        return round(new_mastery, 4)

    def calculate_failure_risk(self, concept: str, mastery_profile: Dict[str, float]) -> float:
        """
        Predicts the risk of failing a target concept based on its prerequisites.
        Risk = 1.0 - (Average Mastery of Prerequisites)
        """
        prereqs = self.get_prerequisites(concept)
        if not prereqs:
            return 0.1 # Base risk for fundamental concepts
            
        total_mastery = 0.0
        weight_sum = 0.0
        
        for p in prereqs:
            mastery = mastery_profile.get(p, 0.3) # Default low mastery if unknown
            # Weighted importance: Direct prereqs matter most (simplified here as equal)
            total_mastery += mastery
            weight_sum += 1.0
            
        if weight_sum == 0: return 0.5
        
        avg_mastery = total_mastery / weight_sum
        risk = 1.0 - avg_mastery
        return round(risk, 2)

    def analyze_meta_cognition(self, is_correct: bool, confidence: float) -> str:
        """
        Classifies the learner's meta-cognitive state.
        confidence: 0.0 - 1.0
        """
        if is_correct:
            if confidence > 0.8: return "Mastery"
            if confidence > 0.5: return "Developing"
            return "Fragile Mastery (Lucky Guess?)"
        else:
            if confidence > 0.8: return "Misconception (Confident Wrong)" # CRITICAL
            if confidence > 0.5: return "Confusion"
            return "Unknown/Gap"

    # Define common learning paths to ensure topical relevance
    CURRICULUM_TRACKS = {
        "programming": ["variables", "control_flow", "loops", "functions", "pointers", "c", "cpp", "java", "python", "javascript"],
        "dsa": ["arrays", "strings", "linked-list", "stacks-queues", "trees", "graphs", "dp"],
        "web": ["html", "css", "javascript", "dom_manipulation", "react", "hooks", "state_management"],
        "dbms": ["sql_basics", "select", "joins", "aggregates", "subqueries", "normalization", "indexing"],
        "os": ["processes", "threads", "deadlocks", "memory_segmentation", "paging"],
        "ml": ["linear_regression", "neural_networks", "cnn", "nlp"]
    }

    def get_next_topic(self, current_topic: str, domain: Optional[str] = None) -> Optional[str]:
        """
        Suggests the next logical topic based on curriculum tracks.
        """
        topic_lower = current_topic.lower()
        
        # 1. Identify track
        track = []
        if domain and domain.lower() in self.CURRICULUM_TRACKS:
            track = self.CURRICULUM_TRACKS[domain.lower()]
        else:
            # Fallback: Find which track contains this topic
            for t_name, t_content in self.CURRICULUM_TRACKS.items():
                if topic_lower in t_content:
                    track = t_content
                    break
        
        if not track: return None
        
        # 2. Find current index and return next
        try:
            idx = track.index(topic_lower)
            if idx + 1 < len(track):
                return track[idx + 1]
        except ValueError:
            # If topic not exactly in track, find partial match
            for i, step in enumerate(track):
                if step in topic_lower or topic_lower in step:
                    if i + 1 < len(track): return track[i + 1]
        
        return None

# Singleton Instance
concept_graph = ConceptNetwork()
