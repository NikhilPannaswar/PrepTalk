'use client';

import { useState, useRef, useEffect } from 'react';
import { InterviewState, EvaluationResult } from '@/types/interview';

interface InterviewManagerProps {
  role: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export const InterviewManager: React.FC<InterviewManagerProps> = ({ role, difficulty }) => {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [state, setState] = useState<InterviewState | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<string>('');
  const [userAnswer, setUserAnswer] = useState('');
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Initialize interview
  useEffect(() => {
    const startInterview = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/interview/start', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ role, difficulty }),
        });

        if (!response.ok) throw new Error('Failed to start interview');

        const data = await response.json();
        setSessionId(data.sessionId);
        setState(data.state);
        setCurrentQuestion(data.question);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setIsLoading(false);
      }
    };

    startInterview();
  }, [role, difficulty]);

  const submitAnswer = async () => {
    if (!sessionId || !userAnswer.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/interview/answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, userAnswer }),
      });

      if (!response.ok) throw new Error('Failed to submit answer');

      const data = await response.json();
      setEvaluation(data.evaluation);
      setState(data.state);

      if (data.isInterviewComplete) {
        setIsComplete(true);
      } else {
        setCurrentQuestion(data.nextQuestion);
      }

      setUserAnswer('');
      inputRef.current?.focus();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      submitAnswer();
    }
  };

  if (isLoading && !state) {
    return <div className="p-8 text-center">Initializing interview...</div>;
  }

  if (error) {
    return (
      <div className="p-8 bg-red-50 border border-red-200 rounded">
        <p className="text-red-900 font-semibold">Error</p>
        <p className="text-red-700">{error}</p>
      </div>
    );
  }

  if (isComplete) {
    return (
      <div className="p-8 bg-blue-50 border border-blue-200 rounded">
        <h2 className="text-xl font-bold text-blue-900 mb-4">Interview Complete</h2>
        <p className="text-blue-700 mb-4">
          You've answered {state?.questionCount || 0} questions. Getting your feedback...
        </p>
        <button
          onClick={() => window.location.href = `/feedback?sessionId=${sessionId}`}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          View Feedback
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-8">
      {state && (
        <div className="mb-6 p-4 bg-gray-100 rounded">
          <p className="text-sm text-gray-600">
            <strong>Candidate:</strong> {state.userName}
          </p>
          <p className="text-sm text-gray-600">
            <strong>Role:</strong> {state.role} • <strong>Difficulty:</strong> {state.difficulty}
          </p>
          <p className="text-sm text-gray-600">
            <strong>Question:</strong> {state.questionCount} / 10
          </p>
        </div>
      )}

      {/* Question Display */}
      <div className="mb-6 p-6 bg-white border-2 border-gray-300 rounded">
        <p className="text-gray-500 text-sm mb-2">QUESTION {state?.questionCount || 1}</p>
        <p className="text-xl font-semibold text-gray-900">{currentQuestion}</p>
      </div>

      {/* Evaluation Display */}
      {evaluation && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded">
          <div className="mb-4">
            <p className="text-sm text-gray-600">SCORE</p>
            <p className="text-3xl font-bold text-yellow-900">{evaluation.score}/10</p>
          </div>

          <div className="mb-4">
            <p className="text-sm font-semibold text-gray-700">MISTAKES:</p>
            <ul className="list-disc list-inside mt-1 space-y-1">
              {evaluation.mistakes.map((mistake, i) => (
                <li key={i} className="text-sm text-gray-700">
                  {mistake}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-sm font-semibold text-gray-700">IMPROVEMENT:</p>
            <p className="text-sm text-gray-700 mt-1">{evaluation.improvement}</p>
          </div>
        </div>
      )}

      {/* Answer Input */}
      <div className="mb-4">
        <label className="block text-sm font-semibold text-gray-700 mb-2">YOUR ANSWER</label>
        <textarea
          ref={inputRef}
          value={userAnswer}
          onChange={(e) => setUserAnswer(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your answer here... (Ctrl+Enter to submit)"
          className="w-full px-4 py-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={4}
          disabled={isLoading || isComplete}
        />
      </div>

      <button
        onClick={submitAnswer}
        disabled={isLoading || !userAnswer.trim() || isComplete}
        className="w-full bg-blue-600 text-white font-semibold py-3 rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
      >
        {isLoading ? 'Evaluating...' : 'Submit Answer'}
      </button>

      <p className="text-xs text-gray-500 mt-2 text-center">
        Tip: Press Ctrl+Enter to submit quickly
      </p>
    </div>
  );
};
