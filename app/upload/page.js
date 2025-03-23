'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import { useAuth } from '@/components/context/AuthContext';
import { api } from '@/utils/api';
import websocketManager from '@/utils/websocket';
import Link from 'next/link';

export default function UploadPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const fileInputRef = useRef(null);
  const [uploadType, setUploadType] = useState('file');
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState(null);
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [progress, setProgress] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [taskId, setTaskId] = useState(null);
  const [clientId] = useState(() => uuidv4());

  useEffect(() => {
    // Check authentication
    if (!isLoading && !user) {
      router.push('/auth/login');
    }
  }, [user, isLoading, router]);

  // Connect to WebSocket for upload progress updates
  useEffect(() => {
    if (user) {
      const connectWebSocket = async () => {
        await websocketManager.connect();
        console.log('WebSocket connected for uploads');

        // Listen for upload progress updates
        websocketManager.on('upload_progress', handleProgressUpdate);
      };

      connectWebSocket();
    }

    return () => {
      websocketManager.off('upload_progress', handleProgressUpdate);
    };
  }, [user]);

  // Check task status on mount
  useEffect(() => {
    const checkTaskStatus = async () => {
      if (!taskId) return;

      try {
        const status = await api.uploads.status(taskId);
        setProgress(status);
      } catch (err) {
        console.error('Error checking task status:', err);
      }
    };

    checkTaskStatus();
  }, [taskId]);

  const handleProgressUpdate = (data) => {
    if (data.type === 'upload_progress' || data.task_id === taskId) {
      setProgress(data);

      if (data.status === 'completed') {
        setSuccess('Upload completed successfully!');
        setTaskId(null);
      } else if (data.status === 'failed') {
        setError(`Upload failed: ${data.message || 'Unknown error'}`);
        setTaskId(null);
      }
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError(null);
    }
  };

  const handleYoutubeUrlChange = (e) => {
    setYoutubeUrl(e.target.value);
    setError(null);
  };

  const resetForm = () => {
    setFile(null);
    setYoutubeUrl('');
    setError(null);
    setSuccess(null);
    setProgress(null);
    setTaskId(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    setUploading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setProgress(null);
    setTaskId(null);
    setUploading(true);

    try {
      // Ensure we have a client ID
      if (!clientId) {
        throw new Error('Unable to generate client ID for upload. Please refresh the page and try again.');
      }

      console.log('Using client ID for upload:', clientId);

      let response;
      // Handle file upload
      if (uploadType === 'file') {
        if (!file) {
          throw new Error('Please select a file to upload');
        }

        console.log('Uploading file:', file.name, 'with client ID:', clientId);

        response = await api.uploads.file(file, clientId);
      } else {
        // Handle YouTube upload
        response = await api.uploads.youtube(youtubeUrl, clientId);
      }

      console.log('Upload response:', response);

      if (response.task_id) {
        setTaskId(response.task_id);
        setProgress({
          task_id: response.task_id,
          status: 'pending',
          progress: 0,
          message: 'Upload started...'
        });
        setSuccess('Upload initiated successfully. Processing...');
      } else {
        setSuccess('Upload completed successfully!');
        setUploading(false);
      }
    } catch (err) {
      console.error('Upload error:', err);
      setError(err.message || 'Upload failed. Please try again.');
      setUploading(false);
    }
  };

  const handleCancel = async () => {
    if (taskId) {
      try {
        await api.uploads.terminateTask(taskId);
        setError('Upload canceled');
      } catch (err) {
        console.error('Error canceling task:', err);
      } finally {
        setTaskId(null);
        setUploading(false);
      }
    } else {
      setUploading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-200 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">Upload Learning Materials</h1>
          <Link href="/dashboard" className="btn btn-primary">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 15l-3-3m0 0l3-3m-3 3h8M3 12a9 9 0 1118 0 9 9 0 01-18 0z" />
            </svg>
            Back to Dashboard
          </Link>
        </div>

        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title text-2xl font-bold">Upload Learning Material</h2>

            {progress && (
              <div className="mb-6">
                <div className="card bg-base-200">
                  <div className="card-body">
                    <h3 className="card-title text-lg">
                      {progress.status === 'completed' ? 'Upload Complete!' :
                       'Upload Status'}
                    </h3>

                    <div className="flex flex-col gap-2">
                      <div className="flex justify-between text-sm">
                        <span>Status: </span>
                        <span className="badge badge-outline">
                          {progress.status === 'pending' ? 'Processing' :
                           progress.status === 'in_progress' ? 'In Progress' :
                           progress.status === 'completed' ? 'Completed' :
                           progress.status === 'failed' ? 'Failed' : progress.status}
                        </span>
                      </div>

                      {progress.progress !== undefined && (
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>Progress:</span>
                            <span>{Math.round(progress.progress * 100)}%</span>
                          </div>
                          <progress
                            className="progress progress-primary w-full"
                            value={progress.progress * 100}
                            max="100"
                          ></progress>
                        </div>
                      )}

                      {progress.message && (
                        <div className="text-sm mt-2">{progress.message}</div>
                      )}

                      {progress.status !== 'completed' && progress.status !== 'failed' && (
                        <button
                          className="btn btn-sm btn-error mt-2"
                          onClick={handleCancel}
                        >
                          Cancel Upload
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="alert alert-error mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="alert alert-success mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{success}</span>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="tabs tabs-boxed mb-4">
                <button
                  type="button"
                  className={`tab ${uploadType === 'file' ? 'tab-active' : ''}`}
                  onClick={() => setUploadType('file')}
                >
                  Upload File
                </button>
                <button
                  type="button"
                  className={`tab ${uploadType === 'youtube' ? 'tab-active' : ''}`}
                  onClick={() => setUploadType('youtube')}
                >
                  YouTube URL
                </button>
              </div>

              <div className="mb-6">
                {uploadType === 'file' ? (
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">Upload PDF, DOCX, or other document files</span>
                    </label>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      className="file-input file-input-bordered w-full"
                      accept=".pdf,.docx,.txt,.md"
                      disabled={uploading}
                    />
                    {file && (
                      <div className="mt-2">
                        <span className="text-sm">Selected file: {file.name}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">YouTube URL</span>
                    </label>
                    <input
                      type="url"
                      value={youtubeUrl}
                      onChange={handleYoutubeUrlChange}
                      placeholder="https://www.youtube.com/watch?v=..."
                      className="input input-bordered w-full"
                      disabled={uploading}
                    />
                  </div>
                )}
              </div>

              <div className="card-actions justify-end">
                <button
                  type="button"
                  onClick={resetForm}
                  className="btn btn-ghost"
                >
                  Reset
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={uploading}
                >
                  {uploading ? 'Uploading...' : 'Upload'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
