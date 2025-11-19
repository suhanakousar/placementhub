const mongoose = require('mongoose');

const meetingRequestSchema = new mongoose.Schema({
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
  // Requested time slots (student's preferred times)
  preferredSlots: [{
    date: Date,
    startTime: String, // HH:mm format in student's timezone
    endTime: String,   // HH:mm format in student's timezone
    timezone: String
  }],
  studentTimezone: {
    type: String,
    required: true,
    default: 'UTC'
  },
  // Meeting details
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
  title: {
    type: String,
    required: true
  },
  description: String,
  additionalNotes: String,
  // Priority level
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  // Status
  status: {
    type: String,
    enum: ['pending', 'approved', 'declined', 'expired', 'converted'],
    default: 'pending'
  },
  // If approved, link to the created meeting
  meetingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Meeting'
  },
  // Admin response
  adminResponse: {
    message: String,
    respondedAt: Date,
    scheduledMeetingTime: Date // If approved, when is the meeting
  },
  // Expiry (requests expire after 7 days if not responded)
  expiresAt: {
    type: Date,
    default: function() {
      return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    }
  },
  // Attachments (resume, project files, etc.)
  attachments: [{
    name: String,
    file: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes
meetingRequestSchema.index({ studentId: 1, status: 1 });
meetingRequestSchema.index({ mentorId: 1, status: 1 });
meetingRequestSchema.index({ status: 1, createdAt: 1 });
meetingRequestSchema.index({ expiresAt: 1 });

// Pre-save middleware
meetingRequestSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  
  // Auto-expire if past expiry date
  if (this.status === 'pending' && this.expiresAt && this.expiresAt < new Date()) {
    this.status = 'expired';
  }
  
  next();
});

module.exports = mongoose.model('MeetingRequest', meetingRequestSchema);

