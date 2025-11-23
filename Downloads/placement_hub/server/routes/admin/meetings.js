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
const { createRealMeeting } = require('../../services/meetingService');

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

    // Validate student exists and populate userId
    const student = await Student.findById(studentId).populate('userId', 'email');
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    
    // Log student info for debugging
    console.log('Student found:', {
      studentId: student._id,
      hasUserId: !!student.userId,
      userId: student.userId?._id || student.userId,
      hasEmail: !!student.userId?.email,
      email: student.userId?.email || 'NO EMAIL'
    });

    // Check for conflicts
    const hasConflict = await checkMeetingConflicts(
      new Date(startTime),
      new Date(endTime),
      admin._id
    );

    if (hasConflict) {
      return res.status(400).json({ message: 'Meeting time conflicts with existing meeting' });
    }

    // Get student user email for meeting creation
    const studentUser = await require('../../models/User').findById(student.userId);
    
    // Create real Google Meet meeting
    let meetingLink = '';
    let meetingDetails = null;
    
    try {
      meetingDetails = await createRealMeeting('google_meet', {
        title,
        startTime,
        endTime,
        timezone: studentTimezone || 'UTC',
        attendeeEmail: studentUser?.email
      });
      
      meetingLink = meetingDetails.joinUrl || meetingDetails.meetingLink || '';
      
      if (!meetingLink) {
        return res.status(500).json({ 
          message: 'Failed to create Google Meet meeting. No meeting link was generated.',
          error: 'Missing meeting link'
        });
      }
    } catch (meetingError) {
      console.error('Error creating Google Meet meeting:', meetingError);
      return res.status(500).json({ 
        message: 'Failed to create Google Meet meeting.',
        error: meetingError.message
      });
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
      meetingPlatform: 'google_meet',
      meetingId: meetingDetails?.meetingId || null,
      meetingPassword: meetingDetails?.password || null,
      meetingDialIn: meetingDetails?.dialInNumber || null,
      meetingStartUrl: meetingDetails?.startUrl || null,
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

    // Send confirmation email to student immediately
    let emailSent = false;
    let emailError = null;
    try {
      // Use populated userId if available, otherwise fetch it
      let studentUser = student.userId;
      if (!studentUser && student.userId) {
        // If userId is an ObjectId, fetch the User
        const User = require('../../models/User');
        studentUser = await User.findById(student.userId);
      }
      
      if (!student.userId) {
        console.error('❌ Student has no userId field. Student ID:', student._id);
        emailError = 'Student user not linked - userId is missing';
      } else if (!studentUser) {
        console.error('❌ Student user not found for userId:', student.userId);
        emailError = `Student user not found for userId: ${student.userId}`;
      } else if (!studentUser.email) {
        console.error('❌ Student email not found for user:', studentUser._id);
        emailError = `Student email not configured for user: ${studentUser._id}`;
      } else {
        console.log(`\n📧 Attempting to send meeting email to: ${studentUser.email}`);
        console.log(`   Student: ${student.personalInfo?.firstName} ${student.personalInfo?.lastName}`);
        console.log(`   Meeting: ${meeting.title}`);
        const localStartTime = formatTimeInTimezone(meeting.startTime, meeting.studentTimezone);
        const localEndTime = formatTimeInTimezone(meeting.endTime, meeting.studentTimezone);
        const studentName = student.personalInfo?.firstName || 'Student';
        
        const emailHtml = `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
              .meeting-info { background: white; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #667eea; }
              .meeting-link { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 15px 0; font-weight: bold; }
              .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
              .reminder-note { background: #fff3cd; border: 1px solid #ffc107; padding: 15px; border-radius: 5px; margin: 20px 0; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Meeting Scheduled</h1>
              </div>
              <div class="content">
                <h2>Hello ${studentName},</h2>
                <p>Your meeting with your mentor has been successfully scheduled!</p>
                
                <div class="meeting-info">
                  <h3 style="margin-top: 0; color: #667eea;">${meeting.title}</h3>
                  <p><strong>Topic:</strong> ${meeting.topic}</p>
                  <p><strong>Date & Time:</strong> ${localStartTime}</p>
                  <p><strong>Duration:</strong> Until ${localEndTime}</p>
                  ${meeting.description ? `<p><strong>Description:</strong><br>${meeting.description}</p>` : ''}
                </div>

                <div style="text-align: center;">
                  <a href="${meeting.meetingLink}" class="meeting-link">Join Meeting</a>
                </div>
                
                <div class="reminder-note">
                  <strong>📅 Reminder:</strong> You will receive automatic email reminders at:
                  <ul style="margin: 10px 0; padding-left: 20px;">
                    <li>48 hours before the meeting</li>
                    <li>24 hours before the meeting</li>
                    <li>1 hour before the meeting</li>
                    <li>10 minutes before the meeting</li>
                  </ul>
                </div>

                <p>Please add this meeting to your calendar and prepare any questions or materials you'd like to discuss.</p>
                
                <div class="footer">
                  <p>© ${new Date().getFullYear()} Placement Hub. All rights reserved.</p>
                </div>
              </div>
            </div>
          </body>
          </html>
        `;
        
        const emailResult = await sendEmail({
          to: studentUser.email,
          subject: `Meeting Scheduled: ${meeting.title}`,
          html: emailHtml,
          fromName: 'Placement Hub - Mentoring System'
        });

        if (emailResult && emailResult.success && emailResult.mode !== 'development') {
          emailSent = true;
          console.log(`✅ Meeting email sent successfully to ${studentUser.email}`);
          
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
        } else {
          emailError = emailResult?.message || emailResult?.error || 'Email sending failed';
          console.error('❌ Email sending failed:', emailResult);
          console.error('Email error details:', {
            success: emailResult?.success,
            mode: emailResult?.mode,
            error: emailResult?.error,
            message: emailResult?.message
          });
          
          // Log failed email attempt
          try {
            await EmailLog.create({
              recipientId: student._id,
              recipientType: 'Student',
              recipientEmail: studentUser.email,
              sentBy: admin._id,
              subject: `Meeting Scheduled: ${meeting.title}`,
              body: `Meeting scheduled for ${localStartTime}`,
              status: 'failed',
              sentAt: new Date(),
              error: emailError,
              includesMeetingLink: true,
              meetingId: meeting._id
            });
          } catch (logError) {
            console.error('Failed to log email error:', logError);
          }
        }
      }
    } catch (err) {
      emailError = err.message || err.toString();
      console.error('❌ Error sending confirmation email:', err);
      console.error('Error details:', {
        message: err.message,
        stack: err.stack,
        code: err.code,
        response: err.response
      });
    }

    // Populate meeting with student info for response
    const populatedMeeting = await Meeting.findById(meeting._id)
      .populate({
        path: 'studentId',
        select: 'personalInfo academicInfo userId',
        populate: {
          path: 'userId',
          select: 'email',
          model: 'User'
        }
      });

    res.status(201).json({
      success: true,
      message: 'Meeting created successfully',
      meeting: populatedMeeting || meeting,
      emailSent: emailSent,
      emailError: emailError ? `Email notification failed: ${emailError}. Meeting was created successfully.` : null,
      debug: {
        studentEmail: student.userId?.email || 'not found',
        emailAttempted: emailSent,
        emailError: emailError
      }
    });
  } catch (error) {
    console.error('Error creating meeting:', error);
    console.error('Error stack:', error.stack);
    console.error('Error details:', {
      message: error.message,
      name: error.name,
      code: error.code
    });
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message || error.toString(),
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// @route   POST /api/admin/meetings/bulk
// @desc    Create a group meeting for filtered students
// @access  Private (Admin)
router.post('/bulk', async (req, res) => {
  try {
    const admin = await Admin.findOne({ userId: req.user._id });
    if (!admin) {
      return res.status(404).json({ message: 'Admin profile not found' });
    }

    const {
      studentIds = [],
      filters = {},
      startTime,
      endTime,
      title,
      topic,
      description,
      notes,
      meetingPlatform = 'google_meet',
      studentTimezone,
      mentorTimezone,
      attachments = []
    } = req.body;

    if (!startTime || !endTime || !title || !topic) {
      return res.status(400).json({
        message: 'Missing required fields: startTime, endTime, title, and topic are required'
      });
    }

    const start = new Date(startTime);
    const end = new Date(endTime);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ message: 'Invalid date format' });
    }
    if (end <= start) {
      return res.status(400).json({ message: 'End time must be after start time' });
    }

    let targetStudents = [];

    if (Array.isArray(studentIds) && studentIds.length > 0) {
      targetStudents = await Student.find({ _id: { $in: studentIds } })
        .populate('userId', 'email')
        .sort({ 'academicInfo.rollNumber': 1 });
    } else {
      const filterQuery = {};
      if (filters.department) {
        filterQuery['academicInfo.department'] = filters.department;
      }
      if (filters.specialization) {
        filterQuery['academicInfo.specialization'] = filters.specialization;
      }
      if (filters.year) {
        const parsedYear = parseInt(filters.year, 10);
        if (!isNaN(parsedYear)) {
          filterQuery['academicInfo.year'] = parsedYear;
        }
      }

      targetStudents = await Student.find(filterQuery)
        .populate('userId', 'email')
        .sort({ 'academicInfo.rollNumber': 1 });
    }

    if (!targetStudents.length) {
      return res.status(404).json({ message: 'No students found for the selected filters' });
    }

    const hasConflict = await checkMeetingConflicts(start, end, admin._id);
    if (hasConflict) {
      return res.status(400).json({ message: 'Meeting time conflicts with existing meeting' });
    }

    let meetingDetails;
    const primaryStudentEmail = targetStudents[0]?.userId?.email || null;
    try {
      meetingDetails = await createRealMeeting(meetingPlatform, {
        title,
        description,
        startTime,
        endTime,
        timezone: studentTimezone || 'UTC',
        attendeeEmail: primaryStudentEmail
      });
    } catch (meetingError) {
      console.error('Error creating meeting link for bulk session:', meetingError);
      return res.status(500).json({
        message: 'Failed to create meeting link',
        error: meetingError.message
      });
    }

    const groupSessionId = `group-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    const successfulMeetings = [];
    const failedMeetings = [];

    for (const student of targetStudents) {
      try {
        const studentTz = student.personalInfo?.timezone || studentTimezone || 'UTC';

        const meeting = await Meeting.create({
          studentId: student._id,
          mentorId: admin._id,
          startTime: new Date(start),
          endTime: new Date(end),
          studentTimezone: studentTz,
          mentorTimezone: mentorTimezone || 'UTC',
          title,
          topic,
          description,
          notes,
          meetingLink: meetingDetails?.meetingLink || '',
          meetingPlatform,
          meetingId: meetingDetails?.meetingId || null,
          meetingPassword: meetingDetails?.password || null,
          meetingDialIn: meetingDetails?.dialInNumber || null,
          meetingStartUrl: meetingDetails?.startUrl || null,
          status: 'approved',
          createdBy: 'admin',
          attachments,
          isGroupMeeting: true,
          groupSessionId,
          groupFilters: {
            department: filters?.department || null,
            specialization: filters?.specialization || null,
            year: filters?.year ? parseInt(filters.year, 10) || null : null
          }
        });

        try {
          const icsContent = generateICSFile(meeting, student);
          if (icsContent) {
            meeting.icsFile = icsContent;
            await meeting.save();
          }
        } catch (icsError) {
          console.error('ICS generation failed for student', student._id, icsError);
        }

        try {
          await createRemindersForMeeting(meeting, student);
        } catch (reminderError) {
          console.error('Reminder creation failed for student', student._id, reminderError);
        }

        // Send confirmation email to student immediately
        try {
          // Check if userId is populated (object) or just an ObjectId
          let studentUser = null;
          const User = require('../../models/User');
          
          if (student.userId) {
            // Check if userId is already populated (has email property) or is an ObjectId
            if (student.userId.email) {
              // Already populated
              studentUser = student.userId;
            } else if (student.userId._id || typeof student.userId === 'object') {
              // It's an object but might not have email, try to get it
              studentUser = await User.findById(student.userId._id || student.userId);
            } else {
              // It's an ObjectId string
              studentUser = await User.findById(student.userId);
            }
          }
          
          // Log student info for debugging
          console.log(`\n📧 Processing email for student: ${student._id}`);
          console.log(`   Name: ${student.personalInfo?.firstName} ${student.personalInfo?.lastName}`);
          console.log(`   Has userId: ${!!student.userId}`);
          console.log(`   userId type: ${typeof student.userId}`);
          console.log(`   Has studentUser: ${!!studentUser}`);
          console.log(`   Has email: ${!!studentUser?.email}`);
          console.log(`   Email: ${studentUser?.email || 'NO EMAIL'}`);
          
          if (!student.userId) {
            console.error(`❌ Student ${student._id} has no userId field`);
          } else if (!studentUser) {
            console.error(`❌ Student user not found for userId: ${student.userId}`);
          } else if (!studentUser.email) {
            console.error(`❌ Student user has no email: ${studentUser._id}`);
          } else {
            console.log(`✅ Attempting to send group meeting email to: ${studentUser.email}`);
            const localStartTime = formatTimeInTimezone(meeting.startTime, studentTz);
            const localEndTime = formatTimeInTimezone(meeting.endTime, studentTz);
            const studentName = student.personalInfo?.firstName || 'Student';
            
            const emailHtml = `
              <!DOCTYPE html>
              <html>
              <head>
                <style>
                  body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                  .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                  .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
                  .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                  .meeting-info { background: white; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #667eea; }
                  .meeting-link { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 15px 0; font-weight: bold; }
                  .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
                  .reminder-note { background: #fff3cd; border: 1px solid #ffc107; padding: 15px; border-radius: 5px; margin: 20px 0; }
                  .group-badge { background: #4caf50; color: white; padding: 8px 15px; border-radius: 20px; font-size: 14px; display: inline-block; margin: 10px 0; }
                </style>
              </head>
              <body>
                <div class="container">
                  <div class="header">
                    <h1>Group Meeting Scheduled</h1>
                  </div>
                  <div class="content">
                    <h2>Hello ${studentName},</h2>
                    <div class="group-badge">👥 Group Session</div>
                    <p>A new mentor group session has been scheduled for you!</p>
                    
                    <div class="meeting-info">
                      <h3 style="margin-top: 0; color: #667eea;">${meeting.title}</h3>
                      <p><strong>Topic:</strong> ${meeting.topic}</p>
                      <p><strong>Date & Time:</strong> ${localStartTime}</p>
                      <p><strong>Duration:</strong> Until ${localEndTime}</p>
                      ${meeting.description ? `<p><strong>Description:</strong><br>${meeting.description}</p>` : ''}
                      <p><strong>Group:</strong> This is a group meeting scheduled for students${filters?.department ? ` in ${filters.department}` : ''}${filters?.year ? `, batch ${filters.year}` : ''}${filters?.specialization ? `, specialization ${filters.specialization}` : ''}.</p>
                    </div>

                    <div style="text-align: center;">
                      <a href="${meeting.meetingLink}" class="meeting-link">Join Meeting</a>
                    </div>
                    
                    <div class="reminder-note">
                      <strong>📅 Reminder:</strong> You will receive automatic email reminders at:
                      <ul style="margin: 10px 0; padding-left: 20px;">
                        <li>48 hours before the meeting</li>
                        <li>24 hours before the meeting</li>
                        <li>1 hour before the meeting</li>
                        <li>10 minutes before the meeting</li>
                      </ul>
                    </div>

                    <p>Please add this meeting to your calendar and prepare any questions or materials you'd like to discuss.</p>
                    
                    <div class="footer">
                      <p>© ${new Date().getFullYear()} Placement Hub. All rights reserved.</p>
                    </div>
                  </div>
                </div>
              </body>
              </html>
            `;
            
            const emailResult = await sendEmail({
              to: studentUser.email,
              subject: `Group Meeting Scheduled: ${meeting.title}`,
              html: emailHtml,
              fromName: 'Placement Hub - Mentoring System'
            });

            if (emailResult && emailResult.success && emailResult.mode !== 'development') {
              console.log(`✅ Group meeting email sent successfully to ${studentUser.email}`);
              
              // Log email
              await EmailLog.create({
                recipientId: student._id,
                recipientType: 'Student',
                recipientEmail: studentUser.email,
                sentBy: admin._id,
                subject: `Group Meeting Scheduled: ${meeting.title}`,
                body: `Group meeting scheduled for ${localStartTime}`,
                status: 'sent',
                sentAt: new Date(),
                includesMeetingLink: true,
                meetingId: meeting._id
              });
            } else {
              const errorMsg = emailResult?.message || emailResult?.error || 'Email sending failed';
              console.error('❌ Email sending failed for student', student._id, errorMsg);
              console.error('Email result:', emailResult);
              
              // Log failed email attempt
              try {
                await EmailLog.create({
                  recipientId: student._id,
                  recipientType: 'Student',
                  recipientEmail: studentUser.email,
                  sentBy: admin._id,
                  subject: `Group Meeting Scheduled: ${meeting.title}`,
                  body: `Group meeting scheduled for ${localStartTime}`,
                  status: 'failed',
                  sentAt: new Date(),
                  error: errorMsg,
                  includesMeetingLink: true,
                  meetingId: meeting._id
                });
              } catch (logError) {
                console.error('Failed to log email error:', logError);
              }
            }
          }
        } catch (emailError) {
          console.error('Email notification failed for student', student._id, emailError);
          // Continue processing other students even if one email fails
        }

        successfulMeetings.push(meeting._id);
      } catch (meetingError) {
        console.error('Bulk meeting creation error:', meetingError);
        failedMeetings.push({
          studentId: student._id,
          reason: meetingError.message
        });
      }
    }

    res.status(201).json({
      success: true,
      message: `Meeting scheduled for ${successfulMeetings.length} students`,
      summary: {
        scheduled: successfulMeetings.length,
        failed: failedMeetings.length,
        failures: failedMeetings
      },
      groupSessionId
    });
  } catch (error) {
    console.error('Bulk meeting scheduling error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
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

    const { startTime, endTime, notes } = req.body;

    // Check for conflicts
    const hasConflict = await checkMeetingConflicts(
      new Date(startTime),
      new Date(endTime),
      admin._id
    );

    if (hasConflict) {
      return res.status(400).json({ message: 'Meeting time conflicts with existing meeting' });
    }

    // Get student user email for meeting creation
    const studentUser = await require('../../models/User').findById(request.studentId.userId);

    // Create real Google Meet meeting
    let meetingLink = '';
    let meetingDetails = null;
    
    try {
      meetingDetails = await createRealMeeting('google_meet', {
        title: request.title,
        startTime,
        endTime,
        timezone: request.studentTimezone || 'UTC',
        attendeeEmail: studentUser?.email,
        description: request.description
      });
      
      meetingLink = meetingDetails.joinUrl || meetingDetails.meetingLink || '';
      
      if (!meetingLink) {
        return res.status(500).json({ 
          message: 'Failed to create Google Meet meeting. No meeting link was generated.',
          error: 'Missing meeting link'
        });
      }
    } catch (meetingError) {
      console.error('Error creating Google Meet meeting:', meetingError);
      return res.status(500).json({ 
        message: 'Failed to create Google Meet meeting.',
        error: meetingError.message
      });
    }

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
      meetingPlatform: 'google_meet',
      meetingId: meetingDetails?.meetingId || null,
      meetingPassword: meetingDetails?.password || null,
      meetingDialIn: meetingDetails?.dialInNumber || null,
      meetingStartUrl: meetingDetails?.startUrl || null,
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

    // Send approval email to student immediately
    try {
      const studentUser = await require('../../models/User').findById(request.studentId.userId);
      if (studentUser && studentUser.email) {
        const localStartTime = formatTimeInTimezone(meeting.startTime, meeting.studentTimezone);
        const localEndTime = formatTimeInTimezone(meeting.endTime, meeting.studentTimezone);
        const studentName = request.studentId?.personalInfo?.firstName || 'Student';
        
        const emailHtml = `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
              .approved-badge { background: #4caf50; color: white; padding: 8px 15px; border-radius: 20px; font-size: 14px; display: inline-block; margin: 10px 0; }
              .meeting-info { background: white; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #667eea; }
              .meeting-link { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 15px 0; font-weight: bold; }
              .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
              .reminder-note { background: #fff3cd; border: 1px solid #ffc107; padding: 15px; border-radius: 5px; margin: 20px 0; }
              .mentor-message { background: #e3f2fd; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #2196f3; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Meeting Request Approved</h1>
              </div>
              <div class="content">
                <h2>Hello ${studentName},</h2>
                <div class="approved-badge">✅ Approved</div>
                <p>Great news! Your meeting request has been approved by your mentor.</p>
                
                <div class="meeting-info">
                  <h3 style="margin-top: 0; color: #667eea;">${meeting.title}</h3>
                  <p><strong>Topic:</strong> ${meeting.topic}</p>
                  <p><strong>Date & Time:</strong> ${localStartTime}</p>
                  <p><strong>Duration:</strong> Until ${localEndTime}</p>
                  ${meeting.description ? `<p><strong>Description:</strong><br>${meeting.description}</p>` : ''}
                </div>

                ${request.adminResponse.message ? `
                  <div class="mentor-message">
                    <strong>Message from your mentor:</strong>
                    <p>${request.adminResponse.message}</p>
                  </div>
                ` : ''}

                <div style="text-align: center;">
                  <a href="${meeting.meetingLink}" class="meeting-link">Join Meeting</a>
                </div>
                
                <div class="reminder-note">
                  <strong>📅 Reminder:</strong> You will receive automatic email reminders at:
                  <ul style="margin: 10px 0; padding-left: 20px;">
                    <li>48 hours before the meeting</li>
                    <li>24 hours before the meeting</li>
                    <li>1 hour before the meeting</li>
                    <li>10 minutes before the meeting</li>
                  </ul>
                </div>

                <p>Please add this meeting to your calendar and prepare any questions or materials you'd like to discuss.</p>
                
                <div class="footer">
                  <p>© ${new Date().getFullYear()} Placement Hub. All rights reserved.</p>
                </div>
              </div>
            </div>
          </body>
          </html>
        `;
        
        const emailResult = await sendEmail({
          to: studentUser.email,
          subject: `Meeting Request Approved: ${meeting.title}`,
          html: emailHtml,
          fromName: 'Placement Hub - Mentoring System'
        });

        // Log email
        if (emailResult && emailResult.success && emailResult.mode !== 'development') {
          console.log(`✅ Approval email sent successfully to ${studentUser.email}`);
          await EmailLog.create({
            recipientId: request.studentId._id,
            recipientType: 'Student',
            recipientEmail: studentUser.email,
            sentBy: admin._id,
            subject: `Meeting Request Approved: ${meeting.title}`,
            body: `Meeting approved and scheduled for ${localStartTime}`,
            status: 'sent',
            sentAt: new Date(),
            includesMeetingLink: true,
            meetingId: meeting._id
          });
        } else {
          const errorMsg = emailResult?.message || emailResult?.error || 'Email sending failed';
          console.error('❌ Approval email sending failed:', errorMsg);
          await EmailLog.create({
            recipientId: request.studentId._id,
            recipientType: 'Student',
            recipientEmail: studentUser.email,
            sentBy: admin._id,
            subject: `Meeting Request Approved: ${meeting.title}`,
            body: `Meeting approved and scheduled for ${localStartTime}`,
            status: 'failed',
            sentAt: new Date(),
            error: errorMsg,
            includesMeetingLink: true,
            meetingId: meeting._id
          });
        }
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

