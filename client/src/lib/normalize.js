/**
 * normalize.js — Utilities for normalizing and merging price series for comparison charts.
 */

/**
 * Converts a price series to percent-change-from-first-value:
 * ((price - firstPrice) / firstPrice) * 100
 * Pure function: does NOT mutate the input array.
 *
 * @param {Array<{ timestamp: number, price: number }>} series
 * @returns {Array<{ timestamp: number, price: number, pct: number }>}
 */
export function normalizeSeries(series) {
  if (!Array.isArray(series) || series.length === 0) return [];

  const firstPrice = series[0]?.price;
  if (!firstPrice || firstPrice === 0) return [];

  return series.map((item) => ({
    timestamp: item.timestamp,
    price: item.price,
    pct: ((item.price - firstPrice) / firstPrice) * 100
  }));
}

export function normalize(series) {
  return normalizeSeries(series);
}

/**
 * Combines a primary series and a comparison series into a single dataset
 * suitable for Recharts, aligning by timestamp index.
 *
 * @param {Array<{ timestamp: number, price: number }>} primarySeries
 * @param {Array<{ timestamp: number, price: number }>} compareSeries
 * @returns {Array<{ timestamp: number, primaryPrice: number, primaryPct: number, comparePrice?: number, comparePct?: number }>}
 */
export function mergeNormalizedSeries(primarySeries, compareSeries) {
  const normPrimary = normalizeSeries(primarySeries);
  const normCompare = normalizeSeries(compareSeries);

  if (!normPrimary.length) return [];
  if (!normCompare.length) {
    return normPrimary.map((p) => ({
      timestamp: p.timestamp,
      primaryPrice: p.price,
      primaryPct: p.pct
    }));
  }

  const pLen = normPrimary.length;
  const cLen = normCompare.length;

  return normPrimary.map((p, idx) => {
    // When both coins are fetched for the same timeframe, CoinGecko returns identical or near-identical sampling.
    // Use scaled index match for clean alignment without undefined/null gaps:
    const cIdx = Math.min(Math.round((idx / (pLen - 1 || 1)) * (cLen - 1)), cLen - 1);
    const c = normCompare[cIdx];

    return {
      timestamp: p.timestamp,
      primaryPrice: p.price,
      primaryPct: p.pct,
      comparePrice: c?.price,
      comparePct: c?.pct
    };
  });
}

