import React, { useState, useEffect } from 'react';
import { FaTimes, FaStar, FaCheckCircle } from 'react-icons/fa';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const FeedbackForm = ({ isOpen, onClose, onSuccess, meetingId, meeting }) => {
  const [formData, setFormData] = useState({
    rating: 5,
    tags: [],
    strengths: [''],
    areasForImprovement: [''],
    detailedComments: '',
    recommendations: '',
    visibleToStudent: true,
    sendFeedbackEmail: true,
    createTasks: true
  });
  const [submitting, setSubmitting] = useState(false);

  const availableTags = [
    'communication',
    'coding',
    'resume',
    'hr_prep',
    'confidence',
    'technical_skills',
    'problem_solving',
    'presentation',
    'time_management',
    'leadership',
    'teamwork',
    'needs_improvement',
    'excellent',
    'good_progress'
  ];

  useEffect(() => {
    if (isOpen && meeting?.feedbackId) {
      // Load existing feedback if editing
      fetchFeedback();
    }
  }, [isOpen, meeting]);

  const fetchFeedback = async () => {
    try {
      const response = await api.get(`/admin/meetings/${meetingId}/feedback`);
      if (response.data) {
        setFormData({
          rating: response.data.rating || 5,
          tags: response.data.tags || [],
          strengths: response.data.strengths && response.data.strengths.length > 0 
            ? response.data.strengths 
            : [''],
          areasForImprovement: response.data.areasForImprovement && response.data.areasForImprovement.length > 0
            ? response.data.areasForImprovement
            : [''],
          detailedComments: response.data.detailedComments || '',
          recommendations: response.data.recommendations || '',
          visibleToStudent: response.data.visibleToStudent !== false,
          sendFeedbackEmail: false,
          createTasks: false
        });
      }
    } catch (error) {
      console.error('Error fetching feedback:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await api.post(`/admin/meetings/${meetingId}/feedback`, {
        ...formData,
        strengths: formData.strengths.filter(s => s.trim()),
        areasForImprovement: formData.areasForImprovement.filter(a => a.trim())
      });
      toast.success('Feedback submitted successfully');
      onSuccess();
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit feedback');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleTag = (tag) => {
    setFormData({
      ...formData,
      tags: formData.tags.includes(tag)
        ? formData.tags.filter(t => t !== tag)
        : [...formData.tags, tag]
    });
  };

  const addStrength = () => {
    setFormData({
      ...formData,
      strengths: [...formData.strengths, '']
    });
  };

  const removeStrength = (index) => {
    setFormData({
      ...formData,
      strengths: formData.strengths.filter((_, i) => i !== index)
    });
  };

  const updateStrength = (index, value) => {
    const newStrengths = [...formData.strengths];
    newStrengths[index] = value;
    setFormData({ ...formData, strengths: newStrengths });
  };

  const addAreaForImprovement = () => {
    setFormData({
      ...formData,
      areasForImprovement: [...formData.areasForImprovement, '']
    });
  };

  const removeAreaForImprovement = (index) => {
    setFormData({
      ...formData,
      areasForImprovement: formData.areasForImprovement.filter((_, i) => i !== index)
    });
  };

  const updateAreaForImprovement = (index, value) => {
    const newAreas = [...formData.areasForImprovement];
    newAreas[index] = value;
    setFormData({ ...formData, areasForImprovement: newAreas });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
            Meeting Feedback
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <FaTimes className="text-2xl" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Rating */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Rating (1-5) *
            </label>
            <div className="flex space-x-2">
              {[1, 2, 3, 4, 5].map(rating => (
                <button
                  key={rating}
                  type="button"
                  onClick={() => setFormData({ ...formData, rating })}
                  className={`text-3xl ${
                    formData.rating >= rating
                      ? 'text-yellow-400'
                      : 'text-gray-300 dark:text-gray-600'
                  }`}
                >
                  <FaStar />
                </button>
              ))}
              <span className="ml-4 text-lg font-semibold text-gray-700 dark:text-gray-300">
                {formData.rating}/5
              </span>
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tags (Select all that apply)
            </label>
            <div className="flex flex-wrap gap-2">
              {availableTags.map(tag => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className={`px-3 py-1 rounded-full text-sm transition ${
                    formData.tags.includes(tag)
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                  }`}
                >
                  {tag.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </button>
              ))}
            </div>
          </div>

          {/* Strengths */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Strengths
            </label>
            <div className="space-y-2">
              {formData.strengths.map((strength, index) => (
                <div key={index} className="flex space-x-2">
                  <input
                    type="text"
                    value={strength}
                    onChange={(e) => updateStrength(index, e.target.value)}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                    placeholder="Enter a strength..."
                  />
                  {formData.strengths.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeStrength(index)}
                      className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addStrength}
                className="text-sm text-primary-600 hover:text-primary-700"
              >
                + Add Strength
              </button>
            </div>
          </div>

          {/* Areas for Improvement */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Areas for Improvement
            </label>
            <div className="space-y-2">
              {formData.areasForImprovement.map((area, index) => (
                <div key={index} className="flex space-x-2">
                  <input
                    type="text"
                    value={area}
                    onChange={(e) => updateAreaForImprovement(index, e.target.value)}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                    placeholder="Enter an area for improvement..."
                  />
                  {formData.areasForImprovement.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeAreaForImprovement(index)}
                      className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addAreaForImprovement}
                className="text-sm text-primary-600 hover:text-primary-700"
              >
                + Add Area
              </button>
            </div>
          </div>

          {/* Detailed Comments */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Detailed Comments
            </label>
            <textarea
              value={formData.detailedComments}
              onChange={(e) => setFormData({ ...formData, detailedComments: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
              rows="5"
              placeholder="Write detailed feedback comments..."
            />
          </div>

          {/* Recommendations */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Recommendations
            </label>
            <textarea
              value={formData.recommendations}
              onChange={(e) => setFormData({ ...formData, recommendations: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
              rows="3"
              placeholder="Provide recommendations for next steps..."
            />
          </div>

          {/* Options */}
          <div className="space-y-3 border-t pt-4">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.visibleToStudent}
                onChange={(e) => setFormData({ ...formData, visibleToStudent: e.target.checked })}
                className="rounded"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Visible to Student (Student can view this feedback)
              </span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.sendFeedbackEmail}
                onChange={(e) => setFormData({ ...formData, sendFeedbackEmail: e.target.checked })}
                className="rounded"
                disabled={!formData.visibleToStudent}
              />
              <span className={`text-sm ${formData.visibleToStudent ? 'text-gray-700 dark:text-gray-300' : 'text-gray-400'}`}>
                Send Feedback Email Now (Email feedback summary to student)
              </span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.createTasks}
                onChange={(e) => setFormData({ ...formData, createTasks: e.target.checked })}
                className="rounded"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Create Follow-Up Tasks Automatically (Based on selected tags)
              </span>
            </label>
          </div>

          <div className="flex space-x-3">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
            >
              {submitting ? 'Submitting...' : 'Submit Feedback'}
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

export default FeedbackForm;

