const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const Student = require('../models/Student');
const PlacementDrive = require('../models/PlacementDrive');
const Post = require('../models/Post');
const Notification = require('../models/Notification');
const User = require('../models/User');
const Admin = require('../models/Admin');
const { protect, authorize } = require('../middleware/auth');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('Created uploads directory:', uploadsDir);
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
  },
  fileFilter: (req, file, cb) => {
    // Accept any file type for now
    cb(null, true);
  }
});

const router = express.Router();

// All routes require admin authentication
router.use(protect);
router.use(authorize('admin'));

// Debug route for resume downloads
router.get('/students/:id/resume/:resumeId/debug', async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    const resume = student?.resumes?.find(r => r._id.toString() === req.params.resumeId);

    return res.json({
      ok: true,
      hit: true,
      params: req.params,
      studentFound: !!student,
      resumeFound: !!resume,
      resumeData: resume ? {
        id: resume._id,
        name: resume.name,
        file: resume.file,
        verified: resume.verified
      } : null,
      user: req.user ? { id: req.user._id, role: req.user.role } : null
    });
  } catch (error) {
    return res.json({
      ok: false,
      error: error.message,
      params: req.params,
      user: req.user ? { id: req.user._id, role: req.user.role } : null
    });
  }
});

// @route   GET /api/admin/statistics
// @desc    Get dashboard statistics
// @access  Private (Admin)
router.get('/statistics', async (req, res) => {
  try {
    const totalStudents = await Student.countDocuments();
    const verifiedResumes = await Student.countDocuments({ 'placementStatus.resumeVerified': true });
    const unverifiedResumes = totalStudents - verifiedResumes;

    // Get department-wise total students count
    const departmentStats = await Student.aggregate([
      {
        $group: {
          _id: '$academicInfo.department',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    const departmentWiseStudents = departmentStats.map(stat => ({
      department: stat._id || 'Unknown',
      count: stat.count
    }));

    // Get top 5 students by CGPA
    const topStudents = await Student.find()
      .populate('userId', 'email')
      .sort({ 'academicInfo.cgpa': -1 })
      .limit(5)
      .select('personalInfo academicInfo placementStatus');

    // Get upcoming placement drives
    const upcomingDrives = await PlacementDrive.find({
      applicationDeadline: { $gte: new Date() },
      status: 'open'
    })
      .sort({ applicationDeadline: 1 })
      .limit(5)
      .select('companyName role package applicationDeadline status');

    res.json({
      totalStudents,
      verifiedResumes,
      unverifiedResumes,
      departmentWiseStudents,
      topStudents,
      upcomingDrives: upcomingDrives || []
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/admin/students/:id/verify
// @desc    Verify student profile/resume
// @access  Private (Admin)
router.put('/students/:id/verify', async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    const { verified, resumeId, feedback } = req.body;

    // If resumeId is provided, verify specific resume
    if (resumeId) {
      const resume = student.resumes.id(resumeId);
      if (resume) {
        resume.verified = verified !== false;
        resume.feedback = feedback || '';
        if (verified !== false) {
          student.placementStatus.resumeVerified = true;
        }
      }
    } else {
      // Verify entire student profile
      student.placementStatus.resumeVerified = verified !== false;
      student.placementStatus.profileCompleted = true;
      
      // If verifying, mark all resumes as verified
      if (verified !== false) {
        student.resumes.forEach(resume => {
          resume.verified = true;
        });
      }
    }

    await student.save();

    // Create notification
    await Notification.create({
      recipientId: student.userId,
      recipientType: 'Student',
      title: verified !== false ? 'Profile Verified' : 'Verification Rejected',
      message: verified !== false 
        ? 'Your profile has been verified. You can now access all placement drives and opportunities.' 
        : (feedback || 'Your profile verification was rejected. Please update your information.'),
      type: verified !== false ? 'success' : 'warning',
      link: '/student/dashboard'
    });

    res.json({ 
      success: true, 
      student,
      message: verified !== false ? 'Student verified successfully' : 'Student verification removed'
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/admin/students/:id/resume/:resumeId
// @desc    Download student resume
// @access  Private (Admin)
router.get('/students/:id/resume/:resumeId', async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
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
      return res.status(404).json({ message: 'Resume file not found' });
    }
    res.download(filePath, `${student.personalInfo?.firstName}_${student.personalInfo?.lastName}_${resume.name}.pdf`);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/admin/students/:id/resume
// @desc    Download student's latest resume
// @access  Private (Admin)
router.get('/students/:id/resume', async (req, res) => {
  try {
    const student = await Student.findById(req.params.id).populate('userId', 'email');
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    let resume = student.resumes.find(r => r.verified) || student.resumes[student.resumes.length - 1];
    if (!resume || !resume.file) {
      return res.status(404).json({ message: 'No resume found' });
    }

    // Handle both absolute paths (old) and relative paths (new)
    let filePath;
    if (resume.file.startsWith('uploads/')) {
      // Relative path
      filePath = path.join(__dirname, '..', resume.file);
    } else if (resume.file.startsWith('uploads\\')) {
      // Windows-style relative path
      filePath = path.join(__dirname, '..', resume.file.replace(/\\/g, '/'));
    } else if (resume.file.includes('uploads')) {
      // Absolute path containing uploads - this is wrong, convert to relative
      const filename = resume.file.split(/[/\\]/).pop();
      filePath = path.join(__dirname, '..', 'uploads', filename);
    } else {
      // Fallback
      filePath = path.join(__dirname, '..', 'uploads', resume.file);
    }

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'Resume file not found' });
    }
    res.download(filePath, `${student.personalInfo?.firstName}_${student.personalInfo?.lastName}_Resume.pdf`);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/admin/students/export
// @desc    Export student data
// @access  Private (Admin)
router.get('/students/export', async (req, res) => {
  try {
    const { department, year, verified, format = 'csv' } = req.query;
    let query = {};
    if (department) query['academicInfo.department'] = department;
    if (year) query['academicInfo.year'] = parseInt(year);
    if (verified === 'verified') query['placementStatus.resumeVerified'] = true;
    if (verified === 'unverified') query['placementStatus.resumeVerified'] = false;

    const students = await Student.find(query).populate('userId', 'email').sort({ 'academicInfo.rollNumber': 1 });

    if (format === 'csv') {
      let csv = 'Name,Email,Roll Number,Department,Year,CGPA,Phone,LinkedIn,GitHub,Resume Verified,Projects,Internships,Hackathons\n';
      students.forEach(student => {
        const name = `"${student.personalInfo?.firstName || ''} ${student.personalInfo?.lastName || ''}"`.trim();
        const email = student.userId?.email || 'N/A';
        const rollNumber = student.academicInfo?.rollNumber || 'N/A';
        const dept = student.academicInfo?.department || 'N/A';
        const year = student.academicInfo?.year || 'N/A';
        const cgpa = student.academicInfo?.cgpa || 'N/A';
        const phone = student.personalInfo?.phone || 'N/A';
        const linkedin = student.personalInfo?.linkedin || 'N/A';
        const github = student.personalInfo?.github || 'N/A';
        const resumeVerified = student.placementStatus?.resumeVerified ? 'Yes' : 'No';
        const projects = student.projects?.length || 0;
        const internships = student.internships?.length || 0;
        const hackathons = student.hackathons?.length || 0;
        csv += `${name},"${email}","${rollNumber}","${dept}","${year}","${cgpa}","${phone}","${linkedin}","${github}","${resumeVerified}","${projects}","${internships}","${hackathons}"\n`;
      });
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=students_export_${Date.now()}.csv`);
      res.send(csv);
    } else {
      const studentData = students.map(student => ({
        name: `${student.personalInfo?.firstName || ''} ${student.personalInfo?.lastName || ''}`.trim(),
        email: student.userId?.email || 'N/A',
        rollNumber: student.academicInfo?.rollNumber || 'N/A',
        department: student.academicInfo?.department || 'N/A',
        year: student.academicInfo?.year || 'N/A',
        cgpa: student.academicInfo?.cgpa || 'N/A',
        phone: student.personalInfo?.phone || 'N/A',
        linkedin: student.personalInfo?.linkedin || 'N/A',
        github: student.personalInfo?.github || 'N/A',
        resumeVerified: student.placementStatus?.resumeVerified || false,
        projects: student.projects?.length || 0,
        internships: student.internships?.length || 0,
        hackathons: student.hackathons?.length || 0,
        skills: student.skills?.map(s => s.name).join(', ') || 'N/A'
      }));
      res.json(studentData);
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/admin/posts
// @desc    Create a new post (drive, learning plan, announcement)
// @access  Private (Admin)
router.post('/posts', async (req, res, next) => {
  // Handle file uploads with multer
  const multerMiddleware = upload.array('attachments', 5);
  
  multerMiddleware(req, res, async (err) => {
    if (err) {
      console.error('Multer error:', err);
      return res.status(400).json({ 
        message: 'File upload error', 
        error: err.message,
        code: err.code 
      });
    }

    // Process the request after multer finishes
    try {
      console.log('=== POST /api/admin/posts ===');
      console.log('Request received at:', new Date().toISOString());
      console.log('Body keys:', Object.keys(req.body || {}));
      console.log('Body values:', Object.keys(req.body || {}).reduce((acc, key) => {
        const value = req.body[key];
        if (typeof value === 'string' && value.length > 100) {
          acc[key] = value.substring(0, 100) + '...';
        } else {
          acc[key] = value;
        }
        return acc;
      }, {}));
      console.log('Files count:', req.files ? req.files.length : 0);
      console.log('Files:', req.files ? req.files.map(f => ({ name: f.originalname, size: f.size, path: f.path })) : 'No files');
      console.log('User:', req.user ? { id: req.user._id, email: req.user.email, role: req.user.role } : 'NO USER');
      
      // IMPORTANT: Check if attachments came through req.body (should not happen, but handle it)
      if (req.body.attachments) {
        console.warn('WARNING: attachments found in req.body! This should not happen with multer.');
        console.warn('req.body.attachments type:', typeof req.body.attachments);
        console.warn('req.body.attachments value:', req.body.attachments);
        // Remove it to avoid confusion
        delete req.body.attachments;
      }

      // Check authentication
      if (!req.user || !req.user._id) {
        console.error('Authentication failed - no user');
        return res.status(401).json({ message: 'Not authenticated' });
      }

      // Validate required fields
      if (!req.body || !req.body.title || !req.body.content || !req.body.type) {
        console.error('Validation failed - missing fields');
        return res.status(400).json({ 
          message: 'Missing required fields: title, content, type',
          received: {
            hasTitle: !!req.body?.title,
            hasContent: !!req.body?.content,
            hasType: !!req.body?.type
          }
        });
      }

      const title = String(req.body.title).trim();
      const content = String(req.body.content).trim();
      const type = String(req.body.type).trim();

      console.log('Fields validated:', { title: title.substring(0, 30), type });

      // Get or create admin
      let admin = await Admin.findOne({ userId: req.user._id });
      if (!admin) {
        console.log('Creating admin profile...');
        const emailParts = req.user.email ? req.user.email.split('@')[0] : 'admin';
        admin = await Admin.create({
          userId: req.user._id,
          personalInfo: {
            firstName: emailParts || 'Admin',
            lastName: 'User'
          }
        });
        console.log('Admin created:', admin._id);
      } else {
        console.log('Admin found:', admin._id);
      }

      // Process files - ensure proper format for schema
      const attachments = [];
      if (req.files && Array.isArray(req.files) && req.files.length > 0) {
        console.log('Processing files:', req.files.length);
        for (const file of req.files) {
          if (!file || !file.path) {
            console.warn('Skipping invalid file:', file);
            continue;
          }
          
          try {
            // File is already saved by multer to uploadsDir
            // We need to store the path relative to the server root for the static route
            // The static route is /uploads, so we need to store "uploads/filename"
            const filename = path.basename(file.path);
            const relativePath = `uploads/${filename}`;
            
            console.log('File saved:', {
              originalname: file.originalname,
              savedPath: file.path,
              filename: filename,
              relativePath: relativePath,
              size: file.size
            });
            
            // Verify file exists
            if (!fs.existsSync(file.path)) {
              console.error('File does not exist at path:', file.path);
              continue;
            }
            
            const attachment = {
              name: String(file.originalname || 'attachment'),
              file: String(relativePath), // Store as "uploads/filename" for static route
              type: String(file.mimetype || 'application/octet-stream')
            };
            
            // Validate all fields are strings
            if (!attachment.name || !attachment.file || !attachment.type) {
              console.warn('Skipping attachment with missing fields:', attachment);
              continue;
            }
            
            attachments.push(attachment);
            console.log('Attachment added:', attachment);
          } catch (fileError) {
            console.error('Error processing file:', fileError);
            console.error('File error stack:', fileError.stack);
            continue;
          }
        }
      } else {
        console.log('No files in request:', {
          hasFiles: !!req.files,
          filesType: typeof req.files,
          filesLength: req.files ? (Array.isArray(req.files) ? req.files.length : 'not array') : 'null'
        });
      }

      console.log('Attachments processed:', attachments.length);
      if (attachments.length > 0) {
        console.log('All attachments:', JSON.stringify(attachments, null, 2));
      }

      // Parse booleans
      const requiresVerification = req.body.requiresVerification === 'true' || 
                                   req.body.requiresVerification === true;
      const isActive = req.body.isActive !== 'false';

      // Parse tags
      const tags = req.body.tags 
        ? String(req.body.tags).split(',').map(t => t.trim()).filter(t => t)
        : [];

      // Parse expiry
      let expiryDate = null;
      if (req.body.expiryDate) {
        const date = new Date(req.body.expiryDate);
        if (!isNaN(date.getTime())) {
          expiryDate = date;
        }
      }

      console.log('Creating post...');
      console.log('Post data being sent:', {
        title: title.substring(0, 30),
        type,
        category: req.body.category || 'other',
        requiresVerification,
        isActive,
        attachmentsCount: attachments.length,
        tagsCount: tags.length,
        createdBy: admin._id.toString(),
        hasExpiryDate: !!expiryDate
      });

      // Prepare post data - ensure all fields match schema
      const postData = {
        title: String(title).trim(),
        content: String(content).trim(),
        type: String(type).trim(),
        category: String(req.body.category || 'other').trim(),
        requiresVerification: Boolean(requiresVerification),
        isActive: Boolean(isActive),
        createdBy: admin._id, // ObjectId - must be ObjectId, not string
        tags: Array.isArray(tags) ? tags.map(t => String(t).trim()).filter(t => t) : []
      };

      // Add optional fields only if they have values
      if (expiryDate) {
        postData.expiryDate = new Date(expiryDate);
      }
      if (req.body.targetDepartment) {
        postData.targetDepartment = String(req.body.targetDepartment).trim();
      }
      if (req.body.targetYear) {
        postData.targetYear = parseInt(req.body.targetYear);
      }
      if (req.body.targetSpecialization) {
        postData.targetSpecialization = String(req.body.targetSpecialization).trim();
      }

      // Prepare attachments array - MUST be an array of objects, not a string
      // CRITICAL: Ensure attachments is always an array of plain objects
      // Do NOT stringify, do NOT convert to JSON - just use the array directly
      if (attachments.length > 0) {
        // Create a fresh array with plain objects (no Mongoose documents, no strings)
        postData.attachments = attachments.map((att, index) => {
          // Double-check att is an object
          if (typeof att !== 'object' || att === null || Array.isArray(att)) {
            console.error(`Attachment ${index} is not a plain object:`, typeof att, att);
            return null;
          }
          
          // Create a plain JavaScript object (not a Mongoose document)
          const plainObj = {
            name: String(att.name || '').trim(),
            file: String(att.file || '').trim(),
            type: String(att.type || 'application/octet-stream').trim()
          };
          
          // Validate all fields are non-empty
          if (!plainObj.name || !plainObj.file || !plainObj.type) {
            console.error(`Attachment ${index} has empty fields:`, plainObj);
            return null;
          }
          
          return plainObj;
        }).filter(att => att !== null); // Remove null entries
        
        console.log('Processed attachments for postData:', {
          count: postData.attachments.length,
          isArray: Array.isArray(postData.attachments),
          sample: postData.attachments.length > 0 ? postData.attachments[0] : null
        });
      } else {
        // Empty array - explicitly set to empty array, not undefined
        postData.attachments = [];
        console.log('No attachments - set to empty array');
      }

      // Validate attachments format before creating
      console.log('Final post data structure:', {
        title: postData.title.substring(0, 30),
        type: postData.type,
        category: postData.category,
        requiresVerification: postData.requiresVerification,
        isActive: postData.isActive,
        attachmentsCount: postData.attachments.length,
        attachmentsType: Array.isArray(postData.attachments) ? 'array' : typeof postData.attachments,
        tagsCount: postData.tags.length,
        hasExpiryDate: !!postData.expiryDate,
        createdByType: typeof postData.createdBy,
        createdByIsObjectId: postData.createdBy instanceof require('mongoose').Types.ObjectId
      });

      // Validate attachments is an array
      if (!Array.isArray(postData.attachments)) {
        console.error('ERROR: attachments is not an array!', typeof postData.attachments, postData.attachments);
        return res.status(400).json({ 
          message: 'Invalid attachments format',
          error: 'Attachments must be an array'
        });
      }

      // Log first attachment for debugging
      if (postData.attachments.length > 0) {
        console.log('First attachment structure:', {
          isObject: typeof postData.attachments[0] === 'object',
          keys: Object.keys(postData.attachments[0]),
          name: postData.attachments[0].name,
          file: postData.attachments[0].file,
          type: postData.attachments[0].type
        });
      }

      // Create post
      let post;
      try {
        // Ensure postData.attachments is definitely an array before creating
        // Clone the attachments array to avoid any reference issues
        const finalPostData = {
          ...postData,
          attachments: Array.isArray(postData.attachments) 
            ? JSON.parse(JSON.stringify(postData.attachments)) // Deep clone to ensure plain objects
            : []
        };
        
        console.log('Creating post with final data:', {
          title: finalPostData.title.substring(0, 30),
          attachmentsCount: finalPostData.attachments.length,
          attachmentsIsArray: Array.isArray(finalPostData.attachments),
          firstAttachment: finalPostData.attachments.length > 0 ? finalPostData.attachments[0] : null
        });
        
        // Use Post.create() - it handles validation automatically
        post = await Post.create(finalPostData);
        console.log('Post created successfully:', post._id);
      } catch (createError) {
        console.error('=== POST CREATION ERROR ===');
        console.error('Error:', createError.message);
        console.error('Error name:', createError.name);
        if (createError.errors) {
          console.error('Validation errors:', JSON.stringify(createError.errors, null, 2));
          // Log each validation error in detail
          Object.keys(createError.errors).forEach(key => {
            const err = createError.errors[key];
            console.error(`  ${key}:`, err.message, err.value, typeof err.value);
          });
        }
        console.error('Post data that failed:', {
          ...postData,
          content: postData.content.substring(0, 50) + '...',
          attachments: postData.attachments,
          attachmentsType: typeof postData.attachments,
          attachmentsIsArray: Array.isArray(postData.attachments)
        });
        console.error('==========================');
        throw createError;
      }

      // Send notifications (async, don't wait)
      setImmediate(async () => {
        try {
          const query = requiresVerification
            ? { 'placementStatus.resumeVerified': true }
            : {};
          const students = await Student.find(query).select('userId');
          
          for (const student of students) {
            try {
              await Notification.create({
                recipientId: student.userId,
                recipientType: 'Student',
                title: `New ${type === 'drive' ? 'Placement Drive' : type === 'learning_plan' ? 'Learning Plan' : 'Announcement'}`,
                message: title,
                type: 'info',
                link: `/student/posts/${post._id}`
              });
            } catch (err) {
              console.error('Notification error for student:', student._id, err.message);
            }
          }
          console.log(`Notifications sent to ${students.length} students`);
        } catch (err) {
          console.error('Error sending notifications:', err.message);
        }
      });

      // Convert post to plain object
      const postObj = post.toObject ? post.toObject() : {
        _id: post._id,
        title: post.title,
        content: post.content,
        type: post.type,
        category: post.category,
        requiresVerification: post.requiresVerification,
        isActive: post.isActive,
        attachments: post.attachments || [],
        tags: post.tags || [],
        expiryDate: post.expiryDate,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt
      };

      // Add createdBy info
      postObj.createdBy = {
        _id: admin._id,
        personalInfo: admin.personalInfo || { firstName: 'Admin', lastName: 'User' }
      };

      console.log('Sending response...');
      res.status(201).json(postObj);

    } catch (error) {
      console.error('=== ERROR in POST /api/admin/posts ===');
      console.error('Message:', error.message);
      console.error('Name:', error.name);
      console.error('Stack:', error.stack);
      if (error.errors) {
        console.error('Details:', JSON.stringify(error.errors, null, 2));
      }
      console.error('=====================================');

      // Send detailed error response
      const errorResponse = { 
        message: 'Server error',
        error: error.message,
        name: error.name
      };

      // Include more details in development
      if (process.env.NODE_ENV === 'development' || true) {
        errorResponse.stack = error.stack;
        if (error.errors) {
          errorResponse.details = error.errors;
        }
      }

      res.status(500).json(errorResponse);
    }
  });
});

// @route   GET /api/admin/posts
// @desc    Get all posts
// @access  Private (Admin)
router.get('/posts', async (req, res) => {
  try {
    const posts = await Post.find().sort({ createdAt: -1 }).lean();
    
    // Populate createdBy for each post
    const postsWithAdmin = [];
    for (let i = 0; i < posts.length; i++) {
      const post = posts[i];
      
      // Try to populate createdBy
      if (post.createdBy) {
        try {
          const admin = await Admin.findById(post.createdBy).lean();
          if (admin) {
            post.createdBy = {
              _id: admin._id,
              personalInfo: admin.personalInfo || { firstName: 'Admin', lastName: 'User' }
            };
          } else {
            post.createdBy = {
              _id: null,
              personalInfo: { firstName: 'Unknown', lastName: 'Admin' }
            };
          }
        } catch (populateError) {
          console.error(`Error populating admin for post ${post._id}:`, populateError.message);
          post.createdBy = {
            _id: null,
            personalInfo: { firstName: 'Unknown', lastName: 'Admin' }
          };
        }
      } else {
        post.createdBy = {
          _id: null,
          personalInfo: { firstName: 'Unknown', lastName: 'Admin' }
        };
      }
      
      postsWithAdmin.push(post);
    }
    
    res.json(postsWithAdmin);
  } catch (error) {
    console.error('Error in GET /api/admin/posts:', error);
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message
    });
  }
});

// @route   PUT /api/admin/posts/:id
// @desc    Update a post
// @access  Private (Admin)
router.put('/posts/:id', (req, res, next) => {
  upload.array('attachments', 5)(req, res, (err) => {
    if (err) {
      console.error('Multer error in PUT:', err);
      return res.status(400).json({ 
        message: 'File upload error', 
        error: err.message,
        code: err.code 
      });
    }
    next();
  });
}, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Process new attachments if any
    if (req.files && req.files.length > 0) {
      const newAttachments = [];
      for (const file of req.files) {
        const filename = path.basename(file.path);
        const relativePath = `uploads/${filename}`;
        newAttachments.push({
          name: String(file.originalname || 'attachment'),
          file: String(relativePath),
          type: String(file.mimetype || 'application/octet-stream')
        });
      }
      // Append new attachments to existing ones
      post.attachments = [...(post.attachments || []), ...newAttachments];
    }

    // Update other fields
    if (req.body.title) post.title = String(req.body.title);
    if (req.body.content) post.content = String(req.body.content);
    if (req.body.type) post.type = String(req.body.type);
    if (req.body.category) post.category = String(req.body.category);
    if (req.body.requiresVerification !== undefined) {
      post.requiresVerification = req.body.requiresVerification === 'true' || req.body.requiresVerification === true;
    }
    if (req.body.isActive !== undefined) {
      post.isActive = req.body.isActive !== 'false';
    }
    if (req.body.tags) {
      post.tags = String(req.body.tags).split(',').map(t => t.trim()).filter(t => t);
    }
    if (req.body.expiryDate) {
      const date = new Date(req.body.expiryDate);
      if (!isNaN(date.getTime())) {
        post.expiryDate = date;
      }
    }
    if (req.body.targetDepartment !== undefined) {
      post.targetDepartment = req.body.targetDepartment ? String(req.body.targetDepartment).trim() : undefined;
    }
    if (req.body.targetYear !== undefined) {
      post.targetYear = req.body.targetYear ? parseInt(req.body.targetYear) : undefined;
    }
    if (req.body.targetSpecialization !== undefined) {
      post.targetSpecialization = req.body.targetSpecialization ? String(req.body.targetSpecialization).trim() : undefined;
    }

    await post.save();
    
    // Convert to plain object for response
    const postObj = post.toObject ? post.toObject() : post;
    res.json(postObj);
  } catch (error) {
    console.error('Error updating post:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   DELETE /api/admin/posts/:id
// @desc    Delete a post
// @access  Private (Admin)
router.delete('/posts/:id', async (req, res) => {
  try {
    await Post.findByIdAndDelete(req.params.id);
    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   DELETE /api/admin/students/:id
// @desc    Delete a student account and all associated data
// @access  Private (Admin)
router.delete('/students/:id', async (req, res) => {
  try {
    const student = await Student.findById(req.params.id).populate('userId');
    
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Delete all uploaded files
    const filesToDelete = [];
    
    // Collect resume files
    if (student.resumes && student.resumes.length > 0) {
      student.resumes.forEach(resume => {
        if (resume.file) {
          filesToDelete.push(path.join(__dirname, '..', resume.file));
        }
      });
    }

    // Collect certification files
    if (student.certifications && student.certifications.length > 0) {
      student.certifications.forEach(cert => {
        if (cert.file) {
          filesToDelete.push(path.join(__dirname, '..', cert.file));
        }
      });
    }

    // Collect profile photo and cover banner
    if (student.personalInfo?.profilePhoto) {
      filesToDelete.push(path.join(__dirname, '..', student.personalInfo.profilePhoto));
    }
    if (student.personalInfo?.coverBanner) {
      filesToDelete.push(path.join(__dirname, '..', student.personalInfo.coverBanner));
    }

    // Delete all files
    filesToDelete.forEach(filePath => {
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
          console.log('Deleted file:', filePath);
        } catch (fileError) {
          console.error('Error deleting file:', filePath, fileError);
        }
      }
    });

    // Delete associated notifications
    await Notification.deleteMany({ 
      recipientId: student._id, 
      recipientType: 'Student' 
    });

    // Delete user account
    if (student.userId) {
      await User.findByIdAndDelete(student.userId._id);
    }

    // Delete student profile
    await Student.findByIdAndDelete(req.params.id);

    res.json({ 
      success: true,
      message: 'Student account and all associated data deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting student:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Sub-routes
router.use('/meetings', require('./admin/meetings'));
router.use('/tasks', require('./admin/tasks'));
router.use('/emails', require('./admin/emails'));

module.exports = router;
