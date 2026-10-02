import React from 'react';

export default function Dashboard() {
  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col gap-2 mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-text">Markets</h1>
        <p className="text-sm text-textMuted">
          Top 100 cryptocurrencies by market capitalization
        </p>
      </div>

      <div className="bg-surface border border-border rounded-lg p-12 text-center text-textMuted">
        <p className="text-sm">Dashboard markets table will be loaded here in Task 5.</p>
      </div>
    </main>
  );
}
