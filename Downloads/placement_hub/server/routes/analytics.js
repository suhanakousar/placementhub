const express = require('express');
const Student = require('../models/Student');
const PlacementDrive = require('../models/PlacementDrive');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(protect);

// @route   GET /api/analytics/department-wise
// @desc    Get department-wise placement statistics
// @access  Private (Admin)
router.get('/department-wise', authorize('admin'), async (req, res) => {
  try {
    const students = await Student.find();
    const departmentStats = {};

    students.forEach(student => {
      const dept = student.academicInfo.department;
      if (!departmentStats[dept]) {
        departmentStats[dept] = {
          total: 0,
          placed: 0,
          percentage: 0
        };
      }
      departmentStats[dept].total++;
      if (student.placementStatus.selected) {
        departmentStats[dept].placed++;
      }
    });

    Object.keys(departmentStats).forEach(dept => {
      departmentStats[dept].percentage = 
        (departmentStats[dept].placed / departmentStats[dept].total) * 100;
    });

    res.json(departmentStats);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/analytics/student/profile
// @desc    Get current student analytics
// @access  Private (Student)
router.get('/student/profile', authorize('student'), async (req, res) => {
  try {
    const student = await Student.findOne({ userId: req.user._id });
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    const analytics = {
      profileCompletion: student.profileCompletion?.percentage || 0,
      projectsCount: student.projects?.length || 0,
      internshipsCount: student.internships?.length || 0,
      hackathonsCount: student.hackathons?.length || 0,
      skillsCount: student.skills?.length || 0,
      verifiedSkillsCount: student.skills?.filter(s => s.verified).length || 0,
      cgpa: student.academicInfo?.cgpa || 0,
      resumeVerified: student.placementStatus?.resumeVerified || false,
      certificationsCount: student.certifications?.length || 0
    };

    res.json(analytics);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/analytics/student/:id
// @desc    Get student analytics
// @access  Private (Student)
router.get('/student/:id', authorize('student'), async (req, res) => {
  try {
    const student = await Student.findOne({ userId: req.user._id });
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    const analytics = {
      profileCompletion: student.profileCompletion?.percentage || 0,
      projectsCount: student.projects?.length || 0,
      internshipsCount: student.internships?.length || 0,
      hackathonsCount: student.hackathons?.length || 0,
      skillsCount: student.skills?.length || 0,
      verifiedSkillsCount: student.skills?.filter(s => s.verified).length || 0,
      cgpa: student.academicInfo?.cgpa || 0
    };

    res.json(analytics);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;

