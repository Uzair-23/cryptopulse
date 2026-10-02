const axios = require('axios');
const NodeCache = require('node-cache');

const cache = new NodeCache();
const lastKnownGood = new Map();

const CACHE_KEY = 'fear-greed';
const CACHE_TTL_SECONDS = 1800; // 30 minutes

async function getFearGreed() {
  const cached = cache.get(CACHE_KEY);

  if (cached) {
    console.log(`[Sentiment: cache hit] ${CACHE_KEY}`);
    return cached;
  }

  console.log(`[Sentiment: fetching] ${CACHE_KEY}`);

  try {
    const response = await axios.get('https://api.alternative.me/fng/?limit=7&format=json', {
      timeout: 10000
    });

    const rawData = response.data?.data;
    if (!Array.isArray(rawData) || rawData.length === 0) {
      throw new Error('Empty or invalid response from Fear & Greed API');
    }

    const currentItem = rawData[0] || {};
    const result = {
      current: {
        value: Number(currentItem.value) || 0,
        label: String(currentItem.value_classification || 'Neutral')
      },
      history: rawData
        .map((item) => ({
          value: Number(item.value) || 0,
          timestamp: Number(item.timestamp) || 0
        }))
        .sort((a, b) => a.timestamp - b.timestamp) // oldest-to-newest
    };

    cache.set(CACHE_KEY, result, CACHE_TTL_SECONDS);
    lastKnownGood.set(CACHE_KEY, result);

    return result;
  } catch (err) {
    console.error(`[Sentiment: error fetching ${CACHE_KEY}]`, err.message);

    if (lastKnownGood.has(CACHE_KEY)) {
      console.log(`[Sentiment: serving stale data] ${CACHE_KEY}`);
      const staleData = lastKnownGood.get(CACHE_KEY);
      return { ...staleData, stale: true };
    }

    throw err;
  }
}

module.exports = {
  getFearGreed
};
