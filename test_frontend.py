import asyncio
import httpx
import sys

BASE = "http://localhost:8000"

def ok(msg): print(f"  [OK] {msg}", flush=True)
def fail(msg): print(f"  [FAIL] {msg}", flush=True)
def section(msg): print(f"\n{'='*55}\n {msg}\n{'='*55}", flush=True)

async def test_status():
    section("1. AGENT STATUS ENDPOINT /api/status")
    try:
        async with httpx.AsyncClient(timeout=10.0) as c:
            res = await c.get(f"{BASE}/api/status")
            if res.status_code == 200:
                data = res.json()
                agents = data.get("agents", [])
                ok(f"Status OK - {len(agents)} agents registered")
                for agent in agents:
                    print(f"     {agent.get('label','?')}: {agent.get('status','?')}")
            else:
                fail(f"HTTP {res.status_code}")
    except Exception as e:
        fail(str(e))

async def test_socratic():
    section("2. SOCRATIC AGENT /api/chat")
    try:
        async with httpx.AsyncClient(timeout=40.0) as c:
            res = await c.post(f"{BASE}/api/chat", json={
                "message": "What is a binary search tree?",
                "history": [],
                "complexity": 3,
                "socratic_mode": True
            })
            data = res.json()
            ok(f"HTTP {res.status_code}")
            ok(f"Response len={len(data.get('response',''))}") if data.get("response") else fail("No response")
            ok(f"Thinking steps={len(data.get('thinking_steps',[]))}") if data.get("thinking_steps") else fail("No thinking steps")
            print(f"\n  PREVIEW: {str(data.get('response',''))[:120]}\n")
    except Exception as e:
        fail(str(e))

async def test_gap_strategy():
    section("3. KNOWLEDGE GAP + STRATEGY AGENTS /api/gap-analysis")
    questions = [
        {"q": "Time complexity of binary search?", "ans": "O(log n)", "options": ["O(n)", "O(log n)", "O(n^2)"], "concepts": ["Binary Search"]},
        {"q": "Which data structure uses LIFO?", "ans": "Stack", "options": ["Queue", "Stack", "Heap"], "concepts": ["Stack"]},
        {"q": "What is a linked list node made of?", "ans": "Data and pointer", "options": ["Just data", "Data and pointer", "Just pointers"], "concepts": ["Linked List"]},
    ]
    answers = {"0": "O(n)", "1": "Stack", "2": "Just data"}
    try:
        async with httpx.AsyncClient(timeout=60.0) as c:
            res = await c.post(f"{BASE}/api/gap-analysis", json={
                "questions": questions,
                "answers": answers,
                "topic": "DSA"
            })
            data = res.json()
            ok(f"HTTP {res.status_code}")
            
            analysis = data.get("analysis", {})
            ok(f"Proficiency: {analysis.get('proficiency_level')}") if analysis.get("proficiency_level") else fail("No proficiency level")
            ok(f"Weak concepts: {analysis.get('weak_concepts')}") if analysis.get("weak_concepts") else fail("No weak concepts")
            ok(f"Gap analysis text present") if analysis.get("gap_analysis") else fail("No gap_analysis text")
            ok(f"Mastery profile: {analysis.get('mastery_profile')}") if analysis.get("mastery_profile") else fail("No mastery profile")
            
            strategy = data.get("strategy", {})
            if strategy:
                ok(f"Teaching style: {strategy.get('teaching_style')}")
                ok(f"Strategy summary present") if strategy.get("strategy_summary") else fail("No strategy_summary")
                ok(f"Roadmap phases: {len(strategy.get('roadmap',[]))}") if strategy.get("roadmap") else fail("No roadmap")
                ok(f"Recommended courses: {len(strategy.get('recommended_courses',[]))}") if strategy.get("recommended_courses") else fail("No recommended_courses")
            else:
                fail("Strategy Agent returned no data")
    except Exception as e:
        fail(str(e))

async def test_evaluate():
    section("4. EVALUATOR AGENT /api/evaluate")
    try:
        async with httpx.AsyncClient(timeout=40.0) as c:
            res = await c.post(f"{BASE}/api/evaluate", json={
                "question": "What is the time complexity of bubble sort?",
                "correct_answer": "O(n^2)",
                "user_answer": "O(n)",
                "topic": "Sorting",
                "student_profile": {"level": "Beginner"}
            })
            data = res.json()
            ok(f"HTTP {res.status_code}")
            # Handle nested or flat response
            is_correct = data.get("isCorrect") or data.get("evaluation", {}).get("isCorrect")
            feedback = data.get("feedback") or data.get("evaluation", {}).get("feedback") or ""
            ok(f"isCorrect: {is_correct}")
            ok(f"Feedback present (len={len(feedback)})") if feedback else fail("No feedback")
    except Exception as e:
        fail(str(e))

async def main():
    print("\n" + "="*55)
    print(" AI TUTOR - AGENT PIPELINE HEALTH CHECK")
    print("="*55)
    await test_status()
    await test_socratic()
    await test_gap_strategy()
    await test_evaluate()
    print("\n" + "="*55)
    print(" DONE")
    print("="*55 + "\n")

asyncio.run(main())
