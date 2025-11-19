import React, { useState, useEffect } from 'react';
import { FaTimes, FaEnvelope, FaPaperclip, FaCalendar, FaUsers, FaFileAlt } from 'react-icons/fa';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const EmailSender = ({ isOpen, onClose, onSuccess }) => {
  const [students, setStudents] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [formData, setFormData] = useState({
    templateName: 'custom',
    subject: '',
    body: '',
    scheduledFor: '',
    includesMeetingLink: false,
    includesICSFile: false,
    meetingId: '',
    createTasks: false
  });
  const [attachments, setAttachments] = useState([]);
  const [preview, setPreview] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);

  const templates = [
    { value: 'custom', label: 'Custom Email' },
    { value: 'meeting_scheduled', label: 'Meeting Scheduled' },
    { value: 'meeting_reminder', label: 'Meeting Reminder' },
    { value: 'feedback_summary', label: 'Feedback Summary' }
  ];

  const variables = {
    '{{student_name}}': 'Student Name',
    '{{student_email}}': 'Student Email',
    '{{meeting_title}}': 'Meeting Title',
    '{{meeting_start_local}}': 'Meeting Start Time (Local)',
    '{{meeting_link}}': 'Meeting Link',
    '{{feedback_rating}}': 'Feedback Rating',
    '{{feedback_summary}}': 'Feedback Summary',
    '{{task_due}}': 'Task Due Date',
    '{{reschedule_link}}': 'Reschedule Link'
  };

  useEffect(() => {
    if (isOpen) {
      fetchStudents();
    }
  }, [isOpen]);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const response = await api.get('/students');
      setStudents(response.data || []);
    } catch (error) {
      console.error('Error fetching students:', error);
      toast.error('Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  const handleTemplateChange = (templateName) => {
    setFormData({ ...formData, templateName });
    if (templateName !== 'custom') {
      // Auto-fill template content
      const templateContent = {
        meeting_scheduled: {
          subject: 'Meeting Scheduled: {{meeting_title}}',
          body: `Hello {{student_name}},\n\nYour meeting has been scheduled.\n\nTitle: {{meeting_title}}\nDate & Time: {{meeting_start_local}}\nMeeting Link: {{meeting_link}}\n\nWe look forward to meeting with you!`
        },
        meeting_reminder: {
          subject: 'Reminder: {{meeting_title}}',
          body: `Hello {{student_name}},\n\nThis is a reminder that your meeting is coming up.\n\nTitle: {{meeting_title}}\nDate & Time: {{meeting_start_local}}\nMeeting Link: {{meeting_link}}\n\nPlease join on time!`
        },
        feedback_summary: {
          subject: 'Meeting Feedback: {{meeting_title}}',
          body: `Hello {{student_name}},\n\nHere is the feedback from your recent meeting.\n\nRating: {{feedback_rating}}/5\nSummary: {{feedback_summary}}\n\nKeep up the great work!`
        }
      };
      const content = templateContent[templateName];
      if (content) {
        setFormData({
          ...formData,
          templateName,
          subject: content.subject,
          body: content.body
        });
      }
    }
  };

  const insertVariable = (variable) => {
    setFormData({
      ...formData,
      body: formData.body + variable
    });
  };

  const generatePreview = () => {
    let previewText = formData.body;
    Object.keys(variables).forEach(variable => {
      previewText = previewText.replace(new RegExp(variable, 'g'), `[${variables[variable]}]`);
    });
    setPreview(previewText);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const variables = {};
      // Extract variables from body for personalization
      Object.keys(variables).forEach(variable => {
        variables[variable.replace(/[{}]/g, '')] = variable;
      });

      await api.post('/admin/emails/send', {
        recipientIds: selectedStudents,
        templateName: formData.templateName,
        subject: formData.subject,
        body: formData.body,
        variables,
        attachments: attachments.map(att => ({
          name: att.name,
          file: att.file,
          type: att.type
        })),
        includesMeetingLink: formData.includesMeetingLink,
        includesICSFile: formData.includesICSFile,
        meetingId: formData.meetingId || undefined,
        createTasks: formData.createTasks,
        scheduledFor: formData.scheduledFor || undefined
      });

      toast.success(`Email ${formData.scheduledFor ? 'scheduled' : 'sent'} successfully`);
      onSuccess();
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send email');
    } finally {
      setSubmitting(false);
    }
  };

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        setAttachments([...attachments, {
          name: file.name,
          file: event.target.result,
          type: file.type
        }]);
      };
      reader.readAsDataURL(file);
    });
  };

  const toggleStudent = (studentId) => {
    setSelectedStudents(
      selectedStudents.includes(studentId)
        ? selectedStudents.filter(id => id !== studentId)
        : [...selectedStudents, studentId]
    );
  };

  const selectAll = () => {
    setSelectedStudents(students.map(s => s._id));
  };

  const deselectAll = () => {
    setSelectedStudents([]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
            <FaEnvelope className="inline mr-2" />
            One-Click Email Sender
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <FaTimes className="text-2xl" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Student Selection */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                <FaUsers className="inline mr-1" />
                Select Recipients *
              </label>
              <div className="space-x-2">
                <button
                  type="button"
                  onClick={selectAll}
                  className="text-sm text-primary-600 hover:text-primary-700"
                >
                  Select All
                </button>
                <button
                  type="button"
                  onClick={deselectAll}
                  className="text-sm text-gray-600 hover:text-gray-700"
                >
                  Deselect All
                </button>
              </div>
            </div>
            <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-4 max-h-48 overflow-y-auto">
              {loading ? (
                <p className="text-gray-500 text-center py-4">Loading students...</p>
              ) : students.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No students found</p>
              ) : (
                <div className="space-y-2">
                  {students.map(student => (
                    <label
                      key={student._id}
                      className="flex items-center space-x-2 p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedStudents.includes(student._id)}
                        onChange={() => toggleStudent(student._id)}
                        className="rounded"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {student.personalInfo?.firstName} {student.personalInfo?.lastName} - {student.academicInfo?.rollNumber}
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>
            {selectedStudents.length > 0 && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                {selectedStudents.length} student(s) selected
              </p>
            )}
          </div>

          {/* Template Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Email Template
            </label>
            <select
              value={formData.templateName}
              onChange={(e) => handleTemplateChange(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
            >
              {templates.map(template => (
                <option key={template.value} value={template.value}>{template.label}</option>
              ))}
            </select>
          </div>

          {/* Subject */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Subject *
            </label>
            <input
              type="text"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
              required
            />
          </div>

          {/* Variables Helper */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Available Variables (Click to insert)
            </label>
            <div className="flex flex-wrap gap-2">
              {Object.entries(variables).map(([variable, label]) => (
                <button
                  key={variable}
                  type="button"
                  onClick={() => insertVariable(variable)}
                  className="px-3 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-sm hover:bg-gray-300 dark:hover:bg-gray-600"
                  title={label}
                >
                  {variable}
                </button>
              ))}
            </div>
          </div>

          {/* Body */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Email Body *
            </label>
            <textarea
              value={formData.body}
              onChange={(e) => setFormData({ ...formData, body: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
              rows="10"
              required
            />
            <button
              type="button"
              onClick={generatePreview}
              className="mt-2 text-sm text-primary-600 hover:text-primary-700"
            >
              Generate Preview
            </button>
            {preview && (
              <div className="mt-2 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <p className="text-sm font-medium mb-2">Preview:</p>
                <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{preview}</p>
              </div>
            )}
          </div>

          {/* Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <FaPaperclip className="inline mr-1" />
                Attachments
              </label>
              <input
                type="file"
                multiple
                onChange={handleFileUpload}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
              />
              {attachments.length > 0 && (
                <div className="mt-2 space-y-1">
                  {attachments.map((att, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded">
                      <span className="text-sm text-gray-700 dark:text-gray-300">{att.name}</span>
                      <button
                        type="button"
                        onClick={() => setAttachments(attachments.filter((_, i) => i !== index))}
                        className="text-red-600 hover:text-red-700"
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
                <FaCalendar className="inline mr-1" />
                Schedule Email (Optional)
              </label>
              <input
                type="datetime-local"
                value={formData.scheduledFor}
                onChange={(e) => setFormData({ ...formData, scheduledFor: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>

          {/* Toggles */}
          <div className="space-y-3 border-t pt-4">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.includesMeetingLink}
                onChange={(e) => setFormData({ ...formData, includesMeetingLink: e.target.checked })}
                className="rounded"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Include Meeting Link
              </span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.includesICSFile}
                onChange={(e) => setFormData({ ...formData, includesICSFile: e.target.checked })}
                className="rounded"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Include ICS Calendar File
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
                Create Follow-Up Tasks for Recipients
              </span>
            </label>
          </div>

          <div className="flex space-x-3">
            <button
              type="submit"
              disabled={submitting || selectedStudents.length === 0}
              className="flex-1 px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
            >
              {submitting ? 'Sending...' : formData.scheduledFor ? 'Schedule Email' : 'Send Now'}
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

export default EmailSender;

