import React from 'react';

export default function Sparkline({ data = [], width = 120, height = 36 }) {
  if (!data || !Array.isArray(data) || data.length < 2) {
    return <div className="w-[120px] h-[36px] flex items-center justify-center text-textFaint text-xs">—</div>;
  }

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const paddingY = 4;
  const usableHeight = height - paddingY * 2;

  const points = data
    .map((val, idx) => {
      const x = ((idx / (data.length - 1)) * width).toFixed(1);
      const y = (height - paddingY - ((val - min) / range) * usableHeight).toFixed(1);
      return `${x},${y}`;
    })
    .join(' ');

  const isUp = data[data.length - 1] >= data[0];
  const strokeColor = isUp ? '#22C55E' : '#EF4444';

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="overflow-visible"
    >
      <polyline
        fill="none"
        stroke={strokeColor}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  );
}
