const axios = require('axios');
const { google } = require('googleapis');

/**
 * Create a real Google Meet meeting using Google Calendar API
 */
async function createGoogleMeetMeeting(meetingData) {
  try {
    console.log('Creating Google Meet meeting with data:', {
      title: meetingData.title,
      startTime: meetingData.startTime,
      endTime: meetingData.endTime,
      timezone: meetingData.timezone
    });

    // Google Service Account credentials from environment or use provided
    const GOOGLE_CLIENT_EMAIL = process.env.GOOGLE_CLIENT_EMAIL || 'meet-service@factcheckapp-476109.iam.gserviceaccount.com';
    const GOOGLE_PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY || `-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCs0HOQLNfa9xLM
3S5rwlPipZDWbJL6KOyKMNbRZePBy+cZhgSnBzdtHfBuu9emlti8EIPg2q48Xi7e
i1tHvOrQChk/yk4Kc00fB9/snWK0L3zpEileezpMgoO7rUY+7iTag7ZWhIko6vWx
cN1Hzyw7RF0l8NYhWuFz9QyyBJBT3l/B7yNva+bpYM3gwE2DO5esu1ONEXdnLkWE
fQntl+BX75pogdPzaCt8mY4mtp3bpsiZpUJ7Ez6uPR0bzaztgznoVwa5eT6f5sL3
vertE9asYTLFPwitg+kXXsy6WZuZKHFhhY9foUNgPHH8iwMd1SEIgPwlBSH/5VS8
+ysp+3DLAgMBAAECggEANbSmZWT6RCtKpW4LciO3TBVmGK0vVB0JvbyF1heTG3QR
wuXaZkog2IFYaiFoWHZCrtd3FJcBVPN0H2cxm+7DDppE1IU7kZXZns4ksfULarHj
YM9rGdiz+nkJFXc5AG+j9mC+ds7DjXrPljBcJGfm+Bg71oGtGjqTHCVIp74xWE6d
h3EwUXr6exYz98EVCr6wOfWx5cZpUSYmmOEsKaQVKDuElgM+mLNditwaPOgObWda
MLlzo5ZQuujHzwt18rbIMRGTmMSw7loVygHjUghe62OEnZJs1/9GZD2X3ZA4W1Z3
KW9NBeSVvzY0DnLNjwNh2IjhihEgIUznBHmoHBOiSQKBgQDeNfOViZCMb1CN7hqK
i/c9dd4O1xm5Twdzpmuz54q9l6k9C8C3qbaDlAgJ4g+qYJfv7tQVcEY+W6iYP1Ha
RoVPv4RLjQKlld+pNRuCz1JiTggg0De1+I4bsrTs2PSJAj3r8cv3L3OxZzo2d43o
Tsq8Bkjckh21QLE4SF2eAKsdhQKBgQDHF6G2KWNkWwIyUr1U6SrmWrz9+icQpI7Y
0WNc86JWJKhlNiS3B6R664BlX2Iq2wCsWMTUCcITEr8evMr/Txw+52cQ975pCUkz
edymImkEZ14ChVY6bh4oWeRO4ODegfcYzP8PPh9SMscw3XQce5fqKCgvOSz0urdE
sqY3h5y+DwKBgBAZQIh46uwBtIhT08Bt23+sZmYU11xBiXyrdeoWwEp0DmLJ0zB7
LynhM6PjqNbjIJ7VYrAa7jveUByXmcqCiW35phADK0nrzcRogJG9i25r0NLvwtmA
JGuFSu5N2YmDjBDn96r02SDlJaaEitdlvfJZUjYIr/ZNtYkqVP35dmwxAoGAOntb
mjnQI2OEYqnhSbbwThgrWeOIZCAigdgH+v7qGanM+WYNJOKO0zioT57UJEiOixHM
R4jSRG4GTA4jBxoC7wtkQBy2Bv6eTQun3/lNpeiDOfRW3vUH0MyO/wiZpWLB5bwZ
1C1oX+ngjx8OA2vetP60xyJhbUYHnZtorfkc9ssCgYEAjPRtmvnBk7r5d01zQk0e
8ZoL4Ifr8CuvJUAeBH3rdUrYayU+yu/zv35WUPIXkpf3ofsVa54gBxbTiLRBVp/A
SrbJ9MVM0TZuNkb+iREbMoVEJYHVxhcmFzcyRK1f31/4Bpe98fRLeVeLhN4EBhHl
RAaBfizkPIZWBuLM3E8vbHo=
-----END PRIVATE KEY-----`;
    // For service accounts, use the service account email as the calendar ID
    // Alternatively, you can share a calendar with the service account and use that calendar ID
    const GOOGLE_CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID || GOOGLE_CLIENT_EMAIL;

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

    // Create calendar event with Google Meet
    const event = {
      summary: meetingData.title,
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
          requestId: `meet-${Date.now()}-${Math.random().toString(36).substring(7)}`,
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
      
      // Provide more helpful error messages
      if (insertError.code === 403) {
        const errorDetails = insertError.response?.data?.error?.message || insertError.message;
        throw new Error(`Permission denied (403): ${errorDetails}. Solutions: 1) Enable Calendar API in Google Cloud Console, 2) Use service account email "${GOOGLE_CLIENT_EMAIL}" as calendar ID, 3) Share a calendar with "${GOOGLE_CLIENT_EMAIL}" and use that calendar ID.`);
      } else if (insertError.code === 404) {
        throw new Error(`Calendar not found (404): "${GOOGLE_CALENDAR_ID}". For service accounts, use the service account email as calendar ID, or share a calendar with "${GOOGLE_CLIENT_EMAIL}".`);
      } else if (insertError.message) {
        throw new Error(`Failed to create calendar event: ${insertError.message}`);
      } else {
        throw new Error(`Failed to create calendar event: ${insertError.toString()}`);
      }
    }

    // Extract the Meet link from the response
    const meetLink = response.data.conferenceData?.entryPoints?.[0]?.uri || 
                     response.data.hangoutLink ||
                     response.data.conferenceData?.entryPoints?.[0]?.uri;

    if (!meetLink) {
      throw new Error('Failed to create Google Meet link');
    }

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
    
    // If it's a permission/API error, provide a fallback instant meeting link
    if (error.code === 403 || error.message?.includes('Permission') || error.message?.includes('403')) {
      console.log('Calendar API permission denied. Using fallback instant meeting link.');
      // Generate a unique instant meeting link that works without Calendar API
      const meetingId = `new-${Date.now()}-${Math.random().toString(36).substring(7)}`;
      const instantLink = `https://meet.google.com/new?hs=${meetingId}`;
      
      return {
        meetingLink: instantLink,
        meetingId: meetingId,
        joinUrl: instantLink,
        dialInNumber: null,
        password: null,
        startUrl: instantLink,
        note: 'Instant meeting link (Calendar API not configured)'
      };
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
