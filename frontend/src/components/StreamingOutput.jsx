import React from 'react';

export default function StreamingOutput({ text, loading, onStop }) {
  return (
    <div className="glass rounded-2xl border border-border/50 p-6 shadow-2xl relative overflow-hidden">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
          <span className="text-[10px] font-black uppercase tracking-widest text-primary">Live Refinement</span>
        </div>
        {loading && (
          <button 
            onClick={onStop}
            className="text-[10px] font-bold text-muted hover:text-danger transition-colors uppercase tracking-widest bg-white/5 px-2 py-1 rounded"
          >
            Stop Generation
          </button>
        )}
      </div>
      
      <div className="min-h-[200px] max-h-[500px] overflow-y-auto font-mono text-sm leading-relaxed text-text/90 scrollbar-hide">
        {text || <span className="text-muted/30 italic">Awaiting transmission...</span>}
        {loading && <span className="inline-block w-2 h-4 ml-1 bg-primary animate-blink"></span>}
      </div>
      
      {/* Decorative background element */}
      <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-primary/5 rounded-full blur-3xl pointer-events-none"></div>
    </div>
  );
}
