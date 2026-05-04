import json, re, base64
from google import genai
from google.genai import types
from app.core.config import settings
from app.core.logging import logger

MODELS_TO_TRY = [
    "gemini-2.5-flash",
    "gemini-1.5-flash-latest",
    "gemini-2.0-flash-exp",
    "gemini-1.5-flash",
    "gemini-1.5-pro",
    "gemini-pro"
]

async def analyze_image(image_bytes: bytes, mime_type: str):
    """
    Analyzes an image using Imperial Vision (Gemini) with dynamic model discovery.
    """
    system_instruction = """### IMPERIAL VISION REASONING PROTOCOL (V2.5)
You are a vision-capable analytical agent. You MUST follow this 4-Phase pipeline:
1. PHASE 1: PERCEPTION (OCR & visual elements extraction)
2. PHASE 2: STRUCTURING (Deconstruct elements into logic blocks)
3. PHASE 3: ANALYSIS (Diagnose issues/intents in the captured data)
4. PHASE 4: INSIGHTS (Generate a summary and a high-fidelity refined prompt)

Return exactly this JSON schema:
{
  "phase_1_perception": {"ocr_raw": "EXTRACTED_TEXT_HERE", "confidence": 0.95, "assumptions": ["Observations only"]},
  "phase_2_structuring": {"detected_type": "UI|terminal|code", "classification_confidence": 0.9, "elements": ["Detected UI components or code blocks"]},
  "phase_3_analysis": {"error_intelligence": {"type": "api|runtime|syntax", "severity": "critical", "diagnosis": "Detailed interpretation"}, "interpretation_confidence": 0.85},
  "phase_4_insights": {"summary": "Brief explanation of the image content", "refined_prompt": "The optimized prompt derived from the image"}
}
IMPORTANT: DO NOT include markdown code blocks. Return RAW JSON ONLY."""

    client = genai.Client(api_key=settings.GEMINI_API_KEY)
    
    # 1. Model Discovery
    authorized_models = []
    try:
        for m in client.models.list():
            authorized_models.append(m.name)
    except Exception as e:
        logger.warning(f"Vision Discovery: Failed to list models: {e}")

    # Prioritize based on MODELS_TO_TRY and discovered models
    prioritized = []
    for model_name in MODELS_TO_TRY:
        # Check if any discovered model contains the target string
        matches = [m for m in authorized_models if model_name in m]
        prioritized.extend(matches)
    
    # Add anything else that might be vision capable if nothing found yet
    if not prioritized:
        prioritized = [m for m in authorized_models if "flash" in m or "pro" in m]
    
    # Fallback to defaults if discovery failed entirely
    if not prioritized:
        prioritized = ["models/gemini-1.5-flash", "models/gemini-1.5-pro"]

    last_error = None
    for model_name in prioritized:
        try:
            logger.info(f"Imperial Vision: Trying {model_name}...")
            response = client.models.generate_content(
                model=model_name,
                contents=[
                    types.Part.from_bytes(data=image_bytes, mime_type=mime_type),
                    "Analyze this image and return the JSON structure. IMPORTANT: Ignore top navigation bars, menus, and user profiles. Focus exclusively on the core data, database tables, terminal logs, or code in the center of the screen."
                ],
                config=types.GenerateContentConfig(
                    system_instruction=system_instruction,
                    temperature=0.1
                )
            )
            
            logger.info(f"Imperial Vision: Success with {model_name}.")
            text = response.text
            
            # Log a snippet
            logger.info("Imperial Vision Raw Output", snippet=text[:100] + "...")
            
            match = re.search(r'\{[\s\S]*\}', text)
            if match: 
                return match.group()
            return text.strip()

        except Exception as e:
            logger.warning(f"Imperial Vision: {model_name} failed: {e}")
            last_error = e
            continue

    # If all models failed
    logger.error(f"Imperial Vision: All models failed. Last error: {last_error}")
    return json.dumps({
        "phase_1_perception": {"error": "Vision analysis failed after exhausting all available models."},
        "phase_3_analysis": {"error_intelligence": {"type": "api", "severity": "critical", "diagnosis": str(last_error)}},
        "phase_4_insights": {"refined_prompt": f"Vision extraction failed. Last error: {last_error}"}
    })

