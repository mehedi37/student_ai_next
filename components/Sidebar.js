'use client';

import { useState, useEffect } from 'react';
import { api } from '@/utils/api';
import Link from 'next/link';
import ThemeSwitcher from '@/components/ThemeSwitcher';
import { LogOut } from 'lucide-react';

export default function Sidebar({ user, onLogout, activeSession, setActiveSession }) {
  const [sessions, setSessions] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  const [isLoadingDocs, setIsLoadingDocs] = useState(false);
  const [activeTab, setActiveTab] = useState('sessions');

  useEffect(() => {
    if (user) {
      loadSessions();
      loadDocuments();
    }
  }, [user]);

  const loadSessions = async () => {
    setIsLoadingSessions(true);
    try {
      const response = await api.sessions.list();
      setSessions(response.sessions || []);

      // If no active session but we have sessions, set the first one active
      if (!activeSession && response.sessions?.length > 0) {
        setActiveSession(response.sessions[0]);
      }
    } catch (err) {
      console.error('Error loading sessions:', err);
    } finally {
      setIsLoadingSessions(false);
    }
  };

  const loadDocuments = async () => {
    setIsLoadingDocs(true);
    try {
      const docs = await api.uploads.documents();
      setDocuments(docs || []);
    } catch (err) {
      console.error('Error loading documents:', err);
    } finally {
      setIsLoadingDocs(false);
    }
  };

  const createNewSession = async () => {
    // Creating a new session is as simple as sending a message with no session ID
    // The backend will create a new session
    setActiveSession(null);
  };

  const handleSessionClick = async (session) => {
    try {
      const fullSession = await api.sessions.get(session.session_id);
      setActiveSession(fullSession);
    } catch (err) {
      console.error('Error loading session details:', err);
    }
  };

  return (
    <div className="drawer-side">
      <label htmlFor="sidebar-drawer" aria-label="close sidebar" className="drawer-overlay"></label>
      <aside className="bg-base-200 w-80 h-full flex flex-col border-r border-base-300">
        {/* User profile section */}
        <div className="p-5 border-b border-base-300 bg-base-100">
          <div className="flex items-center space-x-3">
            <div className="avatar-placeholder">
              <div className="bg-primary text-primary-content rounded-full w-12 mask mask-squircle">
                <span className="text-lg">{user?.username?.charAt(0).toUpperCase() || 'U'}</span>
              </div>
            </div>
            <div>
              <div className="font-bold">{user?.username}</div>
              <div className="text-xs opacity-70">{user?.email}</div>
            </div>
          </div>
          <div className="flex justify-between items-center mt-4">
            <button
              onClick={onLogout}
              className="btn btn-error btn-sm"
            >
              <LogOut className="h-4 w-4 mr-1" />
              Logout
            </button>
            <ThemeSwitcher />
          </div>
        </div>

        {/* Tabs */}
        <div className="tabs tabs-boxed m-2">
          <button
            className={`tab ${activeTab === 'sessions' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('sessions')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
            Sessions
          </button>
          <button
            className={`tab ${activeTab === 'documents' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('documents')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Documents
          </button>
        </div>

        {/* Content based on active tab */}
        <div className="flex overflow-y-auto hide-scrollbar">
          {activeTab === 'sessions' && (
            <div>
              <button
                onClick={createNewSession}
                className="btn btn-primary w-full m-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
                New Chat
              </button>

              {isLoadingSessions ? (
                <div className="flex justify-center p-4">
                  <span className="loading loading-spinner loading-md"></span>
                </div>
              ) : (
                <ul className="menu bg-base-200 rounded-box">
                  {sessions.map(session => (
                    <li key={session.session_id}>
                      <button
                        className={activeSession?.session_id === session.session_id ? 'active' : ''}
                        onClick={() => handleSessionClick(session)}
                      >
                        <div>
                          <div className="font-medium">Chat {session.session_id.substring(0, 8)}</div>
                          <div className="text-xs opacity-70">{session.messages_count} messages</div>
                        </div>
                      </button>
                    </li>
                  ))}
                  {sessions.length === 0 && (
                    <li className="disabled">
                      <span className="opacity-70">No sessions yet</span>
                    </li>
                  )}
                </ul>
              )}
            </div>
          )}

          {activeTab === 'documents' && (
            <div>
              <Link href="/upload"
                className="btn btn-accent w-full m-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                Upload Document
              </Link>

              {isLoadingDocs ? (
                <div className="flex justify-center p-4">
                  <span className="loading loading-spinner loading-md"></span>
                </div>
              ) : (
                <ul className="menu bg-base-200 rounded-box">
                  {documents.map(doc => (
                    <li key={doc.document_id}>
                      <button>
                        <div>
                          <div className="font-medium truncate">{doc.title || doc.document_id.substring(0, 12)}</div>
                          <div className="text-xs opacity-70">{doc.source_type}</div>
                        </div>
                      </button>
                    </li>
                  ))}
                  {documents.length === 0 && (
                    <li className="disabled">
                      <span className="opacity-70">No documents yet</span>
                    </li>
                  )}
                </ul>
              )}
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
