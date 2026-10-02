import React, { useState } from 'react';

export default function CoinIcon({ src, symbol = '', name = '', size = 24 }) {
  const [error, setError] = useState(false);

  const fallbackChar = (symbol || name || '?').slice(0, 1).toUpperCase();

  if (error || !src) {
    return (
      <div
        className="rounded-full bg-surface2 border border-border flex items-center justify-center font-bold text-xs text-textMuted uppercase select-none shrink-0"
        style={{ width: size, height: size }}
      >
        {fallbackChar}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={name || symbol}
      width={size}
      height={size}
      onError={() => setError(true)}
      className="rounded-full object-cover shrink-0"
      style={{ width: size, height: size }}
      loading="lazy"
    />
  );
}
