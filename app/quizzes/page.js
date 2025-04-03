'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '../../utils/api';
import { AlertTriangle, BookOpen } from 'lucide-react';

// Components
import QuizCard from './components/QuizCard';
import SearchBar from './components/SearchBar';
import Pagination from './components/Pagination';

export default function QuizList() {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [topic, setTopic] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(6);
  const [total, setTotal] = useState(0);
  const router = useRouter();

  useEffect(() => {
    fetchQuizzes();
  }, [page, topic]);

  const fetchQuizzes = async () => {
    try {
      setLoading(true);
      const data = await api.quizzes.list(page, pageSize, topic || null);
      setQuizzes(data.quizzes);
      setTotal(data.total);
      setError(null);
    } catch (err) {
      console.error('Error fetching quizzes:', err);
      setError('Failed to load quizzes. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (searchTerm) => {
    setTopic(searchTerm);
    setPage(1); // Reset to first page when searching
  };

  const handlePageChange = (newPage) => {
    setPage(newPage);
  };

  const handleQuizSelect = (quizId) => {
    router.push(`/quizzes/${quizId}`);
  };

  const handleQuizDelete = async (quizId) => {
    try {
      await api.quizzes.delete(quizId);
      // Refresh quizzes after deletion
      fetchQuizzes();
    } catch (err) {
      console.error('Error deleting quiz:', err);
      setError('Failed to delete quiz. Please try again later.');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col items-center mb-8">
        <h1 className="text-3xl font-bold text-primary mb-4">Knowledge Quizzes</h1>
        <p className="text-base-content mb-6 text-center max-w-2xl">
          Test your knowledge with interactive quizzes. Search for a specific topic or browse through our collection.
        </p>
        <SearchBar onSearch={handleSearch} initialValue={topic} />
      </div>

      {error && (
        <div className="alert alert-error mb-6">
          <AlertTriangle className="w-6 h-6" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="py-4">
          {/* Header Skeleton */}
          <div className="flex flex-col items-center mb-8">
            <div className="skeleton h-10 w-64 mb-4"></div>
            <div className="skeleton h-4 w-full max-w-2xl mb-2"></div>
            <div className="skeleton h-4 w-2/3 max-w-xl mb-6"></div>
          </div>

          {/* Quiz Cards Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="card bg-base-200 shadow-xl">
                <div className="card-body">
                  <div className="skeleton h-8 w-3/4 mb-4"></div>
                  <div className="skeleton h-4 w-full mb-2"></div>
                  <div className="skeleton h-4 w-5/6 mb-4"></div>
                  <div className="flex items-center justify-between mt-2">
                    <div className="skeleton h-6 w-16"></div>
                    <div className="skeleton h-10 w-24 rounded-full"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination Skeleton */}
          <div className="mt-12 flex justify-center">
            <div className="join">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="skeleton h-10 w-10 mx-1 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      ) : quizzes.length === 0 ? (
        <div className="text-center py-16">
          <div className="card bg-base-200 max-w-md mx-auto">
            <div className="card-body">
              <h2 className="card-title justify-center mb-2">No Quizzes Found</h2>
              <p>
                {topic
                  ? `No quizzes matching "${topic}" were found. Try a different search term.`
                  : "No quizzes are available at the moment."}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {quizzes.map((quiz) => (
              <QuizCard
                key={quiz.id}
                quiz={quiz}
                onSelect={() => handleQuizSelect(quiz.id)}
                onDelete={() => handleQuizDelete(quiz.id)}
              />
            ))}
          </div>

          <div className="mt-12 flex justify-center">
            <Pagination
              currentPage={page}
              totalPages={Math.ceil(total / pageSize)}
              onPageChange={handlePageChange}
            />
          </div>
        </>
      )}
    </div>
  );
}