'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { api } from '@/utils/api';
import { createContext, useContext } from 'react';

// Create context for task progress management
const TaskProgressContext = createContext(null);

/**
 * Global provider for task progress management across the app
 */
export function TaskProgressProvider({ children }) {
  const [tasks, setTasks] = useState([]);
  const [showTaskManager, setShowTaskManager] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const pollingRefs = useRef({});

  // Load tasks from localStorage on mount
  useEffect(() => {
    try {
      const savedTasks = localStorage.getItem('activeTasks');
      if (savedTasks) {
        const parsedTasks = JSON.parse(savedTasks);
        setTasks(parsedTasks);

        // Start polling for any non-completed tasks
        parsedTasks.forEach(task => {
          if (['processing', 'queued'].includes(task.status)) {
            startPollingTask(task.id);
          }
        });
      }
    } catch (error) {
      console.error('Error loading tasks from localStorage:', error);
    }
  }, []);

  // Save tasks to localStorage when they change
  useEffect(() => {
    try {
      localStorage.setItem('activeTasks', JSON.stringify(tasks));
    } catch (error) {
      console.error('Error saving tasks to localStorage:', error);
    }
  }, [tasks]);

  // Clean up polling on unmount
  useEffect(() => {
    return () => {
      Object.values(pollingRefs.current).forEach(intervalId => {
        clearInterval(intervalId);
      });
    };
  }, []);

  // Add a new task
  const addTask = useCallback((task) => {
    const newTask = {
      id: task.id,
      title: task.title || 'Task',
      type: task.type || 'generic',
      status: task.status || 'processing',
      progress: task.progress || 0,
      message: task.message || '',
      error: task.error || null,
      started: task.started || new Date().toISOString(),
      updated: new Date().toISOString(),
      metadata: task.metadata || {},
    };

    setTasks(prev => {
      // Check if task already exists
      const exists = prev.some(t => t.id === newTask.id);
      if (exists) {
        // Update existing task
        return prev.map(t => t.id === newTask.id ? { ...t, ...newTask } : t);
      } else {
        // Add new task and show task manager
        setShowTaskManager(true);
        return [...prev, newTask];
      }
    });

    // Start polling for task status
    startPollingTask(newTask.id);

    return newTask;
  }, []);

  // Update an existing task
  const updateTask = useCallback((taskId, updates) => {
    setTasks(prev =>
      prev.map(task =>
        task.id === taskId
          ? {
              ...task,
              ...updates,
              updated: new Date().toISOString()
            }
          : task
      )
    );
  }, []);

  // Remove a task
  const removeTask = useCallback((taskId) => {
    // Stop polling
    if (pollingRefs.current[taskId]) {
      clearInterval(pollingRefs.current[taskId]);
      delete pollingRefs.current[taskId];
    }

    setTasks(prev => prev.filter(task => task.id !== taskId));
  }, []);

  // Start polling for task status
  const startPollingTask = useCallback((taskId) => {
    // Clear any existing polling for this task
    if (pollingRefs.current[taskId]) {
      clearInterval(pollingRefs.current[taskId]);
    }

    const pollTaskStatus = async () => {
      try {
        const response = await api.uploads.status(taskId);

        // Calculate progress
        let progress = 0;
        if (response.percentage !== undefined) {
          progress = response.percentage;
        } else if (response.current && response.total) {
          progress = Math.floor((response.current / response.total) * 100);
        }

        // Update task
        updateTask(taskId, {
          progress,
          status: response.status || 'processing',
          message: response.message || '',
          error: response.error || null,
          // Include any additional metadata from response
          metadata: {
            ...response.metadata,
            ...(response.video_count ? { video_count: response.video_count } : {})
          }
        });

        // Stop polling if task is complete or failed
        if (['completed', 'error', 'failed', 'cancelled'].includes(response.status)) {
          clearInterval(pollingRefs.current[taskId]);
          delete pollingRefs.current[taskId];
        }
      } catch (error) {
        console.error(`Error polling task ${taskId} status:`, error);

        // Mark as error after multiple failed attempts
        updateTask(taskId, {
          error: 'Failed to get task status',
          status: 'error'
        });

        clearInterval(pollingRefs.current[taskId]);
        delete pollingRefs.current[taskId];
      }
    };

    // Poll immediately
    pollTaskStatus();

    // Set up interval for continued polling - every 2 seconds
    pollingRefs.current[taskId] = setInterval(pollTaskStatus, 2000);
  }, [updateTask]);

  // Cancel a task
  const cancelTask = useCallback(async (taskId) => {
    try {
      // Stop polling
      if (pollingRefs.current[taskId]) {
        clearInterval(pollingRefs.current[taskId]);
        delete pollingRefs.current[taskId];
      }

      // Call API to cancel task
      await api.uploads.terminateTask(taskId);

      // Update task status
      updateTask(taskId, {
        status: 'cancelled',
        message: 'Task cancelled by user'
      });

      return true;
    } catch (error) {
      console.error(`Failed to cancel task ${taskId}:`, error);

      // Resume polling to see current state
      startPollingTask(taskId);

      return false;
    }
  }, [updateTask, startPollingTask]);

  // Get all tasks
  const getAllTasks = useCallback(() => {
    return tasks;
  }, [tasks]);

  // Get active (non-completed) tasks
  const getActiveTasks = useCallback(() => {
    return tasks.filter(task =>
      ['processing', 'queued'].includes(task.status)
    );
  }, [tasks]);

  // Return context value
  const contextValue = {
    addTask,
    updateTask,
    removeTask,
    cancelTask,
    getAllTasks,
    getActiveTasks,
    showTaskManager,
    setShowTaskManager,
    collapsed,
    setCollapsed
  };

  return (
    <TaskProgressContext.Provider value={contextValue}>
      {children}
    </TaskProgressContext.Provider>
  );
}

