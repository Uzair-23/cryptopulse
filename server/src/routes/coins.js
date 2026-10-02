const express = require('express');
const { getTopCoins, getCoinChart } = require('../services/coingecko');

const router = express.Router();

const ALLOWED_DAYS = ['1', '7', '30', '365'];

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

module.exports = router;
