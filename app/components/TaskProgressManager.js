'use client';

import { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import { api } from '@/utils/api';
import Link from 'next/link';
import {
  Upload,
  Loader,
  AlertCircle,
  CheckCircle,
  X,
  Minimize2,
  Maximize2,
  Info,
  Trash,
} from 'lucide-react';

// Context for managing tasks across the application
const TaskContext = createContext(null);

/**
 * Provider component that makes task state available to the rest of the app
 */
export function TaskProgressProvider({ children }) {
  const [tasks, setTasks] = useState({});
  const [showTaskManager, setShowTaskManager] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

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
        updated: new Date()
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

      // Load UI state from localStorage
      const savedShowState = localStorage.getItem('taskManagerVisible');
      if (savedShowState !== null) {
        setShowTaskManager(savedShowState === 'true');
      }

      const savedCollapseState = localStorage.getItem('taskManagerCollapsed');
      if (savedCollapseState !== null) {
        setCollapsed(savedCollapseState === 'true');
      }
    }
  }, []);

  // Save visibility state to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('taskManagerVisible', showTaskManager.toString());
    }
  }, [showTaskManager]);

  // Save collapsed state to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('taskManagerCollapsed', collapsed.toString());
    }
  }, [collapsed]);

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
      setShowTaskManager,
      collapsed,
      setCollapsed
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

        // Extract metadata if available
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

// Task icon component that renders appropriate icon based on task state
function TaskIcon({ task }) {
  if (task.status === 'completed') {
    return <CheckCircle className="w-5 h-5 text-success" />;
  } else if (['error', 'failed'].includes(task.status)) {
    return <AlertCircle className="w-5 h-5 text-error" />;
  } else if (task.status === 'cancelled') {
    return <X className="w-5 h-5" />;
  } else if (task.type === 'upload' && task.progress < 100) {
    return <Upload className="w-5 h-5" />;
  } else {
    return <Loader className="w-5 h-5 animate-spin" />;
  }
}

