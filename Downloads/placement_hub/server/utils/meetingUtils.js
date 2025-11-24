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
 * Find existing group session with same criteria (mentor, time, filters)
 * This prevents creating duplicate group sessions with different links
 * @param {ObjectId} mentorId - Mentor ID
 * @param {Date} startTime - Meeting start time
 * @param {Date} endTime - Meeting end time
 * @param {Object} filters - Group filters (department, year, specialization)
 * @returns {Promise<Object|null>} - Existing group session with link or null
 */
async function findExistingGroupSession(mentorId, startTime, endTime, filters = {}) {
  const Meeting = require('../models/Meeting');
  
  // Check for existing group session with same mentor, time (within 1 minute), and filters
  const timeTolerance = 60 * 1000; // 1 minute
  const startTimeMin = new Date(new Date(startTime).getTime() - timeTolerance);
  const startTimeMax = new Date(new Date(startTime).getTime() + timeTolerance);
  
  const query = {
    mentorId: mentorId,
    isGroupMeeting: true,
    startTime: { $gte: startTimeMin, $lte: startTimeMax },
    endTime: { $gte: new Date(new Date(endTime).getTime() - timeTolerance), $lte: new Date(new Date(endTime).getTime() + timeTolerance) },
    meetingLink: { $exists: true, $ne: '' }
  };
  
  // Match group filters if provided
  if (filters.department) {
    query['groupFilters.department'] = filters.department;
  }
  if (filters.year) {
    query['groupFilters.year'] = parseInt(filters.year, 10);
  }
  if (filters.specialization) {
    query['groupFilters.specialization'] = filters.specialization;
  }
  
  const existingMeeting = await Meeting.findOne(query)
    .select('meetingLink meetingId meetingPlatform meetingPassword meetingDialIn meetingStartUrl groupSessionId');
  
  if (existingMeeting && existingMeeting.meetingLink) {
    console.log(`✅ Found existing group session with same criteria: ${existingMeeting.groupSessionId}`);
    console.log(`   Reusing link: ${existingMeeting.meetingLink}`);
    return {
      meetingLink: existingMeeting.meetingLink,
      meetingId: existingMeeting.meetingId,
      meetingPlatform: existingMeeting.meetingPlatform,
      meetingPassword: existingMeeting.meetingPassword,
      meetingDialIn: existingMeeting.meetingDialIn,
      meetingStartUrl: existingMeeting.meetingStartUrl,
      groupSessionId: existingMeeting.groupSessionId
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
 * 🔒 MEETING LINK VALIDATION
 * Validate that a meeting link has the correct format based on platform
 * @param {string} meetingLink - Meeting link to validate
 * @param {string} platform - Meeting platform ('google_meet', 'jitsi', etc.)
 * @returns {boolean} - True if link is valid, false otherwise
 */
function validateMeetingLink(meetingLink, platform = 'jitsi') {
  if (!meetingLink || typeof meetingLink !== 'string') {
    return false;
  }

  const trimmedLink = meetingLink.trim();
  
  if (platform === 'jitsi') {
    // Jitsi links: https://meet.jit.si/room-name
    if (!trimmedLink.startsWith('https://meet.jit.si/')) {
      return false;
    }
    const roomName = trimmedLink.replace('https://meet.jit.si/', '').split('?')[0].split('#')[0];
    const validPattern = /^[a-z0-9_-]+$/i;
    return validPattern.test(roomName) && roomName.length > 0;
  } else if (platform === 'google_meet') {
    // Google Meet links: https://meet.google.com/abc-defg-hij
    if (!trimmedLink.startsWith('https://meet.google.com/')) {
      return false;
    }
    const meetingCode = trimmedLink.replace('https://meet.google.com/', '').split('?')[0].split('#')[0];
    const validPattern = /^[a-z0-9]{3}-[a-z0-9]{3,4}-[a-z0-9]{3}$/;
    return validPattern.test(meetingCode);
  }
  
  // For other platforms, just check it's a valid URL
  try {
    new URL(trimmedLink);
    return true;
  } catch {
    return false;
  }
}

/**
 * 🔒 GOOGLE MEET LINK VALIDATION (backward compatibility)
 * Now supports both Google Meet and Jitsi - auto-detects platform from URL
 * @param {string} meetingLink - Meeting link to validate
 * @returns {boolean} - True if link is valid, false otherwise
 */
function validateGoogleMeetLink(meetingLink) {
  if (!meetingLink || typeof meetingLink !== 'string') {
    return false;
  }
  
  // Auto-detect platform from URL
  if (meetingLink.includes('meet.jit.si')) {
    return validateMeetingLink(meetingLink, 'jitsi');
  } else if (meetingLink.includes('meet.google.com')) {
    return validateMeetingLink(meetingLink, 'google_meet');
  }
  
  // Default: try Jitsi format (more lenient)
  return validateMeetingLink(meetingLink, 'jitsi');
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

  // First validate the format
  if (!validateGoogleMeetLink(meetingLink)) {
    console.error(`❌ CRITICAL: Invalid Google Meet link format detected: ${meetingLink}`);
    return false; // Invalid format
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

/**
 * Create or get existing session for a meeting
 * This ensures ONE session = ONE meeting link
 * @param {Object} options - Session creation options
 * @param {string} options.type - 'group' or 'one_to_one'
 * @param {string} options.title - Session title
 * @param {string} options.description - Session description
 * @param {ObjectId} options.mentorId - Mentor/Admin ID
 * @param {Date} options.startTime - Session start time
 * @param {Date} options.endTime - Session end time
 * @param {string} options.meetingLink - Meeting link (must be provided)
 * @param {string} options.meetingPlatform - Meeting platform
 * @param {Object} options.meetingDetails - Additional meeting details (meetingId, password, etc.)
 * @param {Array} options.participantUserIds - Array of user IDs to add as participants
 * @param {ObjectId} options.meetingId - Meeting ID to link to session
 * @param {string} options.groupSessionId - Group session ID (for group sessions)
 * @param {Object} options.groupFilters - Group filters (for group sessions)
 * @returns {Promise<Object>} - Created or existing session
 */
async function createOrGetSession(options) {
  const Session = require('../models/Session');
  const SessionParticipant = require('../models/SessionParticipant');
  const User = require('../models/User');
  
  const {
    type,
    title,
    description,
    mentorId,
    startTime,
    endTime,
    meetingLink,
    meetingPlatform = 'google_meet',
    meetingDetails = {},
    participantUserIds = [],
    meetingId,
    groupSessionId,
    groupFilters
  } = options;

  if (!meetingLink || meetingLink.trim() === '') {
    throw new Error('Meeting link is required to create a session. Cannot create session without a valid meeting link.');
  }

  // Validate meeting link format (supports both Google Meet and Jitsi)
  if (!validateGoogleMeetLink(meetingLink)) {
    throw new Error(`Invalid meeting link format: ${meetingLink}. Meeting link must be a valid meeting URL (Google Meet: https://meet.google.com/abc-defg-hij or Jitsi: https://meet.jit.si/room-name).`);
  }

  // For group sessions, check if session with same groupSessionId and link exists
  if (type === 'group' && groupSessionId) {
    const existingSession = await Session.findOne({
      type: 'group',
      groupSessionId: groupSessionId,
      meetingLink: meetingLink
    });

    if (existingSession) {
      console.log(`✅ Reusing existing session for group: ${groupSessionId}`);
      
      // Add meeting to session if provided
      if (meetingId && !existingSession.meetingIds.includes(meetingId)) {
        existingSession.meetingIds.push(meetingId);
        await existingSession.save();
      }

      // Ensure participants are added
      for (const userId of participantUserIds) {
        const existingParticipant = await SessionParticipant.findOne({
          sessionId: existingSession._id,
          userId: userId
        });

        if (!existingParticipant) {
          const user = await User.findById(userId);
          await SessionParticipant.create({
            sessionId: existingSession._id,
            userId: userId,
            role: user?.role || 'student',
            meetingId: meetingId || null
          });
        } else if (meetingId && !existingParticipant.meetingId) {
          existingParticipant.meetingId = meetingId;
          await existingParticipant.save();
        }
      }

      return existingSession;
    }
  }

  // For one-to-one, check if session with same participants and time exists
  if (type === 'one_to_one' && participantUserIds.length >= 2) {
    const timeTolerance = 60 * 1000; // 1 minute
    const startTimeMin = new Date(new Date(startTime).getTime() - timeTolerance);
    const startTimeMax = new Date(new Date(startTime).getTime() + timeTolerance);

    const existingSession = await Session.findOne({
      type: 'one_to_one',
      mentorId: mentorId,
      startTime: { $gte: startTimeMin, $lte: startTimeMax },
      meetingLink: meetingLink
    });

    if (existingSession) {
      console.log(`✅ Reusing existing one-to-one session`);
      
      // Add meeting to session if provided
      if (meetingId && !existingSession.meetingIds.includes(meetingId)) {
        existingSession.meetingIds.push(meetingId);
        await existingSession.save();
      }

      return existingSession;
    }
  }

  // Create new session
  console.log(`🔒 Creating NEW session (type: ${type}, link: ${meetingLink})`);
  
  const session = await Session.create({
    type,
    title,
    description: description || '',
    mentorId,
    meetingLink,
    meetingPlatform,
    meetingId: meetingDetails?.meetingId || null,
    meetingPassword: meetingDetails?.password || null,
    meetingDialIn: meetingDetails?.dialInNumber || null,
    meetingStartUrl: meetingDetails?.startUrl || null,
    startTime: new Date(startTime),
    endTime: new Date(endTime),
    status: 'scheduled',
    meetingIds: meetingId ? [meetingId] : [],
    groupSessionId: groupSessionId || null,
    groupFilters: groupFilters || {}
  });

  // Add mentor as participant
  const Admin = require('../models/Admin');
  const admin = await Admin.findById(mentorId);
  if (admin && admin.userId) {
    const mentorUserRecord = await User.findById(admin.userId);
    if (mentorUserRecord) {
      // Check if participant already exists
      const existingMentorParticipant = await SessionParticipant.findOne({
        sessionId: session._id,
        userId: mentorUserRecord._id
      });
      
      if (!existingMentorParticipant) {
        await SessionParticipant.create({
          sessionId: session._id,
          userId: mentorUserRecord._id,
          role: 'admin',
          meetingId: meetingId || null
        });
      }
    }
  }

  // Add all participants
  for (const userId of participantUserIds) {
    const existingParticipant = await SessionParticipant.findOne({
      sessionId: session._id,
      userId: userId
    });

    if (!existingParticipant) {
      const user = await User.findById(userId);
      await SessionParticipant.create({
        sessionId: session._id,
        userId: userId,
        role: user?.role || 'student',
        meetingId: meetingId || null
      });
    }
  }

  return session;
}

module.exports = {
  checkMeetingConflicts,
  generateICSFile,
  generateMeetingLink,
  convertToTimezone,
  formatTimeInTimezone,
  getExistingGroupSessionLink,
  getExistingSingleMeetingLink,
  validateMeetingLinkUniqueness,
  validateGoogleMeetLink,
  findExistingGroupSession,
  createOrGetSession
};

