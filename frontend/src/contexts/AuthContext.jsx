import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth } from '../utils/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setCurrentUser(null);
        return;
      }

      const userData = await auth.getUser();
      setCurrentUser(userData);
      setError(null);
    } catch (err) {
      console.error('Auth check failed:', err);
      localStorage.removeItem('token');
      setCurrentUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentials) => {
    try {
      setLoading(true);
      setError(null);

      const response = await auth.login(credentials);
      // Set the token before checking auth status
      if (response.key) {
        localStorage.setItem('token', response.key);
      }
      await checkAuthStatus();
      return true;
    } catch (err) {
      const errorMessage = err.response?.data?.non_field_errors?.[0] || 
                          err.response?.data?.detail ||
                          'Invalid credentials';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    try {
      setLoading(true);
      setError(null);

      await auth.register(userData);
      await checkAuthStatus();
      return true;
    } catch (err) {
      const errorMessage = err.response?.data?.username?.[0] ||
                          err.response?.data?.email?.[0] ||
                          err.response?.data?.password1?.[0] ||
                          'Registration failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      await auth.logout();
    } finally {
      setCurrentUser(null);
      setError(null);
      setLoading(false);
    }
  };

  const value = {
    currentUser,
    loading,
    error,
    login,
    register,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
