const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  coinId: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  coinName: {
    type: String,
    trim: true,
    default: ''
  },
  coinSymbol: {
    type: String,
    trim: true,
    uppercase: true,
    default: ''
  },
  direction: {
    type: String,
    enum: ['above', 'below'],
    required: true
  },
  targetPrice: {
    type: Number,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Alert', alertSchema);
