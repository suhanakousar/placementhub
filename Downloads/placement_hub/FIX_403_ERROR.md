# Fix 403 Permission Denied Error

## Error Message
```
Google Calendar API permission denied (403)
```

## Root Cause
The Google Calendar API is returning a 403 error, which means:
- ✅ Credentials are being used (authentication works)
- ❌ But permissions are denied (authorization fails)

## Solution Steps

### Step 1: Share Calendar with Service Account

**This is the most common fix!**

1. Go to [Google Calendar](https://calendar.google.com)
2. In the left sidebar, find the calendar: **`placementhub722@gmail.com`**
3. Click the **three dots (⋮)** next to the calendar name
4. Select **"Settings and sharing"**
5. Scroll down to **"Share with specific people"**
6. Click **"Add people"**
7. Enter: **`placementhub@placmenthub.iam.gserviceaccount.com`**
8. Set permission to: **"Make changes to events"** (or at minimum "See all event details")
9. Click **"Send"**

### Step 2: Verify Environment Variables in Render

Even though defaults are in code, it's better to set them explicitly:

1. Go to Render Dashboard
2. Select your service
3. Go to **Environment** tab
4. Add these variables:

```
GOOGLE_CLIENT_EMAIL=placementhub@placmenthub.iam.gserviceaccount.com
GOOGLE_CALENDAR_ID=placementhub722@gmail.com
GOOGLE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\nMIIEvwIBADANBgkqhkiG9w0BAQEFAASCBKkwggSlAgEAAoIBAQDB+JtLIxi1VZJ2\nNDgYHyEGS+64SrB1NZqZ+dU7foHbwQnS+srTOMOA5+zYv0LFOclsUzJia+P1gB3a\nGuZebM29uA6jtT3jInjt+7rmabACXt20h9YWpSW+MIoZxQbJeijnj9u68YPn0gvf\naWrc4mOOYCaa/N5h68d9mR3If5qv/sVju2TCzI3GfCUNErsz6gvpcFExJOuRpBXm\n6mxGARR3ErtvQyB77YusxaKUpBZ29uMmFbxuXB4UsZRJ6siPhJ5rzmJWAC1x1gl5\nzDEQfqnIFeSaBzayDcCclkGvQOU6Re99KHWBEHk4nszfYAdGZ58QQ5ES8upYg8bm\nIDnmXUD1AgMBAAECggEAL+P2TYcRCOZjhqEub1AyOmiBfEleh1XQga80BSAfJjdj\nOk62yI81f8xjRwFz1heGImNpJ3EtY3X6CNlG4u3YnzyECsnLCZr/gfx6oPxbmz46\nXWIDSuyD5ND9q86gNhrd4gw760xJbbFHwqV3n6kafPLC3VXM/x60To+BEbllowll\nFVYYAeocK93bFaW7iviOG90PL9ou2DRC/IL2dMp2iepBGn72Tah01tNBHm2jqFsF\nQDRPRHWQ6W7HEfJiPDWQx5b/vBQna6Lt1efDvUhhVzBeu0xz0Il/EUHRuzvBZbiE\nwPfLH3Dq/IU/YoQodMPOOp452UHIIRdk5gzUiuRAiQKBgQDrb6aVfWFOuMqQSvPZ\ncA+FFJWYd2QSS+ZP82JKkH5SzLJTj833iSnx4b9g3j2m+YJFzn26O5YcNQusUmgc\n6nWUHQYiE+SM+LqsoWRreAYAg9meQzzNO5q1Mq4kE4EHnzFzFWqhcxecfB0ONxgy\n1sB8g73HZ0+1RKjZ/2grDAWKTQKBgQDS6cxyFXFqTSHwyFtrQa69dKeJ+qZ3tFaU\neEv3xU9AyJAZQs1k9uGjMcEhaBKnEfyaypf7OY0y+pm+VGHLguNRgEFAOrSQKypw\n15K6b9gpDsu4NLuDss9+mLAi4ESEWrt3zi/8Op59BMZQzVlhSEH6UhJXKxJjny1J\ngQcxzXKVSQKBgQDqQCnYPWrvP6/UR68+XmAiwmthyxDXn4sla30VwZTe32pi+Acv\nztrcHwgi4p0nIMR8nkq8XIMrx5+4sjmC48lfOE2c5HwXw3dBQke/Iimeo5GIBVBe\nx3pT5XwcywcrxToXTmzM/M22Vks2lJzQIJpeiVnvKBzHt+vlE1na0thEVQKBgQCQ\nH0EcJ/jzKbfqoA6QMTblsUQW7hc4rxuGotlOex6X5zVIfbR6rJUs/f+6AzLTxV+2\nqn/GJOKOll3eiCy3cz5AYAK2kCb4aPa8WyKhkXHFRJ4Cxs3nxZUyLcYWXueTBaka\nyeNSWQAZ79xQNLJB3q1vDwwHUqBjQM8ibi/rYTdOOQKBgQDNTBnuJgeEIDIN3Jxm\n+zFB0JVf9uGWvkPW+jXnNX72svePlFavB4pyuxWg3aGxAnMivRSsZIzhKCT1YlTb\nJqFq9GcNgiRBIKDjsyvXKs10B3nnrlfbR9pNm5XNMWC6x0GVgDT0j1E5JS8GI9QN\nAg4K95ooWn0LT8pYY8uM5HD8cA==\n-----END PRIVATE KEY-----
```

5. **Redeploy** your service after adding variables

### Step 3: Enable Google Calendar API

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Select project: **`placmenthub`**
3. Navigate to **"APIs & Services"** → **"Library"**
4. Search for **"Google Calendar API"**
5. Click **"Enable"** if not already enabled

### Step 4: Verify Service Account Permissions

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Navigate to **"IAM & Admin"** → **"Service Accounts"**
3. Find: **`placementhub@placmenthub.iam.gserviceaccount.com`**
4. Ensure it has **"Editor"** or **"Calendar API User"** role

## Quick Checklist

- [ ] Calendar `placementhub722@gmail.com` is shared with `placementhub@placmenthub.iam.gserviceaccount.com`
- [ ] Permission level is "Make changes to events" (not just "See all event details")
- [ ] Google Calendar API is enabled in Google Cloud Console
- [ ] Environment variables are set in Render (optional but recommended)
- [ ] Service redeployed after making changes

## Testing

After completing the steps:

1. **Wait 1-2 minutes** for calendar sharing to propagate
2. Try creating a bulk meeting again
3. Check Render logs for: `✅ JWT Authorization successful`
4. Check for: `✅ Valid Google Meet link created`

## Still Getting 403?

If you still get 403 after sharing the calendar:

1. **Double-check the email addresses match exactly:**
   - Calendar: `placementhub722@gmail.com`
   - Service Account: `placementhub@placmenthub.iam.gserviceaccount.com`

2. **Try removing and re-adding** the service account to the calendar

3. **Check Render logs** for the exact error message - it will tell you if it's:
   - Calendar not found (404)
   - Permission denied (403)
   - API not enabled

4. **Verify in Google Calendar** that the service account appears in "Share with specific people" list

