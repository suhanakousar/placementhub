import React from 'react';
import { Link } from 'react-router-dom';
import { FaGraduationCap, FaChartLine, FaUsers, FaBell, FaCheckCircle } from 'react-icons/fa';
import InstallButton from '../components/InstallButton';

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="container mx-auto px-4 py-3 md:py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <FaGraduationCap className="text-2xl md:text-3xl text-primary-600" />
            <h1 className="text-xl md:text-2xl font-bold text-gray-800 dark:text-white">Placement Hub</h1>
          </div>
          <div className="flex items-center space-x-2">
            <InstallButton />
            <Link
              to="/login"
              className="px-4 md:px-6 py-1.5 md:py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition text-sm md:text-base"
            >
              Login
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-12 md:py-20 text-center">
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-4">
          Transforming Campus Placements into Digital Excellence
        </h1>
        <p className="text-base md:text-lg lg:text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto px-2">
          Centralize all placement-related data, streamline processes, and connect students with recruiters seamlessly.
        </p>
        <div className="flex flex-wrap justify-center gap-3 md:gap-4 mb-8 md:mb-12 px-2">
          <div className="flex items-center space-x-2 bg-white dark:bg-gray-800 px-3 md:px-4 py-2 rounded-lg shadow text-sm md:text-base">
            <FaChartLine className="text-primary-600" />
            <span className="text-gray-700 dark:text-gray-300">Smart Dashboards</span>
          </div>
          <div className="flex items-center space-x-2 bg-white dark:bg-gray-800 px-3 md:px-4 py-2 rounded-lg shadow text-sm md:text-base">
            <FaUsers className="text-primary-600" />
            <span className="text-gray-700 dark:text-gray-300">Centralized Profiles</span>
          </div>
          <div className="flex items-center space-x-2 bg-white dark:bg-gray-800 px-3 md:px-4 py-2 rounded-lg shadow text-sm md:text-base">
            <FaChartLine className="text-primary-600" />
            <span className="text-gray-700 dark:text-gray-300">Real-time Analytics</span>
          </div>
        </div>
        <div className="flex flex-wrap justify-center gap-4 px-2">
          <Link
            to="/student-register"
            className="px-6 md:px-8 py-2 md:py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition text-base md:text-lg font-medium"
          >
            Register as Student
          </Link>
          {/* <Link
            to="/admin-register"
            className="px-6 md:px-8 py-2 md:py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition text-base md:text-lg font-medium"
          >
            Register as Admin
          </Link> */}
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-12 md:py-16">
        <h2 className="text-2xl md:text-3xl font-bold text-center text-gray-900 dark:text-white mb-8 md:mb-12">
          Key Features
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
            <FaGraduationCap className="text-4xl text-primary-600 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Student Dashboard
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              Manage your profile, projects, internships, and track your placement progress all in one place.
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
            <FaChartLine className="text-4xl text-primary-600 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Analytics & Reports
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              Get insights into placement trends, department-wise statistics, and performance metrics.
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
            <FaBell className="text-4xl text-primary-600 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Real-time Notifications
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              Get instant updates on placement drives, verification status, and important announcements.
            </p>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="bg-gray-100 dark:bg-gray-700 py-12 md:py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-center text-gray-900 dark:text-white mb-6 md:mb-8">
            About Placement Hub
          </h2>
          <p className="text-base md:text-lg text-gray-700 dark:text-gray-300 max-w-3xl mx-auto text-center px-2">
            Placement Hub is a comprehensive platform designed to streamline the entire placement process.
            From student profile management to admin coordination, we provide all the tools necessary
            for efficient campus placements. Our system ensures transparency, efficiency, and real-time
            updates for all stakeholders.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-6 md:py-8">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 md:gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4">Placement Hub</h3>
              <p className="text-gray-400">
                Your one-stop solution for campus placement management.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-4">Quick Links</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link to="/login" className="hover:text-white">Login</Link></li>
                <li><Link to="/student-register" className="hover:text-white">Register</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-4">Support</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">Contact Us</a></li>
                <li><a href="#" className="hover:text-white">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 Placement Hub. All rights reserved.</p>
            <p className="mt-2">Created by Suhana Kousar</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;

