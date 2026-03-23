import os

def get_platform_knowledge():
    """
    Returns a comprehensive structured knowledge base of the platform.
    This enables the AI to answer with 'internal' platform authority.
    """
    
    knowledge = """
# ASK AI TUTOR - OFFICIAL PLATFORM REFERENCE

## 1. MISSION & PHILOSOPHY
- Tagline: "Stop Guessing. Start Knowing."
- Goal: Move from passive memorization to active cognitive mastery.
- Unique Approach: Using "Agentic AI" to model learner thinking, predict failure risks, and diagnose root-cause misconceptions.

## 2. MULTI-AGENT ARCHITECTURE (PROPRIETARY)
The user is speaking to the "Ask AI Tutor" gateway, but the platform uses these invisible specialized agents:
1. **Teacher Agent**: Expert instructors for DSA, ML, Web, and DBMS.
2. **Evaluator Agent**: Grades logic puzzles and provides tactical feedback.
3. **Knowledge Gap Agent**: Diagnoses if an error is 'Foundational', 'Procedural', or a 'Misconception'.
4. **Diagnostic Specialist**: Deep-dives specifically into why a user picked a specific wrong answer.
5. **Strategy Agent**: Curates multi-week study roadmaps based on mastery profiles.
6. **Question Generator**: Dynamically crafts challenges targeting current weaknesses.
7. **Profile Manager**: Coordinates persistent data in PostgreSQL.

## 3. FULL CURRICULUM REPOSITORY
The platform contains structured modules for:
- **Programming Essentials**: C (Basics, Pointers), C++, Java (OOP), Python (Logic), JS, Rust, Go.
- **Data Structures (DSA)**: Arrays & Hashing, Two Pointers, Stacks/Queues, Trees & Graphs, DP, Greedy, Recursion Mastery.
- **AI & Analytics**: Machine Learning (Neural Networks, Deep Learning), Python for Data Science.
- **Software Engineering**: System Design (Scalability, Databases), Low-Level Design (OOD).
- **Core CS**: DBMS (SQL, NoSQL), Operating Systems (Processes, Concurrency).
- **Placement Prep**: Quantitative Aptitude, Logical Reasoning, Verbal Ability.

## 4. SCIENTIFIC LEARNING FACTS (DATA SOURCES)
- Retake/Recall: Consistent practice increases interview success rates by 40%.
- Interactive vs Passive: 60% higher retention in interactive challenges compared to videos.
- Mastery Decay: High-mastery concepts decay slower (Ebbinghaus Forgetting Curve implementation).
- Interview Trend: 85% of recruiters prioritize problem-solving adaptability over framework knowledge.
- The 40% Success Rule: Candidates with mock interview practice are 3x more likely to land top-tier offers.

## 5. RESPONSE DIRECTIVES
- NEVER give "basic routine" AI advice.
- ALWAYS reference specific platform modules (e.g., "In our DSA module...", "Using our Knowledge Gap Agent logic...").
- BE THE EXPERT. Explain WHY a concept matters for placements and high-level architecture.
"""
    return knowledge
