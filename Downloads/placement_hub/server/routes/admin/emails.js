const express = require('express');
const EmailLog = require('../../models/EmailLog');
const Student = require('../../models/Student');
const Admin = require('../../models/Admin');
const Task = require('../../models/Task');
const Meeting = require('../../models/Meeting');
const { protect, authorize } = require('../../middleware/auth');
const { sendEmail } = require('../../utils/emailService');
const { formatTimeInTimezone, generateICSFile } = require('../../utils/meetingUtils');

const router = express.Router();

// All routes require admin authentication
router.use(protect, authorize('admin'));

// Email templates
const emailTemplates = {
  meeting_scheduled: (variables) => ({
    subject: `Meeting Scheduled: ${variables.meeting_title}`,
    html: `
      <h2>Meeting Scheduled</h2>
      <p>Hello ${variables.student_name},</p>
      <p>Your meeting has been scheduled.</p>
      <p><strong>Title:</strong> ${variables.meeting_title}</p>
      <p><strong>Date & Time:</strong> ${variables.meeting_start_local}</p>
      <p><strong>Meeting Link:</strong> <a href="${variables.meeting_link}">${variables.meeting_link}</a></p>
    `
  }),
  meeting_reminder: (variables) => ({
    subject: `Reminder: ${variables.meeting_title}`,
    html: `
      <h2>Meeting Reminder</h2>
      <p>Hello ${variables.student_name},</p>
      <p>This is a reminder that your meeting is coming up.</p>
      <p><strong>Title:</strong> ${variables.meeting_title}</p>
      <p><strong>Date & Time:</strong> ${variables.meeting_start_local}</p>
      <p><strong>Meeting Link:</strong> <a href="${variables.meeting_link}">${variables.meeting_link}</a></p>
    `
  }),
  feedback_summary: (variables) => ({
    subject: `Meeting Feedback: ${variables.meeting_title}`,
    html: `
      <h2>Meeting Feedback</h2>
      <p>Hello ${variables.student_name},</p>
      <p>Here is the feedback from your recent meeting.</p>
      <p><strong>Rating:</strong> ${variables.feedback_rating}/5</p>
      <p><strong>Summary:</strong> ${variables.feedback_summary}</p>
      ${variables.reschedule_link ? `<p><a href="${variables.reschedule_link}">Reschedule Meeting</a></p>` : ''}
    `
  }),
  custom: (variables) => ({
    subject: variables.subject || 'Message from PlacementHub',
    html: variables.body || ''
  })
};

