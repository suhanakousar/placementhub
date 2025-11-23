const express = require('express');
const Session = require('../models/Session');
const SessionParticipant = require('../models/SessionParticipant');
const Meeting = require('../models/Meeting');
const Student = require('../models/Student');
const Admin = require('../models/Admin');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/sessions/:id
// @desc    Get session details
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const session = await Session.findById(req.params.id)
      .populate('mentorId', 'personalInfo')
      .populate({
        path: 'meetingIds',
        select: 'title topic status studentId',
        populate: {
          path: 'studentId',
          select: 'personalInfo',
          model: 'Student'
        }
      });

    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    // Check if user is a participant
    const user = req.user;
    const participant = await SessionParticipant.findOne({
      sessionId: session._id,
      userId: user._id
    });

    // Admin can always view sessions they created
    const isAdmin = user.role === 'admin';
    const isMentor = session.mentorId._id.toString() === (await Admin.findOne({ userId: user._id })?._id?.toString());

    if (!participant && !isAdmin && !isMentor) {
      return res.status(403).json({ message: 'You are not authorized to view this session' });
    }

    // Get all participants
    const participants = await SessionParticipant.find({ sessionId: session._id })
      .populate('userId', 'email role')
      .populate({
        path: 'meetingId',
        select: 'studentId',
        populate: {
          path: 'studentId',
          select: 'personalInfo',
          model: 'Student'
        }
      });

    res.json({
      ...session.toObject(),
      participants
    });
  } catch (error) {
    console.error('Error fetching session:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/sessions/:id/join-link
// @desc    Get join link for a session (unified endpoint for all users)
// @access  Private
// @note    This endpoint ALWAYS returns the stored meeting link from the session.
//          It NEVER creates a new link. Meeting links are created ONLY during session creation.
router.get('/:id/join-link', protect, async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);

    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    // Check if session is cancelled
    if (session.status === 'cancelled') {
      return res.status(400).json({ 
        message: 'This session has been cancelled',
        sessionId: session._id
      });
    }

    // Check if user is a participant
    const user = req.user;
    const participant = await SessionParticipant.findOne({
      sessionId: session._id,
      userId: user._id
    });

    // Admin/mentor can always join sessions they created
    let isAuthorized = false;
    if (user.role === 'admin') {
      const admin = await Admin.findOne({ userId: user._id });
      if (admin && session.mentorId.toString() === admin._id.toString()) {
        isAuthorized = true;
      }
    }

    if (!participant && !isAuthorized) {
      return res.status(403).json({ 
        message: 'You are not a participant in this session',
        sessionId: session._id
      });
    }

    // Check if meeting link exists
    if (!session.meetingLink) {
      return res.status(404).json({ 
        message: 'Meeting link not available yet',
        note: 'Meeting link will be generated when the session is scheduled by the admin.',
        sessionId: session._id
      });
    }

    // 🔒 Validate Google Meet link format before returning
    const { validateGoogleMeetLink } = require('../utils/meetingUtils');
    if (!validateGoogleMeetLink(session.meetingLink)) {
      console.error(`❌ CRITICAL: Invalid Google Meet link in session ${session._id}: ${session.meetingLink}`);
      return res.status(500).json({
        message: 'Invalid meeting link detected',
        error: 'The meeting link stored in the database is not a valid Google Meet link. Please contact support to recreate this session.',
        sessionId: session._id,
        invalidLink: session.meetingLink
      });
    }

    // Update participant join status if participant exists
    if (participant) {
      if (participant.joinStatus !== 'joined') {
        participant.joinStatus = 'joined';
        participant.joinTime = new Date();
        await participant.save();
      }
    }

    // Return the stored link from database - NEVER create a new one
    res.json({
      success: true,
      meetingLink: session.meetingLink,
      meetingPlatform: session.meetingPlatform,
      meetingId: session.meetingId,
      meetingPassword: session.meetingPassword,
      meetingDialIn: session.meetingDialIn,
      meetingStartUrl: session.meetingStartUrl,
      sessionId: session._id,
      type: session.type,
      note: 'This is the official meeting link stored in the database. All participants use this same link.'
    });
  } catch (error) {
    console.error('Error getting join link:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/sessions/:id/leave
// @desc    Mark participant as left
// @access  Private
router.post('/:id/leave', protect, async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);

    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    const user = req.user;
    const participant = await SessionParticipant.findOne({
      sessionId: session._id,
      userId: user._id
    });

    if (!participant) {
      return res.status(403).json({ message: 'You are not a participant in this session' });
    }

    participant.joinStatus = 'left';
    participant.leaveTime = new Date();
    await participant.save();

    res.json({
      success: true,
      message: 'Left session successfully'
    });
  } catch (error) {
    console.error('Error leaving session:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;

