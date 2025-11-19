const express = require('express');
const Meeting = require('../../models/Meeting');
const MeetingRequest = require('../../models/MeetingRequest');
const Feedback = require('../../models/Feedback');
const Student = require('../../models/Student');
const Admin = require('../../models/Admin');
const Reminder = require('../../models/Reminder');
const Task = require('../../models/Task');
const EmailLog = require('../../models/EmailLog');
const { protect, authorize } = require('../../middleware/auth');
const { checkMeetingConflicts, generateICSFile, generateMeetingLink, formatTimeInTimezone } = require('../../utils/meetingUtils');
const { sendEmail } = require('../../utils/emailService');
const { createRemindersForMeeting } = require('../../utils/reminderUtils');
const { createTasksFromFeedback } = require('../../utils/taskUtils');

const router = express.Router();

// All routes require admin authentication
router.use(protect, authorize('admin'));

// @route   GET /api/admin/meetings
// @desc    Get all meetings for admin mentor
// @access  Private (Admin)
router.get('/', async (req, res) => {
  try {
    const admin = await Admin.findOne({ userId: req.user._id });
    if (!admin) {
      return res.status(404).json({ 
        message: 'Admin profile not found. Please ensure you have an admin profile.',
        userId: req.user._id
      });
    }

    const { status, upcoming, past, studentId, dateRange } = req.query;
    let query = { mentorId: admin._id };

    if (status) {
      query.status = status;
    } else if (upcoming === 'true') {
      query.startTime = { $gte: new Date() };
      query.status = { $ne: 'cancelled' };
    } else if (past === 'true') {
      query.endTime = { $lt: new Date() };
    }

    if (studentId) {
      query.studentId = studentId;
    }

    if (dateRange) {
      const date = new Date(dateRange);
      const startOfDay = new Date(date.setHours(0, 0, 0, 0));
      const endOfDay = new Date(date.setHours(23, 59, 59, 999));
      query.startTime = { $gte: startOfDay, $lte: endOfDay };
    }

    const meetings = await Meeting.find(query)
      .populate({
        path: 'studentId',
        select: 'personalInfo academicInfo userId',
        populate: {
          path: 'userId',
          select: 'email',
          model: 'User'
        }
      })
      .populate({
        path: 'feedbackId',
        select: 'rating tags strengths areasForImprovement detailedComments recommendations visibleToStudent',
        strictPopulate: false
      })
      .populate({
        path: 'requestId',
        select: 'title topic status',
        strictPopulate: false
      })
      .sort({ startTime: 1 })
      .lean();

    // Transform the data to ensure proper structure
    const transformedMeetings = meetings.map(meeting => ({
      ...meeting,
      studentId: meeting.studentId ? {
        _id: meeting.studentId._id,
        personalInfo: meeting.studentId.personalInfo || {},
        academicInfo: meeting.studentId.academicInfo || {},
        userId: meeting.studentId.userId || null
      } : null
    }));

    res.json(transformedMeetings);
  } catch (error) {
    console.error('Error fetching meetings:', error);
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// @route   GET /api/admin/meetings/dashboard
// @desc    Get dashboard stats for admin mentor
// @access  Private (Admin)
router.get('/dashboard', async (req, res) => {
  try {
    const admin = await Admin.findOne({ userId: req.user._id });
    if (!admin) {
      return res.status(404).json({ message: 'Admin profile not found' });
    }

    const now = new Date();
    const todayStart = new Date(now.setHours(0, 0, 0, 0));
    const todayEnd = new Date(now.setHours(23, 59, 59, 999));

    // Today's meetings
    const todayMeetings = await Meeting.find({
      mentorId: admin._id,
      startTime: { $gte: todayStart, $lte: todayEnd },
      status: { $in: ['approved', 'confirmed', 'in_progress'] }
    }).populate('studentId', 'personalInfo');

    // Pending requests
    const pendingRequests = await MeetingRequest.find({
      status: 'pending'
    })
      .populate('studentId', 'personalInfo academicInfo')
      .sort({ createdAt: -1 })
      .limit(10);

    // Upcoming meetings (next 7 days)
    const upcomingMeetings = await Meeting.find({
      mentorId: admin._id,
      startTime: { $gte: new Date(), $lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
      status: { $in: ['approved', 'confirmed'] }
    })
      .populate('studentId', 'personalInfo')
      .sort({ startTime: 1 })
      .limit(10);

    // Stats
    const totalMeetings = await Meeting.countDocuments({ mentorId: admin._id });
    const completedMeetings = await Meeting.countDocuments({
      mentorId: admin._id,
      status: 'completed'
    });
    const noShowCount = await Meeting.countDocuments({
      mentorId: admin._id,
      status: 'no_show'
    });
    const noShowRate = totalMeetings > 0 ? (noShowCount / totalMeetings) * 100 : 0;

    // Average feedback rating
    const feedbacks = await Feedback.find({ mentorId: admin._id });
    const avgRating = feedbacks.length > 0
      ? feedbacks.reduce((sum, f) => sum + f.rating, 0) / feedbacks.length
      : 0;

    // Most common topics
    const topicCounts = await Meeting.aggregate([
      { $match: { mentorId: admin._id } },
      { $group: { _id: '$topic', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    res.json({
      todayMeetings,
      pendingRequests,
      upcomingMeetings,
      stats: {
        totalMeetings,
        completedMeetings,
        noShowCount,
        noShowRate: noShowRate.toFixed(2),
        avgRating: avgRating.toFixed(2),
        topicCounts
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/admin/meetings
// @desc    Create a new meeting (admin schedules directly)
// @access  Private (Admin)
router.post('/', async (req, res) => {
  try {
    const admin = await Admin.findOne({ userId: req.user._id });
    if (!admin) {
      return res.status(404).json({ message: 'Admin profile not found' });
    }

    const {
      studentId,
      startTime,
      endTime,
      title,
      topic,
      description,
      notes,
      meetingPlatform,
      studentTimezone,
      attachments
    } = req.body;

    // Validate required fields
    if (!studentId || !startTime || !endTime || !title || !topic) {
      return res.status(400).json({ 
        message: 'Missing required fields: studentId, startTime, endTime, title, and topic are required' 
      });
    }

    // Validate dates
    const start = new Date(startTime);
    const end = new Date(endTime);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ message: 'Invalid date format' });
    }
    if (end <= start) {
      return res.status(400).json({ message: 'End time must be after start time' });
    }

    // Validate student exists
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Check for conflicts
    const hasConflict = await checkMeetingConflicts(
      new Date(startTime),
      new Date(endTime),
      admin._id
    );

    if (hasConflict) {
      return res.status(400).json({ message: 'Meeting time conflicts with existing meeting' });
    }

    // Generate meeting link (will be updated after meeting is created)
    // For now, use a placeholder that will be replaced
    let meetingLink = `https://meet.google.com/new?authuser=0`;
    
    // If custom platform, check if link is provided
    if (meetingPlatform === 'custom' && req.body.meetingLink) {
      meetingLink = req.body.meetingLink;
    } else if (meetingPlatform !== 'in_person') {
      // Generate a unique link based on student ID and timestamp
      try {
        const linkId = studentId.toString().substring(0, 12) + Date.now().toString().substring(10);
        switch (meetingPlatform || 'google_meet') {
          case 'zoom':
            meetingLink = `https://zoom.us/j/${linkId}`;
            break;
          case 'google_meet':
            meetingLink = `https://meet.google.com/${linkId}`;
            break;
          case 'microsoft_teams':
            meetingLink = `https://teams.microsoft.com/l/meetup-join/${linkId}`;
            break;
          default:
            meetingLink = `https://meet.google.com/new?authuser=0`;
        }
      } catch (linkError) {
        console.error('Error generating meeting link:', linkError);
        meetingLink = `https://meet.google.com/new?authuser=0`;
      }
    } else {
      meetingLink = 'In Person Meeting';
    }

    // Create meeting
    const meeting = await Meeting.create({
      studentId,
      mentorId: admin._id,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      studentTimezone: studentTimezone || 'UTC',
      mentorTimezone: req.body.mentorTimezone || 'UTC',
      title,
      topic,
      description,
      notes,
      meetingLink,
      meetingPlatform: meetingPlatform || 'google_meet',
      status: 'approved',
      createdBy: 'admin',
      attachments: attachments || []
    });

    // Generate ICS file (non-blocking)
    try {
      const icsContent = generateICSFile(meeting, student);
      if (icsContent) {
        meeting.icsFile = icsContent;
        await meeting.save();
      }
    } catch (icsError) {
      console.error('Error generating ICS file:', icsError);
      // Continue even if ICS generation fails
    }

    // Create reminders (non-blocking)
    try {
      await createRemindersForMeeting(meeting, student);
    } catch (reminderError) {
      console.error('Error creating reminders:', reminderError);
      // Continue even if reminder creation fails
    }

    // Send confirmation email to student (non-blocking)
    try {
      const studentUser = await require('../../models/User').findById(student.userId);
      if (studentUser && studentUser.email) {
        const localStartTime = formatTimeInTimezone(meeting.startTime, meeting.studentTimezone);
        
        await sendEmail({
          to: studentUser.email,
          subject: `Meeting Scheduled: ${meeting.title}`,
          html: `
            <h2>Meeting Scheduled</h2>
            <p>Your meeting with your mentor has been scheduled.</p>
            <p><strong>Title:</strong> ${meeting.title}</p>
            <p><strong>Date & Time:</strong> ${localStartTime}</p>
            <p><strong>Topic:</strong> ${meeting.topic}</p>
            <p><strong>Meeting Link:</strong> <a href="${meeting.meetingLink}">${meeting.meetingLink}</a></p>
            ${meeting.description ? `<p><strong>Description:</strong> ${meeting.description}</p>` : ''}
          `
        });

        // Log email
        await EmailLog.create({
          recipientId: student._id,
          recipientType: 'Student',
          recipientEmail: studentUser.email,
          sentBy: admin._id,
          subject: `Meeting Scheduled: ${meeting.title}`,
          body: `Meeting scheduled for ${localStartTime}`,
          status: 'sent',
          sentAt: new Date(),
          includesMeetingLink: true,
          meetingId: meeting._id
        });
      }
    } catch (emailError) {
      console.error('Error sending confirmation email:', emailError);
      // Continue even if email fails
    }

    res.status(201).json({
      success: true,
      message: 'Meeting created successfully',
      meeting
    });
  } catch (error) {
    console.error('Error creating meeting:', error);
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// @route   POST /api/admin/meetings/requests/:id/approve
// @desc    Approve a meeting request and create meeting
// @access  Private (Admin)
router.post('/requests/:id/approve', async (req, res) => {
  try {
    const admin = await Admin.findOne({ userId: req.user._id });
    if (!admin) {
      return res.status(404).json({ message: 'Admin profile not found' });
    }

    const request = await MeetingRequest.findById(req.params.id)
      .populate('studentId');
    
    if (!request) {
      return res.status(404).json({ message: 'Meeting request not found' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ message: 'Request is not pending' });
    }

    const { startTime, endTime, meetingPlatform, notes } = req.body;

    // Check for conflicts
    const hasConflict = await checkMeetingConflicts(
      new Date(startTime),
      new Date(endTime),
      admin._id
    );

    if (hasConflict) {
      return res.status(400).json({ message: 'Meeting time conflicts with existing meeting' });
    }

    // Generate meeting link
    const meetingLink = generateMeetingLink(meetingPlatform || 'google_meet', { _id: request._id });

    // Create meeting
    const meeting = await Meeting.create({
      studentId: request.studentId._id,
      mentorId: admin._id,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      studentTimezone: request.studentTimezone,
      mentorTimezone: req.body.mentorTimezone || 'UTC',
      title: request.title,
      topic: request.topic,
      description: request.description,
      notes: notes || request.additionalNotes,
      meetingLink,
      meetingPlatform: meetingPlatform || 'google_meet',
      status: 'approved',
      requestId: request._id,
      createdBy: 'admin',
      attachments: request.attachments || []
    });

    // Update request
    request.status = 'approved';
    request.meetingId = meeting._id;
    request.adminResponse = {
      message: req.body.message || 'Meeting approved',
      respondedAt: new Date(),
      scheduledMeetingTime: new Date(startTime)
    };
    await request.save();

    // Generate ICS file
    const icsContent = generateICSFile(meeting, request.studentId);
    if (icsContent) {
      meeting.icsFile = icsContent;
      await meeting.save();
    }

    // Create reminders
    await createRemindersForMeeting(meeting, request.studentId);

    // Send approval email to student
    try {
      const studentUser = await require('../../models/User').findById(request.studentId.userId);
      if (studentUser && studentUser.email) {
        const localStartTime = formatTimeInTimezone(meeting.startTime, meeting.studentTimezone);
        
        await sendEmail({
          to: studentUser.email,
          subject: `Meeting Request Approved: ${meeting.title}`,
          html: `
            <h2>Meeting Request Approved</h2>
            <p>Your meeting request has been approved!</p>
            <p><strong>Title:</strong> ${meeting.title}</p>
            <p><strong>Date & Time:</strong> ${localStartTime}</p>
            <p><strong>Topic:</strong> ${meeting.topic}</p>
            <p><strong>Meeting Link:</strong> <a href="${meeting.meetingLink}">${meeting.meetingLink}</a></p>
            ${request.adminResponse.message ? `<p><strong>Message from mentor:</strong> ${request.adminResponse.message}</p>` : ''}
          `
        });
      }
    } catch (emailError) {
      console.error('Error sending approval email:', emailError);
    }

    res.json({
      success: true,
      message: 'Meeting request approved and meeting created',
      meeting
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/admin/meetings/requests/:id/decline
// @desc    Decline a meeting request
// @access  Private (Admin)
router.post('/requests/:id/decline', async (req, res) => {
  try {
    const admin = await Admin.findOne({ userId: req.user._id });
    if (!admin) {
      return res.status(404).json({ message: 'Admin profile not found' });
    }

    const request = await MeetingRequest.findById(req.params.id)
      .populate('studentId');
    
    if (!request) {
      return res.status(404).json({ message: 'Meeting request not found' });
    }

    // Allow declining if pending or expired (but not if already approved/declined/converted)
    if (request.status === 'approved' || request.status === 'declined' || request.status === 'converted') {
      return res.status(400).json({ 
        message: `Cannot decline request. Current status: ${request.status}`,
        currentStatus: request.status
      });
    }

    request.status = 'declined';
    request.adminResponse = {
      message: req.body.reason || req.body.message || 'Meeting request declined',
      respondedAt: new Date()
    };
    await request.save();

    // Send decline email to student
    try {
      const studentUser = await require('../../models/User').findById(request.studentId.userId);
      if (studentUser && studentUser.email) {
        await sendEmail({
          to: studentUser.email,
          subject: `Meeting Request Update: ${request.title}`,
          html: `
            <h2>Meeting Request Update</h2>
            <p>Your meeting request has been declined.</p>
            <p><strong>Title:</strong> ${request.title}</p>
            <p><strong>Reason:</strong> ${request.adminResponse.message}</p>
            <p>You can submit a new meeting request if needed.</p>
          `
        });
      }
    } catch (emailError) {
      console.error('Error sending decline email:', emailError);
    }

    res.json({
      success: true,
      message: 'Meeting request declined',
      request
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/admin/meetings/:id/cancel
// @desc    Cancel a meeting
// @access  Private (Admin)
router.post('/:id/cancel', async (req, res) => {
  try {
    const admin = await Admin.findOne({ userId: req.user._id });
    if (!admin) {
      return res.status(404).json({ message: 'Admin profile not found' });
    }

    const meeting = await Meeting.findOne({
      _id: req.params.id,
      mentorId: admin._id
    }).populate('studentId');

    if (!meeting) {
      return res.status(404).json({ message: 'Meeting not found' });
    }

    meeting.status = 'cancelled';
    meeting.cancelledBy = 'admin';
    meeting.cancellationReason = req.body.reason || 'Cancelled by mentor';
    meeting.cancelledAt = new Date();
    await meeting.save();

    // Send cancellation email to student
    try {
      const studentUser = await require('../../models/User').findById(meeting.studentId.userId);
      if (studentUser && studentUser.email) {
        const localStartTime = formatTimeInTimezone(meeting.startTime, meeting.studentTimezone);
        
        await sendEmail({
          to: studentUser.email,
          subject: `Meeting Cancelled: ${meeting.title}`,
          html: `
            <h2>Meeting Cancelled</h2>
            <p>Your meeting has been cancelled.</p>
            <p><strong>Title:</strong> ${meeting.title}</p>
            <p><strong>Original Date & Time:</strong> ${localStartTime}</p>
            <p><strong>Reason:</strong> ${meeting.cancellationReason}</p>
            <p>You can request a new meeting if needed.</p>
          `
        });
      }
    } catch (emailError) {
      console.error('Error sending cancellation email:', emailError);
    }

    res.json({
      success: true,
      message: 'Meeting cancelled successfully',
      meeting
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/admin/meetings/:id/complete
// @desc    Mark a meeting as completed
// @access  Private (Admin)
router.post('/:id/complete', async (req, res) => {
  try {
    const admin = await Admin.findOne({ userId: req.user._id });
    if (!admin) {
      return res.status(404).json({ message: 'Admin profile not found' });
    }

    const meeting = await Meeting.findOne({
      _id: req.params.id,
      mentorId: admin._id
    });

    if (!meeting) {
      return res.status(404).json({ message: 'Meeting not found' });
    }

    meeting.status = 'completed';
    await meeting.save();

    res.json({
      success: true,
      message: 'Meeting marked as completed',
      meeting
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/admin/meetings/:id/no-show
// @desc    Mark a meeting as no-show
// @access  Private (Admin)
router.post('/:id/no-show', async (req, res) => {
  try {
    const admin = await Admin.findOne({ userId: req.user._id });
    if (!admin) {
      return res.status(404).json({ message: 'Admin profile not found' });
    }

    const meeting = await Meeting.findOne({
      _id: req.params.id,
      mentorId: admin._id
    }).populate('studentId');

    if (!meeting) {
      return res.status(404).json({ message: 'Meeting not found' });
    }

    meeting.status = 'no_show';
    await meeting.save();

    // Send no-show email to student with reschedule link
    try {
      const studentUser = await require('../../models/User').findById(meeting.studentId.userId);
      if (studentUser && studentUser.email) {
        await sendEmail({
          to: studentUser.email,
          subject: `Meeting No-Show: ${meeting.title}`,
          html: `
            <h2>Meeting No-Show</h2>
            <p>You missed your scheduled meeting.</p>
            <p><strong>Title:</strong> ${meeting.title}</p>
            <p><strong>Scheduled Time:</strong> ${formatTimeInTimezone(meeting.startTime, meeting.studentTimezone)}</p>
            <p>Please request a new meeting to reschedule.</p>
          `
        });
      }
    } catch (emailError) {
      console.error('Error sending no-show email:', emailError);
    }

    res.json({
      success: true,
      message: 'Meeting marked as no-show',
      meeting
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/admin/meetings/:id
// @desc    Update a meeting (reschedule, etc.)
// @access  Private (Admin)
router.put('/:id', async (req, res) => {
  try {
    const admin = await Admin.findOne({ userId: req.user._id });
    if (!admin) {
      return res.status(404).json({ message: 'Admin profile not found' });
    }

    const meeting = await Meeting.findOne({
      _id: req.params.id,
      mentorId: admin._id
    }).populate('studentId');

    if (!meeting) {
      return res.status(404).json({ message: 'Meeting not found' });
    }

    const { action, startTime, endTime, title, description, notes, meetingLink, status } = req.body;

    if (action === 'reschedule') {
      // Check for conflicts (excluding current meeting)
      if (startTime && endTime) {
        const hasConflict = await checkMeetingConflicts(
          new Date(startTime),
          new Date(endTime),
          admin._id,
          meeting._id
        );

        if (hasConflict) {
          return res.status(400).json({ message: 'Rescheduled time conflicts with existing meeting' });
        }

        meeting.startTime = new Date(startTime);
        meeting.endTime = new Date(endTime);
        meeting.status = 'approved';
      }
    } else if (action === 'cancel') {
      meeting.status = 'cancelled';
      meeting.cancelledBy = 'admin';
      meeting.cancellationReason = req.body.reason || 'Cancelled by mentor';
      meeting.cancelledAt = new Date();
    } else if (action === 'mark_complete') {
      meeting.status = 'completed';
    } else if (action === 'mark_no_show') {
      meeting.status = 'no_show';
    } else {
      // General update
      if (title) meeting.title = title;
      if (description) meeting.description = description;
      if (notes) meeting.notes = notes;
      if (meetingLink) meeting.meetingLink = meetingLink;
      if (status) meeting.status = status;
    }

    await meeting.save();

    // Send notification email if rescheduled or cancelled
    if (action === 'reschedule' || action === 'cancel') {
      try {
        const studentUser = await require('../../models/User').findById(meeting.studentId.userId);
        if (studentUser && studentUser.email) {
          const subject = action === 'reschedule' 
            ? `Meeting Rescheduled: ${meeting.title}`
            : `Meeting Cancelled: ${meeting.title}`;
          
          const localStartTime = formatTimeInTimezone(meeting.startTime, meeting.studentTimezone);
          
          await sendEmail({
            to: studentUser.email,
            subject,
            html: `
              <h2>Meeting ${action === 'reschedule' ? 'Rescheduled' : 'Cancelled'}</h2>
              <p>Your meeting has been ${action === 'reschedule' ? 'rescheduled' : 'cancelled'}.</p>
              <p><strong>Title:</strong> ${meeting.title}</p>
              ${action === 'reschedule' ? `<p><strong>New Date & Time:</strong> ${localStartTime}</p>` : ''}
              ${meeting.cancellationReason ? `<p><strong>Reason:</strong> ${meeting.cancellationReason}</p>` : ''}
            `
          });
        }
      } catch (emailError) {
        console.error('Error sending notification email:', emailError);
      }
    }

    res.json({
      success: true,
      message: `Meeting ${action || 'updated'} successfully`,
      meeting
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/admin/meetings/:id/feedback
// @desc    Add feedback for a completed meeting
// @access  Private (Admin)
router.post('/:id/feedback', async (req, res) => {
  try {
    const admin = await Admin.findOne({ userId: req.user._id });
    if (!admin) {
      return res.status(404).json({ message: 'Admin profile not found' });
    }

    const meeting = await Meeting.findOne({
      _id: req.params.id,
      mentorId: admin._id
    }).populate('studentId');

    if (!meeting) {
      return res.status(404).json({ message: 'Meeting not found' });
    }

    const {
      rating,
      tags,
      strengths,
      areasForImprovement,
      detailedComments,
      recommendations,
      visibleToStudent,
      sendFeedbackEmail,
      createTasks
    } = req.body;

    // Create or update feedback
    let feedback;
    if (meeting.feedbackId) {
      feedback = await Feedback.findById(meeting.feedbackId);
      if (feedback) {
        feedback.rating = rating;
        feedback.tags = tags || [];
        feedback.strengths = strengths || [];
        feedback.areasForImprovement = areasForImprovement || [];
        feedback.detailedComments = detailedComments;
        feedback.recommendations = recommendations;
        feedback.visibleToStudent = visibleToStudent !== false;
        await feedback.save();
      }
    }

    if (!feedback) {
      feedback = await Feedback.create({
        meetingId: meeting._id,
        studentId: meeting.studentId._id,
        mentorId: admin._id,
        rating,
        tags: tags || [],
        strengths: strengths || [],
        areasForImprovement: areasForImprovement || [],
        detailedComments,
        recommendations,
        visibleToStudent: visibleToStudent !== false
      });

      meeting.feedbackId = feedback._id;
      await meeting.save();
    }

    // Create tasks from feedback if requested
    if (createTasks && tags && tags.length > 0) {
      const tasks = await createTasksFromFeedback(feedback, tags);
      feedback.tasksCreated = tasks.map(t => t._id);
      feedback.autoTasksCreated = true;
      await feedback.save();
    }

    // Send feedback email if requested and visible to student
    if (sendFeedbackEmail && feedback.visibleToStudent) {
      try {
        const studentUser = await require('../../models/User').findById(meeting.studentId.userId);
        if (studentUser && studentUser.email) {
          const feedbackSummary = `
            <h2>Meeting Feedback</h2>
            <p><strong>Rating:</strong> ${rating}/5</p>
            ${tags && tags.length > 0 ? `<p><strong>Tags:</strong> ${tags.join(', ')}</p>` : ''}
            ${strengths && strengths.length > 0 ? `<p><strong>Strengths:</strong><ul>${strengths.map(s => `<li>${s}</li>`).join('')}</ul></p>` : ''}
            ${areasForImprovement && areasForImprovement.length > 0 ? `<p><strong>Areas for Improvement:</strong><ul>${areasForImprovement.map(a => `<li>${a}</li>`).join('')}</ul></p>` : ''}
            ${detailedComments ? `<p><strong>Comments:</strong> ${detailedComments}</p>` : ''}
            ${recommendations ? `<p><strong>Recommendations:</strong> ${recommendations}</p>` : ''}
          `;

          await sendEmail({
            to: studentUser.email,
            subject: `Meeting Feedback: ${meeting.title}`,
            html: feedbackSummary
          });

          feedback.emailSent = true;
          feedback.emailSentAt = new Date();
          await feedback.save();

          // Log email
          await EmailLog.create({
            recipientId: meeting.studentId._id,
            recipientType: 'Student',
            recipientEmail: studentUser.email,
            sentBy: admin._id,
            subject: `Meeting Feedback: ${meeting.title}`,
            body: detailedComments || '',
            htmlBody: feedbackSummary,
            status: 'sent',
            sentAt: new Date()
          });
        }
      } catch (emailError) {
        console.error('Error sending feedback email:', emailError);
      }
    }

    res.json({
      success: true,
      message: 'Feedback added successfully',
      feedback
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   DELETE /api/admin/meetings/:id
// @desc    Delete a meeting
// @access  Private (Admin)
router.delete('/:id', async (req, res) => {
  try {
    const admin = await Admin.findOne({ userId: req.user._id });
    if (!admin) {
      return res.status(404).json({ message: 'Admin profile not found' });
    }

    const meeting = await Meeting.findOne({
      _id: req.params.id,
      mentorId: admin._id
    });

    if (!meeting) {
      return res.status(404).json({ message: 'Meeting not found' });
    }

    // Only allow deletion of cancelled or future meetings
    if (meeting.status === 'completed' || meeting.status === 'in_progress') {
      return res.status(400).json({ 
        message: 'Cannot delete completed or in-progress meetings' 
      });
    }

    // Delete associated reminders
    await Reminder.deleteMany({ meetingId: meeting._id });

    // Delete the meeting
    await Meeting.findByIdAndDelete(meeting._id);

    res.json({
      success: true,
      message: 'Meeting deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   DELETE /api/admin/meetings/requests/:id
// @desc    Delete a meeting request
// @access  Private (Admin)
router.delete('/requests/:id', async (req, res) => {
  try {
    const admin = await Admin.findOne({ userId: req.user._id });
    if (!admin) {
      return res.status(404).json({ message: 'Admin profile not found' });
    }

    const request = await MeetingRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({ message: 'Meeting request not found' });
    }

    // Only allow deletion of pending or declined requests
    if (request.status === 'approved' && request.meetingId) {
      return res.status(400).json({ 
        message: 'Cannot delete approved request with associated meeting. Cancel the meeting first.' 
      });
    }

    await MeetingRequest.findByIdAndDelete(request._id);

    res.json({
      success: true,
      message: 'Meeting request deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/admin/meetings/requests
// @desc    Get all meeting requests
// @access  Private (Admin)
router.get('/requests', async (req, res) => {
  try {
    const admin = await Admin.findOne({ userId: req.user._id });
    if (!admin) {
      return res.status(404).json({ message: 'Admin profile not found. Please ensure you have an admin profile.' });
    }

    const { status } = req.query;
    let query = {}; // All requests go to the single admin mentor

    if (status) {
      query.status = status;
    }

    const requests = await MeetingRequest.find(query)
      .populate({
        path: 'studentId',
        select: 'personalInfo academicInfo',
        populate: {
          path: 'userId',
          select: 'email'
        }
      })
      .populate('meetingId')
      .sort({ createdAt: -1 })
      .lean();

    res.json(requests);
  } catch (error) {
    console.error('Error fetching meeting requests:', error);
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

module.exports = router;

