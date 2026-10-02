/**
 * marketStats.js — Pure computation, no network calls.
 * Takes the array returned by getTopCoins() and returns a stats snapshot.
 */

/**
 * @param {Array} coins - array from getTopCoins()
 * @returns {{
 *   topGainers: {name: string, symbol: string, change24h: number}[],
 *   topLosers:  {name: string, symbol: string, change24h: number}[],
 *   breadth:    {up: number, down: number, flat: number},
 *   btcChange24h: number|null,
 *   avgChange24h: number
 * }}
 */
function buildMarketStats(coins) {
  if (!Array.isArray(coins) || coins.length === 0) {
    return {
      topGainers: [],
      topLosers: [],
      breadth: { up: 0, down: 0, flat: 0 },
      btcChange24h: null,
      avgChange24h: 0
    };
  }

  // Normalise the change field — CoinGecko returns it under one of two keys
  // depending on whether sparkline / price_change_percentage was requested
  const getChange = (coin) => {
    const v =
      coin.price_change_percentage_24h_in_currency ??
      coin.price_change_percentage_24h ??
      null;
    return v !== null && !isNaN(v) ? Number(v) : null;
  };

  // Sort by change24h descending — put coins without data at the tail
  const sorted = [...coins].sort((a, b) => {
    const ca = getChange(a);
    const cb = getChange(b);
    if (ca === null && cb === null) return 0;
    if (ca === null) return 1;
    if (cb === null) return -1;
    return cb - ca;
  });

  const toEntry = (coin) => ({
    name: coin.name,
    symbol: coin.symbol,
    change24h: getChange(coin)
  });

  const topGainers = sorted.slice(0, 3).map(toEntry);
  const topLosers = sorted.slice(-3).reverse().map(toEntry);

  // Market breadth
  let up = 0, down = 0, flat = 0;
  for (const coin of coins) {
    const ch = getChange(coin);
    if (ch === null || ch === 0) flat++;
    else if (ch > 0) up++;
    else down++;
  }

  // Bitcoin's 24h change
  const btcCoin = coins.find((c) => c.id === 'bitcoin');
  const btcChange24h = btcCoin ? getChange(btcCoin) : null;

  // Average 24h change across coins with a real value
  const withData = coins.map(getChange).filter((v) => v !== null);
  const avgChange24h =
    withData.length > 0
      ? Math.round((withData.reduce((sum, v) => sum + v, 0) / withData.length) * 100) / 100
      : 0;

  return { topGainers, topLosers, breadth: { up, down, flat }, btcChange24h, avgChange24h };
}

/**
 * Pure function taking one coin from the existing top-100 array and returning
 * a normalized stats object for AI commentary. Handles any missing field as null; never throws.
 *
 * @param {object} coin - raw coin object from getTopCoins()
 * @returns {{
 *   name: string|null,
 *   symbol: string|null,
 *   rank: number|null,
 *   price: number|null,
 *   change1h: number|null,
 *   change24h: number|null,
 *   change7d: number|null,
 *   high24h: number|null,
 *   low24h: number|null,
 *   marketCap: number|null,
 *   volume24h: number|null,
 *   athDistancePct: number|null,
 *   atlDistancePct: number|null
 * }}
 */
function buildCoinStats(coin) {
  if (!coin || typeof coin !== 'object') {
    return {
      name: null,
      symbol: null,
      rank: null,
      price: null,
      change1h: null,
      change24h: null,
      change7d: null,
      high24h: null,
      low24h: null,
      marketCap: null,
      volume24h: null,
      athDistancePct: null,
      atlDistancePct: null
    };
  }

  const parseNum = (v) => {
    if (v === null || v === undefined || v === '' || isNaN(v)) return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  };

  const name = coin.name ? String(coin.name) : null;
  const symbol = coin.symbol ? String(coin.symbol).toUpperCase() : null;
  const rank = parseNum(coin.market_cap_rank ?? coin.rank);
  const price = parseNum(coin.current_price ?? coin.price);

  const change1h = parseNum(
    coin.price_change_percentage_1h_in_currency ??
    coin.price_change_percentage_1h
  );
  const change24h = parseNum(
    coin.price_change_percentage_24h_in_currency ??
    coin.price_change_percentage_24h
  );
  const change7d = parseNum(
    coin.price_change_percentage_7d_in_currency ??
    coin.price_change_percentage_7d
  );

  const high24h = parseNum(coin.high_24h);
  const low24h = parseNum(coin.low_24h);
  const marketCap = parseNum(coin.market_cap);
  const volume24h = parseNum(coin.total_volume ?? coin.volume_24h);

  // athDistancePct: how far below ATH, as %, 1 decimal
  let athDistancePct = null;
  if (coin.ath_change_percentage !== undefined && coin.ath_change_percentage !== null && !isNaN(coin.ath_change_percentage)) {
    athDistancePct = Math.round(Math.abs(Number(coin.ath_change_percentage)) * 10) / 10;
  } else if (coin.ath && coin.current_price && Number(coin.ath) > 0) {
    const rawAth = Number(coin.ath);
    const rawPrice = Number(coin.current_price);
    const diff = Math.max(0, rawAth - rawPrice);
    athDistancePct = Math.round((diff / rawAth) * 1000) / 10;
  }

  // atlDistancePct: how far above ATL, as %
  let atlDistancePct = null;
  if (coin.atl_change_percentage !== undefined && coin.atl_change_percentage !== null && !isNaN(coin.atl_change_percentage)) {
    atlDistancePct = Math.round(Number(coin.atl_change_percentage) * 10) / 10;
  } else if (coin.atl && coin.current_price && Number(coin.atl) > 0) {
    const rawAtl = Number(coin.atl);
    const rawPrice = Number(coin.current_price);
    const diff = rawPrice - rawAtl;
    atlDistancePct = Math.round((diff / rawAtl) * 1000) / 10;
  }

  return {
    name,
    symbol,
    rank,
    price,
    change1h,
    change24h,
    change7d,
    high24h,
    low24h,
    marketCap,
    volume24h,
    athDistancePct,
    atlDistancePct
  };
}

module.exports = { buildMarketStats, buildCoinStats };

