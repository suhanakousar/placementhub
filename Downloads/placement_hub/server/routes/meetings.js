const express = require('express');
const Meeting = require('../models/Meeting');
const MeetingRequest = require('../models/MeetingRequest');
const Feedback = require('../models/Feedback');
const Student = require('../models/Student');
const Admin = require('../models/Admin');
const { protect, authorize } = require('../middleware/auth');
const { checkMeetingConflicts, generateICSFile, generateMeetingLink } = require('../utils/meetingUtils');
const { sendEmail } = require('../utils/emailService');
const EmailLog = require('../models/EmailLog');

const router = express.Router();

// @route   GET /api/meetings
// @desc    Get all meetings for logged-in student
// @access  Private (Student)
router.get('/', protect, authorize('student'), async (req, res) => {
  try {
    const student = await Student.findOne({ userId: req.user._id });
    if (!student) {
      return res.status(404).json({ message: 'Student profile not found' });
    }

    const { status, upcoming, past } = req.query;
    let query = { studentId: student._id };

    if (status) {
      query.status = status;
    } else if (upcoming === 'true') {
      query.startTime = { $gte: new Date() };
    } else if (past === 'true') {
      query.endTime = { $lt: new Date() };
    }

    const meetings = await Meeting.find(query)
      .populate('mentorId', 'personalInfo')
      .populate('feedbackId')
      .sort({ startTime: 1 });

    res.json(meetings);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/meetings/:id
// @desc    Get a specific meeting
// @access  Private (Student)
router.get('/:id', protect, authorize('student'), async (req, res) => {
  try {
    const student = await Student.findOne({ userId: req.user._id });
    if (!student) {
      return res.status(404).json({ message: 'Student profile not found' });
    }

    const meeting = await Meeting.findOne({
      _id: req.params.id,
      studentId: student._id
    })
      .populate('mentorId', 'personalInfo')
      .populate('feedbackId')
      .populate('requestId');

    if (!meeting) {
      return res.status(404).json({ message: 'Meeting not found' });
    }

    res.json(meeting);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/meetings/request
// @desc    Request a meeting with mentor
// @access  Private (Student)
router.post('/request', protect, authorize('student'), async (req, res) => {
  try {
    const student = await Student.findOne({ userId: req.user._id });
    if (!student) {
      return res.status(404).json({ message: 'Student profile not found' });
    }

    const { preferredSlots, topic, title, description, additionalNotes, priority, attachments } = req.body;

    // Get the admin mentor (first admin found)
    const mentor = await Admin.findOne();
    if (!mentor) {
      return res.status(404).json({ message: 'Mentor not found. Please contact support.' });
    }

    // Create meeting request
    const meetingRequest = await MeetingRequest.create({
      studentId: student._id,
      mentorId: mentor._id,
      preferredSlots: preferredSlots || [],
      studentTimezone: req.body.timezone || 'UTC',
      topic,
      title,
      description,
      additionalNotes,
      priority: priority || 'medium',
      attachments: attachments || []
    });

    // Notify admin via email
    try {
      const adminUser = await require('../models/User').findById(mentor.userId);
      if (adminUser && adminUser.email) {
        await sendEmail({
          to: adminUser.email,
          subject: `New Meeting Request from ${student.personalInfo.firstName} ${student.personalInfo.lastName}`,
          html: `
            <h2>New Meeting Request</h2>
            <p><strong>Student:</strong> ${student.personalInfo.firstName} ${student.personalInfo.lastName}</p>
            <p><strong>Topic:</strong> ${title}</p>
            <p><strong>Priority:</strong> ${priority || 'medium'}</p>
            <p><strong>Description:</strong> ${description || 'N/A'}</p>
            <p>Please review and respond to this meeting request.</p>
          `
        });
      }
    } catch (emailError) {
      console.error('Error sending notification email:', emailError);
    }

    res.status(201).json({
      success: true,
      message: 'Meeting request submitted successfully',
      request: meetingRequest
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/meetings/requests
// @desc    Get all meeting requests for student
// @access  Private (Student)
router.get('/requests/all', protect, authorize('student'), async (req, res) => {
  try {
    const student = await Student.findOne({ userId: req.user._id });
    if (!student) {
      return res.status(404).json({ message: 'Student profile not found' });
    }

    const requests = await MeetingRequest.find({ studentId: student._id })
      .populate('meetingId')
      .sort({ createdAt: -1 });

    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/meetings/:id/reschedule
// @desc    Request to reschedule a meeting
// @access  Private (Student)
router.post('/:id/reschedule', protect, authorize('student'), async (req, res) => {
  try {
    const student = await Student.findOne({ userId: req.user._id });
    if (!student) {
      return res.status(404).json({ message: 'Student profile not found' });
    }

    const meeting = await Meeting.findOne({
      _id: req.params.id,
      studentId: student._id
    });

    if (!meeting) {
      return res.status(404).json({ message: 'Meeting not found' });
    }

    if (meeting.status === 'completed' || meeting.status === 'cancelled') {
      return res.status(400).json({ message: 'Cannot reschedule a completed or cancelled meeting' });
    }

    // Create a new meeting request for rescheduling
    const rescheduleRequest = await MeetingRequest.create({
      studentId: student._id,
      mentorId: meeting.mentorId,
      preferredSlots: req.body.preferredSlots || [],
      studentTimezone: req.body.timezone || meeting.studentTimezone,
      topic: meeting.topic,
      title: `Reschedule: ${meeting.title}`,
      description: req.body.reason || 'Request to reschedule meeting',
      priority: 'high',
      status: 'pending'
    });

    // Mark original meeting as requested for reschedule
    meeting.status = 'rescheduled';
    await meeting.save();

    res.json({
      success: true,
      message: 'Reschedule request submitted',
      request: rescheduleRequest
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/meetings/:id/feedback
// @desc    Get feedback for a meeting (if visible to student)
// @access  Private (Student)
router.get('/:id/feedback', protect, authorize('student'), async (req, res) => {
  try {
    const student = await Student.findOne({ userId: req.user._id });
    if (!student) {
      return res.status(404).json({ message: 'Student profile not found' });
    }

    const meeting = await Meeting.findOne({
      _id: req.params.id,
      studentId: student._id
    }).populate('feedbackId');

    if (!meeting) {
      return res.status(404).json({ message: 'Meeting not found' });
    }

    if (!meeting.feedbackId) {
      return res.status(404).json({ message: 'Feedback not available yet' });
    }

    const feedback = await Feedback.findById(meeting.feedbackId);
    if (!feedback || !feedback.visibleToStudent) {
      return res.status(403).json({ message: 'Feedback is not visible to you' });
    }

    res.json(feedback);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/meetings/:id/link
// @desc    🔒 UNIFIED MEETING LINK POLICY: Get meeting link (always from database, never creates new)
// @access  Private (Student)
// @note    This endpoint ALWAYS returns the stored meeting link from the database.
//          It NEVER creates a new link. Meeting links are created ONLY during scheduling by admin.
router.get('/:id/link', protect, authorize('student'), async (req, res) => {
  try {
    const student = await Student.findOne({ userId: req.user._id });
    if (!student) {
      return res.status(404).json({ message: 'Student profile not found' });
    }

    const meeting = await Meeting.findOne({
      _id: req.params.id,
      studentId: student._id
    }).select('meetingLink meetingPlatform meetingId meetingPassword meetingDialIn meetingStartUrl isGroupMeeting groupSessionId');

    if (!meeting) {
      return res.status(404).json({ message: 'Meeting not found' });
    }

    if (!meeting.meetingLink) {
      return res.status(404).json({ 
        message: 'Meeting link not available yet',
        note: 'Meeting link will be generated when the meeting is scheduled by the admin.'
      });
    }

    // 🔒 Return the stored link from database - NEVER create a new one
    res.json({
      success: true,
      meetingLink: meeting.meetingLink,
      meetingPlatform: meeting.meetingPlatform,
      meetingId: meeting.meetingId,
      meetingPassword: meeting.meetingPassword,
      meetingDialIn: meeting.meetingDialIn,
      meetingStartUrl: meeting.meetingStartUrl,
      isGroupMeeting: meeting.isGroupMeeting,
      groupSessionId: meeting.groupSessionId,
      note: 'This is the official meeting link stored in the database. All participants use this same link.'
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;

