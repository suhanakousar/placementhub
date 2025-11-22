import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Header from '../../components/Layout/Header';
import AdminSidebar from '../../components/Layout/AdminSidebar';
import { useAuth } from '../../contexts/AuthContext';
import DashboardHome from './DashboardHome';
import Students from './Students';
import Drives from './Drives';
import Reports from './Reports';
import Verification from './Verification';
import Posts from './Posts';
import Notifications from './Notifications';
import MentorDashboard from './MentorDashboard';
import Tasks from './Tasks';
import Meetings from './Meetings';
import api from '../../utils/api';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await api.get('/admin/statistics');
      setStats(response.data || {});
    } catch (error) {
      console.error('Error fetching stats:', error);
      // Set default empty stats so dashboard still renders
      setStats({
        totalStudents: 0,
        verifiedResumes: 0,
        unverifiedResumes: 0,
        departmentWiseStudents: [],
        topStudents: [],
        upcomingDrives: []
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleMenu = () => {
    setIsMenuOpen(prev => !prev);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  // Don't block rendering on loading - let DashboardHome handle its own loading state
  // This ensures the sidebar and layout are always visible

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header 
        title="Admin Dashboard" 
        user={user} 
        onMenuToggle={toggleMenu}
        isMenuOpen={isMenuOpen}
      />
      <AdminSidebar isOpen={isMenuOpen} onClose={closeMenu} />
      <main className="lg:ml-64 lg:pt-16 pt-16 p-4 md:p-6">
        <Routes>
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardHome stats={stats || {}} />} />
          <Route path="students" element={<Students />} />
          <Route path="drives" element={<Drives />} />
          <Route path="reports" element={<Reports />} />
          <Route path="verification" element={<Verification />} />
          <Route path="posts" element={<Posts />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="mentor" element={<MentorDashboard />} />
          <Route path="meetings" element={<Meetings />} />
          <Route path="tasks" element={<Tasks />} />
        </Routes>
      </main>
    </div>
  );
};

export default AdminDashboard;

