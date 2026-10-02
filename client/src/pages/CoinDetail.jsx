import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';
import api from '../lib/api';
import CoinIcon from '../components/CoinIcon';
import PriceChange from '../components/PriceChange';
import Skeleton from '../components/Skeleton';

// Currency & number formatters
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

const numberCompactFormatter = new Intl.NumberFormat('en-US', {
  notation: 'compact',
  maximumFractionDigits: 2
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

function formatSupply(value, symbol) {
  if (value === null || value === undefined || isNaN(value)) return '—';
  const formatted = numberCompactFormatter.format(value);
  return symbol ? `${formatted} ${symbol.toUpperCase()}` : formatted;
}

const TIMEFRAMES = [
  { label: '24H', days: '1' },
  { label: '7D', days: '7' },
  { label: '30D', days: '30' },
  { label: '1Y', days: '365' }
];

function CustomChartTooltip({ active, payload, timeframe, startPrice }) {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const date = new Date(data.timestamp);
    const dateStr =
      timeframe === '1'
        ? date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
          })
        : date.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
          });

    const diff =
      startPrice !== null && startPrice !== undefined
        ? data.price - startPrice
        : null;
    const pct = startPrice && startPrice > 0 ? (diff / startPrice) * 100 : null;

    return (
      <div className="bg-surface border border-border px-3.5 py-2.5 rounded-lg shadow-xl text-xs select-none">
        <p className="text-textMuted mb-1 font-medium">{dateStr}</p>
        <p className="text-sm font-bold text-text tabular-nums mb-1.5">
          {formatPrice(data.price)}
        </p>
        {diff !== null && (
          <div className="flex items-center gap-1.5 pt-1.5 border-t border-border/60">
            <span
              className={`font-semibold tabular-nums ${
                diff >= 0 ? 'text-bull' : 'text-bear'
              }`}
            >
              {diff >= 0 ? '+' : '-'}
              {formatPrice(Math.abs(diff))}
            </span>
            <PriceChange value={pct} className="text-xs" />
          </div>
        )}
      </div>
    );
  }
  return null;
}

