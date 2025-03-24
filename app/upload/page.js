'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/utils/api';
import { useAuth } from '@/components/context/AuthContext';
import { v4 as uuidv4 } from 'uuid';
import websocketManager from '@/utils/websocket';
import Link from 'next/link';
import ThemeSwitcher from '@/components/ThemeSwitcher';
import {
  FileUp,
  Youtube,
  X,
  AlertTriangle,
  CheckCircle,
  Upload as UploadIcon,
  Loader2,
  Info,
  XCircle,
  File,
  Trash2,
  ExternalLink,
  Wifi,
  WifiOff,
  Link as LinkIcon,
  Home,
  Menu,
  User,
  LogOut
} from 'lucide-react';
import { useTaskProgress } from './useTaskProgress';

export default function UploadPage() {
  const router = useRouter();
  const { user, isLoading, logout } = useAuth();
  const clientId = `client_${uuidv4().replace(/-/g, "")}`;
  const [uploading, setUploading] = useState(false);
  const [fileInput, setFileInput] = useState(null);
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [toasts, setToasts] = useState([]);
  const [youtubePreview, setYoutubePreview] = useState(null);
  const [isPlaylist, setIsPlaylist] = useState(false);
  const [activeTab, setActiveTab] = useState('file');
  const [wsStatus, setWsStatus] = useState({connected: false, lastMessage: null});
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const youtubeInputRef = useRef(null);
  const fileDropRef = useRef(null);

  // Use the task progress hook
  const {
    taskId,
    setTaskId,
    progress,
    error,
    cancelTask,
    resetTask,
    isWebSocketConnected
  } = useTaskProgress();

  // Connect to WebSocket for general upload progress updates
  useEffect(() => {
    if (user) {
      const connectWebSocket = async () => {
        try {
          await websocketManager.connect(clientId);
          console.log('WebSocket connected for uploads with client ID:', clientId);
          setWsStatus(prev => ({...prev, connected: true}));
        } catch (error) {
          console.error('WebSocket connection failed:', error);
          setWsStatus(prev => ({...prev, connected: false}));
        }

        // Add event listeners for connection status
        const handleConnection = () => {
          setWsStatus(prev => ({...prev, connected: true}));
        };

        const handleDisconnection = () => {
          setWsStatus(prev => ({...prev, connected: false}));
        };

        websocketManager.on('connected', handleConnection);
        websocketManager.on('disconnected', handleDisconnection);

        // General event listener for all messages to debug
        websocketManager.on('upload_progress', (data) => {
          console.log('WebSocket message received:', data);
          setWsStatus(prev => ({...prev, lastMessage: data}));
        });

        return () => {
          websocketManager.off('connected', handleConnection);
          websocketManager.off('disconnected', handleDisconnection);
        };
      };

      connectWebSocket();
    }

    return () => {
      // Clean up on component unmount
      if (taskId) {
        resetTask();
      }
    };
  }, [user, clientId, taskId, resetTask]);

  // Handle drag and drop for file upload
  useEffect(() => {
    const dropArea = fileDropRef.current;
    if (!dropArea) return;

    const highlight = () => {
      dropArea.classList.add('border-primary');
      dropArea.classList.add('bg-primary/5');
    };

    const unhighlight = () => {
      dropArea.classList.remove('border-primary');
      dropArea.classList.remove('bg-primary/5');
    };

    const handleDrop = (e) => {
      e.preventDefault();
      e.stopPropagation();
      unhighlight();

      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        const file = e.dataTransfer.files[0];
        setFileInput(file);
        setActiveTab('file');
        setYoutubeUrl('');
        setYoutubePreview(null);
        setIsPlaylist(false);
      }
    };

    const preventDefaults = (e) => {
      e.preventDefault();
      e.stopPropagation();
    };

    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
      dropArea.addEventListener(eventName, preventDefaults, false);
    });

    ['dragenter', 'dragover'].forEach(eventName => {
      dropArea.addEventListener(eventName, highlight, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
      dropArea.addEventListener(eventName, unhighlight, false);
    });

    dropArea.addEventListener('drop', handleDrop, false);

    return () => {
      if (dropArea) {
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
          dropArea.removeEventListener(eventName, preventDefaults);
        });

        ['dragenter', 'dragover'].forEach(eventName => {
          dropArea.removeEventListener(eventName, highlight);
        });

        ['dragleave', 'drop'].forEach(eventName => {
          dropArea.removeEventListener(eventName, unhighlight);
        });

        dropArea.removeEventListener('drop', handleDrop);
      }
    };
  }, []);

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

  // Reset form when task completes successfully
  useEffect(() => {
    if (progress?.status === 'completed') {
      setUploading(false);

      // Add success toast
      addToast({
        id: uuidv4(),
        type: 'success',
        message: 'Processing completed successfully!',
        autoClose: true
      });

      // Reset form after a delay
      setTimeout(() => {
        handleReset();
      }, 3000);
    }
  }, [progress]);

  // Add a toast to the list
  const addToast = (toast) => {
    setToasts(prev => {
      // Remove duplicates with same id
      const filtered = prev.filter(t => t.id !== toast.id);
      return [...filtered, toast];
    });

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
    const file = e.target.files[0];
    if (file) {
      setFileInput(file);
      setActiveTab('file');

      // Reset YouTube inputs when file is selected
      setYoutubeUrl('');
      setYoutubePreview(null);
      setIsPlaylist(false);
    }
  };

  // Reset file input
  const handleReset = () => {
    setFileInput(null);
    setYoutubeUrl('');
    setYoutubePreview(null);
    setIsPlaylist(false);
    resetTask();
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

  // Handle YouTube URL selection (ensure text field is entirely selectable)
  const handleYoutubeUrlClick = () => {
    if (youtubeInputRef.current) {
      youtubeInputRef.current.select();
    }
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      await logout();
      router.push('/auth');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Submit form for file upload
  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);

    try {
      let response;

      if (activeTab === 'file' && fileInput) {
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
      } else if (activeTab === 'youtube' && youtubeUrl) {
        // Pass the URL as a string - the API utility will format it correctly
        response = await api.uploads.youtube(youtubeUrl, clientId);

        if (response.task_id) {
          setTaskId(response.task_id);
        }

        // Check if it's a playlist from the response
        if (response.is_playlist) {
          addToast({
            id: uuidv4(),
            type: 'info',
            message: `Processing YouTube playlist with ${response.video_count || 'multiple'} videos`,
            autoClose: true
          });
        } else {
          addToast({
            id: uuidv4(),
            type: 'info',
            message: 'YouTube video processing started',
            autoClose: true
          });
        }
      } else {
        addToast({
          id: uuidv4(),
          type: 'error',
          message: activeTab === 'file'
            ? 'Please select a file to upload'
            : 'Please enter a YouTube URL',
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
    setActiveTab('youtube');

    // Reset file input when YouTube URL is entered
    if (url && fileInput) {
      setFileInput(null);
      if (document.getElementById('file-input')) {
        document.getElementById('file-input').value = '';
      }
    }

    // Reset preview if URL is empty
    if (!url) {
      setYoutubePreview(null);
      setIsPlaylist(false);
      return;
    }

    // Detect if it's a playlist
    const isYoutubePlaylist = url.includes('playlist?list=') ||
                             (url.includes('youtube.com/') && url.includes('list='));
    setIsPlaylist(isYoutubePlaylist);

    // Extract video ID for preview (if not a playlist)
    if (!isYoutubePlaylist) {
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
    } else {
      // Clear video preview for playlists
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

  // Redirect to login if not authenticated
  if (!isLoading && !user) {
    router.push('/auth');
    return null;
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
      case 'cancelled': return 'alert-warning';
      case 'failed': return 'alert-error';
      case 'processing': return 'alert-info';
      default: return 'alert-info';
    }
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(2) + ' KB';
    else return (bytes / 1048576).toFixed(2) + ' MB';
  };

  return (
    <div className="drawer">
      <input
        id="my-drawer"
        type="checkbox"
        className="drawer-toggle"
        checked={isDrawerOpen}
        onChange={() => setIsDrawerOpen(!isDrawerOpen)}
      />

      <div className="drawer-content flex flex-col">
        {/* Navbar for all screen sizes */}
        <div className="navbar bg-base-100 sticky top-0 z-30 shadow-sm">
          <div className="navbar-start">
            <label htmlFor="my-drawer" className="btn btn-ghost drawer-button">
              <Menu className="h-5 w-5" />
            </label>
            <span className="font-bold text-xl ml-2">Student AI</span>
          </div>
          <div className="navbar-center hidden lg:flex">
            <ul className="menu menu-horizontal px-1">
              <li><Link href="/dashboard" className="font-medium">Dashboard</Link></li>
              <li><Link href="/upload" className="font-medium active">Upload</Link></li>
            </ul>
          </div>
          <div className="navbar-end">
            <ThemeSwitcher showText={false} />
            <div className="dropdown dropdown-end ml-2">
              <div tabIndex={0} role="button" className="btn btn-ghost btn-circle avatar placeholder">
                <div className="bg-primary text-primary-content rounded-full w-10">
                  <span>{user?.username?.charAt(0).toUpperCase() || <User className="h-5 w-5" />}</span>
                </div>
              </div>
              <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52">
                <li><button onClick={handleLogout} className="text-error"><LogOut className="h-4 w-4" /> Logout</button></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="p-4 lg:p-6">
          <div className="max-w-3xl mx-auto">
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body p-0">
                {/* Tabs */}
                <div className="tabs w-full tabs-boxed bg-base-200 rounded-t-xl">
                  <button
                    className={`tab flex-1 rounded-none gap-2 ${activeTab === 'file' ? 'tab-active' : ''}`}
                    onClick={() => setActiveTab('file')}
                  >
                    <FileUp className="h-4 w-4" />
                    <span className="font-medium">File Upload</span>
                  </button>
                  <button
                    className={`tab flex-1 rounded-none gap-2 ${activeTab === 'youtube' ? 'tab-active' : ''}`}
                    onClick={() => setActiveTab('youtube')}
                  >
                    <Youtube className="h-4 w-4" />
                    <span className="font-medium">YouTube Link</span>
                  </button>
                </div>

                <div className="p-4 md:p-6">
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* File upload form */}
                    {activeTab === 'file' && (
                      <div>
                        {!fileInput ? (
                          <div
                            ref={fileDropRef}
                            className="border-2 border-dashed rounded-xl p-6 md:p-10 transition-all duration-200 cursor-pointer hover:border-primary/50 hover:bg-base-200/50"
                            onClick={() => document.getElementById('file-input').click()}
                          >
                            <input
                              id="file-input"
                              type="file"
                              accept=".pdf,.txt,.doc,.docx,.ppt,.pptx,.jpg,.jpeg,.png"
                              onChange={handleFileChange}
                              className="hidden"
                            />

                            <div className="flex flex-col items-center justify-center text-center">
                              <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                                <FileUp className="w-8 h-8 md:w-10 md:h-10 text-primary" />
                              </div>

                              <h3 className="text-xl font-semibold mb-2">Drag & Drop or Click to Upload</h3>
                              <p className="text-base-content/70 mb-4 max-w-md">
                                Upload PDF, Word documents, PowerPoint, or images to enhance your learning materials
                              </p>

                              <button type="button" className="btn btn-primary">
                                <UploadIcon className="w-4 h-4 mr-2" />
                                Choose File
                              </button>

                              <p className="text-xs text-base-content/60 mt-4">
                                Maximum file size: 50MB
                              </p>
                            </div>
                          </div>
                        ) : (
                          <div className="bg-base-200 rounded-xl p-4 md:p-6">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                              <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl bg-base-300 flex items-center justify-center flex-shrink-0">
                                <File className="w-6 h-6 md:w-8 md:h-8 text-primary" />
                              </div>

                              <div className="flex-1 min-w-0">
                                <h3 className="text-lg font-medium truncate">{fileInput.name}</h3>
                                <div className="flex flex-wrap items-center gap-x-4 text-sm text-base-content/70 mt-1">
                                  <span>{formatFileSize(fileInput.size)}</span>
                                  <span className="hidden sm:inline">•</span>
                                  <span>{fileInput.type || 'Unknown format'}</span>
                                </div>
                              </div>

                              <button
                                type="button"
                                className="btn btn-error btn-sm"
                                onClick={handleReset}
                              >
                                <Trash2 className="w-4 h-4 mr-1 sm:mr-2" />
                                <span className="hidden sm:inline">Remove</span>
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* YouTube URL form */}
                    {activeTab === 'youtube' && (
                      <div className="space-y-4">
                        <div className="form-control">
                          <label className="label">
                            <span className="label-text text-base font-medium">YouTube URL</span>
                            <span className="label-text-alt">Video or Playlist</span>
                          </label>

                          <div className="join w-full">
                            <div className="join-item flex items-center justify-center bg-base-200 px-4 border border-r-0 border-base-300">
                              <LinkIcon className="w-5 h-5 text-primary" />
                            </div>
                            <input
                              ref={youtubeInputRef}
                              type="url"
                              placeholder="https://www.youtube.com/watch?v=..."
                              className="input join-item input-bordered flex-grow"
                              value={youtubeUrl}
                              onChange={(e) => updateYoutubePreview(e.target.value)}
                              onClick={handleYoutubeUrlClick}
                            />
                            {youtubeUrl && (
                              <button
                                type="button"
                                className="btn join-item"
                                onClick={() => updateYoutubePreview('')}
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            )}
                          </div>

                          {/* YouTube preview */}
                          {youtubePreview && !isPlaylist && (
                            <div className="mt-4">
                              <div className="card bg-base-200 overflow-hidden">
                                <div className="sm:flex">
                                  <figure className="relative h-40 sm:h-auto sm:w-48 flex-shrink-0">
                                    <img
                                      src={youtubePreview.thumbnailUrl}
                                      alt="YouTube thumbnail"
                                      className="w-full h-full object-cover"
                                    />
                                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                                      <div className="h-12 w-12 rounded-full bg-red-600 flex items-center justify-center">
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" className="w-6 h-6">
                                          <path d="M8 5v14l11-7z"></path>
                                        </svg>
                                      </div>
                                    </div>
                                  </figure>
                                  <div className="card-body">
                                    <h3 className="card-title">YouTube Video</h3>
                                    <p className="text-sm text-base-content/70">
                                      This video will be processed and its content will be made available for studying.
                                    </p>
                                    <div className="card-actions justify-end mt-2">
                                      <a
                                        href={`https://www.youtube.com/watch?v=${youtubePreview.videoId}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="btn btn-sm btn-outline gap-2"
                                      >
                                        <ExternalLink className="h-3.5 w-3.5" />
                                        Open in YouTube
                                      </a>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Playlist info */}
                          {isPlaylist && (
                            <div className="alert alert-info mt-4">
                              <Info className="w-6 h-6" />
                              <div>
                                <h3 className="font-bold">YouTube Playlist Detected</h3>
                                <div className="text-sm">All videos in this playlist will be processed.</div>
                              </div>
                              <a
                                href={youtubeUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn btn-sm btn-circle"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Progress indicator */}
                    {progress && (
                      <div className={`alert ${getAlertType(progress.status)} shadow-lg`}>
                        <div className="flex-1">
                          <div className="font-bold capitalize flex items-center gap-2">
                            {progress.status === 'processing' && (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            )}
                            {progress.status === 'completed' && (
                              <CheckCircle className="h-4 w-4" />
                            )}
                            {progress.status === 'failed' && (
                              <XCircle className="h-4 w-4" />
                            )}
                            {progress.status}
                          </div>
                          <div className="text-sm">{progress.message || 'Processing your content...'}</div>

                          {progress.status === 'processing' && progress.percentage !== undefined && (
                            <div className="mt-3">
                              <div className="flex justify-between text-xs mb-1">
                                <span className="font-medium">{progress.percentage}% Complete</span>
                                {progress.time_remaining && (
                                  <span>Est. {progress.time_remaining}</span>
                                )}
                              </div>
                              <div className="w-full bg-base-300 rounded-full h-2.5">
                                <div
                                  className="bg-primary h-2.5 rounded-full"
                                  style={{width: `${progress.percentage}%`}}
                                ></div>
                              </div>
                            </div>
                          )}
                        </div>

                        {progress.status === 'processing' && (
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
                    )}

                    {/* Form buttons */}
                    <div className="flex flex-col sm:flex-row justify-between gap-3 pt-2">
                      <Link
                        href="/dashboard"
                        className="btn btn-ghost order-2 sm:order-1"
                      >
                        <Home className="h-4 w-4 mr-2" />
                        Back to Dashboard
                      </Link>

                      <button
                        type="submit"
                        className="btn btn-primary order-1 sm:order-2"
                        disabled={
                          uploading ||
                          (activeTab === 'file' && !fileInput) ||
                          (activeTab === 'youtube' && !youtubeUrl)
                        }
                      >
                        {uploading ? (
                          <>
                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <UploadIcon className="w-5 h-5 mr-2" />
                            {activeTab === 'file' ? 'Upload File' : 'Process YouTube'}
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>

            {/* Connection status */}
            <div className="mt-4 flex justify-center">
              <div className={`badge ${wsStatus.connected ? 'badge-success' : 'badge-error'} gap-2 px-3 py-2`}>
                {wsStatus.connected ?
                  <Wifi className="h-4 w-4"/> :
                  <WifiOff className="h-4 w-4"/>
                }
                <span>{wsStatus.connected ? 'Connected' : 'Disconnected'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Toast messages */}
        <div className="toast toast-end z-50">
          {toasts.map(toast => (
            <div key={toast.id} className={`alert ${toast.type ? `alert-${toast.type}` : 'alert-info'} shadow-lg`}>
              <div className="flex items-center">
                {renderToastIcon(toast.type)}
                <span>{toast.message}</span>
              </div>
              <button
                className="btn btn-circle btn-ghost btn-xs"
                onClick={() => removeToast(toast.id)}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Drawer sidebar */}
      <div className="drawer-side z-40">
        <label htmlFor="my-drawer" className="drawer-overlay" onClick={() => setIsDrawerOpen(false)}></label>

        <aside className="w-80 min-h-full bg-base-200">
          {/* User profile section */}
          <div className="p-4 border-b border-base-300 bg-base-100">
            <div className="flex items-center gap-3">
              <div className="avatar placeholder">
                <div className="bg-primary text-primary-content rounded-full w-12 h-12 flex items-center justify-center">
                  <span>{user?.username?.charAt(0).toUpperCase() || <User className="h-6 w-6" />}</span>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold truncate">{user?.username || 'User'}</div>
                <div className="text-xs opacity-70 truncate">{user?.email || ''}</div>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="p-2 border-b border-base-300">
            <ul className="menu menu-sm p-1 gap-1">
              <li>
                <Link href="/dashboard" onClick={() => setIsDrawerOpen(false)}>
                  <Home className="h-5 w-5" />
                  <span>Dashboard</span>
                </Link>
              </li>
              <li>
                <Link href="/upload" className="active" onClick={() => setIsDrawerOpen(false)}>
                  <UploadIcon className="h-5 w-5" />
                  <span>Upload</span>
                </Link>
              </li>
            </ul>
          </nav>

          <div className="p-4 flex-1">
            <div className="h-full flex flex-col items-center justify-center text-center p-4">
              <UploadIcon className="w-12 h-12 text-primary opacity-20 mb-4" />
              <h3 className="font-semibold text-lg mb-2">Upload Learning Materials</h3>
              <p className="text-sm opacity-70 mb-4">
                Add PDF documents, Word files, PowerPoint presentations, or YouTube videos to enhance your learning experience.
              </p>
            </div>
          </div>

          {/* Bottom section with logout */}
          <div className="p-4 border-t border-base-300">
            <button
              onClick={handleLogout}
              className="btn btn-outline btn-error btn-block"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
