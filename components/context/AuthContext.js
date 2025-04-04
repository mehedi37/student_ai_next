'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { api } from '@/utils/api';
import Cookies from 'js-cookie';

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load user on initial load
  useEffect(() => {
    const token = Cookies.get('token') || localStorage.getItem('token');

    if (token) {
      // If token is in localStorage but not in cookies, migrate it
      if (!Cookies.get('token') && localStorage.getItem('token')) {
        Cookies.set('token', token, {
          expires: 7, // 7 days
          sameSite: 'Lax',
          secure: process.env.NODE_ENV === 'production'
        });
      }
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
      Cookies.remove('token');
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
      const token = loginResponse.access_token;

      // Store token in both localStorage and cookies
      localStorage.setItem('token', token);
      Cookies.set('token', token, {
        expires: 7, // 7 days
        sameSite: 'Lax',
        secure: process.env.NODE_ENV === 'production'
      });

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
      const token = response.access_token;

      // Store token in both localStorage and cookies
      localStorage.setItem('token', token);
      Cookies.set('token', token, {
        expires: 7, // 7 days
        sameSite: 'Lax',
        secure: process.env.NODE_ENV === 'production'
      });

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
      Cookies.remove('token');
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
