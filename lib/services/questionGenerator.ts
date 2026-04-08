import { InterviewState } from '@/types/interview';
import { OllamaService } from './ollamaService';

const ollamaService = new OllamaService();

interface QuestionGeneratorConfig {
  role: string; // Frontend, DSA, Node.js, etc
  difficulty: 'easy' | 'medium' | 'hard';
  lastAnswerQuality: 'poor' | 'average' | 'good';
  weakAreas: string[];
  questionNumber: number;
}

export class QuestionGenerator {
  private baseQuestions = {
    Frontend: {
      easy: [
        'What is the difference between let, const, and var in JavaScript?',
        'Explain what the DOM is and why it matters in web development.',
        'What is CSS specificity and how does it work?',
        'Describe the event bubbling concept in JavaScript.',
        'What are semantic HTML elements and why should you use them?',
      ],
      medium: [
        'How does the event loop work in JavaScript?',
        'Explain the difference between synchronous and asynchronous code.',
        'What are closures in JavaScript and provide a practical example.',
        'How does CSS flexbox work? Explain main axis and cross axis.',
        'What is the Virtual DOM and why do frameworks like React use it?',
      ],
      hard: [
        'Explain how prototypal inheritance works in JavaScript.',
        'Describe the rendering pipeline: parsing, layout, paint, and composite.',
        'How are Web Workers useful and what are their limitations?',
        'Explain memory leaks in JavaScript and how to debug them.',
        'What is the difference between debouncing and throttling?',
      ],
    },
    DSA: {
      easy: [
        'What is the difference between an array and a linked list?',
        'Explain binary search and its time complexity.',
        'What is a hash table and how does collision handling work?',
        'Describe a stack and queue with real-world examples.',
        'What is a tree and what are its basic properties?',
      ],
      medium: [
        'How does quicksort work and what is its average time complexity?',
        'Explain depth-first search (DFS) and breadth-first search (BFS).',
        'What is dynamic programming and how is it different from recursion?',
        'Describe a balanced binary search tree and why balance matters.',
        'How do you implement a LRU cache?',
      ],
      hard: [
        'Explain how a B-tree differs from a binary search tree.',
        'Describe the Dijkstra algorithm for finding shortest paths.',
        'What are segment trees and when would you use one?',
        'Explain the concept of topological sorting in directed acyclic graphs.',
        'How does consistent hashing work in distributed systems?',
      ],
    },
    'Node.js': {
      easy: [
        'What is Node.js and why is it useful?',
        'Explain what npm is and how dependency management works.',
        'What is the difference between require and import?',
        'Describe the callback function pattern in Node.js.',
        'What is middleware in Express.js?',
      ],
      medium: [
        'How does the Node.js event loop work?',
        'Explain promises and how they differ from callbacks.',
        'What are streams in Node.js and when should you use them?',
        'Describe async/await and how error handling works.',
        'How do you handle database connections efficiently?',
      ],
      hard: [
        'Explain worker threads in Node.js and when to use them.',
        'How would you implement request rate limiting?',
        'Describe the clustering module and its use cases.',
        'How do you monitor and optimize Node.js memory usage?',
        'What is the difference between process.nextTick and setImmediate?',
      ],
    },
  };

  async generateNextQuestion(config: QuestionGeneratorConfig): Promise<string> {
    // Adjust difficulty based on last answer quality
    let targetDifficulty = config.difficulty;

    if (config.lastAnswerQuality === 'poor' && config.questionNumber > 2) {
      // Don't go below easy, but signal lower complexity
      targetDifficulty = 'easy';
    } else if (config.lastAnswerQuality === 'good' && config.questionNumber > 3) {
      // Increase difficulty for good answers
      if (targetDifficulty === 'easy') targetDifficulty = 'medium';
      else if (targetDifficulty === 'medium') targetDifficulty = 'hard';
    }

    // Generate or select question
    const question = await this.selectQuestion(config.role, targetDifficulty, config.weakAreas);

    return question;
  }

  private async selectQuestion(
    role: string,
    difficulty: 'easy' | 'medium' | 'hard',
    weakAreas: string[]
  ): Promise<string> {
    // Priority: ask about weak areas if they exist
    if (weakAreas.length > 0) {
      const prompt = this.buildWeakAreaPrompt(role, difficulty, weakAreas[0]);
      try {
        const question = await ollamaService.generateText(prompt, 0.2, 100);
        if (question && question.length > 20) return question;
      } catch (e) {
        console.log('Fallback to base questions');
      }
    }

    // Fallback to base questions
    const questions = this.baseQuestions[role as keyof typeof this.baseQuestions];
    if (!questions) return 'Tell me about your experience with this technology.';

    const diffQuestions = questions[difficulty];
    const randomIndex = Math.floor(Math.random() * diffQuestions.length);
    return diffQuestions[randomIndex];
  }

  private buildWeakAreaPrompt(role: string, difficulty: string, weakArea: string): string {
    return `Generate ONE technical interview question about "${weakArea}" for a ${role} candidate at ${difficulty} level.

The question should:
- Be specific to the weak area
- Be appropriate for the ${difficulty} level
- Start with "Explain", "Describe", "How", or "What"
- Be answerable in 2-3 minutes
- Test understanding and depth

Return ONLY the question (no numbering, no extra text).`;
  }
}

export const questionGenerator = new QuestionGenerator();
