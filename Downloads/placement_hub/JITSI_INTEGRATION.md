# Jitsi Integration - Complete ✅

## Overview
The system now uses **Jitsi** as the default meeting platform instead of Google Meet. Jitsi is a free, open-source video conferencing solution that requires **no API keys, no authentication, and no billing**.

## What Changed

### 1. **New Jitsi Link Generator** (`server/utils/jitsi.js`)
- Generates unique Jitsi meeting URLs: `https://meet.jit.si/placementhub-{id}-{random}`
- Includes validation function for Jitsi links
- No external API calls required

### 2. **Updated Meeting Service** (`server/services/meetingService.js`)
- Added `createJitsiMeeting()` function
- Updated `createRealMeeting()` to support both `'jitsi'` and `'google_meet'` platforms
- Default platform is now `'jitsi'`

### 3. **Updated Models**
- **Meeting Model**: Added `'jitsi'` to `meetingPlatform` enum, default changed to `'jitsi'`
- **Session Model**: Added `'jitsi'` to `meetingPlatform` enum, default changed to `'jitsi'`

### 4. **Updated Validation** (`server/utils/meetingUtils.js`)
- `validateGoogleMeetLink()` now auto-detects platform (Google Meet or Jitsi) from URL
- New `validateMeetingLink()` function supports multiple platforms
- Backward compatible with existing Google Meet links

### 5. **Updated Routes**
- All meeting creation routes now default to `'jitsi'` platform
- Validation works for both Jitsi and Google Meet links

## How It Works

### Meeting Link Generation
When a meeting is created:
1. System generates a unique meeting ID (hash of title + start time)
2. Creates Jitsi URL: `https://meet.jit.si/placementhub-{id}-{random}`
3. Stores the link in MongoDB (`session.meeting_link` or `meeting.meetingLink`)
4. All participants use the same link

### Example Jitsi Links
```
https://meet.jit.si/placementhub-64fa12ab3c29-r8x92k
https://meet.jit.si/placementhub-abc123def456-xyz789
```

## Benefits

✅ **No API Setup Required** - No Google Calendar API, no service accounts, no OAuth  
✅ **No Billing** - Completely free, unlimited meetings  
✅ **Unlimited Participants** - No participant limits  
✅ **No Authentication** - Participants join directly via link  
✅ **Works Immediately** - No configuration needed  
✅ **Production Ready** - Jitsi is used by thousands of organizations  

## Usage

### Creating a Meeting
The system automatically uses Jitsi when creating meetings. No changes needed in the frontend - just use the `meetingLink` as before.

### Joining a Meeting
Participants click the link and join directly in their browser. No login required.

### Optional: Embed Jitsi in Your Site
If you want to embed the meeting in your website:

```html
<iframe
  src="https://meet.jit.si/placementhub-12345"
  style="height: 100vh; width: 100%; border: 0;"
  allow="camera; microphone; fullscreen"
/>
```

## Platform Support

The system now supports:
- **Jitsi** (default) - Free, no setup required
- **Google Meet** - Still supported if you have Google Workspace

To use Google Meet instead of Jitsi, set `meetingPlatform: 'google_meet'` when creating meetings.

## Migration Notes

- Existing Google Meet links will continue to work
- New meetings default to Jitsi
- Validation accepts both Google Meet and Jitsi links
- No database migration required - the `meetingPlatform` field will be set to `'jitsi'` for new meetings

## Testing

1. Create a new meeting through the admin panel
2. Check that the `meetingLink` starts with `https://meet.jit.si/`
3. Click the link to verify it opens a Jitsi meeting room
4. Test joining from multiple browsers/devices

## Troubleshooting

**Issue**: Link doesn't work  
**Solution**: Verify the link format matches `https://meet.jit.si/room-name`. Check browser console for errors.

**Issue**: Want to switch back to Google Meet  
**Solution**: Set `meetingPlatform: 'google_meet'` in meeting creation requests. Ensure Google Calendar API is configured.

---

**Status**: ✅ Complete and ready for production use!

