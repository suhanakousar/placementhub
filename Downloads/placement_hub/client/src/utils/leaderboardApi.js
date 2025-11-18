import api from './api';

export const fetchLeaderboard = async (period = 'today', page = 1, limit = 20) => {
  const response = await api.get('/leaderboard', {
    params: { period, page, limit }
  });
  return response.data;
};

export const fetchLeaderboardProfile = async (userId) => {
  const response = await api.get(`/users/${userId}/profile`);
  return response.data;
};


