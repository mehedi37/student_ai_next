'use client';

import { useState, useEffect, useRef } from 'react';
import { api } from '@/utils/api';
import { v4 as uuidv4 } from 'uuid';
import ChatMessage from './ChatMessage';
import Link from 'next/link';
import { Mic, MicOff, Send, Upload } from 'lucide-react';

export default function ChatInterface({ user, session }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState(session?.session_id || null);
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);

  // Update session ID when prop changes
  useEffect(() => {
    if (session?.session_id) {
      console.log('Setting session in ChatInterface:', session.session_id);
      setSessionId(session.session_id);

      // Load messages for this session
      if (session.recent_messages && Array.isArray(session.recent_messages) && session.recent_messages.length) {
        console.log(`Loading ${session.recent_messages.length} messages from session`);

        // Transform the session messages to the expected format
        // Each message in recent_messages contains both user's message (utter) and bot's response
        const formattedMessages = [];

        session.recent_messages.forEach(msg => {
          // Add user message first
          if (msg.utter) {
            formattedMessages.push({
              id: uuidv4(),
              content: msg.utter,
              sender: 'user',
              timestamp: msg.timestamp,
            });
          }

          // Then add bot response
          if (msg.response) {
            formattedMessages.push({
              id: uuidv4(),
              content: msg.response,
              sender: 'bot',
              timestamp: msg.timestamp,
              metadata: msg.metadata || {}
            });
          }
        });

        setMessages(formattedMessages);
      } else {
        console.log('No messages found in session, starting fresh chat');
        setMessages([]);
      }
    } else {
      // Reset state when no session is provided (new session)
      console.log('No session provided, resetting state');
      setSessionId(null);
      setMessages([]);
    }
  }, [session]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e, speechInput = null) => {
    if (e) e.preventDefault();

    const messageText = speechInput || input;
    if (!messageText.trim()) return;

    // Add user message to UI immediately
    const userMessage = {
      id: uuidv4(),
      content: messageText,
      sender: 'user',
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true); // Set loading state

    try {
      // Use HTTP API for chat - this is the standard API defined in OpenAPI
      console.log('Sending message via HTTP API', {
        messageText,
        sessionId,
        hasExistingSession: !!sessionId
      });

      const response = await api.chat.send({
        utter: messageText,
        session_id: sessionId
      });

      // Validate the response
      if (!response || typeof response.response !== 'string') {
        throw new Error('Invalid response received from chat API');
      }

      console.log('Received valid chat response', {
        newSessionId: response.session_id,
        messageLength: response.response.length
      });

      // Add bot response to UI
      setMessages(prev => [...prev, {
        id: uuidv4(),
        content: response.response || '',  // Ensure content is never undefined
        sender: 'bot',
        timestamp: new Date().toISOString(),
        metadata: response.metadata
      }]);

      // Update session ID if needed
      if (response.session_id && !sessionId) {
        console.log('Setting new session ID from response:', response.session_id);
        setSessionId(response.session_id);
      }

      // Turn off loading state
      setIsLoading(false);
    } catch (error) {
      console.error('Error sending message:', error);

      const errorMessage = error.message === 'Invalid response received from chat API'
        ? "I received an invalid response. Please try again."
        : "Sorry, I couldn't process your message. Please try again.";

      setMessages(prev => [...prev, {
        id: uuidv4(),
        content: errorMessage,
        sender: 'bot',
        timestamp: new Date().toISOString(),
        isError: true
      }]);

      // Always turn off loading on error
      setIsLoading(false);
    }
  };

  const toggleVoiceRecognition = () => {
    if (!('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
      alert('Speech recognition is not supported in your browser.');
      return;
    }

    if (isListening) {
      setIsListening(false);
      // Stop speech recognition
      window.recognition?.stop();
    } else {
      setIsListening(true);

      // Initialize speech recognition
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;

      recognition.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map(result => result[0])
          .map(result => result.transcript)
          .join('');

        setInput(transcript);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
      window.recognition = recognition;
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages container with better scrolling */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto space-y-4 px-2 pb-4 chat-messages"
      >
        {messages.length === 0 ? (
          <div className="hero bg-base-200 rounded-box p-6 mt-4">
            <div className="hero-content text-center">
              <div className="max-w-md">
                <h2 className="text-2xl font-bold">Welcome to Student AI Bot</h2>
                <p className="py-4">Ask me anything related to your studies!</p>
              </div>
            </div>
          </div>
        ) : (
          // Wrap with a Fragment and map with unique keys
          <>
            {messages.map(message => (
              <ChatMessage
                key={message.id || uuidv4()} // Ensure we always have a key
                message={{
                  ...message,
                  content: message.content || '' // Ensure content is never undefined
                }}
                isUser={message.sender === 'user'}
              />
            ))}
          </>
        )}

        {/* Loading indicator */}
        {isLoading && (
          <div className="chat chat-start" key="loading-indicator">
            <div className="chat-bubble chat-bubble-primary min-h-10 flex items-center gap-2">
              <span className="loading loading-dots loading-md"></span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input form with fixed bottom position */}
      <form
        onSubmit={handleSubmit}
        className="flex gap-2 mt-4 p-2 bg-base-100 rounded-lg border border-base-300"
      >
        <Link href="/upload" className="btn btn-ghost">
          <Upload className="h-5 w-5" />
        </Link>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question..."
          className="input input-bordered flex-1"
          disabled={isLoading}
        />
        <button
          type="button"
          onClick={toggleVoiceRecognition}
          className={`btn ${isListening ? 'btn-accent' : 'btn-ghost'}`}
          disabled={isLoading}
        >
          {isListening ? (
            <Mic className="h-5 w-5" />
          ) : (
            <MicOff className="h-5 w-5" />
          )}
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="btn btn-primary"
        >
          {isLoading ? (
            <span className="loading loading-spinner loading-xs"></span>
          ) : (
            <Send className="h-5 w-5" />
          )}
        </button>
      </form>
    </div>
  );
}
