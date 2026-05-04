import re
from app.core.logging import logger

# Common patterns for PII and secrets
PII_PATTERNS = {
    "api_key": r"(?:key|api|token|secret|auth|password|passwd|pass)[\s:='\"]+[a-zA-Z0-9\-_]{16,}",
    "email": r"[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+",
    "ipv4": r"\b(?:\d{1,3}\.){3}\d{1,3}\b",
    "credit_card": r"\b(?:\d{4}[-\s]?){3}\d{4}\b"
}

def scrub_pii(text: str) -> str:
    """
    Masks sensitive data (PII, API keys, IPs) before sending to AI or saving to DB.
    This is a critical security layer for the 'Imperial' edition.
    """
    if not text:
        return text
        
    scrubbed = text
    found_any = False
    
    for label, pattern in PII_PATTERNS.items():
        matches = re.findall(pattern, scrubbed, re.IGNORECASE)
        if matches:
            found_any = True
            for match in matches:
                # Keep first/last 2 chars for context, mask middle
                if len(match) > 8:
                    masked = f"{match[:2]}***{match[-2:]}"
                else:
                    masked = "[MASKED]"
                scrubbed = scrubbed.replace(match, f"<{label}:{masked}>")
    
    if found_any:
        logger.info("pii_detected_and_masked")
        
    return scrubbed
