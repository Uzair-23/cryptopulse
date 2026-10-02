const express = require('express');
const { getFearGreed } = require('../services/sentiment');

const router = express.Router();

// GET /api/sentiment/fear-greed (public, no auth)
router.get('/fear-greed', async (req, res) => {
  try {
    const data = await getFearGreed();
    return res.json(data);
  } catch (err) {
    return res.status(503).json({ error: 'Sentiment data unavailable right now' });
  }
});

module.exports = router;
