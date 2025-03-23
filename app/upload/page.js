'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/utils/api';
import { useAuth } from '@/components/context/AuthContext';
import { v4 as uuidv4 } from 'uuid';
import websocketManager from '@/utils/websocket';
import { FileUp, Youtube, X, AlertTriangle, CheckCircle, Upload, Loader2, Info, XCircle } from 'lucide-react';
import { useTaskProgress } from './useTaskProgress';

export default function UploadPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const clientId = uuidv4();
  const [uploading, setUploading] = useState(false);
  const [fileInput, setFileInput] = useState(null);
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [toasts, setToasts] = useState([]);
  const [youtubePreview, setYoutubePreview] = useState(null);

  // Use the task progress hook
  const { taskId, setTaskId, progress, error, cancelTask, isWebSocketConnected } = useTaskProgress();

  // Redirect if not logged in
  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/auth/login');
    }
  }, [user, isLoading, router]);

  // Connect to WebSocket for general upload progress updates
  useEffect(() => {
    if (user) {
      const connectWebSocket = async () => {
        await websocketManager.connect(clientId);
        console.log('WebSocket connected for uploads with client ID:', clientId);
      };

      connectWebSocket();
    }
  }, [user, clientId]);

  // Handle error from task progress hook
  useEffect(() => {
    if (error) {
      addToast({
        id: uuidv4(),
        type: 'error',
        message: error,
        autoClose: true
      });
    }
  }, [error]);

  // Show a notification if using fallback polling instead of WebSocket
  useEffect(() => {
    if (taskId && !isWebSocketConnected) {
      addToast({
        id: 'websocket-fallback',
        type: 'warning',
        message: 'Using polling for progress updates. Real-time updates unavailable.',
        autoClose: false
      });
    }
  }, [taskId, isWebSocketConnected]);

  // Add a toast to the list
  const addToast = (toast) => {
    setToasts(prev => [...prev, toast]);

    // Auto-remove toast after delay if autoClose is true
    if (toast.autoClose) {
      setTimeout(() => {
        removeToast(toast.id);
      }, 5000);
    }
  };

  // Remove a toast by id
  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  // Handle file change
  const handleFileChange = (e) => {
    setFileInput(e.target.files[0]);
  };

  // Reset file input
  const handleReset = () => {
    setFileInput(null);
    setYoutubeUrl('');
    setYoutubePreview(null);
    setTaskId(null);
    if (document.getElementById('file-input')) {
      document.getElementById('file-input').value = '';
    }
  };

  // Handle task cancellation
  const handleCancelTask = async () => {
    if (!taskId) {
      addToast({
        id: uuidv4(),
        type: 'error',
        message: 'No active task to cancel',
        autoClose: true
      });
      return;
    }

    const success = await cancelTask();

    if (success) {
      addToast({
        id: uuidv4(),
        type: 'info',
        message: 'Upload task cancelled successfully',
        autoClose: true
      });

      setUploading(false);
    } else {
      addToast({
        id: uuidv4(),
        type: 'error',
        message: 'Failed to cancel task. It may have already completed or failed.',
        autoClose: true
      });
    }
  };

  // Submit form for file upload
  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);

    try {
      let response;

      if (fileInput) {
        console.log('Uploading file:', fileInput.name, 'with client ID:', clientId);

        // Pass the file directly to the API utility
        response = await api.uploads.file(fileInput, clientId);

        // Set task ID for tracking progress
        if (response.task_id) {
          setTaskId(response.task_id);
        }

        addToast({
          id: uuidv4(),
          type: 'info',
          message: 'File upload started',
          autoClose: true
        });
      } else if (youtubeUrl) {
        // Pass the URL as a string - the API utility will format it correctly
        response = await api.uploads.youtube(youtubeUrl, clientId);

        if (response.task_id) {
          setTaskId(response.task_id);
        }

        addToast({
          id: uuidv4(),
          type: 'info',
          message: 'YouTube processing started',
          autoClose: true
        });
      } else {
        addToast({
          id: uuidv4(),
          type: 'error',
          message: 'Please select a file or enter a YouTube URL',
          autoClose: true
        });
        setUploading(false);
        return;
      }

    } catch (error) {
      console.error('Upload error:', error);
      addToast({
        id: uuidv4(),
        type: 'error',
        message: error.message || 'Upload failed',
        autoClose: true
      });
      setUploading(false);
    }
  };

  // Update YouTube preview
  const updateYoutubePreview = (url) => {
    setYoutubeUrl(url);

    // Reset preview if URL is empty
    if (!url) {
      setYoutubePreview(null);
      return;
    }

    // Extract video ID
    let videoId = null;
    if (url.includes('youtube.com/watch')) {
      const urlParams = new URLSearchParams(url.split('?')[1]);
      videoId = urlParams.get('v');
    } else if (url.includes('youtu.be/')) {
      videoId = url.split('youtu.be/')[1].split('?')[0];
    }

    if (videoId) {
      setYoutubePreview({
        videoId,
        thumbnailUrl: `https://img.youtube.com/vi/${videoId}/0.jpg`,
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  // Render toast icon based on type
  const renderToastIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-6 h-6" />;
      case 'error':
        return <AlertTriangle className="w-6 h-6" />;
      case 'warning':
        return <AlertTriangle className="w-6 h-6" />;
      case 'info':
      default:
        return <Info className="w-6 h-6" />;
    }
  };

  // Map status to alert type
  const getAlertType = (status) => {
    switch (status) {
      case 'completed': return 'alert-success';
      case 'cancelled':
      case 'failed': return 'alert-error';
      case 'in_progress': return 'alert-info';
      case 'pending': return 'alert-warning';
      default: return '';
    }
  };

  return (
    <div className="min-h-screen bg-base-100 p-4">
      {/* Toast container */}
      <div className="toast toast-end toast-top z-50">
        {toasts.map(toast => (
          <div key={toast.id} className={`alert ${toast.type === 'success' ? 'alert-success' : toast.type === 'error' ? 'alert-error' : toast.type === 'warning' ? 'alert-warning' : 'alert-info'}`}>
            <div className="flex items-center gap-2">
              {renderToastIcon(toast.type)}
              <span>{toast.message}</span>
            </div>
            <button onClick={() => removeToast(toast.id)} className="btn btn-circle btn-xs">
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      <div className="max-w-3xl mx-auto">
        <div className="card bg-base-200 shadow-lg">
          <div className="card-body">
            <h1 className="card-title text-2xl font-bold mb-6">Upload Documents</h1>

            {/* Connection status indicator */}
            {taskId && (
              <div className="mb-4">
                <div className={`badge ${isWebSocketConnected ? 'badge-success' : 'badge-warning'}`}>
                  {isWebSocketConnected ? 'Real-time updates' : 'Polling for updates'}
                </div>
              </div>
            )}

            {/* Progress indicator with cancel button */}
            {progress && (
              <div className="mb-6">
                <div className={`alert ${getAlertType(progress.status)}`}>
                  <div className="flex flex-col gap-2 w-full">
                    <div className="flex justify-between items-center">
                      <h3 className="font-bold">
                        {progress.status === 'completed' ? 'Upload Complete!' :
                         progress.status === 'cancelled' ? 'Upload Cancelled' :
                         progress.status === 'pending' ? 'Processing' :
                         progress.status === 'in_progress' ? 'In Progress' :
                         progress.status === 'failed' ? 'Failed' : progress.status}
                      </h3>

                      {/* Cancel button - show for pending or in_progress status */}
                      {(progress.status === 'pending' || progress.status === 'in_progress') && (
                        <button
                          onClick={handleCancelTask}
                          className="btn btn-sm btn-error"
                          disabled={!taskId}
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          Cancel Task
                        </button>
                      )}
                    </div>

                    {/* Current operation indicator */}
                    {progress.current_operation && (
                      <div className="badge badge-info mb-2">{progress.current_operation}</div>
                    )}

                    {/* Progress bar */}
                    {progress.percentage !== undefined && (
                      <div className="w-full">
                        <div className="flex justify-between mb-1">
                          <span>{progress.current || 0} of {progress.total || 0} chunks</span>
                          <span>{progress.percentage}%</span>
                        </div>
                        <progress
                          className={`progress w-full ${
                            progress.status === 'completed' ? 'progress-success' :
                            progress.status === 'failed' || progress.status === 'cancelled' ? 'progress-error' :
                            'progress-primary'
                          }`}
                          value={progress.percentage}
                          max="100"
                        ></progress>
                      </div>
                    )}

                    {/* Status message */}
                    {progress.message && (
                      <div className="text-sm mt-2">
                        <strong>Status:</strong> {progress.message}
                      </div>
                    )}

                    {/* Show document type */}
                    {progress.metadata && progress.metadata.source_type && (
                      <div className="badge badge-outline mt-2">
                        {progress.metadata.source_type}
                      </div>
                    )}

                    {/* Loading indicator */}
                    {(progress.status === 'pending' || progress.status === 'in_progress') && (
                      <div className="flex items-center justify-center mt-2">
                        <span className="loading loading-dots loading-md"></span>
                      </div>
                    )}

                    {/* Show additional information */}
                    {progress.metadata && Object.keys(progress.metadata).length > 0 && (
                      <div className="mt-2 text-sm opacity-80">
                        <div className="divider divider-sm">Details</div>
                        <ul className="list">
                          {Object.entries(progress.metadata).map(([key, value]) => (
                            <li key={key} className="list-row">
                              <span className="font-medium">{key}: </span>
                              <span>{typeof value === 'object' ? JSON.stringify(value) : value}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Show document information when completed */}
                    {progress.status === 'completed' && progress.document_id && (
                      <div className="mt-4 flex justify-center">
                        <button
                          onClick={() => router.push('/dashboard')}
                          className="btn btn-primary"
                        >
                          View Document
                        </button>
                      </div>
                    )}

                    {/* Show try again button when failed or cancelled */}
                    {(progress.status === 'failed' || progress.status === 'cancelled') && (
                      <div className="mt-4 flex justify-center">
                        <button
                          onClick={handleReset}
                          className="btn btn-outline"
                        >
                          Try Again
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Upload form - disable when processing */}
            <form onSubmit={handleSubmit} className={progress && ['in_progress', 'pending'].includes(progress.status) ? 'opacity-50 pointer-events-none' : ''}>
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Upload a document</span>
                  <span className="label-text-alt">(PDF, Word, Text, Images)</span>
                </label>

                <div className="flex flex-col gap-4">
                  <div className="join">
                    <input
                      id="file-input"
                      type="file"
                      accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
                      onChange={handleFileChange}
                      className="file-input file-input-bordered w-full join-item"
                      disabled={uploading}
                    />
                    {fileInput && (
                      <button
                        type="button"
                        onClick={handleReset}
                        className="btn btn-error join-item"
                        disabled={uploading}
                      >
                        <X className="w-5 h-5" />
                      </button>
                    )}
                  </div>

                  <div className="divider">OR</div>

                  <div className="join">
                    <input
                      type="text"
                      placeholder="Enter YouTube URL"
                      value={youtubeUrl}
                      onChange={(e) => updateYoutubePreview(e.target.value)}
                      className="input input-bordered w-full join-item"
                      disabled={uploading}
                    />
                    {youtubeUrl && (
                      <button
                        type="button"
                        onClick={handleReset}
                        className="btn btn-error join-item"
                        disabled={uploading}
                      >
                        <X className="w-5 h-5" />
                      </button>
                    )}
                  </div>

                  {youtubePreview && (
                    <div className="mt-2 card card-side bg-base-200 shadow-sm">
                      <figure className="w-32">
                        <img src={youtubePreview.thumbnailUrl} alt="YouTube thumbnail" />
                      </figure>
                      <div className="card-body p-4">
                        <div className="text-sm">Video ID: {youtubePreview.videoId}</div>
                        <div className="text-xs opacity-60">Ready to process</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-6">
                <button
                  type="submit"
                  className="btn btn-primary w-full"
                  disabled={uploading || (!fileInput && !youtubeUrl)}
                >
                  {uploading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin mr-2" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-5 h-5 mr-2" />
                      Upload
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Debug information in collapsible section */}
            <div className="collapse collapse-arrow mt-8">
              <input type="checkbox" className="peer" />
              <div className="collapse-title text-sm font-medium opacity-60">
                Debug Information
              </div>
              <div className="collapse-content text-xs opacity-50">
                <p>Client ID: {clientId}</p>
                {taskId && <p>Task ID: {taskId}</p>}
                <p>WebSocket Connected: {isWebSocketConnected ? 'Yes' : 'No'}</p>
                {progress && <p>Last updated: {progress.last_updated ? new Date(progress.last_updated).toLocaleString() : 'N/A'}</p>}
                {progress && <p>Status: {progress.status}</p>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
