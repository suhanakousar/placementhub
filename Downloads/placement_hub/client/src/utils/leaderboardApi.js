import api from './api';

export const fetchRegisteredStudents = async ({
  search = '',
  page = 1,
  limit = 20
} = {}) => {
  const response = await api.get('/leaderboard/students', {
    params: { search, page, limit }
  });
  return response.data;
};

export const fetchStudentProgress = async (studentId) => {
  const response = await api.get(`/leaderboard/students/${studentId}/progress`);
  return response.data;
};

