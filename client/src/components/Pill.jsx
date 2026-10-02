import React from 'react';

export default function Pill({ variant = 'neutral', children, className = '' }) {
  const normVariant = String(variant).toLowerCase();

  let colorClasses = 'bg-surface2 text-textMuted border-border';
  if (normVariant === 'bullish' || normVariant === 'bull' || normVariant === 'green') {
    colorClasses = 'bg-bull/15 text-bull border-bull/30';
  } else if (normVariant === 'bearish' || normVariant === 'bear' || normVariant === 'red') {
    colorClasses = 'bg-bear/15 text-bear border-bear/30';
  } else if (normVariant === 'neutral' || normVariant === 'grey' || normVariant === 'gray') {
    colorClasses = 'bg-surface2 text-textMuted border-border';
  }

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border select-none tabular-nums ${colorClasses} ${className}`}
    >
      {children}
    </span>
  );
}
