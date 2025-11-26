import React, { useState, useEffect } from 'react';
import { FaPlus, FaChevronDown, FaChevronUp, FaFilter, FaUserCheck, FaUsers } from 'react-icons/fa';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const APPLICANT_FILTERS = [
  { value: 'selected', label: 'Selected applicants' },
  { value: 'all', label: 'All applicants' },
  { value: 'shortlisted', label: 'Shortlisted' },
  { value: 'interviewed', label: 'Interviewed' },
  { value: 'applied', label: 'Applied only' },
  { value: 'rejected', label: 'Rejected' }
];

const Drives = () => {
  const [drives, setDrives] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    companyName: '',
    role: '',
    package: '',
    description: '',
    eligibilityCriteria: {
      minCGPA: '',
      departments: [],
      year: '',
      backlogsAllowed: 0
    },
    applicationDeadline: '',
    driveDate: ''
  });
  const [loading, setLoading] = useState(true);
  const [expandedDriveId, setExpandedDriveId] = useState(null);
  const [applicationFilters, setApplicationFilters] = useState({});
  const [studentSelectionMode, setStudentSelectionMode] = useState('auto'); // 'auto' | 'manual'
  const [students, setStudents] = useState([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);
  const [studentsLoading, setStudentsLoading] = useState(false);

  useEffect(() => {
    fetchDrives();
  }, []);

  const fetchDrives = async () => {
    try {
      const response = await api.get('/drives');
      setDrives(response.data);
    } catch (error) {
      console.error('Error fetching drives:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentsForSelection = async () => {
    try {
      setStudentsLoading(true);
      const response = await api.get('/students');
      setStudents(response.data || []);
    } catch (error) {
      console.error('Error fetching students for selection:', error);
      toast.error('Failed to load students for selection');
    } finally {
      setStudentsLoading(false);
    }
  };

  const toggleStudentSelected = (studentId) => {
    setSelectedStudentIds((prev) =>
      prev.includes(studentId)
        ? prev.filter((id) => id !== studentId)
        : [...prev, studentId]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData
      };

      if (studentSelectionMode === 'manual' && selectedStudentIds.length > 0) {
        payload.studentIds = selectedStudentIds;
      }

      await api.post('/drives', payload);
      toast.success('Placement drive created successfully');
      setShowAddForm(false);
      setFormData({
        companyName: '',
        role: '',
        package: '',
        description: '',
        eligibilityCriteria: {
          minCGPA: '',
          departments: [],
          year: '',
          backlogsAllowed: 0
        },
        applicationDeadline: '',
        driveDate: ''
      });
      setStudentSelectionMode('auto');
      setSelectedStudentIds([]);
      setStudents([]);
      fetchDrives();
    } catch (error) {
      toast.error('Failed to create placement drive');
    }
  };

  const toggleDriveExpansion = (driveId) => {
    setExpandedDriveId((prev) => (prev === driveId ? null : driveId));
    setApplicationFilters((prev) => {
      if (prev[driveId]) {
        return prev;
      }
      return { ...prev, [driveId]: 'selected' };
    });
  };

  const handleApplicationFilterChange = (driveId, value) => {
    setApplicationFilters((prev) => ({ ...prev, [driveId]: value }));
  };

  const getStatusStyles = (status) => {
    const map = {
      selected: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200',
      shortlisted: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200',
      interviewed: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-200',
      rejected: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200',
      applied: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
    };
    return map[status] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
  };

  const formatAppliedDate = (timestamp) => {
    if (!timestamp) {
      return '—';
    }
    try {
      return new Date(timestamp).toLocaleString(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short'
      });
    } catch {
      return '—';
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Placement Drives</h2>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          <FaPlus />
          <span>Add Drive</span>
        </button>
      </div>

      {showAddForm && (
        <form onSubmit={handleSubmit} className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Company Name
              </label>
              <input
                type="text"
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-600 dark:text-white"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Role
              </label>
              <input
                type="text"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-600 dark:text-white"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Package
              </label>
              <input
                type="text"
                value={formData.package}
                onChange={(e) => setFormData({ ...formData, package: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-600 dark:text-white"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Minimum CGPA
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.eligibilityCriteria.minCGPA}
                onChange={(e) => setFormData({
                  ...formData,
                  eligibilityCriteria: { ...formData.eligibilityCriteria, minCGPA: e.target.value }
                })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-600 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Application Deadline
              </label>
              <input
                type="date"
                value={formData.applicationDeadline}
                onChange={(e) => setFormData({ ...formData, applicationDeadline: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-600 dark:text-white"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Drive Date
              </label>
              <input
                type="date"
                value={formData.driveDate}
                onChange={(e) => setFormData({ ...formData, driveDate: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-600 dark:text-white"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-600 dark:text-white"
                rows="3"
              />
            </div>
          </div>
          <div className="mt-6 border-t border-gray-200 dark:border-gray-600 pt-4">
            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-3 flex items-center space-x-2">
              <FaUsers />
              <span>Who should receive this drive?</span>
            </h3>
            <div className="flex flex-col md:flex-row md:items-center md:space-x-4 space-y-2 md:space-y-0">
              <label className="inline-flex items-center space-x-2 text-sm text-gray-700 dark:text-gray-200">
                <input
                  type="radio"
                  name="studentSelectionMode"
                  value="auto"
                  checked={studentSelectionMode === 'auto'}
                  onChange={() => setStudentSelectionMode('auto')}
                  className="text-primary-600 focus:ring-primary-500"
                />
                <span>All eligible students (based on CGPA / departments)</span>
              </label>
              <label className="inline-flex items-center space-x-2 text-sm text-gray-700 dark:text-gray-200">
                <input
                  type="radio"
                  name="studentSelectionMode"
                  value="manual"
                  checked={studentSelectionMode === 'manual'}
                  onChange={() => setStudentSelectionMode('manual')}
                  className="text-primary-600 focus:ring-primary-500"
                />
                <span>Only selected students</span>
              </label>
            </div>

            {studentSelectionMode === 'manual' && (
              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-600 dark:text-gray-300">
                    Choose the specific students who should receive this drive.
                  </p>
                  <button
                    type="button"
                    onClick={fetchStudentsForSelection}
                    className="px-3 py-1.5 text-xs bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                  >
                    {studentsLoading ? 'Loading…' : 'Load / Refresh students'}
                  </button>
                </div>

                {studentsLoading ? (
                  <div className="flex items-center justify-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
                  </div>
                ) : (
                  <div className="max-h-64 overflow-y-auto border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 p-2">
                    {students.length === 0 ? (
                      <p className="text-xs text-gray-500 dark:text-gray-400 py-4 text-center">
                        No students loaded. Click &quot;Load / Refresh students&quot; to fetch the list.
                      </p>
                    ) : (
                      students.map((student) => {
                        const name = `${student.personalInfo?.firstName || ''} ${student.personalInfo?.lastName || ''}`.trim() || 'Unnamed';
                        const roll = student.academicInfo?.rollNumber || 'N/A';
                        const dept = student.academicInfo?.department || 'N/A';
                        const isChecked = selectedStudentIds.includes(student._id);
                        return (
                          <label
                            key={student._id}
                            className="flex items-center justify-between px-2 py-1.5 rounded hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer text-xs"
                          >
                            <div className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => toggleStudentSelected(student._id)}
                                className="text-primary-600 focus:ring-primary-500"
                              />
                              <div>
                                <p className="text-gray-800 dark:text-gray-100 font-medium">
                                  {name} <span className="text-gray-500 dark:text-gray-400 font-normal">({roll})</span>
                                </p>
                                <p className="text-[11px] text-gray-500 dark:text-gray-400">
                                  Dept: {dept}
                                </p>
                              </div>
                            </div>
                          </label>
                        );
                      })
                    )}
                  </div>
                )}

                <p className="text-xs text-gray-600 dark:text-gray-300">
                  <strong>{selectedStudentIds.length}</strong> student(s) selected. Only these students will get this drive notification.
                </p>
              </div>
            )}
          </div>
          <div className="mt-4 flex space-x-2">
            <button
              type="submit"
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              Create Drive
            </button>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="space-y-4">
        {drives.map((drive) => {
          const applications = drive.applications || [];
          const isExpanded = expandedDriveId === drive._id;
          const currentFilter = applicationFilters[drive._id] || 'selected';
          const statusCounts = applications.reduce((acc, application) => {
            const statusKey = application.status || 'applied';
            acc[statusKey] = (acc[statusKey] || 0) + 1;
            return acc;
          }, {});
          const filteredApplications = applications.filter((application) => {
            const statusKey = application.status || 'applied';
            if (currentFilter === 'all') {
              return true;
            }
            return statusKey === currentFilter;
          });

          return (
            <div key={drive._id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div className="flex justify-between items-start gap-4">
                <div>
                  <h3 className="text-xl font-semibold text-gray-800 dark:text-white">{drive.companyName}</h3>
                  <p className="text-gray-600 dark:text-gray-400">{drive.role}</p>
                  <p className="text-gray-600 dark:text-gray-400">Package: {drive.package}</p>
                  <p className="text-sm text-gray-500 mt-2">
                    Deadline: {new Date(drive.applicationDeadline).toLocaleDateString()}
                  </p>
                  <p className="text-sm text-gray-500">
                    Applications: {applications.length}
                  </p>
                </div>
                <div className="flex flex-col items-end space-y-2">
                  <span className={`px-3 py-1 rounded-full text-sm ${
                    drive.status === 'open' ? 'bg-green-100 text-green-800' :
                    drive.status === 'closed' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {drive.status}
                  </span>
                  <button
                    onClick={() => toggleDriveExpansion(drive._id)}
                    className="flex items-center space-x-2 text-primary-600 hover:text-primary-700 text-sm"
                  >
                    {isExpanded ? <FaChevronUp /> : <FaChevronDown />}
                    <span>{isExpanded ? 'Hide applicants' : 'View applicants'}</span>
                  </button>
                </div>
              </div>

              {isExpanded && (
                <div className="mt-4 border-t border-gray-200 dark:border-gray-700 pt-4">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Total applicants: {applications.length}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center mt-1">
                        <FaUserCheck className="mr-2 text-green-500" />
                        Selected: {statusCounts.selected || 0}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <FaFilter className="text-gray-400" />
                      <select
                        value={currentFilter}
                        onChange={(e) => handleApplicationFilterChange(drive._id, e.target.value)}
                        className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white text-sm"
                      >
                        {APPLICANT_FILTERS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {filteredApplications.length > 0 ? (
                    <div className="overflow-x-auto mt-4">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-left text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">
                            <th className="py-2 pr-4">Student</th>
                            <th className="py-2 pr-4">Email</th>
                            <th className="py-2 pr-4">Roll No.</th>
                            <th className="py-2 pr-4">Department</th>
                            <th className="py-2 pr-4">Status</th>
                            <th className="py-2">Applied</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredApplications.map((application) => {
                            const applicant = application.studentId;
                            const fullName = applicant
                              ? `${applicant.personalInfo?.firstName || ''} ${applicant.personalInfo?.lastName || ''}`.trim() || 'N/A'
                              : 'Student removed';
                            const email = applicant?.userId?.email || 'N/A';
                            const rollNumber = applicant?.academicInfo?.rollNumber || '—';
                            const department = applicant?.academicInfo?.department || '—';
                            const applicationStatus = application.status || 'applied';
                            const statusLabel = applicationStatus.charAt(0).toUpperCase() + applicationStatus.slice(1);

                            return (
                              <tr key={application._id || `${drive._id}-${rollNumber}`} className="border-b border-gray-200 dark:border-gray-700 last:border-b-0">
                                <td className="py-2 pr-4 text-gray-800 dark:text-gray-100">{fullName}</td>
                                <td className="py-2 pr-4 text-gray-600 dark:text-gray-300">{email}</td>
                                <td className="py-2 pr-4 text-gray-600 dark:text-gray-300">{rollNumber}</td>
                                <td className="py-2 pr-4 text-gray-600 dark:text-gray-300">{department}</td>
                                <td className="py-2 pr-4">
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusStyles(applicationStatus)}`}>
                                    {statusLabel}
                                  </span>
                                </td>
                                <td className="py-2 text-gray-600 dark:text-gray-300">
                                  {formatAppliedDate(application.appliedAt)}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
                      No applicants match the selected filter.
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
        {drives.length === 0 && (
          <p className="text-gray-500 text-center py-8">No placement drives</p>
        )}
      </div>
    </div>
  );
};

export default Drives;

