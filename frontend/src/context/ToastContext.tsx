import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertTriangle, AlertOctagon, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'warning' | 'error' | 'info';

export interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastContextType {
  toasts: ToastItem[];
  showToast: (toast: Omit<ToastItem, 'id'>) => void;
  removeToast: (id: string) => void;
  playTacticalSound: (type?: 'alert' | 'success' | 'click') => void;
  soundEnabled: boolean;
  toggleSound: () => boolean;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // High-tech audio synthesizer using Web Audio API (zero external assets needed)
  const playTacticalSound = useCallback((type: 'alert' | 'success' | 'click' = 'click') => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      const now = ctx.currentTime;
      if (type === 'alert') {
        // High urgency two-tone alert pulse
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(880, now);
        osc.frequency.exponentialRampToValueAtTime(440, now + 0.15);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        osc.start(now);
        osc.stop(now + 0.25);
      } else if (type === 'success') {
        // Crisp dual chime
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, now); // C5
        osc.frequency.setValueAtTime(659.25, now + 0.08); // E5
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.2);
      } else {
        // Subtle micro-click
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(1200, now);
        gain.gain.setValueAtTime(0.04, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
        osc.start(now);
        osc.stop(now + 0.04);
      }
    } catch (e) {
      // AudioContext might be blocked until first user gesture
    }
  }, [soundEnabled]);

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    if (next) playTacticalSound('success');
    return next;
  };

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(({ type, title, message, duration = 4500 }: Omit<ToastItem, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    setToasts((prev) => [...prev.slice(-4), { id, type, title, message, duration }]);

    if (type === 'error' || type === 'warning') {
      playTacticalSound('alert');
    } else {
      playTacticalSound('success');
    }

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, [playTacticalSound, removeToast]);

  return (
    <ToastContext.Provider value={{ toasts, showToast, removeToast, playTacticalSound, soundEnabled, toggleSound }}>
      {children}
      {/* Sleek Floating Glass Toast Container */}
      <div className="toast-container" style={{
        position: 'fixed',
        bottom: '1.5rem',
        right: '1.5rem',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: '0.6rem',
        maxWidth: '420px',
        width: 'calc(100% - 3rem)',
        pointerEvents: 'none'
      }}>
        {toasts.map((t) => {
          const isErr = t.type === 'error';
          const isWarn = t.type === 'warning';
          const isSucc = t.type === 'success';

          const borderColor = isErr ? '#f43f5e' : isWarn ? '#f59e0b' : isSucc ? '#10b981' : '#38bdf8';
          const bgGlow = isErr 
            ? 'rgba(244, 63, 94, 0.18)' 
            : isWarn 
            ? 'rgba(245, 158, 11, 0.18)' 
            : isSucc 
            ? 'rgba(16, 185, 129, 0.18)' 
            : 'rgba(56, 189, 248, 0.18)';

          const Icon = isErr ? AlertOctagon : isWarn ? AlertTriangle : isSucc ? CheckCircle2 : Info;

          return (
            <div
              key={t.id}
              className="toast-card"
              style={{
                pointerEvents: 'auto',
                background: 'rgba(15, 23, 42, 0.85)',
                backdropFilter: 'blur(16px)',
                border: `1px solid ${borderColor}`,
                borderRadius: '12px',
                padding: '0.85rem 1rem',
                boxShadow: `0 12px 36px rgba(0, 0, 0, 0.55), 0 0 20px ${bgGlow}`,
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.75rem',
                animation: 'slideInRight 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                color: '#f8fafc'
              }}
            >
              <div style={{ color: borderColor, marginTop: '2px', flexShrink: 0 }}>
                <Icon size={18} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: '0.86rem', letterSpacing: '-0.01em' }}>
                  {t.title}
                </div>
                {t.message && (
                  <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '0.2rem', lineHeight: 1.4 }}>
                    {t.message}
                  </div>
                )}
              </div>
              <button
                onClick={() => removeToast(t.id)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#64748b',
                  cursor: 'pointer',
                  padding: '2px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '4px'
                }}
              >
                <X size={15} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
