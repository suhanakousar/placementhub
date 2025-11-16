const mongoose = require('mongoose');

const placementDriveSchema = new mongoose.Schema({
  companyName: {
    type: String,
    required: true
  },
  role: {
    type: String,
    required: true
  },
  package: {
    type: String,
    required: true
  },
  description: String,
  eligibilityCriteria: {
    minCGPA: Number,
    departments: [String],
    year: Number,
    skills: [String],
    backlogsAllowed: { type: Number, default: 0 }
  },
  applicationDeadline: {
    type: Date,
    required: true
  },
  driveDate: Date,
  status: {
    type: String,
    enum: ['open', 'closed', 'result_published'],
    default: 'open'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true
  },
  applications: [{
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student'
    },
    appliedAt: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['applied', 'shortlisted', 'rejected', 'interviewed', 'selected'],
      default: 'applied'
    },
    interviewDate: Date,
    feedback: String
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('PlacementDrive', placementDriveSchema);

