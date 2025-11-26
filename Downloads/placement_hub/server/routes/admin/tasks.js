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

    const { studentId, status, priority, overdue, pendingReview } = req.query;
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
    if (pendingReview === 'true') {
      query.studentEvidence = { $exists: true, $ne: null };
      query.reviewed = false; // Only show tasks that haven't been reviewed yet
      query.status = { $ne: 'done' };
    }

    const tasks = await Task.find(query)
      .populate('studentId', 'personalInfo academicInfo')
      .populate('linkedMeetingId', 'title')
      .populate('linkedFeedbackId')
      .populate('reviewedBy', 'personalInfo')
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

// @route   GET /api/admin/tasks/:id
// @desc    Get a specific task
// @access  Private (Admin)
router.get('/:id', async (req, res) => {
  try {
    const admin = await Admin.findOne({ userId: req.user._id });
    if (!admin) {
      return res.status(404).json({ message: 'Admin profile not found' });
    }

    const task = await Task.findOne({
      _id: req.params.id,
      createdBy: admin._id
    })
      .populate('studentId', 'personalInfo academicInfo')
      .populate('createdBy', 'personalInfo')
      .populate('linkedMeetingId', 'title')
      .populate('linkedFeedbackId')
      .populate('reviewedBy', 'personalInfo');

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    res.json(task);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/admin/tasks
// @desc    Create new task(s) - supports single, filtered group, or explicit student list
// @access  Private (Admin)
router.post('/', async (req, res) => {
  try {
    const admin = await Admin.findOne({ userId: req.user._id });
    if (!admin) {
      return res.status(404).json({ message: 'Admin profile not found' });
    }

    const {
      studentId,
      studentIds,
      filters,
      title,
      description,
      priority,
      dueDate,
      linkedMeetingId,
      linkedFeedbackId,
      reminders,
      attachments
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ message: 'Task title is required' });
    }

    // Determine target students
    let targetStudentIds = [];

    if (Array.isArray(studentIds) && studentIds.length > 0) {
      // Explicit selection
      targetStudentIds = studentIds;
    } else if (filters && Object.keys(filters).length > 0) {
      // Group by filters: department / year / specialization
      const query = {};
      if (filters.department) {
        query['academicInfo.department'] = filters.department;
      }
      if (filters.specialization) {
        query['academicInfo.specialization'] = filters.specialization;
      }
      if (filters.year) {
        const yearInt = parseInt(filters.year, 10);
        if (!Number.isNaN(yearInt)) {
          query['academicInfo.year'] = yearInt;
        }
      }

      const matchingStudents = await Student.find(query).select('_id');
      targetStudentIds = matchingStudents.map((s) => s._id);
    } else if (studentId) {
      // Single student (existing behaviour)
      targetStudentIds = [studentId];
    }

    if (!targetStudentIds.length) {
      return res.status(400).json({
        message: 'No target students found for this task. Please select a student or provide filters/studentIds.'
      });
    }

    const payload = targetStudentIds.map((sid) => ({
      studentId: sid,
      createdBy: admin._id,
      title: title.trim(),
      description,
      priority: priority || 'medium',
      dueDate: dueDate ? new Date(dueDate) : undefined,
      origin: 'manual',
      linkedMeetingId,
      linkedFeedbackId,
      reminders: reminders || [],
      attachments: attachments || []
    }));

    const createdTasks = await Task.insertMany(payload);

    res.status(201).json({
      success: true,
      message:
        createdTasks.length === 1
          ? 'Task created successfully'
          : `Tasks created for ${createdTasks.length} students`,
      count: createdTasks.length,
      tasks: createdTasks
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

    const { title, description, priority, status, dueDate, comment, markReviewDone, reviewFeedback } = req.body;

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

    // Mark review as done
    if (markReviewDone) {
      task.reviewed = true;
      task.reviewedAt = new Date();
      task.reviewedBy = admin._id;
      if (reviewFeedback) {
        task.reviewFeedback = reviewFeedback;
      }
    }

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

