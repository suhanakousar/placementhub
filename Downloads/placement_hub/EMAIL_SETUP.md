# Email Configuration Guide

## Gmail SMTP Setup

To enable email sending for meeting notifications, you need to configure Gmail SMTP settings.

### Step 1: Create Gmail App Password

1. Go to your Google Account: https://myaccount.google.com/
2. Navigate to **Security** → **2-Step Verification** (enable if not already enabled)
3. Scroll down and click **App passwords**
4. Select **Mail** and **Other (Custom name)**
5. Enter "Placement Hub" as the app name
6. Click **Generate**
7. Copy the 16-character app password (it will look like: `abcd efgh ijkl mnop`)

### Step 2: Set Environment Variables

Create a `.env` file in the `server` directory (or set environment variables in your deployment platform):

```env
# Gmail SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=placementhub722@gmail.com
SMTP_PASSWORD=your_16_character_app_password_here
FROM_EMAIL=placementhub722@gmail.com
```

**Important Notes:**
- Use the **App Password** (16 characters), NOT your regular Gmail password
- Remove spaces from the app password when setting it
- The app password format is: `abcdefghijklmnop` (no spaces)

### Step 3: Restart Server

After setting the environment variables, restart your server:

```bash
# If running locally
npm start

# If using PM2
pm2 restart all

# If deployed, restart your deployment service
```

### Step 4: Test Email Sending

1. Schedule a meeting as admin
2. Check server console logs for:
   - `✅ Email sent successfully via SMTP`
   - Or any error messages

### Troubleshooting

**Issue: "Invalid login" or "Authentication failed"**
- Make sure you're using an App Password, not your regular password
- Verify 2-Step Verification is enabled on your Google account
- Check that the app password doesn't have spaces

**Issue: "Connection timeout"**
- Check your firewall settings
- Verify SMTP_PORT is 587 (not 465)
- Try using port 465 with secure: true

**Issue: Emails going to spam**
- Add the sender email to recipient's contacts
- Use a custom domain email if possible
- Consider using SendGrid or another email service

### Alternative: SendGrid Setup

If you prefer SendGrid over Gmail SMTP:

```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=your_sendgrid_api_key
FROM_EMAIL=placementhub722@gmail.com
SENDGRID_API_KEY=your_sendgrid_api_key
```

---

**Security Note:** Never commit your `.env` file to version control. Always use environment variables in production.

