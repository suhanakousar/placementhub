import React, { useState, useEffect } from 'react';
import { 
  LineChart, Line, AreaChart, Area, PieChart, Pie, Cell, 
  ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, CartesianGrid 
} from 'recharts';
import { FaTrophy, FaChartLine, FaUser, FaGraduationCap, FaCode } from 'react-icons/fa';
import api from '../../utils/api';
import { getDepartmentName } from '../../utils/departmentNames';
import { useAuth } from '../../contexts/AuthContext';

const CompetitiveProfile = ({ studentData }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  useEffect(() => {
    fetchCodingStats();
  }, []);

  const fetchCodingStats = async () => {
    try {
      const response = await api.get('/students/coding-stats');
      setData(response.data);
    } catch (error) {
      console.error('Error fetching coding stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const getProfilePhotoUrl = () => {
    if (studentData?.personalInfo?.profilePhoto) {
      if (studentData.personalInfo.profilePhoto.startsWith('http')) {
        return studentData.personalInfo.profilePhoto;
      }
      const baseUrl = process.env.REACT_APP_API_URL?.replace('/api', '') || 'https://placementhub-2.onrender.com';
      return `${baseUrl}/${studentData.personalInfo.profilePhoto}`;
    }
    return null;
  };

  const getInitials = () => {
    const firstName = studentData?.personalInfo?.firstName || '';
    const lastName = studentData?.personalInfo?.lastName || '';
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || 'U';
  };

  const RatingCard = ({ platform, data: platformData, color }) => {
    if (!platformData || platformData.error) return null;

    const rating = platformData.contestRating || 0;
    const highestRating = platformData.highestRating || rating;
    const contests = platformData.contests || 0;
    const ratingChange = platformData.ratingChange || 0;
    const history = platformData.ratingHistory || [];

    return (
      <div className="bg-white rounded-lg shadow-md p-5 mb-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">{platform}</h3>
          <div className={`w-3 h-3 rounded-full`} style={{ backgroundColor: color }}></div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-xs text-gray-500 mb-1">Current Rating</p>
            <p className="text-2xl font-bold text-gray-900">{rating.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Highest Rating</p>
            <p className="text-2xl font-bold text-gray-900">{highestRating.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Total Contests</p>
            <p className="text-xl font-semibold text-gray-700">{contests}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Rating Change</p>
            <p className={`text-xl font-semibold ${ratingChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {ratingChange >= 0 ? '+' : ''}{ratingChange}
            </p>
          </div>
        </div>

        {history.length > 0 && (
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

  if (!data) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-8 text-center">
        <p className="text-gray-600">No coding platform data available. Please add your coding platform profiles in your profile settings.</p>
      </div>
    );
  }

  const COLORS = ['#3b82f6', '#f59e0b', '#10b981', '#8b5cf6', '#ef4444', '#6b7280', '#8b5cf6'];

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
                  {studentData?.personalInfo?.firstName} {studentData?.personalInfo?.lastName}
                </h2>
                <p className="text-gray-600 text-sm">
                  {getDepartmentName(studentData?.academicInfo?.department)} • Year {studentData?.academicInfo?.year}
                </p>
              </div>

              <div className="border-t border-gray-100 pt-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-gray-600">
                    <FaTrophy className="mr-2 text-yellow-500" />
                    <span className="text-sm">Overall Score</span>
                  </div>
                  <span className="text-xl font-bold text-gray-800">{data.overallScore?.toLocaleString() || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-gray-600">
                    <FaChartLine className="mr-2 text-blue-500" />
                    <span className="text-sm">Global Rank</span>
                  </div>
                  <span className="text-xl font-bold text-gray-800">#{data.globalRank?.toLocaleString() || 'N/A'}</span>
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
                  {getDepartmentName(studentData?.academicInfo?.department)} • Year {studentData?.academicInfo?.year}
                </p>
                <p className="text-gray-600 text-sm">Roll: {studentData?.academicInfo?.rollNumber || 'N/A'}</p>
              </div>
            </div>

            {/* Rating Cards */}
            {data.codingStats?.codechef && (
              <RatingCard 
                platform="CodeChef" 
                data={data.codingStats.codechef} 
                color="#8b5a2b"
              />
            )}
            {data.codingStats?.codeforces && (
              <RatingCard 
                platform="Codeforces" 
                data={data.codingStats.codeforces} 
                color="#3182ce"
              />
            )}
            {data.codingStats?.leetcode && (
              <RatingCard 
                platform="LeetCode" 
                data={data.codingStats.leetcode} 
                color="#f89f1b"
              />
            )}
          </div>

          {/* Right Side Main Panel */}
          <div className="lg:col-span-2 space-y-6">
            {/* Global Rankings Card */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Global Rankings</h3>
              <p className="text-sm text-gray-600 mb-6">Based on problems solved</p>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.globalRankingsHistory || []}>
                    <defs>
                      <linearGradient id="gradient-global" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4}/>
                        <stop offset="50%" stopColor="#fbbf24" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#fef3c7" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis 
                      dataKey="month" 
                      stroke="#6b7280"
                      style={{ fontSize: '12px' }}
                    />
                    <YAxis 
                      stroke="#6b7280"
                      style={{ fontSize: '12px' }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                      }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="rating" 
                      stroke="#f59e0b" 
                      strokeWidth={3}
                      fill="url(#gradient-global)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Score Distribution Card */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Score Distribution</h3>
              <p className="text-sm text-gray-600 mb-6">Weighted by problems solved per platform</p>
              <div className="flex flex-col lg:flex-row items-center lg:items-start justify-center gap-8">
                <div className="w-full max-w-sm">
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={data.scoreDistribution || []}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={false}
                        outerRadius={110}
                        innerRadius={70}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {(data.scoreDistribution || []).map((entry, index) => (
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
                    {(data.scoreDistribution || []).map((item, index) => (
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompetitiveProfile;

