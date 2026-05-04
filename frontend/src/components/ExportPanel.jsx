import React, { useState } from 'react';
import apiClient from '../api/client';

export default function ExportPanel({ promptId }) {
  const [loading, setLoading] = useState(null);

  const handleExport = async (format) => {
    if (!promptId) return;
    setLoading(format);
    try {
      const response = await apiClient.post('/export', {
        prompt_id: promptId,
        format: format
      }, { responseType: 'blob' });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      const ext = format === 'markdown' ? 'md' : format === 'json' ? 'json' : 'txt';
      link.setAttribute('download', `prompt_${promptId.substring(0,8)}.${ext}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (e) {
      console.error("Export failed", e);
    } finally {
      setLoading(null);
    }
  };

  if (!promptId) return null;

  const options = [
    { id: 'markdown', label: 'Markdown', icon: '📝' },
    { id: 'json', label: 'JSON', icon: '{}' },
    { id: 'cursor', label: 'Cursor Rules', icon: '⌨️' },
    { id: 'text', label: 'Plain Text', icon: '📄' }
  ];

  return (
    <div className="space-y-3">
      <h3 className="text-xs font-bold text-muted uppercase tracking-widest px-2">Export Refined Prompt</h3>
      <div className="grid grid-cols-2 gap-2">
        {options.map(opt => (
          <button
            key={opt.id}
            onClick={() => handleExport(opt.id)}
            disabled={!!loading}
            className="flex flex-col items-center justify-center p-3 bg-card border border-border rounded-xl hover:border-primary group transition-all disabled:opacity-50"
          >
            <span className="text-xl mb-1 group-hover:scale-110 transition-transform">
              {loading === opt.id ? '⏳' : opt.icon}
            </span>
            <span className="text-[10px] font-bold text-muted group-hover:text-text">{opt.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
