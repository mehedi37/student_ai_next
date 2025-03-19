'use client';

import { useState, useEffect, useRef } from 'react';
import { api } from '@/utils/api';
import { v4 as uuidv4 } from 'uuid';
import websocketManager from '@/utils/websocket';
import ChatMessage from './ChatMessage';

export default function ChatInterface({ user, session, wsClientId }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState(session?.session_id || null);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);

  // Expose method to append user message (used by speech recognition)
  useEffect(() => {
    window.chatInterface = {
      appendUserMessage: (text) => {
        handleSubmit(null, text);
      }
    };

    return () => {
      delete window.chatInterface;
    };
  }, [sessionId]);

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

    const unsubscribe = websocketManager.on('message', (data) => {
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
    });

    return () => unsubscribe();
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
      if (wsClientId && websocketManager.isConnected) {
        // Generate a unique message ID for tracking this conversation
        const messageId = uuidv4();

        // Send message through WebSocket
        await websocketManager.send({
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

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="flex flex-col h-[calc(100vh-200px)] max-w-4xl mx-auto">
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto space-y-4 pb-4 px-2"
      >
        {messages.length === 0 ? (
          <div className="text-center py-10">
            <h2 className="text-2xl font-bold text-gray-500">Welcome to Student AI Bot</h2>
            <p className="text-gray-400 mt-2">Ask me anything related to your studies!</p>
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
          <div className="flex items-center space-x-2 p-4 bg-gray-50 rounded-lg shadow-sm">
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: "600ms" }}></div>
            <span className="text-sm text-gray-500 ml-2">Thinking...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="flex items-center border-t border-gray-200 p-4 bg-white rounded-lg mt-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question..."
          className="flex-1 px-4 py-2 border rounded-l-lg focus:outline-none"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading}
          className="bg-blue-600 text-white px-4 py-2 rounded-r-lg hover:bg-blue-700 disabled:bg-blue-300"
        >
          {isLoading ? 'Thinking...' : 'Send'}
        </button>
      </form>
    </div>
  );
}
