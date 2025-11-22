import React, { useState, useEffect } from 'react';
import { FaFilter, FaCheckCircle, FaClock, FaExclamationTriangle, FaCalendar, FaTimes, FaTasks, FaFilter as FaFilterIcon, FaPaperclip, FaComment, FaCheck, FaSpinner } from 'react-icons/fa';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const Tasks = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    overdue: false
  });
  const [selectedTask, setSelectedTask] = useState(null);
  const [showTaskDetail, setShowTaskDetail] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [evidenceText, setEvidenceText] = useState('');
  const [commentText, setCommentText] = useState('');

  useEffect(() => {
    fetchTasks();
    fetchStats();
  }, [filters]);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      if (filters.status) queryParams.append('status', filters.status);
      if (filters.priority) queryParams.append('priority', filters.priority);
      if (filters.overdue) queryParams.append('overdue', 'true');

      const response = await api.get(`/tasks?${queryParams.toString()}`);
      setTasks(response.data || []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      toast.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get('/tasks/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching task stats:', error);
    }
  };

  const handleUpdateStatus = async (taskId, newStatus) => {
    try {
      setUpdating(true);
      await api.put(`/tasks/${taskId}`, {
        action: 'update_status',
        status: newStatus
      });
      toast.success('Task status updated');
      fetchTasks();
      fetchStats();
      if (selectedTask && selectedTask._id === taskId) {
        const updatedTask = tasks.find(t => t._id === taskId);
        if (updatedTask) {
          setSelectedTask({ ...updatedTask, status: newStatus });
        }
      }
    } catch (error) {
      toast.error('Failed to update task status');
    } finally {
      setUpdating(false);
    }
  };

  const handleSubmitEvidence = async (taskId) => {
    if (!evidenceText.trim()) {
      toast.error('Please provide evidence text');
      return;
    }

    try {
      setUpdating(true);
      await api.put(`/tasks/${taskId}`, {
        action: 'submit_evidence',
        evidence: {
          text: evidenceText
        }
      });
      toast.success('Evidence submitted successfully');
      setEvidenceText('');
      fetchTasks();
      fetchStats();
      if (selectedTask && selectedTask._id === taskId) {
        const updatedTasks = await api.get(`/tasks`);
        const updatedTask = updatedTasks.data.find(t => t._id === taskId);
        if (updatedTask) {
          setSelectedTask(updatedTask);
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit evidence');
    } finally {
      setUpdating(false);
    }
  };

  const handleAddComment = async (taskId) => {
    if (!commentText.trim()) {
      toast.error('Please enter a comment');
      return;
    }

    try {
      setUpdating(true);
      await api.put(`/tasks/${taskId}`, {
        action: 'add_comment',
        comment: commentText
      });
      toast.success('Comment added');
      setCommentText('');
      fetchTasks();
      if (selectedTask && selectedTask._id === taskId) {
        const updatedTasks = await api.get(`/tasks`);
        const updatedTask = updatedTasks.data.find(t => t._id === taskId);
        if (updatedTask) {
          setSelectedTask(updatedTask);
        }
      }
    } catch (error) {
      toast.error('Failed to add comment');
    } finally {
      setUpdating(false);
    }
  };

  const handleRequestReview = async (taskId) => {
    try {
      setUpdating(true);
      await api.put(`/tasks/${taskId}`, {
        action: 'request_review'
      });
      toast.success('Review requested');
      fetchTasks();
      if (selectedTask && selectedTask._id === taskId) {
        const updatedTasks = await api.get(`/tasks`);
        const updatedTask = updatedTasks.data.find(t => t._id === taskId);
        if (updatedTask) {
          setSelectedTask(updatedTask);
        }
      }
    } catch (error) {
      toast.error('Failed to request review');
    } finally {
      setUpdating(false);
    }
  };

  const openTaskDetail = async (task) => {
    try {
      const response = await api.get(`/tasks/${task._id}`);
      setSelectedTask(response.data);
      setShowTaskDetail(true);
    } catch (error) {
      toast.error('Failed to load task details');
    }
  };

  const getPriorityColor = (priority) => {
    const colors = {
      low: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
      medium: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
      high: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400',
      urgent: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
    };
    return colors[priority] || colors.medium;
  };

  const getStatusColor = (status) => {
    const colors = {
      open: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
      in_progress: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
      blocked: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
      done: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
      cancelled: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
    };
    return colors[status] || colors.open;
  };

  const isOverdue = (dueDate) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'done':
        return <FaCheckCircle className="text-green-500" />;
      case 'in_progress':
        return <FaSpinner className="text-blue-500 animate-spin" />;
      case 'blocked':
        return <FaExclamationTriangle className="text-red-500" />;
      default:
        return <FaClock className="text-yellow-500" />;
    }
  };

  if (loading && !tasks.length) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white flex items-center">
            <FaTasks className="mr-3" />
            My Tasks
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            View and manage tasks assigned to you
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 dark:text-gray-400 text-sm">Total Tasks</p>
                <p className="text-3xl font-bold text-gray-800 dark:text-white mt-2">
                  {stats.total || 0}
                </p>
              </div>
              <FaTasks className="text-4xl text-blue-500" />
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 dark:text-gray-400 text-sm">In Progress</p>
                <p className="text-3xl font-bold text-gray-800 dark:text-white mt-2">
                  {stats.inProgress || 0}
                </p>
              </div>
              <FaSpinner className="text-4xl text-blue-500 animate-spin" />
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 dark:text-gray-400 text-sm">Completed</p>
                <p className="text-3xl font-bold text-gray-800 dark:text-white mt-2">
                  {stats.done || 0}
                </p>
              </div>
              <FaCheckCircle className="text-4xl text-green-500" />
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 dark:text-gray-400 text-sm">Overdue</p>
                <p className="text-3xl font-bold text-gray-800 dark:text-white mt-2">
                  {stats.overdue || 0}
                </p>
              </div>
              <FaExclamationTriangle className="text-4xl text-red-500" />
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center space-x-2">
            <FaFilterIcon className="text-gray-400" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Filters:</span>
          </div>
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white text-sm"
          >
            <option value="">All Status</option>
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="blocked">Blocked</option>
            <option value="done">Done</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <select
            value={filters.priority}
            onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white text-sm"
          >
            <option value="">All Priorities</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={filters.overdue}
              onChange={(e) => setFilters({ ...filters, overdue: e.target.checked })}
              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">Overdue Only</span>
          </label>
          {(filters.status || filters.priority || filters.overdue) && (
            <button
              onClick={() => setFilters({ status: '', priority: '', overdue: false })}
              className="px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white flex items-center space-x-1"
            >
              <FaTimes />
              <span>Clear</span>
            </button>
          )}
        </div>
      </div>

      {/* Tasks List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        {tasks.length === 0 ? (
          <div className="p-12 text-center">
            <FaTasks className="text-6xl text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400 text-lg">No tasks found</p>
            <p className="text-gray-500 dark:text-gray-500 text-sm mt-2">
              {filters.status || filters.priority || filters.overdue
                ? 'Try adjusting your filters'
                : 'You don\'t have any tasks assigned yet'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Task
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Priority
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Due Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {tasks.map((task) => (
                  <tr
                    key={task._id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer"
                    onClick={() => openTaskDetail(task)}
                  >
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-800 dark:text-white">{task.title}</p>
                        {task.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                            {task.description}
                          </p>
                        )}
                        {task.createdBy?.personalInfo && (
                          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                            Assigned by: {task.createdBy.personalInfo.firstName} {task.createdBy.personalInfo.lastName}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(task.priority)}`}>
                        {task.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {task.dueDate ? (
                        <div className="flex items-center space-x-1">
                          {isOverdue(task.dueDate) && task.status !== 'done' && (
                            <FaExclamationTriangle className="text-red-500" />
                          )}
                          <span className={isOverdue(task.dueDate) && task.status !== 'done' ? 'text-red-600 dark:text-red-400' : 'text-gray-600 dark:text-gray-400'}>
                            {new Date(task.dueDate).toLocaleDateString()}
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-400">No due date</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(task.status)}
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(task.status)}`}>
                          {task.status.replace('_', ' ')}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        {task.status !== 'done' && task.status !== 'cancelled' && (
                          <select
                            value={task.status}
                            onChange={(e) => {
                              e.stopPropagation();
                              handleUpdateStatus(task._id, e.target.value);
                            }}
                            onClick={(e) => e.stopPropagation()}
                            className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                            disabled={updating}
                          >
                            <option value="open">Open</option>
                            <option value="in_progress">In Progress</option>
                            <option value="blocked">Blocked</option>
                            <option value="done">Mark as Done</option>
                          </select>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Task Detail Modal */}
      {showTaskDetail && selectedTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                  {selectedTask.title}
                </h2>
                <button
                  onClick={() => {
                    setShowTaskDetail(false);
                    setSelectedTask(null);
                    setEvidenceText('');
                    setCommentText('');
                  }}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <FaTimes className="text-xl" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Task Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Priority</p>
                    <span className={`inline-block px-2 py-1 rounded text-sm font-medium mt-1 ${getPriorityColor(selectedTask.priority)}`}>
                      {selectedTask.priority}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Status</p>
                    <span className={`inline-block px-2 py-1 rounded text-sm font-medium mt-1 ${getStatusColor(selectedTask.status)}`}>
                      {selectedTask.status.replace('_', ' ')}
                    </span>
                  </div>
                  {selectedTask.dueDate && (
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Due Date</p>
                      <p className="text-gray-800 dark:text-white mt-1 flex items-center space-x-1">
                        <FaCalendar className="text-sm" />
                        <span>{new Date(selectedTask.dueDate).toLocaleDateString()}</span>
                        {isOverdue(selectedTask.dueDate) && selectedTask.status !== 'done' && (
                          <span className="text-red-600 text-xs ml-2">(Overdue)</span>
                        )}
                      </p>
                    </div>
                  )}
                  {selectedTask.createdBy?.personalInfo && (
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Assigned By</p>
                      <p className="text-gray-800 dark:text-white mt-1">
                        {selectedTask.createdBy.personalInfo.firstName} {selectedTask.createdBy.personalInfo.lastName}
                      </p>
                    </div>
                  )}
                </div>

                {/* Description */}
                {selectedTask.description && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description</p>
                    <p className="text-gray-600 dark:text-gray-400">{selectedTask.description}</p>
                  </div>
                )}

                {/* Student Evidence */}
                {selectedTask.studentEvidence && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Your Submission</p>
                    <div className="bg-gray-50 dark:bg-gray-700 rounded p-3">
                      <p className="text-gray-800 dark:text-white">{selectedTask.studentEvidence.text}</p>
                      {selectedTask.studentEvidence.submittedAt && (
                        <p className="text-xs text-gray-500 mt-2">
                          Submitted: {new Date(selectedTask.studentEvidence.submittedAt).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Submit Evidence */}
                {selectedTask.status !== 'done' && selectedTask.status !== 'cancelled' && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Submit Evidence</p>
                    <textarea
                      value={evidenceText}
                      onChange={(e) => setEvidenceText(e.target.value)}
                      placeholder="Describe your work or provide evidence..."
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                      rows="4"
                    />
                    <div className="flex space-x-2 mt-2">
                      <button
                        onClick={() => handleSubmitEvidence(selectedTask._id)}
                        disabled={updating || !evidenceText.trim()}
                        className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                      >
                        <FaPaperclip />
                        <span>Submit Evidence</span>
                      </button>
                      {selectedTask.status === 'in_progress' && (
                        <button
                          onClick={async () => {
                            if (!evidenceText.trim()) {
                              toast.error('Please provide evidence text');
                              return;
                            }
                            try {
                              setUpdating(true);
                              await api.put(`/tasks/${selectedTask._id}`, {
                                action: 'submit_evidence',
                                evidence: {
                                  text: evidenceText,
                                  markComplete: true
                                }
                              });
                              toast.success('Evidence submitted and task marked as complete');
                              setEvidenceText('');
                              fetchTasks();
                              fetchStats();
                              const updatedTasks = await api.get(`/tasks`);
                              const updatedTask = updatedTasks.data.find(t => t._id === selectedTask._id);
                              if (updatedTask) {
                                setSelectedTask(updatedTask);
                              }
                            } catch (error) {
                              toast.error(error.response?.data?.message || 'Failed to submit evidence');
                            } finally {
                              setUpdating(false);
                            }
                          }}
                          disabled={updating || !evidenceText.trim()}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                        >
                          <FaCheck />
                          <span>Submit & Mark Complete</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Comments */}
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Comments</p>
                  {selectedTask.comments && selectedTask.comments.length > 0 ? (
                    <div className="space-y-2 mb-3">
                      {selectedTask.comments.map((comment, idx) => (
                        <div key={idx} className="bg-gray-50 dark:bg-gray-700 rounded p-3">
                          <div className="flex justify-between items-start mb-1">
                            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                              {comment.author === 'student' ? 'You' : 'Admin'}
                            </span>
                            <span className="text-xs text-gray-500">
                              {new Date(comment.createdAt).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-sm text-gray-800 dark:text-white">{comment.text}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 mb-3">No comments yet</p>
                  )}
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder="Add a comment..."
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && commentText.trim()) {
                          handleAddComment(selectedTask._id);
                        }
                      }}
                    />
                    <button
                      onClick={() => handleAddComment(selectedTask._id)}
                      disabled={updating || !commentText.trim()}
                      className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                    >
                      <FaComment />
                      <span>Add</span>
                    </button>
                  </div>
                </div>

                {/* Actions */}
                {selectedTask.status !== 'done' && selectedTask.status !== 'cancelled' && (
                  <div className="flex space-x-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <select
                      value={selectedTask.status}
                      onChange={(e) => handleUpdateStatus(selectedTask._id, e.target.value)}
                      className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                      disabled={updating}
                    >
                      <option value="open">Open</option>
                      <option value="in_progress">In Progress</option>
                      <option value="blocked">Blocked</option>
                      <option value="done">Mark as Done</option>
                    </select>
                    {selectedTask.studentEvidence && !selectedTask.reviewRequested && (
                      <button
                        onClick={() => handleRequestReview(selectedTask._id)}
                        disabled={updating}
                        className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Request Review
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tasks;

