import React, { useState, useEffect } from 'react';
import apiClient from '../api/client';

export default function TemplateLibrary({ isOpen, onClose, onSelect }) {
  const [templates, setTemplates] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      apiClient.get('/templates')
        .then(res => setTemplates(res.data))
        .finally(() => setLoading(false));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const categories = ['All', 'Build', 'Debug', 'Design', 'Write'];
  const filtered = templates.filter(t => 
    (category === 'All' || t.category === category) &&
    (t.name.toLowerCase().includes(search.toLowerCase()) || t.content.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface bg-opacity-80 backdrop-blur-md animate-fade-in">
      <div className="bg-card w-full max-w-4xl max-h-[80vh] rounded-2xl border border-border shadow-2xl flex flex-col overflow-hidden animate-slide-up">
        <div className="p-6 border-b border-border space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-black text-text">Prompt Template Library</h2>
            <button onClick={onClose} className="text-muted hover:text-text text-2xl">&times;</button>
          </div>
          <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-4">
            <input 
              type="text" 
              placeholder="Search templates..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 bg-surface border border-border rounded-lg px-4 py-2 text-sm focus:ring-1 focus:ring-primary outline-none"
            />
            <div className="flex space-x-1 p-1 bg-surface rounded-lg border border-border overflow-x-auto">
              {categories.map(c => (
                <button
                  key={c}
                  onClick={() => setCategory(c)}
                  className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
                    category === c ? 'bg-primary text-white' : 'text-muted hover:text-text'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1,2,3,4].map(i => <div key={i} className="h-32 bg-border animate-pulse rounded-xl" />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filtered.map(t => (
                <button
                  key={t.id}
                  onClick={() => { onSelect(t.content); onClose(); }}
                  className="p-5 bg-surface border border-border rounded-xl text-left hover:border-primary group transition-all transform hover:-translate-y-1"
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-black text-primary uppercase tracking-widest">{t.category}</span>
                    <div className="flex space-x-1">
                      {t.tags.slice(0,2).map(tag => (
                        <span key={tag} className="text-[10px] bg-border px-1.5 py-0.5 rounded text-muted">#{tag}</span>
                      ))}
                    </div>
                  </div>
                  <h4 className="font-bold text-text mb-2 group-hover:text-primary transition-colors">{t.name}</h4>
                  <p className="text-xs text-muted line-clamp-2 italic">{t.content}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
