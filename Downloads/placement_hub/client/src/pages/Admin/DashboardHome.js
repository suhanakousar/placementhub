import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { FaUsers, FaCheckCircle, FaTimesCircle, FaTrophy, FaBriefcase } from 'react-icons/fa';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import api from '../../utils/api';

const CACHE_KEY = 'admin_dashboard_stats';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Get cached stats from localStorage
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

const DashboardHome = ({ stats: initialStats, onStatsUpdate }) => {
  // Initialize with cached data or initialStats for immediate display
  const cachedData = getCachedStats();
  const [stats, setStats] = useState(initialStats || cachedData || {});
  // Only show loading if we have NO data at all (no initial, no cache)
  const [loading, setLoading] = useState(!initialStats && !cachedData && Object.keys(stats).length === 0);

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

  const fetchStats = useCallback(async (showLoading = false) => {
    try {
      if (showLoading) {
        setLoading(true);
      }
      const response = await api.get('/admin/statistics');
      const statsData = response.data || {};
      setStats(statsData);
      saveToCache(statsData);
      // Notify parent component if callback provided
      if (onStatsUpdate) {
        onStatsUpdate(statsData);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
      // Only set default if we don't have any stats
      if (Object.keys(stats).length === 0) {
        const defaultStats = {
          totalStudents: 0,
          verifiedResumes: 0,
          unverifiedResumes: 0,
          departmentWiseStudents: [],
          topStudents: [],
          upcomingDrives: []
        };
        setStats(defaultStats);
      }
    } finally {
      setLoading(false);
    }
  }, [onStatsUpdate, saveToCache, stats]);

  useEffect(() => {
    // If we have initial stats, use them and update cache
    if (initialStats && Object.keys(initialStats).length > 0) {
      setStats(initialStats);
      saveToCache(initialStats);
      setLoading(false);
    } else if (!cachedData) {
      // Only fetch if no initial stats and no cache
      fetchStats(true);
    } else {
      // We have cached data, no need to show loading
      setLoading(false);
    }

    // Set up polling every 30 seconds for real-time updates
    const interval = setInterval(() => {
      // Background refresh without showing loading
      fetchStats(false);
    }, 30000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps - only run on mount

  // Update local stats when initialStats prop changes
  useEffect(() => {
    if (initialStats && Object.keys(initialStats).length > 0) {
      setStats(initialStats);
      saveToCache(initialStats);
      setLoading(false);
    }
  }, [initialStats, saveToCache]);
  const departmentData = useMemo(() => 
    stats?.departmentWiseStudents?.map(dept => ({
      name: dept.department,
      count: dept.count
    })) || [], 
    [stats?.departmentWiseStudents]
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Total Students</p>
              <p className="text-3xl font-bold text-gray-800 dark:text-white mt-2">
                {stats?.totalStudents || 0}
              </p>
            </div>
            <FaUsers className="text-4xl text-blue-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Verified Resumes</p>
              <p className="text-3xl font-bold text-gray-800 dark:text-white mt-2">
                {stats?.verifiedResumes || 0}
              </p>
            </div>
            <FaCheckCircle className="text-4xl text-green-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Unverified Resumes</p>
              <p className="text-3xl font-bold text-gray-800 dark:text-white mt-2">
                {stats?.unverifiedResumes || 0}
              </p>
            </div>
            <FaTimesCircle className="text-4xl text-yellow-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Upcoming Drives</p>
              <p className="text-3xl font-bold text-gray-800 dark:text-white mt-2">
                {stats?.upcomingDrives?.length || 0}
              </p>
            </div>
            <FaBriefcase className="text-4xl text-purple-500" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4">
            Department-wise Student Registration
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={departmentData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" fill="#3b82f6" name="Students" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Top 5 Students</h3>
          <div className="space-y-4">
            {stats?.topStudents?.map((student, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div>
                  <p className="font-semibold text-gray-800 dark:text-white">
                    {student.personalInfo?.firstName} {student.personalInfo?.lastName}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {student.academicInfo?.department} - CGPA: {student.academicInfo?.cgpa || 'N/A'}
                  </p>
                </div>
                <FaTrophy className="text-yellow-500" />
              </div>
            ))}
            {(!stats?.topStudents || stats.topStudents.length === 0) && (
              <p className="text-gray-500 text-center py-4">No data available</p>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Upcoming Placement Drives</h3>
        <div className="space-y-4">
          {stats?.upcomingDrives?.map((drive, index) => (
            <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-semibold text-gray-800 dark:text-white">{drive.companyName}</h4>
                  <p className="text-gray-600 dark:text-gray-400">{drive.role}</p>
                  <p className="text-gray-600 dark:text-gray-400">Package: {drive.package}</p>
                  <p className="text-sm text-gray-500 mt-2">
                    Deadline: {new Date(drive.applicationDeadline).toLocaleDateString()}
                  </p>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm ${
                  drive.status === 'open' ? 'bg-green-100 text-green-800' :
                  drive.status === 'closed' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {drive.status}
                </span>
              </div>
            </div>
          ))}
          {(!stats?.upcomingDrives || stats.upcomingDrives.length === 0) && (
            <p className="text-gray-500 text-center py-4">No upcoming drives</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardHome;

