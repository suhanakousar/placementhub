# ⚡ Quick Deployment Guide - Render (5 Minutes)

## Prerequisites
- GitHub account
- MongoDB Atlas account (free)

---

## Step 1: Setup MongoDB (2 minutes)

1. Go to https://www.mongodb.com/cloud/atlas
2. Create free account → Create free cluster
3. Click "Connect" → "Connect your application"
4. Copy connection string: `mongodb+srv://username:password@cluster.mongodb.net/placement_hub`
5. Click "Database Access" → Add database user (remember username/password)
6. Click "Network Access" → Add IP Address → `0.0.0.0/0` (allow all)

---

## Step 2: Deploy Backend (2 minutes)

1. Push your code to GitHub (if not already)
2. Go to https://dashboard.render.com → Sign up/login
3. Click **"New +"** → **"Web Service"**
4. Connect GitHub → Select your repository
5. Fill in:
   - **Name**: `placement-hub-backend`
   - **Root Directory**: `server`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free

6. Add Environment Variables (click "Advanced"):
   ```
   NODE_ENV = production
   PORT = 10000
   MONGODB_URI = mongodb+srv://username:password@cluster.mongodb.net/placement_hub
   JWT_SECRET = [Generate: openssl rand -base64 32]
   JWT_EXPIRE = 7d
   EMAIL_USER = your_email@gmail.com
   EMAIL_PASS = [Gmail App Password - see below]
   ```

7. Click **"Create Web Service"**
8. Wait 5-10 minutes for deployment
9. **Copy your backend URL** (e.g., `https://placement-hub-backend.onrender.com`)

---

## Step 3: Deploy Frontend (1 minute)

1. In Render Dashboard → **"New +"** → **"Static Site"**
2. Connect GitHub → Select same repository
3. Fill in:
   - **Name**: `placement-hub-frontend`
   - **Root Directory**: `client`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `build`
   - **Plan**: Free

4. Add Environment Variable:
   ```
   REACT_APP_API_URL = https://placement-hub-backend.onrender.com/api
   ```
   (Use your actual backend URL from Step 2)

5. Click **"Create Static Site"**
6. Wait 3-5 minutes
7. **Your app is live!** 🎉

---

## Step 4: Create Admin Account

1. SSH into backend or use Render Shell:
   ```bash
   cd server
   node seeds/createSuperAdmin.js
   ```

2. Or manually create via API:
   - Register at: `https://your-frontend-url.onrender.com/register`
   - Select "Admin" role
   - Use admin email/password

---

## 🔑 Gmail App Password Setup

1. Go to https://myaccount.google.com/security
2. Enable 2-Factor Authentication
3. Go to https://myaccount.google.com/apppasswords
4. Generate app password for "Mail"
5. Use that password in `EMAIL_PASS`

---

## ✅ Verify Deployment

1. Visit your frontend URL
2. Try registering a student account
3. Check backend logs in Render dashboard
4. Test login functionality

---

## 🐛 Common Issues

**Backend won't start:**
- Check MongoDB connection string
- Verify all environment variables are set
- Check Render logs for errors

**Frontend can't connect:**
- Verify `REACT_APP_API_URL` is correct
- Check CORS settings in backend
- Ensure backend URL includes `/api` at the end

**Files not uploading:**
- Render free tier has limited storage
- Consider using Cloudinary for file storage

---

## 🚀 That's it! Your app is live!

**Frontend**: `https://placement-hub-frontend.onrender.com`  
**Backend**: `https://placement-hub-backend.onrender.com`

---

**Note**: Free tier services on Render sleep after 15 minutes of inactivity. First request after sleep takes ~30 seconds to wake up.

