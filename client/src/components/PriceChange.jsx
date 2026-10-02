import React from 'react';

export default function PriceChange({ value, className = '' }) {
  if (value === null || value === undefined || isNaN(value)) {
    return <span className={`text-textMuted ${className}`}>—</span>;
  }

  const num = Number(value);

  if (num === 0) {
    return <span className={`text-textMuted tabular-nums ${className}`}>0.00%</span>;
  }

  const isPositive = num > 0;
  const colorClass = isPositive ? 'text-bull' : 'text-bear';
  const arrow = isPositive ? '▲' : '▼';
  const formatted = Math.abs(num).toFixed(2);

  return (
    <span className={`inline-flex items-center gap-1 font-medium tabular-nums ${colorClass} ${className}`}>
      <span className="text-[10px] leading-none select-none">{arrow}</span>
      <span>{formatted}%</span>
    </span>
  );
}
