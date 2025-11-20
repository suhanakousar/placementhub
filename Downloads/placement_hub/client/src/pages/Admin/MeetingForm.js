import React, { useState, useEffect, useMemo } from 'react';
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
  const [studentFilters, setStudentFilters] = useState({
    search: '',
    department: '',
    year: '',
    specialization: ''
  });
  const [applyToFilteredStudents, setApplyToFilteredStudents] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const filteredStudents = useMemo(() => {
    const searchValue = studentFilters.search.trim().toLowerCase();
    return students.filter((student) => {
      const firstName = student.personalInfo?.firstName || '';
      const lastName = student.personalInfo?.lastName || '';
      const rollNumber = student.academicInfo?.rollNumber || '';
      const email = student.userId?.email || '';
      const matchesSearch = searchValue
        ? `${firstName} ${lastName}`.toLowerCase().includes(searchValue) ||
          rollNumber.toLowerCase().includes(searchValue) ||
          email.toLowerCase().includes(searchValue)
        : true;
      const matchesDepartment = studentFilters.department
        ? student.academicInfo?.department === studentFilters.department
        : true;
      const matchesYear = studentFilters.year
        ? String(student.academicInfo?.year || '') === studentFilters.year
        : true;
      const matchesSpecialization = studentFilters.specialization
        ? student.academicInfo?.specialization === studentFilters.specialization
        : true;
      return matchesSearch && matchesDepartment && matchesYear && matchesSpecialization;
    });
  }, [students, studentFilters]);
  const departmentOptions = useMemo(() => {
    const departments = students
      .map((student) => student.academicInfo?.department)
      .filter(Boolean);
    return Array.from(new Set(departments)).sort();
  }, [students]);
  const specializationOptions = useMemo(() => {
    const specializations = students
      .map((student) => student.academicInfo?.specialization)
      .filter(Boolean);
    return Array.from(new Set(specializations)).sort();
  }, [students]);
  const yearOptions = useMemo(() => {
    const years = students
      .map((student) => student.academicInfo?.year)
      .filter(Boolean);
    return Array.from(new Set(years)).sort((a, b) => a - b);
  }, [students]);

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
    { value: 'google_meet', label: 'Google Meet' }
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
          meetingPlatform: 'google_meet',
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
          studentTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          mentorTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone
        });
      }
      setApplyToFilteredStudents(false);
      setStudentFilters({
        search: '',
        department: '',
        year: '',
        specialization: ''
      });
    }
  }, [isOpen, initialData]);

  useEffect(() => {
    if (applyToFilteredStudents && filteredStudents.length === 0) {
      setApplyToFilteredStudents(false);
    }
  }, [applyToFilteredStudents, filteredStudents.length]);

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
        if ((!formData.studentId && !applyToFilteredStudents) || !formData.startTime || !formData.endTime || !formData.title) {
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

        if (applyToFilteredStudents) {
          if (filteredStudents.length === 0) {
            toast.error('No students match the selected filters');
            setSubmitting(false);
            return;
          }

          const filtersPayload = {};
          if (studentFilters.department) filtersPayload.department = studentFilters.department;
          if (studentFilters.year) filtersPayload.year = studentFilters.year;
          if (studentFilters.specialization) filtersPayload.specialization = studentFilters.specialization;

          await api.post('/admin/meetings/bulk', {
            studentIds: filteredStudents.map((student) => student._id),
            filters: filtersPayload,
            startTime: start.toISOString(),
            endTime: end.toISOString(),
            title: formData.title,
            topic: formData.topic,
            description: formData.description,
            notes: formData.notes,
            meetingPlatform: formData.meetingPlatform,
            studentTimezone: formData.studentTimezone,
            mentorTimezone: formData.mentorTimezone
          });
          toast.success(`Meeting scheduled for ${filteredStudents.length} students`);
        } else {
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
          
          await api.post('/admin/meetings', meetingPayload);
          toast.success('Meeting created successfully');
        }
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
          {!requestId && (
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-900/20">
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                Filter students by cohorts
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input
                  type="text"
                  value={studentFilters.search}
                  onChange={(e) => setStudentFilters({ ...studentFilters, search: e.target.value })}
                  placeholder="Search by name, email, or roll number"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                />
                <select
                  value={studentFilters.department}
                  onChange={(e) => setStudentFilters({ ...studentFilters, department: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                >
                  <option value="">All Departments</option>
                  {departmentOptions.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
                <select
                  value={studentFilters.year}
                  onChange={(e) => setStudentFilters({ ...studentFilters, year: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                >
                  <option value="">All Passout Batches</option>
                  {yearOptions.map((yr) => (
                    <option key={yr} value={String(yr)}>
                      {yr}
                    </option>
                  ))}
                </select>
                <select
                  value={studentFilters.specialization}
                  onChange={(e) => setStudentFilters({ ...studentFilters, specialization: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                >
                  <option value="">All Specializations</option>
                  {specializationOptions.map((spec) => (
                    <option key={spec} value={spec}>
                      {spec}
                    </option>
                  ))}
                </select>
              </div>
              <div className="mt-3 flex flex-col md:flex-row md:items-center md:justify-between text-xs text-gray-600 dark:text-gray-400 gap-2">
                <span>{filteredStudents.length} student(s) match the current filters</span>
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={() => setStudentFilters({
                      search: '',
                      department: '',
                      year: '',
                      specialization: ''
                    })}
                    className="text-primary-600 dark:text-primary-400 hover:underline"
                  >
                    Reset filters
                  </button>
                </div>
              </div>
              <label className="mt-3 flex items-center space-x-2 text-sm text-gray-700 dark:text-gray-300">
                <input
                  type="checkbox"
                  className="h-4 w-4 text-primary-600 rounded"
                  checked={applyToFilteredStudents}
                  onChange={(e) => {
                    setApplyToFilteredStudents(e.target.checked);
                    if (e.target.checked) {
                      setFormData((prev) => ({ ...prev, studentId: '' }));
                    }
                  }}
                  disabled={filteredStudents.length === 0}
                />
                <span>
                  Schedule for all matched students ({filteredStudents.length})
                </span>
              </label>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <FaUser className="inline mr-1" />
              Select Student *
            </label>
            <select
              value={formData.studentId}
              onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
              required={!applyToFilteredStudents}
              disabled={!!requestId || applyToFilteredStudents}
            >
              <option value="">Select a student</option>
              {filteredStudents.map(student => (
                <option key={student._id} value={student._id}>
                  {student.personalInfo?.firstName} {student.personalInfo?.lastName} - {student.academicInfo?.rollNumber}
                </option>
              ))}
            </select>
            {applyToFilteredStudents && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                This meeting will be scheduled for all {filteredStudents.length} filtered students.
              </p>
            )}
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
                Meeting Platform
              </label>
              <div className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white bg-gray-50 dark:bg-gray-800">
                <span className="text-gray-700 dark:text-gray-300">Google Meet</span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                A real Google Meet meeting will be created automatically
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

