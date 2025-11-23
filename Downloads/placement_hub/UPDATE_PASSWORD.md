# Update SMTP Password

## New App Password
Your new App Password is: `dqms qvme oyvo jepx`

**Use it WITHOUT spaces:** `dqmsqvmeoyvojepx`

## Steps to Update

1. **Open** `server/.env` file

2. **Find** this line:
   ```
   SMTP_PASSWORD=lockqlxslaefxeyj
   ```

3. **Replace** it with:
   ```
   SMTP_PASSWORD=dqmsqvmeoyvojepx
   ```

4. **Save** the file

5. **Restart** your server:
   ```bash
   # Stop the server (Ctrl+C if running)
   # Then start it again
   cd server
   npm start
   ```

6. **Test** the configuration:
   ```bash
   cd server
   node verify-smtp.js
   ```

## Expected Result
You should see:
```
✅ Email sent successfully via SMTP: <message-id>
✅ SUCCESS! Email configuration is working!
```

If you still see errors, make sure:
- No spaces in the password
- No quotes around the password
- Exactly 16 characters: `dqmsqvmeoyvojepx`
- Server was restarted after updating .env

