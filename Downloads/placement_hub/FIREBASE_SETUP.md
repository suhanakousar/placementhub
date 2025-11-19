# Firebase Environment Variables Setup

## For Local Development

### Step 1: Create `.env` file

In the `client/` directory, create a `.env` file (or copy from `.env.example`):

```bash
cd client
cp .env.example .env
```

### Step 2: Add Firebase Configuration

The `.env` file should contain:

```env
# Firebase Configuration
REACT_APP_FIREBASE_API_KEY=AIzaSyBwwNfxWNcfaiua62_3af7b-5g0sgHSHOo
REACT_APP_FIREBASE_AUTH_DOMAIN=placementhub-63892.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=placementhub-63892
REACT_APP_FIREBASE_STORAGE_BUCKET=placementhub-63892.firebasestorage.app
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=301940010490
REACT_APP_FIREBASE_APP_ID=1:301940010490:web:fbca510265418b20748843
REACT_APP_FIREBASE_MEASUREMENT_ID=G-TWM0PD3G8X

# API Configuration
REACT_APP_API_URL=http://localhost:5000/api
```

### Step 3: Restart Development Server

After creating/updating `.env` file:

```bash
# Stop the current server (Ctrl+C)
# Then restart
npm start
```

**Important**: React requires you to restart the dev server after changing `.env` files.

---

## For Production Deployment (Render/Vercel)

### Render (Static Site)

1. Go to Render Dashboard → Your Frontend Service
2. Navigate to **Environment** tab
3. Add these environment variables:

```
REACT_APP_FIREBASE_API_KEY=AIzaSyBwwNfxWNcfaiua62_3af7b-5g0sgHSHOo
REACT_APP_FIREBASE_AUTH_DOMAIN=placementhub-63892.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=placementhub-63892
REACT_APP_FIREBASE_STORAGE_BUCKET=placementhub-63892.firebasestorage.app
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=301940010490
REACT_APP_FIREBASE_APP_ID=1:301940010490:web:fbca510265418b20748843
REACT_APP_FIREBASE_MEASUREMENT_ID=G-TWM0PD3G8X
REACT_APP_API_URL=https://your-backend-url.onrender.com/api
```

4. **Redeploy** the service

### Vercel

1. Go to Vercel Dashboard → Your Project → Settings
2. Navigate to **Environment Variables**
3. Add all the variables above
4. Redeploy

---

## Getting Firebase Config Values

If you need to get these values from Firebase Console:

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project: `placementhub-63892`
3. Click the **⚙️ Settings** icon → **Project settings**
4. Scroll down to **"Your apps"** section
5. Click on your web app (or create one)
6. Copy the config values

---

## Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `REACT_APP_FIREBASE_API_KEY` | Firebase API Key | `AIzaSy...` |
| `REACT_APP_FIREBASE_AUTH_DOMAIN` | Authentication Domain | `project.firebaseapp.com` |
| `REACT_APP_FIREBASE_PROJECT_ID` | Project ID | `placementhub-63892` |
| `REACT_APP_FIREBASE_STORAGE_BUCKET` | Storage Bucket | `project.firebasestorage.app` |
| `REACT_APP_FIREBASE_MESSAGING_SENDER_ID` | Messaging Sender ID | `123456789` |
| `REACT_APP_FIREBASE_APP_ID` | App ID | `1:123:web:abc123` |
| `REACT_APP_FIREBASE_MEASUREMENT_ID` | Analytics Measurement ID | `G-XXXXXXXXXX` |
| `REACT_APP_API_URL` | Backend API URL | `http://localhost:5000/api` |

---

## Important Notes

1. **All React env variables must start with `REACT_APP_`**
2. **Restart dev server after changing `.env` files**
3. **Never commit `.env` file to Git** (it's in `.gitignore`)
4. **Use `.env.example` as a template** for other developers

---

## Troubleshooting

### Firebase not initializing?
- Check browser console for errors
- Verify all env variables are set
- Make sure variable names start with `REACT_APP_`
- Restart the dev server

### Variables not updating?
- React caches env variables at build time
- **Restart the dev server** after changing `.env`
- Clear browser cache if needed

---

## Quick Setup Command

```bash
# Navigate to client directory
cd client

# Create .env file (Windows)
copy .env.example .env

# Or (Mac/Linux)
cp .env.example .env

# Start dev server
npm start
```














