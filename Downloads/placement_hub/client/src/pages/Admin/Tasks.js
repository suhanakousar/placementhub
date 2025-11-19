import React, { useState, useEffect } from 'react';
import { FaPlus, FaFilter, FaCheckCircle, FaClock, FaExclamationTriangle, FaEdit, FaTrash, FaUser, FaCalendar, FaTimes, FaTasks } from 'react-icons/fa';
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
    overdue: false
  });
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
    } catch (error) {
      toast.error('Failed to update task status');
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    
    try {
      await api.delete(`/admin/tasks/${taskId}`);
      toast.success('Task deleted successfully');
      fetchTasks();
      fetchStats();
    } catch (error) {
      toast.error('Failed to delete task');
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
                  <div className="flex space-x-2">
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

