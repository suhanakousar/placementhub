const express = require('express');
const PlacementDrive = require('../models/PlacementDrive');
const Student = require('../models/Student');
const Notification = require('../models/Notification');
const Admin = require('../models/Admin');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(protect);

// @route   GET /api/drives
// @desc    Get all placement drives
// @access  Private
router.get('/', async (req, res) => {
  try {
    const drives = await PlacementDrive.find()
      .populate('createdBy', 'personalInfo')
      .populate({
        path: 'applications.studentId',
        select: 'personalInfo academicInfo placementStatus userId',
        populate: {
          path: 'userId',
          select: 'email'
        }
      })
      .sort({ createdAt: -1 });
    res.json(drives);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/drives
// @desc    Create a placement drive
// @access  Private (Admin)
router.post('/', authorize('admin'), async (req, res) => {
  try {
    const admin = await Admin.findOne({ userId: req.user._id });
    const drive = await PlacementDrive.create({
      ...req.body,
      createdBy: admin._id
    });

    // Notify eligible students
    const eligibleStudents = await Student.find({
      'academicInfo.cgpa': { $gte: drive.eligibilityCriteria.minCGPA || 0 },
      'academicInfo.department': { $in: drive.eligibilityCriteria.departments || [] }
    });

    for (const student of eligibleStudents) {
      await Notification.create({
        recipientId: student._id,
        recipientType: 'Student',
        title: 'New Placement Drive',
        message: `New placement drive for ${drive.companyName} - ${drive.role}`,
        type: 'info',
        link: `/drives/${drive._id}`
      });
    }

    res.status(201).json(drive);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/drives/:id/apply
// @desc    Apply to a placement drive
// @access  Private (Student)
router.post('/:id/apply', authorize('student'), async (req, res) => {
  try {
    const student = await Student.findOne({ userId: req.user._id });
    const drive = await PlacementDrive.findById(req.params.id);

    if (!drive) {
      return res.status(404).json({ message: 'Drive not found' });
    }

    // Check if already applied
    const alreadyApplied = drive.applications.some(
      app => app.studentId.toString() === student._id.toString()
    );

    if (alreadyApplied) {
      return res.status(400).json({ message: 'Already applied to this drive' });
    }

    drive.applications.push({
      studentId: student._id,
      status: 'applied'
    });

    await drive.save();
    res.json(drive);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;

