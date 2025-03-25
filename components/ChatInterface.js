'use client';

import { useState, useEffect, useRef } from 'react';
import { api } from '@/utils/api';
import { v4 as uuidv4 } from 'uuid';
import ChatMessage from './ChatMessage';
import Link from 'next/link';
import { Mic, MicOff, Send, Upload } from 'lucide-react';
import { useWebSocket } from '@/app/contexts/WebSocketContext';

export default function ChatInterface({ user, session, wsClientId }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState(session?.session_id || null);
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const { isConnected, send } = useWebSocket();

  // Update session ID when prop changes
  useEffect(() => {
    if (session?.session_id) {
      setSessionId(session.session_id);

      // Load messages for this session
      if (session.recent_messages?.length) {
        setMessages(session.recent_messages);
      } else {
        setMessages([]);
      }
    }
  }, [session]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Setup WebSocket listener for streaming responses
  useEffect(() => {
    if (!wsClientId) return;

    const handleMessage = (data) => {
      if (data.type === 'chat_response' && data.session_id === sessionId) {
        // Handle incremental updates for streaming response
        if (data.is_partial) {
          setMessages(prev => {
            const lastMessage = prev[prev.length - 1];

            // If the last message is already from the bot, update it
            if (lastMessage && lastMessage.sender === 'bot') {
              const updatedMessages = [...prev];
              updatedMessages[updatedMessages.length - 1] = {
                ...lastMessage,
                content: lastMessage.content + data.content
              };
              return updatedMessages;
            } else {
              // Otherwise add a new bot message
              return [...prev, {
                id: data.message_id || uuidv4(),
                content: data.content,
                sender: 'bot',
                timestamp: new Date().toISOString()
              }];
            }
          });
        } else {
          // Handle final message
          setMessages(prev => {
            // Remove any partial message from this response
            const filteredMessages = data.message_id ?
              prev.filter(m => m.id !== data.message_id) : prev;

            return [...filteredMessages, {
              id: data.message_id || uuidv4(),
              content: data.content,
              sender: 'bot',
              timestamp: new Date().toISOString(),
              metadata: data.metadata
            }];
          });
        }
      }
    };

    // Subscribe to WebSocket messages
    window.addEventListener('message', (event) => {
      if (event.data && typeof event.data === 'string') {
        try {
          const data = JSON.parse(event.data);
          handleMessage(data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      }
    });

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [wsClientId, sessionId]);

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
    setIsLoading(true);

    try {
      // Use WebSocket for sending if available
      if (wsClientId && isConnected) {
        // Generate a unique message ID for tracking this conversation
        const messageId = uuidv4();

        // Send message through WebSocket
        send({
          type: 'chat_message',
          message_id: messageId,
          content: messageText,
          session_id: sessionId,
          user_id: user?.id
        });

        // WebSocket responses will be handled by the listener set up in useEffect
      } else {
        // Fall back to HTTP request
        const response = await api.chat.send({
          utter: messageText,
          session_id: sessionId
        });

        // Add bot response to UI
        setMessages(prev => [...prev, {
          id: uuidv4(),
          content: response.response,
          sender: 'bot',
          timestamp: new Date().toISOString(),
          metadata: response.metadata
        }]);

        // Update session ID if needed
        if (response.session_id && !sessionId) {
          setSessionId(response.session_id);
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => [...prev, {
        id: uuidv4(),
        content: "Sorry, I couldn't process your message. Please try again.",
        sender: 'bot',
        timestamp: new Date().toISOString(),
        isError: true
      }]);
    } finally {
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
          messages.map(message => (
            <ChatMessage
              key={message.id}
              message={message}
              isUser={message.sender === 'user'}
            />
          ))
        )}

        {/* Loading indicator */}
        {isLoading && (
          <div className="chat chat-start">
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
