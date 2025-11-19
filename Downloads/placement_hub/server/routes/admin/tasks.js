const express = require('express');
const Task = require('../../models/Task');
const Student = require('../../models/Student');
const Admin = require('../../models/Admin');
const { protect, authorize } = require('../../middleware/auth');
const { getAdminTaskStats } = require('../../utils/taskUtils');

const router = express.Router();

// All routes require admin authentication
router.use(protect, authorize('admin'));

// @route   GET /api/admin/tasks
// @desc    Get all tasks (admin view)
// @access  Private (Admin)
router.get('/', async (req, res) => {
  try {
    const admin = await Admin.findOne({ userId: req.user._id });
    if (!admin) {
      return res.status(404).json({ message: 'Admin profile not found' });
    }

    const { studentId, status, priority, overdue } = req.query;
    let query = { createdBy: admin._id };

    if (studentId) {
      query.studentId = studentId;
    }
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
      .populate('studentId', 'personalInfo academicInfo')
      .populate('linkedMeetingId', 'title')
      .populate('linkedFeedbackId')
      .sort({ dueDate: 1, priority: -1 });

    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/admin/tasks/stats
// @desc    Get task statistics for admin
// @access  Private (Admin)
router.get('/stats', async (req, res) => {
  try {
    const admin = await Admin.findOne({ userId: req.user._id });
    if (!admin) {
      return res.status(404).json({ message: 'Admin profile not found' });
    }

    const stats = await getAdminTaskStats(admin._id);
    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/admin/tasks
// @desc    Create a new task
// @access  Private (Admin)
router.post('/', async (req, res) => {
  try {
    const admin = await Admin.findOne({ userId: req.user._id });
    if (!admin) {
      return res.status(404).json({ message: 'Admin profile not found' });
    }

    const {
      studentId,
      title,
      description,
      priority,
      dueDate,
      linkedMeetingId,
      linkedFeedbackId,
      reminders,
      attachments
    } = req.body;

    const task = await Task.create({
      studentId,
      createdBy: admin._id,
      title,
      description,
      priority: priority || 'medium',
      dueDate: dueDate ? new Date(dueDate) : undefined,
      origin: 'manual',
      linkedMeetingId,
      linkedFeedbackId,
      reminders: reminders || [],
      attachments: attachments || []
    });

    res.status(201).json({
      success: true,
      message: 'Task created successfully',
      task
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/admin/tasks/:id
// @desc    Update a task
// @access  Private (Admin)
router.put('/:id', async (req, res) => {
  try {
    const admin = await Admin.findOne({ userId: req.user._id });
    if (!admin) {
      return res.status(404).json({ message: 'Admin profile not found' });
    }

    const task = await Task.findOne({
      _id: req.params.id,
      createdBy: admin._id
    });

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const { title, description, priority, status, dueDate, comment } = req.body;

    if (title) task.title = title;
    if (description) task.description = description;
    if (priority) task.priority = priority;
    if (status) {
      task.status = status;
      if (status === 'done') {
        task.completedAt = new Date();
        task.completedBy = 'admin';
      }
    }
    if (dueDate) task.dueDate = new Date(dueDate);

    if (comment) {
      task.comments.push({
        author: 'admin',
        authorId: admin._id,
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

// @route   DELETE /api/admin/tasks/:id
// @desc    Delete a task
// @access  Private (Admin)
router.delete('/:id', async (req, res) => {
  try {
    const admin = await Admin.findOne({ userId: req.user._id });
    if (!admin) {
      return res.status(404).json({ message: 'Admin profile not found' });
    }

    const task = await Task.findOneAndDelete({
      _id: req.params.id,
      createdBy: admin._id
    });

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    res.json({
      success: true,
      message: 'Task deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;

