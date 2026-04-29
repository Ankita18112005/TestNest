import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

export const useToast = () => useContext(ToastContext);

const ICONS = {
  success: <CheckCircle size={20} />,
  error:   <XCircle size={20} />,
  warning: <AlertCircle size={20} />,
  info:    <Info size={20} />,
};

const COLORS = {
  success: { bg: '#10b981', light: 'rgba(16,185,129,0.12)', text: '#10b981' },
  error:   { bg: '#ef4444', light: 'rgba(239,68,68,0.12)',  text: '#ef4444' },
  warning: { bg: '#f59e0b', light: 'rgba(245,158,11,0.12)', text: '#f59e0b' },
  info:    { bg: '#3b82f6', light: 'rgba(59,130,246,0.12)', text: '#3b82f6' },
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const toast = useCallback((message, type = 'info', duration = 3500) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), duration);
  }, []);

  const remove = (id) => setToasts(prev => prev.filter(t => t.id !== id));

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div style={{
        position: 'fixed', bottom: '2rem', right: '2rem',
        display: 'flex', flexDirection: 'column', gap: '0.75rem',
        zIndex: 9999, pointerEvents: 'none',
      }}>
        {toasts.map(t => (
          <div key={t.id} style={{
            pointerEvents: 'all',
            display: 'flex', alignItems: 'center', gap: '0.75rem',
            background: 'var(--card-bg)',
            border: `1px solid ${COLORS[t.type].text}40`,
            borderLeft: `4px solid ${COLORS[t.type].bg}`,
            borderRadius: '10px',
            padding: '0.85rem 1.1rem',
            minWidth: '280px', maxWidth: '380px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
            animation: 'toastIn 0.3s cubic-bezier(.21,1.02,.73,1) forwards',
          }}>
            <span style={{ color: COLORS[t.type].text, flexShrink: 0 }}>{ICONS[t.type]}</span>
            <span style={{ fontSize: '0.9rem', color: 'var(--text-primary)', flex: 1 }}>{t.message}</span>
            <button onClick={() => remove(t.id)} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--text-secondary)', padding: 0, flexShrink: 0,
              display: 'flex', alignItems: 'center',
            }}>
              <X size={16} />
            </button>
          </div>
        ))}
      </div>

      <style>{`
        @keyframes toastIn {
          from { opacity: 0; transform: translateX(60px) scale(0.95); }
          to   { opacity: 1; transform: translateX(0)   scale(1); }
        }
      `}</style>
    </ToastContext.Provider>
  );
};
