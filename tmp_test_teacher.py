
import asyncio
import sys
import os

# Add the backend_python directory to sys.path
sys.path.append(r'c:\Users\pothi\Desktop\agentic ai tutor\backend_python')

from agents.teacher_agent import teacher_agent

async def test():
    print("Testing Teacher Agent...")
    try:
        result = await teacher_agent(
            topic="recursion",
            difficulty="beginner",
            mode="assessment",
            num_questions=2
        )
        print("Result received:")
        print(result)
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(test())
