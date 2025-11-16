import React, { useState, useEffect } from 'react';
import { FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const Verification = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const response = await api.get('/students');
      setStudents(response.data);
    } catch (error) {
      console.error('Error fetching students:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (studentId, verified = true, feedback = '') => {
    try {
      const response = await api.put(`/admin/students/${studentId}/verify`, {
        verified,
        feedback
      });
      toast.success(verified ? 'Student verified successfully' : 'Verification removed');
      fetchStudents();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to verify student');
    }
  };

  const unverifiedStudents = students.filter(student => 
    !student.placementStatus?.resumeVerified
  );

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">Document Verification Center</h2>

      <div className="space-y-4">
        {unverifiedStudents.map((student) => (
          <div key={student._id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                  {student.personalInfo?.firstName} {student.personalInfo?.lastName}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {student.academicInfo?.rollNumber} - {student.academicInfo?.department}
                </p>
                <div className="mt-4">
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      Resumes: {student.resumes?.length || 0}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      Projects: {student.projects?.length || 0}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      Internships: {student.internships?.length || 0}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      Hackathons: {student.hackathons?.length || 0}
                    </p>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleVerify(student._id, true, 'Profile verified and approved')}
                        className="flex items-center space-x-1 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                      >
                        <FaCheckCircle />
                        <span>Verify Student</span>
                      </button>
                      {student.placementStatus?.resumeVerified && (
                        <button
                          onClick={() => handleVerify(student._id, false, 'Verification removed')}
                          className="flex items-center space-x-1 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                        >
                          <FaTimesCircle />
                          <span>Remove Verification</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
        {unverifiedStudents.length === 0 && (
          <p className="text-gray-500 text-center py-8">No pending verifications</p>
        )}
      </div>
    </div>
  );
};

export default Verification;

