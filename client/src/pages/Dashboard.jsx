import React, { useState, useEffect, useMemo } from 'react';
import api from '../lib/api';
import CoinCard, { CoinCardSkeleton } from '../components/CoinCard';
import { useCurrency } from '../context/CurrencyContext';
import AiSummaryCard from '../components/AiSummaryCard';

export default function Dashboard() {
  const { currency } = useCurrency();
  const [coins, setCoins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'gainers' | 'losers'
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    let isMounted = true;

    async function fetchCoins() {
      try {
        const res = await api.get('/coins', {
          params: { currency: currency.toLowerCase() }
        });
        if (isMounted) {
          setCoins(res.data);
          setError(null);
          setLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || 'Error loading coins');
          setLoading(false);
        }
      }
    }

    // Initial fetch
    fetchCoins();

    // Polling every 45s
    const interval = setInterval(fetchCoins, 45000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [currency]);

  // Filter & sort coins based on active tab and search
  const processedCoins = useMemo(() => {
    let list = [...coins];

    // 1. Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.symbol.toLowerCase().includes(q)
      );
    }

    // 2. Tab sort & filter
    if (activeTab === 'gainers') {
      return list
        .filter(
          (c) =>
            (c.price_change_percentage_24h_in_currency ??
              c.price_change_percentage_24h ??
              0) > 0
        )
        .sort(
          (a, b) =>
            (b.price_change_percentage_24h_in_currency ??
              b.price_change_percentage_24h ??
              0) -
            (a.price_change_percentage_24h_in_currency ??
              a.price_change_percentage_24h ??
              0)
        );
    }

    if (activeTab === 'losers') {
      return list
        .filter(
          (c) =>
            (c.price_change_percentage_24h_in_currency ??
              c.price_change_percentage_24h ??
              0) < 0
        )
        .sort(
          (a, b) =>
            (a.price_change_percentage_24h_in_currency ??
              a.price_change_percentage_24h ??
              0) -
            (b.price_change_percentage_24h_in_currency ??
              b.price_change_percentage_24h ??
              0)
        );
    }

    // Default 'all' preserves market cap rank
    return list;
  }, [coins, activeTab, searchQuery]);

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text">Markets</h1>
          <p className="text-xs text-textMuted mt-0.5">
            Top 100 cryptocurrencies by market capitalization · Updated every 45s
          </p>
        </div>

        {/* Search Input */}
        <div className="w-full sm:w-72 relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search coin or symbol..."
            className="w-full px-3.5 py-1.5 bg-surface2 border border-border rounded-lg text-sm text-text placeholder-textFaint focus:outline-none focus:border-accent transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-textMuted hover:text-text cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* AI Market Summary Card — fetches independently, never blocks coin grid */}
      <AiSummaryCard />

      {/* Tabs: All / Gainers / Losers */}
      <div className="flex items-center gap-2 mb-6 border-b border-border pb-3">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
            activeTab === 'all'
              ? 'bg-surface2 text-text border border-border'
              : 'text-textMuted hover:text-text hover:bg-surface2/50'
          }`}
        >
          All Coins
        </button>
        <button
          onClick={() => setActiveTab('gainers')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
            activeTab === 'gainers'
              ? 'bg-surface2 text-bull border border-bull/30'
              : 'text-textMuted hover:text-bull hover:bg-surface2/50'
          }`}
        >
          <span>▲</span> Top Gainers
        </button>
        <button
          onClick={() => setActiveTab('losers')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
            activeTab === 'losers'
              ? 'bg-surface2 text-bear border border-bear/30'
              : 'text-textMuted hover:text-bear hover:bg-surface2/50'
          }`}
        >
          <span>▼</span> Top Losers
        </button>
      </div>

      {/* Error state banners */}
      {error && coins.length === 0 && (
        <div className="mb-4 p-3.5 rounded-lg bg-bear/10 border border-bear/30 text-bear text-xs flex items-center gap-2">
          <span>⚠️</span>
          <span>Couldn't load market data — retrying…</span>
        </div>
      )}

      {error && coins.length > 0 && (
        <div className="mb-4 p-2.5 rounded-lg bg-warn/10 border border-warn/30 text-warn text-xs flex items-center gap-2">
          <span>⚠️</span>
          <span>Live refresh failed — showing cached data. Reconnecting soon.</span>
        </div>
      )}

      {/* Card Grid Container */}
      {loading && coins.length === 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <CoinCardSkeleton key={i} />
          ))}
        </div>
      ) : processedCoins.length === 0 ? (
        <div className="w-full py-16 text-center text-textMuted text-sm bg-surface border border-border rounded-xl">
          {searchQuery
            ? `No cryptocurrencies match "${searchQuery}"`
            : 'No market data available.'}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {processedCoins.map((coin) => (
            <CoinCard key={coin.id} coin={coin} />
          ))}
        </div>
      )}
    </main>
  );
}
