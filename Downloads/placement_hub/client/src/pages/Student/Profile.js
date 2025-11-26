import React, { useState } from 'react';
import { FaLinkedin, FaGithub, FaGlobe, FaSave, FaPhone, FaCode, FaGraduationCap } from 'react-icons/fa';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const Profile = ({ studentData, onUpdate }) => {
  const [formData, setFormData] = useState({
    personalInfo: {
      firstName: studentData?.personalInfo?.firstName || '',
      lastName: studentData?.personalInfo?.lastName || '',
      phone: studentData?.personalInfo?.phone || '',
      alternatePhone: studentData?.personalInfo?.alternatePhone || '',
      linkedin: studentData?.personalInfo?.linkedin || '',
      github: studentData?.personalInfo?.github || '',
      portfolio: studentData?.personalInfo?.portfolio || '',
      website: studentData?.personalInfo?.website || '',
      leetcode: studentData?.personalInfo?.leetcode || '',
      hackerrank: studentData?.personalInfo?.hackerrank || '',

      geeksforgeeks: studentData?.personalInfo?.geeksforgeeks || ''
    },
    academicInfo: {
      rollNumber: studentData?.academicInfo?.rollNumber || '',
      department: studentData?.academicInfo?.department || '',
      year: studentData?.academicInfo?.year || '',
      specialization: studentData?.academicInfo?.specialization || '',
      semester: studentData?.academicInfo?.semester || '',
      cgpa: studentData?.academicInfo?.cgpa || ''
    }
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (['rollNumber', 'department', 'year', 'specialization', 'semester', 'cgpa'].includes(name)) {
      setFormData({
        ...formData,
        academicInfo: {
          ...formData.academicInfo,
          [name]: value
        }
      });
    } else {
      setFormData({
        ...formData,
        personalInfo: {
          ...formData.personalInfo,
          [name]: value
        }
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.put('/students/profile', formData);
      toast.success('Profile updated successfully');
      onUpdate();
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">Profile Management</h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              First Name
            </label>
            <input
              type="text"
              name="firstName"
              value={formData.personalInfo.firstName}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Last Name
            </label>
            <input
              type="text"
              name="lastName"
              value={formData.personalInfo.lastName}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <FaPhone className="inline mr-2" />
              Phone Number
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.personalInfo.phone}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              placeholder="+91 9876543210"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Alternate Phone Number
            </label>
            <input
              type="tel"
              name="alternatePhone"
              value={formData.personalInfo.alternatePhone}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              placeholder="+91 9876543210"
            />
          </div>
        </div>

        {/* Academic Information Section */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center">
            <FaGraduationCap className="mr-2" />
            Academic Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Roll Number
              </label>
              <input
                type="text"
                name="rollNumber"
                value={formData.academicInfo.rollNumber}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                placeholder="e.g., 21CSE001"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Department
              </label>
              <select
                name="department"
                value={formData.academicInfo.department}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                required
              >
                <option value="">Select Department</option>
                <option value="CSE">Computer Science & Engineering</option>
                <option value="ECE">Electronics & Communication Engineering</option>
                <option value="EEE">Electrical & Electronics Engineering</option>
                <option value="ME">Mechanical Engineering</option>
                <option value="CE">Civil Engineering</option>
                <option value="IT">Information Technology</option>
                <option value="CSIT">Computer Science and Information Technology</option>
                <option value="AI">Artificial Intelligence & Data Science (AI & DS)</option>
                <option value="BT">Biotechnology</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Passout Batch
              </label>
              <select
                name="year"
                value={formData.academicInfo.year}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                required
              >
                <option value="">Select Passout Batch</option>
                <option value="2026">2026</option>
                <option value="2027">2027</option>
                <option value="2028">2028</option>
                <option value="2029">2029</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Specialization
              </label>
              <select
                name="specialization"
                value={formData.academicInfo.specialization}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              >
                <option value="">Select Specialization</option>
                <option value="AGRI-BIOTECHNOLOGY">AGRI-BIOTECHNOLOGY</option>
                <option value="AI AND AUTONOMOUS SYSTEMS">AI AND AUTONOMOUS SYSTEMS</option>
                <option value="AI FOR COMPUTATIONAL INTELLIGENCE">AI FOR COMPUTATIONAL INTELLIGENCE</option>
                <option value="AI-DRIVEN EDGE ARCHITECTURES AND APPLICATIONS">AI-DRIVEN EDGE ARCHITECTURES AND APPLICATIONS</option>
                <option value="AI-DRIVEN LANGUAGE TECHNOLOGIES">AI-DRIVEN LANGUAGE TECHNOLOGIES</option>
                <option value="AUTOMOTIVE ELECTRONICS AND AUTOSAR">AUTOMOTIVE ELECTRONICS AND AUTOSAR</option>
                <option value="AUTOMOTIVE ENERGY ENGINEERING">AUTOMOTIVE ENERGY ENGINEERING</option>
                <option value="BIOINFORMATICS">BIOINFORMATICS</option>
                <option value="DATA COMMUNICATIONS">DATA COMMUNICATIONS</option>
                <option value="E-MOBILITY ENGINEERING">E-MOBILITY ENGINEERING</option>
                <option value="ELECTRICAL MACHINES">ELECTRICAL MACHINES</option>
                <option value="ENGINEERING DESIGN">ENGINEERING DESIGN</option>
                <option value="STRUCTURAL ENGINEERING">STRUCTURAL ENGINEERING</option>
                <option value="GEOTECHNICAL AND TRANSPORTATION ENGINEERING">GEOTECHNICAL AND TRANSPORTATION ENGINEERING</option>
                <option value="GREEN ENERGY TECHNOLOGIES">GREEN ENERGY TECHNOLOGIES</option>
                <option value="INDUSTRIAL AUTOMATION">INDUSTRIAL AUTOMATION</option>
                <option value="SMART GRID TECHNOLOGIES">SMART GRID TECHNOLOGIES</option>
                <option value="HEALTHCARE DATA ANALYTICS">HEALTHCARE DATA ANALYTICS</option>
                <option value="INDUSTRIAL BIOTECHNOLOGY">INDUSTRIAL BIOTECHNOLOGY</option>
                <option value="GENERATIVE AI & MACHINE LEARNING">GENERATIVE AI & MACHINE LEARNING</option>
                <option value="IOT ANALYTICS">IOT ANALYTICS</option>
                <option value="MEDICAL BIOTECHNOLOGY">MEDICAL BIOTECHNOLOGY</option>
                <option value="ROBOTICS AND AUTOMATION">ROBOTICS AND AUTOMATION</option>
                <option value="SMART MANUFACTURING">SMART MANUFACTURING</option>
                <option value="VERY LARGE-SCALE INTEGRATION">VERY LARGE-SCALE INTEGRATION</option>
                <option value="WATER RESOURCE AND ENVIRONMENTAL ENGINEERING">WATER RESOURCE AND ENVIRONMENTAL ENGINEERING</option>
                <option value="CONSTRUCTION TECHNOLOGY AND MANAGEMENT">CONSTRUCTION TECHNOLOGY AND MANAGEMENT</option>
                <option value="NANOTECHNOLOGY & OPTOELECTRONICS">NANOTECHNOLOGY & OPTOELECTRONICS</option>
                <option value="CLOUD AND EDGE COMPUTING">CLOUD AND EDGE COMPUTING</option>
                <option value="CLOUD INFRASTRUCTURE DESIGN AND ENGINEERING">CLOUD INFRASTRUCTURE DESIGN AND ENGINEERING</option>
                <option value="CLOUD NATIVE SECURITY">CLOUD NATIVE SECURITY</option>
                <option value="CLOUD NATIVE SOFTWARE ENGINEERING">CLOUD NATIVE SOFTWARE ENGINEERING</option>
                <option value="CLOUD-BASED SCIENTIFIC COMPUTING">CLOUD-BASED SCIENTIFIC COMPUTING</option>
                <option value="DATA ENGINEERING FOR AI">DATA ENGINEERING FOR AI</option>
                <option value="DATA SCIENCE AND BIG DATA ANALYTICS">DATA SCIENCE AND BIG DATA ANALYTICS</option>
                <option value="DISTRIBUTED LEDGER ANALYTICS">DISTRIBUTED LEDGER ANALYTICS</option>
                <option value="SOCIAL AND DIGITAL MEDIA ANALYTICS">SOCIAL AND DIGITAL MEDIA ANALYTICS</option>
                <option value="AI SYSTEMS FOR VISUAL INTELLIGENCE">AI SYSTEMS FOR VISUAL INTELLIGENCE</option>
                <option value="5G - 6G WIRELESS TECHNOLOGIES">5G - 6G WIRELESS TECHNOLOGIES</option>
                <option value="CROSS PLATFORM DEVELOPMENT FRAMEWORKS">CROSS PLATFORM DEVELOPMENT FRAMEWORKS</option>
                <option value="GAME DEVELOPMENT AND UX DESIGN">GAME DEVELOPMENT AND UX DESIGN</option>
                <option value="SPATIAL COMPUTING AND IMMERSIVE TECHNOLOGIES">SPATIAL COMPUTING AND IMMERSIVE TECHNOLOGIES</option>
                <option value="BLOCKCHAIN ENGINEERING FOR WEB3">BLOCKCHAIN ENGINEERING FOR WEB3</option>
                <option value="CYBER PHYSICAL SYSTEMS AND IOT">CYBER PHYSICAL SYSTEMS AND IOT</option>
                <option value="CYBER SECURITY AND BLOCKCHAIN TECHNOLOGY">CYBER SECURITY AND BLOCKCHAIN TECHNOLOGY</option>
                <option value="HARDWARE-SOFTWARE CO-DESIGN FOR SECURITY">HARDWARE-SOFTWARE CO-DESIGN FOR SECURITY</option>
                <option value="SOFTWARE MODELLING AND DEVOPS">SOFTWARE MODELLING AND DEVOPS</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Current Semester
              </label>
              <select
                name="semester"
                value={formData.academicInfo.semester}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                required
              >
                <option value="">Select Semester</option>
                <option value="1">1st Semester</option>
                <option value="2">2nd Semester</option>
                <option value="3">3rd Semester</option>
                <option value="4">4th Semester</option>
                <option value="5">5th Semester</option>
                <option value="6">6th Semester</option>
                <option value="7">7th Semester</option>
                <option value="8">8th Semester</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Current CGPA
              </label>
              <input
                type="number"
                step="0.01"
                name="cgpa"
                value={formData.academicInfo.cgpa}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                placeholder="8.5"
                min="0"
                max="10"
                required
              />
            </div>
          </div>
        </div>

        {/* Professional Links Section */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center">
            <FaGlobe className="mr-2" />
            Professional Links
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <FaLinkedin className="inline mr-2" />
                LinkedIn Profile
              </label>
              <input
                type="url"
                name="linkedin"
                value={formData.personalInfo.linkedin}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                placeholder="https://linkedin.com/in/yourprofile"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <FaGithub className="inline mr-2" />
                GitHub Profile
              </label>
              <input
                type="url"
                name="github"
                value={formData.personalInfo.github}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                placeholder="https://github.com/yourusername"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <FaGlobe className="inline mr-2" />
                Portfolio Website
              </label>
              <input
                type="url"
                name="portfolio"
                value={formData.personalInfo.portfolio}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                placeholder="https://yourportfolio.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <FaGlobe className="inline mr-2" />
                Personal Website
              </label>
              <input
                type="url"
                name="website"
                value={formData.personalInfo.website}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                placeholder="https://yourwebsite.com"
              />
            </div>
          </div>
        </div>

        {/* Coding Platforms Section */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center">
            <FaCode className="mr-2" />
            Coding Platforms
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                LeetCode Profile
              </label>
              <input
                type="url"
                name="leetcode"
                value={formData.personalInfo.leetcode}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                placeholder="https://leetcode.com/yourusername"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                HackerRank Profile
              </label>
              <input
                type="url"
                name="hackerrank"
                value={formData.personalInfo.hackerrank}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                placeholder="https://hackerrank.com/yourusername"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                CodeChef Profile
              </label>
              <input
                type="url"
                name="codechef"
                value={formData.personalInfo.codechef}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                placeholder="https://codechef.com/users/yourusername"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                GeeksForGeeks Profile
              </label>
              <input
                type="url"
                name="geeksforgeeks"
                value={formData.personalInfo.geeksforgeeks}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                placeholder="https://auth.geeksforgeeks.org/user/yourusername"
              />
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end pt-6">
          <button
            type="submit"
            disabled={loading}
            className="bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg font-medium flex items-center"
          >
            <FaSave className="mr-2" />
            {loading ? 'Saving...' : 'Save Profile'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Profile;

