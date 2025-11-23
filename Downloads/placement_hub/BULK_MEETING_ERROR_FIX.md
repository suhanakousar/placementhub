# Bulk Meeting Creation 500 Error - Debugging Guide

## Error
```
POST /api/admin/meetings/bulk 500 (Internal Server Error)
```

## Common Causes & Solutions

### 1. Google Calendar API Not Configured

**Error Message:** "Google Calendar API not configured"

**Solution:**
- Add environment variables in Render:
  - `GOOGLE_CLIENT_EMAIL`
  - `GOOGLE_PRIVATE_KEY`
  - `GOOGLE_CALENDAR_ID`
- See `RENDER_ENV_ALL.txt` for exact values

### 2. Calendar Not Shared with Service Account

**Error Message:** "Permission denied (403)"

**Solution:**
1. Go to [Google Calendar](https://calendar.google.com)
2. Find calendar: `placementhub722@gmail.com`
3. Settings → Share with specific people
4. Add: `placementhub@placmenthub.iam.gserviceaccount.com`
5. Permission: "Make changes to events"
6. Click "Send"

### 3. Google Calendar API Not Enabled

**Error Message:** "API not enabled" or "404 Not Found"

**Solution:**
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Select project: `placmenthub`
3. Navigate to "APIs & Services" → "Library"
4. Search for "Google Calendar API"
5. Click "Enable"

### 4. Invalid Meeting Link Format

**Error Message:** "Invalid meeting link format"

**Solution:**
- This should not happen if Google Calendar API is properly configured
- Check server logs for the actual link received
- Verify environment variables are set correctly

## How to Debug

### Check Render Logs

1. Go to Render Dashboard
2. Select your service
3. Click "Logs" tab
4. Look for error messages starting with:
   - `❌ Error creating meeting link`
   - `❌ CRITICAL:`
   - `Permission denied`
   - `Calendar API not configured`

### Check Server Response

The error response now includes:
- `message`: User-friendly error message
- `error`: Detailed error message
- `details`: Stack trace (in development mode)

### Test Google Calendar API

You can test if the API is working by checking the logs when creating a single meeting (not bulk). If single meetings work but bulk doesn't, the issue is specific to bulk creation.

## Quick Fix Checklist

- [ ] Environment variables added in Render
- [ ] Calendar shared with service account
- [ ] Google Calendar API enabled in Google Cloud Console
- [ ] Service account has correct permissions
- [ ] Redeployed after adding environment variables

## Next Steps

1. Check Render logs for the exact error message
2. Verify environment variables are set correctly
3. Ensure calendar is shared with service account
4. Test with a single meeting first to isolate the issue

