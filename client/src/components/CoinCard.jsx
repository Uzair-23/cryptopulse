import React from 'react';
import { useNavigate } from 'react-router-dom';
import CoinIcon from './CoinIcon';
import PriceChange from './PriceChange';
import Sparkline from './Sparkline';
import Pill from './Pill';
import { getBasicRecommendation } from '../lib/recommendation';

// Currency & volume formatters
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

export default function CoinCard({ coin }) {
  const navigate = useNavigate();

  if (!coin) return null;

  const change1h = coin.price_change_percentage_1h_in_currency;
  const change24h =
    coin.price_change_percentage_24h_in_currency ??
    coin.price_change_percentage_24h;
  const change7d = coin.price_change_percentage_7d_in_currency;
  const sparklineData = coin.sparkline_in_7d?.price || [];

  const rec = getBasicRecommendation({
    change1h,
    change24h,
    change7d
  });

  return (
    <div
      onClick={() => navigate(`/coin/${coin.id}`)}
      className="bg-surface border border-border rounded-xl p-4 sm:p-5 cursor-pointer flex flex-col justify-between gap-3.5 transition-all duration-150 hover:-translate-y-0.5 hover:border-white/30 hover:shadow-lg hover:shadow-black/40 group select-none"
    >
      {/* 1. Header row: Icon + Name + Symbol on left, Rank on top-right */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <CoinIcon
            src={coin.image}
            symbol={coin.symbol}
            name={coin.name}
            size={26}
          />
          <div className="flex items-baseline gap-1.5 min-w-0 truncate">
            <span className="font-semibold text-text group-hover:text-accent transition-colors truncate text-sm">
              {coin.name}
            </span>
            <span className="text-xs text-textMuted uppercase font-medium shrink-0">
              {coin.symbol}
            </span>
          </div>
        </div>

        <span className="text-xs text-textMuted font-semibold tabular-nums shrink-0">
          #{coin.market_cap_rank ?? '—'}
        </span>
      </div>

      {/* 2. Price row: current price large and bold */}
      <div>
        <div className="text-xl sm:text-2xl font-bold tabular-nums text-text tracking-tight">
          {formatPrice(coin.current_price)}
        </div>
      </div>

      {/* 3. Three small stat blocks: 1H, 24H, 7D */}
      <div className="grid grid-cols-3 gap-2 py-2 border-y border-border/50">
        <div>
          <div className="text-[10px] uppercase font-semibold text-textMuted tracking-wider mb-0.5">
            1h
          </div>
          <PriceChange value={change1h} className="text-xs" />
        </div>
        <div>
          <div className="text-[10px] uppercase font-semibold text-textMuted tracking-wider mb-0.5">
            24h
          </div>
          <PriceChange value={change24h} className="text-xs" />
        </div>
        <div>
          <div className="text-[10px] uppercase font-semibold text-textMuted tracking-wider mb-0.5">
            7d
          </div>
          <PriceChange value={change7d} className="text-xs" />
        </div>
      </div>

      {/* 4. Signal Pill (left-aligned) */}
      <div className="flex items-center">
        <Pill variant={rec.label}>{rec.label}</Pill>
      </div>

      {/* 5. Footer row: Volume & Market Cap on left, Sparkline on right */}
      <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/40 mt-auto">
        <div className="flex items-center gap-3 text-xs min-w-0">
          <div>
            <span className="block text-[10px] text-textMuted font-medium uppercase tracking-wider">
              24h Vol
            </span>
            <span className="tabular-nums font-semibold text-text text-xs">
              {formatVolumeOrCap(coin.total_volume)}
            </span>
          </div>
          <div>
            <span className="block text-[10px] text-textMuted font-medium uppercase tracking-wider">
              MCap
            </span>
            <span className="tabular-nums font-semibold text-text text-xs">
              {formatVolumeOrCap(coin.market_cap)}
            </span>
          </div>
        </div>

        <div className="shrink-0 flex items-center justify-end">
          <Sparkline data={sparklineData} width={64} height={26} />
        </div>
      </div>
    </div>
  );
}

// Reusable Skeleton Card matching exact layout & dimensions
export function CoinCardSkeleton() {
  return (
    <div className="bg-surface border border-border rounded-xl p-4 sm:p-5 flex flex-col justify-between gap-3.5 animate-pulse select-none">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-full bg-surface2" />
          <div className="h-4 w-20 bg-surface2 rounded" />
          <div className="h-3 w-8 bg-surface2 rounded" />
        </div>
        <div className="h-3 w-6 bg-surface2 rounded" />
      </div>

      {/* Price skeleton */}
      <div>
        <div className="h-7 w-28 bg-surface2 rounded" />
      </div>

      {/* 3 stats skeleton */}
      <div className="grid grid-cols-3 gap-2 py-2 border-y border-border/50">
        <div>
          <div className="h-2 w-6 bg-surface2 rounded mb-1.5" />
          <div className="h-3 w-12 bg-surface2 rounded" />
        </div>
        <div>
          <div className="h-2 w-6 bg-surface2 rounded mb-1.5" />
          <div className="h-3 w-12 bg-surface2 rounded" />
        </div>
        <div>
          <div className="h-2 w-6 bg-surface2 rounded mb-1.5" />
          <div className="h-3 w-12 bg-surface2 rounded" />
        </div>
      </div>

      {/* Signal pill skeleton */}
      <div>
        <div className="h-5 w-16 bg-surface2 rounded-full" />
      </div>

      {/* Footer skeleton */}
      <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/40 mt-auto">
        <div className="flex items-center gap-3">
          <div>
            <div className="h-2 w-10 bg-surface2 rounded mb-1.5" />
            <div className="h-3 w-14 bg-surface2 rounded" />
          </div>
          <div>
            <div className="h-2 w-8 bg-surface2 rounded mb-1.5" />
            <div className="h-3 w-14 bg-surface2 rounded" />
          </div>
        </div>
        <div className="w-16 h-6 bg-surface2 rounded" />
      </div>
    </div>
  );
}
