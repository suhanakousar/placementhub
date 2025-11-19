import React from 'react';
import { FaExclamationTriangle, FaTimes } from 'react-icons/fa';

const ConfirmDeleteModal = ({ isOpen, onClose, onConfirm, title, message, itemName, type = 'delete' }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
        <div className="p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="flex-shrink-0">
              <FaExclamationTriangle className="text-3xl text-red-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {title || `Confirm ${type === 'delete' ? 'Deletion' : 'Action'}`}
              </h3>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              <FaTimes className="text-xl" />
            </button>
          </div>

          <p className="text-gray-600 dark:text-gray-300 mb-6">
            {message || `Are you sure you want to ${type === 'delete' ? 'delete' : 'perform this action on'} ${itemName || 'this item'}? This action cannot be undone.`}
          </p>

          <div className="flex space-x-3">
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (onConfirm) {
                  onConfirm();
                }
              }}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
              type="button"
            >
              {type === 'delete' ? 'Delete' : 'Confirm'}
            </button>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (onClose) {
                  onClose();
                }
              }}
              className="flex-1 px-4 py-2 bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-white rounded-lg hover:bg-gray-400 dark:hover:bg-gray-600 transition"
              type="button"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDeleteModal;

