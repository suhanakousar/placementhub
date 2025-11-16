import React, { useState, useEffect } from 'react';
import { FaDownload } from 'react-icons/fa';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import api from '../../utils/api';

const Reports = () => {
  const [departmentStats, setDepartmentStats] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const response = await api.get('/analytics/department-wise');
      setDepartmentStats(response.data);
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const chartData = Object.entries(departmentStats).map(([dept, data]) => ({
    name: dept,
    placed: data.placed,
    total: data.total,
    percentage: data.percentage?.toFixed(1)
  }));

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444'];

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Reports & Analytics</h2>
          <button className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
            <FaDownload />
            <span>Export PDF</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div>
            <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4">
              Department-wise Placements
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="placed" fill="#3b82f6" name="Placed" />
                <Bar dataKey="total" fill="#10b981" name="Total" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div>
            <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4">
              Placement Percentage
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percentage }) => `${name}: ${percentage}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="percentage"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-3 px-4 text-gray-700 dark:text-gray-300">Department</th>
                <th className="text-left py-3 px-4 text-gray-700 dark:text-gray-300">Total Students</th>
                <th className="text-left py-3 px-4 text-gray-700 dark:text-gray-300">Placed</th>
                <th className="text-left py-3 px-4 text-gray-700 dark:text-gray-300">Percentage</th>
              </tr>
            </thead>
            <tbody>
              {chartData.map((data, index) => (
                <tr key={index} className="border-b border-gray-200 dark:border-gray-700">
                  <td className="py-3 px-4 text-gray-800 dark:text-white">{data.name}</td>
                  <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{data.total}</td>
                  <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{data.placed}</td>
                  <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{data.percentage}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Reports;

