import React from 'react';
import { useParams, Link } from 'react-router-dom';

export default function CoinDetail() {
  const { id } = useParams();

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <Link to="/" className="text-xs font-medium text-textMuted hover:text-text flex items-center gap-1">
          ← Back to Markets
        </Link>
      </div>

      <div className="bg-surface border border-border rounded-lg p-12 text-center text-textMuted">
        <h1 className="text-2xl font-bold text-text capitalize mb-2">{id}</h1>
        <p className="text-sm">Interactive chart and analytics will be loaded here in Task 6.</p>
      </div>
    </main>
  );
}
