const mongoose = require('mongoose');

const meetingSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  mentorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true
  },
  // Meeting timing (stored in UTC)
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date,
    required: true
  },
  // Timezone info
  studentTimezone: {
    type: String,
    required: true,
    default: 'UTC'
  },
  mentorTimezone: {
    type: String,
    required: true,
    default: 'UTC'
  },
  // Meeting details
  title: {
    type: String,
    required: true
  },
  topic: {
    type: String,
    enum: [
      'resume_review',
      'mock_interview',
      'coding_doubts',
      'career_guidance',
      'placement_prep',
      'project_review',
      'soft_skills',
      'other'
    ],
    required: true
  },
  description: String,
  notes: String, // Admin-only notes
  // Meeting link
  meetingLink: {
    type: String,
    default: ''
  },
  meetingPlatform: {
    type: String,
    enum: ['google_meet'],
    default: 'google_meet'
  },
  // Real meeting details
  meetingId: {
    type: String, // Platform-specific meeting ID
    default: null
  },
  meetingPassword: {
    type: String, // Meeting password if required
    default: null
  },
  meetingDialIn: {
    type: String, // Dial-in number
    default: null
  },
  meetingStartUrl: {
    type: String, // Host start URL (for Zoom, etc.)
    default: null
  },
  // Status tracking
  status: {
    type: String,
    enum: [
      'pending',      // Requested by student, awaiting approval
      'approved',     // Approved by admin, scheduled
      'confirmed',    // Confirmed by both parties
      'in_progress',  // Currently happening
      'completed',    // Finished successfully
      'cancelled',    // Cancelled by admin or student
      'no_show',      // Student didn't show up
      'rescheduled'   // Was rescheduled
    ],
    default: 'pending'
  },
  // Request information (if created from student request)
  requestId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MeetingRequest'
  },
  // Recurring meeting support
  isRecurring: {
    type: Boolean,
    default: false
  },
  recurringPattern: {
    frequency: {
      type: String,
      enum: ['daily', 'weekly', 'biweekly', 'monthly']
    },
    interval: Number, // Every N days/weeks/months
    endDate: Date,
    occurrences: Number
  },
  parentMeetingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Meeting'
  },
  // Reminders sent
  remindersSent: {
    type: [Date],
    default: []
  },
  // ICS calendar file
  icsFile: String,
  // Documents/attachments
  attachments: [{
    name: String,
    file: String,
    uploadedBy: {
      type: String,
      enum: ['student', 'admin']
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  // Feedback reference
  feedbackId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Feedback'
  },
  // Audit trail
  createdBy: {
    type: String,
    enum: ['student', 'admin'],
    required: true
  },
  cancelledBy: {
    type: String,
    enum: ['student', 'admin']
  },
  cancellationReason: String,
  cancelledAt: Date,
  rescheduledFrom: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Meeting'
  },
  rescheduledTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Meeting'
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
meetingSchema.index({ studentId: 1, startTime: 1 });
meetingSchema.index({ mentorId: 1, startTime: 1 });
meetingSchema.index({ status: 1, startTime: 1 });
meetingSchema.index({ startTime: 1, endTime: 1 });

// Pre-save middleware
meetingSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Virtual for checking if meeting is in the past
meetingSchema.virtual('isPast').get(function() {
  return this.endTime < new Date();
});

// Virtual for checking if meeting is upcoming
meetingSchema.virtual('isUpcoming').get(function() {
  return this.startTime > new Date();
});

// Virtual for checking if meeting is currently happening
meetingSchema.virtual('isActive').get(function() {
  const now = new Date();
  return this.startTime <= now && this.endTime >= now;
});

module.exports = mongoose.model('Meeting', meetingSchema);

