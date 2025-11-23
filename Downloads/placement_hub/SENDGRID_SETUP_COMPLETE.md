# SendGrid Setup - Environment Variables for Render

## Your SendGrid Configuration

✅ **Sender Verified**: placementhub722@gmail.com  
✅ **API Key Created**: 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

## Update Render Environment Variables

Go to your Render dashboard → Your Backend Service → Environment → Add/Update these variables:

### Required Variables:

```
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=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
SENDGRID_API_KEY=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
FROM_EMAIL=placementhub722@gmail.com
```

### Important Notes:

1. **SMTP_USER** must be exactly: `apikey` (not your email address)
2. **SMTP_PASSWORD** = your full SendGrid API key (starts with SG.)
3. **SENDGRID_API_KEY** = same API key (for API fallback method)
4. **FROM_EMAIL** = your verified sender email

### Optional: Remove Old Gmail Variables

You can remove or keep these (they won't be used):
- Old Gmail SMTP settings (if any)

## Steps to Update in Render:

1. Go to https://dashboard.render.com
2. Click on your backend service (placement-hub-backend)
3. Go to **Environment** tab
4. Click **"Add Environment Variable"** or edit existing ones
5. Add/update each variable above
6. Click **"Save Changes"**
7. Render will automatically redeploy

## After Updating:

1. Wait for deployment to complete (2-5 minutes)
2. Check the deployment logs
3. Schedule a test meeting
4. You should see in logs:
   ```
   ✅ Email sent successfully via SendGrid API
   ```

## Testing:

After deployment, create a test meeting and check:
- Server logs should show SendGrid API success
- Student should receive email at their address
- Email should arrive within seconds

## Troubleshooting:

### If emails still don't send:
1. Verify all environment variables are set correctly
2. Check that `SMTP_USER=apikey` (exactly, no quotes)
3. Make sure API key is complete (starts with SG. and is long)
4. Check Render logs for any errors
5. Verify sender email is verified in SendGrid dashboard

### If you see "Invalid API key":
- Make sure you copied the FULL API key
- Check for any extra spaces or line breaks
- Regenerate API key if needed

## Success Indicators:

✅ Deployment completes successfully  
✅ Logs show: "Attempting to send via SendGrid API..."  
✅ Logs show: "✅ Email sent successfully via SendGrid API"  
✅ Student receives meeting email

