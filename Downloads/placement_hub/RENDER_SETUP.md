# Render Deployment Setup Guide

If you're getting the error: `Service Root Directory "/opt/render/project/src/server" is missing`, follow these steps:

## Option 1: Manual Service Creation (Recommended)

Instead of using the Blueprint (render.yaml), create services manually:

### Backend Service:
1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository: `suhanakousar/placementhub`
4. Configure:
   - **Name**: `placement-hub-backend`
   - **Environment**: `Node`
   - **Root Directory**: `server` (important!)
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free

5. Add Environment Variables:
   ```
   NODE_ENV=production
   PORT=10000
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   JWT_EXPIRE=7d
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASS=your_app_password
   ```

6. Click **"Create Web Service"**

### Frontend Service:
1. In Render Dashboard → **"New +"** → **"Static Site"**
2. Connect same repository: `suhanakousar/placementhub`
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
   (Use your actual backend URL)

5. Click **"Create Static Site"**

---

## Option 2: Fix Blueprint Deployment

If you want to use the Blueprint (render.yaml):

1. **Verify the directory structure in GitHub:**
   - Make sure `server/` directory exists in the root
   - Make sure `client/` directory exists in the root
   - Check that `render.yaml` is in the root directory

2. **In Render Dashboard:**
   - Go to **"New +"** → **"Blueprint"**
   - Connect repository
   - Render should auto-detect `render.yaml`
   - If it still fails, try the manual setup above

---

## Troubleshooting

### Error: "Root Directory is missing"
- **Solution**: Make sure you specify `server` (not `/server` or `./server`) in Root Directory field
- Verify the directory exists in your GitHub repo

### Error: "Build failed"
- Check the build logs in Render dashboard
- Ensure all dependencies are in `package.json`
- Verify Node.js version compatibility

### Error: "Cannot find module"
- Make sure `package.json` exists in the `server/` directory
- Verify all dependencies are listed in `package.json`

---

## Quick Checklist

- [ ] MongoDB Atlas cluster created
- [ ] MongoDB connection string ready
- [ ] JWT secret generated
- [ ] Gmail app password created
- [ ] Backend service created with correct Root Directory
- [ ] Frontend service created with correct Root Directory
- [ ] Environment variables set
- [ ] Backend URL copied for frontend `REACT_APP_API_URL`

---

**Note**: Manual setup is often more reliable than Blueprint for first-time deployments.

