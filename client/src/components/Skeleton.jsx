import React from 'react';

export default function Skeleton({ className = '' }) {
  return (
    <div className={`animate-pulse bg-surface2 rounded ${className}`} />
  );
}
