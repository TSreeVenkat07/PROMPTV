import json
from app.db.connection import get_pool
from app.core.logging import logger

async def save_prompt_async(original: str, refined: str, score: int, mode: str, embedding=None, analysis_data=None):
    """Save prompt + embedding + structured analysis data to Neon. Returns inserted ID."""
    pool = get_pool()
    analysis_json = json.dumps(analysis_data) if analysis_data else '{}'
    try:
        if embedding:
            row = await pool.fetchrow("""
                INSERT INTO prompts (original, refined, quality_score, mode, embedding, analysis_data)
                VALUES ($1, $2, $3, $4, $5::vector, $6::jsonb)
                RETURNING id
            """, original, refined, int(score), mode, str(embedding), analysis_json)
        else:
            row = await pool.fetchrow("""
                INSERT INTO prompts (original, refined, quality_score, mode, analysis_data)
                VALUES ($1, $2, $3, $4, $5::jsonb)
                RETURNING id
            """, original, refined, int(score), mode, analysis_json)
        
        inserted_id = row["id"] if row else None
        logger.info("prompt_saved_to_db", id=str(inserted_id), mode=mode, score=score)
        return inserted_id
    except Exception as e:
        logger.error("DB_SAVE_FAILED", error=str(e), mode=mode)
        return None

async def get_templates():
    pool = get_pool()
    try:
        return await pool.fetch("SELECT id, name, category, content, tags FROM templates")
    except Exception as e:
        logger.error("get_templates_failed", error=str(e))
        return []

async def get_template_by_id(template_id: str):
    pool = get_pool()
    try:
        return await pool.fetchrow("SELECT * FROM templates WHERE id = $1", template_id)
    except Exception as e:
        logger.error("get_template_failed", error=str(e))
        return None

async def get_prompt_versions(prompt_id: str):
    pool = get_pool()
    try:
        return await pool.fetch("""
            SELECT version_number, content, score, diff_summary, created_at
            FROM prompt_versions WHERE prompt_id = $1
            ORDER BY version_number DESC
        """, prompt_id)
    except Exception as e:
        logger.error("get_versions_failed", error=str(e))
        return []

async def get_recent_prompts(limit: int = 10):
    """Get recent prompts for history display."""
    pool = get_pool()
    try:
        rows = await pool.fetch("""
            SELECT id, original, refined, quality_score, mode, created_at
            FROM prompts ORDER BY created_at DESC LIMIT $1
        """, limit)
        return [dict(r) for r in rows]
    except Exception as e:
        logger.error("get_recent_prompts_failed", error=str(e))
        return []

async def get_prompts_by_mode(mode: str, limit: int = 20):
    """Get prompts filtered by mode."""
    pool = get_pool()
    try:
        rows = await pool.fetch("""
            SELECT id, original, refined, quality_score, mode, analysis_data, created_at
            FROM prompts WHERE mode = $1
            ORDER BY created_at DESC LIMIT $2
        """, mode, limit)
        return [dict(r) for r in rows]
    except Exception as e:
        logger.error("get_prompts_by_mode_failed", error=str(e), mode=mode)
        return []
