'use client';

import { formatDistanceToNow } from 'date-fns';
import { Clock, Hash, Trash2, ExternalLink } from 'lucide-react';

export default function QuizCard({ quiz, onSelect, onDelete }) {
  const { id, topic_name, created_at, question_count, score } = quiz;

  const formattedDate = created_at
    ? formatDistanceToNow(new Date(created_at), { addSuffix: true })
    : 'Unknown date';

  return (
    <div className="card bg-base-100 shadow-md hover:shadow-lg transition-shadow">
      <div className="card-body">
        <h2 className="card-title text-primary">{topic_name}</h2>
        <div className="flex flex-col gap-1 mt-2 mb-4">
          <div className="flex justify-between text-sm">
            <span className="flex items-center gap-1">
              <Hash className="w-4 h-4" />
              Questions:
            </span>
            <span className="font-medium">{question_count || 0}</span>
          </div>
          {score !== null && (
            <div className="flex justify-between text-sm">
              <span>Your Score:</span>
              <span className="font-medium">{score}%</span>
            </div>
          )}
          <div className="flex justify-between text-sm">
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              Created:
            </span>
            <span className="font-medium">{formattedDate}</span>
          </div>
        </div>
        <div className="card-actions justify-end mt-2">
          <div className="tooltip tooltip-left" data-tip="Delete Quiz">
            <button
              onClick={() => onDelete(id)}
              className="btn btn-ghost btn-sm text-error"
              aria-label="Delete quiz"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
          <button
            onClick={() => onSelect(id)}
            className="btn btn-primary btn-sm"
          >
            <ExternalLink className="w-4 h-4 mr-1" />
            Start Quiz
          </button>
        </div>
      </div>
    </div>
  );
}