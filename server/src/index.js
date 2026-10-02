require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('MongoDB connection error: MONGODB_URI is not defined');
} else {
  mongoose
    .connect(MONGODB_URI)
    .then(() => {
      console.log('MongoDB connected successfully');
    })
    .catch((err) => {
      console.error('MongoDB connection error:', err.message || err);
    });
}

mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err.message || err);
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// Routes
const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

// Start server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
