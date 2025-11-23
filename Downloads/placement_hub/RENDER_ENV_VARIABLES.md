# Render Environment Variables Setup

## Required Environment Variables for Google Calendar API

Add these environment variables in your Render dashboard to configure Google Calendar API for Google Meet link creation.

### Steps to Add Environment Variables in Render:

1. Go to your Render dashboard
2. Select your **Web Service** (backend/server)
3. Click on **Environment** tab
4. Click **Add Environment Variable** for each variable below
5. Add the variables one by one

---

## Environment Variables to Add:

### 1. GOOGLE_CLIENT_EMAIL

**Key:** `GOOGLE_CLIENT_EMAIL`  
**Value:** `placementhub@placmenthub.iam.gserviceaccount.com`

**Description:** Service account email for Google Calendar API authentication

---

### 2. GOOGLE_PRIVATE_KEY

**Key:** `GOOGLE_PRIVATE_KEY`  
**Value:** 
```
-----BEGIN PRIVATE KEY-----
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
-----END PRIVATE KEY-----
```

**Important Notes:**
- Copy the ENTIRE private key including `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----`
- Render will handle the newlines automatically
- Make sure there are no extra spaces or characters

---

### 3. GOOGLE_CALENDAR_ID

**Key:** `GOOGLE_CALENDAR_ID`  
**Value:** `placementhub722@gmail.com`

**Description:** The Google Calendar ID where meetings will be created

---

## Quick Copy-Paste for Render:

### Option 1: Individual Variables

```
GOOGLE_CLIENT_EMAIL=placementhub@placmenthub.iam.gserviceaccount.com
GOOGLE_CALENDAR_ID=placementhub722@gmail.com
```

For `GOOGLE_PRIVATE_KEY`, copy the full key from above (including BEGIN/END lines).

### Option 2: Using Render's Environment Variable Editor

1. In Render dashboard → Your Service → Environment tab
2. Click "Add Environment Variable"
3. Add each variable one by one:

**Variable 1:**
- Key: `GOOGLE_CLIENT_EMAIL`
- Value: `placementhub@placmenthub.iam.gserviceaccount.com`

**Variable 2:**
- Key: `GOOGLE_CALENDAR_ID`
- Value: `placementhub722@gmail.com`

**Variable 3:**
- Key: `GOOGLE_PRIVATE_KEY`
- Value: (paste the entire private key including BEGIN/END lines)

---

## Important Reminders:

### ⚠️ Before Adding Variables:

1. **Share the Calendar**: Make sure `placementhub722@gmail.com` calendar is shared with `placementhub@placmenthub.iam.gserviceaccount.com` with "Make changes to events" permission.

2. **Enable Google Calendar API**: Ensure Google Calendar API is enabled in your Google Cloud Console project.

### ✅ After Adding Variables:

1. **Redeploy**: Render will automatically redeploy when you save environment variables
2. **Test**: Create a test meeting to verify Google Meet links are generated correctly
3. **Check Logs**: Monitor Render logs for any authentication errors

---

## Verification:

After adding the variables, check your Render logs for:

✅ **Success:**
```
JWT Authorization successful
✅ Valid Google Meet link created: https://meet.google.com/abc-defg-hij
```

❌ **Error (if calendar not shared):**
```
Permission denied (403)
```

❌ **Error (if API not enabled):**
```
Calendar API not enabled
```

---

## Additional Environment Variables (If Needed):

If you have other environment variables already set (like MongoDB, JWT secrets, etc.), keep those as well. Only add the three Google Calendar variables above.

---

## Security Notes:

- ✅ Environment variables in Render are encrypted at rest
- ✅ They are only accessible to your service
- ✅ Never commit these values to your code repository
- ✅ The private key in code is just a fallback - environment variables take precedence

---

## Troubleshooting:

### If Google Meet links still don't work:

1. **Check Calendar Sharing**: Verify `placementhub722@gmail.com` is shared with the service account
2. **Check API Status**: Verify Google Calendar API is enabled in Google Cloud Console
3. **Check Logs**: Look for specific error messages in Render logs
4. **Verify Variables**: Double-check variable names match exactly (case-sensitive)

### Common Issues:

- **403 Permission Denied**: Calendar not shared with service account
- **404 Calendar Not Found**: Wrong calendar ID or calendar doesn't exist
- **401 Unauthorized**: Invalid private key or client email

---

## Summary:

Add these 3 environment variables in Render:
1. `GOOGLE_CLIENT_EMAIL` = `placementhub@placmenthub.iam.gserviceaccount.com`
2. `GOOGLE_PRIVATE_KEY` = (full private key with BEGIN/END lines)
3. `GOOGLE_CALENDAR_ID` = `placementhub722@gmail.com`

Then redeploy and test! 🚀

