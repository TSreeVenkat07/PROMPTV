import React from 'react';
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer,
  PieChart, Pie, Cell, Tooltip,
  LineChart, Line, XAxis, YAxis, CartesianGrid
} from 'recharts';

export default function AnalysisCharts({ score, history }) {
  if (!score) return null;

  const radarData = [
    { subject: 'Clarity', A: score.clarity, fullMark: 25 },
    { subject: 'Specificity', A: score.specificity, fullMark: 25 },
    { subject: 'Context', A: score.context, fullMark: 25 },
    { subject: 'Structure', A: score.structure, fullMark: 25 },
    { subject: 'Utility', A: Math.min(25, score.total / 4 + 5), fullMark: 25 },
  ];

  const pieData = [
    { name: 'Clarity', value: score.clarity },
    { name: 'Specificity', value: score.specificity },
    { name: 'Context', value: score.context },
    { name: 'Structure', value: score.structure },
  ];
  const COLORS = ['#3B82F6', '#FBBF24', '#60A5FA', '#F59E0B'];

  const lineData = history?.slice().reverse().map((v) => ({
    name: `V${v.version_number}`,
    score: v.score
  })) || [{ name: 'V1', score: score.total }];

  const tooltipStyle = {
    backgroundColor: '#0A192F',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '12px',
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
      <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl h-80 flex flex-col items-center">
        <h4 className="text-xs font-bold text-blue-400 uppercase mb-4 tracking-widest">Quality Radar</h4>
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
            <PolarGrid stroke="rgba(255,255,255,0.05)" />
            <PolarAngleAxis dataKey="subject" tick={{ fill: '#94A3B8', fontSize: 9 }} />
            <Radar name="Current" dataKey="A" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.3} />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl h-80 flex flex-col items-center">
        <h4 className="text-xs font-bold text-yellow-400 uppercase mb-4 tracking-widest">Distribution</h4>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={8} dataKey="value" stroke="none">
              {pieData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip contentStyle={tooltipStyle} itemStyle={{ color: '#F8FAFC', fontSize: '11px' }} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl h-80 flex flex-col items-center col-span-1 md:col-span-2">
        <h4 className="text-xs font-bold text-blue-400 uppercase mb-4 tracking-widest">Progression</h4>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={lineData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis dataKey="name" tick={{ fill: '#94A3B8', fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis domain={[0, 100]} tick={{ fill: '#94A3B8', fontSize: 10 }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={tooltipStyle} itemStyle={{ color: '#FBBF24', fontSize: '12px' }} />
            <Line type="monotone" dataKey="score" stroke="url(#blueGold)" strokeWidth={3}
              dot={{ r: 4, fill: '#FBBF24', strokeWidth: 0 }} />
            <defs>
              <linearGradient id="blueGold" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#3B82F6" />
                <stop offset="100%" stopColor="#FBBF24" />
              </linearGradient>
            </defs>
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
