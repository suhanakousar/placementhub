import React, { useState, useEffect, useCallback } from 'react';
import { FaSearch, FaDownload, FaEye, FaFileExport, FaFilePdf, FaEnvelope, FaTrash, FaExclamationTriangle, FaTimes, FaUsers } from 'react-icons/fa';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import StudentDetailModal from '../../components/StudentDetailModal';
import { getDepartmentName } from '../../utils/departmentNames';

const Students = () => {
  const [students, setStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    department: '',
    year: '',
    specialization: '',
    hasProjects: '',
    hasInternships: '',
    hasHackathons: ''
  });
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState({
    isOpen: false,
    studentId: null,
    studentName: '',
    step: 1 // 1 = first confirmation, 2 = final warning
  });
  const hasActiveFilters = Boolean(
    debouncedSearchTerm ||
    filters.department ||
    filters.year ||
    filters.specialization ||
    filters.hasProjects ||
    filters.hasInternships ||
    filters.hasHackathons
  );

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearchTerm(searchTerm), 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (debouncedSearchTerm) params.search = debouncedSearchTerm;
      if (filters.department) params.department = filters.department;
      if (filters.year) params.year = filters.year;
      if (filters.specialization) params.specialization = filters.specialization;
      if (filters.hasProjects) params.hasProjects = filters.hasProjects;
      if (filters.hasInternships) params.hasInternships = filters.hasInternships;
      if (filters.hasHackathons) params.hasHackathons = filters.hasHackathons;

      const response = await api.get('/students', { params });
      const studentData = response.data || [];
      setStudents(studentData);

      if (studentData.length === 0) {
        toast.info(
          hasActiveFilters
            ? 'No students match your filters'
            : 'No students found in the system'
        );
      }
    } catch (error) {
      console.error('Error fetching students:', error);
      toast.error(error.response?.data?.message || 'Failed to load students');
      setStudents([]);
    } finally {
      setLoading(false);
    }
  }, [
    debouncedSearchTerm,
    filters.department,
    filters.year,
    filters.specialization,
    filters.hasProjects,
    filters.hasInternships,
    filters.hasHackathons,
    hasActiveFilters
  ]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  const handleDownloadResume = async (studentId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${api.defaults.baseURL}/admin/students/${studentId}/resume`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to download resume');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const student = students.find(s => s._id === studentId);
      const filename = student
        ? `${student.personalInfo?.firstName}_${student.personalInfo?.lastName}_Resume.pdf`
        : `resume_${studentId}.pdf`;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Resume downloaded successfully');
    } catch (error) {
      toast.error(error.message || 'Failed to download resume');
    }
  };

  const handleDownloadResumeById = async (studentId, resumeId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${api.defaults.baseURL}/admin/students/${studentId}/resume/${resumeId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to download resume');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const student = students.find(s => s._id === studentId);
      const filename = student
        ? `${student.personalInfo?.firstName}_${student.personalInfo?.lastName}_Resume.pdf`
        : `resume_${resumeId}.pdf`;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Resume downloaded successfully');
    } catch (error) {
      toast.error(error.message || 'Failed to download resume');
    }
  };

  const handleExportData = async (format = 'csv') => {
    try {
      const queryParams = new URLSearchParams();
      if (filters.department) queryParams.append('department', filters.department);
      if (filters.year) queryParams.append('year', filters.year);
      if (filters.specialization) queryParams.append('specialization', filters.specialization);
      if (filters.hasProjects) queryParams.append('hasProjects', filters.hasProjects);
      if (filters.hasInternships) queryParams.append('hasInternships', filters.hasInternships);
      if (filters.hasHackathons) queryParams.append('hasHackathons', filters.hasHackathons);
      if (searchTerm) queryParams.append('search', searchTerm);
      queryParams.append('format', format);

      const response = await api.get(`/admin/students/export?${queryParams.toString()}`, {
        responseType: format === 'csv' ? 'blob' : 'json'
      });

      if (format === 'csv') {
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `students_export_${Date.now()}.csv`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        toast.success('Student data exported successfully');
      } else {
        // JSON format - create downloadable file
        const dataStr = JSON.stringify(response.data, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = window.URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `students_export_${Date.now()}.json`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        toast.success('Student data exported successfully');
      }
    } catch (error) {
      toast.error('Failed to export student data');
    }
  };

  const handleViewStudent = async (studentId) => {
    try {
      const response = await api.get(`/students/${studentId}`);
      setSelectedStudent(response.data);
      setIsModalOpen(true);
    } catch (error) {
      toast.error('Failed to fetch student details');
    }
  };

  const handleDeleteClick = (studentId, studentName) => {
    setDeleteConfirmation({
      isOpen: true,
      studentId,
      studentName,
      step: 1
    });
  };

  const handleConfirmDelete = () => {
    if (deleteConfirmation.step === 1) {
      // Move to final warning step
      setDeleteConfirmation({
        ...deleteConfirmation,
        step: 2
      });
    } else {
      // Final confirmation - proceed with deletion
      performDelete();
    }
  };

  const performDelete = async () => {
    try {
      setLoading(true);
      await api.delete(`/admin/students/${deleteConfirmation.studentId}`);
      toast.success('Student account and all data deleted successfully');
      
      // Remove student from list
      setStudents(prev => prev.filter(student => student._id !== deleteConfirmation.studentId));
      
      // Close confirmation modal
      setDeleteConfirmation({
        isOpen: false,
        studentId: null,
        studentName: '',
        step: 1
      });
    } catch (error) {
      console.error('Error deleting student:', error);
      toast.error(error.response?.data?.message || 'Failed to delete student account');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelDelete = () => {
    setDeleteConfirmation({
      isOpen: false,
      studentId: null,
      studentName: '',
      step: 1
    });
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
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Manage Students</h2>
        <div className="flex space-x-2">
          <button
            onClick={() => handleExportData('csv')}
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            title="Export to CSV"
          >
            <FaFileExport />
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => handleExportData('json')}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            title="Export to JSON"
          >
            <FaFileExport />
            <span>Export JSON</span>
          </button>
        </div>
      </div>

      <div className="mb-6 space-y-4">
        <div className="flex items-center space-x-4">
          <div className="flex-1 relative">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or roll number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <select
            value={filters.department}
            onChange={(e) => setFilters({ ...filters, department: e.target.value })}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
          >
            <option value="">All Departments</option>
            <option value="CSE">Computer Science & Engineering</option>
            <option value="ECE">Electronics & Communication Engineering</option>
            <option value="EEE">Electrical & Electronics Engineering</option>
            <option value="ME">Mechanical Engineering</option>
            <option value="CE">Civil Engineering</option>
            <option value="IT">Information Technology</option>
            <option value="CSIT">Computer Science and Information Technology</option>
            <option value="AI">Artificial Intelligence & Data Science (AI & DS)</option>
            <option value="BT">Biotechnology</option>
          </select>

          <select
            value={filters.year}
            onChange={(e) => setFilters({ ...filters, year: e.target.value })}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
          >
            <option value="">All Passout Batches</option>
            <option value="2026">2026</option>
            <option value="2027">2027</option>
            <option value="2028">2028</option>
            <option value="2029">2029</option>
          </select>

          <select
            value={filters.specialization}
            onChange={(e) => setFilters({ ...filters, specialization: e.target.value })}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
          >
            <option value="">All Specializations</option>
            <option value="AGRI-BIOTECHNOLOGY">AGRI-BIOTECHNOLOGY</option>
            <option value="AI AND AUTONOMOUS SYSTEMS">AI AND AUTONOMOUS SYSTEMS</option>
            <option value="AI FOR COMPUTATIONAL INTELLIGENCE">AI FOR COMPUTATIONAL INTELLIGENCE</option>
            <option value="AI-DRIVEN EDGE ARCHITECTURES AND APPLICATIONS">AI-DRIVEN EDGE ARCHITECTURES AND APPLICATIONS</option>
            <option value="AI-DRIVEN LANGUAGE TECHNOLOGIES">AI-DRIVEN LANGUAGE TECHNOLOGIES</option>
            <option value="AUTOMOTIVE ELECTRONICS AND AUTOSAR">AUTOMOTIVE ELECTRONICS AND AUTOSAR</option>
            <option value="AUTOMOTIVE ENERGY ENGINEERING">AUTOMOTIVE ENERGY ENGINEERING</option>
            <option value="BIOINFORMATICS">BIOINFORMATICS</option>
            <option value="DATA COMMUNICATIONS">DATA COMMUNICATIONS</option>
            <option value="E-MOBILITY ENGINEERING">E-MOBILITY ENGINEERING</option>
            <option value="ELECTRICAL MACHINES">ELECTRICAL MACHINES</option>
            <option value="ENGINEERING DESIGN">ENGINEERING DESIGN</option>
            <option value="STRUCTURAL ENGINEERING">STRUCTURAL ENGINEERING</option>
            <option value="GEOTECHNICAL AND TRANSPORTATION ENGINEERING">GEOTECHNICAL AND TRANSPORTATION ENGINEERING</option>
            <option value="GREEN ENERGY TECHNOLOGIES">GREEN ENERGY TECHNOLOGIES</option>
            <option value="INDUSTRIAL AUTOMATION">INDUSTRIAL AUTOMATION</option>
            <option value="SMART GRID TECHNOLOGIES">SMART GRID TECHNOLOGIES</option>
            <option value="HEALTHCARE DATA ANALYTICS">HEALTHCARE DATA ANALYTICS</option>
            <option value="INDUSTRIAL BIOTECHNOLOGY">INDUSTRIAL BIOTECHNOLOGY</option>
            <option value="GENERATIVE AI & MACHINE LEARNING">GENERATIVE AI & MACHINE LEARNING</option>
            <option value="IOT ANALYTICS">IOT ANALYTICS</option>
            <option value="MEDICAL BIOTECHNOLOGY">MEDICAL BIOTECHNOLOGY</option>
            <option value="ROBOTICS AND AUTOMATION">ROBOTICS AND AUTOMATION</option>
            <option value="SMART MANUFACTURING">SMART MANUFACTURING</option>
            <option value="VERY LARGE-SCALE INTEGRATION">VERY LARGE-SCALE INTEGRATION</option>
            <option value="WATER RESOURCE AND ENVIRONMENTAL ENGINEERING">WATER RESOURCE AND ENVIRONMENTAL ENGINEERING</option>
            <option value="CONSTRUCTION TECHNOLOGY AND MANAGEMENT">CONSTRUCTION TECHNOLOGY AND MANAGEMENT</option>
            <option value="NANOTECHNOLOGY & OPTOELECTRONICS">NANOTECHNOLOGY & OPTOELECTRONICS</option>
            <option value="CLOUD AND EDGE COMPUTING">CLOUD AND EDGE COMPUTING</option>
            <option value="CLOUD INFRASTRUCTURE DESIGN AND ENGINEERING">CLOUD INFRASTRUCTURE DESIGN AND ENGINEERING</option>
            <option value="CLOUD NATIVE SECURITY">CLOUD NATIVE SECURITY</option>
            <option value="CLOUD NATIVE SOFTWARE ENGINEERING">CLOUD NATIVE SOFTWARE ENGINEERING</option>
            <option value="CLOUD-BASED SCIENTIFIC COMPUTING">CLOUD-BASED SCIENTIFIC COMPUTING</option>
            <option value="DATA ENGINEERING FOR AI">DATA ENGINEERING FOR AI</option>
            <option value="DATA SCIENCE AND BIG DATA ANALYTICS">DATA SCIENCE AND BIG DATA ANALYTICS</option>
            <option value="DISTRIBUTED LEDGER ANALYTICS">DISTRIBUTED LEDGER ANALYTICS</option>
            <option value="SOCIAL AND DIGITAL MEDIA ANALYTICS">SOCIAL AND DIGITAL MEDIA ANALYTICS</option>
            <option value="AI SYSTEMS FOR VISUAL INTELLIGENCE">AI SYSTEMS FOR VISUAL INTELLIGENCE</option>
            <option value="5G - 6G WIRELESS TECHNOLOGIES">5G - 6G WIRELESS TECHNOLOGIES</option>
            <option value="CROSS PLATFORM DEVELOPMENT FRAMEWORKS">CROSS PLATFORM DEVELOPMENT FRAMEWORKS</option>
            <option value="GAME DEVELOPMENT AND UX DESIGN">GAME DEVELOPMENT AND UX DESIGN</option>
            <option value="SPATIAL COMPUTING AND IMMERSIVE TECHNOLOGIES">SPATIAL COMPUTING AND IMMERSIVE TECHNOLOGIES</option>
            <option value="BLOCKCHAIN ENGINEERING FOR WEB3">BLOCKCHAIN ENGINEERING FOR WEB3</option>
            <option value="CYBER PHYSICAL SYSTEMS AND IOT">CYBER PHYSICAL SYSTEMS AND IOT</option>
            <option value="CYBER SECURITY AND BLOCKCHAIN TECHNOLOGY">CYBER SECURITY AND BLOCKCHAIN TECHNOLOGY</option>
            <option value="HARDWARE-SOFTWARE CO-DESIGN FOR SECURITY">HARDWARE-SOFTWARE CO-DESIGN FOR SECURITY</option>
            <option value="SOFTWARE MODELLING AND DEVOPS">SOFTWARE MODELLING AND DEVOPS</option>
          </select>

          <select
            value={filters.hasProjects}
            onChange={(e) => setFilters({ ...filters, hasProjects: e.target.value })}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
          >
            <option value="">All Projects</option>
            <option value="yes">Has Projects</option>
            <option value="no">No Projects</option>
          </select>

          <select
            value={filters.hasInternships}
            onChange={(e) => setFilters({ ...filters, hasInternships: e.target.value })}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
          >
            <option value="">All Internships</option>
            <option value="yes">Has Internships</option>
            <option value="no">No Internships</option>
          </select>

          <select
            value={filters.hasHackathons}
            onChange={(e) => setFilters({ ...filters, hasHackathons: e.target.value })}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
          >
            <option value="">All Hackathons</option>
            <option value="yes">Participated in Hackathons</option>
            <option value="no">No Hackathons</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700">
              <th className="text-left py-3 px-4 text-gray-700 dark:text-gray-300">Name</th>
              <th className="text-left py-3 px-4 text-gray-700 dark:text-gray-300">Email</th>
              <th className="text-left py-3 px-4 text-gray-700 dark:text-gray-300">Roll Number</th>
              <th className="text-left py-3 px-4 text-gray-700 dark:text-gray-300">Department</th>
              <th className="text-left py-3 px-4 text-gray-700 dark:text-gray-300">Passout Batch</th>
              <th className="text-left py-3 px-4 text-gray-700 dark:text-gray-300">Specialization</th>
              <th className="text-left py-3 px-4 text-gray-700 dark:text-gray-300">CGPA</th>
              <th className="text-left py-3 px-4 text-gray-700 dark:text-gray-300">Status</th>
              <th className="text-left py-3 px-4 text-gray-700 dark:text-gray-300">Resumes</th>
              <th className="text-left py-3 px-4 text-gray-700 dark:text-gray-300">Actions</th>
            </tr>
          </thead>
          <tbody>
            {students.map((student) => (
              <tr key={student._id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <td className="py-3 px-4 text-gray-800 dark:text-white">
                  {student.personalInfo?.firstName} {student.personalInfo?.lastName}
                </td>
                <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                  <div className="flex items-center space-x-1">
                    <FaEnvelope className="text-sm" />
                    <span>{student.userId?.email || 'N/A'}</span>
                  </div>
                </td>
                <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                  {student.academicInfo?.rollNumber}
                </td>
                <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                  {getDepartmentName(student.academicInfo?.department)}
                </td>
                <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                  {student.academicInfo?.year}
                </td>
                <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                  {student.academicInfo?.specialization || 'N/A'}
                </td>
                <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                  {student.academicInfo?.cgpa || 'N/A'}
                </td>
                <td className="py-3 px-4">
                  {student.placementStatus?.resumeVerified ? (
                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-sm">
                      Verified
                    </span>
                  ) : (
                    <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-sm">
                      Unverified
                    </span>
                  )}
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {student.resumes?.length || 0}
                    </span>
                    {student.resumes && student.resumes.length > 0 && (
                      <div className="flex flex-col space-y-1">
                        {student.resumes.slice(0, 2).map((resume, idx) => (
                          <button
                            key={resume._id || idx}
                            onClick={() => handleDownloadResumeById(student._id, resume._id)}
                            className="p-1 text-blue-600 hover:bg-blue-50 rounded text-xs"
                            title={`Download: ${resume.name}`}
                          >
                            <FaFilePdf />
                          </button>
                        ))}
                        {student.resumes.length > 2 && (
                          <span className="text-xs text-gray-500">+{student.resumes.length - 2}</span>
                        )}
                      </div>
                    )}
                  </div>
                </td>
                <td className="py-3 px-4">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleViewStudent(student._id)}
                      className="p-2 text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded transition"
                      title="View Details"
                    >
                      <FaEye />
                    </button>
                    <button
                      onClick={() => handleDownloadResume(student._id)}
                      className={`p-2 rounded transition ${
                        !student.resumes || student.resumes.length === 0
                          ? 'text-gray-400 cursor-not-allowed'
                          : 'text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20'
                      }`}
                      title="Download Latest Resume"
                      disabled={!student.resumes || student.resumes.length === 0}
                    >
                      <FaDownload />
                    </button>
                    <button
                      onClick={() => handleDeleteClick(
                        student._id, 
                        `${student.personalInfo?.firstName || ''} ${student.personalInfo?.lastName || ''}`.trim() || 'this student'
                      )}
                      className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition"
                      title="Delete Student Account"
                    >
                      <FaTrash />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {students.length === 0 && !loading && (
          <div className="text-center py-12">
            <FaUsers className="mx-auto text-4xl text-gray-400 mb-4" />
            <p className="text-gray-500 dark:text-gray-400 text-lg font-medium mb-2">
              {hasActiveFilters
                ? 'No students match your filters'
                : 'No students registered yet'}
            </p>
            {hasActiveFilters ? (
              <button
                onClick={() => {
                  setFilters({
                    department: '',
                    year: '',
                    specialization: '',
                    hasProjects: '',
                    hasInternships: '',
                    hasHackathons: ''
                  });
                  setSearchTerm('');
                }}
                className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                Clear Filters
              </button>
            ) : (
              <p className="text-gray-400 dark:text-gray-500 text-sm">
                Students will appear here once they register
              </p>
            )}
          </div>
        )}
      </div>

      {students.length > 0 && (
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <p className="text-sm text-gray-700 dark:text-gray-300">
            <strong>Total Students:</strong> {students.length} student(s) found
            {filters.department && ` in ${getDepartmentName(filters.department)} department`}
            {filters.year && ` in Passout Batch ${filters.year}`}
            {filters.specialization && ` with specialization ${filters.specialization}`}
            {filters.hasProjects && ` with ${filters.hasProjects === 'yes' ? 'projects' : 'no projects'}`}
            {filters.hasInternships && ` with ${filters.hasInternships === 'yes' ? 'internships' : 'no internships'}`}
            {filters.hasHackathons && ` with ${filters.hasHackathons === 'yes' ? 'hackathons' : 'no hackathons'}`}
          </p>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
            Use the export buttons above to download student data as CSV or JSON
          </p>
        </div>
      )}

      <StudentDetailModal
        student={selectedStudent}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedStudent(null);
        }}
        onDownloadResume={handleDownloadResume}
      />

      {/* Delete Confirmation Modal */}
      {deleteConfirmation.isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={handleCancelDelete}
        >
          <div 
            className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="p-3 bg-red-100 dark:bg-red-900/20 rounded-full">
                    <FaExclamationTriangle className="text-red-600 dark:text-red-400 text-2xl" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-800 dark:text-white">
                    {deleteConfirmation.step === 1 ? 'Confirm Deletion' : 'Final Warning'}
                  </h3>
                </div>
                <button
                  onClick={handleCancelDelete}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <FaTimes className="text-xl" />
                </button>
              </div>

              {deleteConfirmation.step === 1 ? (
                <>
                  <p className="text-gray-700 dark:text-gray-300 mb-4">
                    Are you sure you want to delete <strong>{deleteConfirmation.studentName}</strong>?
                  </p>
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-4">
                    <p className="text-sm font-semibold text-red-800 dark:text-red-300 mb-2">
                      This will permanently delete:
                    </p>
                    <ul className="text-sm text-red-700 dark:text-red-400 space-y-1 list-disc list-inside">
                      <li>Student account and all data</li>
                      <li>User login credentials (student cannot login)</li>
                      <li>All uploaded files (resumes, certificates, photos)</li>
                      <li>All notifications</li>
                    </ul>
                    <p className="text-sm font-bold text-red-800 dark:text-red-300 mt-2">
                      ⚠️ This action CANNOT be undone!
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-500 dark:border-red-600 rounded-lg p-4 mb-4">
                    <p className="text-lg font-bold text-red-800 dark:text-red-300 mb-2 flex items-center">
                      <FaExclamationTriangle className="mr-2" />
                      FINAL WARNING
                    </p>
                    <p className="text-sm text-red-700 dark:text-red-400">
                      You are about to permanently delete <strong>{deleteConfirmation.studentName}</strong> and all associated data.
                    </p>
                    <p className="text-sm font-bold text-red-800 dark:text-red-300 mt-2">
                      Are you absolutely sure you want to proceed?
                    </p>
                  </div>
                </>
              )}

              <div className="flex space-x-3 mt-6">
                <button
                  onClick={handleCancelDelete}
                  className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDelete}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                >
                  {deleteConfirmation.step === 1 ? 'Continue' : 'Yes, Delete Permanently'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Students;

