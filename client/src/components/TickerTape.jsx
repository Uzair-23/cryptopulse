import React, { useMemo, useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import CoinIcon from './CoinIcon';
import PriceChange from './PriceChange';

// Currency formatters
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

export default function TickerTape({ coins = [] }) {
  const navigate = useNavigate();

  // Slice top 15 coins by market cap
  const topCoins = useMemo(() => {
    if (!Array.isArray(coins) || coins.length === 0) return [];
    return coins.slice(0, 15);
  }, [coins]);

  // Track price changes across renders/polls for flash animation
  const prevPricesRef = useRef({});
  const [flashMap, setFlashMap] = useState({});

  useEffect(() => {
    if (!topCoins.length) return;

    const newFlashes = {};
    let hasChanges = false;

    topCoins.forEach((c) => {
      const prevPrice = prevPricesRef.current[c.id];
      if (
        prevPrice !== undefined &&
        prevPrice !== null &&
        c.current_price !== undefined
      ) {
        if (c.current_price > prevPrice) {
          newFlashes[c.id] = 'up';
          hasChanges = true;
        } else if (c.current_price < prevPrice) {
          newFlashes[c.id] = 'down';
          hasChanges = true;
        }
      }
      prevPricesRef.current[c.id] = c.current_price;
    });

    if (hasChanges) {
      setFlashMap(newFlashes);
      const timer = setTimeout(() => {
        setFlashMap({});
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [topCoins]);

  if (!topCoins.length) {
    return (
      <div className="w-full h-11 bg-surface border-b border-border animate-pulse" />
    );
  }

  const renderCoinItem = (coin, keySuffix = '') => {
    const flash = flashMap[coin.id];
    let flashBg = 'bg-transparent';
    if (flash === 'up') flashBg = 'bg-bull/20';
    if (flash === 'down') flashBg = 'bg-bear/20';

    const change24h =
      coin.price_change_percentage_24h_in_currency ??
      coin.price_change_percentage_24h;

    return (
      <button
        key={`${coin.id}${keySuffix}`}
        type="button"
        onClick={() => navigate(`/coin/${coin.id}`)}
        className={`inline-flex items-center gap-2.5 px-4 h-full border-r border-border hover:bg-surface2 transition-colors duration-600 ease-out cursor-pointer shrink-0 select-none text-left ${flashBg}`}
      >
        <CoinIcon
          src={coin.image}
          symbol={coin.symbol}
          name={coin.name}
          size={18}
        />
        <span className="font-bold text-xs uppercase text-text tracking-wide">
          {coin.symbol}
        </span>
        <span className="font-semibold text-xs tabular-nums text-text">
          {formatPrice(coin.current_price)}
        </span>
        <PriceChange value={change24h} className="text-xs" />
      </button>
    );
  };

  return (
    <div className="w-full bg-surface border-b border-border h-11 overflow-hidden flex items-center relative ticker-container">
      <div className="ticker-track h-full flex items-center">
        {/* First copy of 15 items */}
        <div className="flex items-center h-full shrink-0">
          {topCoins.map((coin) => renderCoinItem(coin, '-1'))}
        </div>

        {/* Second copy for seamless linear infinite loop */}
        <div className="flex items-center h-full shrink-0 ticker-duplicate">
          {topCoins.map((coin) => renderCoinItem(coin, '-2'))}
        </div>
      </div>
    </div>
  );
}
