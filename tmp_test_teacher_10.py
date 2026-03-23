
import asyncio
import sys
import os

# Add the backend_python directory to sys.path
sys.path.append(r'c:\Users\pothi\Desktop\agentic ai tutor\backend_python')

from agents.teacher_agent import teacher_agent

async def test():
    print("Testing Teacher Agent for 10 Questions...")
    try:
        result = await teacher_agent(
            topic="Operating System Kernel Design",
            difficulty="advanced",
            mode="assessment",
            num_questions=10
        )
        print("Result received:")
        print(f"Number of questions: {len(result.get('questions', []))}")
        if len(result.get('questions', [])) < 10:
             print("WARNING: Fewer than 10 questions returned!")
             print(result)
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(test())
