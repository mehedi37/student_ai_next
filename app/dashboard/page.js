'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/context/AuthContext';
import ChatInterface from '@/components/ChatInterface';
import Link from 'next/link';
import ThemeSwitcher from '@/components/ThemeSwitcher';
import { MessageSquare, FileText, Upload, Home, Menu, User, LogOut } from 'lucide-react';
import { api } from '@/utils/api';

export default function Dashboard() {
  const router = useRouter();
  const { user, isLoading, logout } = useAuth();
  const [activeSession, setActiveSession] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  const [isLoadingDocs, setIsLoadingDocs] = useState(false);
  const [activeTab, setActiveTab] = useState('sessions');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Load sessions and documents when the user is authenticated
  useEffect(() => {
    if (user && !isLoading) {
      loadSessions();
      loadDocuments();
    }
  }, [user, isLoading]);

  const loadSessions = async () => {
    setIsLoadingSessions(true);
    try {
      const response = await api.sessions.list();
      setSessions(response.sessions || []);
    } catch (error) {
      console.error('Error loading sessions:', error);
    } finally {
      setIsLoadingSessions(false);
    }
  };

  const loadDocuments = async () => {
    setIsLoadingDocs(true);
    try {
      console.log('Fetching user documents...');
      const response = await api.uploads.documents();
      console.log('Documents response:', response);

      if (response && Array.isArray(response)) {
        // Handle case where API returns array directly
        setDocuments(response);
      } else if (response && Array.isArray(response.documents)) {
        // Handle case where API returns {documents: [...]}
        setDocuments(response.documents);
      } else {
        // Default to empty array if response format is unexpected
        console.warn('Unexpected document response format:', response);
        setDocuments([]);
      }
    } catch (error) {
      console.error('Error loading documents:', error);
      setDocuments([]); // Set empty array on error
    } finally {
      setIsLoadingDocs(false);
    }
  };

  const handleSessionClick = async (session) => {
    try {
      const fullSession = await api.sessions.get(session.session_id);
      setActiveSession(fullSession);
      if (window.innerWidth < 1024) {
        setIsDrawerOpen(false);
      }
    } catch (err) {
      console.error('Error loading session details:', err);
    }
  };

  const createNewSession = async () => {
    setActiveSession(null);
    if (window.innerWidth < 1024) {
      setIsDrawerOpen(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/auth');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Loading state
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
              <li><Link href="/upload" className="font-medium">Upload</Link></li>
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

        {/* Main chat container */}
        <div className="p-4 lg:p-6 flex-1 flex flex-col">
          <div className="card bg-base-100 shadow-xl w-full max-w-4xl mx-auto h-[calc(100vh-120px)]">
            <div className="card-body p-4 flex flex-col overflow-hidden">
              {/* Custom scrollbar and markdown styles */}
              <style jsx global>{`
                /* Custom scrollbar styles */
                .chat-messages::-webkit-scrollbar {
                  width: 6px;
                }
                .chat-messages::-webkit-scrollbar-track {
                  background: hsl(var(--b2));
                  border-radius: 8px;
                }
                .chat-messages::-webkit-scrollbar-thumb {
                  background: hsl(var(--p));
                  border-radius: 8px;
                }
                .chat-messages::-webkit-scrollbar-thumb:hover {
                  background: hsl(var(--pf));
                }

                /* For Firefox */
                .chat-messages {
                  scrollbar-width: thin;
                  scrollbar-color: hsl(var(--p)) hsl(var(--b2));
                }

                /* Markdown styles */
                .markdown h1 {
                  font-size: 1.5rem;
                  font-weight: 700;
                  margin-top: 1.5rem;
                  margin-bottom: 0.75rem;
                }
                .markdown h2 {
                  font-size: 1.25rem;
                  font-weight: 700;
                  margin-top: 1.25rem;
                  margin-bottom: 0.5rem;
                }
                .markdown h3 {
                  font-size: 1.125rem;
                  font-weight: 600;
                  margin-top: 1rem;
                  margin-bottom: 0.5rem;
                }
                .markdown p {
                  margin-bottom: 0.75rem;
                }
                .markdown ul, .markdown ol {
                  margin-left: 1.5rem;
                  margin-bottom: 0.75rem;
                }
                .markdown ul {
                  list-style-type: disc;
                }
                .markdown ol {
                  list-style-type: decimal;
                }
                .markdown code {
                  background-color: hsl(var(--b2));
                  padding: 0.125rem 0.25rem;
                  border-radius: 0.25rem;
                  font-family: monospace;
                }
                .markdown pre {
                  background-color: hsl(var(--b2));
                  padding: 1rem;
                  border-radius: 0.5rem;
                  overflow-x: auto;
                  margin-bottom: 1rem;
                }
                .markdown pre code {
                  background-color: transparent;
                  padding: 0;
                }
                .markdown blockquote {
                  border-left: 4px solid hsl(var(--p));
                  padding-left: 1rem;
                  font-style: italic;
                  margin-bottom: 0.75rem;
                }
                .markdown a {
                  color: hsl(var(--p));
                  text-decoration: underline;
                }
              `}</style>

              {/* Chat interface component, taking the full height */}
              <div className="flex-1 overflow-hidden">
                <ChatInterface
                  user={user}
                  session={activeSession}
                />
              </div>
            </div>
          </div>
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
                <Link href="/dashboard" className="active" onClick={() => setIsDrawerOpen(false)}>
                  <Home className="h-5 w-5" />
                  <span>Dashboard</span>
                </Link>
              </li>
              <li>
                <Link href="/upload" onClick={() => setIsDrawerOpen(false)}>
                  <Upload className="h-5 w-5" />
                  <span>Upload</span>
                </Link>
              </li>
            </ul>
          </nav>

          {/* Sessions/Documents tabs */}
          <div className="tabs tabs-boxed m-2 bg-base-300">
            <button
              className={`tab flex-1 ${activeTab === 'sessions' ? 'tab-active' : ''}`}
              onClick={() => setActiveTab('sessions')}
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Sessions
            </button>
            <button
              className={`tab flex-1 ${activeTab === 'documents' ? 'tab-active' : ''}`}
              onClick={() => setActiveTab('documents')}
            >
              <FileText className="h-4 w-4 mr-2" />
              Documents
            </button>
          </div>

          {/* Content area */}
          <div className="overflow-y-auto p-2 h-[calc(100vh-230px)]">
            {activeTab === 'sessions' ? (
              <div>
                {isLoadingSessions ? (
                  <div className="flex justify-center py-4">
                    <span className="loading loading-spinner loading-sm"></span>
                  </div>
                ) : sessions.length === 0 ? (
                  <div className="text-center py-6">
                    <MessageSquare className="h-8 w-8 mx-auto text-base-content/50 mb-2" />
                    <p className="text-sm font-medium">No sessions yet</p>
                    <p className="text-xs text-base-content/60 mt-1 px-4">
                      Start a new chat to begin learning
                    </p>
                    <button
                      className="btn btn-primary btn-sm mt-3"
                      onClick={createNewSession}
                    >
                      New Session
                    </button>
                  </div>
                ) : (
                  <ul className="menu menu-sm p-0">
                    {sessions.map(session => {
                      const sessionId = session.session_id;
                      if (!sessionId) return null;

                      return (
                        <li key={sessionId}>
                          <button
                            className={`${activeSession?.session_id === sessionId ? 'active' : ''}`}
                            onClick={() => handleSessionClick(session)}
                          >
                            <MessageSquare className="h-4 w-4" />
                            <span className="truncate">
                              {session.title || `Session ${sessionId.substring(0, 8)}`}
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            ) : (
              <div>
                {isLoadingDocs ? (
                  <div className="flex justify-center py-4">
                    <span className="loading loading-spinner loading-sm"></span>
                  </div>
                ) : documents.length === 0 ? (
                  <div className="text-center py-6">
                    <FileText className="h-8 w-8 mx-auto text-base-content/50 mb-2" />
                    <p className="text-sm font-medium">No documents yet</p>
                    <p className="text-xs text-base-content/60 mt-1 px-4">
                      Upload learning materials to enhance your experience
                    </p>
                    <Link
                      href="/upload"
                      className="btn btn-primary btn-sm mt-3"
                      onClick={() => setIsDrawerOpen(false)}
                    >
                      <Upload className="h-4 w-4 mr-1" />
                      Upload Documents
                    </Link>
                  </div>
                ) : (
                  <ul className="menu menu-sm p-0">
                    {documents.map(doc => {
                      const docId = doc.document_id;
                      if (!docId) return null;

                      return (
                        <li key={docId}>
                          <Link href={`/documents/${docId}`} onClick={() => setIsDrawerOpen(false)}>
                            <FileText className="h-4 w-4" />
                            <span className="truncate">
                              {doc.title || `Document ${docId.substring(0, 8)}`}
                            </span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            )}
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