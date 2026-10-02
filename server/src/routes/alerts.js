const express = require('express');
const mongoose = require('mongoose');
const Alert = require('../models/Alert');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// ALL routes behind the existing auth middleware
router.use(authMiddleware);

// Helper to get authenticated user's ID
function getUserId(req) {
  return req.user?.sub || req.user?.id;
}

// GET /api/alerts — the logged-in user's alerts, newest first
router.get('/', async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const alerts = await Alert.find({ user: userId }).sort({ createdAt: -1 });
    return res.json(alerts);
  } catch (err) {
    console.error('Get alerts error:', err.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/alerts — create a new one-shot price alert
router.post('/', async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { coinId, coinName, coinSymbol, direction, targetPrice } = req.body || {};

    // Validate coinId
    if (!coinId || typeof coinId !== 'string' || !coinId.trim()) {
      return res.status(400).json({ error: 'coinId is required' });
    }

    // Validate direction
    if (!direction || (direction !== 'above' && direction !== 'below')) {
      return res.status(400).json({ error: 'Direction must be "above" or "below"' });
    }

    // Validate targetPrice is a positive number
    const price = Number(targetPrice);
    if (
      targetPrice === null ||
      targetPrice === undefined ||
      targetPrice === '' ||
      isNaN(price) ||
      price <= 0 ||
      !Number.isFinite(price)
    ) {
      return res.status(400).json({ error: 'targetPrice must be a positive number' });
    }

    // Cap 20 active alerts per user
    const currentAlertCount = await Alert.countDocuments({ user: userId });
    if (currentAlertCount >= 20) {
      return res.status(409).json({ error: 'Alert limit reached (20)' });
    }

    const alert = await Alert.create({
      user: userId,
      coinId: coinId.trim().toLowerCase(),
      coinName: coinName ? String(coinName).trim() : coinId.trim(),
      coinSymbol: coinSymbol ? String(coinSymbol).trim().toUpperCase() : '',
      direction,
      targetPrice: price
    });

    return res.status(201).json(alert);
  } catch (err) {
    console.error('Create alert error:', err.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/alerts/:id — delete alert (only if owned by current user)
router.delete('/:id', async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({ error: 'Alert not found' });
    }

    const deleted = await Alert.findOneAndDelete({
      _id: id,
      user: userId
    });

    if (!deleted) {
      return res.status(404).json({ error: 'Alert not found' });
    }

    return res.status(204).send();
  } catch (err) {
    console.error('Delete alert error:', err.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
