import React from 'react';

const modes = [
  { id: 'analyze', label: 'Analyze', icon: '⚜️', desc: 'Sift for impurities' },
  { id: 'build', label: 'Build', icon: '🏛️', desc: 'Construct from scratch' },
  { id: 'recovery', label: 'Recover', icon: '🏺', desc: 'Restore lost intent' },
  { id: 'image', label: 'Vision', icon: '🖼️', desc: 'Extract from artifact' },
];

export default function ModeSelector({ activeMode, onModeChange }) {
  return (
    <div className="space-y-4">
      <p className="text-[10px] font-black uppercase tracking-[0.25em] text-primary/60 ml-1">Command Center</p>
      <div className="space-y-2.5">
        {modes.map((mode) => (
          <button
            key={mode.id}
            onClick={() => onModeChange(mode.id)}
            className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all text-left ${
              activeMode === mode.id 
                ? 'bg-primary/10 border-primary/50 shadow-inner' 
                : 'bg-white/5 border-transparent hover:bg-white/10'
            }`}
          >
            <span className={`text-xl ${activeMode === mode.id ? 'opacity-100' : 'opacity-40'}`}>
              {mode.icon}
            </span>
            <div>
              <p className={`text-xs font-black uppercase tracking-widest ${activeMode === mode.id ? 'text-primary' : 'text-muted'}`}>
                {mode.label}
              </p>
              <p className="text-[10px] text-muted/50 mt-0.5 font-medium">
                {mode.desc}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
