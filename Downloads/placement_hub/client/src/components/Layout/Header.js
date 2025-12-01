import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { FaMoon, FaSun, FaBell, FaUserCircle, FaBars, FaTimes } from 'react-icons/fa';
import InstallButton from '../InstallButton';

const Header = ({ title, user, onMenuToggle, isMenuOpen }) => {
  const { darkMode, toggleDarkMode } = useTheme();

  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm fixed top-0 left-0 right-0 h-16 z-50">
      <div className="flex items-center justify-between px-4 md:px-6 h-full">
        <div className="flex items-center space-x-3">
          {onMenuToggle && (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onMenuToggle();
              }}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 menu-toggle z-50 relative"
              aria-label="Toggle menu"
              type="button"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              {isMenuOpen ? <FaTimes className="text-xl" /> : <FaBars className="text-xl" />}
            </button>
          )}
          <h1 className="text-lg md:text-2xl font-bold text-gray-800 dark:text-white truncate">{title}</h1>
        </div>
        <div className="flex items-center space-x-2 md:space-x-4">
          <InstallButton className="hidden sm:flex" />
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
            aria-label="Toggle dark mode"
          >
            {darkMode ? <FaSun /> : <FaMoon />}
          </button>
          <button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 relative" aria-label="Notifications">
            <FaBell />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>
          <div className="hidden md:flex items-center space-x-2">
            <FaUserCircle className="text-2xl text-gray-700 dark:text-gray-300" />
            <span className="text-gray-700 dark:text-gray-300 text-sm">{user?.email}</span>
          </div>
          <div className="md:hidden">
            <FaUserCircle className="text-2xl text-gray-700 dark:text-gray-300" />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;

