from fastapi import APIRouter, Query, Request, File, UploadFile, HTTPException, Response
from fastapi.responses import StreamingResponse
from app.models.schemas import AnalyzeRequest, GenerateRequest, RecoverRequest, ExportRequest, TemplateResponse, VersionResponse
from app.core.security import sanitize_input
from app.services.streaming import stream_analysis, safe_json_loads
from app.services.image_ocr import analyze_image
from app.services.exporter import export_prompt
from app.services.cache import get_embedding
from app.db.queries import get_templates, get_template_by_id, get_prompt_versions, get_recent_prompts, get_prompts_by_mode, save_prompt_async
from app.core.config import settings
from app.core.logging import logger
from slowapi import Limiter
from slowapi.util import get_remote_address
import uuid, json, re

router = APIRouter()
limiter = Limiter(key_func=get_remote_address)

@router.get("/history")
async def prompt_history(mode: str = None):
    """Get recent prompt refinements for Chronicles display."""
    if mode:
        rows = await get_prompts_by_mode(mode, 20)
    else:
        rows = await get_recent_prompts(20)
    return {"data": rows}

@router.get("/health")
async def health():
    return {"status": "ok"}

@router.get("/stream/analyze")
@limiter.limit(f"{settings.RATE_LIMIT_ANALYZE}/minute")
async def stream_analyze(
    request: Request,
    prompt: str = Query(min_length=10, max_length=4000),
    mode: str = Query(default="analyze")
):
    # Validate mode
    valid_modes = {"analyze", "build", "recovery"}
    if mode not in valid_modes:
        mode = "analyze"
    sanitize_input(prompt)
    return StreamingResponse(
        stream_analysis(prompt, mode),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
            "Connection": "keep-alive"
        }
    )

@router.post("/image-analyze")
@limiter.limit(f"{settings.RATE_LIMIT_IMAGE}/minute")
async def image_analyze_route(request: Request, file: UploadFile = File(...)):
    if file.content_type not in ["image/jpeg", "image/png", "image/webp"]:
        raise HTTPException(400, "Only JPEG, PNG, WEBP allowed")
    
    data = await file.read()
    if len(data) > 5 * 1024 * 1024:
        raise HTTPException(400, "File too large (max 5MB)")
    
    # 1. Imperial Vision: Initial Extraction
    # The vision model already performs the 4-phase Reasoning Protocol
    raw_vision_json = await analyze_image(data, file.content_type)
    
    # 2. Persistence & Cleanup
    try:
        parsed = json.loads(raw_vision_json)
        refined = parsed.get("phase_4_insights", {}).get("refined_prompt", "")
        ocr_text = parsed.get("phase_1_perception", {}).get("ocr_raw", "")
        
        # Calculate a quality score based on vision confidence (0-100)
        confidence = parsed.get("phase_1_perception", {}).get("confidence", 0.8)
        quality_score = int(confidence * 100)
        
        # Save to database for history tracking
        if ocr_text or refined:
            embedding = await get_embedding((ocr_text or refined)[:1000])
            await save_prompt_async(
                ocr_text or "Image Input", 
                refined or ocr_text, 
                quality_score, 
                "vision", 
                embedding, 
                parsed
            )
    except Exception as e:
        logger.warning("vision_persistence_failed", error=str(e))
        # If JSON parsing failed, we still return the raw text to the frontend
        pass

    return {"success": True, "data": raw_vision_json}

@router.get("/templates", response_model=list[TemplateResponse])
async def list_templates():
    rows = await get_templates()
    return [dict(r) for r in rows]

@router.get("/templates/{id}", response_model=TemplateResponse)
async def get_template(id: uuid.UUID):
    row = await get_template_by_id(str(id))
    if not row:
        raise HTTPException(404, "Template not found")
    return dict(row)

@router.get("/history/{id}/versions", response_model=list[VersionResponse])
async def get_versions(id: uuid.UUID):
    rows = await get_prompt_versions(str(id))
    return [dict(r) for r in rows]

@router.post("/export")
@limiter.limit("30/minute")
async def export_route(request: Request, req: ExportRequest):
    content, mime = await export_prompt(str(req.prompt_id), req.format)
    if not content:
        raise HTTPException(404, "Prompt not found")
        
    ext = {"markdown": "md", "json": "json", "cursor": "txt", "text": "txt"}
    filename = f"prompt_{req.prompt_id}.{ext[req.format]}"
    
    return Response(
        content=content, 
        media_type=mime,
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
