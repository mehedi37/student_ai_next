'use client';

import { useState, useEffect } from 'react';
import { api } from '@/utils/api';
import Link from 'next/link';

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
    <div className="w-64 bg-gray-900 text-white flex flex-col h-screen">
      {/* User profile section */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center">
            {user?.username?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div>
            <div className="font-medium truncate">{user?.username}</div>
            <div className="text-xs text-gray-400 truncate">{user?.email}</div>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="mt-3 w-full text-sm bg-red-600 hover:bg-red-700 py-1 px-2 rounded"
        >
          Logout
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-700">
        <button
          className={`flex-1 py-2 text-center ${activeTab === 'sessions' ? 'bg-gray-800' : ''}`}
          onClick={() => setActiveTab('sessions')}
        >
          Sessions
        </button>
        <button
          className={`flex-1 py-2 text-center ${activeTab === 'documents' ? 'bg-gray-800' : ''}`}
          onClick={() => setActiveTab('documents')}
        >
          Documents
        </button>
      </div>

      {/* Content based on active tab */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'sessions' && (
          <div>
            <button
              onClick={createNewSession}
              className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white flex justify-center items-center"
            >
              <span>New Chat</span>
            </button>

            {isLoadingSessions ? (
              <div className="text-center p-4 text-gray-400">Loading...</div>
            ) : (
              <ul>
                {sessions.map(session => (
                  <li
                    key={session.session_id}
                    className={`px-4 py-2 hover:bg-gray-800 cursor-pointer border-l-4 ${
                      activeSession?.session_id === session.session_id
                        ? 'border-blue-500 bg-gray-800'
                        : 'border-transparent'
                    }`}
                    onClick={() => handleSessionClick(session)}
                  >
                    <div className="text-sm truncate">Chat {session.session_id.substring(0, 8)}</div>
                    <div className="text-xs text-gray-400">
                      {session.messages_count} messages
                    </div>
                  </li>
                ))}
                {sessions.length === 0 && (
                  <li className="px-4 py-2 text-gray-400 text-sm">No sessions yet</li>
                )}
              </ul>
            )}
          </div>
        )}

        {activeTab === 'documents' && (
          <div>
            <Link href="/upload"
              className="w-full py-2 px-4 bg-green-600 hover:bg-green-700 text-white flex justify-center items-center"
            >
              <span>Upload Document</span>
            </Link>

            {isLoadingDocs ? (
              <div className="text-center p-4 text-gray-400">Loading...</div>
            ) : (
              <ul>
                {documents.map(doc => (
                  <li key={doc.document_id} className="px-4 py-2 hover:bg-gray-800">
                    <div className="text-sm truncate">{doc.title || doc.document_id.substring(0, 12)}</div>
                    <div className="text-xs text-gray-400">{doc.source_type}</div>
                  </li>
                ))}
                {documents.length === 0 && (
                  <li className="px-4 py-2 text-gray-400 text-sm">No documents yet</li>
                )}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
