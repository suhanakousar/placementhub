import React, { useState } from 'react';
import { FaHeadset, FaEnvelope, FaPhone } from 'react-icons/fa';

const Support = () => {
  const [formData, setFormData] = useState({
    subject: '',
    message: ''
  });
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState(''); // 'success' or 'error'

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch('http://localhost:5000/api/support/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('Support request submitted successfully! We will get back to you soon.');
        setMessageType('success');
        setFormData({ subject: '', message: '' });
      } else {
        setMessage(data.message || 'Failed to submit support request. Please try again.');
        setMessageType('error');
      }
    } catch (error) {
      console.error('Support submission error:', error);
      setMessage('Failed to submit support request. Please try again.');
      setMessageType('error');
    }

    // Clear message after 5 seconds
    setTimeout(() => {
      setMessage('');
      setMessageType('');
    }, 5000);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-center space-x-2 mb-6">
          <FaHeadset className="text-2xl text-primary-600" />
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Contact Support</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <FaEnvelope className="text-2xl text-blue-600 mb-2" />
            <h3 className="font-semibold text-gray-800 dark:text-white">Email Support</h3>
            <p className="text-gray-600 dark:text-gray-400">placementhub722@gmail.com</p>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
            <FaPhone className="text-2xl text-green-600 mb-2" />
            <h3 className="font-semibold text-gray-800 dark:text-white">Phone Support</h3>
            <p className="text-gray-600 dark:text-gray-400">+1 (555) 123-4567</p>
          </div>
        </div>

        {message && (
          <div className={`mb-4 p-4 rounded-lg ${
            messageType === 'success'
              ? 'bg-green-100 border border-green-400 text-green-700 dark:bg-green-900/20 dark:border-green-700 dark:text-green-400'
              : 'bg-red-100 border border-red-400 text-red-700 dark:bg-red-900/20 dark:border-red-700 dark:text-red-400'
          }`}>
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Subject
            </label>
            <input
              type="text"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Message
            </label>
            <textarea
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
              rows="6"
              required
            />
          </div>
          <button
            type="submit"
            className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            Submit Request
          </button>
        </form>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Frequently Asked Questions</h3>
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold text-gray-800 dark:text-white">How do I upload my resume?</h4>
            <p className="text-gray-600 dark:text-gray-400">
              Go to the Resume Manager section and click on "Upload Resume". Select your PDF file and add relevant tags.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-gray-800 dark:text-white">How long does resume verification take?</h4>
            <p className="text-gray-600 dark:text-gray-400">
              Resume verification typically takes 2-3 business days. You will be notified once it's verified.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-gray-800 dark:text-white">Can I apply to multiple placement drives?</h4>
            <p className="text-gray-600 dark:text-gray-400">
              Yes, you can apply to multiple placement drives that match your eligibility criteria.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Support;

