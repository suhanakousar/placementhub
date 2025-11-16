const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  personalInfo: {
    firstName: { type: String, default: 'Admin' },
    lastName: { type: String, default: 'User' },
    phone: String,
    department: String,
    designation: String
  },
  permissions: {
    canManageStudents: { type: Boolean, default: true },
    canManageDrives: { type: Boolean, default: true },
    canVerifyDocuments: { type: Boolean, default: true },
    canManageRecruiters: { type: Boolean, default: true },
    canViewReports: { type: Boolean, default: true }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Admin', adminSchema);

