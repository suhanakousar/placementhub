import React, { useState, useEffect } from 'react';
import { FaUsers, FaCheckCircle, FaTimesCircle, FaTrophy, FaBriefcase } from 'react-icons/fa';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import api from '../../utils/api';

const DashboardHome = ({ stats: initialStats }) => {
  const [stats, setStats] = useState(initialStats);

  useEffect(() => {
    // Fetch stats immediately
    fetchStats();

    // Set up polling every 30 seconds for real-time updates
    const interval = setInterval(fetchStats, 30000);

    return () => clearInterval(interval);
  }, []);

  const fetchStats = async () => {
    try {
      const response = await api.get('/admin/statistics');
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };
  const departmentData = stats?.departmentWiseStudents?.map(dept => ({
    name: dept.department,
    count: dept.count
  })) || [];

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

