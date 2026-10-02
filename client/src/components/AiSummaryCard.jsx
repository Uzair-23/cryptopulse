import React, { useState, useEffect } from 'react';
import api from '../lib/api';
import SectionLabel from './SectionLabel';

/**
 * Returns a human-readable relative time string from an ISO timestamp.
 * e.g. "just now", "3m ago", "1h ago", "2d ago"
 * No external dependency — pure JS.
 */
function relativeTime(isoString) {
  if (!isoString) return '';
  const diff = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
  if (diff < 30) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

// ── Skeleton ─────────────────────────────────────────────────────────────────
function AiSummaryCardSkeleton() {
  return (
    <div className="bg-surface border border-border rounded-xl p-5 animate-pulse mb-6">
      {/* Label row */}
      <div className="flex items-center gap-2 mb-3">
        <div className="h-3 w-28 bg-surface2 rounded" />
      </div>
      {/* Headline */}
      <div className="h-4 w-3/5 bg-surface2 rounded mb-3" />
      {/* Summary lines */}
      <div className="space-y-2 mb-4">
        <div className="h-3 w-full bg-surface2 rounded" />
        <div className="h-3 w-5/6 bg-surface2 rounded" />
        <div className="h-3 w-4/6 bg-surface2 rounded" />
      </div>
      {/* Tips */}
      <div className="space-y-2 mb-4">
        <div className="h-3 w-11/12 bg-surface2 rounded" />
        <div className="h-3 w-10/12 bg-surface2 rounded" />
        <div className="h-3 w-9/12 bg-surface2 rounded" />
      </div>
      {/* Meta */}
      <div className="h-2.5 w-24 bg-surface2 rounded" />
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function AiSummaryCard() {
  const [state, setState] = useState('loading'); // 'loading' | 'success' | 'error'
  const [data, setData] = useState(null);

  useEffect(() => {
    let isMounted = true;

    // Single fetch on mount — server already caches for 10 min, no polling needed
    api
      .get('/ai/market-summary')
      .then((res) => {
        if (!isMounted) return;
        setData(res.data);
        setState('success');
      })
      .catch(() => {
        if (!isMounted) return;
        setState('error');
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // ── Loading ────────────────────────────────────────────────────────────────
  if (state === 'loading') return <AiSummaryCardSkeleton />;

  // ── Error ──────────────────────────────────────────────────────────────────
  if (state === 'error') {
    return (
      <div className="bg-surface border border-border rounded-xl p-5 mb-6">
        <div className="flex items-center gap-2 mb-1">
          <SectionLabel color="text-ai">AI Market Insight</SectionLabel>
        </div>
        <p className="text-sm text-textMuted">
          AI insights aren't available right now.
        </p>
      </div>
    );
  }

  // ── Success ────────────────────────────────────────────────────────────────
  const { headline, summary, tips, generatedAt, stale } = data;

  return (
    <div className="bg-surface border border-border rounded-xl p-5 mb-6">
      {/* Label row: "AI Market Insight" + optional stale tag */}
      <div className="flex items-center gap-2 mb-3">
        <SectionLabel color="text-ai">AI Market Insight</SectionLabel>
        {stale && (
          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded border border-warn/40 text-warn bg-warn/10 select-none">
            stale
          </span>
        )}
      </div>

      {/* Headline */}
      <p className="text-sm font-bold text-text mb-2 leading-snug">{headline}</p>

      {/* Summary */}
      <p className="text-xs text-textMuted leading-relaxed mb-3">{summary}</p>

      {/* Tips */}
      <ul className="space-y-1.5 mb-4 pl-0">
        {tips.map((tip, i) => (
          <li
            key={i}
            className="flex items-start gap-2 text-xs text-textMuted"
          >
            <span className="text-ai mt-0.5 shrink-0 select-none">•</span>
            <span>{tip}</span>
          </li>
        ))}
      </ul>

      {/* Meta row: timestamp + disclaimer */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 pt-3 border-t border-border/50">
        <span className="text-[11px] text-textFaint">
          Updated {relativeTime(generatedAt)}
        </span>
        <span className="text-[11px] text-textFaint">
          AI-generated — may be inaccurate. Educational only, not financial advice.
        </span>
      </div>
    </div>
  );
}
