import React, { useState, useCallback } from 'react';
import { FaUpload, FaFilePdf, FaCheckCircle, FaTimesCircle, FaDownload, FaTrash } from 'react-icons/fa';
import { useDropzone } from 'react-dropzone';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const Resumes = ({ studentData, onUpdate }) => {
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [uploadData, setUploadData] = useState({
    name: '',
    tags: ''
  });
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles && acceptedFiles.length > 0) {
      const selectedFile = acceptedFiles[0];
      if (selectedFile.type !== 'application/pdf') {
        toast.error('Please upload a PDF file');
        return;
      }
      setFile(selectedFile);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf']
    },
    multiple: false
  });

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type !== 'application/pdf') {
      toast.error('Please upload a PDF file');
      return;
    }
    setFile(selectedFile);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      toast.error('Please select a file');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('resume', file);
      formData.append('name', uploadData.name);
      formData.append('tags', uploadData.tags);

      await api.post('/students/resumes', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      toast.success('Resume uploaded successfully');
      setShowUploadForm(false);
      setUploadData({ name: '', tags: '' });
      setFile(null);
      onUpdate();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to upload resume');
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (resumeId) => {
    try {
      if (!resumeId) {
        toast.error('Resume ID not found');
        return;
      }
      const response = await api.get(`/students/resumes/${resumeId}`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      const resume = studentData?.resumes?.find(r => r._id === resumeId);
      const filename = resume ? `${resume.name}.pdf` : `resume_${resumeId}.pdf`;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Resume downloaded successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to download resume');
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Resume Manager</h2>
        <button
          onClick={() => setShowUploadForm(!showUploadForm)}
          className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          <FaUpload />
          <span>Upload Resume</span>
        </button>
      </div>

      {showUploadForm && (
        <form onSubmit={handleSubmit} className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Resume Name
              </label>
              <input
                type="text"
                value={uploadData.name}
                onChange={(e) => setUploadData({ ...uploadData, name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-600 dark:text-white"
                placeholder="e.g., General Resume, Tech-focused Resume"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tags (comma-separated)
              </label>
              <input
                type="text"
                value={uploadData.tags}
                onChange={(e) => setUploadData({ ...uploadData, tags: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-600 dark:text-white"
                placeholder="e.g., General, Tech, Research"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Resume File (PDF)
              </label>
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition ${
                  isDragActive
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                    : 'border-gray-300 dark:border-gray-600 hover:border-primary-400'
                }`}
              >
                <input {...getInputProps()} onChange={handleFileChange} />
                <FaUpload className="mx-auto text-4xl text-gray-400 mb-4" />
                {isDragActive ? (
                  <p className="text-primary-600">Drop the PDF file here...</p>
                ) : (
                  <div>
                    <p className="text-gray-600 dark:text-gray-400 mb-2">
                      Drag and drop a PDF file here, or click to select
                    </p>
                    <p className="text-sm text-gray-500">Only PDF files are accepted</p>
                  </div>
                )}
                {file && (
                  <p className="mt-4 text-sm text-primary-600 font-medium">
                    Selected: {file.name}
                  </p>
                )}
              </div>
            </div>
          </div>
          <div className="mt-4 flex space-x-2">
            <button
              type="submit"
              disabled={uploading}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
            >
              {uploading ? 'Uploading...' : 'Upload Resume'}
            </button>
            <button
              type="button"
              onClick={() => setShowUploadForm(false)}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {studentData?.resumes?.map((resume, index) => (
          <div key={resume._id || index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-lg transition">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3 flex-1">
                <FaFilePdf className="text-red-500 text-2xl" />
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-800 dark:text-white">{resume.name}</h3>
                  <p className="text-sm text-gray-500">
                    Uploaded: {new Date(resume.uploadedAt).toLocaleDateString()}
                  </p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {resume.tags?.map((tag, i) => (
                      <span key={i} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {resume.verified ? (
                  <FaCheckCircle className="text-green-500" title="Verified" />
                ) : (
                  <FaTimesCircle className="text-yellow-500" title="Pending Verification" />
                )}
              </div>
            </div>
            {resume.feedback && (
              <div className="mt-3 p-2 bg-gray-50 dark:bg-gray-700 rounded">
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  <strong>Feedback:</strong> {resume.feedback}
                </p>
              </div>
            )}
            {resume.score && (
              <div className="mt-2">
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  <strong>Score:</strong> {resume.score}/100
                </p>
              </div>
            )}
            <div className="mt-4 flex space-x-2">
              {resume._id && (
                <button
                  onClick={() => handleDownload(resume._id)}
                  className="flex items-center space-x-1 px-3 py-1 bg-primary-600 text-white rounded hover:bg-primary-700 text-sm"
                  title="Download Resume"
                >
                  <FaDownload />
                  <span>Download</span>
                </button>
              )}
            </div>
          </div>
        ))}
        {(!studentData?.resumes || studentData.resumes.length === 0) && (
          <p className="text-gray-500 text-center py-8 col-span-full">No resumes uploaded yet</p>
        )}
      </div>
    </div>
  );
};

export default Resumes;

