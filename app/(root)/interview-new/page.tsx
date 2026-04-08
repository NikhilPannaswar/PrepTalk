'use client';

import { useState } from 'react';
import { InterviewManager } from '@/components/InterviewManager';
import { FeedbackDisplay } from '@/components/FeedbackDisplay';

type Stage = 'setup' | 'interview' | 'feedback';

export default function InterviewPage() {
  const [stage, setStage] = useState<Stage>('setup');
  const [role, setRole] = useState<string>('Frontend');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [sessionId, setSessionId] = useState<string | null>(null);

  const handleStartInterview = () => {
    setStage('interview');
  };

  const handleInterviewComplete = (completedSessionId: string) => {
    setSessionId(completedSessionId);
    setStage('feedback');
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      {stage === 'setup' && (
        <div className="max-w-md mx-auto p-8 bg-white rounded-lg shadow-lg">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">AI Mock Interview</h1>

          <div className="space-y-6">
            {/* Role Selection */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Interview Type
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option>Frontend</option>
                <option>DSA</option>
                <option>Node.js</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">Choose the role you're interviewing for</p>
            </div>

            {/* Difficulty Selection */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Difficulty Level
              </label>
              <div className="space-y-2">
                {(['easy', 'medium', 'hard'] as const).map((level) => (
                  <label key={level} className="flex items-center">
                    <input
                      type="radio"
                      name="difficulty"
                      value={level}
                      checked={difficulty === level}
                      onChange={(e) => setDifficulty(e.target.value as 'easy' | 'medium' | 'hard')}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="ml-2 text-gray-700 capitalize">{level}</span>
                  </label>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Difficulty will adapt based on your answers
              </p>
            </div>

            {/* Info */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-gray-700">
                <strong>Interview Format:</strong> 10 questions with real-time evaluation
              </p>
              <p className="text-sm text-gray-700 mt-2">
                <strong>Evaluation:</strong> Strict, realistic scoring (5-6 = average, 9-10 rare)
              </p>
              <p className="text-sm text-gray-700 mt-2">
                <strong>Time:</strong> ~20-30 minutes depending on answer length
              </p>
            </div>

            <button
              onClick={handleStartInterview}
              className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition text-lg"
            >
              Start Interview
            </button>
          </div>
        </div>
      )}

      {stage === 'interview' && (
        <>
          <InterviewManager role={role} difficulty={difficulty} />
          {/* Note: Call handleInterviewComplete when interview finishes */}
        </>
      )}

      {stage === 'feedback' && sessionId && (
        <>
          <FeedbackDisplay sessionId={sessionId} />
        </>
      )}
    </main>
  );
}
