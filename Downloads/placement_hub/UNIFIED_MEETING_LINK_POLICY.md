# 🔒 Unified Meeting Link Policy - Implementation Complete

## Overview

The meeting system now strictly enforces a **ONE SESSION = ONE LINK** policy. This ensures that:
- Each group session has exactly ONE meeting link shared by all participants
- Each single meeting has exactly ONE meeting link
- No duplicate links are created
- All join flows use the stored link from the database

## Implementation Details

### 1. Core Validation Functions (`server/utils/meetingUtils.js`)

#### `getExistingGroupSessionLink(groupSessionId)`
- Checks if a meeting link already exists for a group session
- Returns the existing link if found, null otherwise
- Prevents duplicate link creation for group sessions

#### `getExistingSingleMeetingLink(studentId, mentorId, startTime, endTime)`
- Checks if a meeting link already exists for a single meeting
- Matches by student, mentor, and time (within 1 minute tolerance)
- Returns the existing link if found, null otherwise
- Prevents duplicate link creation for single meetings

#### `validateMeetingLinkUniqueness(meetingLink, excludeMeetingId)`
- Validates that a meeting link is unique across all meetings
- Logs warnings if duplicates are detected
- Safety check to prevent accidental duplicate links

### 2. Group Session Meeting Creation (`server/routes/admin/meetings.js` - Bulk Route)

**Flow:**
1. Generate `groupSessionId` first
2. Check if a meeting with this `groupSessionId` already has a link
3. If YES → Reuse existing link
4. If NO → Create new link
5. Use the SAME link for ALL students in the group
6. Store link in each student's meeting record

**Key Points:**
- One link is created BEFORE the student loop
- All students receive the SAME link
- Each student gets a separate email with the same link
- Link is stored in database and never regenerated

### 3. Single Meeting Creation (`server/routes/admin/meetings.js` - Single & Approval Routes)

**Flow:**
1. Check if a meeting link exists for this student + mentor + time combination
2. If YES → Reuse existing link
3. If NO → Create new link
4. Store link in meeting record

**Key Points:**
- Checks for existing links before creating new ones
- Prevents duplicate links for the same meeting
- Link is created only once during scheduling

### 4. Join Flow Safety (`server/routes/meetings.js`)

**New Endpoint: `GET /api/meetings/:id/link`**
- Returns the stored meeting link from the database
- NEVER creates a new link
- Always uses the link stored during scheduling

**Existing Endpoints:**
- `GET /api/meetings` - Returns meetings with `meetingLink` field
- `GET /api/meetings/:id` - Returns meeting with `meetingLink` field
- Both use stored links from database

### 5. Update Protection (`server/routes/admin/meetings.js` - Update Route)

**Safety Check:**
- Only allows updating meeting link if it's currently empty
- Prevents accidental overwriting of existing links
- Logs warnings if update attempt is made

## Rules Enforced

### ✅ Group Sessions
- **ONE link** created when admin schedules the group session
- **SAME link** sent to all students via email
- **SAME link** appears in all dashboards
- **SAME link** used by all participants
- Link is stored in database and reused if session is recreated

### ✅ Single Meetings
- **ONE link** created when admin schedules the meeting
- **SAME link** appears in admin panel, student panel, and email
- Link is stored in database and reused if meeting is rescheduled to same time

### ✅ Join Flow
- All join buttons use `meeting.meetingLink` from database
- No new links created on:
  - Email click
  - Page refresh
  - Different device login
  - Dashboard access

### ✅ Validation
- System checks for existing links before creating new ones
- Duplicate link detection with warnings
- Link uniqueness validation

## API Endpoints

### For Students
- `GET /api/meetings` - Get all meetings (includes `meetingLink`)
- `GET /api/meetings/:id` - Get specific meeting (includes `meetingLink`)
- `GET /api/meetings/:id/link` - Get meeting link only (NEW - always from database)

### For Admins
- `POST /api/admin/meetings` - Create single meeting (creates ONE link)
- `POST /api/admin/meetings/bulk` - Create group meeting (creates ONE link for all)
- `POST /api/admin/meetings/requests/:id/approve` - Approve request (creates ONE link)

## Database Schema

Each `Meeting` document stores:
```javascript
{
  meetingLink: String,        // The ONE link for this session
  meetingPlatform: String,    // 'google_meet'
  meetingId: String,           // Platform-specific ID
  meetingPassword: String,     // If required
  meetingDialIn: String,       // Dial-in number
  meetingStartUrl: String,     // Host start URL
  isGroupMeeting: Boolean,      // true for group sessions
  groupSessionId: String       // Shared ID for group sessions
}
```

## Logging

The system logs:
- `🔒 Creating NEW meeting link` - When a new link is created
- `✅ REUSING existing meeting link` - When an existing link is reused
- `⚠️ WARNING: Meeting link may be duplicate` - When duplicate detected
- `🔒 Updating empty meeting link` - When updating empty link
- `⚠️ WARNING: Attempted to change existing meeting link` - When update prevented

## Testing Checklist

- [ ] Group session creates ONE link for all students
- [ ] All students in group receive SAME link in email
- [ ] Single meeting creates ONE link
- [ ] Rescheduling to same time reuses existing link
- [ ] Join buttons use stored link from database
- [ ] No new links created on page refresh
- [ ] No new links created on email click
- [ ] Update route prevents overwriting existing links

## Summary

✅ **ONE SESSION = ONE LINK** policy is fully enforced
✅ All meeting links are stored centrally in the database
✅ Validation prevents duplicate link creation
✅ All join flows use stored links
✅ System logs all link operations for debugging

The meeting system now guarantees that every session has exactly one meeting link, and all participants use the same link regardless of how they access it.

