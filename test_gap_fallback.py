
import asyncio
from agents.knowledge_gap_agent import knowledge_gap_agent
from dotenv import load_dotenv

load_dotenv()

async def test():
    print("Testing Knowledge Gap Agent with fallback...")
    questions = [
        {"q": "What is 1+1?", "ans": "2"},
        {"q": "What is 2+2?", "ans": "4"}
    ]
    answers = {"0": "2", "1": "unknown"}
    topic = "Simple Math"
    try:
        response = await knowledge_gap_agent(questions, answers, topic)
        print("Success! Gap Analysis:")
        print(f"Proficiency: {response.get('proficiency_level')}")
        print(f"Weak Concepts: {response.get('weak_concepts')}")
        print(f"Gap Analysis: {response.get('gap_analysis')}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(test())
