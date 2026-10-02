const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    unique: true,
    sparse: true,
    trim: true,
    lowercase: true
  },
  email: {
    type: String,
    unique: true,
    sparse: true,
    trim: true,
    lowercase: true
  },
  passwordHash: {
    type: String,
    required: true
  },
  watchlist: {
    type: [String],
    default: []
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Validate that at least one of username or email is provided
userSchema.pre('validate', function () {
  if (!this.username && !this.email) {
    this.invalidate('identifier', 'At least one of username or email is required');
  }
});

module.exports = mongoose.model('User', userSchema);