export default function CoinDetail() {
  const { id } = useParams();

  const [coin, setCoin] = useState(null);
  const [coinLoading, setCoinLoading] = useState(true);
  const [coinNotFound, setCoinNotFound] = useState(false);

  const [timeframe, setTimeframe] = useState('7');
  const [chartState, setChartState] = useState({
    data: null,
    timeframe: '7'
  });
  const [chartLoading, setChartLoading] = useState(false);
  const [hasLittleData, setHasLittleData] = useState(false);

  // 1. Fetch coin market data
  useEffect(() => {
    let isMounted = true;
    setCoinLoading(true);
    setCoinNotFound(false);

    async function fetchCoinData() {
      try {
        const res = await api.get('/coins');
        if (!isMounted) return;

        const match = res.data?.find((c) => c.id === id);
        if (match) {
          setCoin(match);
          setCoinNotFound(false);
        } else {
          setCoin(null);
          setCoinNotFound(true);
        }
      } catch (err) {
        if (!isMounted) return;
        setCoinNotFound(true);
      } finally {
        if (isMounted) {
          setCoinLoading(false);
        }
      }
    }

    if (id) {
      fetchCoinData();
    }

    return () => {
      isMounted = false;
    };
  }, [id]);

  // 2. Fetch chart data for selected timeframe
  useEffect(() => {
    let isMounted = true;
    setChartLoading(true);

    async function fetchChart() {
      try {
        const res = await api.get(
          `/coins/${encodeURIComponent(id)}/chart?days=${timeframe}`
        );
        if (!isMounted) return;

        const prices = res.data?.prices;
        if (!prices || !Array.isArray(prices) || prices.length < 2) {
          setHasLittleData(true);
          setChartState({ data: [], timeframe });
        } else {
          setHasLittleData(false);
          const formatted = prices.map(([ts, price]) => ({
            timestamp: ts,
            price
          }));
          setChartState({ data: formatted, timeframe });
        }
      } catch (err) {
        if (!isMounted) return;
        setHasLittleData(true);
      } finally {
        if (isMounted) {
          setChartLoading(false);
        }
      }
    }

    if (id) {
      fetchChart();
    }

    return () => {
      isMounted = false;
    };
  }, [id, timeframe]);

  // The active chart data and its corresponding timeframe
  const currentChartData = chartState.data;
  const displayedTf = chartState.timeframe;
  const activeTfObj =
    TIMEFRAMES.find((tf) => tf.days === displayedTf) || TIMEFRAMES[1];
  const activeTfLabel = activeTfObj.label;

  // Calculate profit/loss for the displayed timeframe
  const { startPrice, currentPrice, tfChangeAmount, tfChangePercent } =
    useMemo(() => {
      if (currentChartData && currentChartData.length >= 2) {
        const sPrice = currentChartData[0].price;
        const ePrice = currentChartData[currentChartData.length - 1].price;
        const diff = ePrice - sPrice;
        const pct = sPrice > 0 ? (diff / sPrice) * 100 : 0;
        return {
          startPrice: sPrice,
          currentPrice: ePrice,
          tfChangeAmount: diff,
          tfChangePercent: pct
        };
      }

      if (coin) {
        const cPrice = coin.current_price;
        if (displayedTf === '1') {
          const pct =
            coin.price_change_percentage_24h_in_currency ??
            coin.price_change_percentage_24h ??
            0;
          const diff = coin.price_change_24h ?? (cPrice * pct) / 100;
          return {
            startPrice: cPrice - diff,
            currentPrice: cPrice,
            tfChangeAmount: diff,
            tfChangePercent: pct
          };
        }
        if (displayedTf === '7') {
          const pct = coin.price_change_percentage_7d_in_currency ?? 0;
          const diff = (cPrice * pct) / 100;
          return {
            startPrice: cPrice - diff,
            currentPrice: cPrice,
            tfChangeAmount: diff,
            tfChangePercent: pct
          };
        }
      }

      return {
        startPrice: null,
        currentPrice: coin?.current_price ?? 0,
        tfChangeAmount: null,
        tfChangePercent: null
      };
    }, [currentChartData, displayedTf, coin]);

  const isNetUp = (tfChangeAmount ?? 0) >= 0;
  const strokeColor = isNetUp ? '#22C55E' : '#EF4444';

  // Evenly spaced X-axis ticks to prevent duplicate date labels
  const chartTicks = useMemo(() => {
    if (!currentChartData || currentChartData.length < 2) return [];
    const count = 6;
    const step = (currentChartData.length - 1) / (count - 1);
    const ticks = [];
    for (let i = 0; i < count; i++) {
      const idx = Math.min(Math.round(i * step), currentChartData.length - 1);
      ticks.push(currentChartData[idx].timestamp);
    }
    return ticks;
  }, [currentChartData]);

  const formatXAxis = (ts) => {
    if (!ts) return '';
    const date = new Date(ts);
    if (displayedTf === '1') {
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
    }
    if (displayedTf === '365') {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        year: '2-digit'
      });
    }
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const formatYAxis = (val) => {
    if (val === null || val === undefined) return '';
    if (val >= 1000) {
      return (
        '$' +
        Intl.NumberFormat('en-US', {
          notation: 'compact',
          maximumFractionDigits: 1
        }).format(val)
      );
    }
    if (val >= 1) {
      return '$' + val.toFixed(2);
    }
    return '$' + val.toFixed(4);
  };

  // Loading skeleton state
  if (coinLoading) {
    return (
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-textMuted hover:text-text transition-colors"
          >
            ← Back to Markets
          </Link>
        </div>

        {/* Skeleton Header */}
        <div className="space-y-4 mb-8">
          <div className="flex items-center gap-3">
            <Skeleton className="w-8 h-8 rounded-full" />
            <Skeleton className="w-36 h-7 rounded" />
            <Skeleton className="w-12 h-5 rounded" />
            <Skeleton className="w-16 h-5 rounded-full" />
          </div>
          <div className="flex items-baseline gap-3">
            <Skeleton className="w-48 h-10 rounded" />
            <Skeleton className="w-24 h-6 rounded" />
            <Skeleton className="w-20 h-6 rounded" />
          </div>
        </div>

        {/* Skeleton Chart Box */}
        <div className="bg-surface border border-border rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <Skeleton className="w-24 h-5 rounded" />
            <Skeleton className="w-44 h-8 rounded-lg" />
          </div>
          <Skeleton className="w-full h-[340px] rounded" />
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6 pt-6 border-t border-border mt-6">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="w-16 h-3 rounded" />
                <Skeleton className="w-24 h-5 rounded" />
              </div>
            ))}
          </div>
        </div>
      </main>
    );
  }

  // Not found state
  if (coinNotFound || !coin) {
    return (
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-6">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-textMuted hover:text-text transition-colors"
          >
            ← Back to Markets
          </Link>
        </div>

        <div className="bg-surface border border-border rounded-lg p-12 text-center max-w-lg mx-auto">
          <div className="w-12 h-12 rounded-full bg-surface2 border border-border mx-auto flex items-center justify-center text-textMuted text-lg mb-4">
            ✕
          </div>
          <h1 className="text-xl font-bold text-text mb-2">Coin not found</h1>
          <p className="text-sm text-textMuted mb-6">
            No cryptocurrency found matching "{id}". It may not be in the top
            100 markets list.
          </p>
          <Link
            to="/"
            className="inline-flex items-center justify-center px-4 py-2 bg-accent text-bg text-sm font-semibold rounded-lg hover:opacity-90 transition-opacity"
          >
            Back to Markets
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back link */}
      <div className="mb-6">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-textMuted hover:text-text transition-colors"
        >
          ← Back to Markets
        </Link>
      </div>

      {/* Coin Header */}
      <div className="mb-6">
        <div className="flex flex-wrap items-center gap-3 mb-2">
          <CoinIcon
            src={coin.image}
            symbol={coin.symbol}
            name={coin.name}
            size={32}
          />
          <h1 className="text-2xl font-bold tracking-tight text-text">
            {coin.name}
          </h1>
          <span className="text-sm font-semibold uppercase text-textMuted">
            {coin.symbol}
          </span>
          {coin.market_cap_rank && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-surface2 text-textMuted border border-border font-medium">
              Rank #{coin.market_cap_rank}
            </span>
          )}
        </div>

        {/* Hero Price & Selected Timeframe Profit / Loss */}
        <div className="flex flex-wrap items-baseline gap-2.5 sm:gap-3">
          <span className="text-3xl sm:text-4xl font-bold tabular-nums text-text">
            {formatPrice(currentPrice || coin.current_price)}
          </span>

          {tfChangeAmount !== null && (
            <span
              className={`text-sm sm:text-base font-semibold tabular-nums ${
                tfChangeAmount >= 0 ? 'text-bull' : 'text-bear'
              }`}
            >
              {tfChangeAmount >= 0 ? '+' : '-'}
              {formatPrice(Math.abs(tfChangeAmount))}
            </span>
          )}

          <PriceChange
            value={tfChangePercent}
            className="text-sm sm:text-base font-semibold"
          />

          <span className="text-xs font-semibold px-2 py-0.5 rounded bg-surface2 text-textMuted border border-border">
            {activeTfLabel}
          </span>
        </div>
      </div>

      {/* Chart & Stats Card */}
      <div className="bg-surface border border-border rounded-lg p-4 sm:p-6 mb-8">
        {/* Timeframe Switcher & In-Flight Status */}
        <div className="flex items-center justify-between gap-4 mb-6">
          <div className="text-xs font-medium text-textMuted">
            Price Chart ({activeTfLabel})
          </div>

          <div className="flex items-center gap-3">
            {chartLoading && (
              <span className="text-xs text-textMuted flex items-center gap-1.5 animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                Updating...
              </span>
            )}

            {/* Segmented Control Switcher */}
            <div className="inline-flex p-1 bg-bg border border-border rounded-lg gap-1">
              {TIMEFRAMES.map((tf) => {
                const isActive = timeframe === tf.days;
                return (
                  <button
                    key={tf.days}
                    type="button"
                    onClick={() => setTimeframe(tf.days)}
                    className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                      isActive
                        ? 'bg-surface2 text-text shadow-sm'
                        : 'text-textMuted hover:text-text'
                    }`}
                  >
                    {tf.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Chart Viewport */}
        <div className="w-full h-[340px] sm:h-[380px] min-w-0 relative">
          {hasLittleData ||
          (currentChartData && currentChartData.length < 2) ? (
            <div className="w-full h-full flex flex-col items-center justify-center text-textMuted text-sm border border-dashed border-border/60 rounded-lg">
              <span className="text-base font-medium text-text mb-1">
                Not enough chart data yet
              </span>
              <span className="text-xs">
                History is currently unavailable or too short for this
                timeframe.
              </span>
            </div>
          ) : !currentChartData ? (
            <div className="w-full h-full flex items-center justify-center">
              <Skeleton className="w-full h-full rounded" />
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={currentChartData}
                margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
              >
                <defs>
                  <linearGradient
                    id="coinPriceGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="5%"
                      stopColor={strokeColor}
                      stopOpacity={0.25}
                    />
                    <stop
                      offset="95%"
                      stopColor={strokeColor}
                      stopOpacity={0.0}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#242A35"
                  vertical={false}
                  opacity={0.6}
                />
                <XAxis
                  dataKey="timestamp"
                  ticks={chartTicks}
                  tickFormatter={formatXAxis}
                  stroke="#8A94A3"
                  tick={{ fill: '#8A94A3', fontSize: 11 }}
                  tickLine={false}
                  axisLine={{ stroke: '#242A35' }}
                />
                <YAxis
                  domain={['auto', 'auto']}
                  tickFormatter={formatYAxis}
                  stroke="#8A94A3"
                  tick={{ fill: '#8A94A3', fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  orientation="right"
                  width={68}
                />
                <Tooltip
                  content={
                    <CustomChartTooltip
                      timeframe={displayedTf}
                      startPrice={startPrice}
                    />
                  }
                />
                <Area
                  type="monotone"
                  dataKey="price"
                  stroke={strokeColor}
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#coinPriceGradient)"
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6 pt-6 border-t border-border mt-6">
          <div>
            <div className="text-xs font-medium text-textMuted">Market Cap</div>
            <div className="text-base font-semibold text-text tabular-nums mt-1">
              {formatVolumeOrCap(coin.market_cap)}
            </div>
          </div>

          <div>
            <div className="text-xs font-medium text-textMuted">24h Volume</div>
            <div className="text-base font-semibold text-text tabular-nums mt-1">
              {formatVolumeOrCap(coin.total_volume)}
            </div>
          </div>

          <div>
            <div className="text-xs font-medium text-textMuted">
              Circulating Supply
            </div>
            <div className="text-base font-semibold text-text tabular-nums mt-1">
              {formatSupply(coin.circulating_supply, coin.symbol)}
            </div>
          </div>

          <div>
            <div className="text-xs font-medium text-textMuted">
              All-Time High
            </div>
            <div className="text-base font-semibold text-text tabular-nums mt-1">
              {formatPrice(coin.ath)}
            </div>
          </div>

          <div>
            <div className="text-xs font-medium text-textMuted">
              All-Time Low
            </div>
            <div className="text-base font-semibold text-text tabular-nums mt-1">
              {formatPrice(coin.atl)}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
