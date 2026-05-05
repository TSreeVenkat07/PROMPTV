import { useState, useEffect, lazy, Suspense, useRef, useMemo } from "react";
import { useStream } from "../hooks/useStream";
import { useScore } from "../hooks/useScore";
import { useToast } from "../components/Toast";
import TemplateLibrary from "../components/TemplateLibrary";
import axios from "axios";

const API = import.meta.env.VITE_API_URL || "http://localhost:8000";

const MODES = [
  { id: "analyze", title: "Analyze", desc: "Find weaknesses & improve", color: "blue" },
  { id: "build", title: "Build", desc: "Idea → full prompt", color: "yellow" },
  { id: "recovery", title: "Recover", desc: "Fix failing prompts", color: "blue" },
  { id: "vision", title: "Vision", desc: "Extract from image", color: "yellow" },
];

function BulletList({ items, icon, color }) {
  const safeItems = Array.isArray(items) ? items : (typeof items === "string" ? [items] : []);
  if (!safeItems.length) return null;
  return (
    <ul className="space-y-1.5">
      {safeItems.map((item, i) => (
        <li key={i} className="text-sm text-gray-300 flex gap-2">
          <span className={`text-${color}-400 flex-shrink-0`}>{icon}</span>
          <span className="truncate whitespace-normal">{typeof item === "string" ? item : JSON.stringify(item)}</span>
        </li>
      ))}
    </ul>
  );
}

function ResultCard({ title, color, children }) {
  return (
    <div className={`p-5 rounded-2xl border border-${color}-500/20 bg-${color}-500/5`}>
      <h4 className={`text-xs font-bold text-${color}-400 uppercase tracking-widest mb-3`}>{title}</h4>
      {children}
    </div>
  );
}

