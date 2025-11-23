# Update Render Environment Variables - URGENT

## ⚠️ Current Issue

Your server is still using Gmail SMTP which **times out on Render**. You need to update the environment variables to use SendGrid.

## 🔧 Quick Fix Steps

### Step 1: Go to Render Dashboard
1. Open: https://dashboard.render.com
2. Click on your **backend service** (placement-hub-backend or similar)

### Step 2: Update Environment Variables
1. Click on **"Environment"** tab
2. You'll see existing variables. **Update or Add** these:

#### Remove/Update These:
- `SMTP_HOST` → Change to: `smtp.sendgrid.net`
- `SMTP_USER` → Change to: `apikey` (exactly, no quotes)
- `SMTP_PASSWORD` → Change to: `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`

#### Add These (if not present):
- `SENDGRID_API_KEY` → Value: `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`
- `FROM_EMAIL` → Value: `placementhub722@gmail.com`

### Step 3: Complete List of Variables

Make sure you have ALL of these set:

```
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=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
SENDGRID_API_KEY=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
FROM_EMAIL=placementhub722@gmail.com
```

### Step 4: Save and Redeploy
1. Click **"Save Changes"** at the bottom
2. Render will automatically redeploy (watch the logs)
3. Wait 2-5 minutes for deployment

### Step 5: Verify
After deployment, check the logs. You should see:
```
📧 SendGrid API key detected. Using SendGrid API...
✅ Email sent successfully via SendGrid API
```

Instead of:
```
SMTP_HOST: smtp.gmail.com
Attempting to send via SMTP...
Connection timeout
```

## 🎯 What to Look For

### ✅ Correct Configuration:
- `SMTP_HOST: smtp.sendgrid.net` OR `SENDGRID_API_KEY: ***configured***`
- Logs show: "SendGrid API key detected"
- Logs show: "Email sent successfully via SendGrid API"

### ❌ Wrong Configuration:
- `SMTP_HOST: smtp.gmail.com`
- `SENDGRID_API_KEY: not set`
- Logs show: "Attempting to send via SMTP..."
- Logs show: "Connection timeout"

## 🚨 Common Mistakes

1. **SMTP_USER is wrong**: Must be exactly `apikey` (not your email)
2. **API key incomplete**: Make sure you copied the FULL key (starts with SG.)
3. **Forgot to save**: Click "Save Changes" after updating
4. **Didn't wait for redeploy**: Wait for deployment to complete

## 📝 Step-by-Step Screenshot Guide

1. **Render Dashboard** → Your Service
2. **Environment** tab (left sidebar)
3. **Edit** each variable or **Add** new ones
4. **Save Changes** (bottom of page)
5. **Watch deployment** (Events tab)
6. **Check logs** after deployment

## ✅ After Update

Once you see "SendGrid API key detected" in logs:
- ✅ Emails will send instantly
- ✅ No more connection timeouts
- ✅ Works perfectly on Render
- ✅ Meeting emails sent automatically

## Need Help?

If you still see Gmail SMTP after updating:
1. Double-check all variables are saved
2. Verify deployment completed
3. Check logs for "SendGrid API key detected"
4. Make sure `SENDGRID_API_KEY` is set (not just SMTP variables)

