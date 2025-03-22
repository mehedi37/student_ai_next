'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/context/AuthContext';
import { api } from '@/utils/api';
import websocketManager from '@/utils/websocket';
import Link from 'next/link';

export default function UploadPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [file, setFile] = useState(null);
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [uploadType, setUploadType] = useState('file');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(null);
  const [error, setError] = useState('');
  const [wsConnected, setWsConnected] = useState(false);
  const [taskId, setTaskId] = useState(null);
  const [processingStage, setProcessingStage] = useState('');

  // Redirect if not logged in
  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/auth/login');
    }
  }, [user, isLoading, router]);

  // Connect to WebSocket for progress updates
  useEffect(() => {
    if (user && !wsConnected) {
      websocketManager.connect()
        .then(() => {
          setWsConnected(true);
          console.log('WebSocket connected for uploads');

          // Listen for upload progress updates
          websocketManager.on('upload_progress', handleProgressUpdate);
        })
        .catch(err => {
          console.error('Failed to connect to WebSocket:', err);
        });
    }

    return () => {
      if (wsConnected) {
        websocketManager.off('upload_progress', handleProgressUpdate);
      }
    };
  }, [user, wsConnected]);

  // Set up polling for progress if WebSockets aren't available
  useEffect(() => {
    let pollingInterval;

    if (taskId && !wsConnected) {
      pollingInterval = setInterval(() => {
        fetchProgress(taskId);
      }, 2000); // Poll every 2 seconds
    }

    return () => {
      if (pollingInterval) clearInterval(pollingInterval);
    };
  }, [taskId, wsConnected]);

  const fetchProgress = async (taskId) => {
    try {
      const status = await api.uploads.status(taskId);
      handleProgressUpdate(status);
    } catch (err) {
      console.error('Error fetching progress:', err);
    }
  };

  const handleProgressUpdate = (data) => {
    if (data.type === 'upload_progress' || data.task_id === taskId) {
      setProgress(data);

      // Update processing stage based on status or explicit stage field
      if (data.stage) {
        setProcessingStage(data.stage);
      } else if (data.status === 'processing') {
        // Determine stage from metadata if available
        if (data.metadata && data.metadata.stage) {
          setProcessingStage(data.metadata.stage);
        } else if (data.percentage < 20) {
          setProcessingStage('initializing');
        } else if (data.percentage < 40) {
          setProcessingStage('extracting');
        } else if (data.percentage < 90) {
          setProcessingStage('embedding');
        } else {
          setProcessingStage('finalizing');
        }
      } else {
        setProcessingStage(data.status);
      }

      // If processing is complete, reset the form
      if (data.status === 'completed') {
        setTimeout(() => {
          setFile(null);
          setYoutubeUrl('');
          setUploading(false);
          setProgress(null);
          setTaskId(null);
          setProcessingStage('');
        }, 3000);
      }
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
    setError('');
  };

  const handleYoutubeUrlChange = (e) => {
    setYoutubeUrl(e.target.value);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setUploading(true);

    try {
      // Always get the client ID - even if not connected, the WebSocketManager has generated one
      const clientId = websocketManager ? websocketManager.getClientId() : null;

      if (!clientId) {
        throw new Error('Unable to generate client ID for upload. Please refresh the page and try again.');
      }

      console.log('Using client ID for upload:', clientId);

      let response;

      if (uploadType === 'file') {
        if (!file) {
          throw new Error('Please select a file to upload');
        }

        // Log for debugging
        console.log('Uploading file:', file.name, 'with client ID:', clientId);

        response = await api.uploads.file(file, clientId);
      } else {
        if (!youtubeUrl.trim()) {
          throw new Error('Please enter a YouTube URL');
        }
        response = await api.uploads.youtube(youtubeUrl, clientId);
      }

      console.log('Upload response:', response);
      setTaskId(response.task_id);
      setProgress({
        current: 0,
        total: 100,
        percentage: 0,
        status: 'processing',
        task_id: response.task_id,
        document_id: response.document_id
      });

      // If no WebSocket and no task_id for polling, consider it done
      if (!wsConnected && !response.task_id) {
        setTimeout(() => {
          setFile(null);
          setYoutubeUrl('');
          setUploading(false);
          setProgress(null);
        }, 2000);
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
        setUploading(false);
        setProgress(null);
        setTaskId(null);
      }
    } else {
      setUploading(false);
      setProgress(null);
    }
  };

  const getStageDescription = (stage) => {
    switch (stage) {
      case 'initializing':
        return 'Preparing your document for processing...';
      case 'extracting':
        return 'Extracting text content from your document...';
      case 'embedding':
        return 'Generating AI-readable embeddings for your content...';
      case 'finalizing':
        return 'Finalizing and saving your document...';
      case 'completed':
        return 'Processing complete! Your document is ready.';
      case 'failed':
        return 'Processing failed. Please try again.';
      default:
        return 'Processing your document...';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-gray-900 p-4 text-white">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold">Student AI Bot</h1>
          <Link href="/dashboard" className="bg-blue-600 px-4 py-2 rounded hover:bg-blue-700">
            Back to Dashboard
          </Link>
        </div>
      </header>

      <main className="container mx-auto py-8 px-4">
        <div className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow">
          <h2 className="text-2xl font-bold mb-6">Upload Learning Material</h2>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          {progress ? (
            <div className="mb-6">
              <h3 className="font-medium mb-2">
                {progress.status === 'processing' ? 'Processing...' :
                 progress.status === 'completed' ? 'Upload Complete!' :
                 'Upload Status'}
              </h3>

              {/* Stage description */}
              <p className="text-sm text-gray-600 mb-3">
                {getStageDescription(processingStage)}
              </p>

              {/* Progress bar */}
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                  style={{ width: `${progress.percentage}%` }}
                ></div>
              </div>

              <div className="flex justify-between mt-2 text-sm text-gray-600">
                <span>{processingStage || progress.status}</span>
                <span>{progress.percentage}%</span>
              </div>

              {/* Detailed embedding information if available */}
              {processingStage === 'embedding' && progress.metadata && (
                <div className="mt-3 p-3 bg-gray-50 rounded text-sm">
                  <p className="font-medium">Embedding Progress:</p>
                  {progress.metadata.chunks_embedded && (
                    <p>Chunks embedded: {progress.metadata.chunks_embedded} of {progress.metadata.total_chunks || progress.total}</p>
                  )}
                  {progress.metadata.current_file && (
                    <p>Current file: {progress.metadata.current_file}</p>
                  )}
                  {progress.metadata.remaining_files > 0 && (
                    <p>Remaining files: {progress.metadata.remaining_files}</p>
                  )}
                </div>
              )}

              {progress.status !== 'completed' && (
                <button
                  onClick={handleCancel}
                  className="mt-4 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                >
                  Cancel
                </button>
              )}

              {progress.status === 'completed' && (
                <div className="mt-4 text-green-600">
                  Your document has been processed and is now available for AI interaction!
                </div>
              )}
            </div>
          ) : (
            <div className="mb-6">
              <div className="flex border-b border-gray-200 mb-4">
                <button
                  className={`py-2 px-4 ${uploadType === 'file' ? 'border-b-2 border-blue-500' : ''}`}
                  onClick={() => setUploadType('file')}
                >
                  Upload File
                </button>
                <button
                  className={`py-2 px-4 ${uploadType === 'youtube' ? 'border-b-2 border-blue-500' : ''}`}
                  onClick={() => setUploadType('youtube')}
                >
                  YouTube Video
                </button>
              </div>

              <form onSubmit={handleSubmit}>
                {uploadType === 'file' ? (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select File (PDF, DOCX, TXT)
                    </label>
                    <input
                      type="file"
                      onChange={handleFileChange}
                      className="w-full border border-gray-300 p-2 rounded"
                      accept=".pdf,.docx,.doc,.txt"
                      disabled={uploading}
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      Maximum file size: 50MB
                    </p>
                  </div>
                ) : (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      YouTube URL
                    </label>
                    <input
                      type="url"
                      value={youtubeUrl}
                      onChange={handleYoutubeUrlChange}
                      placeholder="https://www.youtube.com/watch?v=..."
                      className="w-full border border-gray-300 p-2 rounded"
                      disabled={uploading}
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      Enter the full YouTube video URL
                    </p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={uploading}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:bg-blue-300"
                >
                  {uploading ? 'Uploading...' : 'Upload'}
                </button>
              </form>
            </div>
          )}

          <div className="border-t border-gray-200 pt-4 mt-4">
            <h3 className="font-medium mb-2">Supported Formats</h3>
            <ul className="list-disc list-inside text-sm text-gray-600">
              <li>PDF documents</li>
              <li>Word documents (.docx, .doc)</li>
              <li>Text files (.txt)</li>
              <li>YouTube videos (via URL)</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}
