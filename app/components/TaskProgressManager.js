'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { Loader2, X, ListPlus, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { api } from '@/utils/api';
import Link from 'next/link';

// Context for managing tasks across the application
const TaskContext = createContext(null);

/**
 * Provider component that makes task state available to the rest of the app
 */
export function TaskProgressProvider({ children }) {
  const [tasks, setTasks] = useState({});
  const [showTaskManager, setShowTaskManager] = useState(false);

  // Add a new task to be tracked
  const addTask = (taskId, initialData = {}) => {
    if (!taskId) return;

    setTasks(prev => ({
      ...prev,
      [taskId]: {
        id: taskId,
        progress: 0,
        status: 'processing',
        message: initialData.message || 'Processing...',
        title: initialData.title || 'Task',
        type: initialData.type || 'upload',
        started: new Date(),
        ...initialData
      }
    }));
  };

  // Update an existing task's data
  const updateTask = (taskId, data) => {
    if (!taskId || !tasks[taskId]) return;

    setTasks(prev => ({
      ...prev,
      [taskId]: {
        ...prev[taskId],
        ...data,
      }
    }));
  };

  // Remove a task from tracking
  const removeTask = (taskId) => {
    if (!taskId) return;

    setTasks(prev => {
      const newTasks = { ...prev };
      delete newTasks[taskId];
      return newTasks;
    });
  };

  // Cancel a task via API
  const cancelTask = async (taskId) => {
    if (!taskId) return;

    try {
      await api.uploads.terminateTask(taskId);
      updateTask(taskId, {
        status: 'cancelled',
        message: 'Task cancelled by user'
      });
      return true;
    } catch (error) {
      console.error('Failed to cancel task:', error);
      return false;
    }
  };

  // Get all active tasks (not completed, failed, or cancelled)
  const getActiveTasks = () => {
    return Object.values(tasks).filter(
      task => !['completed', 'failed', 'error', 'cancelled'].includes(task.status)
    );
  };

  // Get all tasks regardless of status
  const getAllTasks = () => {
    return Object.values(tasks);
  };

  // Save tasks to localStorage for persistence
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('activeTasks', JSON.stringify(tasks));
    }
  }, [tasks]);

  // Load tasks from localStorage on init
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedTasks = localStorage.getItem('activeTasks');
      if (savedTasks) {
        try {
          const parsedTasks = JSON.parse(savedTasks);
          // Only load tasks that are recent (last 24 hours)
          const recentTasks = {};
          const oneDayAgo = new Date();
          oneDayAgo.setDate(oneDayAgo.getDate() - 1);

          Object.entries(parsedTasks).forEach(([id, task]) => {
            const taskDate = new Date(task.started);
            if (taskDate > oneDayAgo) {
              recentTasks[id] = task;
            }
          });

          setTasks(recentTasks);
        } catch (e) {
          console.error('Error parsing stored tasks', e);
        }
      }
    }
  }, []);

  return (
    <TaskContext.Provider value={{
      tasks,
      addTask,
      updateTask,
      removeTask,
      cancelTask,
      getActiveTasks,
      getAllTasks,
      showTaskManager,
      setShowTaskManager
    }}>
      {children}
      <TaskProgressManager />
    </TaskContext.Provider>
  );
}

/**
 * Hook to use task functionality throughout the app
 */
export function useTaskProgress() {
  const context = useContext(TaskContext);
  if (!context) {
    throw new Error('useTaskProgress must be used within a TaskProgressProvider');
  }
  return context;
}

/**
 * Component that monitors task progress
 */
export function TaskProgressTracker({ taskId, onComplete, onError, initialData = {} }) {
  const { addTask, updateTask, removeTask } = useTaskProgress();

  useEffect(() => {
    if (!taskId) return;

    // Register the task with the global task manager
    addTask(taskId, initialData);

    const pollTaskStatus = async () => {
      try {
        const response = await api.uploads.status(taskId);

        // Calculate progress percentage
        let progressPercentage = 0;
        if (response.percentage !== undefined) {
          progressPercentage = response.percentage;
        } else if (response.current && response.total) {
          progressPercentage = Math.floor((response.current / response.total) * 100);
        }

        // Extract video count for YouTube playlists if available
        const metadata = {
          ...(response.metadata || {})
        };

        // Update task state in the global manager
        updateTask(taskId, {
          progress: progressPercentage,
          status: response.status || 'processing',
          message: response.message || '',
          error: response.error,
          metadata
        });

        // Handle completion states
        if (response.status === 'completed') {
          onComplete && onComplete(response);
          // Keep completed tasks in the list for a while so user can see them
          setTimeout(() => removeTask(taskId), 30000);
          return true; // Stop polling
        } else if (['error', 'failed', 'cancelled'].includes(response.status)) {
          onError && onError(response.error || 'Task failed');
          return true; // Stop polling
        }

        return false; // Continue polling
      } catch (error) {
        console.error('Error polling task status:', error);
        updateTask(taskId, {
          status: 'error',
          error: 'Failed to get task status'
        });
        onError && onError('Error checking task status');
        return true; // Stop polling due to error
      }
    };

    // Do initial poll
    pollTaskStatus().then(shouldStop => {
      if (!shouldStop) {
        // Set up interval for continued polling (every 1 second)
        const intervalId = setInterval(async () => {
          const shouldStop = await pollTaskStatus();
          if (shouldStop) {
            clearInterval(intervalId);
          }
        }, 1000);

        // Clean up interval on unmount
        return () => clearInterval(intervalId);
      }
    });

    // Clean up function
    return () => {
      // We don't immediately remove the task on unmount
      // as it may still be processing in the background
    };
  }, [taskId, onComplete, onError, addTask, updateTask, removeTask, initialData]);

  // This component doesn't render anything - it just tracks tasks
  return null;
}

