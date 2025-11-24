const { google } = require('googleapis');

/**
 * Create a real Google Meet meeting using Google Calendar API
 */
async function createGoogleMeetMeeting(meetingData) {
  // Google Service Account credentials from environment
  // Default to provided credentials if env vars not set
  const GOOGLE_CLIENT_EMAIL = process.env.GOOGLE_CLIENT_EMAIL || 'placementhub@placmenthub.iam.gserviceaccount.com';
  const GOOGLE_PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY || `-----BEGIN PRIVATE KEY-----
MIIEvwIBADANBgkqhkiG9w0BAQEFAASCBKkwggSlAgEAAoIBAQDB+JtLIxi1VZJ2
NDgYHyEGS+64SrB1NZqZ+dU7foHbwQnS+srTOMOA5+zYv0LFOclsUzJia+P1gB3a
GuZebM29uA6jtT3jInjt+7rmabACXt20h9YWpSW+MIoZxQbJeijnj9u68YPn0gvf
aWrc4mOOYCaa/N5h68d9mR3If5qv/sVju2TCzI3GfCUNErsz6gvpcFExJOuRpBXm
6mxGARR3ErtvQyB77YusxaKUpBZ29uMmFbxuXB4UsZRJ6siPhJ5rzmJWAC1x1gl5
zDEQfqnIFeSaBzayDcCclkGvQOU6Re99KHWBEHk4nszfYAdGZ58QQ5ES8upYg8bm
IDnmXUD1AgMBAAECggEAL+P2TYcRCOZjhqEub1AyOmiBfEleh1XQga80BSAfJjdj
Ok62yI81f8xjRwFz1heGImNpJ3EtY3X6CNlG4u3YnzyECsnLCZr/gfx6oPxbmz46
XWIDSuyD5ND9q86gNhrd4gw760xJbbFHwqV3n6kafPLC3VXM/x60To+BEbllowll
FVYYAeocK93bFaW7iviOG90PL9ou2DRC/IL2dMp2iepBGn72Tah01tNBHm2jqFsF
QDRPRHWQ6W7HEfJiPDWQx5b/vBQna6Lt1efDvUhhVzBeu0xz0Il/EUHRuzvBZbiE
wPfLH3Dq/IU/YoQodMPOOp452UHIIRdk5gzUiuRAiQKBgQDrb6aVfWFOuMqQSvPZ
cA+FFJWYd2QSS+ZP82JKkH5SzLJTj833iSnx4b9g3j2m+YJFzn26O5YcNQusUmgc
6nWUHQYiE+SM+LqsoWRreAYAg9meQzzNO5q1Mq4kE4EHnzFzFWqhcxecfB0ONxgy
1sB8g73HZ0+1RKjZ/2grDAWKTQKBgQDS6cxyFXFqTSHwyFtrQa69dKeJ+qZ3tFaU
eEv3xU9AyJAZQs1k9uGjMcEhaBKnEfyaypf7OY0y+pm+VGHLguNRgEFAOrSQKypw
15K6b9gpDsu4NLuDss9+mLAi4ESEWrt3zi/8Op59BMZQzVlhSEH6UhJXKxJjny1J
gQcxzXKVSQKBgQDqQCnYPWrvP6/UR68+XmAiwmthyxDXn4sla30VwZTe32pi+Acv
ztrcHwgi4p0nIMR8nkq8XIMrx5+4sjmC48lfOE2c5HwXw3dBQke/Iimeo5GIBVBe
x3pT5XwcywcrxToXTmzM/M22Vks2lJzQIJpeiVnvKBzHt+vlE1na0thEVQKBgQCQ
H0EcJ/jzKbfqoA6QMTblsUQW7hc4rxuGotlOex6X5zVIfbR6rJUs/f+6AzLTxV+2
qn/GJOKOll3eiCy3cz5AYAK2kCb4aPa8WyKhkXHFRJ4Cxs3nxZUyLcYWXueTBaka
yeNSWQAZ79xQNLJB3q1vDwwHUqBjQM8ibi/rYTdOOQKBgQDNTBnuJgeEIDIN3Jxm
+zFB0JVf9uGWvkPW+jXnNX72svePlFavB4pyuxWg3aGxAnMivRSsZIzhKCT1YlTb
JqFq9GcNgiRBIKDjsyvXKs10B3nnrlfbR9pNm5XNMWC6x0GVgDT0j1E5JS8GI9QN
Ag4K95ooWn0LT8pYY8uM5HD8cA==
-----END PRIVATE KEY-----`;
  // Use the provided calendar ID (placementhub722@gmail.com)
  // Make sure this calendar is shared with the service account email
  const GOOGLE_CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID || 'placementhub722@gmail.com';

  try {
    // 🔒 Validate and sanitize title FIRST, before any processing
    let meetingTitle = meetingData.title;
    
    // Handle null, undefined, or empty title
    if (!meetingTitle || typeof meetingTitle !== 'string') {
      meetingTitle = 'Placement Hub Meeting';
      console.warn('⚠️ Meeting title is missing or invalid, using default title');
    }
    
    // Trim whitespace
    meetingTitle = meetingTitle.trim();
    
    // If still empty after trim, use default
    if (meetingTitle.length === 0) {
      meetingTitle = 'Placement Hub Meeting';
      console.warn('⚠️ Meeting title is empty after trim, using default title');
    }
    
    // Truncate if too long (Google Calendar API limit is 1024 characters)
    if (meetingTitle.length > 1024) {
      console.warn(`⚠️ Meeting title is too long (${meetingTitle.length} chars), truncating to 1024 characters`);
      meetingTitle = meetingTitle.substring(0, 1021) + '...';
    }
    
    // Remove null characters and other problematic characters
    meetingTitle = meetingTitle.replace(/\0/g, ''); // Remove null characters
    meetingTitle = meetingTitle.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, ''); // Remove control characters
    
    // Update meetingData with sanitized title
    meetingData.title = meetingTitle;
    
    console.log('Creating Google Meet meeting with data:', {
      title: meetingData.title,
      titleLength: meetingData.title.length,
      startTime: meetingData.startTime,
      endTime: meetingData.endTime,
      timezone: meetingData.timezone
    });

    // Google Service Account credentials from environment
    // Default to provided credentials if env vars not set
    const GOOGLE_CLIENT_EMAIL = process.env.GOOGLE_CLIENT_EMAIL || 'placementhub@placmenthub.iam.gserviceaccount.com';
    const GOOGLE_PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY || `-----BEGIN PRIVATE KEY-----
MIIEvwIBADANBgkqhkiG9w0BAQEFAASCBKkwggSlAgEAAoIBAQDB+JtLIxi1VZJ2
NDgYHyEGS+64SrB1NZqZ+dU7foHbwQnS+srTOMOA5+zYv0LFOclsUzJia+P1gB3a
GuZebM29uA6jtT3jInjt+7rmabACXt20h9YWpSW+MIoZxQbJeijnj9u68YPn0gvf
aWrc4mOOYCaa/N5h68d9mR3If5qv/sVju2TCzI3GfCUNErsz6gvpcFExJOuRpBXm
6mxGARR3ErtvQyB77YusxaKUpBZ29uMmFbxuXB4UsZRJ6siPhJ5rzmJWAC1x1gl5
zDEQfqnIFeSaBzayDcCclkGvQOU6Re99KHWBEHk4nszfYAdGZ58QQ5ES8upYg8bm
IDnmXUD1AgMBAAECggEAL+P2TYcRCOZjhqEub1AyOmiBfEleh1XQga80BSAfJjdj
Ok62yI81f8xjRwFz1heGImNpJ3EtY3X6CNlG4u3YnzyECsnLCZr/gfx6oPxbmz46
XWIDSuyD5ND9q86gNhrd4gw760xJbbFHwqV3n6kafPLC3VXM/x60To+BEbllowll
FVYYAeocK93bFaW7iviOG90PL9ou2DRC/IL2dMp2iepBGn72Tah01tNBHm2jqFsF
QDRPRHWQ6W7HEfJiPDWQx5b/vBQna6Lt1efDvUhhVzBeu0xz0Il/EUHRuzvBZbiE
wPfLH3Dq/IU/YoQodMPOOp452UHIIRdk5gzUiuRAiQKBgQDrb6aVfWFOuMqQSvPZ
cA+FFJWYd2QSS+ZP82JKkH5SzLJTj833iSnx4b9g3j2m+YJFzn26O5YcNQusUmgc
6nWUHQYiE+SM+LqsoWRreAYAg9meQzzNO5q1Mq4kE4EHnzFzFWqhcxecfB0ONxgy
1sB8g73HZ0+1RKjZ/2grDAWKTQKBgQDS6cxyFXFqTSHwyFtrQa69dKeJ+qZ3tFaU
eEv3xU9AyJAZQs1k9uGjMcEhaBKnEfyaypf7OY0y+pm+VGHLguNRgEFAOrSQKypw
15K6b9gpDsu4NLuDss9+mLAi4ESEWrt3zi/8Op59BMZQzVlhSEH6UhJXKxJjny1J
gQcxzXKVSQKBgQDqQCnYPWrvP6/UR68+XmAiwmthyxDXn4sla30VwZTe32pi+Acv
ztrcHwgi4p0nIMR8nkq8XIMrx5+4sjmC48lfOE2c5HwXw3dBQke/Iimeo5GIBVBe
x3pT5XwcywcrxToXTmzM/M22Vks2lJzQIJpeiVnvKBzHt+vlE1na0thEVQKBgQCQ
H0EcJ/jzKbfqoA6QMTblsUQW7hc4rxuGotlOex6X5zVIfbR6rJUs/f+6AzLTxV+2
qn/GJOKOll3eiCy3cz5AYAK2kCb4aPa8WyKhkXHFRJ4Cxs3nxZUyLcYWXueTBaka
yeNSWQAZ79xQNLJB3q1vDwwHUqBjQM8ibi/rYTdOOQKBgQDNTBnuJgeEIDIN3Jxm
+zFB0JVf9uGWvkPW+jXnNX72svePlFavB4pyuxWg3aGxAnMivRSsZIzhKCT1YlTb
JqFq9GcNgiRBIKDjsyvXKs10B3nnrlfbR9pNm5XNMWC6x0GVgDT0j1E5JS8GI9QN
Ag4K95ooWn0LT8pYY8uM5HD8cA==
-----END PRIVATE KEY-----`;
    // Use the provided calendar ID (placementhub722@gmail.com)
    // Make sure this calendar is shared with the service account email
    const GOOGLE_CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID || 'placementhub722@gmail.com';

    const calendar = google.calendar('v3');

    // Create JWT client for service account authentication
    const privateKey = GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n');
    
    const jwtClient = new google.auth.JWT(
      GOOGLE_CLIENT_EMAIL,
      null,
      privateKey,
      ['https://www.googleapis.com/auth/calendar']
    );

    // Authorize the client
    try {
      await jwtClient.authorize();
      console.log('✅ JWT Authorization successful');
      console.log('   Using Client Email:', GOOGLE_CLIENT_EMAIL);
      console.log('   Using Calendar ID:', GOOGLE_CALENDAR_ID);
    } catch (authError) {
      console.error('❌ JWT Authorization error:', authError);
      console.error('   Client Email:', GOOGLE_CLIENT_EMAIL);
      console.error('   Calendar ID:', GOOGLE_CALENDAR_ID);
      console.error('   Error details:', {
        message: authError.message,
        code: authError.code,
        response: authError.response?.data
      });
      throw new Error(`Authentication failed: ${authError.message || authError.toString()}`);
    }

    // Use the already sanitized title from meetingData
    // (Title was sanitized at the start of the function)
    // Final safety check - ensure title is never empty or invalid
    if (!meetingTitle || typeof meetingTitle !== 'string' || meetingTitle.trim().length === 0) {
      meetingTitle = 'Placement Hub Meeting';
      console.error('⚠️ CRITICAL: Title became invalid after sanitization, using default');
    }
    
    // Ensure it's a string and trim again (safety)
    meetingTitle = String(meetingTitle).trim();
    if (meetingTitle.length === 0) {
      meetingTitle = 'Placement Hub Meeting';
    }
    
    // Final length check
    if (meetingTitle.length > 1024) {
      meetingTitle = meetingTitle.substring(0, 1021) + '...';
    }
    
    console.log(`📝 Final meeting title: "${meetingTitle}" (${meetingTitle.length} characters, type: ${typeof meetingTitle})`);

    // Helper to build event request with optional conference type
    const buildEventRequest = (conferenceType) => {
      const requestId = `meet-${require('crypto').createHash('md5')
        .update(`${meetingTitle || 'meeting'}-${meetingData.startTime || Date.now()}`)
        .digest('hex')
        .substring(0, 16)}`;

      const event = {
        summary: meetingTitle,
        description: meetingData.description || '',
        start: {
          dateTime: new Date(meetingData.startTime).toISOString(),
          timeZone: meetingData.timezone || 'UTC',
        },
        end: {
          dateTime: new Date(meetingData.endTime).toISOString(),
          timeZone: meetingData.timezone || 'UTC',
        },
        conferenceData: {
          createRequest: {
            requestId
          }
        },
      };

      if (conferenceType) {
        event.conferenceData.createRequest.conferenceSolutionKey = {
          type: conferenceType
        };
      }

      return event;
    };

    // ❌ Service accounts cannot invite attendees without Domain-Wide Delegation
    // We skip adding attendees - they can join using the meeting link directly
    // The meeting link will still be created and work perfectly
    // if (meetingData.attendeeEmail) {
    //   event.attendees = [{ email: meetingData.attendeeEmail }];
    // }

    // Helper to extract meet link from response
    const extractMeetLink = (data) => {
      if (!data) return null;
      const entryPoints = data.conferenceData?.entryPoints || [];
      const videoEntry = entryPoints.find(ep => ep.entryPointType === 'video');
      return videoEntry?.uri || data.hangoutLink || entryPoints[0]?.uri || null;
    };

    // Insert the event with Meet link
    const conferenceTypeFallbacks = [null, 'hangoutsMeet', 'eventHangout', 'eventNamedHangout'];
    const invalidConferenceType = (error) => {
      const msg = error.response?.data?.error?.message || error.message || '';
      return msg.toLowerCase().includes('invalid conference type');
    };

    const handleInsertError = (insertError) => {
      console.error('Calendar API insert error:', insertError);
      console.error('Error response:', insertError.response?.data);
      console.error('Error code:', insertError.code);
      console.error('Error message:', insertError.message);
      
      // Check for specific error about invalid summary/title
      const errorMessage = insertError.response?.data?.error?.message || insertError.message || '';
      const errorDetails = insertError.response?.data?.error || {};
      const errorReason = errorDetails.reason || '';
      
      if (errorMessage.toLowerCase().includes('invalid') && 
          (errorMessage.toLowerCase().includes('summary') || 
           errorMessage.toLowerCase().includes('title') ||
           errorMessage.toLowerCase().includes('video') ||
           errorMessage.toLowerCase().includes('name'))) {
        throw new Error(`Invalid meeting title: ${errorMessage}. Please ensure the title is not empty, is under 1024 characters, and contains valid characters.`);
      }
      
      // Check for API not enabled error
      if (errorReason === 'accessNotConfigured' || errorMessage.includes('has not been used') || errorMessage.includes('is disabled')) {
        const projectId = errorMessage.match(/project (\d+)/)?.[1] || 'your project';
        const enableUrl = errorMessage.match(/https:\/\/[^\s]+/)?.[0] || `https://console.cloud.google.com/apis/library/calendar-json.googleapis.com?project=${projectId}`;
        throw new Error(`Google Calendar API is not enabled. Please enable it by visiting: ${enableUrl}\n\nSteps:\n1. Click the link above\n2. Click "Enable" button\n3. Wait 1-2 minutes for it to propagate\n4. Try again`);
      }
      
      // Check for service account attendee invitation error
      if (errorReason === 'forbiddenForServiceAccounts' || errorMessage.includes('cannot invite attendees') || errorMessage.includes('Domain-Wide Delegation')) {
        throw new Error(`Service accounts cannot invite attendees. The meeting link will be created without attendees - participants can join using the link directly. This is a Google limitation for service accounts.`);
      }
      
      // Provide more helpful error messages
      if (insertError.code === 403) {
        if (errorMessage.includes('not found') || errorMessage.includes('404')) {
          throw new Error(`Calendar "${GOOGLE_CALENDAR_ID}" not found or not accessible. Please ensure: 1) The calendar exists, 2) It is shared with "${GOOGLE_CLIENT_EMAIL}" with "Make changes to events" permission.`);
        } else if (errorMessage.includes('insufficient') || errorMessage.includes('permission')) {
          throw new Error(`Permission denied. Please share the calendar "${GOOGLE_CALENDAR_ID}" with the service account "${GOOGLE_CLIENT_EMAIL}" with "Make changes to events" permission in Google Calendar settings.`);
        } else {
          throw new Error(`Permission denied (403): ${errorMessage}. Solutions: 1) Enable Calendar API in Google Cloud Console, 2) Share calendar "${GOOGLE_CALENDAR_ID}" with "${GOOGLE_CLIENT_EMAIL}" with "Make changes to events" permission.`);
        }
      } else if (insertError.code === 404) {
        throw new Error(`Calendar not found (404): "${GOOGLE_CALENDAR_ID}". For service accounts, use the service account email as calendar ID, or share a calendar with "${GOOGLE_CLIENT_EMAIL}".`);
      } else if (insertError.code === 400) {
        // Bad request - often related to invalid data
        throw new Error(`Invalid request (400): ${errorMessage}. Please check your meeting data (title, dates, etc.).`);
      } else if (errorMessage) {
        throw new Error(`Failed to create calendar event: ${errorMessage}`);
      } else {
        throw new Error(`Failed to create calendar event: ${insertError.toString()}`);
      }
    };

    let response;
    let meetingLink = null;
    let lastError = null;
    const createdEventsToCleanup = [];

    for (const conferenceType of conferenceTypeFallbacks) {
      try {
        const eventRequest = buildEventRequest(conferenceType);
        response = await calendar.events.insert({
          auth: jwtClient,
          calendarId: GOOGLE_CALENDAR_ID,
          conferenceDataVersion: 1,
          requestBody: eventRequest,
        });
        if (conferenceType) {
          console.log(`✅ Conference creation succeeded with conference type: ${conferenceType}`);
        } else {
          console.log('✅ Conference creation succeeded without explicit conference type (Google default).');
        }

        meetingLink = extractMeetLink(response.data);
        if (meetingLink) {
          console.log(`🔗 Meet link returned (conference type: ${conferenceType || 'default'}) -> ${meetingLink}`);
          break;
        } else {
          console.warn(`⚠️ No Meet link returned (conference type: ${conferenceType || 'default'}). Response data:`, response.data);
          if (response?.data?.id) {
            createdEventsToCleanup.push(response.data.id);
            try {
              await calendar.events.delete({ calendarId: GOOGLE_CALENDAR_ID, eventId: response.data.id });
              console.log(`🧹 Deleted event without meet link (ID: ${response.data.id})`);
            } catch (deleteError) {
              console.error('⚠️ Failed to delete event without meet link:', deleteError);
            }
          }
          continue;
        }
      } catch (insertError) {
        lastError = insertError;
        if (invalidConferenceType(insertError)) {
          console.warn(`⚠️ Invalid conference type "${conferenceType || 'default'}". Trying next fallback...`);
          continue;
        }
        handleInsertError(insertError); // Will throw
      }
    }

    if (!meetingLink) {
      if (lastError) {
        handleInsertError(lastError);
      }
      console.error('❌ Unable to obtain Meet link after trying all conference types.');
      console.error('   Last response:', response?.data);
      throw new Error('Google Calendar API did not return a Meet link. Please ensure Google Meet is enabled for this calendar.');
    }

    // 🔒 Validate the link format before returning
    const { validateGoogleMeetLink } = require('../utils/meetingUtils');
    if (!validateGoogleMeetLink(meetingLink)) {
      console.error('❌ CRITICAL: Invalid meeting link format received from API:', meetingLink);
      throw new Error(`Invalid meeting link format received from API: ${meetingLink}. Expected format: Google Meet (https://meet.google.com/abc-defg-hij) or Jitsi (https://meet.jit.si/room-name)`);
    }

    console.log(`✅ Valid meeting link created: ${meetingLink}`);

    return {
      meetingLink: meetingLink,
      meetingId: response?.data?.id || null,
      joinUrl: meetingLink,
      dialInNumber: response?.data?.conferenceData?.entryPoints?.find(ep => ep.entryPointType === 'phone')?.uri || null,
      password: null,
      calendarEventId: response?.data?.id || null,
      startUrl: meetingLink // For Google Meet, start and join URLs are the same
    };
  } catch (error) {
    console.error('Error creating Google Meet meeting:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      response: error.response?.data,
      stack: error.stack
    });
    
    // ❌ CRITICAL: Do NOT generate fallback links - they are invalid and cause "Invalid video call name" errors
    // Google Meet links MUST be created via Google Calendar API
    // If API fails, we must throw an error instead of creating fake links
    if (error.code === 403 || error.message?.includes('Permission') || error.message?.includes('403')) {
      console.error('❌ CRITICAL ERROR: Google Calendar API permission denied (403).');
      console.error('   Client Email:', GOOGLE_CLIENT_EMAIL);
      console.error('   Calendar ID:', GOOGLE_CALENDAR_ID);
      console.error('   Error Response:', error.response?.data);
      
      // Check if it's a calendar sharing issue
      const errorMessage = error.response?.data?.error?.message || error.message || '';
      if (errorMessage.includes('not found') || errorMessage.includes('404')) {
        throw new Error(`Calendar "${GOOGLE_CALENDAR_ID}" not found or not accessible. Please ensure: 1) The calendar exists, 2) It is shared with "${GOOGLE_CLIENT_EMAIL}" with "Make changes to events" permission.`);
      } else if (errorMessage.includes('insufficient') || errorMessage.includes('permission')) {
        throw new Error(`Permission denied. Please share the calendar "${GOOGLE_CALENDAR_ID}" with the service account "${GOOGLE_CLIENT_EMAIL}" with "Make changes to events" permission in Google Calendar settings.`);
      } else {
        throw new Error(`Google Calendar API permission denied (403). Please ensure: 1) Google Calendar API is enabled in Google Cloud Console, 2) Calendar "${GOOGLE_CALENDAR_ID}" is shared with "${GOOGLE_CLIENT_EMAIL}" with "Make changes to events" permission, 3) Environment variables GOOGLE_CLIENT_EMAIL, GOOGLE_PRIVATE_KEY, and GOOGLE_CALENDAR_ID are set correctly in Render.`);
      }
    }
    
    throw new Error(`Failed to create Google Meet meeting: ${error.message || error.toString()}`);
  }
}

