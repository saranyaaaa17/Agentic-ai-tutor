
import asyncio
import os
import sys

# Ensure backend_python is in path
sys.path.append(os.path.join(os.getcwd(), 'backend_python'))

from agents.teacher_agent import teacher_agent

async def test():
    print("Testing Teacher Agent...")
    try:
        res = await teacher_agent(topic="Python Lists", difficulty="intermediate", mode="assessment", num_questions=2)
        print("Response received!")
        import json
        print(json.dumps(res, indent=2))
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(test())
