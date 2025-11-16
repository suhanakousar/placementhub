import React, { useState } from 'react';
import { FaPlus, FaTrash, FaEdit, FaDownload, FaCalendar, FaExternalLinkAlt, FaCertificate } from 'react-icons/fa';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const Certifications = ({ studentData, onUpdate }) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingCert, setEditingCert] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    issuer: '',
    issueDate: '',
    expiryDate: '',
    credentialId: '',
    credentialUrl: '',
    description: '',
    skills: ''
  });
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name);
      formDataToSend.append('issuer', formData.issuer || '');
      formDataToSend.append('issueDate', formData.issueDate || '');
      formDataToSend.append('expiryDate', formData.expiryDate || '');
      formDataToSend.append('credentialId', formData.credentialId || '');
      formDataToSend.append('credentialUrl', formData.credentialUrl || '');
      formDataToSend.append('description', formData.description || '');
      formDataToSend.append('skills', formData.skills || '');

      if (file) {
        formDataToSend.append('file', file);
      }

      if (editingCert) {
        await api.put(`/students/certifications/${editingCert._id}`, formDataToSend, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        toast.success('Certification updated successfully');
      } else {
        await api.post('/students/certifications', formDataToSend, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        toast.success('Certification added successfully');
      }

      setShowAddForm(false);
      setEditingCert(null);
      setFormData({
        name: '',
        issuer: '',
        issueDate: '',
        expiryDate: '',
        credentialId: '',
        credentialUrl: '',
        description: '',
        skills: ''
      });
      setFile(null);
      onUpdate();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save certification');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (certification) => {
    setEditingCert(certification);
    setFormData({
      name: certification.name || '',
      issuer: certification.issuer || '',
      issueDate: certification.issueDate ? new Date(certification.issueDate).toISOString().split('T')[0] : '',
      expiryDate: certification.expiryDate ? new Date(certification.expiryDate).toISOString().split('T')[0] : '',
      credentialId: certification.credentialId || '',
      credentialUrl: certification.credentialUrl || '',
      description: certification.description || '',
      skills: certification.skills ? certification.skills.join(', ') : ''
    });
    setFile(null);
    setShowAddForm(true);
  };

  const handleDelete = async (certificationId) => {
    try {
      await api.delete(`/students/certifications/${certificationId}`);
      toast.success('Certification deleted successfully');
      onUpdate();
    } catch (error) {
      toast.error('Failed to delete certification');
    }
  };

  const handleDownload = async (certificationId, certificationName) => {
    try {
      const response = await api.get(`/students/certifications/${certificationId}/download`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${certificationName}-certificate.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Certificate downloaded successfully');
    } catch (error) {
      toast.error('Failed to download certificate');
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Certifications</h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Upload and manage your professional certifications and credentials
            </p>
          </div>
          <button
            onClick={() => {
              setShowAddForm(!showAddForm);
              setEditingCert(null);
              setFormData({
                name: '',
                issuer: '',
                issueDate: '',
                expiryDate: '',
                credentialId: '',
                credentialUrl: '',
                description: '',
                skills: ''
              });
              setFile(null);
            }}
            className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            <FaPlus />
            <span>Add Certification</span>
          </button>
        </div>

        {showAddForm && (
          <form onSubmit={handleSubmit} className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Certification Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-600 dark:text-white"
                  placeholder="e.g., AWS Certified Solutions Architect"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Issuing Organization
                </label>
                <input
                  type="text"
                  value={formData.issuer}
                  onChange={(e) => setFormData({ ...formData, issuer: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-600 dark:text-white"
                  placeholder="e.g., Amazon Web Services"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Issue Date
                </label>
                <input
                  type="date"
                  value={formData.issueDate}
                  onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-600 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Expiry Date (if applicable)
                </label>
                <input
                  type="date"
                  value={formData.expiryDate}
                  onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-600 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Credential ID
                </label>
                <input
                  type="text"
                  value={formData.credentialId}
                  onChange={(e) => setFormData({ ...formData, credentialId: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-600 dark:text-white"
                  placeholder="e.g., AWS-1234567890"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Credential URL
                </label>
                <input
                  type="url"
                  value={formData.credentialUrl}
                  onChange={(e) => setFormData({ ...formData, credentialUrl: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-600 dark:text-white"
                  placeholder="https://www.credly.com/users/..."
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Skills/Technologies (comma-separated)
                </label>
                <input
                  type="text"
                  value={formData.skills}
                  onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-600 dark:text-white"
                  placeholder="AWS, Cloud Computing, Solutions Architecture"
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
                  placeholder="Brief description about the certification..."
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Certificate File (PDF, Image)
                </label>
                <input
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg"
                  onChange={(e) => setFile(e.target.files[0])}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-600 dark:text-white"
                />
                {file && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Selected: {file.name} ({(file.size / 1024).toFixed(2)} KB)
                  </p>
                )}
                {editingCert && editingCert.file && !file && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Current file: {editingCert.file.split('/').pop()}
                  </p>
                )}
              </div>
            </div>
            <div className="mt-4 flex space-x-2">
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
              >
                {loading ? 'Saving...' : editingCert ? 'Update Certification' : 'Add Certification'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false);
                  setEditingCert(null);
                  setFormData({
                    name: '',
                    issuer: '',
                    issueDate: '',
                    expiryDate: '',
                    credentialId: '',
                    credentialUrl: '',
                    description: '',
                    skills: ''
                  });
                  setFile(null);
                }}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        <div className="space-y-4">
          {studentData?.certifications?.map((certification) => {
            const isExpired = certification.expiryDate && new Date(certification.expiryDate) < new Date();
            const isExpiringSoon = certification.expiryDate && 
              new Date(certification.expiryDate) > new Date() && 
              new Date(certification.expiryDate) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

            return (
              <div
                key={certification._id}
                className={`border rounded-lg p-4 ${
                  isExpired
                    ? 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20'
                    : isExpiringSoon
                    ? 'border-yellow-300 dark:border-yellow-700 bg-yellow-50 dark:bg-yellow-900/20'
                    : 'border-gray-200 dark:border-gray-700'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <FaCertificate className="text-primary-600 text-2xl" />
                      <div>
                        <h3 className="text-xl font-semibold text-gray-800 dark:text-white">
                          {certification.name}
                        </h3>
                        {certification.issuer && (
                          <p className="text-gray-600 dark:text-gray-400">{certification.issuer}</p>
                        )}
                      </div>
                      {isExpired && (
                        <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs dark:bg-red-900/20 dark:text-red-400">
                          Expired
                        </span>
                      )}
                      {isExpiringSoon && !isExpired && (
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs dark:bg-yellow-900/20 dark:text-yellow-400">
                          Expiring Soon
                        </span>
                      )}
                    </div>

                    {certification.description && (
                      <p className="text-gray-600 dark:text-gray-400 mt-2">{certification.description}</p>
                    )}

                    <div className="flex flex-wrap gap-4 mt-3 text-sm text-gray-600 dark:text-gray-400">
                      {certification.issueDate && (
                        <div className="flex items-center space-x-1">
                          <FaCalendar />
                          <span>Issued: {new Date(certification.issueDate).toLocaleDateString()}</span>
                        </div>
                      )}
                      {certification.expiryDate && (
                        <div className="flex items-center space-x-1">
                          <FaCalendar />
                          <span>
                            Expires: {new Date(certification.expiryDate).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                      {certification.credentialId && (
                        <div>
                          <span className="font-medium">ID:</span> {certification.credentialId}
                        </div>
                      )}
                    </div>

                    {certification.skills && certification.skills.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {certification.skills.map((skill, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm dark:bg-blue-900/20 dark:text-blue-400"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="flex space-x-4 mt-4">
                      {certification.credentialUrl && (
                        <a
                          href={certification.credentialUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center space-x-1 text-primary-600 hover:text-primary-700 text-sm"
                        >
                          <FaExternalLinkAlt />
                          <span>View Credential</span>
                        </a>
                      )}
                      {certification.file && (
                        <button
                          onClick={() => handleDownload(certification._id, certification.name)}
                          className="flex items-center space-x-1 text-primary-600 hover:text-primary-700 text-sm"
                        >
                          <FaDownload />
                          <span>Download Certificate</span>
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="flex space-x-2 ml-4">
                    <button
                      onClick={() => handleEdit(certification)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded dark:hover:bg-blue-900/20"
                      title="Edit"
                    >
                      <FaEdit />
                    </button>
                    <button
                      onClick={() => handleDelete(certification._id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded dark:hover:bg-red-900/20"
                      title="Delete"
                    >
                      <FaTrash />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
          {(!studentData?.certifications || studentData.certifications.length === 0) && (
            <div className="text-center py-12">
              <FaCertificate className="text-6xl text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 text-lg mb-2">No certifications added yet</p>
              <p className="text-gray-400 text-sm">
                Add your professional certifications to showcase your skills and expertise
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Certifications;

