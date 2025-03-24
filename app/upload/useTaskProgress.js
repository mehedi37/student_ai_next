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
  const [pollingIntervalId, setPollingIntervalId] = useState(null);

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

    // Clear any existing polling interval
    if (pollingIntervalId) {
      clearInterval(pollingIntervalId);
    }

    const intervalId = setInterval(async () => {
      const status = await fetchInitialStatus(id);

      // Stop polling if task is completed, failed or cancelled
      if (status && ['completed', 'failed', 'cancelled'].includes(status.status)) {
        clearInterval(intervalId);
        setPollingIntervalId(null);
      }
    }, interval);

    setPollingIntervalId(intervalId);
    return intervalId;
  }, [fetchInitialStatus, pollingIntervalId]);

  // Handle WebSocket connection changes
  useEffect(() => {
    const handleConnection = () => setIsWebSocketConnected(true);
    const handleDisconnection = () => {
      setIsWebSocketConnected(false);

      // Start polling if we have an active task
      if (taskId) {
        startPolling(taskId);
      }
    };

    // Subscribe to connection status events
    if (websocketManager) {
      websocketManager.on('connected', handleConnection);
      websocketManager.on('disconnected', handleDisconnection);

      // Initialize connection status
      setIsWebSocketConnected(websocketManager.isConnected);
    }

    return () => {
      if (websocketManager) {
        websocketManager.off('connected', handleConnection);
        websocketManager.off('disconnected', handleDisconnection);
      }
    };
  }, [taskId, startPolling]);

  // Set up WebSocket subscription for task updates
  useEffect(() => {
    if (!taskId) {
      // Clear any progress data and polling when task ID is cleared
      setProgress(null);
      if (pollingIntervalId) {
        clearInterval(pollingIntervalId);
        setPollingIntervalId(null);
      }
      return;
    }

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

            // Reset error state when we get a successful update
            if (error) setError(null);
          }
        });

        // Subscribe to task-specific events
        const taskUnsubscribe = websocketManager.subscribeToTask(taskId, (data) => {
          setProgress(data);

          // Check for error in the data
          if (data.status === 'failed' && data.error) {
            setError(data.error);
          } else if (error) {
            // Reset error state when we get a successful update
            setError(null);
          }
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
  }, [taskId, fetchInitialStatus, startPolling, error]);

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

  // Reset everything
  const resetTask = useCallback(() => {
    setTaskId(null);
    setProgress(null);
    setError(null);

    if (pollingIntervalId) {
      clearInterval(pollingIntervalId);
      setPollingIntervalId(null);
    }
  }, [pollingIntervalId]);

  return {
    taskId,
    setTaskId,
    progress,
    error,
    cancelTask,
    resetTask,
    isWebSocketConnected,
  };
}
