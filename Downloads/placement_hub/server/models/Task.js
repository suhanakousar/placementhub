const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true
  },
  // Task details
  title: {
    type: String,
    required: true
  },
  description: String,
  // Priority
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  // Status
  status: {
    type: String,
    enum: ['open', 'in_progress', 'blocked', 'done', 'cancelled'],
    default: 'open'
  },
  // Due date
  dueDate: Date,
  // Completion
  completedAt: Date,
  completedBy: {
    type: String,
    enum: ['student', 'admin']
  },
  // Origin tracking
  origin: {
    type: String,
    enum: ['manual', 'auto_feedback', 'auto_no_show', 'auto_email', 'feedback_tag'],
    default: 'manual'
  },
  // Linked entities
  linkedMeetingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Meeting'
  },
  linkedFeedbackId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Feedback'
  },
  linkedEmailId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'EmailLog'
  },
  // Source tag (if created from feedback tag)
  sourceTag: String,
  // Attachments
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
  // Student evidence/submission
  studentEvidence: {
    text: String,
    files: [{
      name: String,
      file: String,
      uploadedAt: Date
    }],
    submittedAt: Date
  },
  // Reminders
  reminders: [{
    type: {
      type: String,
      enum: ['hours', 'days']
    },
    value: Number, // N hours/days before due date
    sent: {
      type: Boolean,
      default: false
    },
    sentAt: Date
  }],
  // Comments/notes
  comments: [{
    author: {
      type: String,
      enum: ['student', 'admin']
    },
    authorId: mongoose.Schema.Types.ObjectId,
    text: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  // Review request
  reviewRequested: {
    type: Boolean,
    default: false
  },
  reviewRequestedAt: Date,
  // Review status
  reviewed: {
    type: Boolean,
    default: false
  },
  reviewedAt: Date,
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  },
  reviewFeedback: String,
  // Audit trail
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
taskSchema.index({ studentId: 1, status: 1 });
taskSchema.index({ studentId: 1, dueDate: 1 });
taskSchema.index({ createdBy: 1, status: 1 });
taskSchema.index({ status: 1, dueDate: 1 });
taskSchema.index({ origin: 1 });

// Pre-save middleware
taskSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Virtual for checking if task is overdue
taskSchema.virtual('isOverdue').get(function() {
  return this.dueDate && this.dueDate < new Date() && this.status !== 'done';
});

module.exports = mongoose.model('Task', taskSchema);

