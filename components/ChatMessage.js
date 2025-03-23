'use client';

import { useRef, useState, useEffect } from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { User, Bot, X, Volume2 } from 'lucide-react';

export default function ChatMessage({ message, isUser }) {
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const audioRef = useRef(null);

  // Toggle audio playback - using basic browser speech synthesis
  const toggleAudio = () => {
    if (isAudioPlaying) {
      window.speechSynthesis.cancel();
      setIsAudioPlaying(false);
    } else {
      const utterance = new SpeechSynthesisUtterance(message.content);
      utterance.onend = () => setIsAudioPlaying(false);
      window.speechSynthesis.speak(utterance);
      setIsAudioPlaying(true);
    }
  };

  // Clean up any speech synthesis on unmount
  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  // Parse markdown to HTML and sanitize it
  const renderMarkdown = (content) => {
    const html = marked(content);
    const sanitizedHtml = DOMPurify.sanitize(html);
    return { __html: sanitizedHtml };
  };

  return (
    <div className={`chat ${isUser ? 'chat-end' : 'chat-start'}`}>
      <div className="chat-image avatar-placeholder">
        <div className={`w-10 rounded-full grid place-items-center ${isUser ? 'bg-accent text-accent-content' : 'bg-primary text-primary-content'}`}>
          {isUser ? (
            <User className="h-5 w-5" />
          ) : (
            <Bot className="h-5 w-5" />
          )}
        </div>
      </div>
      <div className="chat-header">
        {isUser ? "You" : "Student AI"}
        <time className="text-xs opacity-50 ml-1">
          {new Date(message.timestamp).toLocaleTimeString()}
        </time>
      </div>
      <div className={`chat-bubble ${isUser ? 'chat-bubble-accent' : 'chat-bubble-primary'} prose prose-sm max-w-none`}>
        <div dangerouslySetInnerHTML={renderMarkdown(message.content)} />
      </div>
      <div className="chat-footer opacity-50">
        {!isUser && (
          <button
            className="btn btn-circle btn-xs"
            onClick={toggleAudio}
            aria-label={isAudioPlaying ? "Stop speech" : "Read aloud"}
          >
            {isAudioPlaying ? (
              <X className="h-4 w-4" />
            ) : (
              <Volume2 className="h-4 w-4" />
            )}
          </button>
        )}
      </div>
    </div>
  );
}
