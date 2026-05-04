import re
from fastapi import HTTPException

INJECTION_PATTERNS = [
    r"<script.*?>", r"javascript:", r"onerror\s*=",
    r"--\s", r";\s*DROP\s", r";\s*SELECT\s",
    r"\x00"
]

def sanitize_input(text: str) -> str:
    for pattern in INJECTION_PATTERNS:
        if re.search(pattern, text, re.IGNORECASE):
            raise HTTPException(status_code=422,
                detail="Input contains disallowed content")
    return text.strip()
