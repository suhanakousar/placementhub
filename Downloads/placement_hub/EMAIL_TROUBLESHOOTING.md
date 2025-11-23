# Email Troubleshooting Guide

If emails are not being sent when meetings are scheduled, follow this guide to diagnose and fix the issue.

## Quick Diagnosis

### Step 1: Check Server Logs

When you schedule a meeting, check your server console logs. You should see one of these:

**✅ Success:**
```
✅ Email sent successfully via SMTP: <message-id>
```

**❌ Configuration Missing:**
```
❌ ERROR: Email not sent - SMTP credentials missing!
   Set SMTP_USER and SMTP_PASSWORD environment variables to send emails.
```

**❌ Connection Error:**
```
❌ Error sending email: [error message]
```

### Step 2: Test Email Configuration

Run the email test utility:

```bash
cd server
node -e "require('./utils/testEmail').testEmailConfig('your-email@example.com')"
```

This will:
- Check if environment variables are set
- Attempt to send a test email
- Show detailed error messages

## Common Issues and Solutions

### Issue 1: SMTP Credentials Not Configured

**Symptoms:**
- Logs show: "SMTP credentials missing"
- `SMTP_USER` or `SMTP_PASSWORD` shows as "❌ NOT SET"

**Solution:**

1. Create a `.env` file in the `server` directory (if it doesn't exist)

2. Add these environment variables:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password_here
FROM_EMAIL=your_email@gmail.com
```

3. **For Gmail:**
   - Go to https://myaccount.google.com/
   - Enable **2-Step Verification** (if not already enabled)
   - Go to **App passwords**: https://myaccount.google.com/apppasswords
   - Generate a new app password for "Mail" and "Other (Custom name)"
   - Enter "Placement Hub" as the name
   - Copy the 16-character password (remove spaces)
   - Use this password in `SMTP_PASSWORD`

4. **Restart your server** after setting environment variables

### Issue 2: Authentication Failed

**Symptoms:**
- Error: "Invalid login" or "Authentication failed"
- Error code: `EAUTH`

**Solutions:**

1. **Verify you're using an App Password, not your regular Gmail password**
   - Regular passwords won't work with SMTP
   - You must use a Gmail App Password

2. **Check 2-Step Verification is enabled**
   - App passwords only work if 2-Step Verification is enabled

3. **Verify the password has no spaces**
   - App passwords are 16 characters: `abcdefghijklmnop`
   - Remove any spaces when copying

4. **Try generating a new app password**
   - Sometimes app passwords expire or get revoked

### Issue 3: Connection Timeout

**Symptoms:**
- Error: "Connection timeout" or "ETIMEDOUT"
- Email sending hangs and fails

**Solutions:**

1. **Check firewall settings**
   - Ensure port 587 (SMTP) is not blocked
   - Try from a different network

2. **Verify SMTP_PORT**
   - Should be `587` for Gmail
   - If using port `465`, set `secure: true` in email config

3. **Check SMTP_HOST**
   - For Gmail: `smtp.gmail.com`
   - For other providers, use their SMTP server

### Issue 4: Emails Sent but Not Received

**Symptoms:**
- Logs show email sent successfully
- But recipient doesn't receive email

**Solutions:**

1. **Check spam/junk folder**
   - Gmail may mark emails as spam initially
   - Ask recipient to check spam folder

2. **Verify recipient email address**
   - Check the email address is correct in student profile
   - Check server logs for the actual email address used

3. **Check email logs in database**
   - Query `EmailLog` collection to see email status
   - Look for `status: 'sent'` vs `status: 'failed'`

### Issue 5: Development Mode (Emails Not Actually Sent)

**Symptoms:**
- Logs show: "DEVELOPMENT MODE - Email (SMTP not configured)"
- Email result shows `mode: 'development'`

**Solution:**
- This means SMTP is not configured
- Follow Issue 1 solution to configure SMTP
- In production, emails will fail if SMTP is not configured

## Environment Variables Reference

### Required Variables

```env
SMTP_USER=your_email@gmail.com          # Your Gmail address
SMTP_PASSWORD=your_16_char_app_password # Gmail App Password (no spaces)
```

### Optional Variables

```env
SMTP_HOST=smtp.gmail.com                 # Default: smtp.gmail.com
SMTP_PORT=587                           # Default: 587
FROM_EMAIL=your_email@gmail.com         # Default: SMTP_USER
SENDGRID_API_KEY=your_sendgrid_key      # Alternative to SMTP (optional)
```

## Testing Email Configuration

### Method 1: Using Test Script

```bash
cd server
node -e "require('./utils/testEmail').testEmailConfig('test@example.com')"
```

### Method 2: Schedule a Test Meeting

1. Log in as admin
2. Schedule a meeting with a test student
3. Check server logs for email sending status
4. Check student's email inbox (and spam folder)

### Method 3: Check Email Logs

Query the database to see email sending history:

```javascript
// In MongoDB shell or via API
db.emaillogs.find().sort({sentAt: -1}).limit(10)
```

Look for:
- `status: 'sent'` - Email was sent successfully
- `status: 'failed'` - Email failed to send
- Check `error` field for failure reasons

## Alternative: Using SendGrid

If Gmail SMTP is problematic, you can use SendGrid:

1. Sign up at https://sendgrid.com
2. Create an API key
3. Set environment variables:

```env
SMTP_HOST=smtp.sendgrid.net
SMTP_USER=apikey
SMTP_PASSWORD=your_sendgrid_api_key
SENDGRID_API_KEY=your_sendgrid_api_key
FROM_EMAIL=your_verified_sender@example.com
```

## Still Having Issues?

1. **Check server logs** - Look for detailed error messages
2. **Verify environment variables** - Use the test script
3. **Test with a simple email** - Try sending to your own email first
4. **Check network connectivity** - Ensure server can reach SMTP servers
5. **Review email service logs** - Check `server/utils/emailService.js` console output

## Email Status in API Response

When scheduling a meeting, the API response includes:

```json
{
  "success": true,
  "message": "Meeting created successfully",
  "meeting": {...},
  "emailSent": true,  // or false
  "emailError": null  // or error message if failed
}
```

Check `emailSent` and `emailError` fields to see if email was sent.

