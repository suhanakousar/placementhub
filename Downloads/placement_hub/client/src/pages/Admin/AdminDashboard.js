import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
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
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header 
        title="Admin Dashboard" 
        user={user} 
        onMenuToggle={toggleMenu}
        isMenuOpen={isMenuOpen}
      />
      <AdminSidebar isOpen={isMenuOpen} onClose={closeMenu} />
      <main className="lg:ml-64 lg:pt-16 pt-4 p-4 md:p-6">
        <Routes>
          <Route index element={<DashboardHome stats={stats} />} />
          <Route path="dashboard" element={<DashboardHome stats={stats} />} />
          <Route path="students" element={<Students />} />
          <Route path="drives" element={<Drives />} />
          <Route path="reports" element={<Reports />} />
          <Route path="verification" element={<Verification />} />
          <Route path="posts" element={<Posts />} />
          <Route path="notifications" element={<Notifications />} />
        </Routes>
      </main>
    </div>
  );
};

export default AdminDashboard;

