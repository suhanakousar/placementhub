# Enable Google Calendar API - Quick Fix

## Error Message
```
Google Calendar API has not been used in project 361514970660 before or it is disabled.
```

## Solution: Enable Google Calendar API

### Step 1: Click the Direct Link

**Click this link to enable the API:**
👉 https://console.developers.google.com/apis/api/calendar-json.googleapis.com/overview?project=361514970660

### Step 2: Enable the API

1. You'll be taken to Google Cloud Console
2. Click the **"Enable"** button (big blue button at the top)
3. Wait for it to enable (usually takes 10-30 seconds)

### Step 3: Wait for Propagation

- **Wait 1-2 minutes** for the API to fully propagate
- The system needs time to recognize the API is enabled

### Step 4: Test Again

1. Try creating a bulk meeting again
2. Check Render logs for: `✅ Valid Google Meet link created`

---

## Alternative: Manual Steps

If the direct link doesn't work:

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Select project: **`placmenthub`** (or project ID: `361514970660`)
3. Navigate to **"APIs & Services"** → **"Library"**
4. Search for **"Google Calendar API"**
5. Click on **"Google Calendar API"**
6. Click **"Enable"** button
7. Wait 1-2 minutes
8. Try again

---

## Verify API is Enabled

To verify the API is enabled:

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Navigate to **"APIs & Services"** → **"Enabled APIs"**
3. Look for **"Google Calendar API"** in the list
4. If it's there, it's enabled ✅

---

## After Enabling

Once enabled, you should see in Render logs:
- `✅ JWT Authorization successful`
- `✅ Valid Google Meet link created: https://meet.google.com/...`

---

## Still Having Issues?

If you still get errors after enabling:

1. **Wait 2-3 minutes** - API enablement can take time to propagate
2. **Check the project** - Make sure you're enabling it in the correct project (`placmenthub` or `361514970660`)
3. **Verify service account** - Ensure the service account `placementhub@placmenthub.iam.gserviceaccount.com` has access
4. **Check calendar sharing** - Still need to share `placementhub722@gmail.com` with the service account

---

## Quick Checklist

- [ ] Google Calendar API enabled in Google Cloud Console
- [ ] Waited 1-2 minutes after enabling
- [ ] Calendar `placementhub722@gmail.com` shared with `placementhub@placmenthub.iam.gserviceaccount.com`
- [ ] Permission set to "Make changes to events"
- [ ] Tried creating meeting again

---

## Direct Enable Link

**Click here to enable:** https://console.developers.google.com/apis/api/calendar-json.googleapis.com/overview?project=361514970660

