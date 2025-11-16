import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  FaHome,
  FaUser,
  FaGraduationCap,
  FaProjectDiagram,
  FaTrophy,
  FaFileAlt,
  FaBullhorn,
  FaBell,
  FaHeadset,
  FaSignOutAlt,
  FaCertificate
} from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContext';

const studentMenuItems = [
  { path: '/student/dashboard', icon: FaHome, label: 'Dashboard' },
  { path: '/student/profile', icon: FaUser, label: 'Profile' },
  { path: '/student/academics', icon: FaGraduationCap, label: 'Academics' },
  { path: '/student/projects', icon: FaProjectDiagram, label: 'Projects & Internships' },
  { path: '/student/hackathons', icon: FaTrophy, label: 'Hackathons & Achievements' },
  { path: '/student/certifications', icon: FaCertificate, label: 'Certifications' },
  { path: '/student/resumes', icon: FaFileAlt, label: 'Resume Manager' },
  { path: '/student/posts', icon: FaBullhorn, label: 'Posts & Drives' },
  { path: '/student/notifications', icon: FaBell, label: 'Notifications' },
  { path: '/student/support', icon: FaHeadset, label: 'Support' }
];

const Sidebar = ({ menuItems = studentMenuItems }) => {
  const location = useLocation();
  const { logout } = useAuth();

  return (
    <div className="w-64 bg-white dark:bg-gray-800 shadow-lg min-h-screen fixed left-0 top-0 pt-16">
      <div className="p-4">
        <nav className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition ${
                  isActive
                    ? 'bg-primary-600 text-white'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <Icon className="text-lg" />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
          <button
            onClick={logout}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition"
          >
            <FaSignOutAlt className="text-lg" />
            <span className="font-medium">Logout</span>
          </button>
        </nav>
      </div>
    </div>
  );
};

export default Sidebar;

