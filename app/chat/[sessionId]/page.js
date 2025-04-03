'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/context/AuthContext';
import { api } from '@/utils/api';
import ChatInterface from '@/components/ChatInterface';
import ChatLayout from '@/components/ChatLayout';
import { Loader2 } from 'lucide-react';

export default function ChatPage({ params }) {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const { sessionId } = params;

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/auth');
    }
  }, [user, isLoading, router]);

  // Load the specific session
  useEffect(() => {
    if (sessionId && user) {
      const loadSession = async () => {
        setLoading(true);
        try {
          const sessionData = await api.sessions.get(sessionId);
          setSession(sessionData);
        } catch (error) {
          console.error('Error loading session:', error);
          // Redirect to dashboard if session not found
          router.push('/dashboard');
        } finally {
          setLoading(false);
        }
      };
      loadSession();
    }
  }, [sessionId, user, router]);

  // Loading state
  if (isLoading || loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <ChatLayout>
      <div className="container mx-auto max-w-5xl">
        <h1 className="text-2xl font-bold mb-6">
          Chat {session?.title ? `- ${session.title}` : `#${sessionId.slice(0, 6)}`}
        </h1>

        {/* Custom scrollbar styles for the chat interface */}
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
        `}</style>

        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <ChatInterface user={user} session={session} />
          </div>
        </div>
      </div>
    </ChatLayout>
  );
}