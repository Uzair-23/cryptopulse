import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import PriceChange from '../components/PriceChange';
import Sparkline from '../components/Sparkline';
import CoinIcon from '../components/CoinIcon';

// Currency formatters
const currencyCompactFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  notation: 'compact',
  maximumFractionDigits: 2
});

const currencyStandardFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});

const currencySubDollarFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 4,
  maximumFractionDigits: 6
});

function formatPrice(price) {
  if (price === null || price === undefined || isNaN(price)) return '—';
  if (price >= 1) {
    return currencyStandardFormatter.format(price);
  }
  return currencySubDollarFormatter.format(price);
}

function formatVolumeOrCap(value) {
  if (value === null || value === undefined || isNaN(value)) return '—';
  return currencyCompactFormatter.format(value);
}

export default function Dashboard() {
  const [coins, setCoins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'gainers' | 'losers'
  const [searchQuery, setSearchQuery] = useState('');

  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;

    async function fetchCoins() {
      try {
        const res = await api.get('/coins');
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
  }, []);

  // Filter & sort coins based on active tab and search
  const processedCoins = React.useMemo(() => {
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
        .filter((c) => (c.price_change_percentage_24h_in_currency ?? c.price_change_percentage_24h ?? 0) > 0)
        .sort(
          (a, b) =>
            (b.price_change_percentage_24h_in_currency ?? b.price_change_percentage_24h ?? 0) -
            (a.price_change_percentage_24h_in_currency ?? a.price_change_percentage_24h ?? 0)
        );
    }

    if (activeTab === 'losers') {
      return list
        .filter((c) => (c.price_change_percentage_24h_in_currency ?? c.price_change_percentage_24h ?? 0) < 0)
        .sort(
          (a, b) =>
            (a.price_change_percentage_24h_in_currency ?? a.price_change_percentage_24h ?? 0) -
            (b.price_change_percentage_24h_in_currency ?? b.price_change_percentage_24h ?? 0)
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
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-textFaint hover:text-text text-xs"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Tabs Row */}
      <div className="flex items-center gap-2 mb-4 border-b border-border pb-3">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
            activeTab === 'all'
              ? 'bg-surface2 text-text border border-border/80'
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

      {/* Table Container */}
      <div className="w-full overflow-x-auto border border-border rounded-lg bg-surface">
        <table className="w-full text-left text-sm border-collapse">
          <thead>
            <tr className="border-b border-border text-[11px] font-semibold text-textMuted uppercase tracking-wider bg-surface select-none">
              <th className="py-3 px-3 w-12 text-center">#</th>
              <th className="py-3 px-4 min-w-[180px]">Coin</th>
              <th className="py-3 px-4 text-right">Price</th>
              <th className="py-3 px-4 text-right">1h</th>
              <th className="py-3 px-4 text-right">24h</th>
              <th className="py-3 px-4 text-right">7d</th>
              <th className="py-3 px-4 text-right min-w-[110px]">24h Volume</th>
              <th className="py-3 px-4 text-right min-w-[120px]">Market Cap</th>
              <th className="py-3 px-4 text-center min-w-[140px]">Last 7 Days</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {loading && coins.length === 0 ? (
              // 10 Skeleton rows while loading
              Array.from({ length: 10 }).map((_, i) => (
                <tr key={i} className="animate-pulse h-14">
                  <td className="py-3 px-3 text-center">
                    <div className="h-3 w-4 bg-surface2 rounded mx-auto" />
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-6 h-6 rounded-full bg-surface2" />
                      <div className="space-y-1">
                        <div className="h-3 w-20 bg-surface2 rounded" />
                        <div className="h-2 w-10 bg-surface2 rounded" />
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="h-3 w-16 bg-surface2 rounded ml-auto" />
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="h-3 w-12 bg-surface2 rounded ml-auto" />
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="h-3 w-12 bg-surface2 rounded ml-auto" />
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="h-3 w-12 bg-surface2 rounded ml-auto" />
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="h-3 w-16 bg-surface2 rounded ml-auto" />
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="h-3 w-20 bg-surface2 rounded ml-auto" />
                  </td>
                  <td className="py-3 px-4 text-center">
                    <div className="h-6 w-24 bg-surface2 rounded mx-auto" />
                  </td>
                </tr>
              ))
            ) : processedCoins.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-12 text-center text-textMuted text-xs">
                  {searchQuery ? `No cryptocurrencies match "${searchQuery}"` : 'No market data available.'}
                </td>
              </tr>
            ) : (
              processedCoins.map((coin) => {
                const change1h = coin.price_change_percentage_1h_in_currency;
                const change24h = coin.price_change_percentage_24h_in_currency ?? coin.price_change_percentage_24h;
                const change7d = coin.price_change_percentage_7d_in_currency;
                const sparklineData = coin.sparkline_in_7d?.price || [];

                return (
                  <tr
                    key={coin.id}
                    onClick={() => navigate(`/coin/${coin.id}`)}
                    className="hover:bg-surface2 transition-colors cursor-pointer group"
                  >
                    {/* Rank */}
                    <td className="py-3 px-3 text-center text-xs text-textMuted tabular-nums">
                      {coin.market_cap_rank || '—'}
                    </td>

                    {/* Coin: Icon + Name + Symbol */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <CoinIcon
                          src={coin.image}
                          symbol={coin.symbol}
                          name={coin.name}
                          size={24}
                        />
                        <div className="flex items-baseline gap-1.5 truncate">
                          <span className="font-semibold text-text group-hover:text-accent transition-colors truncate">
                            {coin.name}
                          </span>
                          <span className="text-xs text-textMuted uppercase font-medium">
                            {coin.symbol}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Price */}
                    <td className="py-3 px-4 text-right font-medium tabular-nums text-text">
                      {formatPrice(coin.current_price)}
                    </td>

                    {/* 1h % */}
                    <td className="py-3 px-4 text-right">
                      <PriceChange value={change1h} />
                    </td>

                    {/* 24h % */}
                    <td className="py-3 px-4 text-right">
                      <PriceChange value={change24h} />
                    </td>

                    {/* 7d % */}
                    <td className="py-3 px-4 text-right">
                      <PriceChange value={change7d} />
                    </td>

                    {/* 24h Volume */}
                    <td className="py-3 px-4 text-right text-textMuted tabular-nums">
                      {formatVolumeOrCap(coin.total_volume)}
                    </td>

                    {/* Market Cap */}
                    <td className="py-3 px-4 text-right text-textMuted tabular-nums font-medium">
                      {formatVolumeOrCap(coin.market_cap)}
                    </td>

                    {/* 7d Sparkline */}
                    <td className="py-3 px-4 text-center">
                      <div className="flex justify-center">
                        <Sparkline data={sparklineData} width={120} height={32} />
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
