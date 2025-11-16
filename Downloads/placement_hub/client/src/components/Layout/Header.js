import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { FaMoon, FaSun, FaBell, FaUserCircle } from 'react-icons/fa';

const Header = ({ title, user }) => {
  const { darkMode, toggleDarkMode } = useTheme();

  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm fixed top-0 left-0 right-0 h-16 z-10">
      <div className="flex items-center justify-between px-6 h-full">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">{title}</h1>
        <div className="flex items-center space-x-4">
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
          >
            {darkMode ? <FaSun /> : <FaMoon />}
          </button>
          <button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 relative">
            <FaBell />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>
          <div className="flex items-center space-x-2">
            <FaUserCircle className="text-2xl text-gray-700 dark:text-gray-300" />
            <span className="text-gray-700 dark:text-gray-300">{user?.email}</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;

