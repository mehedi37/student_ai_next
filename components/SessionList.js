'use client';

import { useEffect, useRef } from 'react';
import { useSession } from '@/components/context/SessionContext';
import { useAuth } from '@/components/context/AuthContext';
import Link from 'next/link';
import { MessageSquare, Trash2, XCircle } from 'lucide-react';

export default function SessionList({ onSessionSelect, limit = 5, showViewAll = true }) {
  const { user } = useAuth();
  const {
    sessions,
    isLoadingSessions,
    isDeletingSession,
    isDeletingAllSessions,
    activeSession,
    loadSessions,
    handleSessionClick,
    createNewSession,
    deleteSession,
    deleteAllSessions
  } = useSession();

  // Add a ref to track if sessions have been loaded
  const initialLoadComplete = useRef(false);

  // Load sessions only once when the component mounts and user is authenticated
  useEffect(() => {
    if (user && !initialLoadComplete.current && !isLoadingSessions) {
      loadSessions();
      initialLoadComplete.current = true;
    }
  }, [user, loadSessions, isLoadingSessions]);

  const handleDeleteSession = (sessionId, event) => {
    event.stopPropagation();
    if (!sessionId || isDeletingSession) return;

    if (confirm('Are you sure you want to delete this session?')) {
      deleteSession(sessionId);
    }
  };

  const handleDeleteAllSessions = () => {
    if (isDeletingAllSessions) return;

    if (confirm('Are you sure you want to delete all sessions? This action cannot be undone.')) {
      deleteAllSessions();
    }
  };

  const handleSessionSelection = async (session) => {
    const fullSession = await handleSessionClick(session);
    if (fullSession && onSessionSelect) {
      onSessionSelect(fullSession);
    }
  };

  const handleNewSession = () => {
    createNewSession();
    if (onSessionSelect) {
      onSessionSelect(null);
    }
  };

  const displaySessions = limit ? sessions.slice(0, limit) : sessions;

  return (
    <div className="collapse collapse-arrow bg-base-100 shadow-xl">
      <input type="checkbox" defaultChecked={showViewAll} />
      <div className="collapse-title flex justify-between items-center p-4">
        <h2 className="text-lg font-semibold">Recent Sessions</h2>
      </div>
      <div className="collapse-content px-4 pb-4">
        <div className="flex justify-end mb-2">
          <button
            onClick={handleDeleteAllSessions}
            className="btn btn-ghost btn-sm btn-circle text-error"
            aria-label="Delete all sessions"
            disabled={isDeletingAllSessions || sessions.length === 0}
          >
            {isDeletingAllSessions ? (
              <div className="skeleton w-4 h-4 rounded-full"></div>
            ) : (
              <div className="tooltip tooltip-left" data-tip="Delete All Sessions">
                <XCircle className="h-4 w-4" />
              </div>
            )}
          </button>
          <button
            className="btn btn-primary btn-sm btn-outline"
            onClick={handleNewSession}
          >
            New Session
          </button>
        </div>

        {isLoadingSessions ? (
          <div className="space-y-3 py-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="skeleton h-12 w-full"></div>
            ))}
          </div>
        ) : displaySessions.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-sm">No sessions yet</p>
            <button
              className="btn btn-primary btn-sm mt-3"
              onClick={handleNewSession}
            >
              <MessageSquare className="h-4 w-4 mr-1" />
              New Session
            </button>
          </div>
        ) : (
          <ul className="space-y-3">
            {displaySessions.map((session) => {
              const sessionId = session.session_id;
              if (!sessionId) return null;

              return (
                <li key={sessionId}>
                  <div
                    className={`flex justify-between items-center p-3 rounded-lg cursor-pointer ${
                      activeSession?.session_id === sessionId
                        ? 'bg-primary text-primary-content'
                        : 'bg-base-200 hover:bg-base-300'
                    }`}
                    onClick={() => handleSessionSelection(session)}
                  >
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                      <span className="truncate">
                        {session.title || `Session ${sessionId.substring(0, 8)}`}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <span className="badge badge-sm mr-1">
                        {session.messages_count || 0}
                      </span>
                      <button
                        onClick={(e) => handleDeleteSession(sessionId, e)}
                        className="btn btn-ghost btn-xs btn-circle text-error"
                        aria-label="Delete session"
                        disabled={isDeletingSession}
                      >
                        {isDeletingSession ? (
                          <div className="skeleton w-3 h-3 rounded-full"></div>
                        ) : (
                          <Trash2 className="h-3 w-3" />
                        )}
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}