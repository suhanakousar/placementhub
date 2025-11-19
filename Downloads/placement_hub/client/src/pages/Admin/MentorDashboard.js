import React, { useState, useEffect } from 'react';
import { FaCalendar, FaClock, FaVideo, FaCheckCircle, FaTimesCircle, FaExclamationTriangle, FaPlus, FaEnvelope, FaTasks, FaUser, FaFilter, FaChartLine } from 'react-icons/fa';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { formatTimeInTimezone } from '../../utils/meetingUtils';

const MentorDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('today'); // today, week, month
  const [filters, setFilters] = useState({
    studentId: '',
    dateRange: '',
    status: ''
  });
  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => {
    fetchDashboardData();
  }, [filters, selectedDate]);

  const fetchDashboardData = async () => {
    try {
      const response = await api.get('/admin/meetings/dashboard');
      setDashboardData(response.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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

  const stats = dashboardData?.stats || {};
  const todayMeetings = dashboardData?.todayMeetings || [];
  const pendingRequests = dashboardData?.pendingRequests || [];
  const upcomingMeetings = dashboardData?.upcomingMeetings || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Mentor Dashboard</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Manage meetings, provide feedback, and track student progress
          </p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => window.location.href = '/admin/meetings/create'}
            className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            <FaPlus />
            <span>Create Meeting</span>
          </button>
          <button
            onClick={() => window.location.href = '/admin/emails/send'}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <FaEnvelope />
            <span>Send Email</span>
          </button>
          <button
            onClick={() => window.location.href = '/admin/tasks'}
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            <FaTasks />
            <span>View Tasks</span>
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Upcoming Meetings</p>
              <p className="text-3xl font-bold text-gray-800 dark:text-white mt-2">
                {upcomingMeetings.length}
              </p>
            </div>
            <FaCalendar className="text-4xl text-blue-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Pending Requests</p>
              <p className="text-3xl font-bold text-gray-800 dark:text-white mt-2">
                {pendingRequests.length}
              </p>
            </div>
            <FaExclamationTriangle className="text-4xl text-yellow-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-sm">No-Show Rate</p>
              <p className="text-3xl font-bold text-gray-800 dark:text-white mt-2">
                {stats.noShowRate || '0.00'}%
              </p>
            </div>
            <FaChartLine className="text-4xl text-orange-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Avg Feedback Rating</p>
              <p className="text-3xl font-bold text-gray-800 dark:text-white mt-2">
                {stats.avgRating || '0.0'}/5
              </p>
            </div>
            <FaCheckCircle className="text-4xl text-green-500" />
          </div>
        </div>
      </div>

      {/* Today's Meetings */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-gray-800 dark:text-white flex items-center">
            <FaClock className="mr-2" />
            Today's Meetings ({todayMeetings.length})
          </h3>
          <button
            onClick={() => window.location.href = '/admin/meetings?filter=today'}
            className="text-primary-600 hover:text-primary-700 text-sm"
          >
            View All
          </button>
        </div>
        {todayMeetings.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No meetings scheduled for today</p>
        ) : (
          <div className="space-y-3">
            {todayMeetings.map(meeting => {
              const badge = getStatusBadge(meeting.status);
              const StatusIcon = badge.icon;
              const localTime = formatTimeInTimezone(meeting.startTime, meeting.studentTimezone);
              
              return (
                <div key={meeting._id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h4 className="font-semibold text-gray-800 dark:text-white">{meeting.title}</h4>
                        <span className={`px-2 py-1 rounded text-xs flex items-center space-x-1 ${badge.color}`}>
                          <StatusIcon className="text-xs" />
                          <span>{meeting.status}</span>
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        <FaUser className="inline mr-1" />
                        {meeting.studentId?.personalInfo?.firstName} {meeting.studentId?.personalInfo?.lastName}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        <FaClock className="inline mr-1" />
                        {localTime}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Topic: {meeting.topic?.replace('_', ' ')}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      {meeting.meetingLink && (
                        <a
                          href={meeting.meetingLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                        >
                          <FaVideo className="inline mr-1" />
                          Join
                        </a>
                      )}
                      <button
                        onClick={() => window.location.href = `/admin/meetings/${meeting._id}`}
                        className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700"
                      >
                        View
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Pending Requests */}
      {pendingRequests.length > 0 && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-yellow-800 dark:text-yellow-300 flex items-center">
              <FaExclamationTriangle className="mr-2" />
              Pending Meeting Requests ({pendingRequests.length})
            </h3>
            <button
              onClick={() => window.location.href = '/admin/meetings/requests'}
              className="text-yellow-700 hover:text-yellow-800 dark:text-yellow-400 text-sm font-medium"
            >
              View All
            </button>
          </div>
          <div className="space-y-3">
            {pendingRequests.slice(0, 5).map(request => (
              <div key={request._id} className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-yellow-200 dark:border-yellow-800">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-800 dark:text-white">{request.title}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      <FaUser className="inline mr-1" />
                      {request.studentId?.personalInfo?.firstName} {request.studentId?.personalInfo?.lastName}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Topic: {request.topic?.replace('_', ' ')} • Priority: {request.priority}
                    </p>
                    {request.description && (
                      <p className="text-sm text-gray-500 mt-1">{request.description}</p>
                    )}
                  </div>
                  <div className="flex space-x-2 ml-4">
                    <button
                      onClick={() => window.location.href = `/admin/meetings/requests/${request._id}/approve`}
                      className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => window.location.href = `/admin/meetings/requests/${request._id}/decline`}
                      className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                    >
                      Decline
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upcoming Meetings (Next 7 Days) */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-gray-800 dark:text-white flex items-center">
            <FaCalendar className="mr-2" />
            Upcoming Meetings (Next 7 Days)
          </h3>
          <button
            onClick={() => window.location.href = '/admin/meetings?filter=upcoming'}
            className="text-primary-600 hover:text-primary-700 text-sm"
          >
            View All
          </button>
        </div>
        {upcomingMeetings.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No upcoming meetings in the next 7 days</p>
        ) : (
          <div className="space-y-3">
            {upcomingMeetings.map(meeting => {
              const localTime = formatTimeInTimezone(meeting.startTime, meeting.studentTimezone);
              
              return (
                <div key={meeting._id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-800 dark:text-white">{meeting.title}</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        <FaUser className="inline mr-1" />
                        {meeting.studentId?.personalInfo?.firstName} {meeting.studentId?.personalInfo?.lastName}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        <FaClock className="inline mr-1" />
                        {localTime}
                      </p>
                    </div>
                    <button
                      onClick={() => window.location.href = `/admin/meetings/${meeting._id}`}
                      className="px-3 py-1 bg-primary-600 text-white rounded text-sm hover:bg-primary-700"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <button
          onClick={() => window.location.href = '/admin/meetings/create'}
          className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition text-left"
        >
          <FaPlus className="text-2xl text-primary-600 mb-2" />
          <h4 className="font-semibold text-gray-800 dark:text-white">Schedule Meeting</h4>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Create a new meeting with a student</p>
        </button>

        <button
          onClick={() => window.location.href = '/admin/emails/send'}
          className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition text-left"
        >
          <FaEnvelope className="text-2xl text-blue-600 mb-2" />
          <h4 className="font-semibold text-gray-800 dark:text-white">Send Email</h4>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Send one-click emails to students</p>
        </button>

        <button
          onClick={() => window.location.href = '/admin/tasks'}
          className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition text-left"
        >
          <FaTasks className="text-2xl text-green-600 mb-2" />
          <h4 className="font-semibold text-gray-800 dark:text-white">Manage Tasks</h4>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">View and manage follow-up tasks</p>
        </button>
      </div>
    </div>
  );
};

export default MentorDashboard;

