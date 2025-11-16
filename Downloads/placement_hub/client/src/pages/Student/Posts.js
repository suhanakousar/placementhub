import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaLock, FaFile, FaDownload, FaCalendar, FaTag } from 'react-icons/fa';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const Posts = () => {
  const [posts, setPosts] = useState([]);
  const [selectedPost, setSelectedPost] = useState(null);
  const [isVerified, setIsVerified] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const response = await api.get('/posts');
      setPosts(response.data.posts || []);
      setIsVerified(response.data.isVerified || false);
    } catch (error) {
      console.error('Error fetching posts:', error);
      toast.error('Failed to load posts');
    } finally {
      setLoading(false);
    }
  };

  const handleViewPost = async (postId) => {
    try {
      const response = await api.get(`/posts/${postId}`);
      setSelectedPost(response.data);
    } catch (error) {
      if (error.response?.status === 403) {
        toast.error('You need to be verified to view this post');
      } else {
        toast.error('Failed to load post');
      }
    }
  };

  const handleDownloadFile = async (filePath, fileName) => {
    try {
      const apiUrl = process.env.REACT_APP_API_URL?.replace('/api', '') || 'https://placementhub-2.onrender.com';
      const token = localStorage.getItem('token');
      
      // Use fetch to download with authentication
      const response = await fetch(`${apiUrl}/${filePath}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Download failed');
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
    } catch (error) {
      console.error('Error downloading file:', error);
      // Fallback to opening in new tab
      const apiUrl = process.env.REACT_APP_API_URL?.replace('/api', '') || 'https://placementhub-2.onrender.com';
      window.open(`${apiUrl}/${filePath}`, '_blank');
    }
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
      {!isVerified && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <FaLock className="text-yellow-600" />
            <p className="text-yellow-800 dark:text-yellow-300">
              <strong>Verification Required:</strong> Some posts are only visible to verified students. 
              Please complete your profile and wait for verification to access all placement drives and opportunities.
            </p>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">Posts & Announcements</h2>

        <div className="space-y-4">
          {posts.map((post) => {
            const canView = !post.requiresVerification || isVerified;
            
            return (
              <div
                key={post._id}
                className={`border rounded-lg p-4 ${
                  canView
                    ? 'border-gray-200 dark:border-gray-700 hover:shadow-lg transition'
                    : 'border-yellow-300 dark:border-yellow-700 bg-yellow-50 dark:bg-yellow-900/20'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="text-xl font-semibold text-gray-800 dark:text-white">{post.title}</h3>
                      <span className={`px-2 py-1 rounded text-xs ${
                        post.type === 'drive' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400' :
                        post.type === 'learning_plan' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' :
                        'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                      }`}>
                        {post.type === 'drive' ? 'Placement Drive' :
                         post.type === 'learning_plan' ? 'Learning Plan' :
                         'Announcement'}
                      </span>
                      {post.requiresVerification && (
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs dark:bg-yellow-900/20 dark:text-yellow-400 flex items-center">
                          <FaLock className="mr-1" />
                          Verified Only
                        </span>
                      )}
                    </div>
                    {canView ? (
                      <>
                        <p className="text-gray-600 dark:text-gray-400 whitespace-pre-wrap mb-3">
                          {post.content}
                        </p>
                        {post.tags && post.tags.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-3">
                            {post.tags.map((tag, i) => (
                              <span key={i} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs dark:bg-blue-900/20 dark:text-blue-400 flex items-center">
                                <FaTag className="mr-1" />
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
                                  className="flex items-center space-x-2 px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200 dark:hover:bg-gray-600 text-sm"
                                >
                                  <FaFile />
                                  <span>{attachment.name}</span>
                                  <FaDownload className="ml-auto" />
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                        <p className="text-sm text-gray-500 mt-3">
                          <FaCalendar className="inline mr-1" />
                          Posted: {new Date(post.createdAt).toLocaleString()}
                        </p>
                      </>
                    ) : (
                      <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded">
                        <p className="text-yellow-800 dark:text-yellow-300">
                          <FaLock className="inline mr-2" />
                          This content is only available to verified students. Please complete your profile verification to access this post.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          {posts.length === 0 && (
            <p className="text-gray-500 text-center py-8">No posts available</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Posts;

