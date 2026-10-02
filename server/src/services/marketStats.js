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

module.exports = { buildMarketStats };
