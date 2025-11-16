import React, { useState } from 'react';
import { FaPlus, FaGraduationCap, FaChartLine } from 'react-icons/fa';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const Academics = ({ studentData, onUpdate }) => {
  const [showAddSemester, setShowAddSemester] = useState(false);
  const [formData, setFormData] = useState({
    semester: '',
    sgpa: '',
    backlogs: 0,
    year: ''
  });

  const calculateCGPA = (semesters) => {
    if (!semesters || semesters.length === 0) return 0;
    const total = semesters.reduce((sum, s) => sum + parseFloat(s.sgpa || 0), 0);
    return (total / semesters.length).toFixed(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const updatedSemesters = [...(studentData?.academicInfo?.semesters || []), formData];
      await api.put('/students/profile', {
        academicInfo: {
          ...studentData.academicInfo,
          semesters: updatedSemesters,
          cgpa: calculateCGPA(updatedSemesters)
        }
      });
      toast.success('Semester data added successfully');
      setShowAddSemester(false);
      setFormData({ semester: '', sgpa: '', backlogs: 0, year: '' });
      onUpdate();
    } catch (error) {
      toast.error('Failed to add semester data');
    }
  };

  const chartData = studentData?.academicInfo?.semesters?.map((sem, index) => ({
    semester: `Sem ${sem.semester}`,
    sgpa: parseFloat(sem.sgpa || 0),
    cgpa: parseFloat(studentData.academicInfo.cgpa || 0)
  })) || [];

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Academic Details</h2>
          <button
            onClick={() => setShowAddSemester(!showAddSemester)}
            className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            <FaPlus />
            <span>Add Semester</span>
          </button>
        </div>

        {showAddSemester && (
          <form onSubmit={handleSubmit} className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Semester
                </label>
                <input
                  type="number"
                  value={formData.semester}
                  onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-600 dark:text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  SGPA
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.sgpa}
                  onChange={(e) => setFormData({ ...formData, sgpa: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-600 dark:text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Backlogs
                </label>
                <input
                  type="number"
                  value={formData.backlogs}
                  onChange={(e) => setFormData({ ...formData, backlogs: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-600 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Year
                </label>
                <input
                  type="number"
                  value={formData.year}
                  onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-600 dark:text-white"
                  required
                />
              </div>
            </div>
            <div className="mt-4 flex space-x-2">
              <button
                type="submit"
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                Add
              </button>
              <button
                type="button"
                onClick={() => setShowAddSemester(false)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <p className="text-gray-600 dark:text-gray-400">Current CGPA</p>
            <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
              {studentData?.academicInfo?.cgpa || '0.00'}
            </p>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
            <p className="text-gray-600 dark:text-gray-400">Department</p>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              {studentData?.academicInfo?.department || 'N/A'}
            </p>
          </div>
          <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
            <p className="text-gray-600 dark:text-gray-400">Year</p>
            <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {studentData?.academicInfo?.year || 'N/A'}
            </p>
          </div>
        </div>



        {chartData.length > 0 && (
          <div className="mt-6">
            <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4">CGPA Trend</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="semester" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="sgpa" stroke="#3b82f6" name="SGPA" />
                <Line type="monotone" dataKey="cgpa" stroke="#10b981" name="CGPA" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
};

export default Academics;

