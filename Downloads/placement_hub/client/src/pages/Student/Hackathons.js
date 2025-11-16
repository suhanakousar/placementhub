import React, { useState } from 'react';
import { FaPlus, FaTrophy } from 'react-icons/fa';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const Hackathons = ({ studentData, onUpdate }) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    platform: '',
    date: '',
    rank: '',
    teamSize: 1,
    description: '',
    projectLink: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/students/hackathons', formData);
      toast.success('Hackathon added successfully');
      setShowAddForm(false);
      setFormData({
        name: '',
        platform: '',
        date: '',
        rank: '',
        teamSize: 1,
        description: '',
        projectLink: ''
      });
      onUpdate();
    } catch (error) {
      toast.error('Failed to add hackathon');
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Hackathons & Achievements</h2>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          <FaPlus />
          <span>Add Hackathon</span>
        </button>
      </div>

      {showAddForm && (
        <form onSubmit={handleSubmit} className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Hackathon Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-600 dark:text-white"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Platform
              </label>
              <input
                type="text"
                value={formData.platform}
                onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-600 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Date
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-600 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Rank
              </label>
              <input
                type="number"
                value={formData.rank}
                onChange={(e) => setFormData({ ...formData, rank: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-600 dark:text-white"
                placeholder="e.g., 1, 2, 3"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Team Size
              </label>
              <input
                type="number"
                value={formData.teamSize}
                onChange={(e) => setFormData({ ...formData, teamSize: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-600 dark:text-white"
                min="1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Project Link
              </label>
              <input
                type="url"
                value={formData.projectLink}
                onChange={(e) => setFormData({ ...formData, projectLink: e.target.value })}
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
              Add Hackathon
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
        {studentData?.hackathons?.map((hackathon, index) => (
          <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <FaTrophy className="text-yellow-500" />
                  <h3 className="text-xl font-semibold text-gray-800 dark:text-white">{hackathon.name}</h3>
                </div>
                <p className="text-gray-600 dark:text-gray-400 mt-1">{hackathon.platform}</p>
                {hackathon.rank && (
                  <span className="inline-block mt-2 px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
                    Rank: {hackathon.rank}
                  </span>
                )}
                <p className="text-gray-600 dark:text-gray-400 mt-2">{hackathon.description}</p>
                {hackathon.date && (
                  <p className="text-sm text-gray-500 mt-2">
                    Date: {new Date(hackathon.date).toLocaleDateString()}
                  </p>
                )}
                {hackathon.projectLink && (
                  <a href={hackathon.projectLink} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:text-primary-700 mt-2 inline-block">
                    View Project →
                  </a>
                )}
              </div>
            </div>
          </div>
        ))}
        {(!studentData?.hackathons || studentData.hackathons.length === 0) && (
          <p className="text-gray-500 text-center py-8">No hackathons added yet</p>
        )}
      </div>
    </div>
  );
};

export default Hackathons;

