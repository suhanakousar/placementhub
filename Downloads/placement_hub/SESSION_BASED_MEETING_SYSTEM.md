# Session-Based Meeting System Implementation

## Overview

This document describes the implementation of a Session-based Meeting System that enforces the **ONE SESSION = ONE MEETING LINK** policy. This ensures that all participants (admin and students) always join the same meeting room, regardless of where they click "Join" from (web app, email, notifications).

## Architecture

### Data Models

#### 1. Session Model (`server/models/Session.js`)
- **Purpose**: Represents a meeting session with a single meeting link
- **Key Fields**:
  - `type`: 'group' or 'one_to_one'
  - `meetingLink`: The single meeting link shared by all participants
  - `mentorId`: Reference to the admin/mentor hosting the session
  - `meetingIds`: Array of Meeting IDs linked to this session
  - `status`: 'scheduled', 'ongoing', 'completed', 'cancelled'

#### 2. SessionParticipant Model (`server/models/SessionParticipant.js`)
- **Purpose**: Tracks participants in a session
- **Key Fields**:
  - `sessionId`: Reference to Session
  - `userId`: Reference to User (admin or student)
  - `role`: 'admin' or 'student'
  - `joinStatus`: 'not_joined', 'joined', 'left'
  - `meetingId`: Reference to related Meeting (for backward compatibility)

### Core Business Rules

1. **One Session = One Link**: Each session has exactly one `meetingLink` stored in the Session model
2. **Link Creation**: Meeting links are created ONLY when a session is created, never on join
3. **Link Reuse**: All join flows use the stored `session.meetingLink`, never create new links
4. **Group Sessions**: One session with multiple participants sharing the same link
5. **1-on-1 Sessions**: One session per student-mentor pair sharing the same link

## API Endpoints

### Session Endpoints

#### `GET /api/sessions/:id`
Get session details including participants.

#### `GET /api/sessions/:id/join-link`
**Unified join endpoint for all users**
- Returns the stored `meetingLink` from the session
- **NEVER creates a new link**
- Updates participant `joinStatus` to 'joined'
- Validates user is a participant
- Returns error if session is cancelled or link not available

#### `POST /api/sessions/:id/leave`
Mark participant as left (updates `joinStatus` to 'left').

### Meeting Endpoints (Updated)

#### `GET /api/meetings/:id/link` (Student)
- Finds the session associated with the meeting
- Returns the session's `meetingLink`
- Falls back to `meeting.meetingLink` if session not found (backward compatibility)

#### `GET /api/admin/meetings/:id/join-link` (Admin)
- Finds the session associated with the meeting
- Returns the session's `meetingLink`
- Falls back to `meeting.meetingLink` if session not found (backward compatibility)

## Meeting Creation Flow

### Single Meeting (1-on-1)

1. Admin creates meeting via `POST /api/admin/meetings`
2. System checks for existing meeting link (by student + mentor + time)
3. If no link exists, creates new meeting link via meeting provider
4. Creates Meeting record with `meetingLink`
5. **Creates Session record** with:
   - `type: 'one_to_one'`
   - `meetingLink`: The generated link
   - Links Meeting to Session via `meetingIds`
6. **Creates SessionParticipant records** for:
   - Admin/mentor (role: 'admin')
   - Student (role: 'student')

### Group Meeting

1. Admin creates group meeting via `POST /api/admin/meetings/bulk`
2. System generates `groupSessionId`
3. Checks for existing session with same `groupSessionId` and link
4. If no link exists, creates new meeting link via meeting provider
5. **Creates ONE Session record** with:
   - `type: 'group'`
   - `meetingLink`: The generated link (shared by all)
   - `groupSessionId`: For tracking
6. **Creates SessionParticipant records** for:
   - Admin/mentor
   - All students in the group
7. Creates individual Meeting records for each student (for backward compatibility)
8. Links all Meeting records to the Session via `meetingIds`

## Join Flow

### For Any User (Admin or Student)

1. User clicks "Join" button (from dashboard, email, notification)
2. Frontend calls:
   - `GET /api/sessions/:id/join-link` (if session ID is known), OR
   - `GET /api/meetings/:id/join-link` (if only meeting ID is known)
3. Backend:
   - Finds session by meeting ID (if needed)
   - Validates user is a participant
   - Returns stored `session.meetingLink`
   - Updates participant `joinStatus` to 'joined'
   - **NEVER creates a new link**
4. Frontend redirects user to the returned `meetingLink`

## Key Implementation Details

### Session Creation Helper

The `createOrGetSession()` function in `server/utils/meetingUtils.js`:
- Checks for existing sessions before creating new ones
- For group sessions: matches by `groupSessionId` and `meetingLink`
- For 1-on-1: matches by mentor, time (within 1 minute), and `meetingLink`
- Ensures all participants are added to `SessionParticipant` records
- Links meetings to sessions via `meetingIds` array

### Backward Compatibility

- Meeting records still store `meetingLink` (for existing meetings)
- Join endpoints fall back to `meeting.meetingLink` if session not found
- Existing frontend code continues to work without changes
- New meetings automatically create sessions

### Link Uniqueness

- System validates link uniqueness before creating sessions
- Prevents duplicate links for the same session
- Logs warnings if duplicates are detected

## Frontend Integration

### Current State (Backward Compatible)

The frontend can continue using `meeting.meetingLink` directly. The system ensures:
- All meetings have links stored
- Group sessions share the same link across all meeting records
- Join buttons work as before

### Recommended Update (Optional)

For better architecture, frontend can be updated to:
1. Call `GET /api/meetings/:id/join-link` instead of using `meeting.meetingLink` directly
2. This ensures using the session-based link
3. Provides better error handling and participant tracking

## Benefits

1. **Single Source of Truth**: Meeting link stored in Session, not duplicated
2. **Consistent Joining**: All users always join the same room
3. **Participant Tracking**: Know who joined and when
4. **Better Analytics**: Track session participation
5. **Scalable**: Easy to add features like waiting rooms, participant management
6. **Backward Compatible**: Existing code continues to work

## Migration Notes

- Existing meetings without sessions will continue to work (using `meeting.meetingLink`)
- New meetings automatically create sessions
- No database migration required (sessions are created on-the-fly)
- Can optionally backfill sessions for existing meetings if needed

## Testing Checklist

- [x] Single meeting creation creates session
- [x] Group meeting creation creates one session for all students
- [x] Join link endpoint returns stored link
- [x] Join link endpoint never creates new links
- [x] Multiple users join same session successfully
- [x] Backward compatibility with existing meetings
- [x] Participant tracking works correctly
- [x] Session cancellation prevents joining

## Files Modified/Created

### New Files
- `server/models/Session.js`
- `server/models/SessionParticipant.js`
- `server/routes/sessions.js`

### Modified Files
- `server/index.js` (added sessions route)
- `server/utils/meetingUtils.js` (added `createOrGetSession` function)
- `server/routes/admin/meetings.js` (updated to create sessions)
- `server/routes/meetings.js` (updated join-link endpoint)

## Summary

The Session-based Meeting System ensures that:
- ✅ One session always has exactly ONE meeting link
- ✅ All participants (admin + students) join using the same link
- ✅ Meeting links are created only once during session creation
- ✅ Join flows never create new links, only reuse stored links
- ✅ System is backward compatible with existing meetings
- ✅ Participant tracking and analytics are enabled

