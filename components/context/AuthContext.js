'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { api } from '@/utils/api';

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load user on initial load
  useEffect(() => {
    const token = localStorage.getItem('token');

    if (token) {
      fetchUserProfile();
    } else {
      setIsLoading(false);
    }
  }, []);

  // Fetch user profile
  const fetchUserProfile = async () => {
    try {
      const userData = await api.auth.getProfile();
      setUser(userData);
    } catch (err) {
      console.error("Failed to fetch user profile:", err);
      localStorage.removeItem('token');
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Register a new user
  const register = async (username, email, password) => {
    try {
      const response = await api.auth.register({ username, email, password });

      // If registration is successful, immediately log in
      const loginResponse = await api.auth.login({ email, password });
      localStorage.setItem('token', loginResponse.access_token);

      await fetchUserProfile();
      return response;
    } catch (err) {
      setError(err.message || "Registration failed");
      throw err;
    }
  };

  // Login user
  const login = async (email, password) => {
    try {
      const response = await api.auth.login({ email, password });
      localStorage.setItem('token', response.access_token);
      await fetchUserProfile();
      return response;
    } catch (err) {
      setError(err.message || "Login failed");
      throw err;
    }
  };

  // Logout user
  const logout = async () => {
    try {
      await api.auth.logout();
    } catch (err) {
      console.error("Logout API error:", err);
    } finally {
      localStorage.removeItem('token');
      setUser(null);
    }
  };

  const value = {
    user,
    isLoading,
    error,
    login,
    register,
    logout,
    refreshUser: fetchUserProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
