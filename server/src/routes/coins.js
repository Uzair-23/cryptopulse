const express = require('express');
const { getTopCoins, getCoinChart, getCoinOhlc } = require('../services/coingecko');

const router = express.Router();

const ALLOWED_DAYS = ['1', '7', '30', '365'];
const ALLOWED_OHLC_DAYS = ['1', '7', '14', '30', '90', '180', '365'];

// GET /api/coins
router.get('/', async (req, res) => {
  try {
    const currency = req.query.currency || req.query.vs_currency || 'usd';
    const data = await getTopCoins(currency);
    return res.json(data);
  } catch (err) {
    const status = err.response?.status || 502;
    return res.status(status).json({ error: 'Failed to fetch coin markets data' });
  }
});

// GET /api/coins/:id/chart
router.get('/:id/chart', async (req, res) => {
  try {
    const { id } = req.params;
    const days = req.query.days ? String(req.query.days) : '7';
    const currency = req.query.currency || req.query.vs_currency || 'usd';

    if (!ALLOWED_DAYS.includes(days)) {
      return res.status(400).json({ error: 'days must be 1, 7, 30, or 365' });
    }

    const data = await getCoinChart(id, days, currency);
    return res.json(data);
  } catch (err) {
    const status = err.response?.status || 502;
    return res.status(status).json({ error: 'Failed to fetch coin chart data' });
  }
});

// GET /api/coins/:id/ohlc
router.get('/:id/ohlc', async (req, res) => {
  try {
    const { id } = req.params;
    const days = req.query.days ? String(req.query.days) : '7';
    const currency = req.query.currency || req.query.vs_currency || 'usd';

    if (!ALLOWED_OHLC_DAYS.includes(days)) {
      return res.status(400).json({ error: `days must be one of: ${ALLOWED_OHLC_DAYS.join(', ')}` });
    }

    const data = await getCoinOhlc(id, days, currency);
    return res.json(data);
  } catch (err) {
    const status = err.response?.status || 502;
    return res.status(status).json({ error: 'Failed to fetch coin OHLC data' });
  }
});

module.exports = router;
