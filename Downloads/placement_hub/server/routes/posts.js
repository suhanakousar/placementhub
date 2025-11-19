const express = require('express');
const Post = require('../models/Post');
const Student = require('../models/Student');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/posts
// @desc    Get posts visible to student (based on verification status)
// @access  Private (Student)
router.get('/', protect, authorize('student'), async (req, res) => {
  try {
    const student = await Student.findOne({ userId: req.user._id });
    if (!student) {
      return res.status(404).json({ message: 'Student profile not found' });
    }

    const isVerified = student.placementStatus?.resumeVerified || false;
    const studentDepartment = student.academicInfo?.department;
    const studentYear = student.academicInfo?.year;
    const studentSpecialization = student.academicInfo?.specialization;

    // Get posts that are active and either don't require verification or student is verified
    const now = new Date();
    
    // Build target audience filter
    // A post is visible if:
    // 1. It has no target filters (show to all), OR
    // 2. All specified target filters match the student
    const targetAudienceFilter = {
      $or: [
        // No target filters - show to all
        {
          $and: [
            { $or: [{ targetDepartment: null }, { targetDepartment: '' }, { targetDepartment: { $exists: false } }] },
            { $or: [{ targetYear: null }, { targetYear: { $exists: false } }] },
            { $or: [{ targetSpecialization: null }, { targetSpecialization: '' }, { targetSpecialization: { $exists: false } }] }
          ]
        },
        // Has target filters - must match all specified ones
        {
          $and: [
            // If targetDepartment is set, student must match
            {
              $or: [
                { $or: [{ targetDepartment: null }, { targetDepartment: '' }, { targetDepartment: { $exists: false } }] },
                ...(studentDepartment ? [{ targetDepartment: studentDepartment }] : [])
              ]
            },
            // If targetYear is set, student must match
            {
              $or: [
                { $or: [{ targetYear: null }, { targetYear: { $exists: false } }] },
                ...(studentYear ? [{ targetYear: studentYear }] : [])
              ]
            },
            // If targetSpecialization is set, student must match
            {
              $or: [
                { $or: [{ targetSpecialization: null }, { targetSpecialization: '' }, { targetSpecialization: { $exists: false } }] },
                ...(studentSpecialization ? [{ targetSpecialization: studentSpecialization }] : [])
              ]
            }
          ]
        }
      ]
    };

    let query = {
      isActive: true,
      $and: [
        {
          $or: [
            { requiresVerification: false },
            ...(isVerified ? [{ requiresVerification: true }] : [])
          ]
        },
        {
          $or: [
            { expiryDate: null },
            { expiryDate: { $gte: now } }
          ]
        },
        targetAudienceFilter
      ]
    };

    const posts = await Post.find(query)
      .populate({
        path: 'createdBy',
        select: 'personalInfo',
        model: 'Admin'
      })
      .sort({ createdAt: -1 });

    res.json({
      posts,
      isVerified,
      canViewAll: isVerified
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/posts/:id
// @desc    Get a specific post
// @access  Private (Student)
router.get('/:id', protect, authorize('student'), async (req, res) => {
  try {
    const student = await Student.findOne({ userId: req.user._id });
    if (!student) {
      return res.status(404).json({ message: 'Student profile not found' });
    }

    const post = await Post.findById(req.params.id).populate({
      path: 'createdBy',
      select: 'personalInfo',
      model: 'Admin'
    });
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const isVerified = student.placementStatus?.resumeVerified || false;

    // Check if student can view this post
    if (post.requiresVerification && !isVerified) {
      return res.status(403).json({ 
        message: 'You need to be verified to view this post',
        requiresVerification: true
      });
    }

    if (!post.isActive) {
      return res.status(404).json({ message: 'Post is not active' });
    }

    res.json(post);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;

