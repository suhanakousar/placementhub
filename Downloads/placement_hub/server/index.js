const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const app = express();

// Middleware
// CORS configuration - allow all origins in development, specific origins in production
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.FRONTEND_URL 
      ? process.env.FRONTEND_URL.split(',')
      : true // Allow all if not specified (you should set this in production)
    : true, // Allow all in development
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Serve uploads directory as static files (before auth middleware)
// This allows file downloads without authentication
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  setHeaders: (res, filePath) => {
    // Set appropriate headers for file downloads
    res.setHeader('Content-Disposition', 'inline');
  }
}));

// Body parsing - but multer will handle multipart/form-data
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware (for debugging)
app.use((req, res, next) => {
  console.log('[REQ]', req.method, req.originalUrl, 'Authorization:', !!req.headers.authorization);
  if (req.path.startsWith('/api/admin/posts') && req.method === 'POST') {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    console.log('Content-Type:', req.headers['content-type']);
  }
  next();
});

// Database connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/placement_hub')
.then(() => console.log('MongoDB Connected'))
.catch(err => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/students', require('./routes/students'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/posts', require('./routes/posts'));
app.use('/api/drives', require('./routes/drives'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/support', require('./routes/support'));
app.use('/api/analytics', require('./routes/analytics'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Placement Hub API is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  res.status(err.status || 500).json({
    message: err.message || 'Server error',
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

