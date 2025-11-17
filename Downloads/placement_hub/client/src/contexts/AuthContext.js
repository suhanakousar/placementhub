import React, { createContext, useState, useContext, useEffect } from 'react';
import { auth } from '../firebase';
import { signOut, sendPasswordResetEmail } from 'firebase/auth';
import axios from 'axios';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

const API_URL = process.env.REACT_APP_API_URL || 'https://placementhub-2.onrender.com/api';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for stored token on app load
    const token = localStorage.getItem('token');
    if (token) {
      // Validate token and fetch user data
      axios.get(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(response => {
        setUser({
          id: response.data.user._id,
          email: response.data.user.email,
          role: response.data.user.role,
          isVerified: response.data.user.isVerified
        });
        if (response.data.profile) {
          setProfile(response.data.profile);
        }
      })
      .catch(error => {
        console.error('Token validation failed:', error);
        localStorage.removeItem('token');
      })
      .finally(() => {
        setLoading(false);
      });
    } else {
      setLoading(false);
    }

    // Firebase auth state listener disabled to prevent conflicts with backend authentication
    // const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
    //   if (firebaseUser && !localStorage.getItem('token')) {
    //     // Handle Firebase user if no backend token exists
    //     if (!firebaseUser.emailVerified) {
    //       setUser(null);
    //       setProfile(null);
    //       return;
    //     }

    //     setUser({
    //       id: firebaseUser.uid,
    //       email: firebaseUser.email,
    //       emailVerified: firebaseUser.emailVerified
    //     });

    //     // Fetch user profile from backend
    //     try {
    //       const response = await axios.get(`${API_URL}/auth/me`);
    //       setProfile(response.data.profile);
    //     } catch (error) {
    //       console.error('Error fetching profile:', error);
    //       setProfile(null);
    //     }
    //   }
    // });

    // return () => unsubscribe();
  }, []);

  const register = async (userData) => {
    try {
      const { email, password, role, firstName, lastName, rollNumber, department, year } = userData;


    }
  };

  const login = async (email, password, role) => {
    try {
      console.log('AuthContext login: Starting login for email:', email, 'role:', role);

      // Sign out from Firebase to prevent conflicts
      await signOut(auth);

      // Clear previous session
      localStorage.removeItem('token');
      setUser(null);
      setProfile(null);
      console.log('AuthContext login: Cleared previous session');

      let response;

      // Use password authentication for both students and admins
      response = await axios.post(`${API_URL}/auth/login`, {
        email: email.toLowerCase().trim(),
        password
      });

      console.log('AuthContext login: Backend response:', response.data);

      if (response.data.success) {
        // Store JWT token
        localStorage.setItem('token', response.data.token);

        // Set user data from backend response
        const newUser = {
          id: response.data.user.id,
          email: response.data.user.email,
          role: response.data.user.role,
          isVerified: response.data.user.isVerified
        };
        setUser(newUser);
        console.log('AuthContext login: Set user to:', newUser.email);

        // Fetch and set profile
        try {
          const profileResponse = await axios.get(`${API_URL}/auth/me`, {
            headers: { Authorization: `Bearer ${response.data.token}` }
          });
          if (profileResponse.data.profile) {
            setProfile(profileResponse.data.profile);
            console.log('AuthContext login: Set profile');
          }
        } catch (profileError) {
          console.error('Error fetching profile:', profileError);
        }

        toast.success('Login successful!');
        return { success: true, role: response.data.user.role };
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error(error.response?.data?.message || 'Login failed');
      return { success: false };
    }
  };

  const logout = () => {
    signOut(auth);
    localStorage.removeItem('token');
    setUser(null);
    setProfile(null);
    toast.success('Logged out successfully');
  };

  const updateProfile = async (data) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(`${API_URL}/students/profile`, data, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProfile(response.data);
      toast.success('Profile updated successfully');
      return { success: true };
    } catch (error) {
      toast.error(error.response?.data?.message || 'Update failed');
      return { success: false };
    }
  };

  const resetPassword = async (email) => {
    try {
      await sendPasswordResetEmail(auth, email);
      toast.success('Password reset email sent. Check your inbox.');
      return { success: true };
    } catch (error) {
      toast.error('Failed to send password reset email');
      return { success: false };
    }
  };

  const value = {
    user,
    profile,
    loading,
    register,
    login,
    logout,
    updateProfile,
    resetPassword
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
