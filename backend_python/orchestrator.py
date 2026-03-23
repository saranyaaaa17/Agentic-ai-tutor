import asyncio
from typing import Dict, List, Any, Optional
from fastapi import BackgroundTasks
from agents.teacher_agent import teacher_agent
from agents.evaluator_agent import evaluator_agent
from agents.knowledge_gap_agent import knowledge_gap_agent
from agents.strategy_agent import strategy_agent
from learner_profile import LearnerProfile

class TutorOrchestrator:
    """
    Central Orchestrator to manage the adaptive tutoring loop.
    Coordinates between Teacher, Evaluator, GapAnalysis, and Strategy agents.
    Maintains and updates the LearnerProfile state across interactions.
    """
    
    async def detect_mode(self, user_input: str, current_mode: Optional[str] = None) -> str:
        """
        Detects the learning mode based on user input or current context.
        Modes: 'mastery', 'problem_solving', 'exam_prep'
        """
        if current_mode in ["mastery", "problem_solving", "exam_prep"]:
            return current_mode
            
        user_input = user_input.lower()
        
        mastery_keywords = ["learn", "concept", "mastery", "understand", "theory", "deep dive"]
        problem_keywords = ["problem", "solve", "coding", "practice", "challenge", "dsa", "sql"]
        exam_keywords = ["exam", "test", "interview", "prep", "mock", "competitive"]
        
        if any(w in user_input for w in mastery_keywords):
            return "mastery"
        if any(w in user_input for w in problem_keywords):
            return "problem_solving"
        if any(w in user_input for w in exam_keywords):
            return "exam_prep"
            
        return "mastery" # Default

    async def run_mastery_flow(self, topic: str, student_profile: Dict[str, Any], difficulty: str) -> Dict[str, Any]:
        """Specific combination for Concept Mastery (Teacher + Strategy)"""
        print(f"[Orchestrator] 🧠 Mode: Mastery. Flow: Teacher + Strategy")
        # Logic for mastery - focuses on explanation and building foundation
        return await self.process_teach_request(topic, student_profile, difficulty, mode="teach")

    async def run_problem_solving_flow(self, topic: str, student_profile: Dict[str, Any], difficulty: str) -> Dict[str, Any]:
        """Specific combination for Problem Solving (Teacher as Problem Setter + Evaluator)"""
        print(f"[Orchestrator] 💻 Mode: Problem Solving. Flow: Teacher(Setter) + Evaluator")
        # Logic for problem solving - focuses on challenges and logic evaluation
        return await self.process_teach_request(topic, student_profile, difficulty, mode="assessment")

    async def run_exam_prep_flow(self, topic: str, student_profile: Dict[str, Any], difficulty: str) -> Dict[str, Any]:
        """Specific combination for Exam Prep (Evaluator as Interviewer + Strategy)"""
        print(f"[Orchestrator] 🎯 Mode: Exam Prep. Flow: Evaluator(Interviewer) + Strategy")
        # Logic for exam prep - focuses on simulation and readiness
        return await self.process_teach_request(topic, student_profile, difficulty, mode="exam")

    async def process_teach_request(self, topic: str, student_profile: Dict[str, Any], difficulty: str = "beginner", mode: str = "teach", num_questions: int = 3) -> Dict[str, Any]:
        """
        Orchestrates the teaching flow.
        1. Contextualize based on profile (weaknesses, history).
        2. Call TeacherAgent.
        """
        print(f"[Orchestrator] 🎓 Processing Teach Request: {topic} ({mode})")
        
        # Extract relevant context from profile
        weak_concepts = []
        history = []
        if student_profile:
            profile_obj = LearnerProfile(**student_profile)
            weak_concepts = profile_obj.get_weak_concepts()
            # formatting history if needed, for now passing raw attempts might be too big, 
            # TeacherAgent expects list of dicts.
            history = profile_obj.attempt_history[-5:] # Last 5 attempts context
            
        response = await teacher_agent(
            topic=topic,
            difficulty=difficulty,
            mode=mode,
            history=history,
            weak_concepts=weak_concepts,
            student_profile=student_profile,
            num_questions=num_questions
        )
        
        return response

    async def run_full_learning_cycle(self, question: str, user_answer: str, topic: str, correct_answer: str, concepts: List[str], learner_profile: Dict[str, Any], background_tasks: BackgroundTasks = None) -> Dict[str, Any]:
        """
        Executes the full agentic learning cycle:
        1. Evaluate correctness & Update Profile (EvaluatorAgent)
        2. Detect Gaps & Trigger Strategy (StrategyAgent) if needed
        3. Return unified structured response
        """
        print(f"[Orchestrator] 🔄 Running Full Learning Cycle for: {topic}")
        
        # 1. Evaluation & Profile Update
        evaluation = await evaluator_agent(
            question=question,
            user_answer=user_answer,
            topic=topic,
            correct_answer=correct_answer,
            concepts=concepts,
            student_profile_data=learner_profile
        )
        
        updated_profile = evaluation.get("updated_student_profile", learner_profile)
        weak_concepts = evaluation.get("weak_concepts", [])
        
        # 2. Strategy / Gap Logic (Decoupled & Backgrounded)
        strategy = {"status": "omitted_for_speed"}
        
        # If the answer is incorrect, we decouple Knowledge Gap & Strategy logic to run in the background
        def queue_background_strategy():
            async def _run_strategy():
                print("[Background Orchestrator] ⚠️ Generating Remediation Strategy async...")
                try:
                    # Run Knowledge Gap Agent explicitly if incorrect
                    print(f"[Background Orchestrator] 🔍 Running Knowledge Gap Diagnostics for: {topic}")
                    await knowledge_gap_agent([{ "question": question, "options": [] }], {question: user_answer}, topic)
                    
                    profile_obj = LearnerProfile(**updated_profile)
                    # Run Strategy Agent to build roadmap
                    strat = await strategy_agent(
                         proficiency_level="intermediate", 
                         weak_concepts=weak_concepts,
                         topic=topic,
                         mastery_profile=profile_obj.concept_mastery,
                         meta_cognition="balanced",
                         learning_speed="medium",
                         confidence_score=profile_obj.confidence_score
                    )
                    print(f"[Background Orchestrator] ✅ Background Strategy task complete: {strat.get('primary_concept', 'done')}")
                except Exception as e:
                    print(f"[Background Orchestrator ERROR] {e}")

            # Fire off the async task into the running event loop without blocking the return
            asyncio.create_task(_run_strategy())

        if evaluation.get("remediation_suggestion") or (not evaluation.get("correct") and weak_concepts):
            strategy = {"status": "enqueued_in_background"}
            if background_tasks:
                background_tasks.add_task(queue_background_strategy)
            else:
                queue_background_strategy()

        return {
            "evaluation": evaluation,
            "weak_concepts": weak_concepts,
            "strategy": strategy,
            "updated_profile": updated_profile
        }

    # Alias for backward compatibility if needed, or redirect
    async def process_answer_submission(self, *args, **kwargs):
        # Map arguments to new method signature if they differ significantly, 
        # but they are very similar. 'student_profile' -> 'learner_profile'
        # Let's simple redirect or keep separate to be safe.
        # Actually, let's just make process_answer_submission call this new one.
        return await self.run_full_learning_cycle(
            question=kwargs.get('question'),
            user_answer=kwargs.get('user_answer'),
            topic=kwargs.get('topic'),
            correct_answer=kwargs.get('correct_answer'),
            concepts=kwargs.get('concepts'),
            learner_profile=kwargs.get('student_profile')
        )

    async def detect_intent(self, user_input: str) -> str:
        """
        Rule-based intent detection.
        Ex: "quiz me" -> assess, "teach me recursion" -> teach
        """
        user_input = user_input.lower()
        
        assess_keywords = ["quiz", "test", "assess", "problem", "solve", "exam", "question"]
        teach_keywords = ["teach", "learn", "explain", "concept", "what is", "how do i"]
        doubt_keywords = ["doubt", "stuck", "why", "error", "bug", "help"]
        review_keywords = ["review", "progress", "weak", "summary", "stats", "history"]
        strategy_keywords = ["plan", "strategy", "roadmap", "guide", "path"]
        
        if any(w in user_input for w in assess_keywords):
            return "assess"
        if any(w in user_input for w in teach_keywords):
            return "teach"
        if any(w in user_input for w in doubt_keywords):
            return "doubt"
        if any(w in user_input for w in review_keywords):
            return "review"
        if any(w in user_input for w in strategy_keywords):
            return "strategy"
            
        return "teach" # Default to teaching/chat

    async def run_assessment_flow(self, topic: str, learner_profile: Dict[str, Any], num_questions: int = 3) -> Dict[str, Any]:
        """
        Wrapper to start/generate an assessment session.
        """
        return await self.process_teach_request(topic, learner_profile, mode='assessment', num_questions=num_questions)

    async def run_teaching_flow(self, topic: str, learner_profile: Dict[str, Any]) -> Dict[str, Any]:
        """
        Wrapper to start a teaching session.
        """
        return await self.process_teach_request(topic, learner_profile, mode='teach')

    async def run_review_flow(self, topic: str, learner_profile: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generates a review/strategy summary.
        """
        profile_obj = LearnerProfile(**learner_profile)
        weak_concepts = profile_obj.get_weak_concepts()
        
        strategy = await strategy_agent(
            proficiency_level="intermediate", 
            weak_concepts=weak_concepts, 
            topic=topic,
            mastery_profile=profile_obj.concept_mastery,
            learning_speed="medium",
            confidence_score=profile_obj.confidence_score
        )
        return {"review": strategy, "mode": "review"}
        
    async def handle_request(self, user_input: str, topic: str, learner_profile: Dict[str, Any], current_mode: Optional[str] = None) -> Dict[str, Any]:
        """
        Main dynamic entry point based on intent and mode.
        """
        intent = await self.detect_intent(user_input)
        mode = await self.detect_mode(user_input, current_mode)
        
        print(f"[Orchestrator] 🧠 Context: Intent={intent}, Mode={mode}")

        if mode == "mastery":
             return await self.run_mastery_flow(topic, learner_profile, difficulty="intermediate")
        elif mode == "problem_solving":
             return await self.run_problem_solving_flow(topic, learner_profile, difficulty="intermediate")
        elif mode == "exam_prep":
             return await self.run_exam_prep_flow(topic, learner_profile, difficulty="hard")
        
        # Fallback to intent-based if mode not specifically matched
        if intent == "assess":
            return await self.run_assessment_flow(topic, learner_profile)
        elif intent == "teach":
            return await self.run_teaching_flow(topic, learner_profile)
        else:
            return await self.run_teaching_flow(topic, learner_profile)

    async def run_gap_analysis_session(self, questions: List[Dict], answers: Dict, topic: str) -> Dict[str, Any]:
        """
        Runs a full batch session analysis (e.g. after a quiz).
        """
        print(f"[Orchestrator] 📊 Running Batch Gap Analysis for {topic}")
        analysis = await knowledge_gap_agent(questions, answers, topic)
        
        # New: Trigger Strategy for Batch results
        strategy = await strategy_agent(
            proficiency_level=analysis.get("proficiency_level", "intermediate"),
            weak_concepts=analysis.get("weak_concepts", []),
            topic=topic,
            mastery_profile=analysis.get("mastery_profile", {}),
            meta_cognition=analysis.get("thinking_pattern", "balanced"),
            learning_speed="medium", # Default
            confidence_score=0.5 # Default for batch
        )
        
        return {
            "analysis": analysis,
            "strategy": strategy
        }

# Singleton Instance
orchestrator = TutorOrchestrator()
