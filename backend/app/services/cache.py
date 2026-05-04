from google import genai
from google.genai import types
from app.db.connection import get_pool
from app.core.config import settings
from app.core.logging import logger

async def get_embedding(text: str):
    """Generate 768-dim embedding vector using native Google GenAI SDK."""
    try:
        client = genai.Client(api_key=settings.GEMINI_API_KEY)
        res = await client.aio.models.embed_content(
            model=settings.GEMINI_EMBEDDING_MODEL,
            contents=text[:1000],
            config=types.EmbedContentConfig(output_dimensionality=768)
        )
        if res and res.embeddings:
            vector = res.embeddings[0].values
            logger.info("embedding_generated", dimensions=len(vector))
            return vector
        return None
    except Exception as e:
        logger.warning("embedding_failed", error=str(e)[:80])
        return None

async def get_cached_result(prompt: str):
    """Semantic cache lookup. Returns (cached_result, embedding) tuple.
    
    Returns the embedding so the caller can reuse it for DB save
    without making a second API call.
    """
    embedding = None
    try:
        embedding = await get_embedding(prompt)
        if not embedding:
            logger.info("cache_skip_no_embedding")
            return None, None

        pool = get_pool()
        row = await pool.fetchrow("""
            SELECT original, refined, quality_score,
                   1 - (embedding <=> $1::vector) as similarity
            FROM prompts
            WHERE embedding IS NOT NULL
            ORDER BY embedding <=> $1::vector
            LIMIT 1
        """, str(embedding))

        if row and row["similarity"] is not None and row["similarity"] >= settings.CACHE_SIMILARITY_THRESHOLD:
            logger.info("cache_hit", similarity=round(row["similarity"], 3), original=row["original"][:50] + "...")
            return {
                "refined": row["refined"],
                "score": row["quality_score"],
                "cached": True
            }, embedding
        
        similarity = round(row["similarity"], 3) if row and row["similarity"] is not None else 0
        logger.info("cache_miss", highest_similarity=similarity)
        return None, embedding
    except Exception as e:
        logger.warning("cache_lookup_skipped", error=str(e)[:80])
        return None, embedding
