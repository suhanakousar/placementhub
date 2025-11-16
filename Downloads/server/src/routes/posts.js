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

    // Get posts that are active and either don't require verification or student is verified
    const now = new Date();
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
        }
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

