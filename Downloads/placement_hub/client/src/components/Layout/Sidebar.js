import React, { useEffect } from 'react';
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

const Sidebar = ({ menuItems = studentMenuItems, isOpen, onClose }) => {
  const location = useLocation();
  const { logout } = useAuth();

  // Close sidebar when route changes on mobile
  useEffect(() => {
    if (isOpen && window.innerWidth < 1024) {
      onClose();
    }
  }, [location.pathname, isOpen, onClose]);

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    if (!isOpen) {
      document.body.style.overflow = '';
      return;
    }

    document.body.style.overflow = 'hidden';

    const handleClickOutside = (event) => {
      if (window.innerWidth < 1024 && isOpen) {
        const sidebar = document.querySelector('.sidebar-mobile');
        const menuButton = event.target.closest('.menu-toggle') || event.target.closest('button[aria-label="Toggle menu"]');
        const overlay = event.target.closest('[class*="bg-black"]');
        
        // Don't close if clicking on sidebar, menu button, or overlay (overlay has its own handler)
        if (sidebar && !sidebar.contains(event.target) && !menuButton && !overlay) {
          onClose();
        }
      }
    };

    // Small delay to prevent immediate closing when opening
    const timeoutId = setTimeout(() => {
      // Use both mousedown and touchstart for better mobile support
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
          style={{ top: '4rem' }}
        />
      )}
      {/* Sidebar */}
      <div
        className={`sidebar-scroll sidebar-mobile w-64 bg-white dark:bg-gray-800 shadow-lg h-[calc(100vh-4rem)] fixed left-0 top-16 overflow-y-auto overflow-x-hidden z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0`}
      >
        <div className="p-4 pb-6">
          <nav className="space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => {
                    if (window.innerWidth < 1024) {
                      onClose();
                    }
                  }}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition ${
                    isActive
                      ? 'bg-primary-600 text-white'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <Icon className="text-lg flex-shrink-0" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}
            <div className="pt-2 border-t border-gray-200 dark:border-gray-700 mt-2">
              <button
                onClick={logout}
                className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition"
              >
                <FaSignOutAlt className="text-lg flex-shrink-0" />
                <span className="font-medium">Logout</span>
              </button>
            </div>
          </nav>
        </div>
      </div>
    </>
  );
};

export default Sidebar;

