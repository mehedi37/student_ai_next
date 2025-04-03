'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/components/context/AuthContext';
import { api } from '@/utils/api';
import {
  Home,
  Upload,
  Loader2,
  BookOpen,
  MessageSquare,
  FileText,
  Settings,
  LogOut,
  Menu,
  User,
  ChevronLeft,
  ChevronRight,
  Plus,
  RefreshCw,
  X,
  AlertCircle,
  Activity,
  Server,
  Database
} from 'lucide-react';
import ThemeSwitcher from '@/components/ThemeSwitcher';
import { useTaskProgress } from '@/app/components/TaskProgressManager';

export default function ChatLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout, isLoading } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [loadingDocuments, setLoadingDocuments] = useState(false);
  const [activeTab, setActiveTab] = useState('sessions');
  const [collapsed, setCollapsed] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [notification, setNotification] = useState(null);
  const { getActiveTasks, setShowTaskManager } = useTaskProgress();

  // Load the collapsed state from localStorage on component mount
  useEffect(() => {
    const savedCollapsed = localStorage.getItem('sidebarCollapsed');
    if (savedCollapsed !== null) {
      setCollapsed(savedCollapsed === 'true');
    }
  }, []);

  // Save the collapsed state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', collapsed.toString());
  }, [collapsed]);

  // Load sessions and documents when the user is authenticated
  useEffect(() => {
    if (user && !isLoading) {
      loadSessions();
      loadDocuments();
    }
  }, [user, isLoading]);

  // Function to load sessions from the API
  const loadSessions = async () => {
    setLoadingSessions(true);
    try {
      const response = await api.sessions.list();
      setSessions(response.sessions || []);
    } catch (error) {
      console.error('Error loading sessions:', error);
      setNotification({
        type: 'error',
        message: 'Failed to load sessions'
      });
    } finally {
      setLoadingSessions(false);
    }
  };

  // Function to load documents from the API
  const loadDocuments = async () => {
    setLoadingDocuments(true);
    try {
      const response = await api.uploads.documents();
      setDocuments(response || []);
    } catch (error) {
      console.error('Error loading documents:', error);
      setNotification({
        type: 'error',
        message: 'Failed to load documents'
      });
    } finally {
      setLoadingDocuments(false);
    }
  };

  // Function to refresh both sessions and documents
  const handleRefresh = () => {
    loadSessions();
    loadDocuments();
  };

  // Function to create a new chat session
  const handleNewSession = async () => {
    try {
      setNotification({
        type: 'info',
        message: 'Creating new session...'
      });

      // Make sure the appropriate method is called
      const response = await api.sessions.create();

      // If the create method doesn't exist, try an alternative approach
      if (!response || !response.session_id) {
        console.error('Sessions create API not found, using list endpoint instead');
        // Refresh the sessions list
        await loadSessions();
        // Redirect to the dashboard which will create a new session
        router.push('/dashboard');
        return;
      }

      // If successful, refresh the sessions list and redirect
      loadSessions();
      router.push(`/chat/${response.session_id}`);
    } catch (error) {
      console.error('Error creating new session:', error);
      setNotification({
        type: 'error',
        message: 'Failed to create new session'
      });

      // Fallback - redirect to dashboard which will handle session creation
      router.push('/dashboard');
    }
  };

  // Function to handle session click
  const handleSessionClick = (sessionId) => {
    router.push(`/chat/${sessionId}`);
    if (window.innerWidth < 1024) {
      // Close drawer on mobile after clicking a session
      setIsDrawerOpen(false);
    }
  };

  // Function to toggle sidebar collapse state
  const toggleSidebar = () => {
    setCollapsed(!collapsed);
  };

  // Function to close the drawer on mobile
  const closeDrawer = () => {
    setIsDrawerOpen(false);
  };

  // Function to handle logout
  const handleLogout = async () => {
    await logout();
    router.push('/auth');
  };

  // Clear the notification after 5 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Check if user is admin for diagnostics access
  const isAdmin = user?.role === 'admin';

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  const activeTasks = getActiveTasks();

  return (
    <div className="drawer lg:drawer-open">
      <input
        id="my-drawer"
        type="checkbox"
        className="drawer-toggle"
        checked={isDrawerOpen}
        onChange={() => setIsDrawerOpen(!isDrawerOpen)}
      />

      <div className="drawer-content flex flex-col">
        {/* Mobile header */}
        <div className="lg:hidden sticky top-0 z-10 px-4 py-2 bg-base-100 border-b border-base-200 flex justify-between items-center">
          <label htmlFor="my-drawer" className="btn btn-ghost drawer-button">
            <Menu className="h-5 w-5" />
          </label>
          <h2 className="text-lg font-semibold">
            {pathname.includes('/dashboard') ? 'Dashboard' :
             pathname.includes('/upload') ? 'Upload' :
             pathname.includes('/chat') ? 'Chat' : 'Student AI'}
          </h2>
          <div className="dropdown dropdown-end">
            <label tabIndex={0} className="btn btn-ghost btn-circle avatar">
              <div className="avatar-placeholder">
                <div className="bg-neutral text-neutral-content rounded-full w-8">
                  <span className="text-lg"><User className="h-4 w-4" /></span>
                </div>
              </div>
            </label>
            <ul tabIndex={0} className="mt-3 z-50 p-2 shadow menu menu-sm dropdown-content bg-base-100 rounded-box w-52">
              <li><a onClick={handleLogout}><LogOut className="h-4 w-4" />Logout</a></li>
            </ul>
          </div>
        </div>

        {/* Main content with proper margin based on sidebar state */}
        <main className={`flex-1 p-4 md:p-6 transition-all duration-300 ${collapsed ? 'lg:ml-20' : 'lg:ml-72'}`}>
          {/* Notification toast */}
          {notification && (
            <div className="toast toast-top toast-end z-50">
              <div className={`alert ${notification.type === 'error' ? 'alert-error' : 'alert-info'}`}>
                <span>{notification.message}</span>
                <button className="btn btn-ghost btn-xs" onClick={() => setNotification(null)}>
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* Active Tasks Button when tasks exist */}
          {activeTasks.length > 0 && (
            <div className="fixed top-4 right-4 z-30 lg:block hidden">
              <button
                onClick={() => setShowTaskManager(true)}
                className="btn btn-primary btn-sm"
              >
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
                Tasks ({activeTasks.length})
              </button>
            </div>
          )}

          {children}
        </main>
      </div>

      <div className="drawer-side z-20">
        <label
          htmlFor="my-drawer"
          aria-label="close sidebar"
          className="drawer-overlay"
          onClick={closeDrawer}
        ></label>

        <div className={`${collapsed ? 'w-20' : 'w-72'} transition-all duration-300 min-h-screen bg-base-200 text-base-content flex flex-col`}>
          {/* Sidebar header with logo and collapse toggle */}
          <div className="px-4 py-4 flex items-center justify-between border-b border-base-300">
            <div className="flex items-center gap-2">
              {!collapsed && (
                <span className="text-xl font-bold">Student AI</span>
              )}
              {collapsed && (
                <span className="font-bold">AI</span>
              )}
            </div>

            {/* Collapse toggle button - only shown on large screens */}
            <button
              className="hidden lg:flex btn btn-sm btn-ghost"
              onClick={toggleSidebar}
            >
              {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </button>
          </div>

          {/* User profile section */}
          <div className={`px-4 py-3 border-b border-base-300 ${collapsed ? 'text-center' : ''}`}>
            <div className="flex items-center gap-3">
              <div className="avatar-placeholder">
                <div className="bg-primary text-primary-content rounded-full w-10">
                  <span>{user?.username?.charAt(0).toUpperCase() || <User className="h-5 w-5" />}</span>
                </div>
              </div>

              {!collapsed && (
                <div className="flex-1 min-w-0">
                  <h2 className="font-semibold truncate">{user?.username || 'User'}</h2>
                  <p className="text-xs opacity-70 truncate">{user?.email || ''}</p>
                </div>
              )}
            </div>
          </div>

          {/* Navigation menu */}
          <ul className="menu menu-sm p-2 space-y-1">
            <li>
              <Link
                href="/dashboard"
                className={pathname === '/dashboard' ? 'active' : ''}
                onClick={closeDrawer}
              >
                <Home className={`h-5 w-5 ${collapsed ? 'mx-auto' : ''}`} />
                {!collapsed && <span>Dashboard</span>}
              </Link>
            </li>
            <li>
              <Link
                href="/upload"
                className={pathname === '/upload' ? 'active' : ''}
                onClick={closeDrawer}
              >
                <Upload className={`h-5 w-5 ${collapsed ? 'mx-auto' : ''}`} />
                {!collapsed && <span>Upload</span>}
              </Link>
            </li>

            {/* Admin/diagnostics section */}
            {isAdmin && (
              <>
                <div className="divider my-0"></div>
                <li className="menu-title">
                  {!collapsed && <span>Admin</span>}
                </li>
                <li>
                  <Link
                    href="/diagnostics"
                    className={pathname.startsWith('/diagnostics') ? 'active' : ''}
                    onClick={closeDrawer}
                  >
                    <Activity className={`h-5 w-5 ${collapsed ? 'mx-auto' : ''}`} />
                    {!collapsed && <span>Diagnostics</span>}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/system"
                    className={pathname.startsWith('/system') ? 'active' : ''}
                    onClick={closeDrawer}
                  >
                    <Server className={`h-5 w-5 ${collapsed ? 'mx-auto' : ''}`} />
                    {!collapsed && <span>System</span>}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/models"
                    className={pathname.startsWith('/models') ? 'active' : ''}
                    onClick={closeDrawer}
                  >
                    <Database className={`h-5 w-5 ${collapsed ? 'mx-auto' : ''}`} />
                    {!collapsed && <span>Models</span>}
                  </Link>
                </li>
              </>
            )}
          </ul>

          {/* Divider */}
          <div className="divider my-0"></div>

          {/* Sessions and Documents tabs */}
          {!collapsed ? (
            <>
              <div className="tabs tabs-boxed mx-2 my-2 bg-base-300">
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

              <div className="flex justify-between items-center px-4 py-2">
                <h3 className="text-sm font-medium">
                  {activeTab === 'sessions' ? 'Chat History' : 'My Documents'}
                </h3>
                <div className="flex gap-1">
                  <button
                    className="btn btn-ghost btn-xs"
                    onClick={handleRefresh}
                    disabled={
                      (activeTab === 'sessions' && loadingSessions) ||
                      (activeTab === 'documents' && loadingDocuments)
                    }
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${
                      (activeTab === 'sessions' && loadingSessions) ||
                      (activeTab === 'documents' && loadingDocuments)
                        ? 'animate-spin'
                        : ''
                    }`} />
                  </button>

                  {activeTab === 'sessions' && (
                    <button
                      className="btn btn-ghost btn-xs gap-1"
                      onClick={handleNewSession}
                    >
                      <Plus className="h-3.5 w-3.5" />
                      New
                    </button>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center gap-2 py-2">
              <button
                className={`btn btn-ghost btn-sm btn-circle ${activeTab === 'sessions' ? 'btn-active' : ''}`}
                onClick={() => setActiveTab('sessions')}
                title="Sessions"
              >
                <MessageSquare className="h-4 w-4" />
              </button>
              <button
                className={`btn btn-ghost btn-sm btn-circle ${activeTab === 'documents' ? 'btn-active' : ''}`}
                onClick={() => setActiveTab('documents')}
                title="Documents"
              >
                <FileText className="h-4 w-4" />
              </button>
              <button
                className="btn btn-ghost btn-sm btn-circle"
                onClick={handleRefresh}
                disabled={
                  (activeTab === 'sessions' && loadingSessions) ||
                  (activeTab === 'documents' && loadingDocuments)
                }
                title="Refresh"
              >
                <RefreshCw className={`h-4 w-4 ${
                  (activeTab === 'sessions' && loadingSessions) ||
                  (activeTab === 'documents' && loadingDocuments)
                    ? 'animate-spin'
                    : ''
                }`} />
              </button>

              {activeTab === 'sessions' && (
                <button
                  className="btn btn-ghost btn-sm btn-circle"
                  onClick={handleNewSession}
                  title="New Session"
                >
                  <Plus className="h-4 w-4" />
                </button>
              )}
            </div>
          )}

          {/* Content area for sessions or documents */}
          <div className="flex-1 overflow-y-auto">
            {activeTab === 'sessions' ? (
              <div className="p-2">
                {loadingSessions ? (
                  <div className="flex justify-center items-center py-4">
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  </div>
                ) : sessions.length > 0 ? (
                  <ul className="space-y-1">
                    {sessions.map((session) => {
                      if (!session || !session.id) {
                        // Skip invalid sessions
                        return null;
                      }
                      return (
                        <li key={session.id}>
                          <button
                            className={`w-full text-left btn btn-ghost justify-start ${
                              pathname === `/chat/${session.id}` ? 'btn-active' : ''
                            } ${collapsed ? 'btn-sm px-0 justify-center' : ''}`}
                            onClick={() => handleSessionClick(session.id)}
                          >
                            <MessageSquare className={`h-4 w-4 ${collapsed ? 'mx-auto' : 'mr-2'}`} />
                            {!collapsed && (
                              <span className="truncate">
                                {session.title || (session.id ? `Session ${session.id.slice(0, 6)}` : 'Session')}
                              </span>
                            )}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <div className={`text-center py-4 ${collapsed ? 'px-1' : 'px-2'}`}>
                    <BookOpen className={`h-8 w-8 mx-auto text-base-content/50 mb-2 ${collapsed ? 'scale-75' : ''}`} />
                    {!collapsed && (
                      <>
                        <p className="text-sm font-medium">No sessions yet</p>
                        <p className="text-xs text-base-content/60 mt-1">
                          Start a new chat to begin learning
                        </p>
                        <button
                          className="btn btn-primary btn-sm mt-3"
                          onClick={handleNewSession}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          New Session
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="p-2">
                {loadingDocuments ? (
                  <div className="flex justify-center items-center py-4">
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  </div>
                ) : documents.length > 0 ? (
                  <ul className="space-y-1">
                    {documents.map((doc) => {
                      if (!doc || !doc.document_id) {
                        // Skip invalid documents
                        return null;
                      }
                      return (
                        <li key={doc.document_id}>
                          <button
                            className={`w-full text-left btn btn-ghost justify-start ${collapsed ? 'btn-sm px-0 justify-center' : ''}`}
                            onClick={() => {
                              setNotification({
                                type: 'info',
                                message: 'Creating new session with this document...'
                              });
                              // TODO: Implement creating a session with this document
                            }}
                          >
                            <FileText className={`h-4 w-4 ${collapsed ? 'mx-auto' : 'mr-2'}`} />
                            {!collapsed && (
                              <span className="truncate">{doc.title || 'Document'}</span>
                            )}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <div className={`text-center py-4 ${collapsed ? 'px-1' : 'px-2'}`}>
                    <FileText className={`h-8 w-8 mx-auto text-base-content/50 mb-2 ${collapsed ? 'scale-75' : ''}`} />
                    {!collapsed && (
                      <>
                        <p className="text-sm font-medium">No documents yet</p>
                        <p className="text-xs text-base-content/60 mt-1">
                          Upload learning materials to enhance your experience
                        </p>
                        <Link
                          href="/upload"
                          className="btn btn-primary btn-sm mt-3"
                          onClick={closeDrawer}
                        >
                          <Upload className="h-4 w-4 mr-1" />
                          Upload Documents
                        </Link>
                      </>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Bottom navigation menu */}
          <div className="p-2 border-t border-base-300">
            <ul className="menu menu-sm p-0 space-y-1">
              <li>
                <button onClick={() => document.getElementById('theme-modal').showModal()}>
                  <Settings className={`h-5 w-5 ${collapsed ? 'mx-auto' : ''}`} />
                  {!collapsed && <span>Theme</span>}
                </button>
              </li>
              <li>
                <button onClick={handleLogout}>
                  <LogOut className={`h-5 w-5 ${collapsed ? 'mx-auto' : ''}`} />
                  {!collapsed && <span>Logout</span>}
                </button>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Theme Modal */}
      <dialog id="theme-modal" className="modal modal-bottom sm:modal-middle">
        <div className="modal-box">
          <h3 className="font-bold text-lg">Choose Theme</h3>
          <div className="py-4">
            <ThemeSwitcher />
          </div>
          <div className="modal-action">
            <form method="dialog">
              <button className="btn">Close</button>
            </form>
          </div>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button>close</button>
        </form>
      </dialog>
    </div>
  );
}