import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Header from '../../components/Layout/Header';
import AdminSidebar from '../../components/Layout/AdminSidebar';
import { useAuth } from '../../contexts/AuthContext';
import DashboardHome from './DashboardHome';
import Students from './Students';
import Drives from './Drives';
import Reports from './Reports';
import Verification from './Verification';
import Posts from './Posts';
import Notifications from './Notifications';
import MentorDashboard from './MentorDashboard';
import Tasks from './Tasks';
import Meetings from './Meetings';
import api from '../../utils/api';

const CACHE_KEY = 'admin_dashboard_stats';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Get cached stats from localStorage (outside component for immediate access)
function getCachedStats() {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const { data, timestamp } = JSON.parse(cached);
      const now = Date.now();
      // Return cached data if it's less than 5 minutes old
      if (now - timestamp < CACHE_DURATION) {
        return data;
      }
    }
  } catch (error) {
    console.error('Error reading cache:', error);
  }
  return null;
}

const AdminDashboard = () => {
  const { user } = useAuth();
  // Initialize with cached data immediately for instant display
  const [stats, setStats] = useState(() => getCachedStats() || null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Save stats to cache
  const saveToCache = useCallback((data) => {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({
        data,
        timestamp: Date.now()
      }));
    } catch (error) {
      console.error('Error saving cache:', error);
    }
  }, []);

  // Actual API fetch function
  const fetchFromAPI = useCallback(async () => {
    try {
      const response = await api.get('/admin/statistics');
      const statsData = response.data || {};
      setStats(statsData);
      saveToCache(statsData);
    } catch (error) {
      console.error('Error fetching stats:', error);
      // Only set default if we don't have any stats at all
      setStats(prevStats => {
        if (!prevStats || Object.keys(prevStats).length === 0) {
          return {
            totalStudents: 0,
            verifiedResumes: 0,
            unverifiedResumes: 0,
            departmentWiseStudents: [],
            topStudents: [],
            upcomingDrives: []
          };
        }
        return prevStats;
      });
    }
  }, [saveToCache]);

  const fetchStats = useCallback(async (skipCache = false) => {
    // If we have cached data and not skipping cache, show it immediately and fetch fresh in background
    if (!skipCache) {
      const cachedStats = getCachedStats();
      if (cachedStats) {
        setStats(cachedStats);
        // Fetch fresh data in background without blocking
        fetchFromAPI();
        return;
      }
    }

    // No cache or skipping cache - fetch from API
    await fetchFromAPI();
  }, [fetchFromAPI]);

  useEffect(() => {
    // Always try to fetch, but show cached data immediately if available
    fetchStats(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleStatsUpdate = useCallback((newStats) => {
    setStats(newStats);
  }, []);

  const toggleMenu = () => {
    setIsMenuOpen(prev => !prev);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  // Don't block rendering on loading - let DashboardHome handle its own loading state
  // This ensures the sidebar and layout are always visible

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header 
        title="Admin Dashboard" 
        user={user} 
        onMenuToggle={toggleMenu}
        isMenuOpen={isMenuOpen}
      />
      <AdminSidebar isOpen={isMenuOpen} onClose={closeMenu} />
      <main className="lg:ml-64 lg:pt-16 pt-16 p-4 md:p-6">
        <Routes>
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardHome stats={stats || {}} onStatsUpdate={handleStatsUpdate} />} />
          <Route path="students" element={<Students />} />
          <Route path="drives" element={<Drives />} />
          <Route path="reports" element={<Reports />} />
          <Route path="verification" element={<Verification />} />
          <Route path="posts" element={<Posts />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="mentor" element={<MentorDashboard />} />
          <Route path="meetings" element={<Meetings />} />
          <Route path="tasks" element={<Tasks />} />
        </Routes>
      </main>
    </div>
  );
};

export default AdminDashboard;

