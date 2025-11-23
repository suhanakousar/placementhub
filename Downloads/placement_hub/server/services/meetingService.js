const axios = require('axios');
const { google } = require('googleapis');

/**
 * Create a real Google Meet meeting using Google Calendar API
 */
async function createGoogleMeetMeeting(meetingData) {
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
      const token = await jwtClient.authorize();
      console.log('JWT Authorization successful');
    } catch (authError) {
      console.error('JWT Authorization error:', authError);
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

    // Create calendar event with Google Meet
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
          // 🔒 UNIFIED MEETING LINK POLICY: Use deterministic requestId based on meeting data
          // This ensures the same meeting data generates the same requestId, which helps with link consistency
          requestId: `meet-${require('crypto').createHash('md5').update(`${meetingTitle || 'meeting'}-${meetingData.startTime || Date.now()}`).digest('hex').substring(0, 16)}`,
          conferenceSolutionKey: {
            type: 'hangoutsMeet'
          }
        }
      },
    };

    // Add attendee if email is provided
    if (meetingData.attendeeEmail) {
      event.attendees = [{ email: meetingData.attendeeEmail }];
    }

    // Insert the event with Meet link
    let response;
    try {
      response = await calendar.events.insert({
        auth: jwtClient,
        calendarId: GOOGLE_CALENDAR_ID,
        conferenceDataVersion: 1,
        requestBody: event,
      });
    } catch (insertError) {
      console.error('Calendar API insert error:', insertError);
      console.error('Error response:', insertError.response?.data);
      console.error('Error code:', insertError.code);
      console.error('Error message:', insertError.message);
      
      // Check for specific error about invalid summary/title
      const errorMessage = insertError.response?.data?.error?.message || insertError.message || '';
      const errorDetails = insertError.response?.data?.error || {};
      
      if (errorMessage.toLowerCase().includes('invalid') && 
          (errorMessage.toLowerCase().includes('summary') || 
           errorMessage.toLowerCase().includes('title') ||
           errorMessage.toLowerCase().includes('video') ||
           errorMessage.toLowerCase().includes('name'))) {
        throw new Error(`Invalid meeting title: ${errorMessage}. Please ensure the title is not empty, is under 1024 characters, and contains valid characters.`);
      }
      
      // Provide more helpful error messages
      if (insertError.code === 403) {
        throw new Error(`Permission denied (403): ${errorMessage}. Solutions: 1) Enable Calendar API in Google Cloud Console, 2) Use service account email "${GOOGLE_CLIENT_EMAIL}" as calendar ID, 3) Share a calendar with "${GOOGLE_CLIENT_EMAIL}" and use that calendar ID.`);
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
    }

    // Extract the Meet link from the response
    const meetLink = response.data.conferenceData?.entryPoints?.[0]?.uri || 
                     response.data.hangoutLink ||
                     response.data.conferenceData?.entryPoints?.[0]?.uri;

    if (!meetLink) {
      throw new Error('Failed to create Google Meet link: No link returned from Google Calendar API');
    }

    // 🔒 Validate the link format before returning
    const { validateGoogleMeetLink } = require('../utils/meetingUtils');
    if (!validateGoogleMeetLink(meetLink)) {
      console.error('❌ CRITICAL: Invalid Google Meet link format received from API:', meetLink);
      throw new Error(`Invalid Google Meet link format received from API: ${meetLink}. Expected format: https://meet.google.com/abc-defg-hij`);
    }

    console.log(`✅ Valid Google Meet link created: ${meetLink}`);

    return {
      meetingLink: meetLink,
      meetingId: response.data.id,
      joinUrl: meetLink,
      dialInNumber: response.data.conferenceData?.entryPoints?.find(ep => ep.entryPointType === 'phone')?.uri || null,
      password: null,
      calendarEventId: response.data.id,
      startUrl: meetLink // For Google Meet, start and join URLs are the same
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
      console.error('❌ CRITICAL ERROR: Google Calendar API permission denied.');
      console.error('   Cannot create valid Google Meet link without API access.');
      console.error('   Solution: Configure Google Calendar API credentials in environment variables:');
      console.error('   - GOOGLE_CLIENT_EMAIL');
      console.error('   - GOOGLE_PRIVATE_KEY');
      console.error('   - GOOGLE_CALENDAR_ID');
      throw new Error('Google Calendar API not configured. Cannot create valid Google Meet link. Please configure GOOGLE_CLIENT_EMAIL, GOOGLE_PRIVATE_KEY, and GOOGLE_CALENDAR_ID environment variables.');
    }
    
    throw new Error(`Failed to create Google Meet meeting: ${error.message || error.toString()}`);
  }
}

/**
 * Create a real meeting (only Google Meet supported)
 */
async function createRealMeeting(platform, meetingData) {
  // Only Google Meet is supported
  if (platform !== 'google_meet' && platform !== 'google_meet') {
    throw new Error('Only Google Meet is supported. Please select Google Meet as the meeting platform.');
  }

  return await createGoogleMeetMeeting(meetingData);
}

module.exports = {
  createRealMeeting,
  createGoogleMeetMeeting
};
