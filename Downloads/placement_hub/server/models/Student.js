const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  personalInfo: {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    phone: String,
    alternatePhone: String,
    dateOfBirth: Date,
    gender: { type: String, enum: ['male', 'female', 'other'] },
    address: {
      street: String,
      city: String,
      state: String,
      pincode: String,
      country: String
    },
    emergencyContact: {
      name: String,
      relationship: String,
      phone: String
    },
    profilePhoto: String,
    coverBanner: String,
    linkedin: String,
    github: String,
    portfolio: String,
    website: String,
    twitter: String,
    instagram: String,
    leetcode: String,
    hackerrank: String,
    codechef: String,
    codeforces: String,
    geeksforgeeks: String
  },
  codingProfiles: [
    {
      url: { type: String, required: true },
      platform: { type: String },
      username: { type: String },
      lastFetchedAt: Date,
      lastFetchStatus: { type: String, enum: ['success', 'error'], default: undefined },
      lastError: String
    }
  ],
  academicInfo: {
    rollNumber: { type: String, required: true, unique: true },
    department: { type: String, required: true },
    year: { type: Number, required: true },
    semester: Number,
    cgpa: Number,
    semesters: [{
      semester: Number,
      sgpa: Number,
      backlogs: Number,
      year: Number
    }]
  },
  skills: [{
    name: String,
    level: { type: String, enum: ['beginner', 'intermediate', 'advanced'] },
    verified: { type: Boolean, default: false }
  }],
  projects: [{
    title: String,
    description: String,
    technologies: [String],
    githubLink: String,
    demoLink: String,
    startDate: Date,
    endDate: Date,
    status: { type: String, enum: ['ongoing', 'completed'], default: 'completed' }
  }],
  internships: [{
    companyName: String,
    role: String,
    description: String,
    startDate: Date,
    endDate: Date,
    certificate: String,
    mentor: String,
    status: { type: String, enum: ['ongoing', 'completed'], default: 'completed' }
  }],
  hackathons: [{
    name: String,
    platform: String,
    date: Date,
    rank: Number,
    teamSize: Number,
    description: String,
    certificate: String,
    projectLink: String
  }],
  achievements: [{
    title: String,
    description: String,
    date: Date,
    certificate: String,
    type: { type: String, enum: ['academic', 'competition', 'certification', 'other'] }
  }],
  certifications: [{
    name: { type: String, required: true },
    issuer: String,
    issueDate: Date,
    expiryDate: Date,
    credentialId: String,
    credentialUrl: String,
    description: String,
    file: String,
    skills: [String],
    uploadedAt: { type: Date, default: Date.now }
  }],
  resumes: [{
    name: String,
    file: String,
    tags: [String],
    uploadedAt: { type: Date, default: Date.now },
    verified: { type: Boolean, default: false },
    feedback: String,
    score: Number
  }],
  placementStatus: {
    profileCompleted: { type: Boolean, default: false },
    resumeVerified: { type: Boolean, default: false },
    shortlisted: { type: Boolean, default: false },
    interviewScheduled: { type: Boolean, default: false },
    selected: { type: Boolean, default: false },
    currentStage: { type: String, default: 'profile_created' },
    offers: [{
      company: String,
      role: String,
      package: String,
      status: { type: String, enum: ['pending', 'accepted', 'rejected'] },
      date: Date
    }]
  },
  profileCompletion: {
    percentage: { type: Number, default: 0 },
    lastUpdated: Date
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

studentSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Student', studentSchema);

