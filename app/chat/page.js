'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/utils/api';
import { useAuth } from '@/components/context/AuthContext';
import { SessionProvider, useSession } from '@/components/context/SessionContext';
import ChatInterface from '@/components/ChatInterface';
import SessionList from '@/components/SessionList';
import AlertMessage from '@/components/AlertMessage';
import { MessageSquare, PlusCircle } from 'lucide-react';

// Inner component that uses the session context
function ChatPageContent() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const {
    activeSession,
    setActiveSession,
    createNewSession,
    alertMessage,
    showAlert,
    setShowAlert,
    isLoadingSessions
  } = useSession();

  const handleSessionSelect = (session) => {
    setActiveSession(session);
    // Optionally navigate to a specific URL
    if (session && session.session_id) {
      router.push(`/chat/${session.session_id}`);
    }
  };

  const handleNewChat = () => {
    createNewSession();
    router.push('/chat');
  };

  // Show loading state
  if (authLoading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 lg:p-6">
      <AlertMessage
        message={alertMessage}
        show={showAlert}
        onClose={() => setShowAlert(false)}
      />

      <div className="mb-6">
        <h1 className="text-3xl font-bold text-primary">Chat</h1>
        <p className="text-base-content/70">Ask questions and get instant answers about your documents</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left sidebar: Sessions list */}
        <div className="lg:col-span-1">
          <div className="card bg-base-100 shadow-lg">

              <SessionList
                onSessionSelect={handleSessionSelect}
                limit={10}
                showViewAll={true}
              />
          </div>
        </div>

        {/* Right column: Chat interface */}
        <div className="lg:col-span-2">
          <div className="card bg-base-100 shadow-lg">
            <div className="card-body p-4 min-h-[600px] flex flex-col">
              <div className="flex-1 flex flex-col">
                <ChatInterface user={user} session={activeSession} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Wrapper component that provides the session context
export default function ChatPage() {
  return (
    <SessionProvider>
      <ChatPageContent />
    </SessionProvider>
  );
}