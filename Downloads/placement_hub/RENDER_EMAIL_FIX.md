# Fix Email Connection Timeout on Render

## Problem
You're seeing this error:
```
Connection timeout
ETIMEDOUT
```

This happens because **Render blocks outbound SMTP connections** on ports 587 and 465. This is a security measure by cloud hosting providers.

## Solution: Use SendGrid API (Recommended)

SendGrid works perfectly on Render and other cloud platforms because it uses HTTPS API instead of SMTP ports.

### Step 1: Sign Up for SendGrid
1. Go to https://sendgrid.com
2. Sign up for a free account (100 emails/day free)
3. Verify your email address

### Step 2: Create an API Key
1. In SendGrid dashboard, go to **Settings** → **API Keys**
2. Click **"Create API Key"**
3. Name it: "Placement Hub"
4. Select **"Full Access"** (or "Restricted Access" with Mail Send permissions)
5. Click **"Create & View"**
6. **Copy the API key immediately** (you won't see it again!)

### Step 3: Verify Sender Identity
1. Go to **Settings** → **Sender Authentication**
2. Click **"Verify a Single Sender"**
3. Enter your email: `placementhub722@gmail.com`
4. Fill in the form and verify via email

### Step 4: Update Render Environment Variables
In your Render dashboard, update these environment variables:

**Remove or update these:**
```
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=your_sendgrid_api_key_here
SENDGRID_API_KEY=your_sendgrid_api_key_here
FROM_EMAIL=placementhub722@gmail.com
```

**Important:**
- `SMTP_USER` must be exactly: `apikey` (not your email)
- `SMTP_PASSWORD` = your SendGrid API key
- `SENDGRID_API_KEY` = same API key (for API fallback)
- `FROM_EMAIL` = your verified sender email

### Step 5: Redeploy
After updating environment variables:
1. Go to Render dashboard
2. Click **"Manual Deploy"** → **"Deploy latest commit"**
3. Wait for deployment to complete

### Step 6: Test
Schedule a test meeting and check the logs. You should see:
```
✅ Email sent successfully via SendGrid API
```

## Alternative: Use Gmail with OAuth2 (More Complex)

If you prefer to stick with Gmail, you'll need to:
1. Set up OAuth2 credentials in Google Cloud Console
2. Implement OAuth2 flow (more complex)
3. This is not recommended for cloud deployments

## Why SendGrid is Better for Cloud

✅ Works on all cloud platforms (Render, Heroku, Railway, etc.)
✅ No port blocking issues
✅ More reliable delivery
✅ Better analytics
✅ Free tier: 100 emails/day
✅ Easy to scale

## Cost Comparison

- **Gmail SMTP**: Free, but blocked on cloud platforms
- **SendGrid**: Free tier (100 emails/day), then $15/month for 40,000 emails
- **Other options**: Mailgun, AWS SES, etc.

## Troubleshooting

### Issue: "API key not valid"
- Make sure you copied the full API key
- Check that the API key has "Mail Send" permissions

### Issue: "Sender not verified"
- Verify your sender email in SendGrid dashboard
- Wait a few minutes after verification

### Issue: Still getting timeouts
- Make sure you updated ALL environment variables
- Redeploy after changing environment variables
- Check Render logs for the actual error

## Quick Setup Script

After setting up SendGrid, your `.env` should look like:

```env
# SendGrid Configuration (for cloud deployments)
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=SG.your_actual_api_key_here
SENDGRID_API_KEY=SG.your_actual_api_key_here
FROM_EMAIL=placementhub722@gmail.com

# Other variables...
NODE_ENV=production
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
```

**Note:** Replace `SG.your_actual_api_key_here` with your actual SendGrid API key.

