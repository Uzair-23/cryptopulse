const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

function createToken(userId) {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not configured');
  }
  return jwt.sign({ sub: userId }, secret, { expiresIn: '7d' });
}

// POST /api/auth/signup
router.post('/signup', async (req, res) => {
  try {
    const { identifier, password } = req.body || {};

    if (!identifier || typeof identifier !== 'string' || !identifier.trim()) {
      return res.status(400).json({ error: 'Email or username is required' });
    }

    if (!password || typeof password !== 'string' || password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    const cleanIdentifier = identifier.trim().toLowerCase();
    const isEmail = cleanIdentifier.includes('@');
    const query = isEmail ? { email: cleanIdentifier } : { username: cleanIdentifier };

    const existingUser = await User.findOne(query);
    if (existingUser) {
      return res.status(409).json({ error: 'Account already exists' });
    }

    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    const userData = {
      passwordHash,
      ...(isEmail ? { email: cleanIdentifier } : { username: cleanIdentifier })
    };

    const user = await User.create(userData);
    const token = createToken(user._id);

    return res.status(201).json({
      token,
      user: {
        id: user._id,
        identifier: user.email || user.username,
        watchlist: user.watchlist || []
      }
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: 'Account already exists' });
    }
    console.error('Signup error:', err.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { identifier, password } = req.body || {};

    if (!identifier || !password || typeof identifier !== 'string' || typeof password !== 'string') {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const cleanIdentifier = identifier.trim().toLowerCase();
    const isEmail = cleanIdentifier.includes('@');
    const query = isEmail ? { email: cleanIdentifier } : { username: cleanIdentifier };

    const user = await User.findOne(query);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = createToken(user._id);

    return res.json({
      token,
      user: {
        id: user._id,
        identifier: user.email || user.username,
        watchlist: user.watchlist || []
      }
    });
  } catch (err) {
    console.error('Login error:', err.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/auth/me
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.sub).select('-passwordHash');
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    return res.json({
      user: {
        id: user._id,
        identifier: user.email || user.username,
        watchlist: user.watchlist || []
      }
    });
  } catch (err) {
    console.error('Auth /me error:', err.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
