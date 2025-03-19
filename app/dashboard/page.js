'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/context/AuthContext';
import CircleBot from '@/components/CircleBot';
import ChatInterface from '@/components/ChatInterface';
import Sidebar from '@/components/Sidebar';
import websocketManager from '@/utils/websocket';

export default function Dashboard() {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();
  const [isListening, setIsListening] = useState(false);
  const [activeSession, setActiveSession] = useState(null);
  const [wsConnected, setWsConnected] = useState(false);

  // Redirect if not logged in
  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/auth/login');
    }
  }, [user, isLoading, router]);

  // Connect to WebSocket
  useEffect(() => {
    if (user && !wsConnected) {
      websocketManager.connect()
        .then(() => {
          setWsConnected(true);
          console.log('WebSocket connected with client ID:', websocketManager.getClientId());

          // Add listener for connection status changes
          const unsubscribe = websocketManager.on('connection_status', (data) => {
            if (data.status === 'connected') {
              setWsConnected(true);
            } else if (data.status === 'disconnected') {
              setWsConnected(false);
            }
          });

          return () => unsubscribe();
        })
        .catch(err => {
          console.error('Failed to connect to WebSocket:', err);
        });
    }

    return () => {
      if (wsConnected) {
        websocketManager.disconnect();
        setWsConnected(false);
      }
    };
  }, [user, wsConnected]);

  const handleStartListening = () => {
    // Implement speech recognition here
    if ('webkitSpeechRecognition' in window) {
      const recognition = new window.webkitSpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        console.log('Transcript:', transcript);
        // Send transcript to ChatInterface
        if (window.chatInterface && typeof window.chatInterface.appendUserMessage === 'function') {
          window.chatInterface.appendUserMessage(transcript);
        }
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } else {
      alert('Speech recognition is not supported in your browser.');
    }
  };

  const handleStopListening = () => {
    // Stop speech recognition
    if ('webkitSpeechRecognition' in window) {
      const recognition = new window.webkitSpeechRecognition();
      recognition.stop();
    }
    setIsListening(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-gray-100">
      <Sidebar
        user={user}
        onLogout={logout}
        activeSession={activeSession}
        setActiveSession={setActiveSession}
      />

      <main className="flex-1 flex flex-col">
        <div className="flex-1 p-4 overflow-y-auto">
          <ChatInterface
            user={user}
            session={activeSession}
            wsClientId={wsConnected ? websocketManager.getClientId() : null}
          />
        </div>

        <div className="flex justify-center p-4">
          <CircleBot
            isListening={isListening}
            onStartListening={handleStartListening}
            onStopListening={handleStopListening}
          />
        </div>
      </main>
    </div>
  );
}
