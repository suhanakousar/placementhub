import React, { useState, useEffect } from 'react';
import { FaArrowUp, FaArrowDown, FaUser } from 'react-icons/fa';
import api from '../../utils/api';

const LeaderboardTable = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      const response = await api.get('/students/leaderboard');
      setStudents(response.data.students || []);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.split(' ');
    return parts.map(p => p[0]).join('').toUpperCase().slice(0, 2);
  };

  const getAvatarUrl = (avatarUrl) => {
    if (!avatarUrl) return null;
    if (avatarUrl.startsWith('http')) return avatarUrl;
    const baseUrl = process.env.REACT_APP_API_URL?.replace('/api', '') || 'https://placementhub-2.onrender.com';
    return `${baseUrl}/${avatarUrl}`;
  };

  const handleRowClick = (studentId) => {
    const url = `/student-profile/${studentId}`;
    window.open(url, '_blank');
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-12 bg-gray-100 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-xl font-bold text-gray-900">Registered Students Leaderboard</h2>
        <p className="text-sm text-gray-600 mt-1">Click on any student to view their competitive profile</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                Rank
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                Username
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                Overall Score
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {students.length === 0 ? (
              <tr>
                <td colSpan="3" className="px-6 py-8 text-center text-gray-500">
                  No students found
                </td>
              </tr>
            ) : (
              students.map((student, index) => (
                <tr
                  key={student.studentId}
                  onClick={() => handleRowClick(student.studentId)}
                  className="hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className="text-sm font-medium text-gray-900">{student.rank}</span>
                      {student.rankChange !== null && student.rankChange !== undefined && (
                        <span className="ml-2">
                          {student.rankChange > 0 ? (
                            <FaArrowUp className="text-green-500 text-xs" />
                          ) : student.rankChange < 0 ? (
                            <FaArrowDown className="text-red-500 text-xs" />
                          ) : null}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden mr-3">
                        {getAvatarUrl(student.avatarUrl) ? (
                          <img
                            src={getAvatarUrl(student.avatarUrl)}
                            alt={student.username}
                            className="h-full w-full object-cover"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              if (e.target.nextSibling) {
                                e.target.nextSibling.style.display = 'flex';
                              }
                            }}
                          />
                        ) : null}
                        <div className="h-full w-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-semibold hidden">
                          {getInitials(student.username)}
                        </div>
                        {!getAvatarUrl(student.avatarUrl) && (
                          <div className="h-full w-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-semibold">
                            {getInitials(student.username)}
                          </div>
                        )}
                      </div>
                      <div className="text-sm font-medium text-gray-900">{student.username}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <span className="text-sm font-semibold text-gray-900">
                      {student.overallScore.toLocaleString()}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LeaderboardTable;

