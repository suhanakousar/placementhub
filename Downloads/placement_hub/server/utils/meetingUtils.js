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
  try {
    const startDate = new Date(meeting.startTime);
    const endDate = new Date(meeting.endTime);

    // Validate dates
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      console.error('Invalid date in meeting:', meeting.startTime, meeting.endTime);
      return null;
    }

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
      title: meeting.title || 'Meeting',
      description: meeting.description || '',
      location: meeting.meetingLink || 'Online',
      url: meeting.meetingLink,
      status: 'CONFIRMED',
      busyStatus: 'BUSY',
      organizer: { name: 'PlacementHub Mentor', email: 'mentor@placementhub.com' }
    };

    // Add attendee if student info is available
    if (student && student.personalInfo) {
      event.attendees = [
        {
          name: `${student.personalInfo.firstName || ''} ${student.personalInfo.lastName || ''}`.trim() || 'Student',
          email: student.userId?.email || '',
          rsvp: true,
          partstat: 'NEEDS-ACTION',
          role: 'REQ-PARTICIPANT'
        }
      ];
    }

    const { error, value } = createEvent(event);
    if (error) {
      console.error('Error generating ICS file:', error);
      return null;
    }

    return value;
  } catch (error) {
    console.error('Error in generateICSFile:', error);
    return null;
  }
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

/**
 * 🔒 UNIFIED MEETING LINK POLICY
 * Check if an existing meeting link exists for a group session
 * This ensures ONE link per group session, preventing duplicate links
 * @param {string} groupSessionId - Group session ID
 * @returns {Promise<string|null>} - Existing meeting link or null
 */
async function getExistingGroupSessionLink(groupSessionId) {
  const Meeting = require('../models/Meeting');
  
  if (!groupSessionId) {
    return null;
  }
  
  // Find the first meeting in this group session that has a meeting link
  const existingMeeting = await Meeting.findOne({
    groupSessionId: groupSessionId,
    meetingLink: { $exists: true, $ne: '' }
  }).select('meetingLink meetingId meetingPlatform meetingPassword meetingDialIn meetingStartUrl');
  
  if (existingMeeting && existingMeeting.meetingLink) {
    console.log(`✅ Found existing meeting link for group session ${groupSessionId}: ${existingMeeting.meetingLink}`);
    return {
      meetingLink: existingMeeting.meetingLink,
      meetingId: existingMeeting.meetingId,
      meetingPlatform: existingMeeting.meetingPlatform,
      meetingPassword: existingMeeting.meetingPassword,
      meetingDialIn: existingMeeting.meetingDialIn,
      meetingStartUrl: existingMeeting.meetingStartUrl
    };
  }
  
  return null;
}

/**
 * 🔒 UNIFIED MEETING LINK POLICY
 * Check if an existing meeting link exists for a single meeting session
 * This ensures ONE link per meeting, preventing duplicate links
 * @param {ObjectId} studentId - Student ID
 * @param {ObjectId} mentorId - Mentor ID
 * @param {Date} startTime - Meeting start time
 * @param {Date} endTime - Meeting end time
 * @param {ObjectId} excludeMeetingId - Meeting ID to exclude from check
 * @returns {Promise<string|null>} - Existing meeting link or null
 */
async function getExistingSingleMeetingLink(studentId, mentorId, startTime, endTime, excludeMeetingId = null) {
  const Meeting = require('../models/Meeting');
  
  // Check for existing meeting with same participants and time (within 1 minute tolerance)
  const timeTolerance = 60 * 1000; // 1 minute in milliseconds
  const startTimeMin = new Date(new Date(startTime).getTime() - timeTolerance);
  const startTimeMax = new Date(new Date(startTime).getTime() + timeTolerance);
  
  const query = {
    studentId: studentId,
    mentorId: mentorId,
    startTime: { $gte: startTimeMin, $lte: startTimeMax },
    endTime: { $gte: new Date(new Date(endTime).getTime() - timeTolerance), $lte: new Date(new Date(endTime).getTime() + timeTolerance) },
    isGroupMeeting: false,
    meetingLink: { $exists: true, $ne: '' }
  };
  
  if (excludeMeetingId) {
    query._id = { $ne: excludeMeetingId };
  }
  
  const existingMeeting = await Meeting.findOne(query).select('meetingLink meetingId meetingPlatform meetingPassword meetingDialIn meetingStartUrl');
  
  if (existingMeeting && existingMeeting.meetingLink) {
    console.log(`✅ Found existing meeting link for single meeting (student: ${studentId}, mentor: ${mentorId}): ${existingMeeting.meetingLink}`);
    return {
      meetingLink: existingMeeting.meetingLink,
      meetingId: existingMeeting.meetingId,
      meetingPlatform: existingMeeting.meetingPlatform,
      meetingPassword: existingMeeting.meetingPassword,
      meetingDialIn: existingMeeting.meetingDialIn,
      meetingStartUrl: existingMeeting.meetingStartUrl
    };
  }
  
  return null;
}

/**
 * 🔒 UNIFIED MEETING LINK POLICY
 * Validate that a meeting link is not being duplicated
 * This is a safety check to prevent accidental duplicate link creation
 * @param {string} meetingLink - Meeting link to validate
 * @param {ObjectId} excludeMeetingId - Meeting ID to exclude from check
 * @returns {Promise<boolean>} - True if link is unique, false if duplicate exists
 */
async function validateMeetingLinkUniqueness(meetingLink, excludeMeetingId = null) {
  const Meeting = require('../models/Meeting');
  
  if (!meetingLink || meetingLink.trim() === '') {
    return true; // Empty links are allowed (will be created)
  }
  
  const query = {
    meetingLink: meetingLink
  };
  
  if (excludeMeetingId) {
    query._id = { $ne: excludeMeetingId };
  }
  
  const existingMeeting = await Meeting.findOne(query);
  
  if (existingMeeting) {
    console.warn(`⚠️ WARNING: Meeting link already exists: ${meetingLink}`);
    console.warn(`   Existing meeting ID: ${existingMeeting._id}`);
    return false; // Link is not unique
  }
  
  return true; // Link is unique
}

module.exports = {
  checkMeetingConflicts,
  generateICSFile,
  generateMeetingLink,
  convertToTimezone,
  formatTimeInTimezone,
  getExistingGroupSessionLink,
  getExistingSingleMeetingLink,
  validateMeetingLinkUniqueness
};

