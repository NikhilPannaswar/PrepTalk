import { NextRequest, NextResponse } from 'next/server';
import { sessionManager } from '@/lib/services/interviewSessionManager';
import { questionGenerator } from '@/lib/services/questionGenerator';
import { nanoid } from 'nanoid';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { role, difficulty } = body;

    // Validate input
    if (!role || !['easy', 'medium', 'hard'].includes(difficulty)) {
      return NextResponse.json(
        { error: 'Missing required fields: role, difficulty (easy|medium|hard)' },
        { status: 400 }
      );
    }

    // Create session
    const sessionId = nanoid();
    const state = sessionManager.createSession(sessionId, role, difficulty);

    // Generate first question
    const firstQuestion = await questionGenerator.generateNextQuestion({
      role,
      difficulty,
      lastAnswerQuality: 'average',
      weakAreas: [],
      questionNumber: 1,
    });

    // Update state with first question
    const updatedState = sessionManager.updateState(sessionId, {
      currentQuestion: firstQuestion,
      questionCount: 1,
    });

    return NextResponse.json({
      success: true,
      sessionId,
      state: updatedState,
      question: firstQuestion,
    });
  } catch (error) {
    console.error('Interview start error:', error);
    return NextResponse.json(
      { error: 'Failed to start interview' },
      { status: 500 }
    );
  }
}
