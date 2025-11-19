const express = require('express');
const Task = require('../models/Task');
const Student = require('../models/Student');
const Admin = require('../models/Admin');
const { protect, authorize } = require('../middleware/auth');
const { getTaskStats } = require('../utils/taskUtils');

const router = express.Router();

// @route   GET /api/tasks
// @desc    Get all tasks for logged-in student
// @access  Private (Student)
router.get('/', protect, authorize('student'), async (req, res) => {
  try {
    const student = await Student.findOne({ userId: req.user._id });
    if (!student) {
      return res.status(404).json({ message: 'Student profile not found' });
    }

    const { status, priority, overdue } = req.query;
    let query = { studentId: student._id };

    if (status) {
      query.status = status;
    }
    if (priority) {
      query.priority = priority;
    }
    if (overdue === 'true') {
      query.dueDate = { $lt: new Date() };
      query.status = { $ne: 'done' };
    }

    const tasks = await Task.find(query)
      .populate('createdBy', 'personalInfo')
      .populate('linkedMeetingId', 'title')
      .sort({ dueDate: 1, priority: -1 });

    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/tasks/stats
// @desc    Get task statistics for student
// @access  Private (Student)
router.get('/stats', protect, authorize('student'), async (req, res) => {
  try {
    const student = await Student.findOne({ userId: req.user._id });
    if (!student) {
      return res.status(404).json({ message: 'Student profile not found' });
    }

    const stats = await getTaskStats(student._id);
    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/tasks/:id
// @desc    Get a specific task
// @access  Private (Student)
router.get('/:id', protect, authorize('student'), async (req, res) => {
  try {
    const student = await Student.findOne({ userId: req.user._id });
    if (!student) {
      return res.status(404).json({ message: 'Student profile not found' });
    }

    const task = await Task.findOne({
      _id: req.params.id,
      studentId: student._id
    })
      .populate('createdBy', 'personalInfo')
      .populate('linkedMeetingId', 'title')
      .populate('linkedFeedbackId');

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    res.json(task);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/tasks/:id
// @desc    Update task (student can update status, add evidence, request review)
// @access  Private (Student)
router.put('/:id', protect, authorize('student'), async (req, res) => {
  try {
    const student = await Student.findOne({ userId: req.user._id });
    if (!student) {
      return res.status(404).json({ message: 'Student profile not found' });
    }

    const task = await Task.findOne({
      _id: req.params.id,
      studentId: student._id
    });

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const { action, status, evidence, reviewRequested, comment } = req.body;

    if (action === 'update_status') {
      if (['open', 'in_progress', 'blocked'].includes(status)) {
        task.status = status;
      }
    } else if (action === 'submit_evidence') {
      task.studentEvidence = {
        text: evidence.text || '',
        files: evidence.files || [],
        submittedAt: new Date()
      };
      if (evidence.markComplete) {
        task.status = 'done';
        task.completedAt = new Date();
        task.completedBy = 'student';
      }
    } else if (action === 'request_review') {
      task.reviewRequested = true;
      task.reviewRequestedAt = new Date();
    } else if (action === 'add_comment') {
      task.comments.push({
        author: 'student',
        authorId: student._id,
        text: comment,
        createdAt: new Date()
      });
    }

    await task.save();

    res.json({
      success: true,
      message: 'Task updated successfully',
      task
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;

