'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/utils/api';
import { useAuth } from '@/components/context/AuthContext';
import ChatInterface from '@/components/ChatInterface';
import { ArrowLeft, AlertTriangle } from 'lucide-react';

export default function ChatSessionPage() {
  const { sessionId } = useParams();
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (sessionId && user && !authLoading) {
      fetchSession();
    }
  }, [sessionId, user, authLoading]);

  const fetchSession = async () => {
    try {
      setLoading(true);
      const sessionData = await api.sessions.get(sessionId);
      setSession(sessionData);
      setError(null);
    } catch (err) {
      console.error('Error fetching session:', err);
      setError('Failed to load conversation. It may not exist or you may not have permission to view it.');
    } finally {
      setLoading(false);
    }
  };

  const handleBackClick = () => {
    router.push('/chat');
  };

  // Show loading state
  if (loading || authLoading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="container mx-auto p-4 lg:p-6">
        <button onClick={handleBackClick} className="btn btn-ghost mb-4">
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back to Chat
        </button>

        <div className="alert alert-error shadow-lg">
          <AlertTriangle className="h-6 w-6" />
          <div>
            <h3 className="font-bold">Error</h3>
            <div className="text-xs">{error}</div>
          </div>
        </div>
      </div>
    );
  }

  // If session not found
  if (!session) {
    return (
      <div className="container mx-auto p-4 lg:p-6">
        <button onClick={handleBackClick} className="btn btn-ghost mb-4">
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back to Chat
        </button>

        <div className="alert alert-warning shadow-lg">
          <AlertTriangle className="h-6 w-6" />
          <div>
            <h3 className="font-bold">Session Not Found</h3>
            <div className="text-xs">The requested conversation could not be found.</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 lg:p-6">
      <div className="mb-4">
        <button onClick={handleBackClick} className="btn btn-ghost">
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back to Chats
        </button>
      </div>

      <div className="card bg-base-100 shadow-lg">
        <div className="card-body p-4 min-h-[600px] flex flex-col">
          <div className="flex-1 flex flex-col">
            <ChatInterface user={user} session={session} />
          </div>
        </div>
      </div>
    </div>
  );
}