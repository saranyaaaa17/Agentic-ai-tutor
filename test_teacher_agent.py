import asyncio
import sys
import os

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend_python'))

from backend_python.agents.teacher_agent import teacher_agent

async def test_teacher_agent():
    print("=" * 60)
    print("TESTING TEACHER AGENT - QUESTION GENERATION")
    print("=" * 60)
    
    try:
        print("\n[TEST] Calling teacher_agent with:")
        print("  - Topic: DSA")
        print("  - Difficulty: intermediate")
        print("  - Mode: assessment")
        print("  - Num Questions: 3")
        print("\nWaiting for response...\n")
        
        result = await teacher_agent(
            topic="Data Structures and Algorithms",
            difficulty="intermediate",
            mode="assessment",
            history=[],
            weak_concepts=[],
            student_profile={},
            num_questions=3
        )
        
        print("\n" + "=" * 60)
        print("RESULT:")
        print("=" * 60)
        
        if result:
            print(f"\n✅ SUCCESS! Received response")
            print(f"\nKeys in response: {list(result.keys())}")
            
            if 'questions' in result:
                print(f"\n📝 Number of questions generated: {len(result['questions'])}")
                print("\nFirst question preview:")
                if result['questions']:
                    q = result['questions'][0]
                    print(f"  ID: {q.get('id')}")
                    print(f"  Question: {q.get('q', '')[:100]}...")
                    print(f"  Options: {len(q.get('options', []))} options")
                    print(f"  Answer: {q.get('ans')}")
                    print(f"  Difficulty: {q.get('difficulty')}")
            else:
                print("\n⚠️ WARNING: No 'questions' key in response")
                print(f"Response content: {result}")
        else:
            print("\n❌ FAILED: Received None/empty response")
            
    except Exception as e:
        print(f"\n❌ ERROR: {type(e).__name__}: {str(e)}")
        import traceback
        print("\nFull traceback:")
        traceback.print_exc()
    
    print("\n" + "=" * 60)

if __name__ == "__main__":
    asyncio.run(test_teacher_agent())
