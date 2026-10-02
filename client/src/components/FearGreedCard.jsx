import React, { useState, useEffect } from 'react';
import api from '../lib/api';

// ── Skeleton ─────────────────────────────────────────────────────────────────
function FearGreedCardSkeleton() {
  return (
    <div className="bg-surface border border-border rounded-xl p-5 animate-pulse mb-6">
      {/* Label row skeleton */}
      <div className="h-3 w-36 bg-surface2 rounded mb-3" />
      {/* Value & label row skeleton */}
      <div className="flex items-baseline gap-3 mb-4">
        <div className="h-8 w-14 bg-surface2 rounded" />
        <div className="h-5 w-24 bg-surface2 rounded" />
      </div>
      {/* Gauge track skeleton */}
      <div className="h-2.5 w-full bg-surface2 rounded-full mb-2.5" />
      {/* Gauge scale labels skeleton */}
      <div className="flex justify-between">
        <div className="h-2 w-16 bg-surface2 rounded" />
        <div className="h-2 w-16 bg-surface2 rounded" />
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function FearGreedCard() {
  const [state, setState] = useState('loading'); // 'loading' | 'success' | 'error'
  const [data, setData] = useState(null);

  useEffect(() => {
    let isMounted = true;

    // Single fetch on mount — server caches for 30 minutes
    api
      .get('/sentiment/fear-greed')
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

  // ── Loading State ──────────────────────────────────────────────────────────
  if (state === 'loading') {
    return <FearGreedCardSkeleton />;
  }

  // ── Error State ────────────────────────────────────────────────────────────
  if (state === 'error' || !data?.current) {
    return (
      <div className="bg-surface border border-border rounded-xl p-5 mb-6">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-textMuted">
            Fear &amp; Greed Index
          </span>
        </div>
        <p className="text-sm text-textMuted">
          Sentiment data unavailable right now.
        </p>
      </div>
    );
  }

  // ── Success State ──────────────────────────────────────────────────────────
  const { current, stale } = data;
  const value = typeof current.value === 'number' ? current.value : 50;
  const label = current.label || 'Neutral';

  // Sentiment color coding reusing --bull and --bear tokens
  const sentimentColor =
    value >= 55 ? 'text-bull' : value <= 45 ? 'text-bear' : 'text-textMuted';

  const clampedValue = Math.min(Math.max(value, 0), 100);

  return (
    <div className="bg-surface border border-border rounded-xl p-5 mb-6">
      {/* Label row: title + optional stale tag */}
      <div className="flex items-center gap-2 mb-2">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-textMuted">
          Fear &amp; Greed Index
        </span>
        {stale && (
          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded border border-warn/40 text-warn bg-warn/10 select-none">
            stale
          </span>
        )}
      </div>

      {/* Numeric value large & bold + classification label */}
      <div className="flex items-baseline gap-3 mb-4">
        <span className={`text-2xl sm:text-3xl font-bold tabular-nums tracking-tight ${sentimentColor}`}>
          {value}
        </span>
        <span className={`text-sm sm:text-base font-semibold ${sentimentColor}`}>
          {label}
        </span>
      </div>

      {/* Horizontal gauge bar */}
      <div className="relative pt-1">
        {/* Track with CSS linear-gradient: red (0) through grey/amber (50) to green (100) */}
        <div
          className="relative w-full h-2.5 rounded-full overflow-hidden"
          style={{
            background: 'linear-gradient(to right, #EF4444, #F59E0B 50%, #22C55E)'
          }}
        />

        {/* Needle / Marker positioned at ${value}% along the track */}
        <div
          className="absolute top-0.5 -translate-x-1/2 flex flex-col items-center pointer-events-none transition-all duration-300"
          style={{ left: `${clampedValue}%` }}
        >
          <div className="w-3.5 h-3.5 rounded-full bg-white border-2 border-surface shadow-md" />
        </div>

        {/* Gauge Scale Labels */}
        <div className="flex justify-between text-[10px] text-textFaint mt-2 font-medium select-none">
          <span>0 Extreme Fear</span>
          <span>50 Neutral</span>
          <span>100 Extreme Greed</span>
        </div>
      </div>
    </div>
  );
}
