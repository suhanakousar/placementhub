const mongoose = require('mongoose');

const sessionParticipantSchema = new mongoose.Schema({
  sessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Session',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  role: {
    type: String,
    enum: ['admin', 'student'],
    required: true
  },
  joinStatus: {
    type: String,
    enum: ['not_joined', 'joined', 'left'],
    default: 'not_joined'
  },
  joinTime: {
    type: Date,
    default: null
  },
  leaveTime: {
    type: Date,
    default: null
  },
  // Reference to related meeting (for backward compatibility)
  meetingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Meeting',
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes for efficient queries
sessionParticipantSchema.index({ sessionId: 1, userId: 1 }, { unique: true });
sessionParticipantSchema.index({ userId: 1 });
sessionParticipantSchema.index({ sessionId: 1, role: 1 });
sessionParticipantSchema.index({ joinStatus: 1 });

// Pre-save middleware
sessionParticipantSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('SessionParticipant', sessionParticipantSchema);

