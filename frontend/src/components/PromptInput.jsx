import React, { useRef } from 'react';
import { useScore } from '../hooks/useScore';

export default function PromptInput({ value, onChange, onSubmit, mode, disabled }) {
  const score = useScore(value);
  const textareaRef = useRef(null);

  const getScoreColor = (val) => {
    if (val < 40) return '#EF4444';
    if (val < 60) return '#94A3B8';
    if (val < 75) return '#F1E5AC';
    return '#D4AF37';
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && e.shiftKey) {
      e.preventDefault();
      onSubmit();
    }
  };

  const placeholders = {
    analyze: "Infuse your intent here...",
    build: "Describe the architecture of your idea...",
    recovery: "Decrypt the failing sequence...",
    image: "Capture the essence via visual medium..."
  };

  return (
    <div className="w-full space-y-6">
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder={placeholders[mode] || placeholders.analyze}
          className="w-full h-72 p-8 bg-card/40 border-none text-text font-mono text-lg resize-none focus:outline-none transition-all placeholder:text-muted/20 scrollbar-hide"
          style={{ letterSpacing: '0.02em', lineHeight: '1.6' }}
        />
        <div className="absolute bottom-6 right-8">
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/40">
            Char Count: {value.length}
          </span>
        </div>
      </div>

      <div className="px-8 pb-8 flex items-center justify-between border-t border-white/5 pt-6">
        <div className="flex items-center gap-6">
            {score && (
                <div className="flex flex-col">
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted mb-1">Potency</span>
                    <div className="flex items-center gap-3">
                        <div className="h-1 w-24 bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full bg-primary transition-all duration-700" style={{ width: `${score.total}%` }}></div>
                        </div>
                        <span className="text-xs font-bold text-primary">{score.grade}</span>
                    </div>
                </div>
            )}
        </div>

        <button
          onClick={onSubmit}
          disabled={disabled || value.length < 10}
          className="btn-primary"
        >
          {disabled ? "Processing..." : "Refine Intent"}
        </button>
      </div>
    </div>
  );
}