/**
 * Create a Jitsi meeting (no API required - just generate unique URL)
 */
async function createJitsiMeeting(meetingData) {
  const { generateJitsiLink } = require('../utils/jitsi');
  
  // Generate unique meeting ID for the link
  const crypto = require('crypto');
  const meetingId = crypto.createHash('md5')
    .update(`${meetingData.title || 'meeting'}-${meetingData.startTime || Date.now()}`)
    .digest('hex')
    .substring(0, 12);
  
  const meetingLink = generateJitsiLink(meetingId, 'placementhub');
  
  console.log(`✅ Jitsi meeting link generated: ${meetingLink}`);
  
  return {
    meetingLink: meetingLink,
    meetingId: meetingId,
    joinUrl: meetingLink,
    dialInNumber: null,
    password: null,
    startUrl: meetingLink,
    note: 'Jitsi meeting - no authentication required, unlimited participants'
  };
}

/**
 * Create a real meeting (supports Google Meet and Jitsi)
 */
async function createRealMeeting(platform, meetingData) {
  if (platform === 'jitsi') {
    return await createJitsiMeeting(meetingData);
  } else if (platform === 'google_meet') {
    return await createGoogleMeetMeeting(meetingData);
  } else {
    throw new Error(`Unsupported meeting platform: ${platform}. Supported platforms: 'google_meet', 'jitsi'`);
  }
}

module.exports = {
  createRealMeeting,
  createGoogleMeetMeeting,
  createJitsiMeeting
};
