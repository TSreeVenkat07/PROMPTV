import asyncio, json, re
from google import genai
from google.genai import types
from app.core.config import settings
from app.services.scorer import score_prompt
from app.services.cache import get_cached_result
from app.db.queries import save_prompt_async
from app.core.logging import logger
from app.services.graph import run_reasoning_graph

def safe_json_loads(text: str):
    """Robust JSON extraction and parsing."""
    try:
        return json.loads(text)
    except Exception:
        try:
            match = re.search(r'\{[\s\S]*\}', text)
            return json.loads(match.group()) if match else None
        except: return None

from app.services.security import scrub_pii

async def stream_analysis(prompt: str, mode: str):
    """
    Streams analysis using LangGraph-powered multi-agent reasoning.
    Includes initial scoring, neural caching, and PII masking.
    """
    try:
        # 0. Security Layer: Mask PII/Secrets
        original_prompt = prompt
        prompt = scrub_pii(prompt)
        
        logger.info("refinement_started", mode=mode, prompt_length=len(prompt))
        
        # 1. Immediate Quality Score (Before)
        before_score = score_prompt(prompt)
        yield f"data: {json.dumps({'type':'score','data':before_score})}\n\n"

        # 2. Semantic Cache Check
        cached, embedding = await get_cached_result(prompt)
        if cached:
            logger.info("cache_serving_result", mode=mode)
            # Normalize cache for 4-phase UI
            if "phase_1_perception" not in cached:
                 cached = {
                     "phase_1_perception": {"intent": mode, "confidence": 1.0, "assumptions": ["Cached result"]},
                     "phase_2_structuring": {"elements": ["prompt"], "confidence": 1.0},
                     "phase_3_analysis": {"reasoning": "Retrieved from neural cache", "error_intelligence": None},
                     "phase_4_insights": {
                         "whats_good": cached.get("whats_good", []),
                         "weak_areas": cached.get("weak_areas", []),
                         "refined_prompt": cached.get("refined", prompt)
                     }
                 }
            yield f"data: {json.dumps({'type': 'done', 'data': cached})}\n\n"
            yield "data: [DONE]\n\n"
            return

        # 3. Imperial Single-Pass Reasoning Engine
        logger.info("routing_to_imperial_engine", mode=mode)
        yield f"data: {json.dumps({'type': 'node', 'name': 'Imperial Engine'})}\n\n"
        
        result_raw = await run_reasoning_graph(prompt, mode)
        
        if not result_raw:
            raise Exception("Imperial Reasoning Engine failed to produce output")

        # --- SANITIZATION LAYER (V16.0) ---
        clean_result = result_raw
        try:
            parsed = safe_json_loads(result_raw)
            if parsed:
                insights = parsed.get("PHASE_4_INSIGHTS", parsed.get("phase_4_insights", {}))
                clean_result = insights.get("refined_prompt", insights.get("core_conclusion", result_raw))
                if isinstance(clean_result, dict):
                    clean_result = json.dumps(clean_result, indent=2)
        except: pass

        # 4. Stream the FULL JSON Result so frontend can parse phases
        chunk_size = 150
        for i in range(0, len(result_raw), chunk_size):
            chunk_data = result_raw[i:i+chunk_size]
            yield f"data: {json.dumps({'type': 'chunk', 'text': chunk_data})}\n\n"
            await asyncio.sleep(0.005)

        # 5. Post-Processing & Quality Scoring
        try:
            after_score = score_prompt(clean_result)
            yield f"data: {json.dumps({'type':'score','data':after_score})}\n\n"
            
            parsed_full = safe_json_loads(result_raw) or {"phase_4_insights": {"refined_prompt": clean_result}}
            yield f"data: {json.dumps({'type': 'done', 'data': parsed_full})}\n\n"
            
            asyncio.create_task(save_prompt_async(
                original_prompt, clean_result, after_score["total"], mode, embedding, parsed_full
            ))
        except Exception as e:
            logger.error(f"Post-processing failed: {e}")
            yield f"data: {json.dumps({'type': 'done', 'data': {}})}\n\n"

    except Exception as e:
        logger.error(f"Streaming error: {e}")
        yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"
