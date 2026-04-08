import { NextRequest, NextResponse } from 'next/server';
import { sessionManager } from '@/lib/services/interviewSessionManager';
import { evaluationEngine } from '@/lib/services/evaluationEngine';
import { questionGenerator } from '@/lib/services/questionGenerator';

const MAX_QUESTIONS = 10;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, userAnswer } = body;

    // Validate input
    if (!sessionId || !userAnswer) {
      return NextResponse.json(
        { error: 'Missing required fields: sessionId, userAnswer' },
        { status: 400 }
      );
    }

    // Get session
    const state = sessionManager.getSession(sessionId);
    if (!state) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    // Detect name change
    const detectedName = sessionManager.detectNameChange(userAnswer);
    if (detectedName && !state.nameUpdated) {
      sessionManager.updateState(sessionId, {
        userName: detectedName,
        nameUpdated: true,
      });
    }

    // Evaluate answer
    const evaluation = await evaluationEngine.evaluateAnswer(
      state.currentQuestion,
      userAnswer,
      state
    );

    const answerQuality = evaluationEngine.determineAnswerQuality(evaluation.score);

    // Update weak areas if poor answer
    const updatedWeakAreas =
      answerQuality === 'poor'
        ? evaluationEngine.updateWeakAreas(
          state.weakAreas,
          evaluation.mistakes,
          state.currentQuestion.split(' ').slice(0, 3).join(' ')
        )
        : state.weakAreas;

    // Store evaluation
    sessionManager.addEvaluation(sessionId, {
      questionIndex: state.questionCount,
      question: state.currentQuestion,
      userAnswer,
      evaluation,
      timestamp: new Date().toISOString(),
    });

    // Check if interview should end
    if (state.questionCount >= MAX_QUESTIONS) {
      const updatedState = sessionManager.updateState(sessionId, {
        lastAnswerQuality: answerQuality,
        weakAreas: updatedWeakAreas,
      });

      return NextResponse.json({
        success: true,
        evaluation,
        isInterviewComplete: true,
        state: updatedState,
      });
    }

    // Generate next question
    const nextQuestion = await questionGenerator.generateNextQuestion({
      role: state.role,
      difficulty: state.difficulty,
      lastAnswerQuality: answerQuality,
      weakAreas: updatedWeakAreas,
      questionNumber: state.questionCount + 1,
    });

    // Update state with next question
    const updatedState = sessionManager.updateState(sessionId, {
      lastQuestion: state.currentQuestion,
      currentQuestion: nextQuestion,
      lastAnswerQuality: answerQuality,
      weakAreas: updatedWeakAreas,
      questionCount: state.questionCount + 1,
    });

    return NextResponse.json({
      success: true,
      evaluation,
      isInterviewComplete: false,
      nextQuestion,
      state: updatedState,
    });
  } catch (error) {
    console.error('Answer evaluation error:', error);
    return NextResponse.json(
      { error: 'Failed to evaluate answer' },
      { status: 500 }
    );
  }
}
