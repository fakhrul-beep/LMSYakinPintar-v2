import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../api/axios'; // Assuming there's an axios instance configured
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Check for existing token on load
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (token && storedUser) {
        setUser(JSON.parse(storedUser));
        // Optional: Verify token validity with backend here
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const response = await api.post('auth/login', { email, password });
      const { token, user } = response.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      setUser(user);
      
      // Redirect based on role
      if (user.role === 'admin') navigate('/admin');
      else if (user.role === 'student') navigate('/student');
      else if (user.role === 'tutor') navigate('/tutor');
      
      return { success: true };
    } catch (error) {
      console.error("Login failed:", error);
      const message = error.friendlyMessage || error.response?.data?.message || "Login gagal. Silakan coba lagi.";
      return { success: false, message };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    navigate('/login');
  };

  const loginWithUserData = (userData, token) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  const updateUserData = (userData) => {
    // Merge existing user data with updated data
    const updatedUser = { ...user, ...userData };
    localStorage.setItem('user', JSON.stringify(updatedUser));
    setUser(updatedUser);
  };

  const register = async (userData, role = 'student') => {
    try {
        const endpoint = role === 'student' ? 'auth/register/student' : 'auth/register/tutor';
        
        // Check if userData is FormData
        const isFormData = userData instanceof FormData;
        const config = isFormData ? {
          headers: { 'Content-Type': 'multipart/form-data' }
        } : {};

        const response = await api.post(endpoint, userData, config);
        const { token, user: registeredUser } = response.data;
        
        loginWithUserData(registeredUser, token);

        if (registeredUser.role === 'admin') navigate('/admin');
        else if (registeredUser.role === 'student') navigate('/student');
        else if (registeredUser.role === 'tutor') navigate('/tutor');

        return { success: true, data: response.data };
    } catch (error) {
        console.error("Registration failed:", error);
        const message = error.friendlyMessage || error.response?.data?.message || "Pendaftaran gagal. Silakan coba lagi.";
        return { success: false, message };
    }
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, register, loginWithUserData, updateUserData, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
