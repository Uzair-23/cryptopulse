const axios = require('axios');
const NodeCache = require('node-cache');

const cache = new NodeCache();
const lastKnownGood = new Map();

const COINGECKO_BASE_URL = 'https://api.coingecko.com/api/v3';

function getHeaders() {
  const headers = {};
  const apiKey = process.env.COINGECKO_API_KEY;
  if (apiKey && apiKey.trim() !== '') {
    headers['x-cg-demo-api-key'] = apiKey.trim();
  }
  return headers;
}

const ALLOWED_CURRENCIES = ['usd', 'eur', 'inr', 'aed'];

function sanitizeCurrency(currency) {
  const c = String(currency || '').toLowerCase();
  return ALLOWED_CURRENCIES.includes(c) ? c : 'usd';
}

async function getTopCoins(currency = 'usd') {
  const curr = sanitizeCurrency(currency);
  const cacheKey = `top-coins:${curr}`;
  const cached = cache.get(cacheKey);

  if (cached) {
    console.log(`[CoinGecko: cache hit] ${cacheKey}`);
    return cached;
  }

  console.log(`[CoinGecko: fetching] ${cacheKey}`);

  try {
    const response = await axios.get(`${COINGECKO_BASE_URL}/coins/markets`, {
      params: {
        vs_currency: curr,
        order: 'market_cap_desc',
        per_page: 100,
        page: 1,
        sparkline: true,
        price_change_percentage: '1h,24h,7d'
      },
      headers: getHeaders(),
      timeout: 10000
    });

    const data = response.data;
    cache.set(cacheKey, data, 60); // 60 seconds TTL
    lastKnownGood.set(cacheKey, data);

    return data;
  } catch (err) {
    console.error(`[CoinGecko: error fetching ${cacheKey}]`, err.message);

    if (lastKnownGood.has(cacheKey)) {
      console.log(`[CoinGecko: serving stale data] ${cacheKey}`);
      const staleData = lastKnownGood.get(cacheKey);
      if (Array.isArray(staleData)) {
        staleData.stale = true;
        return staleData;
      }
      return { ...staleData, stale: true };
    }

    throw err;
  }
}

async function getCoinChart(id, days, currency = 'usd') {
  const curr = sanitizeCurrency(currency);
  const cacheKey = `chart:${id}:${days}:${curr}`;
  const cached = cache.get(cacheKey);

  if (cached) {
    console.log(`[CoinGecko: cache hit] ${cacheKey}`);
    return cached;
  }

  console.log(`[CoinGecko: fetching] ${cacheKey}`);

  try {
    const response = await axios.get(`${COINGECKO_BASE_URL}/coins/${encodeURIComponent(id)}/market_chart`, {
      params: {
        vs_currency: curr,
        days
      },
      headers: getHeaders(),
      timeout: 10000
    });

    const data = response.data;
    cache.set(cacheKey, data, 300); // 300 seconds (5 mins) TTL
    lastKnownGood.set(cacheKey, data);

    return data;
  } catch (err) {
    console.error(`[CoinGecko: error fetching ${cacheKey}]`, err.message);

    if (lastKnownGood.has(cacheKey)) {
      console.log(`[CoinGecko: serving stale data] ${cacheKey}`);
      const staleData = lastKnownGood.get(cacheKey);
      return { ...staleData, stale: true };
    }

    throw err;
  }
}

module.exports = {
  getTopCoins,
  getCoinChart
};
