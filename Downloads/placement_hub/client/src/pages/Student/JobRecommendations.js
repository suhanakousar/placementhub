import React, { useState, useEffect } from 'react';
import { FaUpload, FaSearch, FaBookmark, FaBookmark as FaBookmarkSolid, FaExternalLinkAlt, FaCheckCircle, FaSpinner } from 'react-icons/fa';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { getDepartmentName } from '../../utils/departmentNames';
import { useAuth } from '../../contexts/AuthContext';

const JobRecommendations = ({ studentData }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('recommendations');
  const [resumeAnalysis, setResumeAnalysis] = useState(null);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [savedJobs, setSavedJobs] = useState([]);
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [loadingSaved, setLoadingSaved] = useState(false);
  
  // Filters
  const [filters, setFilters] = useState({
    keywords: '',
    location: '',
    experienceLevel: '',
    jobType: ''
  });

  useEffect(() => {
    fetchResumeAnalysis();
    fetchSavedJobs();
  }, []);

  useEffect(() => {
    if (resumeAnalysis && activeTab === 'recommendations') {
      // Auto-fetch jobs on load if resume is analyzed
      fetchJobs();
    }
  }, [resumeAnalysis, activeTab]);

  const fetchResumeAnalysis = async () => {
    try {
      setLoadingAnalysis(true);
      const response = await api.get('/resume/analysis');
      setResumeAnalysis(response.data);
      
      // Pre-fill filters with resume data
      if (response.data) {
        setFilters({
          keywords: response.data.preferredRoles?.join(' ') || '',
          location: response.data.location || 'Remote',
          experienceLevel: response.data.experienceLevel || 'Fresher',
          jobType: 'Full-time'
        });
      }
    } catch (error) {
      if (error.response?.status !== 404) {
        console.error('Error fetching resume analysis:', error);
      }
    } finally {
      setLoadingAnalysis(false);
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (selectedFile.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB');
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error('Please select a file');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('resume', file);

      const response = await api.post('/resume/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      toast.success('Resume uploaded and analyzed successfully!');
      setResumeAnalysis(response.data.analysis);
      setFile(null);
      
      // Update filters with new analysis
      if (response.data.analysis) {
        setFilters({
          keywords: response.data.analysis.preferredRoles?.join(' ') || '',
          location: response.data.analysis.location || 'Remote',
          experienceLevel: response.data.analysis.experienceLevel || 'Fresher',
          jobType: 'Full-time'
        });
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to upload resume');
    } finally {
      setUploading(false);
    }
  };

  const fetchJobs = async () => {
    if (!resumeAnalysis) {
      toast.error('Please upload and analyze your resume first');
      return;
    }

    setLoadingJobs(true);
    try {
      const response = await api.post('/jobs/recommend', {
        keywords: filters.keywords,
        location: filters.location,
        experienceLevel: filters.experienceLevel,
        jobType: filters.jobType,
        page: 1,
        pageSize: 20
      });

      setJobs(response.data.jobs || []);
      if (response.data.jobs.length === 0) {
        toast.info('No jobs found. Try adjusting your filters.');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to fetch jobs');
      setJobs([]);
    } finally {
      setLoadingJobs(false);
    }
  };

  const fetchSavedJobs = async () => {
    setLoadingSaved(true);
    try {
      const response = await api.get('/jobs/saved');
      setSavedJobs(response.data.jobs || []);
    } catch (error) {
      console.error('Error fetching saved jobs:', error);
    } finally {
      setLoadingSaved(false);
    }
  };

  const handleSaveJob = async (job) => {
    try {
      await api.post('/jobs/save', {
        jobId: job.jobId,
        title: job.title,
        company: job.company,
        location: job.location,
        url: job.url,
        type: job.type
      });
      
      toast.success('Job saved!');
      fetchSavedJobs();
    } catch (error) {
      if (error.response?.status === 400 && error.response?.data?.message?.includes('already saved')) {
        toast.info('Job already saved');
      } else {
        toast.error('Failed to save job');
      }
    }
  };

  const handleUnsaveJob = async (jobId) => {
    try {
      await api.delete(`/jobs/save/${jobId}`);
      toast.success('Job removed from saved list');
      fetchSavedJobs();
    } catch (error) {
      toast.error('Failed to unsave job');
    }
  };

  const isJobSaved = (jobId) => {
    return savedJobs.some(job => job.jobId === jobId);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Recently';
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString();
  };

  const getMatchScoreColor = (score) => {
    if (score >= 70) return 'text-green-600 bg-green-50';
    if (score >= 50) return 'text-yellow-600 bg-yellow-50';
    return 'text-orange-600 bg-orange-50';
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">Job Recommendations</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-4">Find roles that match your resume & skills.</p>
        {studentData && (
          <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
            <span className="text-lg">Hi, {studentData.personalInfo?.firstName || 'Student'} 👋</span>
            {studentData.academicInfo?.department && (
              <span className="text-sm text-gray-500 dark:text-gray-400">
                • {getDepartmentName(studentData.academicInfo.department)}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Resume Upload & Analysis Card */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
          Upload / Update Resume (PDF/DOCX)
        </h2>
        
        {loadingAnalysis ? (
          <div className="flex items-center justify-center py-8">
            <FaSpinner className="animate-spin text-primary-600 text-2xl" />
          </div>
        ) : resumeAnalysis ? (
          <div className="space-y-4">
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <FaCheckCircle className="text-green-600" />
                <span className="font-semibold text-green-800 dark:text-green-300">Resume Analyzed</span>
              </div>
              <div className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
                <p><strong>File:</strong> {resumeAnalysis.fileName} ({(resumeAnalysis.fileSize / 1024).toFixed(1)} KB)</p>
                <p><strong>Last Updated:</strong> {new Date(resumeAnalysis.uploadedAt).toLocaleString()}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">Extracted Skills:</p>
                <div className="flex flex-wrap gap-2">
                  {resumeAnalysis.topSkills?.slice(0, 10).map((skill, index) => (
                    <span key={index} className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded text-xs">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">Analysis Summary:</p>
                <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
                  <li><strong>Experience Level:</strong> {resumeAnalysis.experienceLevel || 'Fresher'}</li>
                  <li><strong>Preferred Roles:</strong> {resumeAnalysis.preferredRoles?.join(', ') || 'Not specified'}</li>
                  <li><strong>Location:</strong> {resumeAnalysis.location || 'Not specified'}</li>
                  {resumeAnalysis.degree && <li><strong>Degree:</strong> {resumeAnalysis.degree}</li>}
                </ul>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-4">
            <p className="text-yellow-800 dark:text-yellow-300">
              Upload your resume to get personalized job suggestions.
            </p>
          </div>
        )}

        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Select Resume File
          </label>
          <div className="flex gap-4">
            <input
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-500 dark:text-gray-400
                file:mr-4 file:py-2 file:px-4
                file:rounded-full file:border-0
                file:text-sm file:font-semibold
                file:bg-primary-50 file:text-primary-700
                hover:file:bg-primary-100
                dark:file:bg-primary-900 dark:file:text-primary-300"
            />
            <button
              onClick={handleUpload}
              disabled={!file || uploading}
              className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {uploading ? (
                <>
                  <FaSpinner className="animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <FaUpload />
                  Upload & Analyze
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <div className="flex">
            <button
              onClick={() => setActiveTab('recommendations')}
              className={`px-6 py-3 font-medium text-sm ${
                activeTab === 'recommendations'
                  ? 'border-b-2 border-primary-600 text-primary-600'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              Job Recommendations
            </button>
            <button
              onClick={() => setActiveTab('saved')}
              className={`px-6 py-3 font-medium text-sm ${
                activeTab === 'saved'
                  ? 'border-b-2 border-primary-600 text-primary-600'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              Saved Jobs ({savedJobs.length})
            </button>
          </div>
        </div>

        <div className="p-6">
          {activeTab === 'recommendations' ? (
            <>
              {/* Job Search Controls */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Preferred Role / Keyword
                    </label>
                    <input
                      type="text"
                      value={filters.keywords}
                      onChange={(e) => setFilters({ ...filters, keywords: e.target.value })}
                      placeholder="e.g., Software Engineer"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-800 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Location
                    </label>
                    <input
                      type="text"
                      value={filters.location}
                      onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                      placeholder="e.g., Remote, Bangalore"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-800 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Experience Level
                    </label>
                    <select
                      value={filters.experienceLevel}
                      onChange={(e) => setFilters({ ...filters, experienceLevel: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-800 dark:text-white"
                    >
                      <option value="">All Levels</option>
                      <option value="Fresher">Fresher</option>
                      <option value="0-1">0-1 years</option>
                      <option value="1-3">1-3 years</option>
                      <option value="3+">3+ years</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Job Type
                    </label>
                    <select
                      value={filters.jobType}
                      onChange={(e) => setFilters({ ...filters, jobType: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-800 dark:text-white"
                    >
                      <option value="">All Types</option>
                      <option value="Full-time">Full-time</option>
                      <option value="Internship">Internship</option>
                      <option value="Remote">Remote</option>
                      <option value="Hybrid">Hybrid</option>
                    </select>
                  </div>
                </div>
                <button
                  onClick={fetchJobs}
                  disabled={loadingJobs || !resumeAnalysis}
                  className="mt-4 px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {loadingJobs ? (
                    <>
                      <FaSpinner className="animate-spin" />
                      Searching...
                    </>
                  ) : (
                    <>
                      <FaSearch />
                      Find Matching Jobs
                    </>
                  )}
                </button>
              </div>

              {/* Job List */}
              {loadingJobs ? (
                <div className="flex items-center justify-center py-12">
                  <FaSpinner className="animate-spin text-primary-600 text-3xl" />
                </div>
              ) : jobs.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-600 dark:text-gray-400">
                    {!resumeAnalysis 
                      ? 'Upload your resume to get personalized job suggestions.'
                      : 'No jobs found for your profile. Try changing filters.'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {jobs.map((job) => (
                    <div
                      key={job.jobId}
                      className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-6 hover:shadow-lg transition-shadow"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">
                            {job.title}
                          </h3>
                          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-3">
                            <span className="font-medium">{job.company}</span>
                            <span>•</span>
                            <span>{job.location}</span>
                            <span>•</span>
                            <span>{job.type}</span>
                            {job.salaryRange && (
                              <>
                                <span>•</span>
                                <span className="text-green-600 dark:text-green-400">{job.salaryRange}</span>
                              </>
                            )}
                          </div>
                          <p className="text-gray-700 dark:text-gray-300 mb-3 line-clamp-2">
                            {job.description}
                          </p>
                          {job.skills && job.skills.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-3">
                              {job.skills.slice(0, 8).map((skill, index) => {
                                const isResumeSkill = resumeAnalysis?.topSkills?.some(
                                  rs => rs.toLowerCase().includes(skill.toLowerCase()) || 
                                        skill.toLowerCase().includes(rs.toLowerCase())
                                );
                                return (
                                  <span
                                    key={index}
                                    className={`px-2 py-1 rounded text-xs ${
                                      isResumeSkill
                                        ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 font-semibold'
                                        : 'bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300'
                                    }`}
                                  >
                                    {skill}
                                  </span>
                                );
                              })}
                            </div>
                          )}
                          <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                            <span>Posted {formatDate(job.postedAt)}</span>
                            <span>•</span>
                            <span>{job.source}</span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2 ml-4">
                          <div className={`px-3 py-1 rounded-full text-sm font-semibold ${getMatchScoreColor(job.matchScore)}`}>
                            {job.matchScore}% Match
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => isJobSaved(job.jobId) ? handleUnsaveJob(job.jobId) : handleSaveJob(job)}
                              className="p-2 text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400"
                              title={isJobSaved(job.jobId) ? 'Unsave job' : 'Save job'}
                            >
                              {isJobSaved(job.jobId) ? (
                                <FaBookmarkSolid className="text-primary-600" />
                              ) : (
                                <FaBookmark />
                              )}
                            </button>
                            <a
                              href={job.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400"
                              title="View job details"
                            >
                              <FaExternalLinkAlt />
                            </a>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <>
              {/* Saved Jobs */}
              {loadingSaved ? (
                <div className="flex items-center justify-center py-12">
                  <FaSpinner className="animate-spin text-primary-600 text-3xl" />
                </div>
              ) : savedJobs.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-600 dark:text-gray-400">No saved jobs yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {savedJobs.map((job) => (
                    <div
                      key={job.jobId}
                      className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-6 hover:shadow-lg transition-shadow"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">
                            {job.title}
                          </h3>
                          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                            <span className="font-medium">{job.company}</span>
                            <span>•</span>
                            <span>{job.location}</span>
                            <span>•</span>
                            <span>{job.type}</span>
                            <span>•</span>
                            <span className="text-xs text-gray-500">Saved {formatDate(job.savedAt)}</span>
                          </div>
                        </div>
                        <div className="flex gap-2 ml-4">
                          <button
                            onClick={() => handleUnsaveJob(job.jobId)}
                            className="p-2 text-primary-600 hover:text-red-600"
                            title="Remove from saved"
                          >
                            <FaBookmarkSolid />
                          </button>
                          <a
                            href={job.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400"
                            title="View job details"
                          >
                            <FaExternalLinkAlt />
                          </a>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default JobRecommendations;

