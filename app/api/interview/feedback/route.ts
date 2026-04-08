import { NextRequest, NextResponse } from 'next/server';
import { sessionManager } from '@/lib/services/interviewSessionManager';
import { feedbackGenerator } from '@/lib/services/feedbackGenerator';

export async function GET(request: NextRequest) {
  try {
    const sessionId = request.nextUrl.searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Missing required parameter: sessionId' },
        { status: 400 }
      );
    }

    // Get session and evaluation history
    const state = sessionManager.getSession(sessionId);
    if (!state) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    const evaluationHistory = sessionManager.getEvaluationHistory(sessionId);

    // Generate final feedback
    const feedback = feedbackGenerator.generateFinalFeedback(sessionId, evaluationHistory);

    // Clean up session
    sessionManager.deleteSession(sessionId);

    return NextResponse.json({
      success: true,
      feedback,
      userName: state.userName,
    });
  } catch (error) {
    console.error('Feedback generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate feedback' },
      { status: 500 }
    );
  }
}
