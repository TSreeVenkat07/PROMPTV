from app.db.connection import get_pool
import json

async def export_prompt(prompt_id: str, format_type: str):
    pool = get_pool()
    row = await pool.fetchrow("SELECT original, refined FROM prompts WHERE id = $1", prompt_id)
    if not row:
        return None, None

    original = row['original']
    refined = row['refined']

    if format_type == "markdown":
        content = f"# Original Prompt\n\n{original}\n\n# Refined Prompt\n\n{refined}"
        mime = "text/markdown"
    elif format_type == "json":
        content = json.dumps({"original": original, "refined": refined}, indent=2)
        mime = "application/json"
    elif format_type == "cursor":
        content = f"Instruction for Cursor:\n\n{refined}"
        mime = "text/plain"
    else:
        content = refined
        mime = "text/plain"

    return content.encode('utf-8'), mime
