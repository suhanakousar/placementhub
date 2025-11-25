import React, { useState, useEffect } from 'react';
import { FaArrowUp, FaArrowDown, FaUser, FaSort, FaSortUp, FaSortDown } from 'react-icons/fa';
import api from '../../utils/api';

const Leaderboard = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortConfig, setSortConfig] = useState({ key: 'rank', direction: 'asc' });

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      const response = await api.get('/students/leaderboard');
      setStudents(response.data.students || []);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedStudents = [...students].sort((a, b) => {
    if (sortConfig.key === 'rank' || sortConfig.key === 'overallScore') {
      return sortConfig.direction === 'asc' 
        ? a[sortConfig.key] - b[sortConfig.key]
        : b[sortConfig.key] - a[sortConfig.key];
    }
    if (sortConfig.key === 'username') {
      const nameA = a.username.toLowerCase();
      const nameB = b.username.toLowerCase();
      return sortConfig.direction === 'asc'
        ? nameA.localeCompare(nameB)
        : nameB.localeCompare(nameA);
    }
    return 0;
  });

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

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) {
      return <FaSort className="text-gray-400" />;
    }
    return sortConfig.direction === 'asc' 
      ? <FaSortUp className="text-primary-600" />
      : <FaSortDown className="text-primary-600" />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="bg-gradient-to-r from-primary-600 to-primary-700 px-6 py-4">
            <h1 className="text-2xl font-bold text-white">Global Leaderboard</h1>
            <p className="text-primary-100 text-sm mt-1">Ranking based on overall coding platform scores</p>
          </div>

          {students.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-gray-600 text-lg">No students on the leaderboard yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('rank')}
                    >
                      <div className="flex items-center gap-2">
                        Rank
                        {getSortIcon('rank')}
                      </div>
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('username')}
                    >
                      <div className="flex items-center gap-2">
                        Student Name
                        {getSortIcon('username')}
                      </div>
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('overallScore')}
                    >
                      <div className="flex items-center justify-end gap-2">
                        Overall Score
                        {getSortIcon('overallScore')}
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sortedStudents.map((student) => (
                    <tr
                      key={student.studentId}
                      className="hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => handleRowClick(student.studentId)}
                      onMouseDown={(e) => {
                        if (e.button === 1) {
                          e.preventDefault();
                        }
                      }}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-900">
                            {student.rank}
                          </span>
                          {student.rankChange && (
                            <span className={`${student.rankChange > 0 ? 'text-green-500' : 'text-red-500'}`}>
                              {student.rankChange > 0 ? <FaArrowUp /> : <FaArrowDown />}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-sm font-semibold text-gray-600 overflow-hidden">
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
                            <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-primary-400 to-primary-600 text-white" style={{ display: getAvatarUrl(student.avatarUrl) ? 'none' : 'flex' }}>
                              {getInitials(student.username)}
                            </div>
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">{student.username}</div>
                            {student.rollNumber && (
                              <div className="text-xs text-gray-500">{student.rollNumber}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <span className="text-lg font-semibold text-primary-600">
                          {student.overallScore.toLocaleString()}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;

