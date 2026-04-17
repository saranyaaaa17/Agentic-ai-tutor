
import asyncio
import os
from agents.teacher_agent import AutonomousTeacher
from dotenv import load_dotenv

load_dotenv()

async def test():
    teacher = AutonomousTeacher()
    print("Testing Teacher Agent run...")
    try:
        # Request 1 question for testing
        response = await teacher.run(
            topic="Binary Search", 
            difficulty="intermediate", 
            mode="assessment", 
            num_questions=1
        )
        print("Success! Resource generated.")
        if "questions" in response:
            print(f"Questions: {len(response['questions'])}")
            print(f"Content: {response['questions'][0]['q']}")
        else:
            print(f"Response keys: {response.keys()}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(test())
