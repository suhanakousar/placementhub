import React, { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  FaHome,
  FaUsers,
  FaBriefcase,
  FaChartBar,
  FaCheckCircle,
  FaBullhorn,
  FaBell,
  FaSignOutAlt
} from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContext';

const adminMenuItems = [
  { path: '/admin/dashboard', icon: FaHome, label: 'Dashboard' },
  { path: '/admin/students', icon: FaUsers, label: 'Students' },
  { path: '/admin/posts', icon: FaBullhorn, label: 'Posts & Announcements' },
  { path: '/admin/drives', icon: FaBriefcase, label: 'Placement Drives' },
  { path: '/admin/reports', icon: FaChartBar, label: 'Reports & Analytics' },
  { path: '/admin/verification', icon: FaCheckCircle, label: 'Verification Center' },
  { path: '/admin/notifications', icon: FaBell, label: 'Notifications' }
];

const AdminSidebar = ({ isOpen, onClose }) => {
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
    const handleClickOutside = (event) => {
      if (isOpen && window.innerWidth < 1024) {
        const sidebar = document.querySelector('.admin-sidebar-mobile');
        const menuButton = event.target.closest('button[aria-label="Toggle menu"]');
        if (sidebar && !sidebar.contains(event.target) && !menuButton) {
          onClose();
        }
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
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
        />
      )}
      {/* Sidebar */}
      <div
        className={`sidebar-scroll admin-sidebar-mobile w-64 bg-white dark:bg-gray-800 shadow-lg h-[calc(100vh-4rem)] fixed left-0 top-16 overflow-y-auto overflow-x-hidden z-40 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0`}
      >
        <div className="p-4 pb-6">
          <nav className="space-y-2">
            {adminMenuItems.map((item) => {
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

export default AdminSidebar;

