import asyncio
import os
import sys

# Add current directory to path so we can import app
sys.path.append(os.getcwd())

from app.services.cache import get_embedding
from dotenv import load_dotenv

load_dotenv()

async def verify_fix():
    print("Verifying RAG Embedding Fix...")
    prompt = "Test prompt for verification " + os.urandom(4).hex()
    vector = await get_embedding(prompt)
    
    if vector and len(vector) == 768:
        print(f"✅ SUCCESS: Generated {len(vector)}-dimension embedding.")
    else:
        print(f"❌ FAILED: Vector is {len(vector) if vector else 'None'}")

if __name__ == "__main__":
    asyncio.run(verify_fix())
