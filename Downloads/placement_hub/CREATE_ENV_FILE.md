# Create/Update .env File

## Issue
Your `.env` file is not being read or doesn't exist in the `server` directory.

## Solution

### Step 1: Check if .env exists
The `.env` file must be in the `server` directory (not the root).

### Step 2: Create/Update .env file
Create or update `server/.env` with these exact values:

```env
# Email Configuration - SendGrid
FROM_EMAIL=placementhub722@gmail.com
SENDGRID_API_KEY=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
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=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

# Application Configuration
FRONTEND_URL=https://placementhub-psi.vercel.app
MONGODB_URI=mongodb+srv://suhanakousar2005_db_user:5TXLjxMi5Bv3ogPI@cluster0.aowyina.mongodb.net/placement_hub?retryWrites=true&w=majority&appName=Cluster0
NODE_ENV=development
```

### Step 3: Important Notes
1. **File location**: Must be `server/.env` (not root `.env`)
2. **No quotes**: Don't use quotes around values
3. **No spaces**: No spaces around `=` sign
4. **Restart server**: Restart your server after creating/updating .env

### Step 4: Verify
After creating the file, test:
```bash
cd server
node -e "require('dotenv').config(); console.log('SENDGRID_API_KEY:', process.env.SENDGRID_API_KEY ? 'SET ✅' : 'NOT SET ❌');"
```

You should see: `SENDGRID_API_KEY: SET ✅`

### Step 5: Test Email
```bash
cd server
node -e "require('dotenv').config(); require('./utils/testEmail').testEmailConfig('placementhub722@gmail.com').then(s => console.log(s ? '✅ PASSED' : '❌ FAILED'));"
```

## For Render Deployment

On Render, you don't need a `.env` file. Instead:
1. Go to Render Dashboard → Your Service → Environment
2. Add the variables there (as shown in UPDATE_RENDER_ENV.md)
3. Render will use those environment variables

## Quick Copy-Paste

Copy this entire block into `server/.env`:

```
FROM_EMAIL=placementhub722@gmail.com
SENDGRID_API_KEY=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
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=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
FRONTEND_URL=https://placementhub-psi.vercel.app
MONGODB_URI=mongodb+srv://suhanakousar2005_db_user:5TXLjxMi5Bv3ogPI@cluster0.aowyina.mongodb.net/placement_hub?retryWrites=true&w=majority&appName=Cluster0
NODE_ENV=development
```

