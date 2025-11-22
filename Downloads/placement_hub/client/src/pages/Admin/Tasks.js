import React, { useState, useEffect } from 'react';
import { FaPlus, FaFilter, FaCheckCircle, FaClock, FaExclamationTriangle, FaEdit, FaTrash, FaUser, FaCalendar, FaTimes, FaTasks, FaEye, FaComment, FaCheck, FaTimesCircle, FaPaperclip, FaSpinner } from 'react-icons/fa';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import ConfirmDeleteModal from '../../components/ConfirmDeleteModal';

const Tasks = () => {
  const [tasks, setTasks] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState({
    isOpen: false,
    taskId: null,
    taskTitle: ''
  });
  const [filters, setFilters] = useState({
    studentId: '',
    status: '',
    priority: '',
    overdue: false,
    pendingReview: false
  });
  const [selectedTask, setSelectedTask] = useState(null);
  const [showTaskDetail, setShowTaskDetail] = useState(false);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewAction, setReviewAction] = useState('approve'); // 'approve' or 'reject'
  const [reviewFeedback, setReviewFeedback] = useState('');
  const [stats, setStats] = useState(null);
  const [formData, setFormData] = useState({
    studentId: '',
    title: '',
    description: '',
    priority: 'medium',
    dueDate: '',
    reminders: []
  });

  useEffect(() => {
    fetchTasks();
    fetchStudents();
    fetchStats();
  }, [filters]);

  const fetchTasks = async () => {
    try {
      const queryParams = new URLSearchParams();
      if (filters.studentId) queryParams.append('studentId', filters.studentId);
      if (filters.status) queryParams.append('status', filters.status);
      if (filters.priority) queryParams.append('priority', filters.priority);
      if (filters.overdue) queryParams.append('overdue', 'true');
      if (filters.pendingReview) queryParams.append('pendingReview', 'true');

      const response = await api.get(`/admin/tasks?${queryParams.toString()}`);
      setTasks(response.data || []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      toast.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      const response = await api.get('/students');
      setStudents(response.data || []);
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get('/admin/tasks/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching task stats:', error);
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    try {
      await api.post('/admin/tasks', {
        ...formData,
        dueDate: formData.dueDate ? new Date(formData.dueDate).toISOString() : undefined
      });
      toast.success('Task created successfully');
      setShowCreateForm(false);
      setFormData({
        studentId: '',
        title: '',
        description: '',
        priority: 'medium',
        dueDate: '',
        reminders: []
      });
      fetchTasks();
      fetchStats();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create task');
    }
  };

  const handleUpdateStatus = async (taskId, newStatus) => {
    try {
      await api.put(`/admin/tasks/${taskId}`, { status: newStatus });
      toast.success('Task status updated');
      fetchTasks();
      fetchStats();
      if (selectedTask && selectedTask._id === taskId) {
        const updatedTasks = await api.get(`/admin/tasks`);
        const updatedTask = updatedTasks.data.find(t => t._id === taskId);
        if (updatedTask) {
          setSelectedTask(updatedTask);
        }
      }
    } catch (error) {
      toast.error('Failed to update task status');
    }
  };

  const openTaskDetail = async (task) => {
    try {
      const response = await api.get(`/admin/tasks/${task._id}`);
      setSelectedTask(response.data);
      setShowTaskDetail(true);
      setReviewComment('');
      setReviewFeedback('');
      setReviewAction('approve');
    } catch (error) {
      toast.error('Failed to load task details');
    }
  };

  const handleAddComment = async (taskId) => {
    if (!reviewComment.trim()) {
      toast.error('Please enter a comment');
      return;
    }

    try {
      await api.put(`/admin/tasks/${taskId}`, { comment: reviewComment });
      toast.success('Comment added');
      setReviewComment('');
      fetchTasks();
      if (selectedTask && selectedTask._id === taskId) {
        const updatedTasks = await api.get(`/admin/tasks`);
        const updatedTask = updatedTasks.data.find(t => t._id === taskId);
        if (updatedTask) {
          setSelectedTask(updatedTask);
        }
      }
    } catch (error) {
      toast.error('Failed to add comment');
    }
  };

  const handleReviewSubmission = async (taskId) => {
    if (!reviewComment.trim() && !reviewFeedback.trim()) {
      toast.error('Please provide feedback');
      return;
    }

    try {
      const newStatus = reviewAction === 'approve' ? 'done' : 'in_progress';
      await api.put(`/admin/tasks/${taskId}`, {
        status: newStatus,
        comment: reviewComment,
        markReviewDone: true,
        reviewFeedback: reviewFeedback || reviewComment
      });
      toast.success(reviewAction === 'approve' ? 'Submission approved and marked as reviewed' : 'Submission rejected and marked as reviewed');
      setReviewComment('');
      setReviewFeedback('');
      setReviewAction('approve');
      fetchTasks();
      fetchStats();
      if (selectedTask && selectedTask._id === taskId) {
        const updatedTasks = await api.get(`/admin/tasks`);
        const updatedTask = updatedTasks.data.find(t => t._id === taskId);
        if (updatedTask) {
          setSelectedTask(updatedTask);
        }
      }
    } catch (error) {
      toast.error('Failed to review submission');
    }
  };

  const handleMarkReviewDone = async (taskId) => {
    if (!reviewFeedback.trim() && !reviewComment.trim()) {
      toast.error('Please provide feedback');
      return;
    }

    try {
      await api.put(`/admin/tasks/${taskId}`, {
        markReviewDone: true,
        reviewFeedback: reviewFeedback || reviewComment,
        comment: reviewComment || reviewFeedback
      });
      toast.success('Review marked as done');
      setReviewComment('');
      setReviewFeedback('');
      fetchTasks();
      fetchStats();
      if (selectedTask && selectedTask._id === taskId) {
        const updatedTasks = await api.get(`/admin/tasks`);
        const updatedTask = updatedTasks.data.find(t => t._id === taskId);
        if (updatedTask) {
          setSelectedTask(updatedTask);
        }
      }
    } catch (error) {
      toast.error('Failed to mark review as done');
    }
  };

  const handleDeleteTask = async () => {
    try {
      await api.delete(`/admin/tasks/${deleteConfirm.taskId}`);
      toast.success('Task deleted successfully');
      setDeleteConfirm({ isOpen: false, taskId: null, taskTitle: '' });
      fetchTasks();
      fetchStats();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete task');
    }
  };

  const openDeleteConfirm = (taskId, taskTitle) => {
    setDeleteConfirm({
      isOpen: true,
      taskId,
      taskTitle
    });
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
    return dueDate && new Date(dueDate) < new Date();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Task Management</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Manage follow-up tasks for students
          </p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          <FaPlus />
          <span>Create Task</span>
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Tasks</p>
            <p className="text-2xl font-bold text-gray-800 dark:text-white">{stats.total}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">Open Tasks</p>
            <p className="text-2xl font-bold text-yellow-600">{stats.byStatus.open}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">Overdue</p>
            <p className="text-2xl font-bold text-red-600">{stats.overdue}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">Completed</p>
            <p className="text-2xl font-bold text-green-600">{stats.byStatus.done}</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <div className="flex items-center space-x-2 mb-4">
          <FaFilter />
          <h3 className="font-semibold text-gray-800 dark:text-white">Filters</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <select
            value={filters.studentId}
            onChange={(e) => setFilters({ ...filters, studentId: e.target.value })}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
          >
            <option value="">All Students</option>
            {students.map(student => (
              <option key={student._id} value={student._id}>
                {student.personalInfo?.firstName} {student.personalInfo?.lastName}
              </option>
            ))}
          </select>
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
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
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
          >
            <option value="">All Priorities</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={filters.overdue}
                onChange={(e) => setFilters({ ...filters, overdue: e.target.checked })}
                className="rounded"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">Show Overdue Only</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={filters.pendingReview}
                onChange={(e) => setFilters({ ...filters, pendingReview: e.target.checked })}
                className="rounded"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">Pending Review</span>
            </label>
        </div>
      </div>

      {/* Tasks Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700">
              <th className="text-left py-3 px-4 text-gray-700 dark:text-gray-300">Student</th>
              <th className="text-left py-3 px-4 text-gray-700 dark:text-gray-300">Task</th>
              <th className="text-left py-3 px-4 text-gray-700 dark:text-gray-300">Priority</th>
              <th className="text-left py-3 px-4 text-gray-700 dark:text-gray-300">Due Date</th>
              <th className="text-left py-3 px-4 text-gray-700 dark:text-gray-300">Status</th>
              <th className="text-left py-3 px-4 text-gray-700 dark:text-gray-300">Origin</th>
              <th className="text-left py-3 px-4 text-gray-700 dark:text-gray-300">Submission</th>
              <th className="text-left py-3 px-4 text-gray-700 dark:text-gray-300">Actions</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map(task => (
              <tr key={task._id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <td className="py-3 px-4">
                  <div className="flex items-center space-x-2">
                    <FaUser className="text-gray-400" />
                    <span className="text-gray-800 dark:text-white">
                      {task.studentId?.personalInfo?.firstName} {task.studentId?.personalInfo?.lastName}
                    </span>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <div>
                    <p className="font-medium text-gray-800 dark:text-white">{task.title}</p>
                    {task.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">{task.description}</p>
                    )}
                  </div>
                </td>
                <td className="py-3 px-4">
                  <span className={`px-2 py-1 rounded text-xs ${getPriorityColor(task.priority)}`}>
                    {task.priority}
                  </span>
                </td>
                <td className="py-3 px-4">
                  {task.dueDate ? (
                    <div className="flex items-center space-x-1">
                      {isOverdue(task.dueDate) && task.status !== 'done' && (
                        <FaExclamationTriangle className="text-red-500" />
                      )}
                      <span className={isOverdue(task.dueDate) && task.status !== 'done' ? 'text-red-600' : 'text-gray-600 dark:text-gray-400'}>
                        {new Date(task.dueDate).toLocaleDateString()}
                      </span>
                    </div>
                  ) : (
                    <span className="text-gray-400">No due date</span>
                  )}
                </td>
                <td className="py-3 px-4">
                  <select
                    value={task.status}
                    onChange={(e) => handleUpdateStatus(task._id, e.target.value)}
                    className={`px-2 py-1 rounded text-xs ${getStatusColor(task.status)} border-0`}
                  >
                    <option value="open">Open</option>
                    <option value="in_progress">In Progress</option>
                    <option value="blocked">Blocked</option>
                    <option value="done">Done</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </td>
                <td className="py-3 px-4">
                  <span className="text-xs text-gray-600 dark:text-gray-400">
                    {task.origin?.replace('_', ' ')}
                  </span>
                </td>
                <td className="py-3 px-4">
                  {task.studentEvidence ? (
                    <div className="flex flex-col space-y-1">
                      <div className="flex items-center space-x-2">
                        <FaPaperclip className="text-green-500" />
                        <span className="text-xs text-green-600 dark:text-green-400">Submitted</span>
                      </div>
                      {task.reviewed ? (
                        <span className="px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400 rounded text-xs">
                          Review Done
                        </span>
                      ) : task.reviewRequested ? (
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400 rounded text-xs">
                          Review Requested
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400 rounded text-xs">
                          Pending Review
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-xs text-gray-400">No submission</span>
                  )}
                </td>
                <td className="py-3 px-4">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => openTaskDetail(task)}
                      className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition"
                      title="View Details"
                    >
                      <FaEye />
                    </button>
                    <button
                      onClick={() => openDeleteConfirm(task._id, task.title)}
                      className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition"
                      title="Delete Task"
                    >
                      <FaTrash />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {tasks.length === 0 && (
          <div className="text-center py-12">
            <FaTasks className="mx-auto text-4xl text-gray-400 mb-4" />
            <p className="text-gray-500 dark:text-gray-400">No tasks found</p>
          </div>
        )}
      </div>

      {/* Create Task Form Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-800 dark:text-white">Create New Task</h3>
              <button
                onClick={() => setShowCreateForm(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400"
              >
                <FaTimes className="text-xl" />
              </button>
            </div>
            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Student *
                </label>
                <select
                  value={formData.studentId}
                  onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                  required
                >
                  <option value="">Select a student</option>
                  {students.map(student => (
                    <option key={student._id} value={student._id}>
                      {student.personalInfo?.firstName} {student.personalInfo?.lastName}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Task Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                  required
                />
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
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Priority
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>
              <div className="flex space-x-3">
                <button
                  type="submit"
                  className="flex-1 px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                  Create Task
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="px-6 py-2 bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-white rounded-lg hover:bg-gray-400 dark:hover:bg-gray-600"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Task Detail Modal */}
      {showTaskDetail && selectedTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                  Task Details
                </h2>
                <button
                  onClick={() => {
                    setShowTaskDetail(false);
                    setSelectedTask(null);
                    setReviewComment('');
                    setReviewFeedback('');
                    setReviewAction('approve');
                  }}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <FaTimes className="text-xl" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Task Info */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">
                    {selectedTask.title}
                  </h3>
                  {selectedTask.description && (
                    <p className="text-gray-600 dark:text-gray-400">{selectedTask.description}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Student</p>
                    <p className="text-gray-800 dark:text-white font-medium">
                      {selectedTask.studentId?.personalInfo?.firstName} {selectedTask.studentId?.personalInfo?.lastName}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Priority</p>
                    <span className={`inline-block px-2 py-1 rounded text-sm font-medium ${getPriorityColor(selectedTask.priority)}`}>
                      {selectedTask.priority}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Status</p>
                    <span className={`inline-block px-2 py-1 rounded text-sm font-medium ${getStatusColor(selectedTask.status)}`}>
                      {selectedTask.status.replace('_', ' ')}
                    </span>
                  </div>
                  {selectedTask.dueDate && (
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Due Date</p>
                      <p className="text-gray-800 dark:text-white flex items-center space-x-1">
                        <FaCalendar className="text-sm" />
                        <span>{new Date(selectedTask.dueDate).toLocaleDateString()}</span>
                      </p>
                    </div>
                  )}
                </div>

                {/* Student Evidence/Submission */}
                {selectedTask.studentEvidence && (
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center space-x-2">
                        <FaPaperclip className="text-green-500" />
                        <span>Student Submission</span>
                      </h4>
                      {selectedTask.reviewRequested && (
                        <span className="px-3 py-1 bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400 rounded-full text-sm font-medium">
                          Review Requested
                        </span>
                      )}
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                      <p className="text-gray-800 dark:text-white whitespace-pre-wrap">
                        {selectedTask.studentEvidence.text}
                      </p>
                      {selectedTask.studentEvidence.submittedAt && (
                        <p className="text-xs text-gray-500 mt-2">
                          Submitted: {new Date(selectedTask.studentEvidence.submittedAt).toLocaleString()}
                        </p>
                      )}
                    </div>

                    {/* Review Status */}
                    {selectedTask.studentEvidence && (
                      <div className="mt-4 border-t border-gray-200 dark:border-gray-700 pt-4">
                        {selectedTask.reviewed ? (
                          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                            <div className="flex items-center space-x-2 mb-2">
                              <FaCheckCircle className="text-green-500" />
                              <h4 className="text-lg font-semibold text-green-800 dark:text-green-300">
                                Review Completed
                              </h4>
                            </div>
                            {selectedTask.reviewedAt && (
                              <p className="text-sm text-green-700 dark:text-green-400 mb-2">
                                Reviewed on: {new Date(selectedTask.reviewedAt).toLocaleString()}
                                {selectedTask.reviewedBy?.personalInfo && (
                                  <span className="ml-2">
                                    by {selectedTask.reviewedBy.personalInfo.firstName} {selectedTask.reviewedBy.personalInfo.lastName}
                                  </span>
                                )}
                              </p>
                            )}
                            {selectedTask.reviewFeedback && (
                              <div className="mt-2">
                                <p className="text-sm font-medium text-green-800 dark:text-green-300 mb-1">Review Feedback:</p>
                                <p className="text-sm text-green-700 dark:text-green-400">{selectedTask.reviewFeedback}</p>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div>
                            <h4 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">
                              Review Submission
                            </h4>
                            <div className="space-y-3">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                  Review Action
                                </label>
                                <div className="flex space-x-4">
                                  <label className="flex items-center space-x-2 cursor-pointer">
                                    <input
                                      type="radio"
                                      value="approve"
                                      checked={reviewAction === 'approve'}
                                      onChange={(e) => setReviewAction(e.target.value)}
                                      className="text-green-600"
                                    />
                                    <span className="text-gray-700 dark:text-gray-300 flex items-center space-x-1">
                                      <FaCheck className="text-green-500" />
                                      <span>Approve & Mark Complete</span>
                                    </span>
                                  </label>
                                  <label className="flex items-center space-x-2 cursor-pointer">
                                    <input
                                      type="radio"
                                      value="reject"
                                      checked={reviewAction === 'reject'}
                                      onChange={(e) => setReviewAction(e.target.value)}
                                      className="text-red-600"
                                    />
                                    <span className="text-gray-700 dark:text-gray-300 flex items-center space-x-1">
                                      <FaTimesCircle className="text-red-500" />
                                      <span>Reject & Reopen Task</span>
                                    </span>
                                  </label>
                                </div>
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                  Review Feedback
                                </label>
                                <textarea
                                  value={reviewFeedback}
                                  onChange={(e) => setReviewFeedback(e.target.value)}
                                  placeholder="Provide feedback on the submission..."
                                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                                  rows="4"
                                />
                              </div>
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => handleReviewSubmission(selectedTask._id)}
                                  disabled={!reviewFeedback.trim() && !reviewComment.trim()}
                                  className={`px-4 py-2 rounded-lg text-white font-medium flex items-center space-x-2 ${
                                    reviewAction === 'approve'
                                      ? 'bg-green-600 hover:bg-green-700'
                                      : 'bg-red-600 hover:bg-red-700'
                                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                                >
                                  {reviewAction === 'approve' ? (
                                    <>
                                      <FaCheck />
                                      <span>Approve & Mark Review Done</span>
                                    </>
                                  ) : (
                                    <>
                                      <FaTimesCircle />
                                      <span>Reject & Mark Review Done</span>
                                    </>
                                  )}
                                </button>
                                {selectedTask.status !== 'done' && (
                                  <button
                                    onClick={() => handleMarkReviewDone(selectedTask._id)}
                                    disabled={!reviewFeedback.trim() && !reviewComment.trim()}
                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    <FaCheckCircle />
                                    <span>Mark Review Done Only</span>
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Comments Section */}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <h4 className="text-lg font-semibold text-gray-800 dark:text-white mb-3 flex items-center space-x-2">
                    <FaComment />
                    <span>Comments</span>
                  </h4>
                  {selectedTask.comments && selectedTask.comments.length > 0 ? (
                    <div className="space-y-2 mb-3">
                      {selectedTask.comments.map((comment, idx) => (
                        <div key={idx} className="bg-gray-50 dark:bg-gray-700 rounded p-3">
                          <div className="flex justify-between items-start mb-1">
                            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                              {comment.author === 'admin' ? 'You' : 'Student'}
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
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      placeholder="Add a comment..."
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && reviewComment.trim()) {
                          handleAddComment(selectedTask._id);
                        }
                      }}
                    />
                    <button
                      onClick={() => handleAddComment(selectedTask._id)}
                      disabled={!reviewComment.trim()}
                      className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                    >
                      <FaComment />
                      <span>Add</span>
                    </button>
                  </div>
                </div>

                {/* Status Update */}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Update Status
                  </label>
                  <select
                    value={selectedTask.status}
                    onChange={(e) => handleUpdateStatus(selectedTask._id, e.target.value)}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                  >
                    <option value="open">Open</option>
                    <option value="in_progress">In Progress</option>
                    <option value="blocked">Blocked</option>
                    <option value="done">Done</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, taskId: null, taskTitle: '' })}
        onConfirm={handleDeleteTask}
        title="Delete Task"
        message={`Are you sure you want to delete the task "${deleteConfirm.taskTitle}"? This action cannot be undone.`}
        itemName={deleteConfirm.taskTitle}
        type="delete"
      />
    </div>
  );
};

export default Tasks;

