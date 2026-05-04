import { useState, useCallback, useRef } from "react"

export function useStream() {
  const [chunks, setChunks]       = useState("")
  const [score, setScore]         = useState(null)
  const [afterScore, setAfterScore] = useState(null)
  const [done, setDone]           = useState(false)
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState(null)
  const [resultMode, setResultMode] = useState(null)
  const [activeNode, setActiveNode] = useState(null)
  const [finalData, setFinalData] = useState(null)
  const esRef = useRef(null)

  const reset = useCallback(() => {
    if (esRef.current) esRef.current.close()
    setChunks("")
    setScore(null)
    setAfterScore(null)
    setDone(false)
    setError(null)
    setLoading(false)
    setResultMode(null)
    setActiveNode(null)
    setFinalData(null)
  }, [])

  const start = useCallback((endpoint, params) => {
    if (esRef.current) esRef.current.close()
    setChunks("")
    setScore(null)
    setAfterScore(null)
    setDone(false)
    setError(null)
    setLoading(true)
    setResultMode(params.mode || null)
    setActiveNode("Initializing...")
    setFinalData(null)

    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000'
    const url = `${baseUrl}/api/v1${endpoint}?${new URLSearchParams(params)}`
    
    const es = new EventSource(url)
    esRef.current = es

    es.onmessage = (e) => {
      try {
        if (e.data === "[DONE]") {
           setDone(true)
           setLoading(false)
           setActiveNode(null)
           es.close()
           return
        }
        
        const msg = JSON.parse(e.data)
        if (msg.type === "score") setScore(msg.data)
        if (msg.type === "node") setActiveNode(msg.name)
        if (msg.type === "chunk") setChunks(p => p + msg.text)
        if (msg.type === "done") {
          setDone(true)
          setLoading(false)
          if (msg.data) setFinalData(msg.data)
          es.close()
        }
        if (msg.type === "error") {
          setError(msg.message)
          setLoading(false)
          es.close()
        }
      } catch (err) {
        // Only log if it's not a partial chunk error
        if (!e.data.includes("chunk")) console.error("SSE parse error", err)
      }
    }

    es.onerror = (err) => {
      console.error("SSE Connection Error:", err)
      setError("Network Link interrupted. Please retry.")
      setLoading(false)
      es.close()
    }
  }, [])

  const stop = useCallback(() => {
    if (esRef.current) {
      esRef.current.close()
      setLoading(false)
    }
  }, [])

  return { chunks, score, afterScore, done, loading, error, resultMode, activeNode, finalData, start, stop, reset }
}
