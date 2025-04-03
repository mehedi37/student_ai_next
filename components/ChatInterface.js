'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { PlusCircle, SendHorizontal, Mic, MicOff, Loader2 } from 'lucide-react';
import ChatMessage from './ChatMessage';
import { api } from '@/utils/api';

export default function ChatInterface({ user, session }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingSession, setLoadingSession] = useState(false);
  const [error, setError] = useState(null);
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const recognitionRef = useRef(null);
  const router = useRouter();
  const isMounted = useRef(true);

  useEffect(() => {
    // Check if speech recognition is supported
    if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
      setSpeechSupported(true);
    }

    return () => {
      isMounted.current = false;
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  useEffect(() => {
    if (session) {
      setLoadingSession(true);

      // Extract messages from session if available
      if (session.recent_messages && Array.isArray(session.recent_messages)) {
        const formattedMessages = session.recent_messages.flatMap(msg => {
          const userMsg = {
            role: 'user',
            content: msg.utter,
            timestamp: msg.timestamp,
          };

          const assistantMsg = {
            role: 'assistant',
            content: msg.response,
            timestamp: msg.timestamp,
            metadata: msg.metadata,
            action_type: msg.action_type,
          };

          return [userMsg, assistantMsg];
        });

        setMessages(formattedMessages);
      } else {
        // If no messages or invalid format, set empty messages array
        setMessages([]);
      }

      setLoadingSession(false);
    } else {
      // New session, clear messages
      setMessages([]);
    }
  }, [session]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = {
      role: 'user',
      content: input.trim(),
      timestamp: new Date().toISOString(),
    };

    // Add the user's message immediately
    setMessages(prev => [...prev, userMessage]);

    // Create a loading message
    const loadingMessage = {
      role: 'assistant',
      content: '',
      isLoading: true,
    };

    setMessages(prev => [...prev, loadingMessage]);
    setInput('');
    setLoading(true);
    setError(null);

    try {
      const response = await api.chat.send({
        utter: userMessage.content,
        session_id: session?.session_id || undefined,
      });

      // Remove the loading message and add the real response
      setMessages(prev => {
        const withoutLoading = prev.filter(msg => !msg.isLoading);
        return [
          ...withoutLoading,
          {
            role: 'assistant',
            content: response.response,
            timestamp: new Date().toISOString(),
            metadata: response.metadata,
            action_type: response.action_type,
          }
        ];
      });

      // If this is a new session, update the URL with the session ID
      if (!session && response.session_id) {
        router.push(`/chat/${response.session_id}`);
      }
    } catch (err) {
      console.error("Error sending message:", err);
      setError(err.message || "Failed to send message. Please try again.");

      // Remove the loading message
      setMessages(prev => prev.filter(msg => !msg.isLoading));
    } finally {
      setLoading(false);
      // Focus the input field after sending
      inputRef.current?.focus();
    }
  };

  const handleNewChat = async () => {
    if (loading) return;

    router.push('/chat');
  };

  const toggleSpeechRecognition = () => {
    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      return;
    }

    try {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;

      recognition.continuous = true;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onresult = (event) => {
        const transcript = event.results[event.results.length - 1][0].transcript;
        setInput(prev => prev + ' ' + transcript);
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error', event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        if (isMounted.current) {
          setIsListening(false);
        }
      };

      recognition.start();
      setIsListening(true);
    } catch (error) {
      console.error('Speech recognition error:', error);
      setError('Speech recognition failed. Please try again or type your message.');
    }
  };

  if (loadingSession) {
    return (
      <div className="flex flex-col h-full items-center justify-center">
        <div className="skeleton w-full h-12 mb-4"></div>
        <div className="skeleton w-full h-24 mb-4"></div>
        <div className="skeleton w-full h-24 mb-4"></div>
        <div className="skeleton w-3/4 h-24 mb-4"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex justify-between items-center pb-4 border-b border-base-300">
        <h2 className="text-lg font-semibold">
          {session ? (session.title || 'Conversation') : 'New Conversation'}
        </h2>
        {session && (
          <button
            onClick={handleNewChat}
            className="btn btn-ghost btn-sm"
          >
            <PlusCircle className="h-4 w-4 mr-1" />
            New Chat
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto my-4 chat-messages p-1">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-base-content/70 p-4 text-center">
            <p className="mb-2">No messages yet.</p>
            <p>Start a conversation by typing a message below.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg, index) => (
              <ChatMessage
                key={index}
                message={msg}
                isLoading={msg.isLoading}
                isLastMessage={index === messages.length - 1}
              />
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <div className="mt-auto">
        {error && (
          <div className="alert alert-error mb-2 text-sm p-2">
            <span>{error}</span>
          </div>
        )}
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message..."
            className="input input-bordered flex-1"
            disabled={loading}
            ref={inputRef}
          />

          {speechSupported && (
            <button
              type="button"
              onClick={toggleSpeechRecognition}
              className={`btn ${isListening ? 'btn-error' : 'btn-ghost'}`}
              disabled={loading}
              aria-label={isListening ? "Stop listening" : "Start voice input"}
            >
              {isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
            </button>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading || !input.trim()}
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <SendHorizontal className="h-5 w-5" />
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
