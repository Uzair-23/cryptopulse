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
import Pill from '../components/Pill';
import { getBasicRecommendation } from '../lib/recommendation';
import TickerTape from '../components/TickerTape';
import { useCurrency } from '../context/CurrencyContext';

const numberCompactFormatter = new Intl.NumberFormat('en-US', {
  notation: 'compact',
  maximumFractionDigits: 2
});

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

function CustomChartTooltip({
  active,
  payload,
  timeframe,
  startPrice,
  formatPrice: propFormatPrice
}) {
  const { formatPrice: contextFormatPrice } = useCurrency();
  const formatPrice = propFormatPrice || contextFormatPrice;
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
  const { currency, formatPrice, formatVolumeOrCap } = useCurrency();

  const [coin, setCoin] = useState(null);
  const [coins, setCoins] = useState([]);
  const [coinLoading, setCoinLoading] = useState(true);
  const [coinNotFound, setCoinNotFound] = useState(false);

  const [timeframe, setTimeframe] = useState('7');
  const [chartState, setChartState] = useState({
    data: null,
    timeframe: '7'
  });
  const [chartLoading, setChartLoading] = useState(false);
  const [hasLittleData, setHasLittleData] = useState(false);
  const [chartError, setChartError] = useState(false);

  // 1. Fetch coin market data
  useEffect(() => {
    let isMounted = true;
    setCoinLoading(true);
    setCoinNotFound(false);

    async function fetchCoinData() {
      try {
        const res = await api.get('/coins', {
          params: { currency: currency.toLowerCase() }
        });
        if (!isMounted) return;

        const data = res.data || [];
        setCoins(data);

        const match = data.find((c) => c.id === id);
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
      const interval = setInterval(fetchCoinData, 45000);
      return () => {
        isMounted = false;
        clearInterval(interval);
      };
    }

    return () => {
      isMounted = false;
    };
  }, [id, currency]);

  // 2. Fetch chart data for selected timeframe
  useEffect(() => {
    let isMounted = true;
    setChartLoading(true);

    async function fetchChart() {
      try {
        setChartError(false);
        const res = await api.get(
          `/coins/${encodeURIComponent(id)}/chart`,
          {
            params: {
              days: timeframe,
              currency: currency.toLowerCase()
            }
          }
        );
        if (!isMounted) return;

        const prices = res.data?.prices;
        if (!prices || !Array.isArray(prices) || prices.length < 2) {
          setHasLittleData(true);
          setChartState({ data: [], timeframe });
        } else {
          setHasLittleData(false);
          setChartError(false);
          const formatted = prices.map(([ts, price]) => ({
            timestamp: ts,
            price
          }));
          setChartState({ data: formatted, timeframe });
        }
      } catch (err) {
        if (!isMounted) return;
        setChartError(true);
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
  }, [id, timeframe, currency]);

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

  const recommendation = useMemo(() => {
    if (!coin) return null;
    return getBasicRecommendation({
      change1h: coin.price_change_percentage_1h_in_currency,
      change24h:
        coin.price_change_percentage_24h_in_currency ??
        coin.price_change_percentage_24h,
      change7d: coin.price_change_percentage_7d_in_currency
    });
  }, [coin]);

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
    if (Math.abs(val) >= 1000) {
      return formatVolumeOrCap(val);
    }
    return formatPrice(val);
  };

  // Loading skeleton state
  if (coinLoading) {
    return (
      <div className="w-full">
        <TickerTape coins={coins} />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="mb-4">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-textMuted hover:text-text transition-colors"
            >
              ← Back to Markets
            </Link>
          </div>

          {/* Skeleton Horizontal Info Bar */}
          <div className="bg-surface border border-border rounded-xl p-4 sm:p-5 mb-6 flex flex-wrap items-center justify-between gap-y-4 gap-x-6 animate-pulse">
            <div className="flex items-center gap-3">
              <Skeleton className="w-9 h-9 rounded-full" />
              <div className="space-y-1.5">
                <Skeleton className="w-28 h-5 rounded" />
                <Skeleton className="w-12 h-3 rounded" />
              </div>
              <Skeleton className="w-16 h-5 rounded-full" />
            </div>

            <div className="flex flex-wrap items-center gap-6 sm:gap-8">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="space-y-1.5">
                  <Skeleton className="w-14 h-2.5 rounded" />
                  <Skeleton className="w-20 h-4 rounded" />
                </div>
              ))}
            </div>
          </div>

          {/* Skeleton Two-Column Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: Chart Skeleton */}
            <div className="lg:col-span-8 bg-surface border border-border rounded-xl p-4 sm:p-6 animate-pulse">
              <div className="flex items-center justify-between mb-6">
                <Skeleton className="w-28 h-4 rounded" />
                <Skeleton className="w-44 h-8 rounded-lg" />
              </div>
              <Skeleton className="w-full h-[440px] sm:h-[480px] rounded-lg" />
            </div>

            {/* Right Rail Skeleton */}
            <div className="lg:col-span-4 space-y-5 animate-pulse">
              <div className="bg-surface border border-border rounded-xl p-5 space-y-3">
                <Skeleton className="w-24 h-3.5 rounded" />
                <Skeleton className="w-16 h-6 rounded-full" />
                <Skeleton className="w-full h-8 rounded" />
                <Skeleton className="w-48 h-3 rounded pt-2" />
              </div>

              <div className="bg-surface border border-border rounded-xl p-5 space-y-4">
                <Skeleton className="w-24 h-3.5 rounded mb-2" />
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex justify-between items-center">
                    <Skeleton className="w-20 h-3 rounded" />
                    <Skeleton className="w-24 h-4 rounded" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Not found state
  if (coinNotFound || !coin) {
    return (
      <div className="w-full">
        <TickerTape coins={coins} />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="mb-6">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-textMuted hover:text-text transition-colors"
            >
              ← Back to Markets
            </Link>
          </div>

          <div className="bg-surface border border-border rounded-xl p-12 text-center max-w-lg mx-auto">
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
      </div>
    );
  }

  // Calculations for 24h change values in horizontal info bar
  const change24hPct =
    coin.price_change_percentage_24h_in_currency ??
    coin.price_change_percentage_24h;
  const change24hAmt =
    coin.price_change_24h ??
    (change24hPct !== null && change24hPct !== undefined
      ? (coin.current_price * change24hPct) / 100
      : null);

  return (
    <div className="w-full">
      <TickerTape coins={coins} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Back link */}
      <div className="mb-4">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-textMuted hover:text-text transition-colors"
        >
          ← Back to Markets
        </Link>
      </div>

      {/* 1. Full-width Horizontal Info Bar */}
      <div className="bg-surface border border-border rounded-xl p-4 sm:p-5 mb-6 flex flex-wrap items-center justify-between gap-y-4 gap-x-6">
        {/* Left: Coin Icon + Name + Symbol + Rank badge */}
        <div className="flex items-center gap-3 shrink-0">
          <CoinIcon
            src={coin.image}
            symbol={coin.symbol}
            name={coin.name}
            size={36}
          />
          <div className="flex items-baseline gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-text">
              {coin.name}
            </h1>
            <span className="text-xs sm:text-sm font-semibold uppercase text-textMuted">
              {coin.symbol}
            </span>
          </div>
          {coin.market_cap_rank && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-surface2 text-textMuted border border-border font-medium">
              Rank #{coin.market_cap_rank}
            </span>
          )}
        </div>

        {/* Horizontal row of label-over-value stat blocks */}
        <div className="flex flex-wrap items-center gap-y-3 gap-x-6 sm:gap-x-8 text-left">
          {/* Price */}
          <div>
            <div className="text-[11px] uppercase tracking-wider font-semibold text-textMuted mb-0.5">
              Price
            </div>
            <div className="text-base sm:text-lg font-bold tabular-nums text-text">
              {formatPrice(currentPrice || coin.current_price)}
            </div>
          </div>

          {/* 24h Change (both $ and %) */}
          <div>
            <div className="text-[11px] uppercase tracking-wider font-semibold text-textMuted mb-0.5">
              24h Change
            </div>
            <div className="flex items-center gap-1.5 font-semibold text-xs sm:text-sm tabular-nums">
              {change24hAmt !== null && (
                <span
                  className={change24hAmt >= 0 ? 'text-bull' : 'text-bear'}
                >
                  {change24hAmt >= 0 ? '+' : '-'}
                  {formatPrice(Math.abs(change24hAmt))}
                </span>
              )}
              <PriceChange value={change24hPct} />
            </div>
          </div>

          {/* 24h High (if available) */}
          {coin.high_24h != null && (
            <div>
              <div className="text-[11px] uppercase tracking-wider font-semibold text-textMuted mb-0.5">
                24h High
              </div>
              <div className="text-xs sm:text-sm font-semibold tabular-nums text-text">
                {formatPrice(coin.high_24h)}
              </div>
            </div>
          )}

          {/* 24h Low (if available) */}
          {coin.low_24h != null && (
            <div>
              <div className="text-[11px] uppercase tracking-wider font-semibold text-textMuted mb-0.5">
                24h Low
              </div>
              <div className="text-xs sm:text-sm font-semibold tabular-nums text-text">
                {formatPrice(coin.low_24h)}
              </div>
            </div>
          )}

          {/* 24h Volume */}
          <div>
            <div className="text-[11px] uppercase tracking-wider font-semibold text-textMuted mb-0.5">
              24h Volume
            </div>
            <div className="text-xs sm:text-sm font-semibold tabular-nums text-text">
              {formatVolumeOrCap(coin.total_volume)}
            </div>
          </div>

          {/* Market Cap */}
          <div>
            <div className="text-[11px] uppercase tracking-wider font-semibold text-textMuted mb-0.5">
              Market Cap
            </div>
            <div className="text-xs sm:text-sm font-semibold tabular-nums text-text">
              {formatVolumeOrCap(coin.market_cap)}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Two-Column Terminal-Style Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT Column (~70% = 8 cols): Interactive Price Chart */}
        <div className="lg:col-span-8 bg-surface border border-border rounded-xl p-4 sm:p-6">
          {/* Timeframe Switcher & In-Flight Status */}
          <div className="flex items-center justify-between gap-4 mb-4">
            <div className="flex items-baseline gap-2">
              <span className="text-xs font-semibold text-textMuted uppercase tracking-wider">
                Price Chart ({activeTfLabel})
              </span>
              {tfChangeAmount !== null && (
                <span
                  className={`text-xs font-semibold tabular-nums ${
                    tfChangeAmount >= 0 ? 'text-bull' : 'text-bear'
                  }`}
                >
                  {tfChangeAmount >= 0 ? '+' : '-'}
                  {formatPrice(Math.abs(tfChangeAmount))} (
                  {tfChangePercent >= 0 ? '+' : ''}
                  {tfChangePercent.toFixed(2)}%)
                </span>
              )}
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
                      className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
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

          {/* Chart Viewport (Expanded vertical height) */}
          <div className="w-full h-[440px] sm:h-[480px] min-w-0 relative">
            {chartError ? (
              <div className="w-full h-full flex flex-col items-center justify-center text-textMuted text-sm border border-dashed border-border/60 rounded-lg p-6">
                <span className="text-base font-medium text-text mb-1">
                  Couldn't load chart data
                </span>
                <span className="text-xs text-textMuted text-center max-w-sm">
                  There was a problem communicating with the server. Please try
                  another timeframe or refresh.
                </span>
              </div>
            ) : hasLittleData ||
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
                    width={76}
                  />
                  <Tooltip
                    content={
                      <CustomChartTooltip
                        timeframe={displayedTf}
                        startPrice={startPrice}
                        formatPrice={formatPrice}
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
        </div>

        {/* RIGHT Rail (~30% = 4 cols): Recommendation + Compact Stats */}
        <div className="lg:col-span-4 space-y-5">
          {/* a) Recommendation Panel */}
          {recommendation && (
            <div className="bg-surface border border-border rounded-xl p-4 sm:p-5">
              <div className="text-[11px] uppercase tracking-wider font-semibold text-textMuted mb-3">
                Market Signal
              </div>
              <div className="mb-2.5">
                <Pill variant={recommendation.label}>
                  {recommendation.label}
                </Pill>
              </div>
              <p className="text-sm font-medium text-text leading-relaxed mb-3">
                {recommendation.reason}
              </p>
              <div className="pt-2.5 border-t border-border/60 text-[11px] text-textMuted">
                Educational only — not financial advice.
              </div>
            </div>
          )}

          {/* b) Compact Stats Panel */}
          <div className="bg-surface border border-border rounded-xl p-4 sm:p-5">
            <div className="text-[11px] uppercase tracking-wider font-semibold text-textMuted mb-3.5">
              Key Statistics
            </div>
            <div className="divide-y divide-border/50 text-sm">
              <div className="flex items-center justify-between py-2.5 first:pt-0">
                <span className="text-xs text-textMuted">Market Cap</span>
                <span className="font-semibold text-text tabular-nums">
                  {formatVolumeOrCap(coin.market_cap)}
                </span>
              </div>

              <div className="flex items-center justify-between py-2.5">
                <span className="text-xs text-textMuted">24h Volume</span>
                <span className="font-semibold text-text tabular-nums">
                  {formatVolumeOrCap(coin.total_volume)}
                </span>
              </div>

              <div className="flex items-center justify-between py-2.5">
                <span className="text-xs text-textMuted">
                  Circulating Supply
                </span>
                <span className="font-semibold text-text tabular-nums">
                  {formatSupply(coin.circulating_supply, coin.symbol)}
                </span>
              </div>

              <div className="flex items-center justify-between py-2.5">
                <span className="text-xs text-textMuted">All-Time High</span>
                <span className="font-semibold text-text tabular-nums">
                  {formatPrice(coin.ath)}
                </span>
              </div>

              <div className="flex items-center justify-between py-2.5 last:pb-0">
                <span className="text-xs text-textMuted">All-Time Low</span>
                <span className="font-semibold text-text tabular-nums">
                  {formatPrice(coin.atl)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
);
}
