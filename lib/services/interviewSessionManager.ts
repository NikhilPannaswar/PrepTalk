import { InterviewState, EvaluationHistory } from '@/types/interview';

// In-memory session storage (in production, use Redis or database)
const sessionStore: Map<string, {
  state: InterviewState;
  evaluationHistory: EvaluationHistory[];
}> = new Map();

export class InterviewSessionManager {
  createSession(
    sessionId: string,
    role: string,
    difficulty: 'easy' | 'medium' | 'hard'
  ): InterviewState {
    const state: InterviewState = {
      sessionId,
      userName: 'Candidate',
      role,
      difficulty,
      questionCount: 0,
      currentQuestion: '',
      lastQuestion: '',
      lastAnswerQuality: 'average',
      weakAreas: [],
      nameUpdated: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    sessionStore.set(sessionId, {
      state,
      evaluationHistory: [],
    });

    return state;
  }

  getSession(sessionId: string): InterviewState | null {
    const session = sessionStore.get(sessionId);
    return session?.state || null;
  }

  getEvaluationHistory(sessionId: string): EvaluationHistory[] {
    const session = sessionStore.get(sessionId);
    return session?.evaluationHistory || [];
  }

  updateState(sessionId: string, updates: Partial<InterviewState>): InterviewState {
    const session = sessionStore.get(sessionId);
    if (!session) throw new Error('Session not found');

    const updatedState = {
      ...session.state,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    sessionStore.set(sessionId, {
      ...session,
      state: updatedState,
    });

    return updatedState;
  }

  addEvaluation(sessionId: string, evaluation: EvaluationHistory): void {
    const session = sessionStore.get(sessionId);
    if (!session) throw new Error('Session not found');

    session.evaluationHistory.push(evaluation);
  }

  detectNameChange(userMessage: string): string | null {
    // Match patterns like "call me X", "my name is X", "I'm X", "you can call me X"
    const patterns = [
      /call me (\w+)/i,
      /my name is (\w+)/i,
      /i['']m (\w+)/i,
      /you can call me (\w+)/i,
      /i go by (\w+)/i,
    ];

    for (const pattern of patterns) {
      const match = userMessage.match(pattern);
      if (match) return match[1];
    }

    return null;
  }

  deleteSession(sessionId: string): void {
    sessionStore.delete(sessionId);
  }

  // For development/testing
  getAllSessions(): Record<string, any> {
    const result: Record<string, any> = {};
    sessionStore.forEach((value, key) => {
      result[key] = value;
    });
    return result;
  }
}

export const sessionManager = new InterviewSessionManager();
