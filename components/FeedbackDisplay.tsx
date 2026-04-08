'use client';

import { InterviewFeedback } from '@/types/interview';
import { useEffect, useState } from 'react';

interface FeedbackDisplayProps {
  sessionId: string;
  userName?: string;
}

export const FeedbackDisplay: React.FC<FeedbackDisplayProps> = ({ sessionId, userName }) => {
  const [feedback, setFeedback] = useState<InterviewFeedback | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFeedback = async () => {
      try {
        const response = await fetch(`/api/interview/feedback?sessionId=${sessionId}`);

        if (!response.ok) throw new Error('Failed to fetch feedback');

        const data = await response.json();
        setFeedback(data.feedback);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setIsLoading(false);
      }
    };

    fetchFeedback();
  }, [sessionId]);

  if (isLoading) {
    return <div className="p-8 text-center">Loading your feedback...</div>;
  }

  if (error) {
    return (
      <div className="p-8 bg-red-50 border border-red-200 rounded">
        <p className="text-red-900 font-semibold">Error</p>
        <p className="text-red-700">{error}</p>
      </div>
    );
  }

  if (!feedback) {
    return <div className="p-8 text-center">No feedback available</div>;
  }

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'bg-green-100 border-green-300 text-green-900';
    if (score >= 6) return 'bg-yellow-100 border-yellow-300 text-yellow-900';
    return 'bg-red-100 border-red-300 text-red-900';
  };

  return (
    <div className="max-w-2xl mx-auto p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Interview Results</h1>
        {userName && <p className="text-lg text-gray-600">Candidate: {userName}</p>}
      </div>

      {/* Overall Score */}
      <div className={`p-6 rounded border-2 mb-8 ${getScoreColor(feedback.overallScore)}`}>
        <p className="text-sm font-semibold mb-2 opacity-75">OVERALL SCORE</p>
        <p className="text-5xl font-bold">{feedback.overallScore}/10</p>
      </div>

      {/* Strengths */}
      <section className="mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Strengths</h2>
        {feedback.strengths.length > 0 ? (
          <ul className="space-y-2">
            {feedback.strengths.map((strength, i) => (
              <li
                key={i}
                className="flex items-start p-3 bg-green-50 border-l-4 border-green-500 rounded"
              >
                <span className="text-green-600 font-bold mr-3">✓</span>
                <span className="text-gray-900">{strength}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-600 italic">No strengths recorded</p>
        )}
      </section>

      {/* Weaknesses */}
      <section className="mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Areas for Improvement</h2>
        {feedback.weaknesses.length > 0 ? (
          <ul className="space-y-2">
            {feedback.weaknesses.map((weakness, i) => (
              <li
                key={i}
                className="flex items-start p-3 bg-red-50 border-l-4 border-red-500 rounded"
              >
                <span className="text-red-600 font-bold mr-3">•</span>
                <span className="text-gray-900">{weakness}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-600 italic">No weaknesses recorded</p>
        )}
      </section>

      {/* Advice */}
      <section className="mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Advice</h2>
        <p className="p-4 bg-blue-50 border-l-4 border-blue-500 text-gray-900 rounded">
          {feedback.advice}
        </p>
      </section>

      {/* Detailed Evaluation History */}
      <section>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Question-by-Question Breakdown</h2>
        <div className="space-y-4">
          {feedback.evaluationHistory.map((historyItem, i) => (
            <div key={i} className="p-4 border border-gray-300 rounded bg-white">
              <div className="flex items-start justify-between mb-3">
                <p className="font-semibold text-gray-900 flex-1">Q{historyItem.questionIndex}: {historyItem.question}</p>
                <p className={`font-bold px-3 py-1 rounded text-sm whitespace-nowrap ml-4 ${
                  historyItem.evaluation.score >= 7 ? 'bg-green-100 text-green-900' :
                  historyItem.evaluation.score >= 5 ? 'bg-yellow-100 text-yellow-900' :
                  'bg-red-100 text-red-900'
                }`}>
                  {historyItem.evaluation.score}/10
                </p>
              </div>

              <div className="mb-3 p-3 bg-gray-50 rounded">
                <p className="text-sm font-semibold text-gray-700 mb-1">Your Answer:</p>
                <p className="text-sm text-gray-600">{historyItem.userAnswer.substring(0, 150)}...</p>
              </div>

              <div className="space-y-2 text-sm">
                <div>
                  <p className="font-semibold text-gray-700 mb-1">Mistakes:</p>
                  <ul className="list-disc list-inside space-y-1">
                    {historyItem.evaluation.mistakes.map((mistake, j) => (
                      <li key={j} className="text-gray-600">{mistake}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <p className="font-semibold text-gray-700 mb-1">Improvement:</p>
                  <p className="text-gray-600">{historyItem.evaluation.improvement}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Action Buttons */}
      <div className="mt-8 flex gap-4">
        <button
          onClick={() => window.location.href = '/'}
          className="flex-1 bg-gray-600 text-white font-semibold py-3 rounded hover:bg-gray-700 transition"
        >
          Start New Interview
        </button>
        <button
          onClick={() => window.print()}
          className="flex-1 bg-blue-600 text-white font-semibold py-3 rounded hover:bg-blue-700 transition"
        >
          Print Results
        </button>
      </div>
    </div>
  );
};
