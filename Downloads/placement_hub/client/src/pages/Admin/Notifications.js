import React, { useState, useEffect } from 'react';
import { FaBell } from 'react-icons/fa';
import api from '../../utils/api';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await api.get('/notifications');
      setNotifications(response.data);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <FaBell className="text-2xl text-primary-600" />
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Notifications</h2>
        </div>
        {notifications.length > 0 && (
          <button
            onClick={() => setNotifications([])}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
          >
            Clear All
          </button>
        )}
      </div>
      <div className="space-y-4">
        {notifications.map((notification) => (
          <div
            key={notification._id}
            className={`border-l-4 p-4 rounded-lg ${
              notification.type === 'success' ? 'border-green-500 bg-green-50 dark:bg-green-900/20' :
              notification.type === 'warning' ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20' :
              notification.type === 'error' ? 'border-red-500 bg-red-50 dark:bg-red-900/20' :
              'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
            }`}
          >
            <h3 className="font-semibold text-gray-800 dark:text-white">{notification.title}</h3>
            <p className="text-gray-600 dark:text-gray-400 mt-1">{notification.message}</p>
            <p className="text-sm text-gray-500 mt-2">
              {new Date(notification.createdAt).toLocaleString()}
            </p>
          </div>
        ))}
        {notifications.length === 0 && (
          <p className="text-gray-500 text-center py-8">No notifications</p>
        )}
      </div>
    </div>
  );
};

export default Notifications;

