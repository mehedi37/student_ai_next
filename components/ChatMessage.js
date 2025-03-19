'use client';

import { useState } from 'react';

export default function ChatMessage({ message, isUser }) {
  const [expanded, setExpanded] = useState(false);

  const hasMetadata = message.metadata && Object.keys(message.metadata).length > 0;

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-3xl rounded-lg px-4 py-2 ${
        isUser
          ? 'bg-blue-500 text-white'
          : message.isError
            ? 'bg-red-100 text-red-800'
            : 'bg-gray-100 text-gray-800'
      }`}>
        <div className="whitespace-pre-wrap">{message.content}</div>

        {hasMetadata && (
          <div className="mt-2">
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-xs underline text-blue-400 hover:text-blue-600"
            >
              {expanded ? 'Hide details' : 'Show details'}
            </button>

            {expanded && (
              <pre className="mt-1 text-xs bg-gray-800 text-gray-200 p-2 rounded overflow-x-auto">
                {JSON.stringify(message.metadata, null, 2)}
              </pre>
            )}
          </div>
        )}

        <div className="text-xs opacity-70 mt-1">
          {new Date(message.timestamp).toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
}
