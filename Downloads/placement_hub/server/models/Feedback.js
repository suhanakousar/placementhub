const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
  meetingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Meeting',
    required: true
  },
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
  // Rating (1-5 scale)
  rating: {
    type: Number,
    min: 1,
    max: 5,
    required: true
  },
  // Tags for categorization
  tags: [{
    type: String,
    enum: [
      'communication',
      'coding',
      'resume',
      'hr_prep',
      'confidence',
      'technical_skills',
      'problem_solving',
      'presentation',
      'time_management',
      'leadership',
      'teamwork',
      'needs_improvement',
      'excellent',
      'good_progress'
    ]
  }],
  // Detailed feedback
  strengths: [String],
  areasForImprovement: [String],
  detailedComments: String,
  recommendations: String,
  // Visibility
  visibleToStudent: {
    type: Boolean,
    default: true
  },
  // Feedback email sent
  emailSent: {
    type: Boolean,
    default: false
  },
  emailSentAt: Date,
  // Follow-up tasks created
  tasksCreated: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task'
  }],
  // Auto-created tasks from tags
  autoTasksCreated: {
    type: Boolean,
    default: false
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

// Indexes
feedbackSchema.index({ studentId: 1, createdAt: -1 });
feedbackSchema.index({ meetingId: 1 });
feedbackSchema.index({ mentorId: 1, createdAt: -1 });

// Pre-save middleware
feedbackSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Feedback', feedbackSchema);

