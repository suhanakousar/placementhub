import React from 'react';
import { FaTimes, FaGraduationCap, FaProjectDiagram, FaBriefcase, FaTrophy, FaFilePdf, FaDownload, FaLinkedin, FaGithub, FaGlobe, FaPhone, FaEnvelope, FaUser } from 'react-icons/fa';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { getDepartmentName } from '../utils/departmentNames';

const StudentDetailModal = ({ student, isOpen, onClose, onDownloadResume }) => {
  if (!isOpen || !student) return null;

  const getProfilePhotoUrl = () => {
    if (student.personalInfo?.profilePhoto) {
      // If it's already a full URL, return it
      if (student.personalInfo.profilePhoto.startsWith('http')) {
        return student.personalInfo.profilePhoto;
      }
      // Otherwise, construct the URL
      const baseUrl = process.env.REACT_APP_API_URL?.replace('/api', '') || 'https://placementhub-2.onrender.com';
      return `${baseUrl}/${student.personalInfo.profilePhoto}`;
    }
    return null;
  };

  const handleDownloadResume = async (resumeId) => {
    try {
      const response = await api.get(`/admin/students/${student._id}/resume/${resumeId}`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      const filename = `${student.personalInfo?.firstName}_${student.personalInfo?.lastName}_${student.resumes.find(r => r._id === resumeId)?.name || 'Resume'}.pdf`;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Resume downloaded successfully');
    } catch (error) {
      toast.error('Failed to download resume');
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div 
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
            Student Details - {student.personalInfo?.firstName} {student.personalInfo?.lastName}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <FaTimes className="text-2xl" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Profile Photo Section */}
          {getProfilePhotoUrl() && (
            <div className="flex justify-center mb-6">
              <img
                src={getProfilePhotoUrl()}
                alt={`${student.personalInfo?.firstName} ${student.personalInfo?.lastName}`}
                className="w-32 h-32 rounded-full object-cover border-4 border-primary-500 shadow-lg"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
              <div className="w-32 h-32 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center border-4 border-primary-500 shadow-lg hidden">
                <FaUser className="text-4xl text-gray-400" />
              </div>
            </div>
          )}

          {/* Personal Information */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center">
              <FaGraduationCap className="mr-2" />
              Personal Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Name</p>
                <p className="font-medium text-gray-800 dark:text-white">
                  {student.personalInfo?.firstName} {student.personalInfo?.lastName}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center">
                  <FaEnvelope className="mr-1" />
                  Email
                </p>
                <p className="font-medium text-gray-800 dark:text-white">
                  {student.userId?.email || 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center">
                  <FaPhone className="mr-1" />
                  Phone
                </p>
                <p className="font-medium text-gray-800 dark:text-white">
                  {student.personalInfo?.phone || 'N/A'}
                </p>
                {student.personalInfo?.alternatePhone && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Alt: {student.personalInfo.alternatePhone}
                  </p>
                )}
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Roll Number</p>
                <p className="font-medium text-gray-800 dark:text-white">
                  {student.academicInfo?.rollNumber || 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Department</p>
                <p className="font-medium text-gray-800 dark:text-white">
                  {getDepartmentName(student.academicInfo?.department)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Passout Batch</p>
                <p className="font-medium text-gray-800 dark:text-white">
                  {student.academicInfo?.year || 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Specialization</p>
                <p className="font-medium text-gray-800 dark:text-white">
                  {student.academicInfo?.specialization || 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Semester</p>
                <p className="font-medium text-gray-800 dark:text-white">
                  {student.academicInfo?.semester || 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">CGPA</p>
                <p className="font-medium text-gray-800 dark:text-white">
                  {student.academicInfo?.cgpa || 'N/A'}
                </p>
              </div>
              {student.personalInfo?.linkedin && (
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center">
                    <FaLinkedin className="mr-1" />
                    LinkedIn
                  </p>
                  <a
                    href={student.personalInfo.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary-600 hover:underline"
                  >
                    {student.personalInfo.linkedin}
                  </a>
                </div>
              )}
              {student.personalInfo?.github && (
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center">
                    <FaGithub className="mr-1" />
                    GitHub
                  </p>
                  <a
                    href={student.personalInfo.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary-600 hover:underline"
                  >
                    {student.personalInfo.github}
                  </a>
                </div>
              )}
              {student.personalInfo?.portfolio && (
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center">
                    <FaGlobe className="mr-1" />
                    Portfolio
                  </p>
                  <a
                    href={student.personalInfo.portfolio}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary-600 hover:underline"
                  >
                    {student.personalInfo.portfolio}
                  </a>
                </div>
              )}
              {student.personalInfo?.website && (
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center">
                    <FaGlobe className="mr-1" />
                    Personal Website
                  </p>
                  <a
                    href={student.personalInfo.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary-600 hover:underline"
                  >
                    {student.personalInfo.website}
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Skills */}
          {student.skills && student.skills.length > 0 && (
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Skills</h3>
              <div className="flex flex-wrap gap-2">
                {student.skills.map((skill, index) => (
                  <span
                    key={index}
                    className={`px-3 py-1 rounded-full text-sm ${
                      skill.verified
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-300'
                    }`}
                  >
                    {skill.name} ({skill.level})
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Projects */}
          {student.projects && student.projects.length > 0 && (
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center">
                <FaProjectDiagram className="mr-2" />
                Projects ({student.projects.length})
              </h3>
              <div className="space-y-4">
                {student.projects.map((project, index) => (
                  <div key={index} className="border-l-4 border-primary-500 pl-4">
                    <h4 className="font-semibold text-gray-800 dark:text-white">{project.title}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{project.description}</p>
                    {project.technologies && project.technologies.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {project.technologies.map((tech, i) => (
                          <span key={i} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs dark:bg-blue-900/20 dark:text-blue-400">
                            {tech}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="flex space-x-4 mt-2">
                      {project.githubLink && (
                        <a
                          href={project.githubLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary-600 hover:underline text-sm flex items-center"
                        >
                          <FaGithub className="mr-1" />
                          GitHub
                        </a>
                      )}
                      {project.demoLink && (
                        <a
                          href={project.demoLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary-600 hover:underline text-sm flex items-center"
                        >
                          <FaGlobe className="mr-1" />
                          Demo
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Internships */}
          {student.internships && student.internships.length > 0 && (
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center">
                <FaBriefcase className="mr-2" />
                Internships ({student.internships.length})
              </h3>
              <div className="space-y-4">
                {student.internships.map((internship, index) => (
                  <div key={index} className="border-l-4 border-green-500 pl-4">
                    <h4 className="font-semibold text-gray-800 dark:text-white">
                      {internship.companyName} - {internship.role}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{internship.description}</p>
                    {internship.startDate && internship.endDate && (
                      <p className="text-sm text-gray-500 mt-1">
                        {new Date(internship.startDate).toLocaleDateString()} - {new Date(internship.endDate).toLocaleDateString()}
                      </p>
                    )}
                    {internship.mentor && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Mentor: {internship.mentor}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Hackathons */}
          {student.hackathons && student.hackathons.length > 0 && (
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center">
                <FaTrophy className="mr-2" />
                Hackathons ({student.hackathons.length})
              </h3>
              <div className="space-y-4">
                {student.hackathons.map((hackathon, index) => (
                  <div key={index} className="border-l-4 border-yellow-500 pl-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-semibold text-gray-800 dark:text-white">{hackathon.name}</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{hackathon.platform}</p>
                        {hackathon.rank && (
                          <span className="inline-block mt-2 px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium dark:bg-yellow-900/20 dark:text-yellow-400">
                            Rank: {hackathon.rank}
                          </span>
                        )}
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">{hackathon.description}</p>
                        {hackathon.date && (
                          <p className="text-sm text-gray-500 mt-1">
                            Date: {new Date(hackathon.date).toLocaleDateString()}
                          </p>
                        )}
                        {hackathon.projectLink && (
                          <a
                            href={hackathon.projectLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary-600 hover:underline text-sm mt-2 inline-block"
                          >
                            View Project →
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Achievements */}
          {student.achievements && student.achievements.length > 0 && (
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
                Achievements ({student.achievements.length})
              </h3>
              <div className="space-y-2">
                {student.achievements.map((achievement, index) => (
                  <div key={index} className="flex items-start">
                    <FaTrophy className="text-yellow-500 mr-2 mt-1" />
                    <div>
                      <p className="font-medium text-gray-800 dark:text-white">{achievement.title}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{achievement.description}</p>
                      {achievement.date && (
                        <p className="text-sm text-gray-500">
                          {new Date(achievement.date).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Resumes */}
          {student.resumes && student.resumes.length > 0 && (
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center">
                <FaFilePdf className="mr-2" />
                Resumes ({student.resumes.length})
              </h3>
              <div className="space-y-3">
                {student.resumes.map((resume, index) => (
                  <div key={resume._id || index} className="flex items-center justify-between p-3 bg-white dark:bg-gray-600 rounded border border-gray-200 dark:border-gray-500">
                    <div className="flex items-center space-x-3 flex-1">
                      <FaFilePdf className="text-red-500 text-xl" />
                      <div className="flex-1">
                        <p className="font-medium text-gray-800 dark:text-white">{resume.name}</p>
                        <p className="text-sm text-gray-500">
                          Uploaded: {new Date(resume.uploadedAt).toLocaleDateString()}
                        </p>
                        {resume.tags && resume.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {resume.tags.map((tag, i) => (
                              <span key={i} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs dark:bg-blue-900/20 dark:text-blue-400">
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                        <div className="flex items-center gap-2 mt-2">
                          {resume.verified ? (
                            <span className="inline-block px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                              Verified
                            </span>
                          ) : (
                            <span className="inline-block px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs">
                              Pending
                            </span>
                          )}
                          {resume.score && (
                            <span className="text-xs text-gray-600 dark:text-gray-400">
                              Score: {resume.score}/100
                            </span>
                          )}
                        </div>
                        {resume.feedback && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            <strong>Feedback:</strong> {resume.feedback}
                          </p>
                        )}
                      </div>
                    </div>
                    {resume._id && (
                      <button
                        onClick={() => handleDownloadResume(resume._id)}
                        className="ml-4 flex items-center space-x-1 px-3 py-2 bg-primary-600 text-white rounded hover:bg-primary-700"
                        title="Download Resume"
                      >
                        <FaDownload />
                        <span className="hidden sm:inline">Download</span>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Placement Status */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
              Placement Status
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Profile Completed</p>
                <p className="font-medium text-gray-800 dark:text-white">
                  {student.placementStatus?.profileCompleted ? 'Yes' : 'No'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Resume Verified</p>
                <p className="font-medium text-gray-800 dark:text-white">
                  {student.placementStatus?.resumeVerified ? 'Yes' : 'No'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Shortlisted</p>
                <p className="font-medium text-gray-800 dark:text-white">
                  {student.placementStatus?.shortlisted ? 'Yes' : 'No'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Selected</p>
                <p className="font-medium text-gray-800 dark:text-white">
                  {student.placementStatus?.selected ? 'Yes' : 'No'}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600 p-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default StudentDetailModal;

