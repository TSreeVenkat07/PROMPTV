import asyncio
import os
import sys

sys.path.append(os.getcwd())

from app.services.cache import get_cached_result
from app.db.connection import init_pool, close_pool
from dotenv import load_dotenv

load_dotenv()

async def verify_rag():
    print("Verifying RAG Pipeline (Save & Hit)...")
    await init_pool()
    try:
        prompt = "Unique test prompt " + os.urandom(4).hex()
        
        # 1. First call (should miss, but generate embedding)
        print("First call (expecting miss)...")
        res, embedding = await get_cached_result(prompt)
        print(f"Embedding generated: {len(embedding) if embedding else 'None'}")
        
        if embedding:
             # Manually save it to DB so second call hits
             from app.db.queries import save_prompt_async
             await save_prompt_async(prompt, "Refined " + prompt, 90, "analyze", embedding, {})
             print("Saved to DB.")
             
             # 2. Second call (should HIT)
             print("Second call (expecting hit)...")
             res2, embedding2 = await get_cached_result(prompt)
             if res2 and res2.get("cached"):
                 print("✅ SUCCESS: RAG Hit detected!")
             else:
                 print("❌ FAILED: RAG Hit not detected.")
    finally:
        await close_pool()

if __name__ == "__main__":
    asyncio.run(verify_rag())
