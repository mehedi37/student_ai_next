import { useState, useEffect, useCallback } from 'react';
import { api } from '@/utils/api';
import websocketManager from '@/utils/websocket';

/**
 * Custom hook to track task progress via WebSocket and API
 */
export function useTaskProgress() {
  const [taskId, setTaskId] = useState(null);
  const [progress, setProgress] = useState(null);
  const [error, setError] = useState(null);
  const [isWebSocketConnected, setIsWebSocketConnected] = useState(false);

  // Initial fetch of task status
  const fetchInitialStatus = useCallback(async (id) => {
    if (!id) return;

    try {
      const status = await api.uploads.status(id);
      setProgress(status);
      return status;
    } catch (err) {
      setError(err.message || 'Failed to fetch task status');
      console.error('Error fetching task status:', err);
      return null;
    }
  }, []);

  // Polling fallback for when WebSocket is not available
  const startPolling = useCallback((id, interval = 3000) => {
    if (!id) return null;

    console.log(`Starting polling for task ${id}`);
    const intervalId = setInterval(async () => {
      const status = await fetchInitialStatus(id);

      // Stop polling if task is completed, failed or cancelled
      if (status && ['completed', 'failed', 'cancelled'].includes(status.status)) {
        clearInterval(intervalId);
      }
    }, interval);

    return intervalId;
  }, [fetchInitialStatus]);

  // Set up WebSocket subscription for task updates
  useEffect(() => {
    if (!taskId) return;

    // First fetch initial status
    fetchInitialStatus(taskId);

    // Then subscribe to updates
    let unsubscribe;
    let pollingInterval = null;

    const setupWebSocket = async () => {
      try {
        // Connect WebSocket if not already connected
        if (!websocketManager.isConnected) {
          await websocketManager.connect();
        }

        setIsWebSocketConnected(true);

        // Subscribe to general upload progress events
        const generalUnsubscribe = websocketManager.on('upload_progress', (data) => {
          if (data.task_id === taskId) {
            setProgress(data);
          }
        });

        // Subscribe to task-specific events
        const taskUnsubscribe = websocketManager.subscribeToTask(taskId, (data) => {
          setProgress(data);
        });

        // Combine unsubscribe functions
        unsubscribe = () => {
          generalUnsubscribe();
          taskUnsubscribe();
        };
      } catch (err) {
        console.error('WebSocket connection failed:', err);
        setIsWebSocketConnected(false);
        setError('WebSocket connection failed. Falling back to polling for updates.');

        // Start polling as fallback
        pollingInterval = startPolling(taskId);
      }
    };

    setupWebSocket();

    return () => {
      if (unsubscribe) unsubscribe();
      if (pollingInterval) clearInterval(pollingInterval);
    };
  }, [taskId, fetchInitialStatus, startPolling]);

  // Cancel the task
  const cancelTask = useCallback(async () => {
    if (!taskId) {
      setError('No task to cancel');
      return false;
    }

    try {
      const response = await api.uploads.terminateTask(taskId);

      // Update the progress state to show cancellation
      setProgress(prev => ({
        ...prev,
        status: 'cancelled',
        message: 'Task cancelled by user',
        percentage: prev?.percentage || 0,
      }));

      console.log('Task cancelled successfully:', response);
      return true;
    } catch (err) {
      setError(err.message || 'Failed to cancel task');
      console.error('Error cancelling task:', err);
      return false;
    }
  }, [taskId]);

  return {
    taskId,
    setTaskId,
    progress,
    error,
    cancelTask,
    isWebSocketConnected,
  };
}
