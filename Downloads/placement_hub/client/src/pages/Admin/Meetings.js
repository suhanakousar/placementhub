import React, { useState, useEffect } from 'react';
import { FaPlus, FaFilter, FaCheckCircle, FaTimesCircle, FaExclamationTriangle, FaEdit, FaTrash, FaUser, FaCalendar, FaVideo, FaClock, FaEnvelope } from 'react-icons/fa';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import MeetingForm from './MeetingForm';
import FeedbackForm from './FeedbackForm';
import EmailSender from './EmailSender';
import ConfirmDeleteModal from '../../components/ConfirmDeleteModal';
import { formatTimeInTimezone } from '../../utils/meetingUtils';

const Meetings = () => {
  const [meetings, setMeetings] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showMeetingForm, setShowMeetingForm] = useState(false);
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [showEmailSender, setShowEmailSender] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState({
    isOpen: false,
    type: null, // 'meeting' or 'request'
    id: null,
    name: ''
  });
  const [filters, setFilters] = useState({
    studentId: '',
    status: '',
    dateRange: ''
  });
  const [viewMode, setViewMode] = useState('all'); // all, requests, upcoming, past

  useEffect(() => {
    fetchMeetings();
    fetchRequests();
  }, [filters, viewMode]);

  const fetchMeetings = async () => {
    try {
      const queryParams = new URLSearchParams();
      if (filters.studentId) queryParams.append('studentId', filters.studentId);
      if (filters.status) queryParams.append('status', filters.status);
      if (filters.dateRange) queryParams.append('dateRange', filters.dateRange);

      const response = await api.get(`/admin/meetings?${queryParams.toString()}`);
      setMeetings(response.data || []);
    } catch (error) {
      console.error('Error fetching meetings:', error);
      toast.error('Failed to load meetings');
    } finally {
      setLoading(false);
    }
  };

  const fetchRequests = async () => {
    try {
      const response = await api.get('/admin/meetings/requests');
      setRequests(response.data || []);
    } catch (error) {
      console.error('Error fetching requests:', error);
    }
  };

  const handleApproveRequest = async (requestId) => {
    setSelectedRequest(requestId);
    setShowMeetingForm(true);
  };

  const handleDeclineRequest = async (requestId) => {
    try {
      await api.post(`/admin/meetings/requests/${requestId}/decline`, {
        reason: 'Request declined by admin'
      });
      toast.success('Request declined successfully');
      fetchRequests();
      fetchMeetings();
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to decline request';
      const currentStatus = error.response?.data?.currentStatus;
      
      if (currentStatus === 'declined') {
        toast.error('This request has already been declined');
        // Refresh to show updated status
        fetchRequests();
      } else if (currentStatus === 'approved') {
        toast.error('This request has already been approved. Cancel the meeting instead.');
        fetchRequests();
      } else {
        toast.error(errorMessage);
      }
      console.error('Decline error:', error.response?.data);
    }
  };

  const handleCancelMeeting = async (meetingId) => {
    try {
      await api.post(`/admin/meetings/${meetingId}/cancel`, {
        reason: 'Cancelled by admin'
      });
      toast.success('Meeting cancelled');
      fetchMeetings();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to cancel meeting');
    }
  };

  const handleDeleteMeeting = async () => {
    try {
      await api.delete(`/admin/meetings/${deleteConfirm.id}`);
      toast.success('Meeting deleted successfully');
      setDeleteConfirm({ isOpen: false, type: null, id: null, name: '' });
      fetchMeetings();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete meeting');
    }
  };

  const handleDeleteRequest = async () => {
    try {
      await api.delete(`/admin/meetings/requests/${deleteConfirm.id}`);
      toast.success('Meeting request deleted successfully');
      setDeleteConfirm({ isOpen: false, type: null, id: null, name: '' });
      fetchRequests();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete meeting request');
    }
  };

  const openDeleteConfirm = (type, id, name) => {
    console.log('Opening delete confirm:', { type, id, name });
    setDeleteConfirm({
      isOpen: true,
      type,
      id,
      name
    });
  };

  const handleMarkComplete = async (meetingId) => {
    try {
      await api.post(`/admin/meetings/${meetingId}/complete`);
      toast.success('Meeting marked as completed');
      fetchMeetings();
    } catch (error) {
      toast.error('Failed to mark meeting as complete');
    }
  };

  const handleMarkNoShow = async (meetingId) => {
    try {
      await api.post(`/admin/meetings/${meetingId}/no-show`);
      toast.success('Meeting marked as no-show');
      fetchMeetings();
    } catch (error) {
      toast.error('Failed to mark meeting as no-show');
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: { color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400', icon: FaExclamationTriangle },
      approved: { color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400', icon: FaCheckCircle },
      confirmed: { color: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400', icon: FaCheckCircle },
      completed: { color: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300', icon: FaCheckCircle },
      cancelled: { color: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400', icon: FaTimesCircle },
      no_show: { color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400', icon: FaExclamationTriangle }
    };
    return badges[status] || badges.pending;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const filteredMeetings = meetings.filter(meeting => {
    if (viewMode === 'upcoming') {
      return new Date(meeting.startTime) > new Date() && meeting.status !== 'cancelled' && meeting.status !== 'completed';
    }
    if (viewMode === 'past') {
      return new Date(meeting.startTime) < new Date() || meeting.status === 'completed' || meeting.status === 'no_show';
    }
    if (viewMode === 'requests') {
      return false; // Requests are shown separately
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Meetings Management</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Manage all meetings, requests, and provide feedback
          </p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => {
              setSelectedMeeting(null);
              setShowMeetingForm(true);
            }}
            className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            <FaPlus />
            <span>Create Meeting</span>
          </button>
          <button
            onClick={() => setShowEmailSender(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <FaEnvelope />
            <span>Send Email</span>
          </button>
        </div>
      </div>

      {/* View Mode Tabs */}
      <div className="flex space-x-2 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setViewMode('all')}
          className={`px-4 py-2 font-medium ${
            viewMode === 'all'
              ? 'border-b-2 border-primary-600 text-primary-600'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
          }`}
        >
          All Meetings
        </button>
        <button
          onClick={() => setViewMode('requests')}
          className={`px-4 py-2 font-medium ${
            viewMode === 'requests'
              ? 'border-b-2 border-primary-600 text-primary-600'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
          }`}
        >
          Pending Requests ({requests.length})
        </button>
        <button
          onClick={() => setViewMode('upcoming')}
          className={`px-4 py-2 font-medium ${
            viewMode === 'upcoming'
              ? 'border-b-2 border-primary-600 text-primary-600'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
          }`}
        >
          Upcoming
        </button>
        <button
          onClick={() => setViewMode('past')}
          className={`px-4 py-2 font-medium ${
            viewMode === 'past'
              ? 'border-b-2 border-primary-600 text-primary-600'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
          }`}
        >
          Past Meetings
        </button>
      </div>

      {/* Pending Requests View */}
      {viewMode === 'requests' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4">
            Pending Meeting Requests
          </h3>
          {requests.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No pending requests</p>
          ) : (
            <div className="space-y-4">
              {requests.map(request => (
                <div key={request._id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-800 dark:text-white">{request.title}</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        <FaUser className="inline mr-1" />
                        {request.studentId?.personalInfo?.firstName} {request.studentId?.personalInfo?.lastName}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Topic: {request.topic?.replace('_', ' ')} • Priority: {request.priority}
                      </p>
                      {request.description && (
                        <p className="text-sm text-gray-500 mt-2">{request.description}</p>
                      )}
                      {request.preferredSlots && request.preferredSlots.length > 0 && (
                        <div className="mt-2">
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Preferred Slots:</p>
                          {request.preferredSlots.map((slot, idx) => (
                            <p key={idx} className="text-sm text-gray-600 dark:text-gray-400">
                              {formatTimeInTimezone(slot.startTime, request.studentTimezone)}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex space-x-2 ml-4">
                      {request.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleApproveRequest(request._id)}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleDeclineRequest(request._id)}
                            className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition"
                          >
                            Decline
                          </button>
                        </>
                      )}
                      {request.status === 'declined' && (
                        <span className="px-4 py-2 bg-gray-300 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm">
                          Declined
                        </span>
                      )}
                      {request.status === 'approved' && (
                        <span className="px-4 py-2 bg-green-300 dark:bg-green-700 text-green-700 dark:text-green-300 rounded-lg text-sm">
                          Approved
                        </span>
                      )}
                      {(request.status === 'pending' || request.status === 'declined') && (
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            openDeleteConfirm('request', request._id, request.title);
                          }}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition cursor-pointer"
                          title="Delete Request"
                          type="button"
                        >
                          <FaTrash />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Meetings List */}
      {viewMode !== 'requests' && (
        <>
          {/* Filters */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <div className="flex items-center space-x-2 mb-4">
              <FaFilter />
              <h3 className="font-semibold text-gray-800 dark:text-white">Filters</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
              >
                <option value="">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="confirmed">Confirmed</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
                <option value="no_show">No Show</option>
              </select>
              <input
                type="date"
                value={filters.dateRange}
                onChange={(e) => setFilters({ ...filters, dateRange: e.target.value })}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                placeholder="Filter by date"
              />
              <button
                onClick={() => setFilters({ studentId: '', status: '', dateRange: '' })}
                className="px-4 py-2 bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-white rounded-lg hover:bg-gray-400 dark:hover:bg-gray-600"
              >
                Clear Filters
              </button>
            </div>
          </div>

          {/* Meetings Table */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-4 text-gray-700 dark:text-gray-300">Student</th>
                  <th className="text-left py-3 px-4 text-gray-700 dark:text-gray-300">Title</th>
                  <th className="text-left py-3 px-4 text-gray-700 dark:text-gray-300">Date & Time</th>
                  <th className="text-left py-3 px-4 text-gray-700 dark:text-gray-300">Status</th>
                  <th className="text-left py-3 px-4 text-gray-700 dark:text-gray-300">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredMeetings.map(meeting => {
                  const badge = getStatusBadge(meeting.status);
                  const StatusIcon = badge.icon;
                  const localTime = formatTimeInTimezone(meeting.startTime, meeting.studentTimezone);
                  
                  return (
                    <tr key={meeting._id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          <FaUser className="text-gray-400" />
                          <span className="text-gray-800 dark:text-white">
                            {meeting.studentId?.personalInfo?.firstName} {meeting.studentId?.personalInfo?.lastName}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium text-gray-800 dark:text-white">{meeting.title}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {meeting.topic?.replace('_', ' ')}
                          </p>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-1">
                          <FaClock className="text-gray-400" />
                          <span className="text-gray-600 dark:text-gray-400">{localTime}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded text-xs flex items-center space-x-1 w-fit ${badge.color}`}>
                          <StatusIcon className="text-xs" />
                          <span>{meeting.status}</span>
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex space-x-2">
                          {meeting.meetingLink && meeting.meetingLink !== 'In Person Meeting' && (
                            <a
                              href={meeting.meetingLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition"
                              title="Join Meeting"
                            >
                              <FaVideo />
                            </a>
                          )}
                          {meeting.meetingStartUrl && (
                            <a
                              href={meeting.meetingStartUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded transition"
                              title="Start Meeting (Host)"
                            >
                              Start
                            </a>
                          )}
                          {meeting.status === 'confirmed' && new Date(meeting.startTime) <= new Date() && (
                            <>
                              <button
                                onClick={() => handleMarkComplete(meeting._id)}
                                className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded"
                                title="Mark Complete"
                              >
                                <FaCheckCircle />
                              </button>
                              <button
                                onClick={() => handleMarkNoShow(meeting._id)}
                                className="p-2 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded"
                                title="Mark No-Show"
                              >
                                <FaExclamationTriangle />
                              </button>
                            </>
                          )}
                          {meeting.status === 'completed' && !meeting.feedbackId && (
                            <button
                              onClick={() => {
                                setSelectedMeeting(meeting);
                                setShowFeedbackForm(true);
                              }}
                              className="p-2 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded"
                              title="Add Feedback"
                            >
                              <FaEdit />
                            </button>
                          )}
                          {meeting.status !== 'cancelled' && new Date(meeting.startTime) > new Date() && (
                            <>
                              <button
                                onClick={() => handleCancelMeeting(meeting._id)}
                                className="p-2 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded"
                                title="Cancel Meeting"
                              >
                                <FaTimesCircle />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  openDeleteConfirm('meeting', meeting._id, meeting.title);
                                }}
                                className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition cursor-pointer"
                                title="Delete Meeting"
                                type="button"
                              >
                                <FaTrash />
                              </button>
                            </>
                          )}
                          {(meeting.status === 'cancelled') && (
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                openDeleteConfirm('meeting', meeting._id, meeting.title);
                              }}
                              className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition cursor-pointer"
                              title="Delete Meeting"
                              type="button"
                            >
                              <FaTrash />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filteredMeetings.length === 0 && (
              <div className="text-center py-12">
                <FaCalendar className="mx-auto text-4xl text-gray-400 mb-4" />
                <p className="text-gray-500 dark:text-gray-400">No meetings found</p>
              </div>
            )}
          </div>
        </>
      )}

      {/* Modals */}
      {showMeetingForm && (
        <MeetingForm
          isOpen={showMeetingForm}
          onClose={() => {
            setShowMeetingForm(false);
            setSelectedMeeting(null);
            setSelectedRequest(null);
          }}
          onSuccess={() => {
            fetchMeetings();
            fetchRequests();
          }}
          requestId={selectedRequest}
          initialData={selectedMeeting}
        />
      )}

      {showFeedbackForm && selectedMeeting && (
        <FeedbackForm
          isOpen={showFeedbackForm}
          onClose={() => {
            setShowFeedbackForm(false);
            setSelectedMeeting(null);
          }}
          onSuccess={() => {
            fetchMeetings();
          }}
          meetingId={selectedMeeting._id}
          meeting={selectedMeeting}
        />
      )}

      {showEmailSender && (
        <EmailSender
          isOpen={showEmailSender}
          onClose={() => setShowEmailSender(false)}
          onSuccess={() => {}}
        />
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, type: null, id: null, name: '' })}
        onConfirm={deleteConfirm.type === 'meeting' ? handleDeleteMeeting : handleDeleteRequest}
        title={deleteConfirm.type === 'meeting' ? 'Delete Meeting' : 'Delete Meeting Request'}
        message={deleteConfirm.type === 'meeting' 
          ? `Are you sure you want to delete the meeting "${deleteConfirm.name}"? This action cannot be undone.`
          : `Are you sure you want to delete the meeting request "${deleteConfirm.name}"? This action cannot be undone.`
        }
        itemName={deleteConfirm.name}
        type="delete"
      />
    </div>
  );
};

export default Meetings;

