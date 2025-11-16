import React, { useState, useEffect } from 'react';
import { FaPlus, FaEdit, FaTrash } from 'react-icons/fa';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const Drives = () => {
  const [drives, setDrives] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    companyName: '',
    role: '',
    package: '',
    description: '',
    eligibilityCriteria: {
      minCGPA: '',
      departments: [],
      year: '',
      backlogsAllowed: 0
    },
    applicationDeadline: '',
    driveDate: ''
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDrives();
  }, []);

  const fetchDrives = async () => {
    try {
      const response = await api.get('/drives');
      setDrives(response.data);
    } catch (error) {
      console.error('Error fetching drives:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/drives', formData);
      toast.success('Placement drive created successfully');
      setShowAddForm(false);
      setFormData({
        companyName: '',
        role: '',
        package: '',
        description: '',
        eligibilityCriteria: {
          minCGPA: '',
          departments: [],
          year: '',
          backlogsAllowed: 0
        },
        applicationDeadline: '',
        driveDate: ''
      });
      fetchDrives();
    } catch (error) {
      toast.error('Failed to create placement drive');
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Placement Drives</h2>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          <FaPlus />
          <span>Add Drive</span>
        </button>
      </div>

      {showAddForm && (
        <form onSubmit={handleSubmit} className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Company Name
              </label>
              <input
                type="text"
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-600 dark:text-white"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Role
              </label>
              <input
                type="text"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-600 dark:text-white"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Package
              </label>
              <input
                type="text"
                value={formData.package}
                onChange={(e) => setFormData({ ...formData, package: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-600 dark:text-white"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Minimum CGPA
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.eligibilityCriteria.minCGPA}
                onChange={(e) => setFormData({
                  ...formData,
                  eligibilityCriteria: { ...formData.eligibilityCriteria, minCGPA: e.target.value }
                })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-600 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Application Deadline
              </label>
              <input
                type="date"
                value={formData.applicationDeadline}
                onChange={(e) => setFormData({ ...formData, applicationDeadline: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-600 dark:text-white"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Drive Date
              </label>
              <input
                type="date"
                value={formData.driveDate}
                onChange={(e) => setFormData({ ...formData, driveDate: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-600 dark:text-white"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-600 dark:text-white"
                rows="3"
              />
            </div>
          </div>
          <div className="mt-4 flex space-x-2">
            <button
              type="submit"
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              Create Drive
            </button>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="space-y-4">
        {drives.map((drive) => (
          <div key={drive._id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-xl font-semibold text-gray-800 dark:text-white">{drive.companyName}</h3>
                <p className="text-gray-600 dark:text-gray-400">{drive.role}</p>
                <p className="text-gray-600 dark:text-gray-400">Package: {drive.package}</p>
                <p className="text-sm text-gray-500 mt-2">
                  Deadline: {new Date(drive.applicationDeadline).toLocaleDateString()}
                </p>
                <p className="text-sm text-gray-500">
                  Applications: {drive.applications?.length || 0}
                </p>
              </div>
              <div className="flex space-x-2">
                <span className={`px-3 py-1 rounded-full text-sm ${
                  drive.status === 'open' ? 'bg-green-100 text-green-800' :
                  drive.status === 'closed' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {drive.status}
                </span>
              </div>
            </div>
          </div>
        ))}
        {drives.length === 0 && (
          <p className="text-gray-500 text-center py-8">No placement drives</p>
        )}
      </div>
    </div>
  );
};

export default Drives;