// @route   POST /api/admin/emails/send
// @desc    Send email to one or multiple students
// @access  Private (Admin)
router.post('/send', async (req, res) => {
  try {
    const admin = await Admin.findOne({ userId: req.user._id });
    if (!admin) {
      return res.status(404).json({ message: 'Admin profile not found' });
    }

    const {
      recipientIds,
      templateName,
      subject,
      body,
      variables,
      attachments,
      includesMeetingLink,
      includesICSFile,
      meetingId,
      createTasks,
      scheduledFor
    } = req.body;

    const students = await Student.find({ _id: { $in: recipientIds } })
      .populate('userId', 'email');

    const bulkEmailId = `bulk_${Date.now()}`;
    const emailLogs = [];

    for (const student of students) {
      try {
        // Personalize variables
        const personalizedVars = {
          student_name: `${student.personalInfo.firstName} ${student.personalInfo.lastName}`,
          student_email: student.userId?.email || '',
          ...variables
        };

        // Get template or use custom
        let emailContent;
        if (templateName && emailTemplates[templateName]) {
          emailContent = emailTemplates[templateName](personalizedVars);
        } else {
          emailContent = emailTemplates.custom({
            subject: subject || 'Message from PlacementHub',
            body: body || ''
          });
          // Replace variables in custom template
          Object.keys(personalizedVars).forEach(key => {
            emailContent.subject = emailContent.subject.replace(new RegExp(`{{${key}}}`, 'g'), personalizedVars[key]);
            emailContent.html = emailContent.html.replace(new RegExp(`{{${key}}}`, 'g'), personalizedVars[key]);
          });
        }

        // Add meeting link if requested
        if (includesMeetingLink && meetingId) {
          const meeting = await Meeting.findById(meetingId);
          if (meeting) {
            emailContent.html += `<p><strong>Meeting Link:</strong> <a href="${meeting.meetingLink}">${meeting.meetingLink}</a></p>`;
          }
        }

        // Send email
        if (!scheduledFor || new Date(scheduledFor) <= new Date()) {
          await sendEmail({
            to: student.userId?.email,
            subject: emailContent.subject,
            html: emailContent.html,
            attachments: attachments || []
          });
        }

        // Create email log
        const emailLog = await EmailLog.create({
          recipientId: student._id,
          recipientType: 'Student',
          recipientEmail: student.userId?.email || '',
          sentBy: admin._id,
          subject: emailContent.subject,
          body: emailContent.html,
          htmlBody: emailContent.html,
          templateId: templateName,
          templateName,
          variables: personalizedVars,
          attachments: attachments || [],
          includesMeetingLink: includesMeetingLink || false,
          includesICSFile: includesICSFile || false,
          meetingId: meetingId || undefined,
          scheduledFor: scheduledFor ? new Date(scheduledFor) : undefined,
          status: scheduledFor ? 'scheduled' : 'sent',
          sentAt: scheduledFor ? undefined : new Date(),
          isBulkEmail: recipientIds.length > 1,
          bulkEmailId: recipientIds.length > 1 ? bulkEmailId : undefined,
          canUndo: !!scheduledFor
        });

        emailLogs.push(emailLog);

        // Create tasks if requested
        if (createTasks) {
          await Task.create({
            studentId: student._id,
            createdBy: admin._id,
            title: `Follow-up: ${emailContent.subject}`,
            description: 'Task created from email',
            priority: 'medium',
            origin: 'auto_email',
            linkedEmailId: emailLog._id
          });
        }
      } catch (error) {
        console.error(`Error sending email to student ${student._id}:`, error);
        emailLogs.push({
          recipientId: student._id,
          status: 'failed',
          errorMessage: error.message
        });
      }
    }

    res.json({
      success: true,
      message: `Email sent to ${emailLogs.filter(e => e.status === 'sent').length} recipient(s)`,
      emailLogs
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/admin/emails
// @desc    Get email logs
// @access  Private (Admin)
router.get('/', async (req, res) => {
  try {
    const admin = await Admin.findOne({ userId: req.user._id });
    if (!admin) {
      return res.status(404).json({ message: 'Admin profile not found' });
    }

    const { status, recipientId, limit = 50 } = req.query;
    let query = { sentBy: admin._id };

    if (status) {
      query.status = status;
    }
    if (recipientId) {
      query.recipientId = recipientId;
    }

    const emails = await EmailLog.find(query)
      .populate('recipientId', 'personalInfo')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    res.json(emails);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/admin/emails/:id/undo
// @desc    Undo a scheduled email (before scheduled time)
// @access  Private (Admin)
router.post('/:id/undo', async (req, res) => {
  try {
    const admin = await Admin.findOne({ userId: req.user._id });
    if (!admin) {
      return res.status(404).json({ message: 'Admin profile not found' });
    }

    const emailLog = await EmailLog.findOne({
      _id: req.params.id,
      sentBy: admin._id,
      status: 'scheduled'
    });

    if (!emailLog) {
      return res.status(404).json({ message: 'Scheduled email not found' });
    }

    if (emailLog.scheduledFor && new Date(emailLog.scheduledFor) <= new Date()) {
      return res.status(400).json({ message: 'Cannot undo email that has already been sent' });
    }

    emailLog.undone = true;
    emailLog.undoneAt = new Date();
    emailLog.status = 'cancelled';
    await emailLog.save();

    res.json({
      success: true,
      message: 'Scheduled email cancelled'
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;

