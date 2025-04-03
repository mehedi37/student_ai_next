'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/context/AuthContext';
import ChatInterface from '@/components/ChatInterface';
import Link from 'next/link';
import ThemeSwitcher from '@/components/ThemeSwitcher';
import {
  MessageSquare, FileText, Upload, Home, Menu, User, LogOut,
  BookOpen, ServerCrash, Cpu, BarChart3, AlertTriangle,
  Database, Gauge, Settings, PanelLeft, Trash, Trash2
} from 'lucide-react';
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
  const [systemStatus, setSystemStatus] = useState(null);
  const [isLoadingStatus, setIsLoadingStatus] = useState(false);
  const [isDeletingSession, setIsDeletingSession] = useState(false);

  // Load sessions, documents, and system status when the user is authenticated
  useEffect(() => {
    if (user && !isLoading) {
      loadSessions();
      loadDocuments();
      loadSystemStatus();
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

  const loadSystemStatus = async () => {
    setIsLoadingStatus(true);
    try {
      // Try to fetch system status - this might require admin privileges
      const response = await fetch('/api/system/status');
      if (response.ok) {
        const data = await response.json();
        setSystemStatus(data);
      }
    } catch (error) {
      console.error('Error loading system status:', error);
    } finally {
      setIsLoadingStatus(false);
    }
  };

  const handleSessionClick = async (session) => {
    try {
      console.log(`Loading session ${session.session_id}...`);
      const fullSession = await api.sessions.get(session.session_id);

      // Validate that we got a proper session response back
      if (!fullSession || !fullSession.session_id) {
        console.error('Invalid session data received:', fullSession);
        alert('Could not load session data. Please try again.');
        return;
      }

      console.log('Session loaded successfully:', fullSession);
      setActiveSession(fullSession);

      // Close drawer
      setIsDrawerOpen(false);
    } catch (err) {
      console.error('Error loading session details:', err);

      // Show user-friendly error
      const errorMessage = err.message || 'Unable to load session. Please try again.';
      alert(errorMessage);

      // If this session is causing persistent errors, refresh the sessions list
      // to make sure we have up-to-date data
      loadSessions();
    }
  };

  const createNewSession = async () => {
    setActiveSession(null);
    // Close drawer
    setIsDrawerOpen(false);
  };

  const handleDeleteSession = async (sessionId, event) => {
    // Prevent the click event from bubbling up to the parent button
    event.stopPropagation();

    if (!sessionId || isDeletingSession) return;

    // Confirm deletion
    const confirmDelete = window.confirm('Are you sure you want to delete this session?');
    if (!confirmDelete) return;

    setIsDeletingSession(true);

    try {
      await api.sessions.delete(sessionId);

      // If the deleted session is the active one, reset it
      if (activeSession?.session_id === sessionId) {
        setActiveSession(null);
      }

      // Refresh the sessions list
      await loadSessions();
    } catch (error) {
      console.error('Error deleting session:', error);
    } finally {
      setIsDeletingSession(false);
    }
  };

  const handleDeleteAllSessions = async () => {
    if (isDeletingSession) return;

    // Confirm deletion
    const confirmDelete = window.confirm('Are you sure you want to delete ALL sessions? This cannot be undone.');
    if (!confirmDelete) return;

    setIsDeletingSession(true);

    try {
      await api.sessions.deleteAll();

      // Reset active session
      setActiveSession(null);

      // Refresh the sessions list
      await loadSessions();
    } catch (error) {
      console.error('Error deleting all sessions:', error);
    } finally {
      setIsDeletingSession(false);
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
    <div className="drawer lg:drawer-open">
      <input
        id="dashboard-drawer"
        type="checkbox"
        className="drawer-toggle"
        checked={isDrawerOpen}
        onChange={() => setIsDrawerOpen(!isDrawerOpen)}
      />

      <div className="drawer-content flex flex-col">
        {/* Navbar for all screen sizes */}
        <div className="navbar bg-base-200 sticky top-0 z-30 shadow-sm">
          <div className="navbar-start">
            <label htmlFor="dashboard-drawer" className="btn btn-square btn-ghost drawer-button lg:hidden">
              <Menu className="h-5 w-5" />
            </label>
            <span className="font-bold text-xl ml-2 hidden sm:inline-block">Student AI</span>
          </div>
          <div className="navbar-center">
            <ul className="menu menu-horizontal px-1 hidden lg:flex">
              <li><Link href="/dashboard" className="font-medium">Dashboard</Link></li>
              <li><Link href="/upload" className="font-medium">Upload</Link></li>
            </ul>
          </div>
          <div className="navbar-end gap-2">
            <ThemeSwitcher showText={false} />
            <div className="dropdown dropdown-end">
              <div tabIndex={0} role="button" className="btn btn-ghost btn-circle avatar avatar-placeholder">
                <div className="bg-primary text-primary-content rounded-full w-10">
                  <span>{user?.username?.charAt(0).toUpperCase() || <User className="h-5 w-5" />}</span>
                </div>
              </div>
              <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52 mt-2">
                <li className="menu-title">
                  <span>{user?.username || 'User'}</span>
                </li>
                <li><Link href="/upload"><Upload className="h-4 w-4" /> Upload</Link></li>
                <li><Link href="/dashboard"><Home className="h-4 w-4" /> Dashboard</Link></li>
                <li><button onClick={handleLogout} className="text-error"><LogOut className="h-4 w-4" /> Logout</button></li>
              </ul>
            </div>
          </div>
        </div>

        {/* Main content container */}
        <div className="p-4 lg:p-6 flex-1 flex flex-col gap-4">
          {/* System status indicators */}
          {systemStatus && (
            <div className="stats stats-vertical lg:stats-horizontal shadow w-full bg-base-100">
              <div className="stat">
                <div className="stat-figure text-primary">
                  <Cpu className="h-8 w-8" />
                </div>
                <div className="stat-title">CPU Load</div>
                <div className="stat-value">{systemStatus.cpu_load || '0'}%</div>
                <div className="stat-desc">System resources</div>
              </div>

              <div className="stat">
                <div className="stat-figure text-secondary">
                  <Database className="h-8 w-8" />
                </div>
                <div className="stat-title">Memory</div>
                <div className="stat-value">{systemStatus.memory_usage || '0'}%</div>
                <div className="stat-desc">RAM utilization</div>
              </div>

              <div className="stat">
                <div className="stat-figure text-accent">
                  <Gauge className="h-8 w-8" />
                </div>
                <div className="stat-title">API Health</div>
                <div className="stat-value text-success">Operational</div>
                <div className="stat-desc text-success">All systems online</div>
              </div>
            </div>
          )}

          {/* Chat card */}
          <div className="card bg-base-100 shadow-xl w-full max-w-5xl mx-auto flex-1">
            <div className="card-body p-4 flex flex-col overflow-hidden">
              {/* Custom scrollbar and markdown styles */}


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
        <label htmlFor="dashboard-drawer" aria-label="close sidebar" className="drawer-overlay"></label>

        <aside className="w-80 min-h-full bg-base-200">
          {/* User profile section */}
          <div className="p-4 border-b border-base-300 bg-base-100">
            <div className="flex items-center gap-3">
              <div className="avatar avatar-placeholder">
                <div className="bg-primary text-primary-content rounded-full w-12">
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
                <div className="border-t border-base-300">
                  <div className="grid grid-cols-2 gap-2 mb-2">
                    <div className="badge badge-success badge-outline gap-1">
                      <span className="status status-xs status-success"></span>
                      API: Online
                    </div>
                    <div className="badge badge-success badge-outline gap-1">
                      <span className="status status-xs status-success"></span>
                      DB: Connected
                    </div>
                  </div>
                </div>
              </li>
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
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-sm font-semibold">Recent Sessions</h3>
                  <div className="flex gap-1">
                    {sessions.length > 0 && (
                      <button
                        className="btn btn-error btn-xs btn-ghost"
                        onClick={handleDeleteAllSessions}
                        disabled={isDeletingSession}
                        title="Delete all sessions"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    )}
                    <button
                      className="btn btn-primary btn-xs btn-ghost"
                      onClick={createNewSession}
                    >
                      New Session
                    </button>
                  </div>
                </div>

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
                      <MessageSquare className="h-4 w-4 mr-1" />
                      New Session
                    </button>
                  </div>
                ) : (
                  <ul className="menu menu-sm p-0 gap-1">
                    {sessions.map(session => {
                      const sessionId = session.session_id;
                      if (!sessionId) return null;

                      return (
                        <li key={sessionId}>
                          <div className={`flex justify-between items-center p-2 rounded-lg cursor-pointer ${activeSession?.session_id === sessionId ? 'bg-primary text-primary-content' : 'hover:bg-base-300'}`}
                               onClick={() => handleSessionClick(session)}>
                            <div className="flex items-center">
                              <MessageSquare className="h-4 w-4 mr-2" />
                              <span className="truncate">
                                {session.title || `Session ${sessionId.substring(0, 8)}`}
                              </span>
                            </div>
                            <div className="flex items-center">
                              <span className="badge badge-sm mr-1">{session.messages_count || 0}</span>
                              <span
                                className="btn btn-ghost btn-xs opacity-50 hover:opacity-100 hover:bg-error hover:text-error-content"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteSession(sessionId, e);
                                }}
                                aria-label="Delete session"
                              >
                                <Trash className="h-3 w-3" />
                              </span>
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            ) : (
              <div>
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-sm font-semibold">Your Documents</h3>
                  <Link
                    href="/upload"
                    className="btn btn-primary btn-xs btn-ghost"
                    onClick={() => setIsDrawerOpen(false)}
                  >
                    Upload
                  </Link>
                </div>

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
                  <ul className="menu menu-sm p-0 gap-1">
                    {documents.map(doc => {
                      const docId = doc.document_id;
                      if (!docId) return null;

                      const docType = doc.source_type || 'file';
                      const docIcon = {
                        'file': <FileText className="h-4 w-4" />,
                        'youtube': <BookOpen className="h-4 w-4" />,
                      }[docType.toLowerCase()] || <FileText className="h-4 w-4" />;

                      return (
                        <li key={docId}>
                          <Link href={`/documents/${docId}`} onClick={() => setIsDrawerOpen(false)}>
                            {docIcon}
                            <span className="truncate">
                              {doc.title || `Document ${docId.substring(0, 8)}`}
                            </span>
                            <span className="badge badge-sm badge-outline">{docType}</span>
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