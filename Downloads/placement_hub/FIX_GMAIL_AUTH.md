# Fix Gmail Authentication Error

## Problem
You're getting this error:
```
535-5.7.8 Username and Password not accepted
```

## Solution Steps

### Step 1: Enable 2-Step Verification
1. Go to https://myaccount.google.com/security
2. Under "Signing in to Google", find **2-Step Verification**
3. If it's OFF, click it and enable it
4. Follow the setup process (you'll need your phone)

### Step 2: Generate a New App Password
1. Go to https://myaccount.google.com/apppasswords
   - Or: Google Account → Security → 2-Step Verification → App passwords
2. Select **Mail** as the app
3. Select **Other (Custom name)** as the device
4. Enter "Placement Hub" as the name
5. Click **Generate**
6. You'll see a 16-character password like: `abcd efgh ijkl mnop`
7. **IMPORTANT**: Copy it WITHOUT spaces: `abcdefghijklmnop`

### Step 3: Update Your .env File
In your `server/.env` file, update the password:

```env
SMTP_PASSWORD=your_new_16_character_password_without_spaces
```

**Make sure:**
- No spaces in the password
- No quotes around the password
- The password is exactly 16 characters

### Step 4: Restart Your Server
After updating the .env file:
```bash
# Stop your server (Ctrl+C)
# Then restart it
npm start
```

### Step 5: Test Again
```bash
cd server
node -e "require('dotenv').config(); require('./utils/testEmail').testEmailConfig('placementhub722@gmail.com').then(success => console.log('Test:', success ? 'PASSED ✅' : 'FAILED ❌')).catch(err => console.error('Error:', err.message));"
```

## Common Issues

### Issue: "App passwords" option not showing
- **Solution**: Make sure 2-Step Verification is enabled first
- It can take a few minutes for the option to appear after enabling 2-Step Verification

### Issue: "This app isn't verified"
- **Solution**: Click "Advanced" → "Go to [app name] (unsafe)" to proceed
- This is normal for custom apps

### Issue: Password still not working
- **Solution**: 
  1. Generate a NEW app password (delete the old one)
  2. Make sure you copied it without spaces
  3. Check your .env file doesn't have quotes: `SMTP_PASSWORD=abc123` (not `SMTP_PASSWORD="abc123"`)
  4. Restart your server after changing .env

### Issue: "Less secure app access" error
- **Solution**: Gmail no longer supports "less secure apps"
- You MUST use App Passwords with 2-Step Verification enabled

## Verification

After fixing, you should see:
```
✅ Email sent successfully via SMTP: <message-id>
```

Instead of:
```
❌ Error: Invalid login: 535-5.7.8 Username and Password not accepted
```

## Need Help?

If you're still having issues:
1. Check that 2-Step Verification is enabled
2. Verify the app password is exactly 16 characters (no spaces)
3. Make sure your .env file is in the `server` directory
4. Restart your server after any .env changes
5. Try generating a fresh app password

