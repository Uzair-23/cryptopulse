import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useAlerts } from '../context/AlertContext';

/**
 * AlertWatcher — Mounted once in App.jsx.
 * Handles in-app toast display for triggered alerts when browser notifications
 * are denied or unsupported. Does nothing for guests.
 */
export default function AlertWatcher() {
  const { user } = useAuth();
  const { toasts, dismissToast } = useAlerts();

  if (!user || !toasts || toasts.length === 0) {
    return null;
  }

  return (
    <div
      aria-live="polite"
      className="fixed bottom-4 right-4 left-4 sm:left-auto sm:right-5 sm:bottom-5 z-50 flex flex-col gap-2.5 max-w-sm w-auto sm:w-full pointer-events-auto select-none"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="bg-surface border border-bull/40 rounded-xl shadow-2xl p-4 flex items-start gap-3 backdrop-blur-md animate-fade-in"
        >
          {/* Indicator Glyph */}
          <div
            className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
              toast.direction === 'below'
                ? 'bg-bear/15 text-bear border border-bear/30'
                : 'bg-bull/15 text-bull border border-bull/30'
            }`}
          >
            {toast.direction === 'below' ? '▼' : '▲'}
          </div>

          {/* Toast Content */}
          <div className="flex-1 min-w-0">
            <h4 className="text-xs font-bold text-text mb-0.5 tracking-tight">
              {toast.title}
            </h4>
            <p className="text-xs text-textMuted leading-relaxed">
              {toast.message}
            </p>
          </div>

          {/* Dismiss Button */}
          <button
            type="button"
            onClick={() => dismissToast(toast.id)}
            aria-label="Dismiss alert"
            className="text-textMuted hover:text-text text-sm font-semibold p-1 -mr-1 -mt-1 cursor-pointer transition-colors"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
