export interface InterviewState {
  sessionId: string;
  userName: string;
  role: string;
  difficulty: 'easy' | 'medium' | 'hard';
  questionCount: number;
  currentQuestion: string;
  lastQuestion: string;
  lastAnswerQuality: 'poor' | 'average' | 'good';
  weakAreas: string[];
  nameUpdated: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface EvaluationResult {
  score: number; // 0-10
  mistakes: string[]; // 2 specific technical mistakes
  improvement: string; // 1 actionable improvement
  analysis: string; // brief reasoning
}

export interface EvaluationHistory {
  questionIndex: number;
  question: string;
  userAnswer: string;
  evaluation: EvaluationResult;
  timestamp: string;
}

export interface InterviewFeedback {
  sessionId: string;
  overallScore: number;
  strengths: string[]; // max 3
  weaknesses: string[]; // max 3
  advice: string; // 1-2 sentences, actionable
  evaluationHistory: EvaluationHistory[];
}

export interface Answer {
  userAnswer: string;
  userName?: string; // if user provided their name
}

export interface InterviewConfig {
  role: string; // Frontend, DSA, etc
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface OllamaRequest {
  model: string;
  prompt: string;
  stream: boolean;
  temperature?: number;
  top_p?: number;
  top_k?: number;
}

export interface OllamaResponse {
  model: string;
  created_at: string;
  response: string;
  done: boolean;
}
