const mongoose = require('mongoose');

// Define attachment subdocument schema
const attachmentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  file: {
    type: String,
    required: true
  },
  type: {
    type: String,
    required: true
  }
}, { _id: false }); // Disable _id for subdocuments

const postSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['drive', 'learning_plan', 'announcement', 'general'],
    required: true
  },
  category: {
    type: String,
    enum: ['placement_drive', 'internship_opportunity', 'learning_resource', 'workshop', 'other'],
    default: 'other'
  },
  requiresVerification: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  attachments: [attachmentSchema], // Use the subdocument schema
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  expiryDate: Date,
  tags: [String],
  // Filter fields for targeted posts
  targetDepartment: { type: String }, // If set, only students from this department can see
  targetYear: { type: Number }, // If set, only students with this passout batch can see
  targetSpecialization: { type: String } // If set, only students with this specialization can see
});

postSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Post', postSchema);