/**
 * Component that displays task progress
 */
export function TaskProgressManager() {
  const {
    getAllTasks,
    getActiveTasks,
    cancelTask,
    showTaskManager,
    setShowTaskManager
  } = useTaskProgress();

  const allTasks = getAllTasks();
  const activeTasks = getActiveTasks();

  if (allTasks.length === 0) return null;

  // Get status icon based on task status
  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'failed':
      case 'error': return <XCircle className="h-4 w-4" />;
      case 'cancelled': return <AlertTriangle className="h-4 w-4" />;
      default: return <Loader2 className="h-4 w-4 animate-spin" />;
    }
  };

  return (
    <>
      {/* Floating task indicator when manager is closed */}
      {!showTaskManager && activeTasks.length > 0 && (
        <button
          className="fixed bottom-4 right-4 btn btn-primary btn-circle"
          onClick={() => setShowTaskManager(true)}
          aria-label="Show active tasks"
        >
          <div className="indicator">
            <span className="indicator-item badge badge-secondary">{activeTasks.length}</span>
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        </button>
      )}

      {/* Task manager drawer */}
      {showTaskManager && (
        <div className="fixed bottom-0 right-0 z-40 m-4 max-w-md w-full">
          <div className="bg-base-200 shadow-lg rounded-box overflow-hidden">
            {/* Header */}
            <div className="bg-primary text-primary-content px-4 py-3 flex justify-between items-center">
              <h3 className="font-medium flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>
                  {activeTasks.length > 0
                    ? `Active Tasks (${activeTasks.length})`
                    : 'Recent Tasks'}
                </span>
              </h3>
              <button
                className="btn btn-ghost btn-sm btn-circle"
                onClick={() => setShowTaskManager(false)}
                aria-label="Close task manager"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Task list */}
            <div className="p-3 max-h-96 overflow-y-auto">
              {allTasks.length > 0 ? (
                <div className="flex flex-col gap-3">
                  {allTasks.map((task) => (
                    <div
                      key={task.id}
                      className={`p-3 border rounded-lg ${
                        task.status === 'completed' ? 'border-success bg-success bg-opacity-10' :
                        task.status === 'error' || task.status === 'failed' ? 'border-error bg-error bg-opacity-10' :
                        task.status === 'cancelled' ? 'border-warning bg-warning bg-opacity-10' :
                        'border-primary bg-base-100'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(task.status)}
                          <span className="font-medium">{task.title}</span>
                        </div>
                        <div className="capitalize badge">
                          {task.status}
                        </div>
                      </div>

                      {/* Message */}
                      <p className="text-sm mt-1 mb-2">
                        {task.error || task.message || 'Processing...'}
                      </p>

                      {/* YouTube playlist metadata */}
                      {task.metadata?.video_count && (
                        <div className="text-sm flex items-center gap-1 mb-2">
                          <ListPlus className="h-4 w-4" />
                          <span>{task.metadata.video_count} videos in playlist</span>
                        </div>
                      )}

                      {/* Progress bar for active tasks */}
                      {['processing', 'queued'].includes(task.status) && (
                        <>
                          <div className="flex justify-between text-xs mb-1">
                            <span>{task.progress}% Complete</span>
                          </div>
                          <div className="w-full bg-base-300 rounded-full h-2">
                            <div
                              className="bg-primary h-2 rounded-full"
                              style={{ width: `${task.progress}%` }}
                            ></div>
                          </div>
                        </>
                      )}

                      {/* Actions */}
                      <div className="flex justify-end mt-2">
                        {['processing', 'queued'].includes(task.status) && (
                          <button
                            className="btn btn-error btn-xs"
                            onClick={() => cancelTask(task.id)}
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-base-content/70">No tasks available</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-2 border-t border-base-300 flex justify-end">
              <Link href="/upload" className="btn btn-ghost btn-sm">
                Upload More
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// Re-export the task tracking hook for video uploads
export function useVideoUploadTask(taskId, initialData = {}) {
  const { addTask, updateTask, cancelTask } = useTaskProgress();

  // Add the task to tracking when ID is provided
  useEffect(() => {
    if (taskId) {
      addTask(taskId, {
        type: 'youtube',
        title: initialData.title || 'YouTube Upload',
        ...initialData
      });
    }
  }, [taskId, addTask, initialData]);

  return {
    cancelTask: () => cancelTask(taskId),
    updateTaskData: (data) => updateTask(taskId, data)
  };
}