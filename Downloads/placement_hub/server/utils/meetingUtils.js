const ics = require('ics');
const { createEvent } = ics;

/**
 * Check for meeting conflicts
 * @param {Date} startTime - Meeting start time (UTC)
 * @param {Date} endTime - Meeting end time (UTC)
 * @param {ObjectId} mentorId - Mentor ID
 * @param {ObjectId} excludeMeetingId - Meeting ID to exclude from conflict check
 * @returns {Promise<boolean>} - True if conflict exists
 */
async function checkMeetingConflicts(startTime, endTime, mentorId, excludeMeetingId = null) {
  const Meeting = require('../models/Meeting');
  
  const query = {
    mentorId,
    status: { $in: ['approved', 'confirmed', 'in_progress'] },
    $or: [
      // Meeting starts during another meeting
      {
        startTime: { $lte: startTime },
        endTime: { $gt: startTime }
      },
      // Meeting ends during another meeting
      {
        startTime: { $lt: endTime },
        endTime: { $gte: endTime }
      },
      // Meeting completely contains another meeting
      {
        startTime: { $gte: startTime },
        endTime: { $lte: endTime }
      }
    ]
  };

  if (excludeMeetingId) {
    query._id = { $ne: excludeMeetingId };
  }

  const conflictingMeeting = await Meeting.findOne(query);
  return !!conflictingMeeting;
}

/**
 * Generate ICS calendar file for meeting
 * @param {Object} meeting - Meeting object
 * @param {Object} student - Student object
 * @returns {string} - ICS file content
 */
function generateICSFile(meeting, student) {
  const startDate = new Date(meeting.startTime);
  const endDate = new Date(meeting.endTime);

  const event = {
    start: [
      startDate.getUTCFullYear(),
      startDate.getUTCMonth() + 1,
      startDate.getUTCDate(),
      startDate.getUTCHours(),
      startDate.getUTCMinutes()
    ],
    end: [
      endDate.getUTCFullYear(),
      endDate.getUTCMonth() + 1,
      endDate.getUTCDate(),
      endDate.getUTCHours(),
      endDate.getUTCMinutes()
    ],
    title: meeting.title,
    description: meeting.description || '',
    location: meeting.meetingLink || 'Online',
    url: meeting.meetingLink,
    status: 'CONFIRMED',
    busyStatus: 'BUSY',
    organizer: { name: 'PlacementHub Mentor', email: 'mentor@placementhub.com' },
    attendees: [
      {
        name: `${student.personalInfo.firstName} ${student.personalInfo.lastName}`,
        email: student.userId?.email || '',
        rsvp: true,
        partstat: 'NEEDS-ACTION',
        role: 'REQ-PARTICIPANT'
      }
    ]
  };

  const { error, value } = createEvent(event);
  if (error) {
    console.error('Error generating ICS file:', error);
    return null;
  }

  return value;
}

/**
 * Generate meeting link based on platform
 * @param {string} platform - Meeting platform
 * @param {Object} meeting - Meeting object
 * @returns {string} - Meeting link
 */
function generateMeetingLink(platform, meeting) {
  // In production, integrate with actual APIs (Zoom, Google Meet, etc.)
  // For now, return placeholder links
  
  switch (platform) {
    case 'zoom':
      return `https://zoom.us/j/${meeting._id}`;
    case 'google_meet':
      return `https://meet.google.com/${meeting._id.toString().substring(0, 12)}`;
    case 'microsoft_teams':
      return `https://teams.microsoft.com/l/meetup-join/${meeting._id}`;
    case 'custom':
      return meeting.meetingLink || '';
    default:
      return '';
  }
}

/**
 * Convert UTC time to timezone
 * @param {Date} utcDate - UTC date
 * @param {string} timezone - Target timezone (e.g., 'Asia/Kolkata')
 * @returns {Date} - Date in target timezone
 */
function convertToTimezone(utcDate, timezone) {
  // Simple implementation - in production, use a library like date-fns-tz
  return new Date(utcDate.toLocaleString('en-US', { timeZone: timezone }));
}

/**
 * Format time for display in timezone
 * @param {Date} date - Date object
 * @param {string} timezone - Timezone
 * @returns {string} - Formatted time string
 */
function formatTimeInTimezone(date, timezone) {
  return new Date(date).toLocaleString('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
}

module.exports = {
  checkMeetingConflicts,
  generateICSFile,
  generateMeetingLink,
  convertToTimezone,
  formatTimeInTimezone
};

