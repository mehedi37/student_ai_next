'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/utils/api';
import { useAuth } from '@/components/context/AuthContext';
import { v4 as uuidv4 } from 'uuid';
import { FileUp, Youtube, X, AlertTriangle, CheckCircle, Upload, Loader2, Info, XCircle } from 'lucide-react';
import { useWebSocket } from '../contexts/WebSocketContext';
import UploadProgress from '../components/UploadProgress';

export default function UploadPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const { clientId } = useWebSocket();
  const [uploading, setUploading] = useState(false);
  const [fileInput, setFileInput] = useState(null);
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [toasts, setToasts] = useState([]);
  const [youtubePreview, setYoutubePreview] = useState(null);
  const [currentTaskId, setCurrentTaskId] = useState(null);

  // Redirect if not logged in
  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/auth/login');
    }
  }, [user, isLoading, router]);

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
    setCurrentTaskId(null);
    if (document.getElementById('file-input')) {
      document.getElementById('file-input').value = '';
    }
  };

  // Handle task cancellation
  const handleCancelTask = async () => {
    if (!currentTaskId) {
      addToast({
        id: uuidv4(),
        type: 'error',
        message: 'No active task to cancel',
        autoClose: true
      });
      return;
    }

    try {
      const response = await fetch(`/api/uploads/cancel/${currentTaskId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ client_id: clientId })
      });

      if (response.ok) {
        addToast({
          id: uuidv4(),
          type: 'info',
          message: 'Upload task cancelled successfully',
          autoClose: true
        });
        setUploading(false);
      } else {
        throw new Error('Failed to cancel task');
      }
    } catch (error) {
      console.error('Error cancelling task:', error);
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
          setCurrentTaskId(response.task_id);
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
          setCurrentTaskId(response.task_id);
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

    // Extract video ID for preview
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
    } else {
      setYoutubePreview(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  // Get alert style based on status
  const getAlertClass = (status) => {
    switch (status) {
      case 'completed': return 'alert-success';
      case 'failed':
      case 'error': return 'alert-error';
      case 'cancelled': return 'alert-warning';
      default: return 'alert-info';
    }
  };

  return (
    <div className="container mx-auto max-w-3xl px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">Upload Content</h1>

      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          {/* Progress indicator */}
          {currentTaskId && (
            <UploadProgress
              clientId={clientId}
              taskId={currentTaskId}
              onComplete={(data) => {
                setUploading(false);
                addToast({
                  id: uuidv4(),
                  type: 'success',
                  message: 'Upload completed successfully!',
                  autoClose: true
                });

                // Reset form and reload page after short delay
                setTimeout(() => {
                  handleReset();
                  window.location.reload();
                }, 2000);
              }}
              onError={(error) => {
                setUploading(false);
                addToast({
                  id: uuidv4(),
                  type: 'error',
                  message: error,
                  autoClose: true
                });
              }}
            />
          )}

          {/* Upload form - disable when processing */}
          <form onSubmit={handleSubmit} className={uploading ? 'opacity-50 pointer-events-none' : ''}>
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
              <p>Current Task ID: {currentTaskId}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Toast messages */}
      <div className="toast toast-end z-50">
        {toasts.map(toast => (
          <div key={toast.id} className={`alert ${toast.type ? `alert-${toast.type}` : 'alert-info'}`}>
            <div>
              {toast.type === 'error' && <AlertTriangle className="w-5 h-5" />}
              {toast.type === 'success' && <CheckCircle className="w-5 h-5" />}
              {toast.type === 'info' && <Info className="w-5 h-5" />}
              {toast.type === 'warning' && <AlertTriangle className="w-5 h-5" />}
              <span>{toast.message}</span>
            </div>
            <button onClick={() => removeToast(toast.id)} className="btn btn-sm btn-ghost">
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
