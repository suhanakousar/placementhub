# Check Why Emails Are Not Coming

## Step 1: Check Render Logs

After scheduling a meeting, check your Render logs for:

### ✅ Success Indicators:
```
📧 SendGrid API key detected. Using SendGrid API...
✅ Email sent successfully via SendGrid API
```

### ❌ Error Indicators:
```
❌ SendGrid API failed: [error message]
SMTP connection failed
Connection timeout
```

## Step 2: Verify Render Environment Variables

Go to Render Dashboard → Your Service → Environment tab

**Make sure ALL these are set:**
```
SENDGRID_API_KEY=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
SMTP_HOST=smtp.sendgrid.net
SMTP_USER=apikey
SMTP_PASSWORD=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
FROM_EMAIL=placementhub722@gmail.com
```

**Important:**
- `SMTP_USER` must be exactly `apikey` (not your email)
- All values should have NO quotes
- `SENDGRID_API_KEY` must be set (this is the primary method)

## Step 3: Check SendGrid Dashboard

1. Go to https://app.sendgrid.com
2. Go to **Activity** → **Email Activity**
3. Check if emails are being sent
4. Look for any errors or bounces

## Step 4: Common Issues

### Issue 1: "SendGrid API failed: 400"
- **Cause**: Empty content or invalid format
- **Fix**: ✅ Already fixed in the code (generates text from HTML)

### Issue 2: "SendGrid API failed: 401"
- **Cause**: Invalid API key
- **Fix**: 
  1. Verify API key in SendGrid dashboard
  2. Regenerate if needed
  3. Update in Render environment variables

### Issue 3: "SendGrid API failed: 403"
- **Cause**: Sender not verified
- **Fix**: 
  1. Go to SendGrid → Settings → Sender Authentication
  2. Verify `placementhub722@gmail.com` is verified
  3. Wait a few minutes after verification

### Issue 4: Emails sent but not received
- **Check**: SendGrid Activity dashboard
- **Possible causes**:
  - Email in spam folder
  - Invalid recipient email
  - SendGrid rate limits (free tier: 100/day)

## Step 5: Test Email Sending

After fixing issues, test by:
1. Schedule a new meeting
2. Check Render logs immediately
3. Check SendGrid Activity dashboard
4. Check student's email (including spam)

## Step 6: Debug Commands

If you have server access, run:
```bash
# Check environment variables
node -e "require('dotenv').config(); console.log('SENDGRID_API_KEY:', process.env.SENDGRID_API_KEY ? 'SET' : 'NOT SET');"

# Test email
node -e "require('dotenv').config(); require('./utils/testEmail').testEmailConfig('test@example.com');"
```

## Quick Checklist

- [ ] Render environment variables are set correctly
- [ ] `SENDGRID_API_KEY` is set in Render
- [ ] `SMTP_USER=apikey` (exactly, no quotes)
- [ ] Sender email is verified in SendGrid
- [ ] Render deployment completed successfully
- [ ] Checked Render logs for email sending
- [ ] Checked SendGrid Activity dashboard
- [ ] Checked student's spam folder

## Still Not Working?

1. **Check Render logs** - Look for any error messages
2. **Check SendGrid Activity** - See if emails are being sent
3. **Verify API key** - Make sure it's correct and active
4. **Test with a simple email** - Use the test utility
5. **Check student email** - Make sure it's correct in the database

