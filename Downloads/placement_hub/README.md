## Leaderboard + User Profile System

This project implements a SmartInterviews-style leaderboard and user profile system with:

- **Frontend (`client/`)**: React + TailwindCSS `Leaderboard` UI (highlighted profile + leaderboard list, filters, search, pagination) now available at `client/src/pages/LeaderboardPage.js`.
- **Backend (`server/`)**: Node.js + Express + MongoDB endpoints (`/api/leaderboard`, `/api/users/:id/profile`, `/api/leaderboard/score`) plus caching and a scheduled rank recalculation job.

Use `cd server && npm install` / `cd client && npm install` to work with the respective stacks.

# Placement Hub

A comprehensive web application for managing campus placements with modern UI/UX, serving three main user roles: Admin, Student, and Recruiter.

## 🚀 Features

### 🎨 Modern UI/UX
- Minimalistic design with soft colors (blue, white, grey)
- Fully responsive design for all devices
- Dark/Light mode toggle
- Clean typography (Poppins/Inter)
- Intuitive navigation and user experience

### 👨‍🎓 Student Features
- **Profile Management**: Complete profile with photo, banner, and personal details
- **Academic Tracking**: Roll number, department, year, semester, CGPA management
- **Professional Links**: LinkedIn, GitHub, Portfolio, Personal Website, Coding Platforms
- **Projects & Internships**: Detailed project management with technologies and links
- **Hackathons & Achievements**: Track participation and rankings
- **Certifications**: Certificate management with issuer and date tracking
- **Resume Manager**: Multiple resume versions with verification status
- **Placement Progress**: Real-time tracking of application status
- **Notifications**: Real-time updates on placement activities
- **Analytics Dashboard**: Personal performance insights

### 👨‍🏫 Admin Features
- **Student Management**: Comprehensive student database with filtering
- **Profile Verification**: Document and profile verification system
- **Placement Drives**: Create and manage placement drives
- **Reports & Analytics**: Department-wise statistics and placement trends
- **Bulk Notifications**: Send notifications to all or specific students
- **Recruiter Management**: Manage recruiter accounts and permissions

### 🧑‍💼 Recruiter Features
- **Candidate Pool**: Advanced filtering by department, CGPA, skills
- **Interview Scheduling**: Manage interview slots and feedback
- **Offer Management**: Track offer status and acceptance
- **Feedback System**: Provide detailed candidate feedback

## 🛠️ Tech Stack

### Frontend
- **React 18** - Modern React with hooks and functional components
- **Tailwind CSS** - Utility-first CSS framework
- **React Router** - Client-side routing
- **Axios** - HTTP client for API calls
- **React Hot Toast** - Beautiful toast notifications
- **React Icons** - Icon library

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web application framework
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB object modeling
- **JWT** - JSON Web Token authentication
- **bcryptjs** - Password hashing
- **Multer** - File upload handling
- **Nodemailer** - Email service integration

## 📋 Prerequisites

- Node.js (v16 or higher)
- MongoDB (local or cloud instance)
- npm or yarn package manager

## 🚀 Installation & Setup

### 1. Clone the Repository
```bash
git clone <repository-url>
cd placement_hub
```

### 2. Install Dependencies
```bash
# Install all dependencies (client + server)
npm run install-all

# Or install separately:
# Server dependencies
cd server && npm install

# Client dependencies
cd ../client && npm install
```

### 3. Environment Configuration
```bash
# Copy environment file
cd server
cp .env.example .env

# Edit .env with your configuration
```

**Required Environment Variables:**
```env
# Database
MONGODB_URI=mongodb://localhost:27017/placement_hub

# JWT
JWT_SECRET=your-super-secret-jwt-key

# Email Service (for notifications)
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# Admin Setup
ADMIN_EMAIL=admin@placement.edu
ADMIN_PASSWORD=Admin@123456
```

### 4. Database Setup
```bash
# Create admin user (run once)
cd server
node seeds/createSuperAdmin.js
```

### 5. Start the Application
```bash
# From root directory
npm run dev

# Or start separately:
# Terminal 1 - Backend
cd server && npm run dev

# Terminal 2 - Frontend
cd client && npm start
```

**Application URLs:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## 📁 Project Structure

```
placement_hub/
├── client/                      # React Frontend
│   ├── public/
│   │   ├── index.html
│   │   └── favicon.ico
│   └── src/
│       ├── components/          # Reusable UI Components
│       │   ├── Layout/         # Sidebar, Header components
│       │   └── StudentDetailModal.js
│       ├── contexts/           # React Context (Auth, Theme)
│       ├── pages/              # Page Components
│       │   ├── Admin/          # Admin dashboard pages
│       │   ├── Student/        # Student dashboard pages
│       │   └── LandingPage.js
│       ├── utils/              # API utilities
│       ├── App.js
│       └── index.js
├── server/                      # Express Backend
│   ├── middleware/             # Authentication middleware
│   ├── models/                 # MongoDB Schemas
│   │   ├── User.js
│   │   ├── Student.js
│   │   ├── Admin.js
│   │   └── Post.js
│   ├── routes/                 # API Routes
│   │   ├── auth.js
│   │   ├── students.js
│   │   ├── admin.js
│   │   └── posts.js
│   ├── seeds/                  # Database seed scripts
│   ├── utils/                  # Email service
│   └── index.js               # Server entry point
├── package.json               # Root package.json
└── README.md
```

## 🔐 Default Credentials

**Admin Account:**
- Email: `admin@placement.edu`
- Password: `Admin@123456`

*Note: Change the admin password after first login for security.*

## 📱 Usage

### For Students:
1. Register using student email
2. Complete profile with academic and professional details
3. Upload resume and manage multiple versions
4. Track placement applications and interviews
5. Receive notifications about placement drives

### For Admins:
1. Login with admin credentials
2. Manage student database and verify profiles
3. Create and manage placement drives
4. View analytics and generate reports
5. Send bulk notifications to students

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Created by

**Suhana Kousar**

---

*Built with ❤️ for efficient campus placement management*

