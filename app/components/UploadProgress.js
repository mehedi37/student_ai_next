'use client';

import { useState, useEffect } from 'react';
import { Loader2, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

export default function UploadProgress({ clientId, taskId, onComplete, onError }) {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('processing');
  const [message, setMessage] = useState('Processing your content...');
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [eventSource, setEventSource] = useState(null);
  const [connectionError, setConnectionError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 3;

  useEffect(() => {
    if (!clientId || !taskId) return;

    console.log('Connecting to SSE for task:', taskId);

    const connectSSE = () => {
      // Get authentication token from localStorage
      const token = localStorage.getItem('token');

      // Create SSE connection with token if available
      let sseUrl = `/api/uploads/sse/progress/${clientId}/${taskId}`;
      if (token) {
        sseUrl += `?token=${encodeURIComponent(token)}`;
      }

      const sse = new EventSource(sseUrl);
      setEventSource(sse);

      // Handle connection open
      sse.onopen = () => {
        console.log('SSE connection opened');
        setConnectionError(false);
        setRetryCount(0); // Reset retry count on successful connection
      };

      // Handle progress updates
      sse.addEventListener('progress', (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('Progress update received:', data);

          // Update percentage
          if (data.percentage !== undefined) {
            setProgress(data.percentage);
          } else if (data.current && data.total) {
            const percentage = Math.floor((data.current / data.total) * 100);
            setProgress(percentage);
          }

          // Update status
          if (data.status) {
            setStatus(data.status);
          }

          // Update message
          if (data.message) {
            setMessage(data.message);
          }

          // Update time remaining
          if (data.time_remaining) {
            setTimeRemaining(data.time_remaining);
          }

          // Handle completion
          if (data.status === 'completed') {
            sse.close();
            onComplete && onComplete(data);
          }

          // Handle errors
          if (data.status === 'failed' || data.status === 'error') {
            sse.close();
            onError && onError(data.error || data.message || 'Task failed');
          }

          // Handle cancellation
          if (data.status === 'cancelled') {
            sse.close();
            setMessage(data.message || 'Task was cancelled');
          }
        } catch (err) {
          console.error('Error parsing SSE message:', err);
        }
      });

      // Handle errors
      sse.onerror = (error) => {
        console.error('SSE connection error:', error);
        setConnectionError(true);

        // Close the current connection
        sse.close();

        // Retry logic - attempt to reconnect a limited number of times
        if (retryCount < MAX_RETRIES) {
          setRetryCount(prev => prev + 1);
          setMessage(`Connection lost. Retrying... (${retryCount + 1}/${MAX_RETRIES})`);

          // Wait before reconnecting
          setTimeout(connectSSE, 2000);
        } else {
          // Fall back to showing a message after max retries
          setMessage('Connection to progress updates lost. The task may still be processing.');

          // Only trigger error callback if the task isn't already marked as completed
          if (status !== 'completed') {
            onError && onError('Unable to reconnect to progress updates after multiple attempts');
          }
        }
      };

      // Handle specific event for errors from server
      sse.addEventListener('error', (event) => {
        try {
          const data = JSON.parse(event.data);
          console.error('Server reported error:', data);
          setStatus('error');
          setMessage(data.error || 'Task failed');
          onError && onError(data.error || 'Task failed');
        } catch (err) {
          console.error('Error parsing error event:', err);
        }
      });

      return sse;
    };

    // Initial connection
    const sse = connectSSE();

    // Cleanup function
    return () => {
      if (sse) {
        console.log('Closing SSE connection');
        sse.close();
      }
    };
  }, [clientId, taskId, onComplete, onError, status, retryCount]);

  // Get alert styling based on status
  const getAlertClass = () => {
    switch (status) {
      case 'completed': return 'alert-success';
      case 'failed':
      case 'error': return 'alert-error';
      case 'cancelled': return 'alert-warning';
      case 'processing':
      default: return connectionError ? 'alert-warning' : 'alert-info';
    }
  };

  // Status icon
  const getStatusIcon = () => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-5 w-5" />;
      case 'failed':
      case 'error': return <XCircle className="h-5 w-5" />;
      case 'cancelled': return <AlertTriangle className="h-5 w-5" />;
      case 'processing':
      default: return <Loader2 className="h-5 w-5 animate-spin" />;
    }
  };

  const handleCancelTask = async () => {
    try {
      // Get authentication token
      const token = localStorage.getItem('token');
      const headers = {
        'Content-Type': 'application/json'
      };

      // Add token to headers if available
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`/api/uploads/cancel/${taskId}`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ client_id: clientId })
      });

      if (response.ok) {
        setStatus('cancelled');
        setMessage('Upload cancelled by user');

        // Close the SSE connection
        if (eventSource) {
          eventSource.close();
        }
      } else {
        const errorData = await response.json();
        console.error('Error cancelling task:', errorData);
        setMessage(`Failed to cancel: ${errorData.error || errorData.detail || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error cancelling task:', error);
      setMessage('Failed to cancel task. Network error.');
    }
  };

  return (
    <div className={`alert ${getAlertClass()} shadow-lg`}>
      <div className="flex-1">
        <div className="font-bold capitalize flex items-center gap-2">
          {getStatusIcon()}
          {status}
        </div>
        <div className="text-sm">{message}</div>

        {status === 'processing' && (
          <div className="mt-3">
            <div className="flex justify-between text-xs mb-1">
              <span className="font-medium">{progress}% Complete</span>
              {timeRemaining && (
                <span>Est. {timeRemaining}</span>
              )}
            </div>
            <div className="w-full bg-base-300 rounded-full h-2.5">
              <div
                className={`${status === 'completed' ? 'bg-success' : status === 'error' ? 'bg-error' : 'bg-primary'} h-2.5 rounded-full`}
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        )}
      </div>

      {status === 'processing' && (
        <div>
          <button
            type="button"
            className="btn btn-sm btn-error"
            onClick={handleCancelTask}
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}