const Reminder = require('../models/Reminder');
const Meeting = require('../models/Meeting');
const Task = require('../models/Task');
const { sendEmail } = require('./emailService');
const { formatTimeInTimezone } = require('./meetingUtils');

/**
 * Create reminders for a meeting
 * @param {Object} meeting - Meeting object
 * @param {Object} student - Student object
 */
async function createRemindersForMeeting(meeting, student) {
  const reminderTimes = [
    { type: '48_hours', hours: 48 },
    { type: '24_hours', hours: 24 },
    { type: '1_hour', hours: 1 },
    { type: '10_minutes', minutes: 10 }
  ];

  const reminders = [];

  for (const reminderTime of reminderTimes) {
    let scheduledFor;
    if (reminderTime.hours) {
      scheduledFor = new Date(meeting.startTime.getTime() - reminderTime.hours * 60 * 60 * 1000);
    } else {
      scheduledFor = new Date(meeting.startTime.getTime() - reminderTime.minutes * 60 * 1000);
    }

    // Only create reminder if it's in the future
    if (scheduledFor > new Date()) {
      const reminder = await Reminder.create({
        entityType: 'meeting',
        entityId: meeting._id,
        recipientId: student._id,
        recipientType: 'Student',
        recipientEmail: student.userId?.email || '',
        reminderType: reminderTime.type,
        scheduledFor,
        status: 'pending'
      });
      reminders.push(reminder);
    }
  }

  return reminders;
}

/**
 * Process pending reminders (called by cron job)
 */
async function processPendingReminders() {
  const now = new Date();
  const pendingReminders = await Reminder.find({
    status: 'pending',
    scheduledFor: { $lte: now }
  }).limit(50); // Process in batches

  for (const reminder of pendingReminders) {
    try {
      if (reminder.entityType === 'meeting') {
        await sendMeetingReminder(reminder);
      } else if (reminder.entityType === 'task') {
        await sendTaskReminder(reminder);
      }

      reminder.status = 'sent';
      reminder.sentAt = new Date();
      await reminder.save();
    } catch (error) {
      console.error(`Error processing reminder ${reminder._id}:`, error);
      reminder.status = 'failed';
      reminder.errorMessage = error.message;
      reminder.retryCount += 1;
      await reminder.save();
    }
  }
}

/**
 * Send meeting reminder email
 * @param {Object} reminder - Reminder object
 */
async function sendMeetingReminder(reminder) {
  const meeting = await Meeting.findById(reminder.entityId)
    .populate('studentId')
    .populate('mentorId', 'personalInfo');

  if (!meeting) {
    throw new Error('Meeting not found');
  }

  const localTime = formatTimeInTimezone(meeting.startTime, meeting.studentTimezone);
  const reminderText = getReminderText(reminder.reminderType);

  const emailContent = `
    <h2>Meeting Reminder</h2>
    <p>${reminderText}</p>
    <p><strong>Meeting:</strong> ${meeting.title}</p>
    <p><strong>Date & Time:</strong> ${localTime}</p>
    <p><strong>Topic:</strong> ${meeting.topic}</p>
    ${meeting.meetingLink ? `<p><strong>Join Link:</strong> <a href="${meeting.meetingLink}">${meeting.meetingLink}</a></p>` : ''}
    <p>We look forward to meeting with you!</p>
  `;

  await sendEmail({
    to: reminder.recipientEmail,
    subject: `Reminder: ${meeting.title} - ${reminderText}`,
    html: emailContent
  });
}

/**
 * Send task reminder email
 * @param {Object} reminder - Reminder object
 */
async function sendTaskReminder(reminder) {
  const task = await Task.findById(reminder.entityId)
    .populate('studentId')
    .populate('createdBy', 'personalInfo');

  if (!task) {
    throw new Error('Task not found');
  }

  const dueDate = task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date';
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date();

  const emailContent = `
    <h2>Task Reminder</h2>
    <p>${isOverdue ? '<strong style="color: red;">This task is overdue!</strong>' : 'This is a reminder about your task.'}</p>
    <p><strong>Task:</strong> ${task.title}</p>
    <p><strong>Description:</strong> ${task.description || 'N/A'}</p>
    <p><strong>Due Date:</strong> ${dueDate}</p>
    <p><strong>Priority:</strong> ${task.priority}</p>
    <p>Please complete this task as soon as possible.</p>
  `;

  await sendEmail({
    to: reminder.recipientEmail,
    subject: `${isOverdue ? 'OVERDUE: ' : ''}Task Reminder: ${task.title}`,
    html: emailContent
  });
}

/**
 * Get reminder text based on type
 * @param {string} type - Reminder type
 * @returns {string} - Reminder text
 */
function getReminderText(type) {
  const texts = {
    '48_hours': 'Your meeting is in 48 hours. Please prepare accordingly.',
    '24_hours': 'Your meeting is tomorrow. Don\'t forget to attend!',
    '1_hour': 'Your meeting starts in 1 hour. Please join on time.',
    '10_minutes': 'Your meeting starts in 10 minutes. Click the link to join!'
  };
  return texts[type] || 'This is a reminder about your upcoming meeting.';
}

/**
 * Check for no-shows (meetings that started 15+ minutes ago but not marked complete)
 */
async function checkNoShows() {
  const now = new Date();
  const fifteenMinutesAgo = new Date(now.getTime() - 15 * 60 * 1000);

  const potentialNoShows = await Meeting.find({
    status: { $in: ['approved', 'confirmed', 'in_progress'] },
    startTime: { $lte: fifteenMinutesAgo },
    endTime: { $gte: now } // Meeting should still be ongoing or just ended
  }).populate('studentId');

  for (const meeting of potentialNoShows) {
    // Mark as no-show
    meeting.status = 'no_show';
    await meeting.save();

    // Send no-show email to student
    try {
      const studentUser = await require('../models/User').findById(meeting.studentId.userId);
      if (studentUser && studentUser.email) {
        await sendEmail({
          to: studentUser.email,
          subject: 'Missed Meeting - Reschedule Available',
          html: `
            <h2>Meeting Missed</h2>
            <p>You missed your scheduled meeting: <strong>${meeting.title}</strong></p>
            <p>The meeting was scheduled for ${formatTimeInTimezone(meeting.startTime, meeting.studentTimezone)}</p>
            <p>Please click <a href="${process.env.CLIENT_URL || 'http://localhost:3000'}/student/meetings/request">here</a> to reschedule.</p>
          `
        });

        // Auto-create reschedule task
        const Task = require('../models/Task');
        await Task.create({
          studentId: meeting.studentId._id,
          createdBy: meeting.mentorId,
          title: 'Reschedule Missed Session',
          description: `You missed your meeting "${meeting.title}". Please reschedule at your earliest convenience.`,
          priority: 'high',
          origin: 'auto_no_show',
          linkedMeetingId: meeting._id
        });
      }
    } catch (error) {
      console.error(`Error handling no-show for meeting ${meeting._id}:`, error);
    }
  }
}

module.exports = {
  createRemindersForMeeting,
  processPendingReminders,
  checkNoShows,
  sendMeetingReminder,
  sendTaskReminder
};

