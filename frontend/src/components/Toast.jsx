import React, { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext();

export const useToast = () => useContext(ToastContext);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const show = useCallback((message, type = 'info') => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts(p => [...p, { id, message, type }]);
    setTimeout(() => {
      setToasts(p => p.filter(t => t.id !== id));
    }, 3000);
  }, []);

  const remove = useCallback((id) => {
    setToasts(p => p.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col space-y-3">
        {toasts.map(t => (
          <div
            key={t.id}
            className={`flex items-center justify-between min-w-[300px] px-6 py-4 rounded-xl shadow-2xl text-white font-bold animate-slide-in-right ${
              t.type === 'success' ? 'bg-success' :
              t.type === 'error' ? 'bg-danger' :
              t.type === 'warning' ? 'bg-warning' : 'bg-primary'
            }`}
          >
            <span>{t.message}</span>
            <button onClick={() => remove(t.id)} className="ml-4 text-white opacity-70 hover:opacity-100">&times;</button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
