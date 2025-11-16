import React, { useState, useEffect } from 'react';
import { FaPlus, FaEdit, FaTrash, FaFile, FaDownload } from 'react-icons/fa';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const Posts = () => {
  const [posts, setPosts] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    type: 'announcement',
    category: 'other',
    requiresVerification: false,
    isActive: true,
    tags: '',
    expiryDate: ''
  });
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const response = await api.get('/admin/posts');
      setPosts(response.data);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('title', formData.title);
      formDataToSend.append('content', formData.content);
      formDataToSend.append('type', formData.type);
      formDataToSend.append('category', formData.category);
      // Convert boolean to string for FormData
      formDataToSend.append('requiresVerification', formData.requiresVerification ? 'true' : 'false');
      formDataToSend.append('isActive', formData.isActive ? 'true' : 'false');
      formDataToSend.append('tags', formData.tags || '');
      if (formData.expiryDate) {
        formDataToSend.append('expiryDate', formData.expiryDate);
      }

      // Append files to FormData
      if (files && files.length > 0) {
        console.log('Appending files to FormData:', files.length);
        files.forEach((file, index) => {
          console.log(`Appending file ${index + 1}:`, file.name, file.size, file.type);
          formDataToSend.append('attachments', file);
        });
      } else {
        console.log('No files to append');
      }
      
      // Log FormData contents (for debugging)
      console.log('FormData entries:');
      for (let pair of formDataToSend.entries()) {
        if (pair[1] instanceof File) {
          console.log(pair[0] + ':', pair[1].name, pair[1].size, pair[1].type);
        } else {
          console.log(pair[0] + ':', pair[1]);
        }
      }

      if (editingPost) {
        const response = await api.put(`/admin/posts/${editingPost._id}`, formDataToSend, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        toast.success('Post updated successfully');
      } else {
        console.log('Sending POST request to /admin/posts');
        console.log('FormData contents:', {
          title: formData.title,
          type: formData.type,
          hasFiles: files.length > 0
        });
        
        const response = await api.post('/admin/posts', formDataToSend, {
          headers: { 
            'Content-Type': 'multipart/form-data'
          }
        });
        
        console.log('Post created successfully:', response.data);
        toast.success('Post created successfully');
      }

      setShowAddForm(false);
      setEditingPost(null);
      setFormData({
        title: '',
        content: '',
        type: 'announcement',
        category: 'other',
        requiresVerification: false,
        isActive: true,
        tags: '',
        expiryDate: ''
      });
      setFiles([]);
      fetchPosts();
    } catch (error) {
      console.error('Error saving post:', error);
      console.error('Error response:', error.response?.data);
      const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message || 'Failed to save post';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (postId) => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      try {
        await api.delete(`/admin/posts/${postId}`);
        toast.success('Post deleted successfully');
        fetchPosts();
      } catch (error) {
        toast.error('Failed to delete post');
      }
    }
  };

  const handleDownloadFile = async (filePath, fileName) => {
    try {
      const apiUrl = process.env.REACT_APP_API_URL?.replace('/api', '') || 'https://placementhub-2.onrender.com';
      const token = localStorage.getItem('token');
      
      console.log('Downloading file:', filePath);
      
      // Use fetch to download with authentication
      const response = await fetch(`${apiUrl}/${filePath}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Download failed: ${response.status} ${response.statusText}`);
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName || 'attachment';
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('File downloaded successfully');
    } catch (error) {
      console.error('Error downloading file:', error);
      console.error('File path:', filePath);
      toast.error(`Failed to download file: ${error.message}`);
      // Fallback to opening in new tab
      const apiUrl = process.env.REACT_APP_API_URL?.replace('/api', '') || 'https://placementhub-2.onrender.com';
      window.open(`${apiUrl}/${filePath}`, '_blank');
    }
  };

  const handleEdit = (post) => {
    setEditingPost(post);
    setFormData({
      title: post.title,
      content: post.content,
      type: post.type,
      category: post.category,
      requiresVerification: post.requiresVerification,
      isActive: post.isActive,
      tags: post.tags?.join(', ') || '',
      expiryDate: post.expiryDate ? new Date(post.expiryDate).toISOString().split('T')[0] : ''
    });
    setShowAddForm(true);
  };

  if (loading && posts.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Posts & Announcements</h2>
          <button
            onClick={() => {
              setShowAddForm(!showAddForm);
              setEditingPost(null);
              setFormData({
                title: '',
                content: '',
                type: 'announcement',
                category: 'other',
                requiresVerification: false,
                isActive: true,
                tags: '',
                expiryDate: ''
              });
              setFiles([]);
            }}
            className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            <FaPlus />
            <span>Create Post</span>
          </button>
        </div>

        {showAddForm && (
          <form onSubmit={handleSubmit} className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Title
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-600 dark:text-white"
                  required
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Type
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-600 dark:text-white"
                  >
                    <option value="announcement">Announcement</option>
                    <option value="drive">Placement Drive</option>
                    <option value="learning_plan">Learning Plan</option>
                    <option value="general">General</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-600 dark:text-white"
                  >
                    <option value="other">Other</option>
                    <option value="placement_drive">Placement Drive</option>
                    <option value="internship_opportunity">Internship Opportunity</option>
                    <option value="learning_resource">Learning Resource</option>
                    <option value="workshop">Workshop</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Content
                </label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-600 dark:text-white"
                  rows="6"
                  required
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.requiresVerification}
                      onChange={(e) => setFormData({ ...formData, requiresVerification: e.target.checked })}
                      className="rounded"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      Requires Verification (Only verified students can view)
                    </span>
                  </label>
                </div>
                <div>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="rounded"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Active</span>
                  </label>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Tags (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={formData.tags}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-600 dark:text-white"
                    placeholder="placement, internship, workshop"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Expiry Date (optional)
                  </label>
                  <input
                    type="date"
                    value={formData.expiryDate}
                    onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-600 dark:text-white"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Attachments (Max 5 files, 10MB each)
                </label>
                <input
                  type="file"
                  multiple
                  accept="*/*"
                  onChange={(e) => {
                    const selectedFiles = Array.from(e.target.files || []);
                    console.log('Files selected:', selectedFiles.length);
                    selectedFiles.forEach((file, index) => {
                      console.log(`File ${index + 1}:`, {
                        name: file.name,
                        size: file.size,
                        type: file.type
                      });
                    });
                    setFiles(selectedFiles);
                  }}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-600 dark:text-white"
                />
                {files.length > 0 && (
                  <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                    <p>Selected files ({files.length}):</p>
                    <ul className="list-disc list-inside mt-1">
                      {files.map((file, index) => (
                        <li key={index}>{file.name} ({(file.size / 1024).toFixed(2)} KB)</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
            <div className="mt-4 flex space-x-2">
              <button
                type="submit"
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                {editingPost ? 'Update Post' : 'Create Post'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false);
                  setEditingPost(null);
                }}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        <div className="space-y-4">
          {posts.map((post) => (
            <div key={post._id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h3 className="text-xl font-semibold text-gray-800 dark:text-white">{post.title}</h3>
                    <span className={`px-2 py-1 rounded text-xs ${
                      post.type === 'drive' ? 'bg-blue-100 text-blue-800' :
                      post.type === 'learning_plan' ? 'bg-green-100 text-green-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {post.type}
                    </span>
                    {post.requiresVerification && (
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs">
                        Verified Only
                      </span>
                    )}
                    {!post.isActive && (
                      <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs">
                        Inactive
                      </span>
                    )}
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 whitespace-pre-wrap">{post.content}</p>
                  {post.tags && post.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {post.tags.map((tag, i) => (
                        <span key={i} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  {post.attachments && post.attachments.length > 0 && (
                    <div className="mt-3">
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Attachments:</p>
                      <div className="space-y-2">
                        {post.attachments.map((attachment, i) => (
                          <button
                            key={i}
                            onClick={() => handleDownloadFile(attachment.file, attachment.name)}
                            className="flex items-center space-x-2 px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200 dark:hover:bg-gray-600 text-sm w-full text-left"
                          >
                            <FaFile />
                            <span className="flex-1">{attachment.name}</span>
                            <FaDownload />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  <p className="text-sm text-gray-500 mt-2">
                    Created: {new Date(post.createdAt).toLocaleString()}
                  </p>
                </div>
                <div className="flex space-x-2 ml-4">
                  <button
                    onClick={() => handleEdit(post)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                    title="Edit"
                  >
                    <FaEdit />
                  </button>
                  <button
                    onClick={() => handleDelete(post._id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded"
                    title="Delete"
                  >
                    <FaTrash />
                  </button>
                </div>
              </div>
            </div>
          ))}
          {posts.length === 0 && (
            <p className="text-gray-500 text-center py-8">No posts created yet</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Posts;

