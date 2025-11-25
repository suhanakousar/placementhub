# Manual Meeting Link Mode

## Overview

Admins now paste the meeting link generated from any external provider (Google Meet, Microsoft Teams, Zoom, etc.). The backend never calls Google APIs, so any valid URL can be used.

## Admin Workflow

1. Create the meeting in your preferred platform.
2. Copy the join link.
3. In the admin dashboard, paste the link when scheduling:
   - 1:1 meetings
   - Group/bulk meetings
   - Approving student meeting requests
4. Save. The system stores that link and uses it everywhere (emails, dashboards, student portal).

## Validation

- Link is required and must start with `http://` or `https://`.
- Backend validates the URL structure.
- Session/join endpoints reuse the stored link for all participants.

## Frontend UX Changes

- New “Meeting Link” input field (required) on the meeting form.
- Meeting platform selector (optional) lets admins note which provider they used.

## Backend Changes

- `/api/admin/meetings`, `/api/admin/meetings/bulk`, and `/api/admin/meetings/requests/:id/approve` now require `meetingLink` in the request body.
- Google Calendar service is no longer invoked.
- Session creation uses the provided link without generating a new one.

## Error Messages

- “Meeting link is required. Please paste the link generated from your meeting platform.”
- “Invalid meeting link. Please provide a valid URL that starts with http:// or https://.”

## Tips

- Encourage mentors to keep their preferred meeting templates (e.g., Teams meeting with lobby settings) and simply reuse the link.
- For recurring group sessions, reuse the same link manually if desired.
- If a link needs to be updated, edit the meeting and paste the new URL.

