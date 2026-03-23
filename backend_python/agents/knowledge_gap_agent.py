import os
import json
import re
from groq import AsyncGroq
from dotenv import load_dotenv
from typing import Dict, Any, List
# Fix import to use relative path if in package or absolute
try:
    from agents.concept_network import concept_graph
except ImportError:
    from concept_network import concept_graph

# Load env variables
load_dotenv()

class KnowledgeGapAgent:
    def __init__(self):
        # Verify API Key
        key = os.environ.get("GROQ_API_KEY")
        if not key:
            print("[ERROR] CRITICAL: GROQ_API_KEY is missing!")
        
        self.client = AsyncGroq(api_key=key)
        self.model = "llama-3.3-70b-versatile"
        print(f"[KnowledgeGapAgent] Initialized with model: {self.model}")

    async def _call_llm(self, messages: List[Dict[str, str]], temperature: float = 0.5) -> str:
        """Core LLM Call Wrapper with explicit error handling"""
        try:
            print(f"[KnowledgeGapAgent] [CALL] Calling Groq API...")
            completion = await self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                temperature=temperature
            )
            content = completion.choices[0].message.content
            print(f"[KnowledgeGapAgent] [SUCCESS] Received len: {len(content)}")
            return content
        except Exception as e:
            print(f"[KnowledgeGapAgent] [ERROR] LLM Error: {e}")
            raise e

    def _parse_json(self, content: str) -> Dict:
        """Robust JSON Parser"""
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
        except json.JSONDecodeError:
            print(f"[KnowledgeGapAgent] [WARN] JSON Parse Failed. Raw content start: {content[:100]}...")
            return None

    async def analyze(self, questions: List[Dict], answers: Dict[str, str], topic: str) -> Dict:
        print(f"\n--- [KnowledgeGap Analysis] Topic: {topic} ---")
        
        # 1. Initialize Concept Tracking
        concept_scores = {}  # {concept: float_mastery_probability}
        detected_weaknesses = []

        # Format input for LLM
        attempt_data = []
        correct_count = 0
        
        for idx, q in enumerate(questions):
            user_ans = answers.get(str(idx)) or answers.get(idx)
            is_correct = user_ans == q.get('ans')
            if is_correct: correct_count += 1
            
            # Extract concept from question (fallback to topic if missing)
            # The TeacherAgent ideally tagged these, but if not, use topic
            concept_tag = q.get('concept') or q.get('tag') or topic.lower()
            
            # 2. Bayesian Update of Mastery
            current_prob = concept_scores.get(concept_tag, 0.5)
            new_prob = concept_graph.calculate_mastery_probability(current_prob, is_correct)
            concept_scores[concept_tag] = new_prob

            # 3. Meta-Cognition Analysis (New)
            # Assuming Evaluator gives us a confidence, BUT for gap analysis on raw quiz data we might not have it per-Q yet.
            # If 'confidence' is in the question data (e.g. user selected it), use it. Default to 0.5.
            user_conf = q.get('confidence', 0.5) 
            meta_state = concept_graph.analyze_meta_cognition(is_correct, user_conf)
            
            # 4. Check Prerequisites Risk (New)
            prereq_risk = concept_graph.calculate_failure_risk(concept_tag, concept_scores)
            
            attempt_data.append({
                "question": q.get('q'),
                "is_correct": is_correct,
                "concept": concept_tag,
                "mastery_probability": new_prob,
                "meta_cognition": meta_state,
                "prerequisite_failure_risk": prereq_risk
            })
            
        # 5. Calculate Metrics
        score_percent = (correct_count / len(questions)) * 100 if questions else 0
        
        # 6. Get Next Logical Topic for Guidance
        next_linear_topic = concept_graph.get_next_topic(topic)
        
        # Construct Prompt with Data-Driven Context
        system_prompt = f"""
        You are a knowledge gap detection agent.

        Input:
        - Topic: {topic}
        - Overall Score: {score_percent}%
        - Concept mastery map: {json.dumps(concept_scores)}
        - Attempt history: {json.dumps(attempt_data)}
        - Static Curriculum Next Topic: {next_linear_topic or "End of track"}
        - ATTAINABLE PATHS (Only recommend these):
          [dsa]: arrays, strings, linked-list, stacks-queues, trees, graphs, dp
          [programming]: c, cpp, java, python, javascript
          [web]: html, css, react
          [dbms]: sql_basics, select, normalization
          [os]: processes, threads, deadlocks
          [ml]: linear_regression, neural_networks, cnn, nlp

        Tasks:
        1. Identify concepts with mastery < 0.5.
        2. Detect recurring error patterns.
        3. Predict future risk areas.
        4. Recommend a RELEVANT next topic using PERFORMANCE-BASED LOGIC:
           - TIER A (Score < 40%): CRITICAL REMEDIATION. Recommend the most basic prerequisite for this topic (e.g., If topic is C, recommend 'Basic Syntax').
           - TIER B (Score 40-70%): TARGETED REINFORCEMENT. Recommend the SAME topic but with a focus on the weakest concept (e.g., If failed Pointers in C, recommend 'Pointers & Memory').
           - TIER C (Score 70-90%): PROGRESSION. Recommend the Static Curriculum Next Topic: '{next_linear_topic}'.
           - TIER D (Score > 90%): ACCELERATION. Recommend TWO steps ahead in the curriculum or a related advanced domain.
        5. Output structured JSON:

        {{
            "proficiency_level": "Beginner/Intermediate/Advanced",
            "proficiency_description": "Summary of level.",
            "strong_concepts": ["concept1", ...],
            "weak_concepts": ["concept2", ...],
            "priority_concepts": ["critical_concept_1"],
            "risk_level": "low/medium/high",
            "thinking_pattern": "Analysis of meta-cognition.",
            "gap_analysis": "Detailed explanation.",
            "recommended_focus": "The title of the NEXT topic (curated for relevance).",
            "recommendation_reason": "1-sentence justification based on specific errors or performance.",
            "learning_path_suggestion": ["Step 1", "Step 2"]
        }}
        """

        # Generation Loop
        for attempt in range(3):
            try:
                messages = [
                    {"role": "system", "content": "You are a strict JSON-speaking Knowledge Gap Analyzer."},
                    {"role": "user", "content": system_prompt}
                ]
                
                if attempt > 0:
                    messages.append({
                        "role": "user", 
                        "content": "Previous JSON was invalid. Return STRICT JSON only."
                    })

                # Call LLM
                raw_response = await self._call_llm(messages, temperature=0.4)
                
                # Parse
                data = self._parse_json(raw_response)
                
                # Validate
                if data:
                    print(f"[KnowledgeGapAgent] [SUCCESS] Analysis generated (Attempt {attempt+1})")
                    # Inject Data
                    data["mastery_profile"] = concept_scores
                    # Synthesize meta-cognition profile from attempt_data manually if needed, or rely on LLM thinking_pattern
                    # For now, let's just ensure the thinking_pattern is passed
                    return data
                
            except Exception as e:
                print(f"[KnowledgeGapAgent] [ERROR] Attempt {attempt+1} Exception: {e}")
        
        # Fallback
        return {
            "proficiency_level": "Unknown",
            "proficiency_description": "Could not analyze at this time.",
            "strong_concepts": [],
            "weak_concepts": [],
            "gap_analysis": "System error during analysis.",
            "recommended_focus": "Retry later."
        }

    async def diagnose_mistake(self, question: str, student_answer: str, evaluator_output: Dict) -> Dict:
        """
        Deep dive diagnosis for a single mistake.
        Expected triggers: Low score or conceptual error from Evaluator.
        """
        print(f"\n--- [KnowledgeGap Diagnosis] Question: {question[:30]}... ---")
        
        # Construct Prompt from User Request
        # Construct Prompt from User Request
        evaluator_str = json.dumps(evaluator_output, indent=2)
        system_prompt = f"""
        You are a Knowledge Gap Diagnosis Agent.

        Your task:
        1. Analyze the Evaluator Output (specifically 'error_type' and 'weak_concepts').
        2. Diagnosis the Root Cause of the mistake.
        3. Identify if this is a PREREQUISITE failure (e.g. valid syntax but wrong logic = prerequisite issue?).
        4. Suggest a targeted micro-topic for immediate review.

        INPUT:
        Question: {question}
        Student Answer: {student_answer}
        Evaluator Output: {evaluator_str}

        OUTPUT FORMAT (STRICT JSON):
        {{
          "root_cause": "brief explanation of WHY they made this specific error type",
          "missing_concept": "specific sub-topic (e.g. 'recursion base case')",
          "prerequisite_needed": true/false, 
          "recommended_review_topic": "topic name"
        }}
        """

        # Generation Loop
        for attempt in range(3):
            try:
                messages = [
                    {"role": "system", "content": "You are a strict JSON-speaking Diagnostic Specialist."},
                    {"role": "user", "content": system_prompt}
                ]
                
                if attempt > 0:
                    messages.append({
                        "role": "user", 
                        "content": "Previous JSON was invalid. Return STRICT JSON only."
                    })

                # Call LLM
                raw_response = await self._call_llm(messages, temperature=0.3)
                
                # Parse
                data = self._parse_json(raw_response)
                
                # Validate
                if data and "root_cause" in data:
                    print(f"[KnowledgeGapAgent] [SUCCESS] Diagnosis generated (Attempt {attempt+1})")
                    return data
                
            except Exception as e:
                print(f"[KnowledgeGapAgent] [ERROR] Diagnosis Attempt {attempt+1} Exception: {e}")

        # Fallback
        return {
            "root_cause": "Could not diagnose specific cause.",
            "missing_concept": "General Review",
            "prerequisite_needed": False,
            "recommended_review_topic": "Fundamental Concepts"
        }

# Instantiate Singleton
gap_agent = KnowledgeGapAgent()

# Wrapper function for bulk analysis
async def knowledge_gap_agent(questions: List, answers: Dict, topic: str):
    return await gap_agent.analyze(questions, answers, topic)

# Wrapper function for single mistake diagnosis
async def diagnostic_agent(question: str, user_answer: str, evaluator_output: Dict):
    return await gap_agent.diagnose_mistake(question, user_answer, evaluator_output)
