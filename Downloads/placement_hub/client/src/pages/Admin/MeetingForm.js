import React, { useState, useEffect } from 'react';
import { FaTimes, FaCalendar, FaClock, FaUser, FaVideo } from 'react-icons/fa';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const MeetingForm = ({ isOpen, onClose, onSuccess, initialData = null, requestId = null }) => {
  const [formData, setFormData] = useState({
    studentId: '',
    startTime: '',
    endTime: '',
    title: '',
    topic: 'resume_review',
    description: '',
    notes: '',
    meetingPlatform: 'google_meet',
    studentTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    mentorTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone
  });
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

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

  const platforms = [
    { value: 'google_meet', label: 'Google Meet' },
    { value: 'zoom', label: 'Zoom' },
    { value: 'microsoft_teams', label: 'Microsoft Teams' },
    { value: 'custom', label: 'Custom Link' },
    { value: 'in_person', label: 'In Person' }
  ];

  useEffect(() => {
    if (isOpen) {
      fetchStudents();
      if (initialData) {
        setFormData({
          studentId: initialData.studentId || '',
          startTime: initialData.startTime ? new Date(initialData.startTime).toISOString().slice(0, 16) : '',
          endTime: initialData.endTime ? new Date(initialData.endTime).toISOString().slice(0, 16) : '',
          title: initialData.title || '',
          topic: initialData.topic || 'resume_review',
          description: initialData.description || '',
          notes: initialData.notes || '',
          meetingPlatform: initialData.meetingPlatform || 'google_meet',
          customLink: initialData.meetingLink || '',
          studentTimezone: initialData.studentTimezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
          mentorTimezone: initialData.mentorTimezone || Intl.DateTimeFormat().resolvedOptions().timeZone
        });
      } else {
        // Reset form when opening fresh
        setFormData({
          studentId: '',
          startTime: '',
          endTime: '',
          title: '',
          topic: 'resume_review',
          description: '',
          notes: '',
          meetingPlatform: 'google_meet',
          customLink: '',
          studentTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          mentorTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone
        });
      }
    }
  }, [isOpen, initialData]);

  const fetchStudents = async () => {
    try {
      const response = await api.get('/students');
      setStudents(response.data || []);
    } catch (error) {
      console.error('Error fetching students:', error);
      toast.error('Failed to load students');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Prevent duplicate submissions
    if (submitting) {
      return;
    }
    
    setSubmitting(true);

    try {
      if (requestId) {
        // Approve request and create meeting
        await api.post(`/admin/meetings/requests/${requestId}/approve`, {
          startTime: new Date(formData.startTime).toISOString(),
          endTime: new Date(formData.endTime).toISOString(),
          meetingPlatform: formData.meetingPlatform,
          notes: formData.notes,
          message: 'Meeting approved and scheduled'
        });
        toast.success('Meeting request approved and meeting created');
      } else {
        // Validate required fields
        if (!formData.studentId || !formData.startTime || !formData.endTime || !formData.title) {
          toast.error('Please fill in all required fields');
          setSubmitting(false);
          return;
        }

        // Validate dates
        const start = new Date(formData.startTime);
        const end = new Date(formData.endTime);
        if (end <= start) {
          toast.error('End time must be after start time');
          setSubmitting(false);
          return;
        }

        // Create new meeting directly
        const meetingPayload = {
          studentId: formData.studentId,
          startTime: start.toISOString(),
          endTime: end.toISOString(),
          title: formData.title,
          topic: formData.topic,
          description: formData.description,
          notes: formData.notes,
          meetingPlatform: formData.meetingPlatform,
          studentTimezone: formData.studentTimezone,
          mentorTimezone: formData.mentorTimezone
        };
        
        // Add custom link if platform is custom
        if (formData.meetingPlatform === 'custom' && formData.customLink) {
          meetingPayload.meetingLink = formData.customLink;
        }
        
        await api.post('/admin/meetings', meetingPayload);
        toast.success('Meeting created successfully');
      }
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Meeting creation error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to create meeting';
      toast.error(errorMessage);
      
      // If it's a conflict error, don't close the form
      if (error.response?.status === 400 && errorMessage.includes('conflict')) {
        // Keep form open
      } else {
        // Close form on other errors after showing message
        setTimeout(() => {
          onClose();
        }, 2000);
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
            {requestId ? 'Approve Meeting Request' : initialData ? 'Edit Meeting' : 'Schedule Meeting'}
          </h2>
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
              <FaUser className="inline mr-1" />
              Select Student *
            </label>
            <select
              value={formData.studentId}
              onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
              required
              disabled={!!requestId}
            >
              <option value="">Select a student</option>
              {students.map(student => (
                <option key={student._id} value={student._id}>
                  {student.personalInfo?.firstName} {student.personalInfo?.lastName} - {student.academicInfo?.rollNumber}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <FaCalendar className="inline mr-1" />
                Start Date & Time *
              </label>
              <input
                type="datetime-local"
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <FaClock className="inline mr-1" />
                End Date & Time *
              </label>
              <input
                type="datetime-local"
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Meeting Title *
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <FaVideo className="inline mr-1" />
                Meeting Platform *
              </label>
              <select
                value={formData.meetingPlatform}
                onChange={(e) => setFormData({ ...formData, meetingPlatform: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                required
              >
                {platforms.map(platform => (
                  <option key={platform.value} value={platform.value}>{platform.label}</option>
                ))}
              </select>
              {formData.meetingPlatform === 'custom' && (
                <input
                  type="text"
                  value={formData.customLink || ''}
                  onChange={(e) => setFormData({ ...formData, customLink: e.target.value })}
                  placeholder="Enter custom meeting link"
                  className="mt-2 w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                />
              )}
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {formData.meetingPlatform === 'zoom' && 'A real Zoom meeting will be created'}
                {formData.meetingPlatform === 'google_meet' && 'A real Google Meet link will be generated'}
                {formData.meetingPlatform === 'microsoft_teams' && 'A real Teams meeting will be created'}
                {formData.meetingPlatform === 'custom' && 'Enter your custom meeting link'}
                {formData.meetingPlatform === 'in_person' && 'In-person meeting (no link needed)'}
              </p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
              rows="3"
              placeholder="Meeting description and agenda..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Admin Notes (Private)
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
              rows="2"
              placeholder="Private notes for admin reference..."
            />
          </div>

          <div className="flex space-x-3">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
            >
              {submitting ? 'Creating...' : requestId ? 'Approve & Schedule' : initialData ? 'Update Meeting' : 'Schedule Meeting'}
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

export default MeetingForm;

