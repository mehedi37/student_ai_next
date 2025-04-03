'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, File, Youtube, ArrowLeft, Loader2, Info } from 'lucide-react';
import { api } from '@/utils/api';
import Link from 'next/link';
import { useAuth } from '@/components/context/AuthContext';
import Image from 'next/image';
import { TaskProgressTracker, useTaskProgress } from '@/app/components/TaskProgressManager';

export default function UploadPage() {
  const [uploadType, setUploadType] = useState(null);
  const [file, setFile] = useState(null);
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [taskId, setTaskId] = useState(null);
  const [youtubeMetadata, setYoutubeMetadata] = useState(null);
  const [isLoadingMetadata, setIsLoadingMetadata] = useState(false);
  const fileInputRef = useRef(null);
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const { setShowTaskManager } = useTaskProgress();

  // Extract YouTube video ID from URL
  const extractVideoId = (url) => {
    if (!url) return null;

    const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[7].length === 11) ? match[7] : null;
  };

  // Check if URL is a playlist
  const isPlaylist = (url) => {
    return url && (url.includes('playlist?list=') || url.includes('&list='));
  };

  // Fetch YouTube video metadata when URL changes
  useEffect(() => {
    if (!youtubeUrl) {
      setYoutubeMetadata(null);
      return;
    }

    const videoId = extractVideoId(youtubeUrl);
    const playlistUrl = isPlaylist(youtubeUrl);

    if (!videoId && !playlistUrl) {
      setYoutubeMetadata(null);
      return;
    }

    const fetchMetadata = async () => {
      try {
        setIsLoadingMetadata(true);

        // Use YouTube's oEmbed API which doesn't require an API key
        if (videoId) {
          const response = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`)
            .then(res => res.json());

          if (response && response.title) {
            setYoutubeMetadata({
              title: response.title,
              thumbnailUrl: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
              highQualityThumbnail: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
              standardThumbnail: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
              channelTitle: response.author_name,
              authorUrl: response.author_url,
              videoId: videoId,
              isPlaylist: playlistUrl
            });
          } else {
            // Fallback to just showing the thumbnail if oEmbed fails
            setYoutubeMetadata({
              title: playlistUrl ? 'YouTube Playlist' : 'YouTube Video',
              thumbnailUrl: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
              videoId: videoId,
              isPlaylist: playlistUrl
            });
          }
        } else if (playlistUrl) {
          // For playlists without a video ID, use a generic playlist icon
          setYoutubeMetadata({
            title: 'YouTube Playlist',
            thumbnailUrl: '/public/youtube-playlist.svg',
            isPlaylist: true
          });
        }
      } catch (error) {
        console.error('Error fetching YouTube metadata:', error);
        // Direct thumbnail API as fallback
        setYoutubeMetadata({
          title: playlistUrl ? 'YouTube Playlist' : 'YouTube Video',
          thumbnailUrl: videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : '/public/youtube-playlist.svg',
          videoId: videoId,
          isPlaylist: playlistUrl
        });
      } finally {
        setIsLoadingMetadata(false);
      }
    };

    fetchMetadata();
  }, [youtubeUrl]);

  // Handle file selection
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setUploadError(null);
    }
  };

  // Handle file upload
  const handleFileUpload = async (e) => {
    e.preventDefault();

    if (!file) {
      setUploadError('Please select a file to upload');
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      // Upload file using the API util
      const response = await api.uploads.file(formData);
      console.log('Upload response:', response);

      // Set the taskId to start tracking progress
      if (response.task_id) {
        setTaskId(response.task_id);
        setShowTaskManager(true); // Show the task manager when upload starts
      } else {
        // Handle case where upload is complete without a task (small files)
        setIsUploading(false);
        router.push('/dashboard');
      }
    } catch (error) {
      console.error('Upload error:', error);
      setUploadError(error.message || 'Failed to upload file. Please try again.');
      setIsUploading(false);
    }
  };

  // Handle YouTube URL submission
  const handleYoutubeSubmit = async (e) => {
    e.preventDefault();

    if (!youtubeUrl.trim()) {
      setUploadError('Please enter a YouTube URL');
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      // Submit YouTube URL using the API util
      const response = await api.uploads.youtube({ url: youtubeUrl });
      console.log('YouTube upload response:', response);

      // Set the taskId to start tracking progress
      if (response.task_id) {
        setTaskId(response.task_id);
        setShowTaskManager(true); // Show the task manager when upload starts
      } else {
        // Handle case where processing starts immediately without a task
        setIsUploading(false);
        router.push('/dashboard');
      }
    } catch (error) {
      console.error('YouTube upload error:', error);
      setUploadError(error.message || 'Failed to process YouTube URL. Please try again.');
      setIsUploading(false);
    }
  };

  // Handle upload progress completion
  const handleTaskComplete = () => {
    // Wait a moment before redirecting to dashboard
    setTimeout(() => {
      router.push('/dashboard');
    }, 1000);
  };

  // Handle upload error
  const handleTaskError = (errorMessage) => {
    setUploadError(errorMessage || 'Upload failed. Please try again.');
    setIsUploading(false);
    setTaskId(null);
  };

  // If user not logged in, show loading or redirect
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  if (!isLoading && !user) {
    router.push('/auth');
    return null;
  }

  // Show upload selection step
  if (!uploadType && !isUploading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <Link href="/dashboard" className="btn btn-ghost mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Link>

        <h1 className="text-2xl font-bold mb-6">Upload Learning Material</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow">
            <div className="card-body items-center text-center">
              <File className="h-12 w-12 text-primary mb-2" />
              <h2 className="card-title">Upload Document</h2>
              <p className="text-sm opacity-70 mb-4">Upload PDF, DOCX, TXT, or image files</p>
              <div className="card-actions">
                <button
                  className="btn btn-primary"
                  onClick={() => setUploadType('file')}
                >
                  Upload File
                </button>
              </div>
            </div>
          </div>

          <div className="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow">
            <div className="card-body items-center text-center">
              <Youtube className="h-12 w-12 text-primary mb-2" />
              <h2 className="card-title">YouTube Video</h2>
              <p className="text-sm opacity-70 mb-4">Learn from YouTube videos by providing a URL</p>
              <div className="card-actions">
                <button
                  className="btn btn-primary"
                  onClick={() => setUploadType('youtube')}
                >
                  Use YouTube
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show file upload form
  if (uploadType === 'file' && !isUploading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <button
          className="btn btn-ghost mb-6"
          onClick={() => setUploadType(null)}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Upload Options
        </button>

        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title">Upload Document</h2>
            <p className="text-sm opacity-70 mb-4">Select a file from your device to upload.</p>

            <form onSubmit={handleFileUpload}>
              <div className="form-control w-full mb-4">
                <label className="label">
                  <span className="label-text">Choose a file</span>
                </label>
                <input
                  type="file"
                  className="file-input file-input-bordered w-full"
                  onChange={handleFileChange}
                  ref={fileInputRef}
                  accept=".pdf,.docx,.txt,.jpg,.jpeg,.png"
                />
                <label className="label">
                  <span className="label-text-alt">Supported formats: PDF, DOCX, TXT, JPG, PNG</span>
                </label>
              </div>

              {uploadError && (
                <div className="alert alert-error mb-4">
                  <span>{uploadError}</span>
                </div>
              )}

              <div className="flex justify-end">
                <button type="submit" className="btn btn-primary" disabled={!file}>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // Show YouTube URL form
  if (uploadType === 'youtube' && !isUploading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <button
          className="btn btn-ghost mb-6"
          onClick={() => setUploadType(null)}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Upload Options
        </button>

        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title">Upload YouTube Video</h2>
            <p className="text-sm opacity-70 mb-4">Enter the URL of a YouTube video or playlist to learn from its content.</p>

            <form onSubmit={handleYoutubeSubmit}>
              <div className="form-control w-full mb-4">
                <label className="label">
                  <span className="label-text">YouTube URL</span>
                </label>
                <input
                  type="url"
                  className="input input-bordered w-full"
                  placeholder="https://www.youtube.com/watch?v=..."
                  value={youtubeUrl}
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                  required
                />
              </div>

              {/* YouTube Video Preview */}
              {isLoadingMetadata && (
                <div className="flex justify-center items-center py-6">
                  <Loader2 className="h-10 w-10 animate-spin text-primary" />
                </div>
              )}

              {youtubeMetadata && (
                <div className="my-4 p-4 border border-base-300 rounded-lg">
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="w-full md:w-1/3 relative aspect-video">
                      <div className="w-full h-full relative rounded-lg overflow-hidden">
                        <a
                          href={`https://www.youtube.com/watch?v=${youtubeMetadata.videoId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="relative block w-full h-full"
                        >
                          <Image
                            src={youtubeMetadata.thumbnailUrl}
                            alt={youtubeMetadata.title || "YouTube video thumbnail"}
                            fill
                            style={{ objectFit: 'cover' }}
                            className="rounded-lg"
                            unoptimized
                            onError={(e) => {
                              // If maxresdefault fails, try hqdefault
                              if (e.target.src.includes('maxresdefault')) {
                                e.target.src = youtubeMetadata.highQualityThumbnail || `https://img.youtube.com/vi/${youtubeMetadata.videoId}/hqdefault.jpg`;
                              }
                            }}
                          />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-16 h-12 bg-red-600 rounded-lg flex items-center justify-center">
                              <div className="w-0 h-0 border-t-8 border-t-transparent border-l-12 border-l-white border-b-8 border-b-transparent ml-1"></div>
                            </div>
                          </div>
                        </a>
                      </div>
                    </div>
                    <div className="w-full md:w-2/3">
                      <h3 className="font-semibold text-lg mb-1">{youtubeMetadata.title}</h3>
                      {youtubeMetadata.channelTitle && (
                        <p className="text-sm opacity-70 mb-2">
                          Channel: {youtubeMetadata.authorUrl ? (
                            <a
                              href={youtubeMetadata.authorUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:underline"
                            >
                              {youtubeMetadata.channelTitle}
                            </a>
                          ) : youtubeMetadata.channelTitle}
                        </p>
                      )}

                      {youtubeMetadata.isPlaylist && (
                        <div className="mb-2 flex items-center">
                          <span className="badge badge-primary">Playlist</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {uploadError && (
                <div className="alert alert-error mb-4">
                  <span>{uploadError}</span>
                </div>
              )}

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={!youtubeUrl.trim() || isLoadingMetadata}
                >
                  <Youtube className="h-4 w-4 mr-2" />
                  Process {youtubeMetadata?.isPlaylist ? 'Playlist' : 'Video'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // Show progress while uploading
  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <Link href="/dashboard" className="btn btn-ghost mb-6">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Dashboard
      </Link>

      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title flex items-center">
            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
            Processing {uploadType === 'youtube' ?
              (youtubeMetadata?.isPlaylist ? 'YouTube Playlist' : 'YouTube Video') :
              'Document'}
          </h2>

          {uploadError && (
            <div className="alert alert-error mt-4">
              <span>{uploadError}</span>
            </div>
          )}

          <div className="mt-4 flex flex-col gap-2">
            <p className="text-sm">Your upload is being processed. You can check the progress in the task manager.</p>
            <div className="flex justify-end">
              <button
                onClick={() => setShowTaskManager(true)}
                className="btn btn-primary btn-sm"
              >
                View Progress
              </button>
            </div>
          </div>

          {/* Add task tracker component */}
          {taskId && (
            <TaskProgressTracker
              taskId={taskId}
              onComplete={handleTaskComplete}
              onError={handleTaskError}
              initialData={{
                title: uploadType === 'youtube' ?
                  (youtubeMetadata?.isPlaylist ? 'YouTube Playlist' : 'YouTube Video') :
                  `Document: ${file?.name || 'File'}`,
                type: uploadType,
                message: `Processing your ${uploadType === 'youtube' ? 'video' : 'document'}...`,
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
