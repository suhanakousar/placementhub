const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['group', 'one_to_one'],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  mentorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true
  },
  meetingLink: {
    type: String,
    default: null
  },
  meetingPlatform: {
    type: String,
    enum: ['google_meet', 'jitsi', 'zoom', 'microsoft_teams', 'custom'],
    default: 'jitsi'  // Changed default to Jitsi since it's simpler and works without API setup
  },
  meetingId: {
    type: String, // Platform-specific meeting ID
    default: null
  },
  meetingPassword: {
    type: String,
    default: null
  },
  meetingDialIn: {
    type: String,
    default: null
  },
  meetingStartUrl: {
    type: String, // Host start URL
    default: null
  },
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['scheduled', 'ongoing', 'completed', 'cancelled'],
    default: 'scheduled'
  },
  // Reference to related meetings (for backward compatibility)
  meetingIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Meeting'
  }],
  // Group session metadata (if type is 'group')
  groupSessionId: {
    type: String // Legacy field for compatibility
  },
  groupFilters: {
    department: String,
    year: Number,
    specialization: String
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
sessionSchema.index({ mentorId: 1, startTime: 1 });
sessionSchema.index({ status: 1, startTime: 1 });
sessionSchema.index({ startTime: 1, endTime: 1 });
sessionSchema.index({ groupSessionId: 1 });
sessionSchema.index({ meetingLink: 1 });

// Pre-save middleware
sessionSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Virtual for checking if session is in the past
sessionSchema.virtual('isPast').get(function() {
  return this.endTime < new Date();
});

// Virtual for checking if session is upcoming
sessionSchema.virtual('isUpcoming').get(function() {
  return this.startTime > new Date();
});

// Virtual for checking if session is currently happening
sessionSchema.virtual('isActive').get(function() {
  const now = new Date();
  return this.startTime <= now && this.endTime >= now;
});

module.exports = mongoose.model('Session', sessionSchema);

