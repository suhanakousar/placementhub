# Placement Hub - Deployment Guide

## Overview
This is the deployment package for the Placement Hub application, a comprehensive placement management and tracking system.

## Structure
```
deployment/
├── server/          # Backend API server
├── client-build/    # Built React frontend
├── start.sh         # Startup script
└── README.md        # This file
```

## Prerequisites
- Node.js (v16 or higher)
- MongoDB database
- Environment variables configured

## Environment Setup
Create a `.env` file in the `server/` directory with the following variables:

```env
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb://localhost:27017/placement_hub
JWT_SECRET=your_jwt_secret_here
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
```

## Quick Start
1. Navigate to the deployment directory
2. Make the startup script executable: `chmod +x start.sh`
3. Run the application: `./start.sh`

## Manual Start
### Backend
```bash
cd server
npm install --omit=dev
npm start
```

### Frontend
```bash
cd client-build
npx serve -s . -l 3000
```

## Access Points
- **API Server**: http://localhost:5000
- **Web Application**: http://localhost:3000

## Features
- Student profile management
- Resume upload and verification
- Placement drive management
- Admin dashboard
- Real-time notifications
- File upload handling

## Security Notes
- Ensure MongoDB is properly secured
- Use strong JWT secrets
- Configure firewall rules
- Keep dependencies updated

## Support
For issues or questions, check the application logs or contact the development team.
