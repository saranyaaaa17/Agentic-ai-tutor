
import asyncio
from agents.chat_agent import chat_agent
from dotenv import load_dotenv

load_dotenv()

async def test():
    print("Testing Socratic Chat Agent...")
    try:
        response = await chat_agent(
            message="Explain Binary Search simply.", 
            history=[], 
            complexity=1, 
            socratic_mode=True
        )
        print("Success! Response:")
        print(response.get('response'))
        print(f"Thinking steps: {response.get('thinking_steps')}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(test())
