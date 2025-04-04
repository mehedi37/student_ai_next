'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '../../../utils/api';
import {
  CheckCircle2,
  XCircle,
  ArrowLeft,
  Clock,
  HelpCircle,
  Info,
  ChevronDown
} from 'lucide-react';

export default function QuizDetail() {
  const params = useParams();
  const router = useRouter();
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentAnswers, setCurrentAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [results, setResults] = useState(null);
  const [timeSpent, setTimeSpent] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [minutesRemaining, setMinutesRemaining] = useState(0);
  const [secondsRemaining, setSecondsRemaining] = useState(0);
  const [startTime, setStartTime] = useState(null);
  const timerRef = useRef(null);
  const isMounted = useRef(true);
  const autoSubmitting = useRef(false);

  useEffect(() => {
    isMounted.current = true;

    return () => {
      isMounted.current = false;
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (params.quizId) {
      fetchQuiz(params.quizId);
    }
  }, [params.quizId]);

  useEffect(() => {
    if (quiz && !submitted && !results && startTime) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }

      const quizDuration = quiz.time_limit ? quiz.time_limit * 60 : quiz.questions.length * 20;
      const elapsedTime = Math.floor((Date.now() - startTime) / 1000);
      const initialTimeRemaining = Math.max(0, quizDuration - elapsedTime);

      setTimeRemaining(initialTimeRemaining);
      setMinutesRemaining(Math.floor(initialTimeRemaining / 60));
      setSecondsRemaining(initialTimeRemaining % 60);

      timerRef.current = setInterval(() => {
        if (isMounted.current) {
          setTimeSpent(prev => prev + 1);
          setTimeRemaining(prev => {
            const newTimeRemaining = prev - 1;

            // Update minutes and seconds for countdown component
            setMinutesRemaining(Math.floor(newTimeRemaining / 60));
            setSecondsRemaining(newTimeRemaining % 60);

            if (newTimeRemaining <= 0 && !autoSubmitting.current) {
              autoSubmitting.current = true;
              clearInterval(timerRef.current);
              handleSubmit();
              return 0;
            }

            return newTimeRemaining;
          });
        }
      }, 1000);
    }

    if (submitted || results) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [quiz, submitted, startTime]);

  const fetchQuiz = async (quizId) => {
    try {
      setLoading(true);
      console.log(`Fetching quiz with ID: ${quizId}`);
      const data = await api.quizzes.get(quizId);

      console.log('Quiz API response:', data);

      if (!isMounted.current) {
        console.log('Component unmounted, skipping state updates');
        return;
      }

      if (!data) {
        console.error('Quiz data is undefined or null');
        setError('Failed to load quiz data. Please try again later.');
        setLoading(false);
        return;
      }

      if (!data.questions || !Array.isArray(data.questions) || data.questions.length === 0) {
        console.error('Invalid quiz questions data:', data.questions);
        setError('Quiz contains no questions or has an invalid format.');
        setLoading(false);
        return;
      }

      const validQuestions = data.questions.every(q =>
        q &&
        typeof q.question === 'string' &&
        Array.isArray(q.options)
      );

      if (!validQuestions) {
        console.error('Quiz questions have invalid structure:', data.questions);
        setError('Quiz questions are in an invalid format.');
        setLoading(false);
        return;
      }

      console.log('Setting quiz data:', data);
      setQuiz(data);

      const initialAnswers = {};
      data.questions.forEach(question => {
        initialAnswers[question.question_id] = null;
      });
      console.log('Setting initial answers:', initialAnswers);
      setCurrentAnswers(initialAnswers);
      setError(null);

      if (!startTime) {
        console.log('Setting start time');
        setStartTime(Date.now());
      }

      console.log('Setting loading to false');
      setLoading(false);
    } catch (err) {
      console.error('Error fetching quiz:', err);

      if (isMounted.current) {
        setError(`Failed to load quiz: ${err.message || 'Unknown error'}`);
        setLoading(false);
      }
    }
  };

  const handleAnswerSelect = (questionId, optionIndex) => {
    if (submitted) return;

    setCurrentAnswers(prev => ({
      ...prev,
      [questionId]: optionIndex
    }));
  };

  const handleSubmit = async () => {
    if (submitted) return;

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    try {
      const submitData = {
        quiz_id: quiz.id,
        answers: currentAnswers,
        time_spent: timeSpent
      };

      const result = await api.quizzes.submit(submitData);
      if (isMounted.current) {
        setSubmitted(true);
        setResults(result);
      }
    } catch (err) {
      console.error('Error submitting quiz:', err);
      if (isMounted.current) {
        setError('Failed to submit quiz. Please try again later.');
      }
    }
  };

  const handleBackToList = () => {
    router.push('/quizzes');
  };

  const formatTime = (seconds) => {
    if (seconds < 0) seconds = 0;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <div className="skeleton w-40 h-10"></div>
        </div>
        <div className="flex justify-between items-center mb-8">
          <div className="skeleton w-64 h-10"></div>
          <div className="skeleton w-48 h-8"></div>
        </div>
        <div className="space-y-8">
          {[1, 2, 3, 4, 5].map((_, idx) => (
            <div key={idx} className="card bg-base-100 shadow-md">
              <div className="card-body">
                <div className="skeleton h-8 w-full mb-4"></div>
                <div className="grid gap-3 mt-3">
                  <div className="skeleton h-16 w-full"></div>
                  <div className="skeleton h-16 w-full"></div>
                  <div className="skeleton h-16 w-full"></div>
                  <div className="skeleton h-16 w-full"></div>
                </div>
              </div>
            </div>
          ))}
          <div className="flex justify-center mt-8 mb-16">
            <div className="skeleton w-40 h-14"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="alert alert-error">
          <XCircle className="w-6 h-6" />
          <span>{error}</span>
        </div>
        <button onClick={handleBackToList} className="btn btn-primary mt-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Quizzes
        </button>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="alert alert-warning">
          <HelpCircle className="w-6 h-6" />
          <span>Quiz not found.</span>
        </div>
        <button onClick={handleBackToList} className="btn btn-primary mt-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Quizzes
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <button onClick={handleBackToList} className="btn btn-ghost">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Quizzes
        </button>
      </div>

      {/* Sticky timer header when not submitted */}
      {!submitted && (
        <div className="sticky top-0 z-10 py-2 bg-base-100 border-b border-base-300 shadow-sm">
          <div className="container mx-auto flex justify-between items-center">
            <h2 className="text-xl font-semibold">{quiz.topic_name}</h2>
            <div className="flex items-center gap-6">
              <div className={`flex items-center gap-2 ${timeRemaining < 60 ? 'text-error' : timeRemaining < 120 ? 'text-warning' : ''}`}>
                <Clock className="w-5 h-5" />
                <span className="font-mono">Remaining: </span>
                <span className="countdown font-mono text-xl">
                  <span style={{"--value": minutesRemaining}}></span>:
                  <span style={{"--value": secondsRemaining < 10 ? `0${secondsRemaining}` : secondsRemaining}}></span>
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center mb-8 mt-4">
        <h1 className="text-3xl font-bold text-primary">{quiz.topic_name}</h1>
      </div>

      {submitted && results ? (
        <div className="card bg-base-100 shadow-md mb-6">
          <div className="card-body">
            <h2 className="card-title text-2xl mb-4">Your Results</h2>
            <div className="stats bg-base-200 text-base-content shadow mb-4">
              <div className="stat">
                <div className="stat-title">Score</div>
                <div className="stat-value text-primary">{results.score}%</div>
                <div className="stat-desc">
                  {results.correct_count} / {quiz.questions.length} correct
                </div>
              </div>
              <div className="stat">
                <div className="stat-title">Time</div>
                <div className="stat-value">{formatTime(timeSpent)}</div>
                <div className="stat-desc">Total time spent</div>
              </div>
            </div>

            <div className="divider">Answers</div>

            <div className="space-y-6">
              {quiz.questions.map((question, idx) => {
                const userAnswer = currentAnswers[question.question_id];
                const questionResult = results.questions_with_answers[idx];
                const isCorrect = questionResult && questionResult.is_correct;
                const correctAnswer = questionResult && questionResult.correct_answer;
                const explanation = questionResult && questionResult.explanation;

                return (
                  <div key={question.question_id} className="card bg-base-100 shadow-md">
                    <div className="card-body p-5">
                      <div className="flex items-start gap-3 mb-3">
                        {isCorrect ? (
                          <CheckCircle2 className="w-6 h-6 text-success flex-shrink-0 mt-1" />
                        ) : (
                          <XCircle className="w-6 h-6 text-error flex-shrink-0 mt-1" />
                        )}
                        <h3 className="text-lg font-medium">
                          {idx + 1}. {question.question}
                        </h3>
                      </div>

                      <div className="grid gap-3 ml-9">
                        {question.options.map((option, optionIdx) => {
                          let optionClasses = "p-3 rounded-md flex items-center";
                          let iconElement = null;

                          // User selected this option
                          if (userAnswer === optionIdx) {
                            if (correctAnswer === optionIdx) {
                              // User selected correct answer - full green background
                              optionClasses += " bg-success text-success-content";
                              iconElement = <CheckCircle2 className="w-5 h-5 mr-2 flex-shrink-0" />;
                            } else {
                              // Wrong answer - full red background
                              optionClasses += " bg-error text-error-content";
                              iconElement = <XCircle className="w-5 h-5 mr-2 flex-shrink-0" />;
                            }
                          }
                          // User did not select but this is the correct answer - green outline
                          else if (correctAnswer === optionIdx) {
                            optionClasses += " border-2 border-success";
                            iconElement = <CheckCircle2 className="w-5 h-5 text-success mr-2 flex-shrink-0" />;
                          }
                          // Not selected, not correct
                          else {
                            optionClasses += " bg-base-200";
                          }

                          return (
                            <div key={optionIdx} className={optionClasses}>
                              {iconElement}
                              <span>{option}</span>
                            </div>
                          );
                        })}
                      </div>

                      {explanation && (
                        <div className="ml-9 mt-3">
                          <div className="collapse collapse-arrow bg-base-200 rounded-lg">
                            <input type="checkbox" className="peer" />
                            <div className="collapse-title bg-base-200 text-base-content peer-checked:bg-primary peer-checked:text-primary-content flex items-center">
                              <Info className="w-5 h-5 mr-2" />
                              <span>Explanation</span>
                            </div>
                            <div className="collapse-content bg-base-200 text-base-content peer-checked:bg-base-200 peer-checked:text-base-content">
                              <p className="p-2">{explanation}</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="card-actions justify-center mt-8">
              <button onClick={handleBackToList} className="btn btn-primary">
                Back to Quizzes
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {quiz.questions.map((question, idx) => (
            <div key={question.question_id} className="card bg-base-100 shadow-md">
              <div className="card-body">
                <h3 className="card-title text-lg">
                  {idx + 1}. {question.question}
                </h3>
                <div className="grid gap-3 mt-3">
                  {question.options.map((option, optionIdx) => (
                    <div
                      key={optionIdx}
                      className={`p-4 rounded-md cursor-pointer transition-colors ${
                        currentAnswers[question.question_id] === optionIdx
                          ? 'bg-primary text-primary-content'
                          : 'bg-base-200 hover:bg-base-300'
                      }`}
                      onClick={() => handleAnswerSelect(question.question_id, optionIdx)}
                    >
                      {option}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}

          <div className="flex justify-center mt-8 mb-16">
            <button
              onClick={handleSubmit}
              className="btn btn-primary btn-lg"
            >
              Submit Quiz
            </button>
          </div>
        </div>
      )}
    </div>
  );
}