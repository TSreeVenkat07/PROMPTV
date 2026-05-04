import React from 'react';

export default function VersionHistory({ versions, onSelect }) {
  if (!versions || versions.length === 0) return (
    <div className="flex flex-col items-center justify-center h-24 opacity-20 grayscale">
        <span className="text-3xl mb-2">📜</span>
        <p className="text-[10px] font-bold uppercase tracking-widest text-center">Empty Archives</p>
    </div>
  );

  return (
    <div className="space-y-3">
      {versions.map((v) => (
        <button
          key={v.id}
          onClick={() => onSelect(v)}
          className="w-full p-4 rounded-xl bg-white/5 border border-white/5 hover:border-primary/30 hover:bg-white/10 transition-all text-left group"
        >
          <div className="flex justify-between items-start mb-2">
            <span className="text-[10px] font-black text-primary uppercase tracking-widest">Version {v.version_number}</span>
            <span className="text-[10px] font-bold text-muted/50">{new Date(v.created_at).toLocaleTimeString()}</span>
          </div>
          <p className="text-xs text-muted/80 line-clamp-2 leading-relaxed group-hover:text-text transition-colors">
            {v.content}
          </p>
          <div className="mt-3 flex items-center gap-2">
              <div className="h-0.5 flex-1 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-primary/40" style={{ width: `${v.score}%` }}></div>
              </div>
              <span className="text-[9px] font-black text-primary/60">{v.score}%</span>
          </div>
        </button>
      ))}
    </div>
  );
}
