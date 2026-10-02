import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import api from '../lib/api';
import CoinCard, { CoinCardSkeleton } from '../components/CoinCard';
import { useCurrency } from '../context/CurrencyContext';
import { useAuth } from '../context/AuthContext';
import { useWatchlist } from '../context/WatchlistContext';
import AiSummaryCard from '../components/AiSummaryCard';
import FearGreedCard from '../components/FearGreedCard';

export default function Dashboard({ initialTab }) {
  const { currency } = useCurrency();
  const { user } = useAuth();
  const { watchlist } = useWatchlist();
  const [searchParams, setSearchParams] = useSearchParams();

  const urlTab = searchParams.get('tab');
  const [coins, setCoins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(initialTab || urlTab || 'all'); // 'all' | 'watchlist' | 'gainers' | 'losers'
  const [searchQuery, setSearchQuery] = useState('');

  // Sync tab if URL or initialTab prop changes
  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    } else if (urlTab) {
      setActiveTab(urlTab);
    }
  }, [initialTab, urlTab]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'all') {
      const nextParams = new URLSearchParams(searchParams);
      nextParams.delete('tab');
      setSearchParams(nextParams, { replace: true });
    } else {
      setSearchParams({ tab }, { replace: true });
    }
  };

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

    // 1. Tab filter & sort
    if (activeTab === 'watchlist') {
      const lowerWatchlist = watchlist.map((id) => id.toLowerCase());
      list = list.filter((c) => lowerWatchlist.includes(c.id.toLowerCase()));
    } else if (activeTab === 'gainers') {
      list = list
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
    } else if (activeTab === 'losers') {
      list = list
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

    // 2. Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.symbol.toLowerCase().includes(q)
      );
    }

    return list;
  }, [coins, activeTab, searchQuery, watchlist]);

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text">
            {activeTab === 'watchlist' ? 'Watchlist' : 'Markets'}
          </h1>
          <p className="text-xs text-textMuted mt-0.5">
            {activeTab === 'watchlist'
              ? 'Your monitored cryptocurrencies · Track live price movements'
              : 'Top 100 cryptocurrencies by market capitalization · Updated every 45s'}
          </p>
        </div>

        {/* Search Input */}
        <div className="w-full sm:w-72 relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              activeTab === 'watchlist'
                ? 'Search watchlist...'
                : 'Search coin or symbol...'
            }
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

      {/* Fear & Greed Index & AI Market Summary — side-by-side row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mb-6 items-stretch">
        <FearGreedCard className="lg:col-span-5 xl:col-span-4 h-full" />
        <AiSummaryCard className="lg:col-span-7 xl:col-span-8 h-full" />
      </div>

      {/* Tabs: All / Watchlist / Gainers / Losers */}
      <div className="flex items-center gap-2 mb-6 border-b border-border pb-3 overflow-x-auto">
        <button
          onClick={() => handleTabChange('all')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
            activeTab === 'all'
              ? 'bg-surface2 text-text border border-border'
              : 'text-textMuted hover:text-text hover:bg-surface2/50'
          }`}
        >
          All Coins
        </button>
        <button
          onClick={() => handleTabChange('watchlist')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap flex items-center gap-1.5 transition-colors cursor-pointer ${
            activeTab === 'watchlist'
              ? 'bg-surface2 text-star border border-amber-400/30 shadow-sm'
              : 'text-textMuted hover:text-star hover:bg-surface2/50'
          }`}
        >
          <span className="text-star">★</span> Watchlist
          {user && watchlist.length > 0 && (
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-amber-400/20 text-star font-bold">
              {watchlist.length}
            </span>
          )}
        </button>
        <button
          onClick={() => handleTabChange('gainers')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap flex items-center gap-1.5 transition-colors cursor-pointer ${
            activeTab === 'gainers'
              ? 'bg-surface2 text-bull border border-bull/30'
              : 'text-textMuted hover:text-bull hover:bg-surface2/50'
          }`}
        >
          <span>▲</span> Top Gainers
        </button>
        <button
          onClick={() => handleTabChange('losers')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap flex items-center gap-1.5 transition-colors cursor-pointer ${
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

      {/* Content Area */}
      {loading && coins.length === 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <CoinCardSkeleton key={i} />
          ))}
        </div>
      ) : activeTab === 'watchlist' && !user ? (
        /* Guest state for Watchlist tab */
        <div className="w-full py-16 px-6 text-center bg-surface border border-border rounded-xl max-w-md mx-auto my-4">
          <div className="w-12 h-12 rounded-full bg-amber-400/10 border border-amber-400/20 text-star flex items-center justify-center mx-auto mb-4 text-xl">
            ★
          </div>
          <h3 className="text-base font-bold text-text mb-1.5">
            Sign in to track your Watchlist
          </h3>
          <p className="text-xs text-textMuted mb-6 leading-relaxed">
            Save and monitor your favorite cryptocurrencies in real-time across your devices.
          </p>
          <Link
            to="/login"
            className="inline-flex items-center justify-center px-4 py-2 bg-accent text-bg text-xs font-semibold rounded-lg hover:opacity-90 transition-opacity"
          >
            Sign in to CryptoPulse
          </Link>
        </div>
      ) : activeTab === 'watchlist' && watchlist.length === 0 ? (
        /* Empty Watchlist state */
        <div className="w-full py-16 px-6 text-center bg-surface border border-border rounded-xl max-w-lg mx-auto my-4">
          <div className="w-12 h-12 rounded-full bg-surface2 border border-border text-textMuted flex items-center justify-center mx-auto mb-4 text-xl">
            ☆
          </div>
          <h3 className="text-base font-bold text-text mb-1.5">
            Your Watchlist is empty
          </h3>
          <p className="text-xs text-textMuted mb-6 leading-relaxed">
            Click the star icon (★) on any coin card or detail page to monitor it here separately.
          </p>
          <button
            onClick={() => handleTabChange('all')}
            className="inline-flex items-center justify-center px-4 py-2 bg-surface2 border border-border text-text hover:text-accent text-xs font-semibold rounded-lg transition-colors cursor-pointer"
          >
            Browse All Coins
          </button>
        </div>
      ) : processedCoins.length === 0 ? (
        <div className="w-full py-16 text-center text-textMuted text-sm bg-surface border border-border rounded-xl">
          {searchQuery
            ? `No cryptocurrencies match "${searchQuery}"`
            : 'No coins available.'}
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
