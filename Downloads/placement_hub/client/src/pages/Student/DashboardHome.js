import React, { useState, useEffect } from 'react';
import { FaProjectDiagram, FaBriefcase, FaTrophy, FaCheckCircle, FaUpload, FaLock, FaBell, FaBullhorn, FaCalendar, FaCertificate, FaFileAlt, FaAward, FaUser } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import api from '../../utils/api';
import { getDepartmentName } from '../../utils/departmentNames';
import LeaderboardTable from '../../components/Leaderboard/LeaderboardTable';

const DashboardHome = ({ studentData }) => {
  const getProfilePhotoUrl = () => {
    if (studentData?.personalInfo?.profilePhoto) {
      // If it's already a full URL, return it
      if (studentData.personalInfo.profilePhoto.startsWith('http')) {
        return studentData.personalInfo.profilePhoto;
      }
      // Otherwise, construct the URL
      const baseUrl = process.env.REACT_APP_API_URL?.replace('/api', '') || 'https://placementhub-2.onrender.com';
      return `${baseUrl}/${studentData.personalInfo.profilePhoto}`;
    }
    return null;
  };
  const [analytics, setAnalytics] = useState(null);
  const [recentNotifications, setRecentNotifications] = useState([]);
  const [recentDrives, setRecentDrives] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (studentData) {
      fetchAllData();
    }
  }, [studentData]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      // Fetch analytics
      const analyticsResponse = await api.get('/analytics/student/profile');
      setAnalytics(analyticsResponse.data);
      
      // Fetch recent notifications
      try {
        const notificationsResponse = await api.get('/notifications');
        const notifications = notificationsResponse.data || [];
        // Get only the 5 most recent
        setRecentNotifications(notifications.slice(0, 5));
      } catch (error) {
        console.error('Error fetching notifications:', error);
      }

      // Fetch recent placement drives
      try {
        const drivesResponse = await api.get('/drives');
        const drives = drivesResponse.data || [];
        // Get active drives (not expired)
        const now = new Date();
        const activeDrives = drives
          .filter(drive => !drive.deadline || new Date(drive.deadline) > now)
          .slice(0, 5);
        setRecentDrives(activeDrives);
      } catch (error) {
        console.error('Error fetching drives:', error);
      }

      // Generate recent activities from student data
      generateRecentActivities(analyticsResponse.data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      generateRecentActivities(null);
    } finally {
      setLoading(false);
    }
  };

  const generateRecentActivities = (analyticsData) => {
    const activities = [];
    
    // Get recent projects
    if (studentData?.projects && studentData.projects.length > 0) {
      const recentProjects = studentData.projects
        .slice()
        .sort((a, b) => new Date(b.date || b.createdAt || 0) - new Date(a.date || a.createdAt || 0))
        .slice(0, 3)
        .map(project => ({
          type: 'project',
          title: project.name || project.title,
          description: project.description || 'Project added',
          date: project.date || project.createdAt,
          icon: FaProjectDiagram,
          color: 'text-blue-600',
          bgColor: 'bg-blue-50 dark:bg-blue-900/20'
        }));
      activities.push(...recentProjects);
    }

    // Get recent internships
    if (studentData?.internships && studentData.internships.length > 0) {
      const recentInternships = studentData.internships
        .slice()
        .sort((a, b) => new Date(b.startDate || b.createdAt || 0) - new Date(a.startDate || a.createdAt || 0))
        .slice(0, 2)
        .map(internship => ({
          type: 'internship',
          title: internship.company || internship.title,
          description: internship.role || 'Internship added',
          date: internship.startDate || internship.createdAt,
          icon: FaBriefcase,
          color: 'text-green-600',
          bgColor: 'bg-green-50 dark:bg-green-900/20'
        }));
      activities.push(...recentInternships);
    }

    // Get recent certifications
    if (studentData?.certifications && studentData.certifications.length > 0) {
      const recentCerts = studentData.certifications
        .slice()
        .sort((a, b) => new Date(b.issueDate || b.uploadedAt || 0) - new Date(a.issueDate || a.uploadedAt || 0))
        .slice(0, 2)
        .map(cert => ({
          type: 'certification',
          title: cert.name,
          description: cert.issuer || 'Certification added',
          date: cert.issueDate || cert.uploadedAt,
          icon: FaCertificate,
          color: 'text-purple-600',
          bgColor: 'bg-purple-50 dark:bg-purple-900/20'
        }));
      activities.push(...recentCerts);
    }

    // Get recent hackathons
    if (studentData?.hackathons && studentData.hackathons.length > 0) {
      const recentHackathons = studentData.hackathons
        .slice()
        .sort((a, b) => new Date(b.date || b.createdAt || 0) - new Date(a.date || a.createdAt || 0))
        .slice(0, 2)
        .map(hackathon => ({
          type: 'hackathon',
          title: hackathon.name,
          description: hackathon.platform || 'Hackathon participated',
          date: hackathon.date || hackathon.createdAt,
          icon: FaTrophy,
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-50 dark:bg-yellow-900/20'
        }));
      activities.push(...recentHackathons);
    }

    // Get recent resumes
    if (studentData?.resumes && studentData.resumes.length > 0) {
      const recentResumes = studentData.resumes
        .slice()
        .sort((a, b) => new Date(b.uploadedAt || 0) - new Date(a.uploadedAt || 0))
        .slice(0, 1)
        .map(resume => ({
          type: 'resume',
          title: resume.name || 'Resume',
          description: resume.verified ? 'Resume verified' : 'Resume uploaded',
          date: resume.uploadedAt,
          icon: FaFileAlt,
          color: 'text-indigo-600',
          bgColor: 'bg-indigo-50 dark:bg-indigo-900/20'
        }));
      activities.push(...recentResumes);
    }

    // Sort all activities by date and get most recent 5
    const sortedActivities = activities
      .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))
      .slice(0, 5);

    setRecentActivities(sortedActivities);
  };

  const calculatePlacementReadiness = () => {
    if (!analytics && !studentData) return 0;
    let score = 0;
    
    // Use analytics data if available, otherwise fall back to studentData
    const profileCompletion = analytics?.profileCompletion || studentData?.profileCompletion?.percentage || 0;
    const resumeVerified = analytics?.resumeVerified || studentData?.placementStatus?.resumeVerified || false;
    const projectsCount = analytics?.projectsCount || studentData?.projects?.length || 0;
    const internshipsCount = analytics?.internshipsCount || studentData?.internships?.length || 0;
    const hackathonsCount = analytics?.hackathonsCount || studentData?.hackathons?.length || 0;
    const verifiedSkillsCount = analytics?.verifiedSkillsCount || studentData?.skills?.filter(s => s.verified)?.length || 0;
    const cgpa = analytics?.cgpa || studentData?.academicInfo?.cgpa || 0;

    // Profile completion (30%)
    score += profileCompletion * 0.3;
    
    // Resume verified (20%)
    if (resumeVerified) score += 20;
    
    // Projects (20%)
    score += Math.min(20, projectsCount * 5);
    
    // Internships (15%)
    score += Math.min(15, internshipsCount * 7.5);
    
    // Hackathons (10%)
    score += Math.min(10, hackathonsCount * 5);
    
    // Skills verified (5%)
    score += Math.min(5, verifiedSkillsCount * 1);
    
    return Math.min(100, Math.round(score));
  };

  const readinessPercentage = calculatePlacementReadiness();

  const statsCards = [
    {
      title: 'Projects Completed',
      value: analytics?.projectsCount || studentData?.projects?.length || 0,
      icon: FaProjectDiagram,
      color: 'bg-blue-500'
    },
    {
      title: 'Internships',
      value: analytics?.internshipsCount || studentData?.internships?.length || 0,
      icon: FaBriefcase,
      color: 'bg-green-500'
    },
    {
      title: 'Hackathons',
      value: analytics?.hackathonsCount || studentData?.hackathons?.length || 0,
      icon: FaTrophy,
      color: 'bg-yellow-500'
    },
    {
      title: 'Skills Verified',
      value: analytics?.verifiedSkillsCount || studentData?.skills?.filter(s => s.verified)?.length || 0,
      icon: FaCheckCircle,
      color: 'bg-purple-500'
    }
  ];

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'];

  return (
    <div className="space-y-6">
      {/* Welcome Section with Profile Photo */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-center space-x-6">
          <div className="relative">
            {getProfilePhotoUrl() ? (
              <>
                <img
                  src={getProfilePhotoUrl()}
                  alt={`${studentData?.personalInfo?.firstName} ${studentData?.personalInfo?.lastName}`}
                  className="w-20 h-20 rounded-full object-cover border-4 border-primary-500"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
                <div className="w-20 h-20 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center border-4 border-primary-500 hidden">
                  <FaUser className="text-2xl text-gray-400" />
                </div>
              </>
            ) : (
              <div className="w-20 h-20 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center border-4 border-primary-500">
                <FaUser className="text-2xl text-gray-400" />
              </div>
            )}
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
              Welcome back, {studentData?.personalInfo?.firstName || 'Student'}!
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {getDepartmentName(studentData?.academicInfo?.department)} • Year {studentData?.academicInfo?.year || 'N/A'} • Roll No: {studentData?.academicInfo?.rollNumber || 'N/A'}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">Placement Readiness</h2>
        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <div className="flex justify-between mb-2">
              <span className="text-gray-700 dark:text-gray-300">Overall Readiness</span>
              <span className="text-primary-600 font-bold">{readinessPercentage}%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4">
              <div
                className="bg-primary-600 h-4 rounded-full transition-all duration-500"
                style={{ width: `${readinessPercentage}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <div key={index} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">{card.title}</p>
                  <p className="text-3xl font-bold text-gray-800 dark:text-white mt-2">{card.value}</p>
                </div>
                <div className={`${card.color} p-4 rounded-lg`}>
                  <Icon className="text-white text-2xl" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activities */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-800 dark:text-white flex items-center">
              <FaAward className="mr-2" />
              Recent Activities
            </h3>
            <Link to="/student/profile" className="text-primary-600 hover:text-primary-700 text-sm">
              View All
            </Link>
          </div>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
            </div>
          ) : recentActivities.length > 0 ? (
            <div className="space-y-3">
              {recentActivities.map((activity, index) => {
                const Icon = activity.icon;
                return (
                  <div
                    key={index}
                    className={`p-3 rounded-lg border ${activity.bgColor} border-gray-200 dark:border-gray-700`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className={`${activity.color} mt-1`}>
                        <Icon className="text-lg" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-800 dark:text-white text-sm">
                          {activity.title}
                        </p>
                        <p className="text-gray-600 dark:text-gray-400 text-xs mt-1">
                          {activity.description}
                        </p>
                        {activity.date && (
                          <p className="text-gray-500 dark:text-gray-500 text-xs mt-1 flex items-center">
                            <FaCalendar className="mr-1" />
                            {new Date(activity.date).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400 mb-2">No recent activities</p>
              <p className="text-gray-400 dark:text-gray-500 text-sm">
                Start adding projects, internships, or certifications to see your activities here
              </p>
            </div>
          )}
        </div>

        {/* Skills Distribution */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Skills Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={[
                  { name: 'Verified', value: analytics?.verifiedSkillsCount || studentData?.skills?.filter(s => s.verified)?.length || 0 },
                  { name: 'Unverified', value: (analytics?.skillsCount || studentData?.skills?.length || 0) - (analytics?.verifiedSkillsCount || studentData?.skills?.filter(s => s.verified)?.length || 0) }
                ]}
                cx="50%"
                cy="50%"
                labelLine={false}
                label
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {[0, 1].map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Notifications */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-800 dark:text-white flex items-center">
              <FaBell className="mr-2" />
              Recent Notifications
            </h3>
            <Link to="/student/notifications" className="text-primary-600 hover:text-primary-700 text-sm">
              View All
            </Link>
          </div>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
            </div>
          ) : recentNotifications.length > 0 ? (
            <div className="space-y-3">
              {recentNotifications.slice(0, 5).map((notification) => (
                <div
                  key={notification._id}
                  className={`p-3 rounded-lg border ${
                    notification.isRead
                      ? 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600'
                      : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-semibold text-gray-800 dark:text-white text-sm">
                        {notification.title}
                      </p>
                      <p className="text-gray-600 dark:text-gray-400 text-xs mt-1">
                        {notification.message}
                      </p>
                      <p className="text-gray-500 dark:text-gray-500 text-xs mt-1">
                        {new Date(notification.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    {!notification.isRead && (
                      <div className="w-2 h-2 bg-blue-600 rounded-full mt-1"></div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">No notifications yet</p>
          )}
        </div>

        {/* Recent Placement Drives */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-800 dark:text-white flex items-center">
              <FaBullhorn className="mr-2" />
              Recent Placement Drives
            </h3>
            <Link to="/student/posts" className="text-primary-600 hover:text-primary-700 text-sm">
              View All
            </Link>
          </div>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
            </div>
          ) : recentDrives.length > 0 ? (
            <div className="space-y-3">
              {recentDrives.slice(0, 5).map((drive) => (
                <div
                  key={drive._id}
                  className="p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-semibold text-gray-800 dark:text-white text-sm">
                        {drive.companyName} - {drive.role}
                      </p>
                      <p className="text-gray-600 dark:text-gray-400 text-xs mt-1">
                        {drive.description?.substring(0, 60)}...
                      </p>
                      {drive.deadline && (
                        <p className="text-gray-500 dark:text-gray-500 text-xs mt-1 flex items-center">
                          <FaCalendar className="mr-1" />
                          Deadline: {new Date(drive.deadline).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">No active placement drives</p>
          )}
        </div>
      </div>

      {!(analytics?.resumeVerified || studentData?.placementStatus?.resumeVerified) && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
          <div className="flex items-center space-x-3">
            <FaLock className="text-yellow-600 text-2xl" />
            <div>
              <h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-300">
                Verification Required
              </h3>
              <p className="text-yellow-700 dark:text-yellow-400 mt-1">
                Your profile is pending verification. Once verified, you'll be able to access all placement drives and opportunities.
              </p>
              <Link
                to="/student/resumes"
                className="inline-block mt-3 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 text-sm"
              >
                Upload Resume to Get Verified
              </Link>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Quick Upload</h3>
        <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
          <FaUpload className="text-4xl text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Drag and drop files here or click to upload
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500">
            Upload certificates, resumes, or achievement documents
          </p>
        </div>
      </div>

      {/* Leaderboard Table */}
      <div className="mt-6">
        <LeaderboardTable />
      </div>
    </div>
  );
};

export default DashboardHome;

