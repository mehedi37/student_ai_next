'use client';

import { useState, useEffect, useRef } from 'react';
import { Loader2, CheckCircle, XCircle, AlertTriangle, ListPlus } from 'lucide-react';
import { api } from '@/utils/api';

export default function UploadProgress({ taskId, onComplete, onError }) {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('processing');
  const [message, setMessage] = useState('Processing your content...');
  const [errorMessage, setErrorMessage] = useState(null);
  const [videoCount, setVideoCount] = useState(null);
  const pollingRef = useRef(null);

  // Poll for task status updates
  useEffect(() => {
    if (!taskId) return;

    // Clear any existing polling interval
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
    }

    // Start polling for task status
    const pollTaskStatus = async () => {
      try {
        const response = await api.uploads.status(taskId);

        // Update UI with progress information
        if (response.percentage !== undefined) {
          setProgress(response.percentage);
        } else if (response.current && response.total) {
          const percentage = Math.floor((response.current / response.total) * 100);
          setProgress(percentage);
        }

        // Update status
        if (response.status) {
          setStatus(response.status);
        }

        // Update message if available
        if (response.message) {
          setMessage(response.message);
        }

        // Handle error state
        if (response.error) {
          setErrorMessage(response.error);
        }

        // Extract video count for playlists if available
        if (response.metadata && response.metadata.video_count) {
          setVideoCount(response.metadata.video_count);
        }

        // Call the appropriate callbacks based on status
        if (response.status === 'completed') {
          onComplete && onComplete(response);
          clearInterval(pollingRef.current);
        } else if (['error', 'failed'].includes(response.status)) {
          onError && onError(response.error || 'Task failed');
          clearInterval(pollingRef.current);
        }
      } catch (error) {
        console.error('Error polling task status:', error);
        setErrorMessage('Error checking task status');
      }
    };

    // Poll immediately once
    pollTaskStatus();

    // Then set up interval for continued polling (every 1 second)
    pollingRef.current = setInterval(pollTaskStatus, 1000);

    // Clean up on unmount
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, [taskId, onComplete, onError]);

  // Get alert styling based on status
  const getAlertClass = () => {
    switch (status) {
      case 'completed': return 'alert-success';
      case 'failed':
      case 'error': return 'alert-error';
      case 'cancelled': return 'alert-warning';
      default: return 'alert-info';
    }
  };

  // Status icon
  const getStatusIcon = () => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-5 w-5" />;
      case 'failed':
      case 'error': return <XCircle className="h-5 w-5" />;
      case 'cancelled': return <AlertTriangle className="h-5 w-5" />;
      default: return <Loader2 className="h-5 w-5 animate-spin" />;
    }
  };

  const handleCancelTask = async () => {
    try {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }

      await api.uploads.terminateTask(taskId);

      setStatus('cancelled');
      setMessage('Upload cancelled by user');
    } catch (error) {
      console.error('Error cancelling task:', error);
      setErrorMessage('Failed to cancel task. Network error.');
    }
  };

  return (
    <div className={`alert ${getAlertClass()} shadow-lg mb-4`}>
      <div className="flex-1">
        <div className="font-bold capitalize flex items-center gap-2">
          {getStatusIcon()}
          {status}
        </div>
        <div className="text-sm">{errorMessage || message}</div>

        {/* Show video count for playlists if available */}
        {videoCount && (
          <div className="text-sm flex items-center gap-1 mt-1">
            <ListPlus className="h-4 w-4" />
            <span>{videoCount} videos in playlist</span>
          </div>
        )}

        {status === 'processing' && (
          <div className="mt-3">
            <div className="flex justify-between text-xs mb-1">
              <span className="font-medium">{progress}% Complete</span>
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
            aria-label="Cancel upload task"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}