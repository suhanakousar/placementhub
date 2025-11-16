const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Student = require('../models/Student');
const { protect, authorize } = require('../middleware/auth');

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

    student.resumes.push({
      name: req.body.name || 'Resume',
      file: req.file.path,
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

    const resume = student.resumes.id(req.params.resumeId);
    if (!resume || !resume.file) {
      return res.status(404).json({ message: 'Resume not found' });
    }

    const filePath = path.join(__dirname, '..', resume.file);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'Resume file not found' });
    }

    res.download(filePath, `${resume.name}.pdf`);
  } catch (error) {
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
router.get('/', authorize('admin'), async (req, res) => {
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

module.exports = router;

