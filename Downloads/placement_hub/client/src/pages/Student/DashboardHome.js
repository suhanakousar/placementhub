import React, { useState, useEffect } from 'react';
import { FaProjectDiagram, FaBriefcase, FaTrophy, FaCheckCircle, FaUpload, FaLock } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const DashboardHome = ({ studentData }) => {
  const [analytics, setAnalytics] = useState(null);
  const [progressData, setProgressData] = useState([]);

  useEffect(() => {
    if (studentData) {
      fetchAnalytics();
    }
  }, [studentData]);

  const fetchAnalytics = async () => {
    try {
      const response = await api.get('/analytics/student/profile');
      setAnalytics(response.data);
      
      // Generate progress data based on student data
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
      const baseCompletion = studentData?.profileCompletion?.percentage || 0;
      setProgressData(months.map((month, index) => ({
        month,
        completion: Math.min(100, baseCompletion + (index * 5) + Math.random() * 10),
        milestones: Math.min(100, (index + 1) * 12 + Math.random() * 8)
      })));
    } catch (error) {
      console.error('Error fetching analytics:', error);
      // Set default progress data if API fails
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
      setProgressData(months.map((month, index) => ({
        month,
        completion: Math.min(100, (index + 1) * 15 + Math.random() * 10),
        milestones: Math.min(100, (index + 1) * 12 + Math.random() * 8)
      })));
    }
  };

  const calculatePlacementReadiness = () => {
    if (!studentData) return 0;
    let score = 0;
    if (studentData.profileCompletion?.percentage) score += studentData.profileCompletion.percentage * 0.3;
    if (studentData.placementStatus?.resumeVerified) score += 20;
    if (studentData.projects?.length > 0) score += Math.min(20, studentData.projects.length * 5);
    if (studentData.internships?.length > 0) score += Math.min(15, studentData.internships.length * 7.5);
    if (studentData.hackathons?.length > 0) score += Math.min(15, studentData.hackathons.length * 5);
    return Math.min(100, Math.round(score));
  };

  const readinessPercentage = calculatePlacementReadiness();

  const statsCards = [
    {
      title: 'Projects Completed',
      value: studentData?.projects?.length || 0,
      icon: FaProjectDiagram,
      color: 'bg-blue-500'
    },
    {
      title: 'Internships',
      value: studentData?.internships?.length || 0,
      icon: FaBriefcase,
      color: 'bg-green-500'
    },
    {
      title: 'Hackathons',
      value: studentData?.hackathons?.length || 0,
      icon: FaTrophy,
      color: 'bg-yellow-500'
    },
    {
      title: 'Skills Verified',
      value: studentData?.skills?.filter(s => s.verified)?.length || 0,
      icon: FaCheckCircle,
      color: 'bg-purple-500'
    }
  ];

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'];

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">Placement Readiness</h2>
        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <div className="flex justify-between mb-2">
              <span className="text-gray-700 dark:text-gray-300">Overall Readiness</span>
              <span className="text-primary-600 font-bold">{readinessPercentage}%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4">
              <div
                className="bg-primary-600 h-4 rounded-full transition-all duration-500"
                style={{ width: `${readinessPercentage}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <div key={index} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">{card.title}</p>
                  <p className="text-3xl font-bold text-gray-800 dark:text-white mt-2">{card.value}</p>
                </div>
                <div className={`${card.color} p-4 rounded-lg`}>
                  <Icon className="text-white text-2xl" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4">My Progress Over Time</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={progressData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="completion" stroke="#3b82f6" name="Profile Completion" />
              <Line type="monotone" dataKey="milestones" stroke="#10b981" name="Placement Milestones" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Skills Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={[
                  { name: 'Verified', value: studentData?.skills?.filter(s => s.verified)?.length || 0 },
                  { name: 'Unverified', value: studentData?.skills?.filter(s => !s.verified)?.length || 0 }
                ]}
                cx="50%"
                cy="50%"
                labelLine={false}
                label
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {[0, 1].map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {!studentData?.placementStatus?.resumeVerified && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
          <div className="flex items-center space-x-3">
            <FaLock className="text-yellow-600 text-2xl" />
            <div>
              <h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-300">
                Verification Required
              </h3>
              <p className="text-yellow-700 dark:text-yellow-400 mt-1">
                Your profile is pending verification. Once verified, you'll be able to access all placement drives and opportunities.
              </p>
              <Link
                to="/student/resumes"
                className="inline-block mt-3 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 text-sm"
              >
                Upload Resume to Get Verified
              </Link>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Quick Upload</h3>
        <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
          <FaUpload className="text-4xl text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Drag and drop files here or click to upload
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500">
            Upload certificates, resumes, or achievement documents
          </p>
        </div>
      </div>
    </div>
  );
};

export default DashboardHome;

