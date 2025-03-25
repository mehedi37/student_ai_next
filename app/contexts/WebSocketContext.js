'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';

const WebSocketContext = createContext();

export function WebSocketProvider({ children }) {
  const [isConnected, setIsConnected] = useState(false);
  const [clientId, setClientId] = useState(null);
  const [activeTasks, setActiveTasks] = useState({});
  const [toasts, setToasts] = useState([]);

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

  useEffect(() => {
    // Generate a client ID if not exists
    if (!clientId) {
      const uuid = uuidv4().replace(/-/g, "");
      const newClientId = uuid.startsWith('client_') ? uuid : `client_${uuid}`;
      setClientId(newClientId);

      // Set as connected by default since we don't need the WebSocket connection anymore
      setIsConnected(true);
    }
  }, [clientId]);

  // Update a task's progress and status
  const updateTaskProgress = (taskId, progressData) => {
    setActiveTasks(prev => ({
      ...prev,
      [taskId]: {
        ...prev[taskId],
        progress: progressData.progress || progressData.percentage,
        status: progressData.status,
        error: progressData.error,
        message: progressData.message,
        filename: progressData.filename || prev[taskId]?.filename,
        type: progressData.type || prev[taskId]?.type
      }
    }));

    // Show toast for completion or error
    if (progressData.status === 'completed') {
      addToast({
        id: `success-${taskId}`,
        type: 'success',
        message: `${progressData.filename || 'File'} uploaded successfully!`,
        autoClose: true
      });
    } else if (progressData.status === 'error' || progressData.status === 'failed') {
      addToast({
        id: `error-${taskId}`,
        type: 'error',
        message: progressData.error || progressData.message || 'Upload failed',
        autoClose: true
      });
    }
  };

  const value = {
    isConnected,
    clientId,
    activeTasks,
    updateTaskProgress,
    addToast
  };

  // Helper function to get alert type based on status
  const getAlertType = (status) => {
    switch (status) {
      case 'completed': return 'alert-success';
      case 'error': return 'alert-error';
      case 'processing': return 'alert-info';
      default: return 'alert-info';
    }
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}

      {/* Global Upload Progress UI */}
      {Object.entries(activeTasks).length > 0 && (
        <div className="fixed bottom-4 right-4 z-50 space-y-2">
          {Object.entries(activeTasks).map(([taskId, task]) => (
            <div key={taskId} className={`alert ${getAlertType(task.status)} shadow-lg w-80`}>
              <div className="flex-1">
                <div className="font-bold truncate">
                  {task.filename || 'Uploading...'}
                </div>
                <div className="text-sm opacity-70">
                  {task.status === 'processing' ? (
                    <>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="font-medium">{task.progress}% Complete</span>
                      </div>
                      <progress
                        className="progress progress-primary w-full"
                        value={task.progress}
                        max="100"
                      />
                    </>
                  ) : task.status === 'error' ? (
                    <div className="text-error">{task.error || 'Upload failed'}</div>
                  ) : (
                    <div className="text-success">Upload completed</div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Toast messages */}
      <div className="toast toast-end z-50">
        {toasts.map(toast => (
          <div key={toast.id} className={`alert ${toast.type ? `alert-${toast.type}` : 'alert-info'} shadow-lg`}>
            <div className="flex items-center">
              <span>{toast.message}</span>
            </div>
            <button
              className="btn btn-circle btn-ghost btn-xs"
              onClick={() => removeToast(toast.id)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </WebSocketContext.Provider>
  );
}

export function useWebSocket() {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
}