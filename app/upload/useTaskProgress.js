'use client';

import { useState, useEffect, useRef } from 'react';
import { api } from '@/utils/api';

/**
 * Hook to track upload task progress using REST polling
 */
export default function useTaskProgress(taskId) {
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

    // Define the polling function
    const pollTaskStatus = async () => {
      try {
        const response = await api.uploads.status(taskId);

        console.log('Polling task status:', response);

        // Update state with task progress
        if (response.percentage !== undefined) {
          setProgress(response.percentage);
        } else if (response.current && response.total) {
          const percentage = Math.floor((response.current / response.total) * 100);
          setProgress(percentage);
        }

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

        // Stop polling if task is complete or failed
        if (['completed', 'error', 'failed', 'cancelled'].includes(response.status)) {
          clearInterval(pollingRef.current);
          setIsPolling(false);
        }
      } catch (error) {
        console.error('Error polling task status:', error);
        setError('Failed to get task status');
        clearInterval(pollingRef.current);
        setIsPolling(false);
      }
    };

    // Poll immediately once
    pollTaskStatus();

    // Then set up interval for continued polling
    pollingRef.current = setInterval(pollTaskStatus, 1000);

    // Clean up on unmount
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        setIsPolling(false);
      }
    };
  }, [taskId]);

  const cancelTask = async () => {
    if (!taskId) return;

    try {
      // Stop polling while cancellation is in progress
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }

      // Call the cancel API
      const result = await api.uploads.terminateTask(taskId);

      // Update status to cancelled
      setStatus('cancelled');
      setMessage('Task cancelled by user');
      setIsPolling(false);

      return result;
    } catch (error) {
      console.error('Failed to cancel task:', error);
      setError('Failed to cancel task');

      // Resume polling to see the current state
      if (!isPolling && status === 'processing') {
        pollingRef.current = setInterval(pollTaskStatus, 1000);
        setIsPolling(true);
      }

      throw error;
    }
  };

  return {
    progress,
    status,
    error,
    message,
    isPolling,
    cancelTask,
  };
}
