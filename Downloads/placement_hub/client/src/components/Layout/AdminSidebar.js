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
    // Only close if sidebar has been open for at least 100ms
    if (isOpen && window.innerWidth < 1024 && (Date.now() - sidebarOpenedRef.current > 100)) {
      onClose();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    if (!isOpen) {
      document.body.style.overflow = '';
      return;
    }

    document.body.style.overflow = 'hidden';

    // Track when sidebar was opened to prevent immediate closing
    const openedAt = Date.now();
    const MIN_OPEN_TIME = 500; // Minimum time sidebar must stay open (ms)

    let timeoutId;
    const handleClickOutside = (event) => {
      // Don't close if sidebar was just opened
      if (Date.now() - openedAt < MIN_OPEN_TIME) {
        return;
      }

      if (window.innerWidth < 1024) {
        const sidebar = document.querySelector('.admin-sidebar-mobile');
        const menuButton = event.target.closest('.menu-toggle') || event.target.closest('button[aria-label="Toggle menu"]');
        const overlay = event.target.closest('[class*="bg-black"]');
        
        // Don't close if clicking on sidebar, menu button, or overlay (overlay has its own handler)
        if (sidebar && !sidebar.contains(event.target) && !menuButton && !overlay) {
          onClose();
        }
      }
    };

    // Longer delay to prevent immediate closing when opening
    timeoutId = setTimeout(() => {
      // Use both mousedown and touchstart for better mobile support
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }, 500);

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.body.style.overflow = '';
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={(e) => {
            // Prevent immediate closing
            const timeSinceOpen = Date.now() - sidebarOpenedRef.current;
            if (timeSinceOpen > 300) {
              onClose();
            }
          }}
          style={{ top: '4rem' }}
        />
      )}
      {/* Sidebar */}
      <div
        className="sidebar-scroll admin-sidebar-mobile w-64 bg-white dark:bg-gray-800 shadow-lg lg:h-[calc(100vh-4rem)] h-screen lg:fixed lg:left-0 lg:top-16 overflow-y-auto overflow-x-hidden z-50"
        style={{
          transform: !isMobile ? 'translateX(0)' : (isOpen ? 'translateX(0)' : 'translateX(-100%)'),
          WebkitTransform: !isMobile ? 'translateX(0)' : (isOpen ? 'translateX(0)' : 'translateX(-100%)'),
          msTransform: !isMobile ? 'translateX(0)' : (isOpen ? 'translateX(0)' : 'translateX(-100%)'),
          transition: 'transform 300ms ease-in-out',
          willChange: 'transform'
        }}
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

