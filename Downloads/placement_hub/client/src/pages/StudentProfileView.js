import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip
} from 'recharts';
import { FaTrophy, FaChartLine, FaGraduationCap, FaGlobe } from 'react-icons/fa';
import api from '../utils/api';
import { getDepartmentName } from '../utils/departmentNames';

const StudentProfileView = () => {
  const { studentId } = useParams();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchStudentProfile() {
      try {
        const response = await api.get(`/students/${studentId}/coding-stats`);
        setData(response.data);
      } catch (err) {
        console.error('Error fetching student profile:', err);
        setError('Failed to load student profile');
      } finally {
        setLoading(false);
      }
    }
    fetchStudentProfile();
  }, [studentId]);

  const getProfilePhotoUrl = () => {
    if (data?.studentInfo?.profilePhoto) {
      if (data.studentInfo.profilePhoto.startsWith('http')) {
        return data.studentInfo.profilePhoto;
      }
      const baseUrl = process.env.REACT_APP_API_URL?.replace('/api', '') || 'https://placementhub-2.onrender.com';
      return `${baseUrl}/${data.studentInfo.profilePhoto}`;
    }
    return null;
  };

  const getInitials = () => {
    const firstName = data?.studentInfo?.firstName || '';
    const lastName = data?.studentInfo?.lastName || '';
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || 'U';
  };

  const RatingCard = ({ platform, data: platformData, color }) => {
    if (!platformData || platformData.warning) {
      return (
        <div className="bg-white rounded-lg shadow-md p-5 mb-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold text-gray-900">{platform}</h3>
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }}></div>
          </div>
          <p className="text-sm text-gray-500">
            {platformData?.warning || 'No data available yet. Add your profile link to see live stats.'}
          </p>
        </div>
      );
    }

    const rating = platformData.contestRating || 0;
    const highestRating = platformData.highestRating || rating;
    const contests = platformData.contests || 0;
    const ratingChange = platformData.ratingChange || 0;
    const history = platformData.ratingHistory || [];

    return (
      <div className="bg-white rounded-lg shadow-md p-5 mb-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">{platform}</h3>
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }}></div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-xs text-gray-500 mb-1">Current Rating</p>
            <p className="text-2xl font-bold text-gray-900">
              {rating ? rating.toLocaleString() : '—'}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Highest Rating</p>
            <p className="text-2xl font-bold text-gray-900">
              {highestRating ? highestRating.toLocaleString() : '—'}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Total Contests</p>
            <p className="text-xl font-semibold text-gray-700">
              {contests || '—'}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Rating Change</p>
            <p className={`text-xl font-semibold ${ratingChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {ratingChange ? `${ratingChange >= 0 ? '+' : ''}${ratingChange}` : '—'}
            </p>
          </div>
        </div>

        {history.length > 0 ? (
          <div className="h-24 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={history}>
                <defs>
                  <linearGradient id={`gradient-${platform}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={color} stopOpacity={0.3}/>
                    <stop offset="95%" stopColor={color} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <Area 
                  type="monotone" 
                  dataKey="rating" 
                  stroke={color} 
                  strokeWidth={2}
                  fill={`url(#gradient-${platform})`}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="text-xs text-gray-400">No contest history yet.</p>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-lg shadow-md p-8 text-center max-w-md">
          <p className="text-lg text-gray-600">{error || 'Student profile not found'}</p>
        </div>
      </div>
    );
  }

  const studentInfo = data.studentInfo || {};
  const codingStats = data.codingStats || {};
  const scoreDistribution = data.scoreDistribution || [];
  const overallScore = data.overallScore || 0;
  const COLORS = ['#8b5a2b', '#2563eb', '#f89f1b', '#16a34a'];

  // Generate mock global rankings history for visualization
  const generateGlobalRankingsHistory = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentMonth = new Date().getMonth();
    const history = [];
    for (let i = 11; i >= 0; i--) {
      const monthIndex = (currentMonth - i + 12) % 12;
      history.push({
        month: months[monthIndex],
        score: Math.max(0, overallScore + Math.random() * 1000 - 500)
      });
    }
    return history;
  };

  const globalRankingsHistory = generateGlobalRankingsHistory();

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Side Panel */}
          <div className="lg:col-span-1 space-y-6">
            {/* User Info Card */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex flex-col items-center mb-6">
                {getProfilePhotoUrl() ? (
                  <img
                    src={getProfilePhotoUrl()}
                    alt="Profile"
                    className="w-20 h-20 rounded object-cover mb-4"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      if (e.target.nextSibling) {
                        e.target.nextSibling.style.display = 'flex';
                      }
                    }}
                  />
                ) : (
                  <div className="w-20 h-20 rounded bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold mb-4">
                    {getInitials()}
                  </div>
                )}
                <h2 className="text-xl font-bold text-gray-900 mb-1">
                  {studentInfo.firstName} {studentInfo.lastName}
                </h2>
                <p className="text-gray-600 text-sm">
                  {getDepartmentName(studentInfo.department)} • Year {studentInfo.year || 'N/A'}
                </p>
              </div>

              <div className="border-t border-gray-100 pt-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-gray-600">
                    <FaTrophy className="mr-2 text-yellow-500" />
                    <span className="text-sm">Overall Score</span>
                  </div>
                  <span className="text-xl font-bold text-gray-800">{overallScore.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-gray-600">
                    <FaGlobe className="mr-2 text-blue-500" />
                    <span className="text-sm">Global Rank</span>
                  </div>
                  <span className="text-xl font-bold text-gray-800">#{data.globalRank || 'N/A'}</span>
                </div>
              </div>
            </div>

            {/* Recent Education Card */}
            <div className="bg-white rounded-lg shadow-md p-5">
              <div className="flex items-center mb-4">
                <FaGraduationCap className="text-blue-600 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900">Recent Education</h3>
              </div>
              <div className="space-y-2">
                <p className="text-gray-900 font-medium">
                  {getDepartmentName(studentInfo.department)} • Year {studentInfo.year || 'N/A'}
                </p>
                <p className="text-gray-600 text-sm">Roll: {studentInfo.rollNumber || 'N/A'}</p>
              </div>
            </div>

            {/* Rating Cards */}
            <RatingCard
              platform="CodeChef"
              data={codingStats.codechef}
              color="#8b5a2b"
            />
            <RatingCard
              platform="Codeforces"
              data={codingStats.codeforces}
              color="#2563eb"
            />
            <RatingCard
              platform="LeetCode"
              data={codingStats.leetcode}
              color="#f89f1b"
            />
          </div>

          {/* Right Side Main Panel */}
          <div className="lg:col-span-2 space-y-6">
            {/* Global Rankings Card */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Global Rankings</h3>
              <p className="text-sm text-gray-600 mb-6">Rating progression over time</p>
              {globalRankingsHistory.length > 0 ? (
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={globalRankingsHistory}>
                      <defs>
                        <linearGradient id="gradient-global" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Area 
                        type="monotone" 
                        dataKey="score" 
                        stroke="#f59e0b" 
                        strokeWidth={2}
                        fill="url(#gradient-global)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="text-sm text-gray-500">No ranking history available.</p>
              )}
            </div>

            {/* Score Distribution Card */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Score Distribution</h3>
              <p className="text-sm text-gray-600 mb-6">Breakdown by platform</p>
              {scoreDistribution.length > 0 ? (
                <div className="flex flex-col lg:flex-row items-center gap-8">
                  <div className="w-full lg:w-1/2 h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={scoreDistribution}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={false}
                          outerRadius={110}
                          innerRadius={70}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {scoreDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'white',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                          }}
                          formatter={(value) => `${value.toLocaleString()} pts`}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex-1 w-full lg:w-auto">
                    <div className="space-y-4">
                      {scoreDistribution.map((item, index) => (
                        <div key={index} className="flex items-center">
                          <div 
                            className="w-4 h-4 rounded-full mr-3 flex-shrink-0"
                            style={{ backgroundColor: item.color || COLORS[index % COLORS.length] }}
                          ></div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
                            <p className="text-xs text-gray-600">{item.value.toLocaleString()} pts</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-500">This chart will populate once we fetch scores from your coding profiles.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentProfileView;
