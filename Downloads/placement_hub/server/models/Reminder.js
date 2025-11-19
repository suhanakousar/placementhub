const mongoose = require('mongoose');

const reminderSchema = new mongoose.Schema({
  // What this reminder is for
  entityType: {
    type: String,
    enum: ['meeting', 'task'],
    required: true
  },
  entityId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  // Recipient
  recipientId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  recipientType: {
    type: String,
    enum: ['Student', 'Admin'],
    required: true
  },
  recipientEmail: {
    type: String,
    required: true
  },
  // Reminder timing
  reminderType: {
    type: String,
    enum: ['48_hours', '24_hours', '1_hour', '10_minutes', 'custom'],
    required: true
  },
  scheduledFor: {
    type: Date,
    required: true
  },
  // Status
  status: {
    type: String,
    enum: ['pending', 'sent', 'failed', 'cancelled'],
    default: 'pending'
  },
  sentAt: Date,
  // Email log reference
  emailLogId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'EmailLog'
  },
  // Retry
  retryCount: {
    type: Number,
    default: 0
  },
  errorMessage: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes
reminderSchema.index({ entityId: 1, entityType: 1 });
reminderSchema.index({ scheduledFor: 1, status: 1 });
reminderSchema.index({ recipientId: 1 });

module.exports = mongoose.model('Reminder', reminderSchema);

