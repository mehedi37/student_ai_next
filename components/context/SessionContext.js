'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '@/utils/api';

const SessionContext = createContext({});

export function SessionProvider({ children }) {
  const [sessions, setSessions] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  const [isDeletingSession, setIsDeletingSession] = useState(false);
  const [isDeletingAllSessions, setIsDeletingAllSessions] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [showAlert, setShowAlert] = useState(false);

  // Load sessions - memoized to prevent unnecessary re-renders
  const loadSessions = useCallback(async () => {
    // Don't fetch if already loading
    if (isLoadingSessions) return;

    setIsLoadingSessions(true);
    try {
      const response = await api.sessions.list();
      setSessions(response.sessions || []);
    } catch (error) {
      console.error('Error loading sessions:', error);
      setSessions([]);
      showAlertMessage('Failed to load sessions. Please try again.');
    } finally {
      setIsLoadingSessions(false);
    }
  }, [isLoadingSessions]);

  // Handle session click - get full session details
  const handleSessionClick = useCallback(async (session) => {
    try {
      const fullSession = await api.sessions.get(session.session_id);

      if (!fullSession || !fullSession.session_id) {
        console.error('Invalid session data received:', fullSession);
        showAlertMessage('Could not load session data. Please try again.');
        return;
      }

      setActiveSession(fullSession);
      return fullSession;
    } catch (err) {
      console.error('Error loading session details:', err);
      const errorMessage = err.message || 'Unable to load session. Please try again.';
      showAlertMessage(errorMessage);
      loadSessions();
      return null;
    }
  }, [loadSessions]);

  // Create new session
  const createNewSession = useCallback(() => {
    setActiveSession(null);
  }, []);

  // Delete a session
  const deleteSession = useCallback(async (sessionId) => {
    if (isDeletingSession) return false;

    setIsDeletingSession(true);
    try {
      await api.sessions.delete(sessionId);

      if (activeSession?.session_id === sessionId) {
        setActiveSession(null);
      }

      await loadSessions();
      return true;
    } catch (error) {
      console.error('Error deleting session:', error);
      showAlertMessage('Failed to delete session. Please try again.');
      return false;
    } finally {
      setIsDeletingSession(false);
    }
  }, [activeSession, isDeletingSession, loadSessions]);

  // Delete all sessions
  const deleteAllSessions = useCallback(async () => {
    if (isDeletingAllSessions) return false;

    setIsDeletingAllSessions(true);
    try {
      await api.sessions.deleteAll();
      setActiveSession(null);
      await loadSessions();
      return true;
    } catch (error) {
      console.error('Error deleting all sessions:', error);
      showAlertMessage('Failed to delete all sessions. Please try again.');
      return false;
    } finally {
      setIsDeletingAllSessions(false);
    }
  }, [isDeletingAllSessions, loadSessions]);

  // Show alert message
  const showAlertMessage = useCallback((message) => {
    setAlertMessage(message);
    setShowAlert(true);
    // Auto-hide after 5 seconds
    setTimeout(() => setShowAlert(false), 5000);
  }, []);

  const value = {
    sessions,
    activeSession,
    isLoadingSessions,
    isDeletingSession,
    isDeletingAllSessions,
    alertMessage,
    showAlert,
    loadSessions,
    handleSessionClick,
    createNewSession,
    deleteSession,
    deleteAllSessions,
    setActiveSession,
    showAlertMessage,
    setShowAlert
  };

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export const useSession = () => useContext(SessionContext);