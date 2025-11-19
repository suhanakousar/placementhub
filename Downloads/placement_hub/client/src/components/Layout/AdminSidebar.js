import React, { useEffect, useState, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  FaHome,
  FaUsers,
  FaBriefcase,
  FaChartBar,
  FaCheckCircle,
  FaBullhorn,
  FaBell,
  FaSignOutAlt,
  FaTrophy
} from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContext';

const adminMenuItems = [
  { path: '/admin/dashboard', icon: FaHome, label: 'Dashboard' },
  { path: '/admin/students', icon: FaUsers, label: 'Students' },
  { path: '/admin/posts', icon: FaBullhorn, label: 'Posts & Announcements' },
  { path: '/admin/drives', icon: FaBriefcase, label: 'Placement Drives' },
  { path: '/admin/reports', icon: FaChartBar, label: 'Reports & Analytics' },
  { path: '/admin/verification', icon: FaCheckCircle, label: 'Verification Center' },
  { path: '/admin/notifications', icon: FaBell, label: 'Notifications' },
  { path: '/admin/leaderboard', icon: FaTrophy, label: 'Leaderboard' }
];

const AdminSidebar = ({ isOpen, onClose }) => {
  const location = useLocation();
  const { logout } = useAuth();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  // Debug: Log state changes
  useEffect(() => {
    const transformValue = !isMobile ? 'translateX(0)' : (isOpen ? 'translateX(0)' : 'translateX(-100%)');
    console.log('AdminSidebar state - isOpen:', isOpen, 'isMobile:', isMobile, 'transform:', transformValue);
  }, [isOpen, isMobile]);


  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Close sidebar when route changes on mobile (but not immediately after opening)
  const sidebarOpenedRef = useRef(0);
  useEffect(() => {
    if (isOpen) {
      sidebarOpenedRef.current = Date.now();
    }
  }, [isOpen]);

  useEffect(() => {
    // Close sidebar when route changes on mobile (with small delay to allow navigation)
    if (isOpen && isMobile) {
      const timer = setTimeout(() => {
        onClose();
      }, 150);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    if (!isOpen || !isMobile) {
      document.body.style.overflow = '';
      return;
    }

    document.body.style.overflow = 'hidden';

    // Track when sidebar was opened to prevent immediate closing
    const openedAt = Date.now();
    const MIN_OPEN_TIME = 300; // Minimum time sidebar must stay open (ms)

    const handleClickOutside = (event) => {
      // Don't close if sidebar was just opened
      if (Date.now() - openedAt < MIN_OPEN_TIME) {
        return;
      }

      const sidebar = document.querySelector('.admin-sidebar-mobile');
      const menuButton = event.target.closest('.menu-toggle') || event.target.closest('button[aria-label="Toggle menu"]');
      const overlay = event.target.closest('[class*="bg-black"]');
      
      // Don't close if clicking on sidebar, menu button, or overlay
      if (sidebar && !sidebar.contains(event.target) && !menuButton && !overlay) {
        onClose();
      }
    };

    // Small delay to prevent immediate closing when opening
    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }, MIN_OPEN_TIME);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.body.style.overflow = '';
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, isMobile]);

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && isMobile && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            // Prevent immediate closing
            const timeSinceOpen = Date.now() - sidebarOpenedRef.current;
            if (timeSinceOpen > 200) {
              onClose();
            }
          }}
          style={{ top: '4rem' }}
        />
      )}
      {/* Sidebar */}
      <div
        className="sidebar-scroll admin-sidebar-mobile w-64 bg-white dark:bg-gray-800 shadow-lg lg:h-[calc(100vh-4rem)] h-[calc(100vh-4rem)] lg:fixed lg:left-0 lg:top-16 fixed left-0 top-16 overflow-y-auto overflow-x-hidden z-50"
        style={{
          transform: !isMobile ? 'translateX(0)' : (isOpen ? 'translateX(0)' : 'translateX(-100%)'),
          WebkitTransform: !isMobile ? 'translateX(0)' : (isOpen ? 'translateX(0)' : 'translateX(-100%)'),
          msTransform: !isMobile ? 'translateX(0)' : (isOpen ? 'translateX(0)' : 'translateX(-100%)'),
          transition: 'transform 300ms ease-in-out',
          willChange: 'transform',
          pointerEvents: isOpen || !isMobile ? 'auto' : 'none'
        }}
      >
        <div className="p-4 pb-6">
          <div className="mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-bold text-gray-800 dark:text-white">Admin Menu</h2>
          </div>
          <nav className="space-y-2">
            {adminMenuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (window.innerWidth < 1024) {
                      // Small delay to ensure navigation happens
                      setTimeout(() => {
                        onClose();
                      }, 100);
                    }
                  }}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition relative z-50 ${
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

