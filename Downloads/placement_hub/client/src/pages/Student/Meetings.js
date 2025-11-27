import React, { useState, useEffect } from 'react';
import { FaCalendar, FaVideo, FaPlus, FaEye } from 'react-icons/fa';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import MeetingRequestForm from '../../components/MeetingRequestForm';

const Meetings = () => {
  const [meetings, setMeetings] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [filter, setFilter] = useState('all'); // all, upcoming, past, pending

  useEffect(() => {
    fetchMeetings();
    fetchRequests();
  }, []);

  const fetchMeetings = async () => {
    try {
      const response = await api.get('/meetings');
      setMeetings(response.data);
    } catch (error) {
      console.error('Error fetching meetings:', error);
      toast.error('Failed to load meetings');
    } finally {
      setLoading(false);
    }
  };

  const fetchRequests = async () => {
    try {
      const response = await api.get('/meetings/requests/all');
      setRequests(response.data);
    } catch (error) {
      console.error('Error fetching requests:', error);
    }
  };

  const filteredMeetings = meetings.filter(meeting => {
    if (filter === 'upcoming') return new Date(meeting.startTime) > new Date();
    if (filter === 'past') return new Date(meeting.endTime) < new Date();
    if (filter === 'pending') return meeting.status === 'pending';
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Meetings & Mentoring</h2>
        <button
          onClick={() => setShowRequestForm(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          <FaPlus />
          <span>Request Meeting</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex space-x-2 border-b border-gray-200 dark:border-gray-700">
        {['all', 'upcoming', 'past', 'pending'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 font-medium ${
              filter === f
                ? 'border-b-2 border-primary-600 text-primary-600'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Pending Requests */}
      {requests.filter(r => r.status === 'pending').length > 0 && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <h3 className="font-semibold text-yellow-800 dark:text-yellow-300 mb-2">
            Pending Requests ({requests.filter(r => r.status === 'pending').length})
          </h3>
          {requests.filter(r => r.status === 'pending').map(request => (
            <div key={request._id} className="mb-2 p-2 bg-white dark:bg-gray-800 rounded">
              <p className="font-medium">{request.title}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Topic: {request.topic} • Priority: {request.priority}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Meetings List */}
      <div className="space-y-4">
        {filteredMeetings.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <FaCalendar className="mx-auto text-4xl text-gray-400 mb-4" />
            <p className="text-gray-600 dark:text-gray-400">No meetings found</p>
          </div>
        ) : (
          filteredMeetings.map(meeting => {
            const isUpcoming = new Date(meeting.startTime) > new Date();
            const isPast = new Date(meeting.endTime) < new Date();

            return (
              <div
                key={meeting._id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-800 dark:text-white">
                      {meeting.title}
                    </h3>
                  </div>
                </div>

                {meeting.description && (
                  <p className="text-gray-700 dark:text-gray-300 mb-4">{meeting.description}</p>
                )}

                {isUpcoming && meeting.meetingLink && (
                  <div className="mb-4">
                    <a
                      href={meeting.meetingLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      <FaVideo />
                      <span>Join Meeting</span>
                    </a>
                  </div>
                )}

                {isPast && meeting.feedbackId && (
                  <div className="mt-4">
                    <button
                      onClick={() => {
                        // Navigate to feedback view
                        window.location.href = `/student/meetings/${meeting._id}/feedback`;
                      }}
                      className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      <FaEye />
                      <span>View Feedback</span>
                    </button>
                  </div>
                )}

                {isUpcoming && (
                  <button
                    onClick={() => {
                      // Handle reschedule
                      toast.info('Reschedule feature coming soon');
                    }}
                    className="mt-2 text-sm text-primary-600 hover:underline"
                  >
                    Request Reschedule
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Meeting Request Form Modal */}
      {showRequestForm && (
        <MeetingRequestForm
          isOpen={showRequestForm}
          onClose={() => {
            setShowRequestForm(false);
            fetchRequests();
          }}
          onSuccess={() => {
            fetchRequests();
            toast.success('Meeting request submitted successfully');
          }}
        />
      )}
    </div>
  );
};

export default Meetings;

