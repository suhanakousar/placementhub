import React, { useState, useEffect, useMemo } from 'react';
import api from '../../utils/api';

const LeaderboardTable = ({
  hideHeader = false,
  title = 'Registered Students Leaderboard',
  subtitle = 'Click on any student to view their competitive profile'
}) => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      const response = await api.get('/leaderboard-public');
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
    return parts
      .map((p) => p[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getAvatarUrl = (avatarUrl) => {
    if (!avatarUrl) return null;
    if (avatarUrl.startsWith('http')) return avatarUrl;
    const baseUrl =
      process.env.REACT_APP_API_URL?.replace('/api', '') ||
      'https://placementhub-2.onrender.com';
    return `${baseUrl}/${avatarUrl}`;
  };

  const handleRowClick = (studentId) => {
    const url = `/student-profile/${studentId}`;
    window.open(url, '_blank');
  };

  const placeholders = useMemo(() => Array.from({ length: 10 }), []);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-32" />
          {placeholders.map((_, idx) => (
            <div key={idx} className="h-10 bg-gray-100 rounded" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md border border-yellow-200/80 overflow-hidden">
      {!hideHeader && (
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {title}
          </h2>
          {subtitle && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {subtitle}
            </p>
          )}
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-yellow-50/60 dark:bg-yellow-500/5">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-yellow-200/70">
                Rank
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-yellow-200/70">
                Username
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-yellow-200/70">
                Overall Score
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-100 dark:divide-gray-800">
            {students.length === 0 ? (
              <tr>
                <td
                  colSpan="3"
                  className="px-6 py-8 text-center text-gray-500 dark:text-gray-400"
                >
                  No students found
                </td>
              </tr>
            ) : (
              students.map((student) => (
                <tr
                  key={student.studentId}
                  onClick={() => handleRowClick(student.studentId)}
                  className="hover:bg-yellow-50/60 dark:hover:bg-yellow-500/10 cursor-pointer transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">
                        {student.rank}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-9 w-9 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center overflow-hidden mr-3 ring-1 ring-gray-200 dark:ring-gray-700">
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
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {student.username}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                      {student.overallScore?.toLocaleString() || '—'}
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

