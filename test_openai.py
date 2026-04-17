
import asyncio
import os
from openai import AsyncOpenAI
from dotenv import load_dotenv

load_dotenv()

async def test():
    key = os.environ.get("OPENAI_API_KEY")
    if not key:
        print("OPENAI_API_KEY missing!")
        return
    
    client = AsyncOpenAI(api_key=key)
    try:
        print("Testing OpenAI...")
        res = await client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": "Say hello!"}],
            max_tokens=10
        )
        print("Success!")
        print(res.choices[0].message.content)
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(test())
