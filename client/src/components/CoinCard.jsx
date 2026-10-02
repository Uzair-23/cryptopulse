import React from 'react';
import { useNavigate } from 'react-router-dom';
import CoinIcon from './CoinIcon';
import PriceChange from './PriceChange';
import Sparkline from './Sparkline';
import Pill from './Pill';
import { getBasicRecommendation } from '../lib/recommendation';
import { useCurrency } from '../context/CurrencyContext';
import { useWatchlist } from '../context/WatchlistContext';

export default function CoinCard({ coin }) {
  const navigate = useNavigate();
  const { formatPrice, formatVolumeOrCap } = useCurrency();
  const { isStarred, toggleWatchlist } = useWatchlist();

  if (!coin) return null;

  const starred = isStarred(coin.id);

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
      {/* 1. Header row: Icon + Name + Symbol on left, Rank & Watchlist Star on top-right */}
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

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-textMuted font-semibold tabular-nums">
            #{coin.market_cap_rank ?? '—'}
          </span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              toggleWatchlist(coin.id);
            }}
            title={starred ? 'Remove from watchlist' : 'Add to watchlist'}
            aria-label={starred ? `Remove ${coin.name} from watchlist` : `Add ${coin.name} to watchlist`}
            className="p-1 -mr-1 rounded hover:bg-surface2 transition-colors cursor-pointer group/star focus:outline-none"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill={starred ? 'currentColor' : 'none'}
              stroke="currentColor"
              strokeWidth={starred ? '0' : '2'}
              strokeLinecap="round"
              strokeLinejoin="round"
              className={`w-4 h-4 transition-colors ${
                starred
                  ? 'text-star'
                  : 'text-textFaint group-hover/star:text-star/80'
              }`}
            >
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          </button>
        </div>
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

      {/* 5. Metrics row: Volume & Market Cap */}
      <div className="flex items-center justify-between gap-2 pt-2.5 border-t border-border mt-auto">
        <div>
          <span className="block text-[10px] text-textMuted font-medium uppercase tracking-wider mb-0.5">
            24h Vol
          </span>
          <span className="tabular-nums font-semibold text-text text-xs">
            {formatVolumeOrCap(coin.total_volume)}
          </span>
        </div>
        <div className="text-right">
          <span className="block text-[10px] text-textMuted font-medium uppercase tracking-wider mb-0.5">
            MCap
          </span>
          <span className="tabular-nums font-semibold text-text text-xs">
            {formatVolumeOrCap(coin.market_cap)}
          </span>
        </div>
      </div>

      {/* 6. Dedicated full-width Sparkline strip */}
      <div className="w-full pt-1.5 overflow-hidden">
        <Sparkline data={sparklineData} width="100%" height={30} />
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

      {/* Metrics row skeleton */}
      <div className="flex items-center justify-between gap-2 pt-2.5 border-t border-border mt-auto">
        <div>
          <div className="h-2 w-10 bg-surface2 rounded mb-1.5" />
          <div className="h-3 w-14 bg-surface2 rounded" />
        </div>
        <div className="flex flex-col items-end">
          <div className="h-2 w-8 bg-surface2 rounded mb-1.5" />
          <div className="h-3 w-14 bg-surface2 rounded" />
        </div>
      </div>

      {/* Sparkline skeleton */}
      <div className="w-full pt-1.5">
        <div className="w-full h-[30px] bg-surface2 rounded" />
      </div>
    </div>
  );
}

