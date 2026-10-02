import React, { useState, useEffect } from 'react';
import api from '../lib/api';
import SectionLabel from './SectionLabel';

/**
 * Returns a human-readable relative time string from an ISO timestamp.
 * e.g. "just now", "3m ago", "1h ago", "2d ago"
 */
function relativeTime(isoString) {
  if (!isoString) return '';
  const diff = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
  if (diff < 30) return 'just now';
  if (diff < 3600) return `${Math.max(1, Math.floor(diff / 60))}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

// ── Skeleton ─────────────────────────────────────────────────────────────────
function AiCoinInsightSkeleton() {
  return (
    <div className="bg-surface border border-border rounded-xl p-4 sm:p-5 animate-pulse">
      {/* Label */}
      <div className="h-3 w-20 bg-surface2 rounded mb-3" />
      {/* Headline */}
      <div className="h-4 w-4/5 bg-surface2 rounded mb-3" />
      {/* Insight paragraph */}
      <div className="space-y-2 mb-3.5">
        <div className="h-3 w-full bg-surface2 rounded" />
        <div className="h-3 w-11/12 bg-surface2 rounded" />
        <div className="h-3 w-4/6 bg-surface2 rounded" />
      </div>
      {/* Bullets */}
      <div className="space-y-2 mb-4">
        <div className="h-3 w-10/12 bg-surface2 rounded" />
        <div className="h-3 w-9/12 bg-surface2 rounded" />
      </div>
      {/* Footer */}
      <div className="pt-2.5 border-t border-border/60 flex items-center justify-between">
        <div className="h-2.5 w-16 bg-surface2 rounded" />
        <div className="h-2.5 w-36 bg-surface2 rounded" />
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function AiCoinInsightCard({ coinId }) {
  const [status, setStatus] = useState('loading'); // 'loading' | 'success' | 'error'
  const [data, setData] = useState(null);

  useEffect(() => {
    let isMounted = true;
    if (!coinId) return;

    setStatus('loading');
    setData(null);

    api
      .get(`/ai/coin/${encodeURIComponent(coinId)}`)
      .then((res) => {
        if (!isMounted) return;
        setData(res.data);
        setStatus('success');
      })
      .catch(() => {
        if (!isMounted) return;
        setStatus('error');
      });

    return () => {
      isMounted = false;
    };
  }, [coinId]);

  // Loading state
  if (status === 'loading') {
    return <AiCoinInsightSkeleton />;
  }

  // Error state (404/503 or network failure)
  if (status === 'error' || !data) {
    return (
      <div className="bg-surface border border-border rounded-xl p-4 sm:p-5">
        <div className="flex items-center gap-2 mb-2">
          <SectionLabel color="text-ai">AI Insight</SectionLabel>
        </div>
        <p className="text-xs text-textMuted leading-relaxed">
          AI insight unavailable for this coin right now
        </p>
      </div>
    );
  }

  const { headline, insight, observations, generatedAt, stale } = data;

  return (
    <div className="bg-surface border border-border rounded-xl p-4 sm:p-5">
      {/* Header: Label + optional stale pill */}
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <SectionLabel color="text-ai">AI Insight</SectionLabel>
        {stale && (
          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded border border-warn/40 text-warn bg-warn/10 select-none">
            stale
          </span>
        )}
      </div>

      {/* Headline */}
      {headline && (
        <h3 className="text-sm font-bold text-text mb-2 leading-snug">
          {headline}
        </h3>
      )}

      {/* Insight paragraph */}
      {insight && (
        <p className="text-xs text-textMuted leading-relaxed mb-3">
          {insight}
        </p>
      )}

      {/* Observations bullets */}
      {Array.isArray(observations) && observations.length > 0 && (
        <ul className="space-y-1.5 mb-3.5 pl-0">
          {observations.map((obs, idx) => (
            <li
              key={idx}
              className="flex items-start gap-2 text-xs text-textMuted leading-relaxed"
            >
              <span className="text-ai mt-0.5 shrink-0 select-none">•</span>
              <span>{obs}</span>
            </li>
          ))}
        </ul>
      )}

      {/* Footer: relative time & educational disclaimer */}
      <div className="pt-2.5 border-t border-border/60 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 text-[11px] text-textMuted">
        {generatedAt && (
          <span className="text-textFaint">
            Updated {relativeTime(generatedAt)}
          </span>
        )}
        <span className="text-textFaint">
          Educational only — not financial advice.
        </span>
      </div>
    </div>
  );
}
