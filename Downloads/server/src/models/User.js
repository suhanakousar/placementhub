const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  firebaseUid: {
    type: String,
    unique: true,
    sparse: true // Allow null values but ensure uniqueness when present
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: function() {
      return !this.firebaseUid; // Password required only if not using Firebase
    },
    minlength: 6
  },
  role: {
    type: String,
    enum: ['student', 'admin'],
    required: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Hash password before saving (only for non-Firebase users)
userSchema.pre('save', async function(next) {
  if (!this.isModified('password') || !this.password) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function(password) {
  if (!this.password) return false; // Firebase users don't have passwords
  return await bcrypt.compare(password, this.password);
};

module.exports = mongoose.model('User', userSchema);
