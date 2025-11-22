import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import Sidebar from '../../components/Layout/Sidebar';
import Header from '../../components/Layout/Header';
import DashboardHome from './DashboardHome';
import Profile from './Profile';
import Academics from './Academics';
import Projects from './Projects';
import Hackathons from './Hackathons';
import Certifications from './Certifications';
import Resumes from './Resumes';
import Posts from './Posts';
import Notifications from './Notifications';
import Support from './Support';
import CompetitiveProfile from './CompetitiveProfile';
import Meetings from './Meetings';
import Tasks from './Tasks';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../utils/api';

const StudentDashboard = () => {
  const { user, profile } = useAuth();
  const [studentData, setStudentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    fetchStudentData();
  }, []);

  const fetchStudentData = async () => {
    try {
      const response = await api.get('/students/profile');
      setStudentData(response.data);
    } catch (error) {
      console.error('Error fetching student data:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleMenu = () => {
    console.log('Toggle menu - current state:', isMenuOpen);
    setIsMenuOpen(prev => {
      console.log('Toggle menu - changing from', prev, 'to', !prev);
      return !prev;
    });
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
        title="Student Dashboard" 
        user={user} 
        onMenuToggle={toggleMenu}
        isMenuOpen={isMenuOpen}
      />
      <Sidebar isOpen={isMenuOpen} onClose={closeMenu} />
      <main className="lg:ml-64 lg:pt-16 pt-16 p-4 md:p-6">
        <Routes>
          <Route index element={<DashboardHome studentData={studentData} />} />
          <Route path="dashboard" element={<DashboardHome studentData={studentData} />} />
          <Route path="profile" element={<Profile studentData={studentData} onUpdate={fetchStudentData} />} />
          <Route path="academics" element={<Academics studentData={studentData} onUpdate={fetchStudentData} />} />
          <Route path="projects" element={<Projects studentData={studentData} onUpdate={fetchStudentData} />} />
          <Route path="hackathons" element={<Hackathons studentData={studentData} onUpdate={fetchStudentData} />} />
          <Route path="certifications" element={<Certifications studentData={studentData} onUpdate={fetchStudentData} />} />
          <Route path="resumes" element={<Resumes studentData={studentData} onUpdate={fetchStudentData} />} />
          <Route path="competitive-profile" element={<CompetitiveProfile studentData={studentData} />} />
          <Route path="posts" element={<Posts />} />
          <Route path="meetings" element={<Meetings />} />
          <Route path="tasks" element={<Tasks />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="support" element={<Support />} />
        </Routes>
      </main>
    </div>
  );
};

export default StudentDashboard;

