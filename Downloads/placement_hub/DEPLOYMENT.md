# 🚀 Placement Hub - Deployment Guide

This guide covers deploying your Placement Hub application to various platforms.

## 📋 Prerequisites

1. **MongoDB Database** - You'll need a cloud MongoDB instance:
   - [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) (Free tier available)
   - [Railway MongoDB](https://railway.app)
   - [Render MongoDB](https://render.com)

2. **Environment Variables** - Prepare these values:
   - MongoDB connection string
   - JWT secret (generate a strong random string)
   - Email credentials (for notifications)

---

## 🎯 Deployment Options

### Option 1: Render (Recommended - Easiest)

Render offers free hosting for both frontend and backend with automatic deployments.

#### Step 1: Prepare MongoDB
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free cluster
3. Create a database user
4. Whitelist IP `0.0.0.0/0` (allow all IPs)
5. Get your connection string: `mongodb+srv://username:password@cluster.mongodb.net/placement_hub`

#### Step 2: Deploy Backend
1. Push your code to GitHub
2. Go to [Render Dashboard](https://dashboard.render.com)
3. Click **"New +"** → **"Web Service"**
4. Connect your GitHub repository
5. Configure:
   - **Name**: `placement-hub-backend`
   - **Root Directory**: `server`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free

6. Add Environment Variables:
   ```
   NODE_ENV=production
   PORT=10000
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_strong_random_secret_key
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASS=your_app_password
   ```

7. Click **"Create Web Service"**
8. Wait for deployment (5-10 minutes)
9. Copy your backend URL (e.g., `https://placement-hub-backend.onrender.com`)

#### Step 3: Deploy Frontend
1. In Render Dashboard, click **"New +"** → **"Static Site"**
2. Connect your GitHub repository
3. Configure:
   - **Name**: `placement-hub-frontend`
   - **Root Directory**: `client`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `build`
   - **Plan**: Free

4. Add Environment Variable:
   ```
   REACT_APP_API_URL=https://placement-hub-backend.onrender.com/api
   ```
   (Replace with your actual backend URL)

5. Click **"Create Static Site"**
6. Your app will be live at `https://placement-hub-frontend.onrender.com`

---

### Option 2: Vercel (Frontend) + Railway (Backend)

#### Deploy Backend on Railway
1. Go to [Railway](https://railway.app)
2. Click **"New Project"** → **"Deploy from GitHub repo"**
3. Select your repository
4. Add a new service → **"Empty Service"**
5. Configure:
   - **Root Directory**: `server`
   - **Start Command**: `npm start`
   - **Build Command**: `npm install`

6. Add Environment Variables:
   ```
   NODE_ENV=production
   PORT=5000
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASS=your_app_password
   ```

7. Railway will provide a URL like `https://your-app.railway.app`

#### Deploy Frontend on Vercel
1. Go to [Vercel](https://vercel.com)
2. Import your GitHub repository
3. Configure:
   - **Framework Preset**: Create React App
   - **Root Directory**: `client`
   - **Build Command**: `npm run build`
   - **Output Directory**: `build`

4. Add Environment Variable:
   ```
   REACT_APP_API_URL=https://your-app.railway.app/api
   ```

5. Deploy!

---

### Option 3: Heroku (Full Stack)

#### Deploy Backend
1. Install [Heroku CLI](https://devcenter.heroku.com/articles/heroku-cli)
2. Login: `heroku login`
3. Create app: `heroku create placement-hub-backend`
4. Set environment variables:
   ```bash
   heroku config:set NODE_ENV=production
   heroku config:set MONGODB_URI=your_mongodb_uri
   heroku config:set JWT_SECRET=your_jwt_secret
   heroku config:set EMAIL_USER=your_email
   heroku config:set EMAIL_PASS=your_password
   ```
5. Deploy:
   ```bash
   cd server
   git init
   heroku git:remote -a placement-hub-backend
   git add .
   git commit -m "Deploy backend"
   git push heroku main
   ```

#### Deploy Frontend
1. Create another app: `heroku create placement-hub-frontend`
2. Build and deploy:
   ```bash
   cd client
   npm run build
   cd build
   git init
   heroku git:remote -a placement-hub-frontend
   git add .
   git commit -m "Deploy frontend"
   git push heroku main
   ```

---

## 🔧 Environment Variables Reference

### Backend (.env)
```env
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/placement_hub
JWT_SECRET=your_very_strong_random_secret_key_here
JWT_EXPIRE=7d
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_specific_password
```

### Frontend (.env)
```env
REACT_APP_API_URL=https://your-backend-url.com/api
```

**Note**: For Gmail, you need to:
1. Enable 2-Factor Authentication
2. Generate an [App Password](https://myaccount.google.com/apppasswords)
3. Use that app password in `EMAIL_PASS`

---

## 📝 Post-Deployment Checklist

- [ ] Backend is accessible and health check works
- [ ] Frontend can connect to backend API
- [ ] MongoDB connection is working
- [ ] Test user registration
- [ ] Test login functionality
- [ ] Test file uploads (resumes, certificates)
- [ ] Email notifications are working
- [ ] Admin account is created
- [ ] CORS is properly configured

---

## 🐛 Troubleshooting

### Backend Issues

**Problem**: Backend returns 404
- **Solution**: Check if routes are properly registered in `server/index.js`

**Problem**: MongoDB connection fails
- **Solution**: 
  - Verify connection string
  - Check IP whitelist in MongoDB Atlas
  - Ensure database user has proper permissions

**Problem**: File uploads not working
- **Solution**: 
  - Check if `uploads` directory exists
  - Verify file size limits in multer config
  - Check storage permissions

### Frontend Issues

**Problem**: API calls fail with CORS error
- **Solution**: Ensure backend CORS is configured to allow your frontend domain

**Problem**: Environment variables not working
- **Solution**: 
  - Restart the build after adding env vars
  - Ensure variable names start with `REACT_APP_`
  - Rebuild the frontend

**Problem**: Routes return 404 on refresh
- **Solution**: Configure your hosting provider to serve `index.html` for all routes (SPA routing)

---

## 🔒 Security Best Practices

1. **Never commit `.env` files** - They're in `.gitignore`
2. **Use strong JWT secrets** - Generate with: `openssl rand -base64 32`
3. **Enable HTTPS** - Most platforms do this automatically
4. **Limit MongoDB access** - Whitelist only necessary IPs
5. **Regular updates** - Keep dependencies updated
6. **Environment variables** - Store secrets in platform's env var system

---

## 📊 Monitoring

### Recommended Tools:
- **Uptime Monitoring**: [UptimeRobot](https://uptimerobot.com) (Free)
- **Error Tracking**: [Sentry](https://sentry.io) (Free tier)
- **Analytics**: Google Analytics

---

## 🚀 Quick Deploy Script

For Render, you can use the provided `render.yaml`:

1. Push code to GitHub
2. In Render Dashboard → **"New +"** → **"Blueprint"**
3. Connect your repo
4. Render will auto-detect `render.yaml` and create services

---

## 💡 Tips

1. **Free Tier Limits**:
   - Render: Services sleep after 15 min inactivity (free tier)
   - Railway: Limited hours per month
   - Vercel: Unlimited for static sites

2. **Database**:
   - MongoDB Atlas free tier: 512MB storage
   - Consider upgrading for production

3. **File Storage**:
   - Current setup uses local storage (not ideal for cloud)
   - Consider migrating to [Cloudinary](https://cloudinary.com) or [AWS S3](https://aws.amazon.com/s3/)

4. **Performance**:
   - Enable CDN for static assets
   - Use image optimization
   - Implement caching strategies

---

## 📞 Need Help?

If you encounter issues:
1. Check server logs in your hosting platform
2. Verify all environment variables are set
3. Test API endpoints with Postman/curl
4. Check browser console for frontend errors

---

**Happy Deploying! 🎉**

