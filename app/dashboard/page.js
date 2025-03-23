'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import { useAuth } from '@/components/context/AuthContext';
import Sidebar from '@/components/Sidebar';
import ChatInterface from '@/components/ChatInterface';
import ThemeSwitcher from '@/components/ThemeSwitcher';
import websocketManager from '@/utils/websocket';
import { Menu } from 'lucide-react';

export default function Dashboard() {
  const router = useRouter();
  const { user, isLoading, logout } = useAuth();
  const [activeSession, setActiveSession] = useState(null);
  const [wsClientId] = useState(() => uuidv4());
  const sidebarRef = useRef(null);

  // Redirect if not logged in
  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/auth/login');
    }
  }, [user, isLoading, router]);

  // Connect to WebSocket
  useEffect(() => {
    if (user) {
      const connectWebSocket = async () => {
        await websocketManager.connect(wsClientId);
      };
      connectWebSocket();
    }
    return () => {
      websocketManager.disconnect();
    };
  }, [user, wsClientId]);

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect via useEffect
  }

  return (
    <div className="drawer">
      <input id="sidebar-drawer" type="checkbox" className="drawer-toggle" />

      <div className="drawer-content flex flex-col">
        {/* Top navigation */}
        <div className="navbar bg-base-100 shadow-md">
          <div className="navbar-start">
            <label htmlFor="sidebar-drawer" className="btn btn-square btn-ghost drawer-button">
              <Menu className="w-5 h-5" />
            </label>
            <div className="text-xl font-bold ml-2">Student AI Bot</div>
          </div>
          <div className="navbar-center hidden lg:flex">
            {activeSession && (
              <div className="text-sm opacity-70">
                Session: {activeSession.session_id.substring(0, 8)}
              </div>
            )}
          </div>
          <div className="navbar-end">
            {/* Theme switcher removed from here as it's already in the sidebar */}
          </div>
        </div>

        {/* Main content */}
        <div className="flex-grow p-4 overflow-auto bg-gradient-to-b from-base-200 to-base-100">
          <ChatInterface
            user={user}
            session={activeSession}
            wsClientId={wsClientId}
          />
        </div>
      </div>

      <Sidebar
        user={user}
        onLogout={handleLogout}
        activeSession={activeSession}
        setActiveSession={setActiveSession}
        ref={sidebarRef}
      />
    </div>
  );
}