/**
 * Hook for global task progress management
 */
export function useTaskProgress() {
  const context = useContext(TaskProgressContext);
  if (!context) {
    throw new Error('useTaskProgress must be used within a TaskProgressProvider');
  }
  return context;
}

/**
 * Hook to track a single task's progress
 * @param {string} taskId - The ID of the task to track
 */
export function useSingleTaskProgress(taskId) {
  const {
    addTask,
    updateTask,
    removeTask,
    cancelTask,
    getAllTasks
  } = useTaskProgress();

  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('processing');
  const [error, setError] = useState(null);
  const [message, setMessage] = useState('');
  const [isPolling, setIsPolling] = useState(false);
  const pollingRef = useRef(null);

  useEffect(() => {
    if (!taskId) return;

    // Clear any existing polling interval
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
    }

    setIsPolling(true);

    // Add this task to the global task list if not already there
    const existingTasks = getAllTasks();
    const existingTask = existingTasks.find(t => t.id === taskId);

    if (!existingTask) {
      addTask({
        id: taskId,
        title: 'Task',
        status: 'processing',
        progress: 0
      });
    } else {
      // Sync local state with global task state
      setProgress(existingTask.progress || 0);
      setStatus(existingTask.status || 'processing');
      setError(existingTask.error || null);
      setMessage(existingTask.message || '');
    }

    // Define the polling function
    const pollTaskStatus = async () => {
      try {
        const response = await api.uploads.status(taskId);

        // Calculate progress
        let newProgress = 0;
        if (response.percentage !== undefined) {
          newProgress = response.percentage;
        } else if (response.current && response.total) {
          newProgress = Math.floor((response.current / response.total) * 100);
        }
        setProgress(newProgress);

        // Update status and message
        if (response.status) {
          setStatus(response.status);
        }

        if (response.message) {
          setMessage(response.message);
        }

        if (response.error) {
          setError(response.error);
        }

        // Update the global task list
        updateTask(taskId, {
          progress: newProgress,
          status: response.status || status,
          message: response.message || message,
          error: response.error || error,
          metadata: {
            ...response.metadata,
            ...(response.video_count ? { video_count: response.video_count } : {})
          }
        });

        // Stop polling if task is complete or failed
        if (['completed', 'error', 'failed', 'cancelled'].includes(response.status)) {
          clearInterval(pollingRef.current);
          setIsPolling(false);
        }
      } catch (error) {
        console.error('Error polling task status:', error);
        setError('Failed to get task status');
        updateTask(taskId, { error: 'Failed to get task status', status: 'error' });
        clearInterval(pollingRef.current);
        setIsPolling(false);
      }
    };

    // Poll immediately once
    pollTaskStatus();

    // Then set up interval for continued polling
    pollingRef.current = setInterval(pollTaskStatus, 2000);

    // Clean up on unmount
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        setIsPolling(false);
      }
    };
  }, [taskId, addTask, updateTask, getAllTasks]);

  const handleCancelTask = async () => {
    if (!taskId) return;

    try {
      // Call the global cancelTask function
      return await cancelTask(taskId);
    } catch (error) {
      console.error('Failed to cancel task:', error);
      throw error;
    }
  };

  return {
    progress,
    status,
    error,
    message,
    isPolling,
    cancelTask: handleCancelTask,
  };
}
