import React, { useState } from 'react';
import { FaTimes } from 'react-icons/fa';
import api from '../utils/api';
import toast from 'react-hot-toast';

const MeetingRequestForm = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    topic: 'resume_review',
    title: '',
    description: '',
    additionalNotes: '',
    priority: 'medium',
    preferredSlots: [],
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
  });
  const [loading, setLoading] = useState(false);
  const [currentSlot, setCurrentSlot] = useState({ date: '', startTime: '', endTime: '' });

  const topics = [
    { value: 'resume_review', label: 'Resume Review' },
    { value: 'mock_interview', label: 'Mock Interview' },
    { value: 'coding_doubts', label: 'Coding Doubts' },
    { value: 'career_guidance', label: 'Career Guidance' },
    { value: 'placement_prep', label: 'Placement Preparation' },
    { value: 'project_review', label: 'Project Review' },
    { value: 'soft_skills', label: 'Soft Skills' },
    { value: 'other', label: 'Other' }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await api.post('/meetings/request', formData);
      onSuccess();
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit meeting request');
    } finally {
      setLoading(false);
    }
  };

  const addTimeSlot = () => {
    if (currentSlot.date && currentSlot.startTime && currentSlot.endTime) {
      setFormData({
        ...formData,
        preferredSlots: [
          ...formData.preferredSlots,
          {
            date: currentSlot.date,
            startTime: currentSlot.startTime,
            endTime: currentSlot.endTime,
            timezone: formData.timezone
          }
        ]
      });
      setCurrentSlot({ date: '', startTime: '', endTime: '' });
    }
  };

  const removeTimeSlot = (index) => {
    setFormData({
      ...formData,
      preferredSlots: formData.preferredSlots.filter((_, i) => i !== index)
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Request Meeting</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <FaTimes className="text-2xl" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Meeting Topic *
            </label>
            <select
              value={formData.topic}
              onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
              required
            >
              {topics.map(topic => (
                <option key={topic.value} value={topic.value}>{topic.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
              placeholder="e.g., Resume Review for Software Engineer Role"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
              rows="4"
              placeholder="Brief description of what you'd like to discuss..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Priority
            </label>
            <select
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Preferred Time Slots
            </label>
            <div className="space-y-2 mb-2">
              <div className="grid grid-cols-3 gap-2">
                <input
                  type="date"
                  value={currentSlot.date}
                  onChange={(e) => setCurrentSlot({ ...currentSlot, date: e.target.value })}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                />
                <input
                  type="time"
                  value={currentSlot.startTime}
                  onChange={(e) => setCurrentSlot({ ...currentSlot, startTime: e.target.value })}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                />
                <input
                  type="time"
                  value={currentSlot.endTime}
                  onChange={(e) => setCurrentSlot({ ...currentSlot, endTime: e.target.value })}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                />
              </div>
              <button
                type="button"
                onClick={addTimeSlot}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
              >
                Add Time Slot
              </button>
            </div>
            {formData.preferredSlots.length > 0 && (
              <div className="space-y-1">
                {formData.preferredSlots.map((slot, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded">
                    <span className="text-sm">
                      {slot.date} {slot.startTime} - {slot.endTime}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeTimeSlot(index)}
                      className="text-red-600 hover:text-red-800"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Additional Notes
            </label>
            <textarea
              value={formData.additionalNotes}
              onChange={(e) => setFormData({ ...formData, additionalNotes: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
              rows="3"
              placeholder="Any additional information..."
            />
          </div>

          <div className="flex space-x-3">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
            >
              {loading ? 'Submitting...' : 'Submit Request'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-white rounded-lg hover:bg-gray-400 dark:hover:bg-gray-600"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MeetingRequestForm;

