import React from 'react';

export default function Loader({ type }) {
  if (type === 'card') {
    return (
      <div className="bg-card p-6 rounded-2xl border border-border animate-pulse space-y-4">
        <div className="h-4 bg-border rounded w-1/4" />
        <div className="h-32 bg-border rounded w-full" />
        <div className="space-y-2">
          <div className="h-2 bg-border rounded w-full" />
          <div className="h-2 bg-border rounded w-5/6" />
        </div>
      </div>
    );
  }

  if (type === 'sidebar') {
    return (
      <div className="space-y-4 animate-pulse">
        {[1,2,3].map(i => <div key={i} className="h-12 bg-border rounded-lg" />)}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center p-12">
      <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
