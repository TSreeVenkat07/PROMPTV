import React from 'react';

export default function ScoreDisplay({ score }) {
  if (!score) return null;

  const getGradeColor = (grade) => {
    const colors = {
      'A': '#D4AF37', // Gold
      'B': '#F1E5AC', // Champagne
      'C': '#94A3B8', // Slate
      'D': '#64748b', // Muted
      'F': '#EF4444'  // Alert
    };
    return colors[grade] || 'var(--muted)';
  };

  const metrics = [
    { label: 'Eloquence', value: score.clarity },
    { label: 'Precision', value: score.specificity },
    { label: 'Magnitude', value: score.context },
    { label: 'Order', value: score.structure }
  ];

  return (
    <div className="glass p-6 rounded-2xl border border-primary/20 shadow-2xl animate-fade-in flex flex-col items-center">
        <div className="relative flex items-center justify-center mb-6">
          <svg className="w-32 h-32 transform -rotate-90">
            <circle
              cx="64"
              cy="64"
              r="58"
              fill="transparent"
              stroke="rgba(212, 175, 55, 0.05)"
              strokeWidth="4"
            />
            <circle
              cx="64"
              cy="64"
              r="58"
              fill="transparent"
              stroke="currentColor"
              strokeWidth="6"
              strokeDasharray={364.4}
              strokeDashoffset={364.4 * (1 - score.total / 100)}
              className="transition-all duration-1000 ease-out"
              style={{ color: getGradeColor(score.grade) }}
            />
          </svg>
          <div className="absolute flex flex-col items-center">
            <span className="text-4xl font-black italic" style={{ color: getGradeColor(score.grade) }}>{score.grade}</span>
            <span className="text-[9px] text-muted font-black tracking-widest uppercase">{score.total}%</span>
          </div>
        </div>

      <div className="w-full space-y-4">
        {metrics.map((m) => (
          <div key={m.label} className="space-y-1.5">
            <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-primary/70">
              <span>{m.label}</span>
              <span>{m.value}</span>
            </div>
            <div className="h-0.5 w-full bg-white/5 rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary/40 transition-all duration-1000"
                style={{ width: `${(m.value / 25) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
