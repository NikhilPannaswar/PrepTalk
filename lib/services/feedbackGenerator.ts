import { InterviewFeedback, EvaluationHistory } from '@/types/interview';
import { OllamaService } from './ollamaService';

const ollamaService = new OllamaService();

export class FeedbackGenerator {
  generateFinalFeedback(
    sessionId: string,
    evaluationHistory: EvaluationHistory[]
  ): InterviewFeedback {
    if (evaluationHistory.length === 0) {
      return this.emptyFeedback(sessionId);
    }

    // Calculate overall score
    const scores = evaluationHistory.map(e => e.evaluation.score);
    const overallScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);

    // Determine consistency for score adjustment
    const hasWeakAnswers = scores.some(s => s <= 4);
    const finalScore = hasWeakAnswers ? Math.max(overallScore - 1, 0) : overallScore;

    // Extract patterns from mistakes
    const allMistakes = evaluationHistory.flatMap(e => e.evaluation.mistakes);
    const mistakePatterns = this.extractPatterns(allMistakes);

    // Extract strengths (topics answered well)
    const strengths = this.extractStrengths(evaluationHistory);

    // Extract weak areas
    const weaknesses = mistakePatterns.slice(0, 3);

    // Generate actionable advice
    const advice = this.generateAdvice(weaknesses, evaluationHistory);

    return {
      sessionId,
      overallScore: Math.min(10, finalScore),
      strengths,
      weaknesses,
      advice,
      evaluationHistory,
    };
  }

  private extractStrengths(evaluationHistory: EvaluationHistory[]): string[] {
    const excellentAnswers = evaluationHistory.filter(e => e.evaluation.score >= 7);

    if (excellentAnswers.length === 0) {
      return ['Engagement and willingness to learn'];
    }

    // Extract topics from high-scoring answers
    const strengths: string[] = [];
    const topics = new Set<string>();

    for (const evaluation of excellentAnswers) {
      const question = evaluation.question.toLowerCase();
      if (question.includes('async')) topics.add('Asynchronous programming');
      else if (question.includes('event')) topics.add('Event handling and callbacks');
      else if (question.includes('dom')) topics.add('DOM manipulation');
      else if (question.includes('performance')) topics.add('Performance optimization');
      else if (question.includes('sorting')) topics.add('Algorithmic thinking');
      else if (question.includes('tree') || question.includes('graph'))
        topics.add('Data structure knowledge');
      else topics.add('Technical depth');
    }

    return Array.from(topics).slice(0, 3);
  }

  private extractPatterns(mistakes: string[]): string[] {
    const patterns: Map<string, number> = new Map();

    for (const mistake of mistakes) {
      const key = this.categorizeMistake(mistake);
      patterns.set(key, (patterns.get(key) || 0) + 1);
    }

    // Sort by frequency
    const sorted = Array.from(patterns.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([key]) => key);

    return sorted.slice(0, 3);
  }

  private categorizeMistake(mistake: string): string {
    const lower = mistake.toLowerCase();

    if (
      lower.includes('edge case') ||
      lower.includes('boundary') ||
      lower.includes('null') ||
      lower.includes('empty')
    ) {
      return 'Insufficient edge case consideration';
    }

    if (
      lower.includes('time complexity') ||
      lower.includes('space complexity') ||
      lower.includes('big o') ||
      lower.includes('complexity')
    ) {
      return 'Lack of complexity analysis';
    }

    if (
      lower.includes('example') ||
      lower.includes('demonstrate') ||
      lower.includes('concrete')
    ) {
      return 'Missing specific examples or demonstrations';
    }

    if (
      lower.includes('explanation') ||
      lower.includes('unclear') ||
      lower.includes('vague')
    ) {
      return 'Explanations lack clarity and depth';
    }

    if (lower.includes('incorrect') || lower.includes('wrong')) {
      return 'Some conceptual gaps or misunderstandings';
    }

    return 'Incomplete understanding of core concepts';
  }

  private generateAdvice(weaknesses: string[], evaluationHistory: EvaluationHistory[]): string {
    const weakArea = weaknesses[0] || 'fundamental concepts';

    if (weaknesses.includes('Insufficient edge case consideration')) {
      return `Practice thinking through edge cases systematically. For each problem, ask: What about empty input, single elements, negative numbers, or very large inputs? Build this habit before implementing.`;
    }

    if (weaknesses.includes('Lack of complexity analysis')) {
      return `For every solution you write, immediately identify the time and space complexity. Can you optimize further? This shows depth of thinking to interviewers.`;
    }

    if (weaknesses.includes('Missing specific examples or demonstrations')) {
      return `Always support your explanations with concrete examples or code snippets. Walk through your example step-by-step to demonstrate real understanding.`;
    }

    return `Focus on understanding the fundamentals deeply rather than memorizing solutions. Practice explaining your thought process out loud to build clarity.`;
  }

  private emptyFeedback(sessionId: string): InterviewFeedback {
    return {
      sessionId,
      overallScore: 0,
      strengths: ['N/A'],
      weaknesses: ['No responses to evaluate'],
      advice: 'Complete the interview to receive feedback.',
      evaluationHistory: [],
    };
  }
}

export const feedbackGenerator = new FeedbackGenerator();
