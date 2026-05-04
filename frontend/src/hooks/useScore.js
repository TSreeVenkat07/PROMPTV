import { useState, useEffect, useRef } from "react"
import { scorePrompt } from "../utils/scorer"

export function useScore(text) {
  const [score, setScore] = useState(null)
  const timer = useRef(null)

  useEffect(() => {
    clearTimeout(timer.current)
    if (!text || text.length < 5) { 
      setScore(null)
      return 
    }
    
    timer.current = setTimeout(() => {
      setScore(scorePrompt(text))
    }, 300)
    
    return () => clearTimeout(timer.current)
  }, [text])

  return score
}