export default function Home() {
  const [mode, setMode] = useState("analyze");
  const [texts, setTexts] = useState({ analyze: "", build: "", recovery: "", vision: "" });
  const text = texts[mode] || "";
  const setText = (val) => setTexts(prev => ({ ...prev, [mode]: val }));
  const [isTemplateOpen, setIsTemplateOpen] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imageResult, setImageResult] = useState(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [refinedPrompt, setRefinedPrompt] = useState("");
  const fileInputRef = useRef(null);
  
  const { chunks, score: streamScore, afterScore, done, loading, error, resultMode, activeNode, finalData, start, stop, reset } = useStream();
  const liveScore = useScore(text);
  const { show } = useToast();
  const [history, setHistory] = useState([]);

  const fetchHistory = async () => {
    try {
      const res = await axios.get(`${API}/api/v1/history?mode=${mode}`);
      setHistory(res.data.data || []);
    } catch (e) { console.error("History fetch failed"); }
  };

  useEffect(() => {
    fetchHistory();
  }, [mode, done]);

  useEffect(() => {
    if (error) show(error, "error");
    if (done) {
      show("Optimization complete!", "success");
    }
  }, [error, done]);

  // Robust JSON parsing for both streaming and image results
  const parsed = useMemo(() => {
    if (finalData) return finalData;
    let rawData = mode === "vision" ? imageResult : chunks;
    if (!rawData) return null;
    let textToParse = typeof rawData === "string" ? rawData : JSON.stringify(rawData);
    
    // Remove markdown code blocks if present
    if (textToParse.includes("```")) {
      const parts = textToParse.split("```");
      const jsonPart = parts.find(p => p.trim().includes("{"));
      if (jsonPart) {
        textToParse = jsonPart.trim();
        if (textToParse.startsWith("json")) textToParse = textToParse.substring(4).trim();
      }
    }

    try {
      return JSON.parse(textToParse);
    } catch (e) {
      try {
        const match = textToParse.match(/\{[\s\S]*\}/);
        if (match) return JSON.parse(match[0]);
      } catch (err) { return null; }
    }
    return null;
  }, [chunks, imageResult, mode, finalData]);

  useEffect(() => {
    const isDone = mode === "vision" ? !!imageResult : done;
    if (!isDone) return;
    if (mode !== "vision" && resultMode !== mode) return;

    let refined = parsed?.phase_4_insights?.refined_prompt || parsed?.refined_prompt;
    if (refined) {
      setRefinedPrompt(typeof refined === "string" ? refined : JSON.stringify(refined, null, 2));
    } else if (mode === "vision" && imageResult) {
      setRefinedPrompt(typeof imageResult === "string" ? imageResult : JSON.stringify(imageResult, null, 2));
    } else if (chunks) {
      setRefinedPrompt(chunks);
    }
  }, [done, chunks, imageResult, resultMode, mode, parsed]);

  const handleRefine = () => {
    if (text.trim().length < 3) return;
    setRefinedPrompt("");
    start("/stream/analyze", { prompt: text, mode });
  };
  
  const handleImageUpload = async () => {
    if (!imageFile) return;
    setImageLoading(true);
    setImageResult(null);
    reset(); 
    try {
      const fd = new FormData();
      fd.append("file", imageFile);
      const res = await axios.post(`${API}/api/v1/image-analyze`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setImageResult(res.data.data);
      show("Image analysis complete!", "success");
    } catch (err) {
      show("Image analysis failed", "error");
    } finally {
      setImageLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050A18] text-white relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute w-[600px] h-[600px] bg-blue-600/20 blur-[120px] top-[-200px] left-[-200px]" />
        <div className="absolute w-[500px] h-[500px] bg-yellow-500/10 blur-[120px] bottom-[-200px] right-[-200px]" />
      </div>

      <header className="relative flex items-center justify-between px-4 md:px-10 py-4 md:py-6 border-b border-white/10 backdrop-blur-xl z-10">
        <h1 className="text-xl md:text-2xl font-bold tracking-wide">
          <span className="text-blue-400">PROMPT</span><span className="text-yellow-400">V</span>
        </h1>
        <div className="text-[10px] md:text-sm text-gray-400 uppercase tracking-widest">
          {mode} mode
        </div>
      </header>

      <div className="relative flex flex-col lg:grid lg:grid-cols-12 gap-6 p-4 md:p-8 z-10">
        {/* MODES COLUMN */}
        <div className="order-2 lg:order-1 lg:col-span-3">
          <div className="flex lg:flex-col gap-4 overflow-x-auto lg:overflow-visible pb-4 lg:pb-0 custom-scrollbar">
            {MODES.map((item) => (
              <div key={item.id} onClick={() => { 
                  if (mode !== item.id) {
                    setMode(item.id); 
                    setRefinedPrompt(""); 
                    setImageResult(null); 
                    reset(); 
                  }
                }}
                className={`group flex-shrink-0 w-[240px] lg:w-full p-4 md:p-5 rounded-2xl border backdrop-blur-xl hover:scale-[1.02] transition-all duration-300 cursor-pointer
                  ${mode === item.id ? "border-blue-400/50 bg-white/10" : "border-white/10 bg-white/5"}`}>
                <h2 className={`text-base md:text-lg font-semibold ${item.color === "blue" ? "text-blue-400" : "text-yellow-400"}`}>{item.title}</h2>
                <p className="text-xs text-gray-400 mt-1 line-clamp-1 lg:line-clamp-none">{item.desc}</p>
                <div className={`h-1 transition-all duration-500 mt-3 bg-gradient-to-r from-blue-500 to-yellow-400 rounded-full
                  ${mode === item.id ? "w-full" : "w-0 group-hover:w-full"}`} />
              </div>
            ))}
          </div>
          <button onClick={() => setIsTemplateOpen(true)}
            className="w-full mt-2 lg:mt-4 py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition text-sm font-semibold tracking-wider">
            Access Library
          </button>
        </div>

        <div className="order-1 lg:order-2 lg:col-span-6 space-y-6">
          <div className="p-8 rounded-3xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 backdrop-blur-xl shadow-2xl">
            <h2 className="text-2xl md:text-3xl font-bold">
              {mode === "analyze" && <>Analyze <span className="text-yellow-400">Quality</span></>}
              {mode === "build" && <>Build <span className="text-yellow-400">Power</span> Prompts</>}
              {mode === "recovery" && <>Recover <span className="text-yellow-400">Failed</span> Prompts</>}
              {mode === "vision" && <>Extract from <span className="text-yellow-400">Image</span></>}
            </h2>
            
            {mode === "vision" ? (
              <div className="mt-6 space-y-4">
                <div onClick={() => fileInputRef.current?.click()}
                  className="h-40 rounded-xl border-2 border-dashed border-white/20 bg-black/30 flex flex-col items-center justify-center cursor-pointer hover:border-blue-400/50 transition">
                  {imageFile ? (
                    <div className="text-center">
                      <p className="text-blue-400 font-semibold">{imageFile.name}</p>
                      <p className="text-gray-500 text-xs mt-1">{(imageFile.size / 1024).toFixed(1)} KB</p>
                    </div>
                  ) : (
                    <div className="text-center"><p className="text-2xl mb-2">🖼️</p><p className="text-gray-400 text-sm">Click to upload</p></div>
                  )}
                </div>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => setImageFile(e.target.files?.[0] || null)} />
                <button onClick={handleImageUpload} disabled={!imageFile || imageLoading}
                  className="w-full px-5 py-2.5 rounded-xl font-semibold bg-gradient-to-r from-blue-500 to-yellow-400 text-black disabled:opacity-40">
                  {imageLoading ? "ANALYZING..." : "ANALYZE IMAGE"}
                </button>
              </div>
            ) : (
              <>
                <textarea value={text} onChange={(e) => setText(e.target.value)} disabled={loading}
                  placeholder={
                    mode === "recovery" 
                    ? "Paste your failing prompt followed by the error logs/trace..." 
                    : mode === "build"
                    ? "Describe your app idea or the task you want to automate..."
                    : "Enter your prompt for deep analysis..."
                  }
                  className="w-full mt-6 h-40 p-4 rounded-xl bg-black/40 border border-white/10 focus:border-blue-400 outline-none resize-none text-white font-mono text-sm disabled:opacity-50" />
                {liveScore && (
                  <div className="mt-3 flex items-center gap-4">
                    <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-blue-500 to-yellow-400 transition-all duration-700" style={{ width: `${liveScore.total}%` }} />
                    </div>
                    <span className="text-sm font-bold text-yellow-400">{liveScore.grade}</span>
                  </div>
                )}
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-gray-400">Chars: {text.length}</div>
                  <button onClick={handleRefine} disabled={loading || text.length < 3}
                    className="px-5 py-2.5 rounded-xl font-semibold bg-gradient-to-r from-blue-500 to-yellow-400 text-black disabled:opacity-40">
                    {loading ? "PROCESSING..." : "ANALYZE"}
                  </button>
                </div>
              </>
            )}
          </div>

          {/* STREAMING / REASONING STATUS */}
          {loading && resultMode === mode && (
            <div className="p-6 rounded-2xl border border-blue-500/20 bg-blue-500/5 backdrop-blur-xl animate-fade-in">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-3 h-3 rounded-full bg-blue-400 animate-ping absolute" />
                    <div className="w-3 h-3 rounded-full bg-blue-500 relative" />
                  </div>
                  <span className="text-xs font-black text-blue-400 uppercase tracking-widest">
                    {activeNode || "Imperial Graph Processing"}
                  </span>
                </div>
                <button onClick={stop} className="text-[10px] font-bold text-gray-500 hover:text-red-400 uppercase tracking-tighter transition">Abort Sequence</button>
              </div>
              
              <div className="grid grid-cols-4 gap-2 mb-6">
                {[
                  { name: "Perception", agent: "The Seer" },
                  { name: "Building", agent: "The Architect" },
                  { name: "Auditing", agent: "The Inquisitor" },
                  { name: "Finalizing", agent: "Imperial Command Center" }
                ].map((step, i) => {
                  const isEngine = activeNode === "Imperial Engine";
                  const isActive = activeNode === step.agent || (activeNode === "Initializing..." && i === 0) || (isEngine && i === 1);
                  const isPast = isEngine || (activeNode === "The Architect" && i < 1) || 
                                 (activeNode === "The Inquisitor" && i < 2) || 
                                 (activeNode === "Imperial Command Center" && i < 3);
                  
                  return (
                    <div key={step.name} className="space-y-2">
                      <div className={`h-1 rounded-full transition-all duration-500 ${isActive ? 'bg-yellow-400 animate-pulse' : (isPast ? 'bg-blue-400' : 'bg-white/5')}`} />
                      <span className={`text-[8px] font-bold uppercase tracking-tighter text-center block ${isActive ? 'text-yellow-400' : (isPast ? 'text-blue-300' : 'text-gray-600')}`}>
                        {step.name}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="min-h-[60px] max-h-[200px] overflow-y-auto font-mono text-[11px] text-gray-400 whitespace-pre-wrap leading-relaxed opacity-60">
                {chunks || "Initiating logic nodes..."}
              </div>
            </div>
          )}

          {(done || (mode === "vision" && imageResult)) && parsed && (resultMode === mode || mode === "vision") && (
            <div className="space-y-6 animate-fade-in">
              {/* PHASE 1: PERCEPTION */}
              <div className="p-5 rounded-2xl border border-blue-500/20 bg-blue-500/5 backdrop-blur-xl">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-black px-2 py-0.5 rounded bg-blue-500 text-black uppercase tracking-tighter">Phase 1</span>
                    <h4 className="text-xs font-bold text-blue-400 uppercase tracking-widest">Perception & Intent</h4>
                  </div>
                  {parsed.phase_1_perception?.confidence && (
                    <span className="text-[10px] font-mono text-blue-300">{(parsed.phase_1_perception.confidence * 100).toFixed(0)}% Conf.</span>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h5 className="text-[9px] text-gray-500 uppercase mb-1">Detected Intent</h5>
                    <div className="text-xs text-blue-100 font-semibold capitalize">{parsed.phase_1_perception?.intent || parsed.phase_2_structuring?.detected_type || "Analyze"}</div>
                  </div>
                  <div>
                    <h5 className="text-[9px] text-gray-500 uppercase mb-1">Observations</h5>
                    <BulletList 
                      items={parsed.phase_1_perception?.assumptions || parsed.phase_1_perception?.observations} 
                      icon="•" 
                      color="blue" 
                    />
                  </div>
                </div>
                {parsed.phase_1_perception?.ocr_raw && (
                  <div className="mt-4 p-3 rounded-xl bg-black/40 border border-white/5">
                    <h5 className="text-[9px] text-gray-500 uppercase mb-2">Raw Perception (OCR)</h5>
                    <pre className="text-[10px] text-gray-400 font-mono whitespace-pre-wrap max-h-20 overflow-y-auto">{parsed.phase_1_perception.ocr_raw}</pre>
                  </div>
                )}
              </div>

              {/* PHASE 2 & 3: STRUCTURING & ANALYSIS */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl border border-yellow-500/10 bg-white/5">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-yellow-500 text-black uppercase">Phase 2</span>
                    <h4 className="text-[10px] font-bold text-yellow-400 uppercase tracking-widest">Structuring</h4>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {Array.isArray(parsed.phase_2_structuring?.elements) ? (
                      parsed.phase_2_structuring.elements.map((e, i) => (
                        <span key={i} className="text-[9px] px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-300 border border-yellow-500/20">
                          {typeof e === "string" ? e : JSON.stringify(e)}
                        </span>
                      ))
                    ) : (
                      <span className="text-[9px] text-gray-500 italic">None detected</span>
                    )}
                  </div>
                </div>

                <div className="p-4 rounded-2xl border border-red-500/10 bg-white/5 relative overflow-hidden">
                  {parsed.phase_3_analysis?.error_intelligence?.severity === "critical" && (
                    <div className="absolute top-0 right-0 p-1 bg-red-500 text-black text-[7px] font-black uppercase rotate-45 translate-x-3 -translate-y-1 w-20 text-center">Auto-Correct</div>
                  )}
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-red-500 text-black uppercase">Phase 3</span>
                    <h4 className="text-[10px] font-bold text-red-400 uppercase tracking-widest">Analysis</h4>
                    {parsed.meta?.iterations > 1 && (
                      <span className="text-[7px] font-black px-1.5 py-0.5 rounded bg-yellow-400 text-black uppercase animate-bounce ml-auto">Self-Corrected</span>
                    )}
                  </div>
                  {parsed.phase_3_analysis?.error_intelligence ? (
                    <div className="space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] text-red-300 font-bold uppercase">{parsed.phase_3_analysis.error_intelligence.type}</span>
                        <span className="text-[9px] px-1.5 rounded bg-red-500/20 text-red-400 font-black">{parsed.phase_3_analysis.error_intelligence.severity}</span>
                      </div>
                      <p className="text-[10px] text-gray-400 leading-tight italic">
                        "{typeof parsed.phase_3_analysis.error_intelligence.diagnosis === "string" 
                          ? parsed.phase_3_analysis.error_intelligence.diagnosis 
                          : JSON.stringify(parsed.phase_3_analysis.error_intelligence.diagnosis)}"
                      </p>
                    </div>
                  ) : (
                    <p className="text-[10px] text-gray-500 italic">{parsed.phase_3_analysis?.reasoning?.substring(0, 60) || "Deep analysis in progress..."}...</p>
                  )}
                </div>
              </div>

              {/* PHASE 4: INSIGHTS (Mode Specific) */}
              <div className="space-y-4">
                {mode === "analyze" && parsed.phase_4_insights && (
                  <>
                    {parsed.phase_4_insights.whats_good && <ResultCard title="✅ What's Good" color="green"><BulletList items={parsed.phase_4_insights.whats_good} icon="✓" color="green" /></ResultCard>}
                    {parsed.phase_4_insights.weak_areas && <ResultCard title="⚡ Weak Areas" color="red"><BulletList items={parsed.phase_4_insights.weak_areas} icon="•" color="red" /></ResultCard>}
                  </>
                )}

                {mode === "build" && parsed.phase_4_insights && (
                  <ResultCard title="🏗️ Build Blueprint" color="yellow">
                    {parsed.phase_4_insights.build_steps && <BulletList items={parsed.phase_4_insights.build_steps} icon="→" color="blue" />}
                    {parsed.phase_4_insights.tech_stack && typeof parsed.phase_4_insights.tech_stack === "object" && (
                      <div className="mt-4 grid grid-cols-2 gap-2">
                        {Object.entries(parsed.phase_4_insights.tech_stack).map(([k, v]) => (
                          <div key={k} className="p-2 rounded bg-black/20 border border-white/5">
                            <div className="text-[9px] text-gray-500 uppercase">{k}</div>
                            <div className="text-[10px] text-blue-300">
                              {Array.isArray(v) ? v.join(", ") : (typeof v === "string" ? v : JSON.stringify(v))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </ResultCard>
                )}

                {mode === "vision" && parsed.phase_4_insights && (
                  <ResultCard title="📝 Vision Summary" color="yellow">
                    <p className="text-sm italic text-gray-300">
                      "{typeof (parsed.phase_4_insights.summary || parsed.summary) === "string" 
                        ? (parsed.phase_4_insights.summary || parsed.summary) 
                        : JSON.stringify(parsed.phase_4_insights.summary || parsed.summary)}"
                    </p>
                  </ResultCard>
                )}
              </div>
            </div>
          )}

          <div className="p-6 rounded-2xl border border-white/10 bg-white/5 space-y-4">
            <h3 className="text-lg font-semibold text-yellow-400">✨ Refined Prompt</h3>
            {refinedPrompt ? (
              <div className="relative group">
                <pre className="text-sm text-gray-200 whitespace-pre-wrap font-mono bg-black/30 p-4 rounded-xl border border-yellow-500/20">{refinedPrompt}</pre>
                <button onClick={() => { navigator.clipboard.writeText(refinedPrompt); show("Copied!", "success"); }}
                  className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 bg-yellow-400 text-black text-[10px] px-3 py-1 rounded">Copy</button>
              </div>
            ) : <p className="text-gray-500 text-sm italic">Result will appear here...</p>}
          </div>
        </div>

        <div className="order-3 lg:order-3 lg:col-span-3 space-y-6">
          {/* HISTORY SECTION */}
          <div className="p-6 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl h-[450px] flex flex-col">
            <div className="flex items-center gap-2 mb-6 border-b border-white/5 pb-4">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
              <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Semantic History</h2>
            </div>
            <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
              {history.length > 0 ? history.slice(0, 10).map((item) => (
                <button 
                  key={item.id} 
                  onClick={() => setText(item.original)}
                  className="w-full p-4 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 text-left transition group"
                >
                  <div className="text-[10px] text-gray-400 font-mono mb-2 truncate">{item.original}</div>
                  <div className="flex items-center justify-between">
                    <span className="text-[8px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 font-bold uppercase">{item.mode}</span>
                    <span className="text-[10px] font-mono text-gray-500 group-hover:text-gray-300 transition">{item.quality_score}%</span>
                  </div>
                </button>
              )) : (
                <div className="flex flex-col items-center justify-center h-40 opacity-30">
                  <p className="text-[10px] text-center font-mono">Archive Empty</p>
                </div>
              )}
            </div>
          </div>

          {/* STATUS & SCORE */}
          <div className="space-y-4">
            <div className="p-5 rounded-2xl bg-white/5 border border-white/10">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-blue-400 mb-3">System Status</h3>
              <div className="space-y-2 text-[10px] text-gray-500 font-mono">
                <div className="flex justify-between"><span>Node Status</span><span className="text-green-500">ONLINE</span></div>
                <div className="flex justify-between"><span>Semantic Cache</span><span className="text-blue-400">ACTIVE</span></div>
                <div className="flex justify-between"><span>Security Layer</span><span className="text-yellow-400">MASKING</span></div>
              </div>
            </div>
            {streamScore && (
              <div className="p-6 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-center">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-blue-400 mb-2">Refinement Grade</h3>
                <div className="text-4xl font-black text-white">{streamScore.grade}</div>
                <div className="text-[10px] text-blue-400 font-mono mt-1">{streamScore.total}% OPTIMIZED</div>
              </div>
            )}
          </div>
        </div>
      </div>
      <TemplateLibrary isOpen={isTemplateOpen} onClose={() => setIsTemplateOpen(false)} onSelect={(c) => setText(c)} />
    </div>
  );
}