export default function TaskProgressManager() {
  const {
    getAllTasks,
    getActiveTasks,
    removeTask,
    cancelTask,
    showTaskManager,
    setShowTaskManager,
    collapsed,
    setCollapsed
  } = useTaskProgress();

  const [filterType, setFilterType] = useState('all');
  const [notification, setNotification] = useState(null);
  const [expandedTasks, setExpandedTasks] = useState({});

  // Get all tasks
  const tasks = getAllTasks();
  const activeTasks = getActiveTasks();

  // Display notification when tasks complete
  useEffect(() => {
    const handleTaskCompletion = () => {
      const completedTasks = tasks.filter(task =>
        task.status === 'completed' &&
        task.updated && // Ensure updated property exists
        new Date(task.updated) > new Date(Date.now() - 5000)
      );

      if (completedTasks.length > 0) {
        setNotification({
          message: `${completedTasks.length} task${completedTasks.length > 1 ? 's' : ''} completed`,
          type: 'success'
        });

        // Clear notification after 3 seconds
        setTimeout(() => {
          setNotification(null);
        }, 3000);
      }
    };

    handleTaskCompletion();
  }, [tasks]);

  // Group tasks by type
  const groupedTasks = useMemo(() => {
    const grouped = {};

    // Filter tasks based on selected filter
    const filteredTasks = tasks.filter(task => {
      if (filterType === 'all') return true;
      if (filterType === 'active') return ['processing', 'queued'].includes(task.status);
      if (filterType === 'completed') return task.status === 'completed';
      if (filterType === 'error') return ['error', 'failed', 'cancelled'].includes(task.status);
      return task.type === filterType;
    });

    // Group by type
    filteredTasks.forEach(task => {
      const type = task.type || 'generic';
      if (!grouped[type]) {
        grouped[type] = [];
      }
      grouped[type].push(task);
    });

    return grouped;
  }, [tasks, filterType]);

  // Task types with counts
  const taskTypes = useMemo(() => {
    const types = {
      all: tasks.length,
      active: tasks.filter(t => ['processing', 'queued'].includes(t.status)).length,
      completed: tasks.filter(t => t.status === 'completed').length,
      error: tasks.filter(t => ['error', 'failed', 'cancelled'].includes(t.status)).length
    };

    // Add custom types
    tasks.forEach(task => {
      const type = task.type || 'generic';
      if (!types[type]) {
        types[type] = 0;
      }
      types[type]++;
    });

    return types;
  }, [tasks]);

  // Calculate stats
  const stats = useMemo(() => {
    return {
      total: tasks.length,
      active: tasks.filter(t => ['processing', 'queued'].includes(t.status)).length,
      completed: tasks.filter(t => t.status === 'completed').length,
      error: tasks.filter(t => ['error', 'failed', 'cancelled'].includes(t.status)).length,
      averageProgress: tasks.length
        ? Math.round(tasks.reduce((acc, task) => acc + task.progress, 0) / tasks.length)
        : 0,
      // Calculate oldest active task time in minutes
      oldestActive: tasks.filter(t => ['processing', 'queued'].includes(t.status)).length
        ? Math.round((Date.now() - new Date(Math.min(...tasks
            .filter(t => ['processing', 'queued'].includes(t.status))
            .map(t => new Date(t.started).getTime())))) / 60000)
        : 0
    };
  }, [tasks]);

  // Handle task cancel
  const handleCancelTask = async (taskId) => {
    try {
      await cancelTask(taskId);
      setNotification({
        message: 'Task canceled successfully',
        type: 'info'
      });

      // Clear notification after 3 seconds
      setTimeout(() => {
        setNotification(null);
      }, 3000);
    } catch (error) {
      console.error('Failed to cancel task:', error);
      setNotification({
        message: 'Failed to cancel task',
        type: 'error'
      });
    }
  };

  // Handle task removal
  const handleRemoveTask = (taskId) => {
    removeTask(taskId);
    setNotification({
      message: 'Task removed',
      type: 'info'
    });

    // Clear notification after 3 seconds
    setTimeout(() => {
      setNotification(null);
    }, 3000);
  };

  // Toggle task expanded state
  const toggleTaskExpanded = (taskId) => {
    setExpandedTasks(prev => ({
      ...prev,
      [taskId]: !prev[taskId]
    }));
  };

  // Show task manager when there are active tasks
  useEffect(() => {
    if (activeTasks.length > 0 && !showTaskManager) {
      setShowTaskManager(true);
    }
  }, [activeTasks.length, showTaskManager, setShowTaskManager]);

  if (!showTaskManager) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        {activeTasks.length > 0 && (
          <button
            onClick={() => setShowTaskManager(true)}
            className="btn btn-circle btn-primary"
            aria-label="Show task manager"
          >
            <Info className="w-5 h-5" />
            <span className="absolute -top-2 -right-2 badge badge-sm badge-secondary">{activeTasks.length}</span>
          </button>
        )}
      </div>
    );
  }

  // Calculate task manager height based on collapsed state
  const taskManagerHeight = collapsed ? 'h-12' : 'h-80';

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Notification */}
      {notification && (
        <div className={`alert ${notification.type === 'error' ? 'alert-error' : notification.type === 'success' ? 'alert-success' : 'alert-info'} mb-2`}>
          <span>{notification.message}</span>
          <button onClick={() => setNotification(null)} className="btn btn-sm btn-ghost">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Task Manager */}
      <div className={`card card-bordered bg-base-200 shadow-lg transition-all duration-300 ${taskManagerHeight} w-80 overflow-hidden`}>
        {/* Header */}
        <div className="card-title p-3 bg-primary text-primary-content flex justify-between items-center text-sm">
          <div className="flex gap-2 items-center">
            <Info className="w-4 h-4" />
            <span>Tasks ({tasks.length})</span>
            {activeTasks.length > 0 && (
              <span className="badge badge-sm badge-secondary">{activeTasks.length} active</span>
            )}
          </div>
          <div className="flex gap-1">
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="btn btn-ghost btn-xs btn-square"
              aria-label={collapsed ? 'Expand' : 'Collapse'}
            >
              {collapsed ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
            </button>
            <button
              onClick={() => setShowTaskManager(false)}
              className="btn btn-ghost btn-xs btn-square"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content only shown when not collapsed */}
        {!collapsed && (
          <div className="card-body p-0 overflow-hidden">
            {/* Filter tabs */}
            <div className="tabs tabs-boxed bg-base-300 rounded-none">
              <button
                onClick={() => setFilterType('all')}
                className={`tab flex-1 ${filterType === 'all' ? 'tab-active' : ''}`}
              >
                All ({taskTypes.all})
              </button>
              {taskTypes.active > 0 && (
                <button
                  onClick={() => setFilterType('active')}
                  className={`tab flex-1 ${filterType === 'active' ? 'tab-active' : ''}`}
                >
                  Active ({taskTypes.active})
                </button>
              )}
              {taskTypes.completed > 0 && (
                <button
                  onClick={() => setFilterType('completed')}
                  className={`tab flex-1 ${filterType === 'completed' ? 'tab-active' : ''}`}
                >
                  Done ({taskTypes.completed})
                </button>
              )}
              {taskTypes.error > 0 && (
                <button
                  onClick={() => setFilterType('error')}
                  className={`tab flex-1 ${filterType === 'error' ? 'tab-active' : ''}`}
                >
                  Failed ({taskTypes.error})
                </button>
              )}
            </div>

            {/* Tasks list */}
            <div className="overflow-y-auto p-2 h-full">
              {tasks.length === 0 ? (
                <div className="text-center py-6 text-base-content/70">
                  <p>No tasks to display</p>
                </div>
              ) : (
                Object.entries(groupedTasks).map(([type, typeTasks]) => (
                  <div key={type} className="mb-3">
                    <div className="text-xs font-bold uppercase mb-1 text-base-content/70">
                      {type}
                    </div>
                    <div className="space-y-2">
                      {typeTasks.map(task => (
                        <div
                          key={task.id}
                          className="card card-compact card-bordered bg-base-100 shadow-sm"
                        >
                          <div
                            className="p-2 cursor-pointer"
                            onClick={() => toggleTaskExpanded(task.id)}
                          >
                            <div className="flex justify-between items-center">
                              <div className="flex items-center gap-2">
                                <TaskIcon task={task} />
                                <span className="font-medium truncate max-w-[150px]">
                                  {task.title}
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                {task.status === 'processing' && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleCancelTask(task.id);
                                    }}
                                    className="btn btn-ghost btn-xs btn-square text-error"
                                    aria-label="Cancel task"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                )}
                                {['completed', 'error', 'failed', 'cancelled'].includes(task.status) && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleRemoveTask(task.id);
                                    }}
                                    className="btn btn-ghost btn-xs btn-square"
                                    aria-label="Remove task"
                                  >
                                    <Trash className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* Progress bar */}
                            {task.status === 'processing' && (
                              <progress
                                className={`progress progress-primary w-full mt-1 ${task.progress === 100 ? 'opacity-80' : ''}`}
                                value={task.progress}
                                max="100"
                              ></progress>
                            )}

                            {/* Status message */}
                            <div className="text-xs mt-1 text-base-content/70 truncate">
                              {task.message}
                            </div>
                          </div>

                          {/* Expanded details */}
                          {expandedTasks[task.id] && (
                            <div className="px-2 pb-2 text-xs border-t border-base-300 pt-2">
                              <div className="grid grid-cols-2 gap-1">
                                <div>Status: <span className="font-medium">{task.status}</span></div>
                                <div>Progress: <span className="font-medium">{task.progress}%</span></div>
                                <div>Started: <span className="font-medium">{new Date(task.started).toLocaleTimeString()}</span></div>
                                {task.error && (
                                  <div className="col-span-2 text-error">Error: {task.error}</div>
                                )}
                                {task.metadata && Object.entries(task.metadata).map(([key, value]) => (
                                  <div key={key} className="col-span-2">
                                    {key}: <span className="font-medium">{value}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}