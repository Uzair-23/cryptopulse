const express = require('express');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// All watchlist routes require authentication
router.use(authMiddleware);

// GET /api/watchlist — fetch current user's watchlist
router.get('/', async (req, res) => {
  try {
    const user = await User.findById(req.user.sub).select('watchlist');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json({
      watchlist: user.watchlist || []
    });
  } catch (err) {
    console.error('Get watchlist error:', err.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/watchlist/:coinId — add a coin to watchlist (idempotent via $addToSet)
router.post('/:coinId', async (req, res) => {
  try {
    const coinId = req.params.coinId ? req.params.coinId.trim().toLowerCase() : '';
    if (!coinId) {
      return res.status(400).json({ error: 'Invalid coin ID' });
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user.sub,
      { $addToSet: { watchlist: coinId } },
      { new: true }
    ).select('watchlist');

    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json({
      watchlist: updatedUser.watchlist || []
    });
  } catch (err) {
    console.error('Add to watchlist error:', err.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/watchlist/:coinId — remove a coin from watchlist (idempotent via $pull)
router.delete('/:coinId', async (req, res) => {
  try {
    const coinId = req.params.coinId ? req.params.coinId.trim().toLowerCase() : '';
    if (!coinId) {
      return res.status(400).json({ error: 'Invalid coin ID' });
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user.sub,
      { $pull: { watchlist: coinId } },
      { new: true }
    ).select('watchlist');

    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json({
      watchlist: updatedUser.watchlist || []
    });
  } catch (err) {
    console.error('Remove from watchlist error:', err.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
