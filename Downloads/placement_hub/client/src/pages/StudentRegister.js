import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { FaGraduationCap, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import InstallButton from '../components/InstallButton';

const StudentRegister = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    role: 'student',
    firstName: '',
    lastName: '',
    rollNumber: '',
    department: 'CSE',
    year: 2026,
    specialization: ''
  });
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!passwordIsStrong) {
      setFormError('Please create a stronger password that meets all requirements.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setFormError('Passwords do not match.');
      return;
    }

    setFormError('');

    setLoading(true);

    try {
      const result = await register({
        ...formData,
        year: Number(formData.year)
      });

      if (result.success) {
        setRegistrationSuccess(true);
      } else {
        setFormError(result.message || 'Registration failed. Please try again.');
      }
    } catch (err) {
      console.error('Student register error:', err);
      setFormError('Something went wrong. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const passwordChecks = {
    length: formData.password.length >= 8,
    uppercase: /[A-Z]/.test(formData.password),
    lowercase: /[a-z]/.test(formData.password),
    number: /[0-9]/.test(formData.password),
    special: /[^A-Za-z0-9]/.test(formData.password)
  };

  const passwordIsStrong = Object.values(passwordChecks).every(Boolean);
  const passwordsMatch = formData.password && formData.password === formData.confirmPassword;
  
  useEffect(() => {
    if (registrationSuccess) {
      const timer = setTimeout(() => {
        navigate('/login', { replace: true });
      }, 1200);

      return () => clearTimeout(timer);
    }
  }, [registrationSuccess, navigate]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white dark:from-gray-900 dark:to-gray-800 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full space-y-8 bg-white dark:bg-gray-800 p-8 rounded-lg shadow-xl">
        <div className="flex justify-end mb-2">
          <InstallButton />
        </div>
        <div className="text-center">
          <FaGraduationCap className="mx-auto text-5xl text-primary-600" />
          <h2 className="mt-6 text-3xl font-bold text-gray-900 dark:text-white">
            Create Student Account
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-primary-600 hover:text-primary-500">
              Sign in
            </Link>
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {registrationSuccess && (
            <div className="p-3 rounded-md bg-green-50 text-green-700 text-sm">
              Account created successfully! Redirecting you to login...
            </div>
          )}
          {formError && !registrationSuccess && (
            <div className="p-3 rounded-md bg-red-50 text-red-600 text-sm">
              {formError}
            </div>
          )}
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  First Name
                </label>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  required
                  value={formData.firstName}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                  placeholder="First name"
                />
              </div>
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Last Name
                </label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  required
                  value={formData.lastName}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Last name"
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                placeholder="Enter your email"
              />
            </div>

            <div>
              <label htmlFor="rollNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Roll Number
              </label>
              <input
                id="rollNumber"
                name="rollNumber"
                type="text"
                required
                value={formData.rollNumber}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                placeholder="e.g., 2300080026"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="department" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Department
                </label>
                <select
                  id="department"
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="CSE">Computer Science & Engineering</option>
                  <option value="ECE">Electronics & Communication Engineering</option>
                  <option value="EEE">Electrical & Electronics Engineering</option>
                  <option value="ME">Mechanical Engineering</option>
                  <option value="CE">Civil Engineering</option>
                  <option value="IT">Information Technology</option>
                  <option value="CSIT">Computer Science and Information Technology</option>
                  <option value="AI & DS">Artificial Intelligence & Data Science</option>
                  <option value="BT">Biotechnology</option>
                  <option value="IOT">Internet of Things</option>
                </select>
              </div>
            <div>
                <label htmlFor="year" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Passout Batch
                </label>
                <select
                  id="year"
                  name="year"
                  value={formData.year}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value={2026}>2026</option>
                  <option value={2027}>2027</option>
                  <option value={2028}>2028</option>
                  <option value={2029}>2029</option>
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="specialization" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Specialization
              </label>
              <select
                id="specialization"
                name="specialization"
                value={formData.specialization}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="">Select Specialization</option>
                <option value="AGRI-BIOTECHNOLOGY">AGRI-BIOTECHNOLOGY</option>
<option value="AI AND AUTONOMOUS SYSTEMS">AI AND AUTONOMOUS SYSTEMS</option>
<option value="AI FOR COMPUTATIONAL INTELLIGENCE">AI FOR COMPUTATIONAL INTELLIGENCE</option>
<option value="AI SYSTEMS FOR VISUAL INTELLIGENCE">AI SYSTEMS FOR VISUAL INTELLIGENCE</option>
<option value="AI-DRIVEN EDGE ARCHITECTURES AND APPLICATIONS">AI-DRIVEN EDGE ARCHITECTURES AND APPLICATIONS</option>
<option value="AI-DRIVEN LANGUAGE TECHNOLOGIES">AI-DRIVEN LANGUAGE TECHNOLOGIES</option>
<option value="AUTOMOTIVE ELECTRONICS AND AUTOSAR">AUTOMOTIVE ELECTRONICS AND AUTOSAR</option>
<option value="AUTOMOTIVE ENERGY ENGINEERING">AUTOMOTIVE ENERGY ENGINEERING</option>
<option value="BIOINFORMATICS">BIOINFORMATICS</option>
<option value="BLOCKCHAIN ENGINEERING FOR WEB3">BLOCKCHAIN ENGINEERING FOR WEB3</option>
<option value="CLOUD AND EDGE COMPUTING">CLOUD AND EDGE COMPUTING</option>
<option value="CLOUD INFRASTRUCTURE DESIGN AND ENGINEERING">CLOUD INFRASTRUCTURE DESIGN AND ENGINEERING</option>
<option value="CLOUD NATIVE SECURITY">CLOUD NATIVE SECURITY</option>
<option value="CLOUD NATIVE SOFTWARE ENGINEERING">CLOUD NATIVE SOFTWARE ENGINEERING</option>
<option value="CLOUD-BASED SCIENTIFIC COMPUTING">CLOUD-BASED SCIENTIFIC COMPUTING</option>
<option value="COMPUTER COMMUNICATION AND 5G TECHNOLOGY">COMPUTER COMMUNICATION AND 5G TECHNOLOGY</option>
<option value="CONSTRUCTION TECHNOLOGY AND MANAGEMENT">CONSTRUCTION TECHNOLOGY AND MANAGEMENT</option>
<option value="CROSS PLATFORM DEVELOPMENT FRAMEWORKS">CROSS PLATFORM DEVELOPMENT FRAMEWORKS</option>
<option value="CYBER PHYSICAL SYSTEMS AND IOT">CYBER PHYSICAL SYSTEMS AND IOT</option>
<option value="CYBER SECURITY AND BLOCKCHAIN TECHNOLOGY">CYBER SECURITY AND BLOCKCHAIN TECHNOLOGY</option>
<option value="DATA COMMUNICATIONS">DATA COMMUNICATIONS</option>
<option value="DATA ENGINEERING FOR AI">DATA ENGINEERING FOR AI</option>
<option value="DATA SCIENCE AND BIG DATA ANALYTICS">DATA SCIENCE AND BIG DATA ANALYTICS</option>
<option value="DISTRIBUTED LEDGER ANALYTICS">DISTRIBUTED LEDGER ANALYTICS</option>
<option value="EMBEDDED SYSTEMS">EMBEDDED SYSTEMS</option>
<option value="E-MOBILITY ENGINEERING">E-MOBILITY ENGINEERING</option>
<option value="ENGINEERING DESIGN">ENGINEERING DESIGN</option>
<option value="GAME DEVELOPMENT AND UX DESIGN">GAME DEVELOPMENT AND UX DESIGN</option>
<option value="GEOTECHNICAL AND TRANSPORTATION ENGINEERING">GEOTECHNICAL AND TRANSPORTATION ENGINEERING</option>
<option value="GREEN ENERGY TECHNOLOGIES">GREEN ENERGY TECHNOLOGIES</option>
<option value="Generative AI and Machine Learning">Generative AI and Machine Learning</option>
<option value="HARDWARE-SOFTWARE CO-DESIGN FOR SECURITY">HARDWARE-SOFTWARE CO-DESIGN FOR SECURITY</option>
<option value="HEALTHCARE DATA ANALYTICS">HEALTHCARE DATA ANALYTICS</option>
<option value="INDUSTRIAL AUTOMATION">INDUSTRIAL AUTOMATION</option>
<option value="INDUSTRIAL BIOTECHNOLOGY">INDUSTRIAL BIOTECHNOLOGY</option>
<option value="INTELLIGENT MULTIMEDIA PROCESSING">INTELLIGENT MULTIMEDIA PROCESSING</option>
<option value="IOT ANALYTICS">IOT ANALYTICS</option>
<option value="MEDICAL BIOTECHNOLOGY">MEDICAL BIOTECHNOLOGY</option>
<option value="NANOTECHNOLOGY & OPTOELECTRONICS">NANOTECHNOLOGY & OPTOELECTRONICS</option>
<option value="ROBOTICS AND AUTOMATION">ROBOTICS AND AUTOMATION</option>
<option value="SMART GRID TECHNOLOGIES">SMART GRID TECHNOLOGIES</option>
<option value="SMART MANUFACTURING">SMART MANUFACTURING</option>
<option value="SOCIAL AND DIGITAL MEDIA ANALYTICS">SOCIAL AND DIGITAL MEDIA ANALYTICS</option>
<option value="SOFTWARE MODELLING AND DEVOPS">SOFTWARE MODELLING AND DEVOPS</option>
<option value="SPATIAL COMPUTING AND IMMERSIVE TECHNOLOGIES">SPATIAL COMPUTING AND IMMERSIVE TECHNOLOGIES</option>
<option value="STRUCTURAL ENGINEERING">STRUCTURAL ENGINEERING</option>
<option value="VERY LARGE-SCALE INTEGRATION">VERY LARGE-SCALE INTEGRATION</option>
<option value="WATER RESOURCE AND ENVIRONMENTAL ENGINEERING">WATER RESOURCE AND ENVIRONMENTAL ENGINEERING</option>
<option value="CYBER THREAT AND INTELLIGENCE SECURITY SYSTEMS">CYBER THREAT AND INTELLIGENCE SECURITY SYSTEMS</option>


                
              </select>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                placeholder="Create a password"
              />
            <div className="mt-3 bg-gray-50 dark:bg-gray-700/50 rounded-md p-3 space-y-2">
              <p className="text-xs font-semibold text-gray-600 dark:text-gray-300">Password must contain:</p>
              {Object.entries(passwordChecks).map(([key, value]) => (
                <div key={key} className="flex items-center text-xs text-gray-600 dark:text-gray-300">
                  {value ? (
                    <FaCheckCircle className="text-green-500 mr-2" />
                  ) : (
                    <FaTimesCircle className="text-red-500 mr-2" />
                  )}
                  {key === 'length' && 'At least 8 characters'}
                  {key === 'uppercase' && 'An uppercase letter'}
                  {key === 'lowercase' && 'A lowercase letter'}
                  {key === 'number' && 'A number'}
                  {key === 'special' && 'A special character'}
                </div>
              ))}
            </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                value={formData.confirmPassword}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                placeholder="Confirm your password"
              />
            {formData.confirmPassword && (
              <p className={`mt-2 text-xs font-semibold ${passwordsMatch ? 'text-green-600' : 'text-red-600'}`}>
                {passwordsMatch ? 'Passwords match' : 'Passwords do not match'}
              </p>
            )}
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StudentRegister;
