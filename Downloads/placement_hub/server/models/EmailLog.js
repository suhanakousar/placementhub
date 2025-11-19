const mongoose = require('mongoose');

const emailLogSchema = new mongoose.Schema({
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
  // Sender
  sentBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true
  },
  // Email details
  subject: {
    type: String,
    required: true
  },
  body: {
    type: String,
    required: true
  },
  htmlBody: String,
  // Template used
  templateId: String,
  templateName: String,
  // Variables used for personalization
  variables: {
    type: Map,
    of: String
  },
  // Attachments
  attachments: [{
    name: String,
    file: String,
    type: String
  }],
  // Meeting-related
  includesMeetingLink: {
    type: Boolean,
    default: false
  },
  includesICSFile: {
    type: Boolean,
    default: false
  },
  meetingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Meeting'
  },
  // Scheduling
  scheduledFor: Date,
  sentAt: Date,
  // Status tracking
  status: {
    type: String,
    enum: ['pending', 'scheduled', 'sent', 'delivered', 'opened', 'bounced', 'failed'],
    default: 'pending'
  },
  // Delivery tracking
  deliveryStatus: {
    delivered: Boolean,
    deliveredAt: Date,
    opened: Boolean,
    openedAt: Date,
    clicked: Boolean,
    clickedAt: Date,
    bounced: Boolean,
    bounceReason: String
  },
  // Retry logic
  retryCount: {
    type: Number,
    default: 0
  },
  maxRetries: {
    type: Number,
    default: 3
  },
  lastRetryAt: Date,
  errorMessage: String,
  // Linked tasks (if created from email)
  tasksCreated: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task'
  }],
  // Bulk email tracking
  isBulkEmail: {
    type: Boolean,
    default: false
  },
  bulkEmailId: String, // Group ID for bulk sends
  // Undo send (for scheduled emails)
  canUndo: {
    type: Boolean,
    default: false
  },
  undone: {
    type: Boolean,
    default: false
  },
  undoneAt: Date,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes
emailLogSchema.index({ recipientId: 1, createdAt: -1 });
emailLogSchema.index({ sentBy: 1, createdAt: -1 });
emailLogSchema.index({ status: 1, scheduledFor: 1 });
emailLogSchema.index({ meetingId: 1 });
emailLogSchema.index({ bulkEmailId: 1 });

module.exports = mongoose.model('EmailLog', emailLogSchema);

