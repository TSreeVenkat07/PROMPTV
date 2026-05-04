export function scorePrompt(text) {
  if (!text) return { clarity: 0, specificity: 0, context: 0, structure: 0, total: 0, grade: "F" }
  
  const words = text.split(/\s+/).filter(Boolean)
  const wc = words.length
  const tl = text.toLowerCase()

  const vague = ["thing","stuff","something","somehow","whatever",
                 "maybe","perhaps","kind of","sort of","etc"]
  const action = ["build","create","return","validate","generate",
                  "implement","write","define","configure","deploy"]
  const vagueC  = vague.filter(w => tl.includes(w)).length
  const actionC = action.filter(w => tl.includes(w)).length
  const clarity = Math.max(0, Math.min(25, 15 - (vagueC*3) + (actionC*2)))

  const tech = ["api","json","function","class","database","endpoint",
                "schema","component","async","react","python","sql"]
  const techC = tech.filter(t => tl.includes(t)).length
  const lenBonus = Math.min(10, Math.floor(wc / 5))
  const specificity = Math.max(0, Math.min(25, (techC*3) + lenBonus))

  const ctxWords = ["because","in order to","given that","using",
                    "with","for the purpose","so that","when"]
  const ctxC = ctxWords.filter(c => tl.includes(c)).length
  const context = Math.max(0, Math.min(25, ctxC*5 + (wc > 30 ? 5 : 0)))

  const hasNumbers = /\d+[\.\)]\s/.test(text)
  const hasBullets = /[-*•]\s/.test(text)
  const hasRole    = ["you are","act as","as a"].some(r => tl.includes(r))
  const hasFormat  = ["return","output","format","respond with"].some(f => tl.includes(f))
  const structure  = Math.min(25,
    (hasNumbers?7:0) + (hasBullets?6:0) + (hasRole?6:0) + (hasFormat?6:0))

  const total = clarity + specificity + context + structure
  const grade = total>=85?"A": total>=70?"B": total>=55?"C": total>=40?"D":"F"
  
  return { clarity, specificity, context, structure, total, grade }
}
