const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const Student = require('../models/Student');
const { protect, authorize } = require('../middleware/auth');
const { parseResume } = require('../services/resumeParser');
const { fetchJobsFromAPIs, calculateMatchScore } = require('../services/jobService');

const router = express.Router();

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for resume uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'resume-' + uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({ 
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.pdf', '.doc', '.docx'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF and DOC/DOCX files are allowed'));
    }
  }
});

// @route   POST /api/resume/upload
// @desc    Upload and parse resume
// @access  Private (Student)
router.post('/resume/upload', authorize('student'), upload.single('resume'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const student = await Student.findOne({ userId: req.user._id });
    if (!student) {
      return res.status(404).json({ message: 'Student profile not found' });
    }

    // Parse resume
    const resumeAnalysis = await parseResume(req.file.path);

    // Store resume analysis in student document
    student.resumeAnalysis = {
      file: `uploads/${path.basename(req.file.path)}`,
      fileName: req.file.originalname,
      fileSize: req.file.size,
      uploadedAt: new Date(),
      ...resumeAnalysis
    };

    await student.save();

    res.json({
      message: 'Resume uploaded and analyzed successfully',
      analysis: resumeAnalysis
    });
  } catch (error) {
    console.error('Error uploading resume:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/resume/analysis
// @desc    Get resume analysis for current student
// @access  Private (Student)
router.get('/resume/analysis', authorize('student'), async (req, res) => {
  try {
    const student = await Student.findOne({ userId: req.user._id });
    if (!student) {
      return res.status(404).json({ message: 'Student profile not found' });
    }

    if (!student.resumeAnalysis) {
      return res.status(404).json({ message: 'No resume analysis found. Please upload a resume first.' });
    }

    res.json(student.resumeAnalysis);
  } catch (error) {
    console.error('Error fetching resume analysis:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/jobs/recommend
// @desc    Get job recommendations based on resume
// @access  Private (Student)
router.post('/jobs/recommend', authorize('student'), async (req, res) => {
  try {
    const { keywords, location, experienceLevel, jobType, page = 1, pageSize = 20 } = req.body;

    const student = await Student.findOne({ userId: req.user._id });
    if (!student) {
      return res.status(404).json({ message: 'Student profile not found' });
    }

    if (!student.resumeAnalysis) {
      return res.status(400).json({ 
        message: 'No resume analysis found. Please upload and analyze your resume first.' 
      });
    }

    // Build search parameters
    const searchParams = {
      keywords: keywords || student.resumeAnalysis.preferredRoles?.join(' ') || student.resumeAnalysis.topSkills?.slice(0, 5).join(' ') || '',
      location: location || student.resumeAnalysis.location || 'Remote',
      experienceLevel: experienceLevel || student.resumeAnalysis.experienceLevel || 'Fresher',
      jobType: jobType || 'Full-time',
      page,
      pageSize
    };

    // Fetch jobs from APIs
    const jobs = await fetchJobsFromAPIs(searchParams);

    // Calculate match scores for each job
    const jobsWithScores = jobs.map(job => {
      const matchScore = calculateMatchScore(
        job.skills || [],
        student.resumeAnalysis.topSkills || []
      );
      return {
        ...job,
        matchScore
      };
    });

    // Sort by match score descending
    jobsWithScores.sort((a, b) => b.matchScore - a.matchScore);

    // Paginate
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedJobs = jobsWithScores.slice(startIndex, endIndex);

    res.json({
      jobs: paginatedJobs,
      total: jobsWithScores.length,
      page: parseInt(page),
      pageSize: parseInt(pageSize)
    });
  } catch (error) {
    console.error('Error fetching job recommendations:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/jobs/save
// @desc    Save a job for later
// @access  Private (Student)
router.post('/jobs/save', authorize('student'), async (req, res) => {
  try {
    const { jobId, title, company, location, url, type } = req.body;

    if (!jobId || !title || !company) {
      return res.status(400).json({ message: 'Missing required job information' });
    }

    const student = await Student.findOne({ userId: req.user._id });
    if (!student) {
      return res.status(404).json({ message: 'Student profile not found' });
    }

    // Initialize savedJobs array if it doesn't exist
    if (!student.savedJobs) {
      student.savedJobs = [];
    }

    // Check if job already saved
    const existingJob = student.savedJobs.find(job => job.jobId === jobId);
    if (existingJob) {
      return res.json({ message: 'Job already saved', job: existingJob });
    }

    // Add job to saved list
    student.savedJobs.push({
      jobId,
      title,
      company,
      location,
      url,
      type,
      savedAt: new Date()
    });

    await student.save();

    res.json({ message: 'Job saved successfully', job: student.savedJobs[student.savedJobs.length - 1] });
  } catch (error) {
    console.error('Error saving job:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   DELETE /api/jobs/save/:jobId
// @desc    Unsave a job
// @access  Private (Student)
router.delete('/jobs/save/:jobId', authorize('student'), async (req, res) => {
  try {
    const student = await Student.findOne({ userId: req.user._id });
    if (!student) {
      return res.status(404).json({ message: 'Student profile not found' });
    }

    if (!student.savedJobs) {
      return res.status(404).json({ message: 'No saved jobs found' });
    }

    const jobIndex = student.savedJobs.findIndex(job => job.jobId === req.params.jobId);
    if (jobIndex === -1) {
      return res.status(404).json({ message: 'Job not found in saved list' });
    }

    student.savedJobs.splice(jobIndex, 1);
    await student.save();

    res.json({ message: 'Job removed from saved list' });
  } catch (error) {
    console.error('Error unsaving job:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/jobs/saved
// @desc    Get all saved jobs
// @access  Private (Student)
router.get('/jobs/saved', authorize('student'), async (req, res) => {
  try {
    const student = await Student.findOne({ userId: req.user._id });
    if (!student) {
      return res.status(404).json({ message: 'Student profile not found' });
    }

    const savedJobs = student.savedJobs || [];
    res.json({ jobs: savedJobs, total: savedJobs.length });
  } catch (error) {
    console.error('Error fetching saved jobs:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;

