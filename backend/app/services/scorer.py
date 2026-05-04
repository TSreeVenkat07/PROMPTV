import re

def score_prompt(text: str) -> dict:
    words = text.split()
    word_count = len(words)
    tl = text.lower()

    vague = ["thing","stuff","something","somehow","whatever",
             "maybe","perhaps","kind of","sort of","etc"]
    action = ["build","create","return","validate","generate",
              "implement","write","define","configure","deploy"]
    vague_c  = sum(1 for w in vague  if w in tl)
    action_c = sum(1 for w in action if w in tl)
    clarity = max(0, min(25, 15 - (vague_c * 3) + (action_c * 2)))

    tech = ["api","json","function","class","database","endpoint",
            "schema","component","async","react","python","sql"]
    tech_c = sum(1 for t in tech if t in tl)
    len_bonus = min(10, word_count // 5)
    specificity = max(0, min(25, (tech_c * 3) + len_bonus))

    ctx_words = ["because","in order to","given that","using",
                 "with","for the purpose","so that","when"]
    ctx_c = sum(1 for c in ctx_words if c in tl)
    context = max(0, min(25, ctx_c * 5 + (5 if word_count > 30 else 0)))

    has_numbers = bool(re.search(r'\d+[\.\)]\s', text))
    has_bullets = bool(re.search(r'[-*•]\s', text))
    has_role    = any(r in tl for r in ["you are","act as","as a"])
    has_format  = any(f in tl for f in ["return","output","format","respond with"])
    structure = min(25,
        (7 if has_numbers else 0) + (6 if has_bullets else 0) +
        (6 if has_role else 0)    + (6 if has_format else 0))

    total = clarity + specificity + context + structure
    grade = ("A" if total >= 85 else "B" if total >= 70 else
             "C" if total >= 55 else "D" if total >= 40 else "F")
    return {
        "clarity": clarity, "specificity": specificity,
        "context": context, "structure": structure,
        "total": total, "grade": grade
    }
