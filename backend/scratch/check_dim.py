import asyncio
import os
from google import genai
from google.genai import types
from dotenv import load_dotenv

load_dotenv()

async def check_dimensions():
    api_key = os.getenv("GEMINI_API_KEY")
    client = genai.Client(api_key=api_key)
    model = "gemini-embedding-2"
    print(f"Checking dimensions for {model} with output_dimensionality=768...")
    try:
        res = await client.aio.models.embed_content(
            model=model,
            contents="test",
            config=types.EmbedContentConfig(output_dimensionality=768)
        )
        vector = res.embeddings[0].values
        print(f"Dimensions: {len(vector)}")
    except Exception as e:
        print(f"Error checking dimensions: {e}")

if __name__ == "__main__":
    asyncio.run(check_dimensions())
