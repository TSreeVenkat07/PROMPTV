import React from 'react';

export default function ResultViewer({ data }) {
  if (!data) return null;

  // If data is just a string (chunks), we can't easily parse it as JSON yet
  // Usually the final 'done' event sends the full structured data
  const isStructured = typeof data === 'object';
  
  return (
    <div className="space-y-8 animate-fade-in">
      <div className="glass rounded-3xl border border-border/50 p-8 shadow-2xl overflow-hidden relative">
        <div className="flex items-center gap-2 mb-6">
          <span className="text-2xl">✨</span>
          <h3 className="text-xl font-black tracking-tight">Optimized Result</h3>
        </div>

        <div className="bg-black/20 rounded-2xl p-6 border border-white/5 font-mono text-sm leading-relaxed relative group">
          <pre className="whitespace-pre-wrap break-words text-white/90">
            {isStructured ? data.refined_prompt : data}
          </pre>
          <button 
            onClick={() => navigator.clipboard.writeText(isStructured ? data.refined_prompt : data)}
            className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity bg-primary/20 hover:bg-primary/40 text-primary text-[10px] font-bold px-3 py-1.5 rounded-lg uppercase tracking-widest border border-primary/30"
          >
            Copy
          </button>
        </div>
      </div>

      {isStructured && data.issues_found && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="glass p-6 rounded-2xl border-l-4 border-l-warning">
            <h4 className="text-xs font-black uppercase tracking-[0.2em] text-warning mb-4">Detected Issues</h4>
            <ul className="space-y-2">
              {data.issues_found.map((issue, i) => (
                <li key={i} className="text-sm text-text/80 flex gap-2">
                  <span className="text-warning opacity-50">•</span> {issue}
                </li>
              ))}
            </ul>
          </div>

          <div className="glass p-6 rounded-2xl border-l-4 border-l-danger">
            <h4 className="text-xs font-black uppercase tracking-[0.2em] text-danger mb-4">Failure Risks</h4>
            <ul className="space-y-2">
              {data.failure_risks.map((risk, i) => (
                <li key={i} className="text-sm text-text/80 flex gap-2">
                  <span className="text-danger opacity-50">!</span> {risk}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
