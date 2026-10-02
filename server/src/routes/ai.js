/**
 * routes/ai.js — AI market summary endpoint.
 *
 * GET /api/ai/market-summary (public, no auth)
 *
 * Cache strategy (two slots):
 *   1. "ai-market-summary"  — node-cache, TTL 600s (10 min). Main fast-path.
 *   2. "ai-market-summary-lkg" — no TTL, overwritten on each success.
 *                                Returned as { ...result, stale: true } when
 *                                a fresh Groq call fails and the main cache is
 *                                empty.
 *
 * Logging:
 *   [AI] cache hit       — served from the 10-min cache
 *   [AI] fresh call      — about to call Groq
 *   [AI] success         — Groq returned valid data; cached
 *   [AI] stale fallback  — Groq failed but we have a previous result
 *   [AI] unavailable     — Groq failed and no previous result exists
 */

const express = require('express');
const NodeCache = require('node-cache');
const { getTopCoins } = require('../services/coingecko');
const { buildMarketStats, buildCoinStats } = require('../services/marketStats');
const { getMarketSummary, getCoinInsight } = require('../services/groq');

const router = express.Router();


// Dedicated cache for AI results — keeps TTL-expiry separate from coin data
const aiCache = new NodeCache();

const CACHE_KEY = 'ai-market-summary';
const LKG_KEY = 'ai-market-summary-lkg'; // last-known-good, no TTL
const CACHE_TTL = 600; // 10 minutes

// GET /api/ai/market-summary
router.get('/market-summary', async (req, res) => {
  // 1. Cache hit — return immediately
  const cached = aiCache.get(CACHE_KEY);
  if (cached) {
    console.log('[AI] cache hit — serving stored summary');
    return res.json(cached);
  }

  // 2. Cache miss — call Groq
  console.log('[AI] fresh call — building stats and calling Groq');

  try {
    // getTopCoins() will hit its own cache if warm; no extra CoinGecko request
    const currency = req.query.currency || 'usd';
    const coins = await getTopCoins(currency);
    const stats = buildMarketStats(coins);
    const summary = await getMarketSummary(stats);

    const result = {
      ...summary,
      generatedAt: new Date().toISOString(),
      stale: false
    };

    // Store in both the TTL cache and the last-known-good slot
    aiCache.set(CACHE_KEY, result, CACHE_TTL);
    aiCache.set(LKG_KEY, result); // no TTL — lives until process restart

    console.log('[AI] success — summary cached for 10 minutes');
    return res.json(result);
  } catch (err) {
    console.error('[AI] Groq call failed:', err.message);

    // 3. Stale fallback — return previous successful result
    const lkg = aiCache.get(LKG_KEY);
    if (lkg) {
      console.log('[AI] stale fallback — returning last-known-good result');
      return res.json({ ...lkg, stale: true });
    }

    // 4. No previous result — return 503
    console.log('[AI] unavailable — no previous result exists');
    return res
      .status(503)
      .json({ error: 'AI insights are unavailable right now' });
  }
});

// GET /api/ai/coin/:id (public, no auth)
router.get('/coin/:id', async (req, res) => {
  const { id } = req.params;
  if (!id) {
    return res.status(404).json({ error: 'Coin not found' });
  }

  const cacheKey = `ai-coin:${id}`;
  const lkgKey = `ai-coin:${id}-lkg`;

  // 1. Cache hit — return immediately
  const cached = aiCache.get(cacheKey);
  if (cached) {
    console.log(`[AI] cache hit — serving stored coin insight for ${id}`);
    return res.json(cached);
  }

  // 2. Cache miss — fetch coin and call Groq
  console.log(`[AI] fresh call — looking up coin and calling Groq for ${id}`);

  try {
    const currency = req.query.currency || 'usd';
    const coins = await getTopCoins(currency);
    const coin = coins.find((c) => c.id === id);

    if (!coin) {
      return res.status(404).json({ error: 'Coin not found' });
    }

    const stats = buildCoinStats(coin);
    const insight = await getCoinInsight(stats);

    const result = {
      ...insight,
      generatedAt: new Date().toISOString(),
      stale: false
    };

    // Store in both the TTL cache and the last-known-good slot
    aiCache.set(cacheKey, result, CACHE_TTL);
    aiCache.set(lkgKey, result); // no TTL — lives until process restart

    console.log(`[AI] success — coin insight cached for 10 minutes (${id})`);
    return res.json(result);
  } catch (err) {
    console.error(`[AI] Groq call failed for coin ${id}:`, err.message);

    // 3. Stale fallback — return previous successful result
    const lkg = aiCache.get(lkgKey);
    if (lkg) {
      console.log(`[AI] stale fallback — returning last-known-good result for ${id}`);
      return res.json({ ...lkg, stale: true });
    }

    // 4. No previous result — return 503
    console.log(`[AI] unavailable — no previous result exists for ${id}`);
    return res
      .status(503)
      .json({ error: 'AI insight unavailable right now' });
  }
});

module.exports = router;

