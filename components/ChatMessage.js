'use client';

import { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { User, Bot, Copy, Check } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function ChatMessage({ message, isLoading, isLastMessage }) {
  const [copied, setCopied] = useState(false);
  const [timeAgo, setTimeAgo] = useState('');
  const contentRef = useRef(null);
  const messageRef = useRef(null);

  // Extract properties from message
  const { role, content, timestamp } = message || { role: 'assistant', content: '', timestamp: new Date().toISOString() };
  const isUser = role === 'user';
  const messageTime = timestamp ? new Date(timestamp) : new Date();

  // Scroll to view if it's the last message
  useEffect(() => {
    if (isLastMessage && messageRef.current) {
      messageRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [isLastMessage, content]);

  useEffect(() => {
    // Format the time ago string
    if (timestamp) {
      setTimeAgo(formatDistanceToNow(messageTime, { addSuffix: true }));

      // Update time ago every minute
      const interval = setInterval(() => {
        setTimeAgo(formatDistanceToNow(messageTime, { addSuffix: true }));
      }, 60000);

      return () => clearInterval(interval);
    }
  }, [messageTime, timestamp]);

  // Handle copy to clipboard
  const copyToClipboard = () => {
    if (!content) return;

    navigator.clipboard.writeText(content)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(err => {
        console.error('Failed to copy text: ', err);
      });
  };

  // Show loading state
  if (isLoading) {
    return (
      <div
        ref={messageRef}
        className={`chat ${isUser ? 'chat-end' : 'chat-start'} mb-4`}
      >
        <div className="chat-image avatar">
          <div className={`w-10 rounded-full ${isUser ? 'bg-primary' : 'bg-neutral'} grid place-items-center text-white`}>
            {isUser ? (
              <User className="w-5 h-5" />
            ) : (
              <Bot className="w-5 h-5" />
            )}
          </div>
        </div>
        <div className={`chat-bubble min-h-12 flex items-center ${isUser ? 'chat-bubble-primary' : ''}`}>
          <span className="loading loading-dots loading-sm"></span>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={messageRef}
      className={`chat ${isUser ? 'chat-end' : 'chat-start'} mb-4 group`}
    >
      <div className="chat-image">
        <div className={`w-10 rounded-full ${isUser ? 'bg-primary' : 'bg-neutral'} grid place-items-center text-white`}>
          {isUser ? (
            <User className="w-5 h-5" />
          ) : (
            <Bot className="w-5 h-5" />
          )}
        </div>
      </div>

      <div className="chat-header text-xs opacity-75">
        {isUser ? 'You' : 'AI Assistant'}
        {timestamp && <span className="ml-2">{timeAgo}</span>}
      </div>

      <div className={`chat-bubble ${isUser ? 'chat-bubble-primary' : ''} relative`}>
        <div ref={contentRef} className="prose prose-sm max-w-none">
          {isUser ? (
            <div className="whitespace-pre-wrap">{content}</div>
          ) : (
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {content}
            </ReactMarkdown>
          )}
        </div>

        <button
          onClick={copyToClipboard}
          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity btn btn-ghost btn-xs btn-circle"
          aria-label="Copy message"
        >
          {copied ? (
            <Check className="w-3 h-3" />
          ) : (
            <Copy className="w-3 h-3" />
          )}
        </button>
      </div>

      {message?.sources && message.sources.length > 0 && (
        <div className="chat-footer opacity-75 text-xs mt-1">
          <span>Sources:</span>
          {message.sources.map((source, idx) => (
            <span key={idx} className="badge badge-sm badge-outline ml-1">
              {source.title || `Source ${idx + 1}`}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
