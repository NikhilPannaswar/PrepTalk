import { EvaluationResult, InterviewState } from '@/types/interview';
import { OllamaService } from './ollamaService';

const ollamaService = new OllamaService();

export class EvaluationEngine {
  async evaluateAnswer(
    question: string,
    userAnswer: string,
    interviewState: InterviewState
  ): Promise<EvaluationResult> {
    const prompt = this.buildEvaluationPrompt(question, userAnswer, interviewState);

    const response = await ollamaService.generateText(prompt, 0.2, 300);
    return this.parseEvaluation(response);
  }

  private buildEvaluationPrompt(
    question: string,
    userAnswer: string,
    state: InterviewState
  ): string {
    return `You are a strict technical interviewer evaluating a ${state.role} candidate at ${state.difficulty} level.

QUESTION: "${question}"
CANDIDATE ANSWER: "${userAnswer}"

SCORING RULES (STRICT):
- 0-3: Incorrect or missing fundamental concepts
- 4-5: Partially correct but missing key details or has logical errors
- 5-6: Correct but vague, lacks depth or examples
- 7-8: Correct with good explanation, minor gaps
- 9: Excellent with complete explanation and edge cases
- 10: Almost never given - only for perfect answers

EVALUATION CRITERIA:
1. Correctness of core concept
2. Completeness of explanation
3. Consideration of edge cases
4. Clarity and technical depth
5. Specific examples or demonstrations

RESPOND in JSON ONLY (no markdown, no extra text):
{
  "score": <0-10 number>,
  "mistakes": [
    "<specific technical mistake or missing concept>",
    "<another specific technical mistake>"
  ],
  "improvement": "<one concrete, actionable suggestion>",
  "analysis": "<brief 1-2 sentence reasoning for score>"
}

IMPORTANT:
- Be direct and slightly critical
- Avoid generic praise like "Great answer" or "Well done"
- If answer is vague, score 5-6 max
- Missing key concepts = heavy penalty
- Technical errors = significant deduction`;
  }

  private parseEvaluation(response: string): EvaluationResult {
    try {
      // Extract JSON from response (handle cases where model adds extra text)
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('No JSON found in response');

      const parsed = JSON.parse(jsonMatch[0]);

      // Validate and normalize
      let score = Math.max(0, Math.min(10, parseInt(parsed.score) || 5));

      // Ensure mistakes array
      const mistakes = Array.isArray(parsed.mistakes)
        ? parsed.mistakes.slice(0, 2).filter(Boolean)
        : [];

      while (mistakes.length < 2) {
        mistakes.push('Additional concept missing');
      }

      return {
        score,
        mistakes: mistakes.slice(0, 2),
        improvement: parsed.improvement || 'Provide specific examples',
        analysis: parsed.analysis || 'Moderate performance with room for improvement',
      };
    } catch (error) {
      console.error('Parse error:', error);
      return {
        score: 5,
        mistakes: [
          'Answer too vague or unclear',
          'Missing concrete examples or edge case discussion',
        ],
        improvement: 'Provide more detailed explanation with specific examples',
        analysis: 'Unable to properly evaluate due to unclear answer',
      };
    }
  }

  determineAnswerQuality(score: number): 'poor' | 'average' | 'good' {
    if (score <= 4) return 'poor';
    if (score <= 6) return 'average';
    return 'good';
  }

  updateWeakAreas(
    currentWeakAreas: string[],
    mistakes: string[],
    questionTopic: string
  ): string[] {
    const weakAreas = [...currentWeakAreas];

    // Add topic if it has mistakes
    if (!weakAreas.includes(questionTopic)) {
      weakAreas.push(questionTopic);
    }

    // Keep max 5 weak areas
    return weakAreas.slice(-5);
  }
}

export const evaluationEngine = new EvaluationEngine();
