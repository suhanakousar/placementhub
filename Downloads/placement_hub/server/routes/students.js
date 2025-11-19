const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Student = require('../models/Student');
const LeaderboardProfile = require('../models/LeaderboardProfile');
const { protect, authorize } = require('../middleware/auth');
const { fetchCodingStats } = require('../services/codingPlatformService');

const router = express.Router();

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({ 
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// ==================== PUBLIC LEADERBOARD ROUTES ====================

// @route   GET /api/students/leaderboard
// @desc    Get ranked list of all students with overall scores
// @access  Public
router.get('/leaderboard', async (req, res) => {
  try {
    const students = await Student.find()
      .select('personalInfo academicInfo userId')
      .populate('userId', 'email')
      .lean();

    const userIds = students.map((s) => s.userId?._id || s.userId);
    const leaderboardProfiles = await LeaderboardProfile.find({
      userId: { $in: userIds }
    }).lean();

    const profileMap = new Map();
    leaderboardProfiles.forEach((profile) => {
      profileMap.set(profile.userId.toString(), profile);
    });

    const studentsWithScores = students.map((student) => {
      const userId = student.userId?._id || student.userId;
      const profile = profileMap.get(userId?.toString());

      let overallScore = 0;
      if (profile?.metadata?.codingStats) {
        overallScore = calculateOverallScore(profile.metadata.codingStats);
      } else if (profile?.points?.total) {
        overallScore = profile.points.total;
      }

      return {
        studentId: student._id.toString(),
        username:
          `${student.personalInfo?.firstName || ''} ${
            student.personalInfo?.lastName || ''
          }`.trim() || student.userId?.email || 'Unknown',
        email: student.userId?.email || '',
        rollNumber: student.academicInfo?.rollNumber || '',
        department: student.academicInfo?.department || '',
        overallScore,
        avatarUrl: student.personalInfo?.profilePhoto || profile?.avatarUrl || null
      };
    });

    studentsWithScores.sort((a, b) => b.overallScore - a.overallScore);

    const rankedStudents = studentsWithScores.map((student, index) => ({
      ...student,
      rank: index + 1,
      rankChange: null
    }));

    res.json({
      students: rankedStudents
    });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/students/:studentId/coding-stats
// @desc    Get coding statistics for a specific student (public)
// @access  Public
router.get('/:studentId/coding-stats', async (req, res) => {
  try {
    const student = await Student.findById(req.params.studentId);
    if (!student) {
      return res.status(404).json({ message: 'Student profile not found' });
    }

    const handles = {
      leetcode: student.personalInfo?.leetcode
        ? extractUsername(student.personalInfo.leetcode, 'leetcode')
        : null,
      hackerrank: student.personalInfo?.hackerrank
        ? extractUsername(student.personalInfo.hackerrank, 'hackerrank')
        : null,
      codechef: student.personalInfo?.codechef
        ? extractUsername(student.personalInfo.codechef, 'codechef')
        : null,
      codeforces: student.personalInfo?.codeforces
        ? extractUsername(student.personalInfo.codeforces, 'codeforces')
        : null,
      geeksforgeeks: student.personalInfo?.geeksforgeeks
        ? extractUsername(student.personalInfo.geeksforgeeks, 'geeksforgeeks')
        : null
    };

    const codingStats = await fetchCodingStats(handles);

    const generateRatingHistory = (platform, currentRating) => {
      const months = [
        'Jan',
        'Feb',
        'Mar',
        'Apr',
        'May',
        'Jun',
        'Jul',
        'Aug',
        'Sep',
        'Oct',
        'Nov',
        'Dec'
      ];
      const history = [];
      const now = new Date();

      for (let i = 11; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const baseRating = currentRating
          ? currentRating - (Math.random() * 200 + 100)
          : 1200;
        const variation = Math.random() * 100 - 50;
        history.push({
          month: months[date.getMonth()],
          rating: Math.max(0, Math.round(baseRating + variation + (11 - i) * 20))
        });
      }
      return history;
    };

    if (codingStats.codechef) {
      codingStats.codechef.ratingHistory = generateRatingHistory(
        'codechef',
        codingStats.codechef.contestRating
      );
      codingStats.codechef.highestRating = codingStats.codechef.contestRating
        ? Math.max(
            ...codingStats.codechef.ratingHistory.map((r) => r.rating)
          )
        : null;
      codingStats.codechef.ratingChange =
        codingStats.codechef.ratingHistory.length > 1
          ? codingStats.codechef.ratingHistory[
              codingStats.codechef.ratingHistory.length - 1
            ].rating -
            codingStats.codechef.ratingHistory[0].rating
          : 0;
    }
    if (codingStats.codeforces) {
      codingStats.codeforces.ratingHistory = generateRatingHistory(
        'codeforces',
        codingStats.codeforces.contestRating
      );
      codingStats.codeforces.highestRating =
        codingStats.codeforces.contestRating ||
        Math.max(...codingStats.codeforces.ratingHistory.map((r) => r.rating));
      codingStats.codeforces.ratingChange =
        codingStats.codeforces.ratingHistory.length > 1
          ? codingStats.codeforces.ratingHistory[
              codingStats.codeforces.ratingHistory.length - 1
            ].rating -
            codingStats.codeforces.ratingHistory[0].rating
          : 0;
    }
    if (codingStats.leetcode) {
      codingStats.leetcode.ratingHistory = generateRatingHistory(
        'leetcode',
        codingStats.leetcode.contestRating
      );
      codingStats.leetcode.highestRating =
        codingStats.leetcode.contestRating ||
        Math.max(...codingStats.leetcode.ratingHistory.map((r) => r.rating));
      codingStats.leetcode.ratingChange =
        codingStats.leetcode.ratingHistory.length > 1
          ? codingStats.leetcode.ratingHistory[
              codingStats.leetcode.ratingHistory.length - 1
            ].rating -
            codingStats.leetcode.ratingHistory[0].rating
          : 0;
    }

    const overallScore = calculateOverallScore(codingStats);
    const globalRank = Math.floor(Math.random() * 5000) + 1;
    const globalRankingsHistory = generateRatingHistory('global', overallScore);

    const scoreDistribution = [
      {
        name: 'HackerRank',
        value: codingStats.hackerrank?.points || 0,
        color: '#16a34a'
      },
      {
        name: 'InterviewBit',
        value: 0,
        color: '#3b82f6'
      },
      {
        name: 'LeetCode',
        value:
          codingStats.leetcode?.points ||
          codingStats.leetcode?.problemsSolved * 10 ||
          0,
        color: '#f89f1b'
      },
      {
        name: 'Codeforces',
        value:
          codingStats.codeforces?.points ||
          codingStats.codeforces?.contestRating ||
          0,
        color: '#3182ce'
      },
      {
        name: 'CodeChef',
        value:
          codingStats.codechef?.points ||
          codingStats.codechef?.contestRating ||
          0,
        color: '#8b5a2b'
      },
      { name: 'GitHub', value: 0, color: '#6b7280' },
      { name: 'SPOJ', value: 0, color: '#8b5cf6' }
    ].filter((item) => item.value > 0);

    const studentInfo = {
      firstName: student.personalInfo?.firstName || '',
      lastName: student.personalInfo?.lastName || '',
      department: student.academicInfo?.department || '',
      year: student.academicInfo?.year || null,
      rollNumber: student.academicInfo?.rollNumber || '',
      profilePhoto: student.personalInfo?.profilePhoto || null
    };

    res.json({
      studentInfo,
      codingStats,
      overallScore,
      globalRank,
      globalRankingsHistory,
      scoreDistribution
    });
  } catch (error) {
    console.error('Error fetching student coding stats:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ==================== AUTHENTICATED ROUTES ====================

// All routes require authentication
router.use(protect);

// @route   GET /api/students/profile
// @desc    Get student profile
// @access  Private (Student)
router.get('/profile', authorize('student'), async (req, res) => {
  try {
    const student = await Student.findOne({ userId: req.user._id });
    if (!student) {
      return res.status(404).json({ message: 'Student profile not found' });
    }
    res.json(student);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/students/profile
// @desc    Update student profile
// @access  Private (Student)
router.put('/profile', authorize('student'), async (req, res) => {
  try {
    const student = await Student.findOneAndUpdate(
      { userId: req.user._id },
      { $set: req.body },
      { new: true, runValidators: true }
    );
    res.json(student);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/students/profile-photo
// @desc    Upload profile photo
// @access  Private (Student)
router.post('/profile-photo', authorize('student'), upload.single('profilePhoto'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const student = await Student.findOne({ userId: req.user._id });
    if (!student) {
      return res.status(404).json({ message: 'Student profile not found' });
    }

    // Delete old profile photo if exists
    if (student.personalInfo?.profilePhoto) {
      const oldFilePath = path.join(__dirname, '..', student.personalInfo.profilePhoto);
      if (fs.existsSync(oldFilePath)) {
        try {
          fs.unlinkSync(oldFilePath);
        } catch (fileError) {
          console.error('Error deleting old profile photo:', fileError);
        }
      }
    }

    const relativePath = `uploads/${path.basename(req.file.path)}`;
    
    // Update profile photo
    if (!student.personalInfo) {
      student.personalInfo = {};
    }
    student.personalInfo.profilePhoto = relativePath;
    await student.save();

    res.json({ 
      message: 'Profile photo uploaded successfully',
      profilePhoto: relativePath 
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/students/projects
// @desc    Add a project
// @access  Private (Student)
router.post('/projects', authorize('student'), async (req, res) => {
  try {
    const student = await Student.findOne({ userId: req.user._id });
    student.projects.push(req.body);
    await student.save();
    res.json(student);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/students/projects/:projectId
// @desc    Update a project
// @access  Private (Student)
router.put('/projects/:projectId', authorize('student'), async (req, res) => {
  try {
    const student = await Student.findOne({ userId: req.user._id });
    const project = student.projects.id(req.params.projectId);
    Object.assign(project, req.body);
    await student.save();
    res.json(student);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   DELETE /api/students/projects/:projectId
// @desc    Delete a project
// @access  Private (Student)
router.delete('/projects/:projectId', authorize('student'), async (req, res) => {
  try {
    const student = await Student.findOne({ userId: req.user._id });
    student.projects.id(req.params.projectId).remove();
    await student.save();
    res.json(student);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/students/internships
// @desc    Add an internship
// @access  Private (Student)
router.post('/internships', authorize('student'), async (req, res) => {
  try {
    const student = await Student.findOne({ userId: req.user._id });
    student.internships.push(req.body);
    await student.save();
    res.json(student);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   DELETE /api/students/internships/:internshipId
// @desc    Delete an internship
// @access  Private (Student)
router.delete('/internships/:internshipId', authorize('student'), async (req, res) => {
  try {
    const student = await Student.findOne({ userId: req.user._id });
    if (!student) {
      return res.status(404).json({ message: 'Student profile not found' });
    }

    const internship = student.internships.id(req.params.internshipId);
    if (!internship) {
      return res.status(404).json({ message: 'Internship not found' });
    }

    student.internships.pull(req.params.internshipId);
    await student.save();
    res.json(student);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/students/hackathons
// @desc    Add a hackathon
// @access  Private (Student)
router.post('/hackathons', authorize('student'), async (req, res) => {
  try {
    const student = await Student.findOne({ userId: req.user._id });
    student.hackathons.push(req.body);
    await student.save();
    res.json(student);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   DELETE /api/students/hackathons/:hackathonId
// @desc    Delete a hackathon
// @access  Private (Student)
router.delete('/hackathons/:hackathonId', authorize('student'), async (req, res) => {
  try {
    const student = await Student.findOne({ userId: req.user._id });
    if (!student) {
      return res.status(404).json({ message: 'Student profile not found' });
    }

    const hackathon = student.hackathons.id(req.params.hackathonId);
    if (!hackathon) {
      return res.status(404).json({ message: 'Hackathon not found' });
    }

    student.hackathons.pull(req.params.hackathonId);
    await student.save();
    res.json(student);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/students/resumes
// @desc    Upload a resume
// @access  Private (Student)
router.post('/resumes', authorize('student'), upload.single('resume'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const student = await Student.findOne({ userId: req.user._id });
    if (!student) {
      return res.status(404).json({ message: 'Student profile not found' });
    }

    // Clean tags - split by comma and trim
    const tags = req.body.tags 
      ? req.body.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)
      : [];

    const relativePath = `uploads/${path.basename(req.file.path)}`;
    student.resumes.push({
      name: req.body.name || 'Resume',
      file: relativePath,
      tags: tags,
      verified: false
    });
    
    await student.save();
    res.json(student);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/students/resumes/:resumeId
// @desc    Download own resume
// @access  Private (Student)
router.get('/resumes/:resumeId', authorize('student'), async (req, res) => {
  try {
    const student = await Student.findOne({ userId: req.user._id });
    if (!student) {
      return res.status(404).json({ message: 'Student profile not found' });
    }

    const resume = student.resumes.find(r => r._id.toString() === req.params.resumeId);
    if (!resume || !resume.file) {
      return res.status(404).json({ message: 'Resume not found' });
    }

    // Handle both absolute paths (old) and relative paths (new)
    let filePath;
    if (resume.file.startsWith('uploads/')) {
      // Relative path
      filePath = path.join(__dirname, '..', resume.file);
    } else if (resume.file.startsWith('uploads\\')) {
      // Windows-style relative path - extract filename and join with uploads dir
      const filename = resume.file.split(/[/\\]/).pop();
      filePath = path.join(__dirname, '..', 'uploads', filename);
    } else if (resume.file.includes('uploads')) {
      // Absolute path containing uploads - this is wrong, convert to relative
      const filename = resume.file.split(/[/\\]/).pop();
      filePath = path.join(__dirname, '..', 'uploads', filename);
    } else {
      // Fallback
      filePath = path.join(__dirname, '..', 'uploads', resume.file);
    }

    if (!fs.existsSync(filePath)) {
      console.error(`Resume file not found at: ${filePath}`);
      console.error(`Resume file path in DB: ${resume.file}`);
      return res.status(404).json({ message: 'Resume file not found' });
    }

    res.download(filePath, `${resume.name}.pdf`);
  } catch (error) {
    console.error('Error downloading resume:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   DELETE /api/students/resumes/:resumeId
// @desc    Delete own resume
// @access  Private (Student)
router.delete('/resumes/:resumeId', authorize('student'), async (req, res) => {
  try {
    const student = await Student.findOne({ userId: req.user._id });
    if (!student) {
      return res.status(404).json({ message: 'Student profile not found' });
    }

    const resume = student.resumes.find(r => r._id.toString() === req.params.resumeId);
    if (!resume) {
      return res.status(404).json({ message: 'Resume not found' });
    }

    // Delete file if exists
    if (resume.file) {
      const filePath = path.join(__dirname, '..', resume.file);
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
        } catch (fileError) {
          console.error('Error deleting file:', fileError);
          // Continue with deletion even if file deletion fails
        }
      }
    }

    // Remove resume from array
    student.resumes.pull(req.params.resumeId);
    await student.save();
    res.json({ message: 'Resume deleted successfully', student });
  } catch (error) {
    console.error('Delete resume error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ==================== CERTIFICATIONS ROUTES ====================

// @route   POST /api/students/certifications
// @desc    Add a certification (with optional file upload)
// @access  Private (Student)
router.post('/certifications', authorize('student'), upload.single('file'), async (req, res) => {
  try {
    const student = await Student.findOne({ userId: req.user._id });
    if (!student) {
      return res.status(404).json({ message: 'Student profile not found' });
    }

    const certificationData = {
      name: req.body.name,
      issuer: req.body.issuer,
      issueDate: req.body.issueDate ? new Date(req.body.issueDate) : null,
      expiryDate: req.body.expiryDate ? new Date(req.body.expiryDate) : null,
      credentialId: req.body.credentialId,
      credentialUrl: req.body.credentialUrl,
      description: req.body.description,
      skills: req.body.skills ? (Array.isArray(req.body.skills) ? req.body.skills : req.body.skills.split(',').map(s => s.trim())) : []
    };

    // Handle file upload
    if (req.file) {
      const relativePath = `uploads/${path.basename(req.file.path)}`;
      certificationData.file = relativePath;
    }

    student.certifications.push(certificationData);
    await student.save();
    res.json(student);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/students/certifications/:certificationId
// @desc    Update a certification
// @access  Private (Student)
router.put('/certifications/:certificationId', authorize('student'), upload.single('file'), async (req, res) => {
  try {
    const student = await Student.findOne({ userId: req.user._id });
    if (!student) {
      return res.status(404).json({ message: 'Student profile not found' });
    }

    const certification = student.certifications.id(req.params.certificationId);
    if (!certification) {
      return res.status(404).json({ message: 'Certification not found' });
    }

    // Update fields
    if (req.body.name) certification.name = req.body.name;
    if (req.body.issuer !== undefined) certification.issuer = req.body.issuer;
    if (req.body.issueDate) certification.issueDate = new Date(req.body.issueDate);
    if (req.body.expiryDate) certification.expiryDate = req.body.expiryDate ? new Date(req.body.expiryDate) : null;
    if (req.body.credentialId !== undefined) certification.credentialId = req.body.credentialId;
    if (req.body.credentialUrl !== undefined) certification.credentialUrl = req.body.credentialUrl;
    if (req.body.description !== undefined) certification.description = req.body.description;
    if (req.body.skills) {
      certification.skills = Array.isArray(req.body.skills) 
        ? req.body.skills 
        : req.body.skills.split(',').map(s => s.trim());
    }

    // Handle file upload (update existing file)
    if (req.file) {
      // Delete old file if exists
      if (certification.file) {
        const oldFilePath = path.join(__dirname, '..', certification.file);
        if (fs.existsSync(oldFilePath)) {
          fs.unlinkSync(oldFilePath);
        }
      }
      const relativePath = `uploads/${path.basename(req.file.path)}`;
      certification.file = relativePath;
    }

    await student.save();
    res.json(student);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   DELETE /api/students/certifications/:certificationId
// @desc    Delete a certification
// @access  Private (Student)
router.delete('/certifications/:certificationId', authorize('student'), async (req, res) => {
  try {
    const student = await Student.findOne({ userId: req.user._id });
    if (!student) {
      return res.status(404).json({ message: 'Student profile not found' });
    }

    const certification = student.certifications.id(req.params.certificationId);
    if (!certification) {
      return res.status(404).json({ message: 'Certification not found' });
    }

    // Delete file if exists
    if (certification.file) {
      const filePath = path.join(__dirname, '..', certification.file);
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
        } catch (fileError) {
          console.error('Error deleting file:', fileError);
          // Continue with deletion even if file deletion fails
        }
      }
    }

    student.certifications.pull(req.params.certificationId);
    await student.save();
    res.json(student);
  } catch (error) {
    console.error('Delete certification error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/students/certifications/:certificationId/download
// @desc    Download certification file
// @access  Private (Student)
router.get('/certifications/:certificationId/download', authorize('student'), async (req, res) => {
  try {
    const student = await Student.findOne({ userId: req.user._id });
    if (!student) {
      return res.status(404).json({ message: 'Student profile not found' });
    }

    const certification = student.certifications.id(req.params.certificationId);
    if (!certification || !certification.file) {
      return res.status(404).json({ message: 'Certification file not found' });
    }

    const filePath = path.join(__dirname, '..', certification.file);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'File not found on server' });
    }

    res.download(filePath, `${certification.name}-certificate.pdf`);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/students
// @desc    Get all students (Admin only)
// @access  Private (Admin)
router.get('/', protect, authorize('admin'), async (req, res) => {
  try {
    const students = await Student.find()
      .populate('userId', 'email')
      .sort({ 'academicInfo.rollNumber': 1 });
    res.json(students);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/students/:id
// @desc    Get student by ID
// @access  Private (Admin)
router.get('/:id', authorize('admin'), async (req, res) => {
  try {
    const student = await Student.findById(req.params.id).populate('userId', 'email');
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    res.json(student);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/students/coding-stats
// @desc    Get coding platform statistics for current student
// @access  Private (Student)
router.get('/coding-stats', authorize('student'), async (req, res) => {
  try {
    const student = await Student.findOne({ userId: req.user._id });
    if (!student) {
      return res.status(404).json({ message: 'Student profile not found' });
    }

    // Extract handles from personalInfo
    const handles = {
      leetcode: student.personalInfo?.leetcode ? extractUsername(student.personalInfo.leetcode, 'leetcode') : null,
      hackerrank: student.personalInfo?.hackerrank ? extractUsername(student.personalInfo.hackerrank, 'hackerrank') : null,
      codechef: student.personalInfo?.codechef ? extractUsername(student.personalInfo.codechef, 'codechef') : null,
      codeforces: student.personalInfo?.codeforces ? extractUsername(student.personalInfo.codeforces, 'codeforces') : null,
      geeksforgeeks: student.personalInfo?.geeksforgeeks ? extractUsername(student.personalInfo.geeksforgeeks, 'geeksforgeeks') : null
    };

    // Fetch coding stats
    const codingStats = await fetchCodingStats(handles);

    // Generate mock rating history for charts (in real app, this would come from historical data)
    const generateRatingHistory = (platform, currentRating) => {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const history = [];
      const now = new Date();
      
      for (let i = 11; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const baseRating = currentRating ? currentRating - (Math.random() * 200 + 100) : 1200;
        const variation = Math.random() * 100 - 50;
        history.push({
          month: months[date.getMonth()],
          rating: Math.max(0, Math.round(baseRating + variation + (11 - i) * 20))
        });
      }
      return history;
    };

    // Add rating history to each platform
    if (codingStats.codechef) {
      codingStats.codechef.ratingHistory = generateRatingHistory('codechef', codingStats.codechef.contestRating);
      codingStats.codechef.highestRating = codingStats.codechef.contestRating ? 
        Math.max(...codingStats.codechef.ratingHistory.map(r => r.rating)) : null;
      codingStats.codechef.ratingChange = codingStats.codechef.ratingHistory.length > 1 ? 
        codingStats.codechef.ratingHistory[codingStats.codechef.ratingHistory.length - 1].rating - 
        codingStats.codechef.ratingHistory[0].rating : 0;
    }
    if (codingStats.codeforces) {
      codingStats.codeforces.ratingHistory = generateRatingHistory('codeforces', codingStats.codeforces.contestRating);
      codingStats.codeforces.highestRating = codingStats.codeforces.contestRating || 
        Math.max(...codingStats.codeforces.ratingHistory.map(r => r.rating));
      codingStats.codeforces.ratingChange = codingStats.codeforces.ratingHistory.length > 1 ? 
        codingStats.codeforces.ratingHistory[codingStats.codeforces.ratingHistory.length - 1].rating - 
        codingStats.codeforces.ratingHistory[0].rating : 0;
    }
    if (codingStats.leetcode) {
      codingStats.leetcode.ratingHistory = generateRatingHistory('leetcode', codingStats.leetcode.contestRating);
      codingStats.leetcode.highestRating = codingStats.leetcode.contestRating || 
        Math.max(...codingStats.leetcode.ratingHistory.map(r => r.rating));
      codingStats.leetcode.ratingChange = codingStats.leetcode.ratingHistory.length > 1 ? 
        codingStats.leetcode.ratingHistory[codingStats.leetcode.ratingHistory.length - 1].rating - 
        codingStats.leetcode.ratingHistory[0].rating : 0;
    }

    // Calculate overall score and global rank (mock data for now)
    const overallScore = calculateOverallScore(codingStats);
    const globalRank = Math.floor(Math.random() * 5000) + 1;

    // Generate global rankings history
    const globalRankingsHistory = generateRatingHistory('global', overallScore);

    // Generate score distribution
    const scoreDistribution = [
      { name: 'HackerRank', value: codingStats.hackerrank?.points || 0, color: '#16a34a' },
      { name: 'InterviewBit', value: 0, color: '#3b82f6' },
      { name: 'LeetCode', value: codingStats.leetcode?.points || codingStats.leetcode?.problemsSolved * 10 || 0, color: '#f89f1b' },
      { name: 'Codeforces', value: codingStats.codeforces?.points || codingStats.codeforces?.contestRating || 0, color: '#3182ce' },
      { name: 'CodeChef', value: codingStats.codechef?.points || codingStats.codechef?.contestRating || 0, color: '#8b5a2b' },
      { name: 'GitHub', value: 0, color: '#6b7280' },
      { name: 'SPOJ', value: 0, color: '#8b5cf6' }
    ].filter(item => item.value > 0);

    res.json({
      codingStats,
      overallScore,
      globalRank,
      globalRankingsHistory,
      scoreDistribution
    });
  } catch (error) {
    console.error('Error fetching coding stats:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Helper function to extract username from URL
function extractUsername(url, platform) {
  if (!url) return null;
  
  // Remove protocol and www
  url = url.replace(/^https?:\/\/(www\.)?/, '');
  
  const patterns = {
    leetcode: /leetcode\.com\/([^\/\?]+)/,
    hackerrank: /hackerrank\.com\/([^\/\?]+)/,
    codechef: /codechef\.com\/users\/([^\/\?]+)/,
    codeforces: /codeforces\.com\/profile\/([^\/\?]+)/,
    geeksforgeeks: /geeksforgeeks\.org\/user\/([^\/\?]+)/
  };
  
  const match = url.match(patterns[platform]);
  return match ? match[1] : url.split('/').pop().split('?')[0];
}

// Helper function to calculate overall score
function calculateOverallScore(codingStats) {
  let score = 0;
  
  if (codingStats.leetcode) {
    score += (codingStats.leetcode.contestRating || 0) * 0.3;
    score += (codingStats.leetcode.problemsSolved || 0) * 2;
  }
  if (codingStats.codeforces) {
    score += (codingStats.codeforces.contestRating || 0) * 0.4;
  }
  if (codingStats.codechef) {
    score += (codingStats.codechef.contestRating || 0) * 0.2;
  }
  if (codingStats.hackerrank) {
    score += (codingStats.hackerrank.points || 0) * 0.1;
  }
  
  return Math.round(score);
}

// @route   GET /api/students/leaderboard
// @desc    Get ranked list of all students with overall scores
// @access  Public (for now, can be restricted later)
router.get('/leaderboard', async (req, res) => {
  try {
    // Get all students
    const students = await Student.find()
      .select('personalInfo academicInfo userId')
      .populate('userId', 'email')
      .lean();

    // Get all leaderboard profiles for these users
    const userIds = students.map(s => s.userId?._id || s.userId);
    const leaderboardProfiles = await LeaderboardProfile.find({
      userId: { $in: userIds }
    }).lean();

    // Create a map for quick lookup
    const profileMap = new Map();
    leaderboardProfiles.forEach(profile => {
      profileMap.set(profile.userId.toString(), profile);
    });

    // Calculate scores for each student using cached data or calculate on the fly
    const studentsWithScores = students.map((student) => {
      const userId = student.userId?._id || student.userId;
      const profile = profileMap.get(userId?.toString());
      
      // Use cached coding stats from leaderboard profile if available
      let overallScore = 0;
      if (profile?.metadata?.codingStats) {
        overallScore = calculateOverallScore(profile.metadata.codingStats);
      } else if (profile?.points?.total) {
        // Fallback to total points if coding stats not available
        overallScore = profile.points.total;
      } else {
        // If no cached data, calculate from handles (but don't fetch - too slow)
        // Just return 0 for now, can be synced later
        overallScore = 0;
      }

      return {
        studentId: student._id.toString(),
        username: `${student.personalInfo?.firstName || ''} ${student.personalInfo?.lastName || ''}`.trim() || student.userId?.email || 'Unknown',
        email: student.userId?.email || '',
        rollNumber: student.academicInfo?.rollNumber || '',
        department: student.academicInfo?.department || '',
        overallScore: overallScore,
        avatarUrl: student.personalInfo?.profilePhoto || profile?.avatarUrl || null
      };
    });

    // Sort by overall score descending and assign ranks
    studentsWithScores.sort((a, b) => b.overallScore - a.overallScore);
    
    const rankedStudents = studentsWithScores.map((student, index) => ({
      ...student,
      rank: index + 1,
      rankChange: null // Can be calculated later with historical data
    }));

    res.json({
      students: rankedStudents
    });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/students/:studentId/coding-stats
// @desc    Get coding platform statistics for a specific student (public view)
// @access  Public
router.get('/:studentId/coding-stats', async (req, res) => {
  try {
    const student = await Student.findById(req.params.studentId);
    if (!student) {
      return res.status(404).json({ message: 'Student profile not found' });
    }

    // Extract handles from personalInfo
    const handles = {
      leetcode: student.personalInfo?.leetcode ? extractUsername(student.personalInfo.leetcode, 'leetcode') : null,
      hackerrank: student.personalInfo?.hackerrank ? extractUsername(student.personalInfo.hackerrank, 'hackerrank') : null,
      codechef: student.personalInfo?.codechef ? extractUsername(student.personalInfo.codechef, 'codechef') : null,
      codeforces: student.personalInfo?.codeforces ? extractUsername(student.personalInfo.codeforces, 'codeforces') : null,
      geeksforgeeks: student.personalInfo?.geeksforgeeks ? extractUsername(student.personalInfo.geeksforgeeks, 'geeksforgeeks') : null
    };

    // Fetch coding stats
    const codingStats = await fetchCodingStats(handles);

    // Generate rating history
    const generateRatingHistory = (platform, currentRating) => {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const history = [];
      const now = new Date();
      
      for (let i = 11; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const baseRating = currentRating ? currentRating - (Math.random() * 200 + 100) : 1200;
        const variation = Math.random() * 100 - 50;
        history.push({
          month: months[date.getMonth()],
          rating: Math.max(0, Math.round(baseRating + variation + (11 - i) * 20))
        });
      }
      return history;
    };

    // Add rating history to each platform
    if (codingStats.codechef) {
      codingStats.codechef.ratingHistory = generateRatingHistory('codechef', codingStats.codechef.contestRating);
      codingStats.codechef.highestRating = codingStats.codechef.contestRating ? 
        Math.max(...codingStats.codechef.ratingHistory.map(r => r.rating)) : null;
      codingStats.codechef.ratingChange = codingStats.codechef.ratingHistory.length > 1 ? 
        codingStats.codechef.ratingHistory[codingStats.codechef.ratingHistory.length - 1].rating - 
        codingStats.codechef.ratingHistory[0].rating : 0;
    }
    if (codingStats.codeforces) {
      codingStats.codeforces.ratingHistory = generateRatingHistory('codeforces', codingStats.codeforces.contestRating);
      codingStats.codeforces.highestRating = codingStats.codeforces.contestRating || 
        Math.max(...codingStats.codeforces.ratingHistory.map(r => r.rating));
      codingStats.codeforces.ratingChange = codingStats.codeforces.ratingHistory.length > 1 ? 
        codingStats.codeforces.ratingHistory[codingStats.codeforces.ratingHistory.length - 1].rating - 
        codingStats.codeforces.ratingHistory[0].rating : 0;
    }
    if (codingStats.leetcode) {
      codingStats.leetcode.ratingHistory = generateRatingHistory('leetcode', codingStats.leetcode.contestRating);
      codingStats.leetcode.highestRating = codingStats.leetcode.contestRating || 
        Math.max(...codingStats.leetcode.ratingHistory.map(r => r.rating));
      codingStats.leetcode.ratingChange = codingStats.leetcode.ratingHistory.length > 1 ? 
        codingStats.leetcode.ratingHistory[codingStats.leetcode.ratingHistory.length - 1].rating - 
        codingStats.leetcode.ratingHistory[0].rating : 0;
    }

    // Calculate overall score and mock rank
    const overallScore = calculateOverallScore(codingStats);
    const globalRank = Math.floor(Math.random() * 5000) + 1;

    // Generate global rankings history
    const globalRankingsHistory = generateRatingHistory('global', overallScore);

    // Generate score distribution
    const scoreDistribution = [
      { name: 'HackerRank', value: codingStats.hackerrank?.points || 0, color: '#16a34a' },
      { name: 'InterviewBit', value: 0, color: '#3b82f6' },
      { name: 'LeetCode', value: codingStats.leetcode?.points || codingStats.leetcode?.problemsSolved * 10 || 0, color: '#f89f1b' },
      { name: 'Codeforces', value: codingStats.codeforces?.points || codingStats.codeforces?.contestRating || 0, color: '#3182ce' },
      { name: 'CodeChef', value: codingStats.codechef?.points || codingStats.codechef?.contestRating || 0, color: '#8b5a2b' },
      { name: 'GitHub', value: 0, color: '#6b7280' },
      { name: 'SPOJ', value: 0, color: '#8b5cf6' }
    ].filter(item => item.value > 0);

    // Get student info for the profile
    const studentInfo = {
      firstName: student.personalInfo?.firstName || '',
      lastName: student.personalInfo?.lastName || '',
      department: student.academicInfo?.department || '',
      year: student.academicInfo?.year || null,
      rollNumber: student.academicInfo?.rollNumber || '',
      profilePhoto: student.personalInfo?.profilePhoto || null
    };

    res.json({
      studentInfo,
      codingStats,
      overallScore,
      globalRank,
      globalRankingsHistory,
      scoreDistribution
    });
  } catch (error) {
    console.error('Error fetching student coding stats:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;

