# Interview System Architecture

## Overview

This is a production-ready AI Mock Interview system using Next.js and Ollama (phi3:mini). It implements a structured interview flow with adaptive difficulty, strict evaluation, and realistic feedback.

## Core Architecture

### Interview State Design

Each interview maintains a structured session object:

```typescript
{
  sessionId: string;
  userName: string;
  role: string; // Frontend, DSA, Node.js, etc
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
```

### Key Principles

1. **No Chat History**: Uses structured state instead of full conversation logs
2. **Adaptive Difficulty**: Questions adjust based on answer quality
3. **Strict Evaluation**: Scores are realistic (5-6 = average, 9-10 rare)
4. **Weak Area Tracking**: Poor answers feed into future question selection
5. **Memory Efficient**: Minimal token usage with Ollama phi3:mini

## API Routes

### 1. Start Interview

**POST** `/api/interview/start`

Request:
```json
{
  "role": "Frontend",
  "difficulty": "medium"
}
```

Response:
```json
{
  "success": true,
  "sessionId": "abc123...",
  "state": { ...InterviewState },
  "question": "First question here"
}
```

### 2. Submit Answer

**POST** `/api/interview/answer`

Request:
```json
{
  "sessionId": "abc123...",
  "userAnswer": "Candidate's answer here"
}
```

Response:
```json
{
  "success": true,
  "evaluation": {
    "score": 6,
    "mistakes": ["Missing edge case discussion", "No time complexity mentioned"],
    "improvement": "Include time and space complexity for every solution",
    "analysis": "Correct but vague - lacks depth"
  },
  "isInterviewComplete": false,
  "nextQuestion": "Next question here",
  "state": { ...updated InterviewState }
}
```

Continues until MAX_QUESTIONS (10) is reached.

### 3. Get Final Feedback

**GET** `/api/interview/feedback?sessionId=abc123...`

Response:
```json
{
  "success": true,
  "userName": "John",
  "feedback": {
    "overallScore": 6,
    "strengths": ["Event handling", "DOM knowledge"],
    "weaknesses": [
      "Insufficient edge case consideration",
      "Lack of complexity analysis",
      "Missing specific examples"
    ],
    "advice": "Practice thinking through edge cases systematically...",
    "evaluationHistory": [...]
  }
}
```

### 4. Health Check

**GET** `/api/interview/health`

Returns Ollama service status and available models.

## Services

### OllamaService (`lib/services/ollamaService.ts`)

- `generateText()`: Single response generation
- `streamText()`: Streaming responses (for real-time UI)

### EvaluationEngine (`lib/services/evaluationEngine.ts`)

Strict answer evaluation:
- Parses JSON from Ollama responses
- Scores: 0-3 (wrong), 4-6 (partial/vague), 7-8 (good), 9 (excellent), 10 (rare)
- Extracts 2 specific mistakes and 1 improvement
- Determines answer quality: poor/average/good

### QuestionGenerator (`lib/services/questionGenerator.ts`)

Adaptive question selection:
- Base questions for each role/difficulty
- Promotes weak areas in future questions
- Adjusts difficulty: poor → easier, good → harder

### InterviewSessionManager (`lib/services/interviewSessionManager.ts`)

State and session management:
- Creates/retrieves/updates sessions
- Name detection (e.g., "call me X")
- In-memory storage (use database for production)

### FeedbackGenerator (`lib/services/feedbackGenerator.ts`)

Final feedback generation:
- Calculates overall score
- Penalizes inconsistency
- Extracts patterns from mistakes
- Generates actionable advice

## Evaluation Rules

### Scoring (Strict)

| Score | Meaning | Criteria |
|-------|---------|----------|
| 0-3   | Incorrect | Fundamental errors or completely wrong |
| 4-5   | Partial | Mostly correct but vague or missing key details |
| 6     | Vague | Correct but lacks depth, examples, or analysis |
| 7-8   | Good | Correct with proper explanation |
| 9     | Excellent | Complete explanation with edge cases |
| 10    | Perfect | Almost never given |

### Mistake Categories

- Missing edge cases
- No complexity analysis
- Vague or unclear explanations
- Incorrect logic
- No concrete examples

### Feedback Style

❌ Avoid: "Great answer", "Well done", "Excellent explanation"

✅ Use: "Partially correct", "Missing key details", "Lacks depth"

## Configuration

### Environment Variables

```bash
# .env.local
OLLAMA_BASE_URL=http://localhost:11434
```

### Ollama Setup

1. Install Ollama from https://ollama.ai
2. Run: `ollama pull phi3:mini`
3. Start service: `ollama serve`

## Performance Optimizations

- Small model (phi3:mini ~2.3B parameters)
- Temperature 0.2 for consistent evaluation
- Token limits to minimize generation
- Structured prompts (JSON output)
- Max 10 questions per interview
- In-memory session storage

## Testing

### Start Interview
```bash
curl -X POST http://localhost:3000/api/interview/start \
  -H "Content-Type: application/json" \
  -d '{"role": "Frontend", "difficulty": "medium"}'
```

### Submit Answer
```bash
curl -X POST http://localhost:3000/api/interview/answer \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "YOUR_SESSION_ID",
    "userAnswer": "Your answer here"
  }'
```

### Get Feedback
```bash
curl http://localhost:3000/api/interview/feedback?sessionId=YOUR_SESSION_ID
```

### Check Health
```bash
curl http://localhost:3000/api/interview/health
```

## File Structure

```
lib/services/
  ├── ollamaService.ts           # LLM integration
  ├── evaluationEngine.ts         # Strict scoring logic
  ├── questionGenerator.ts        # Adaptive question selection
  ├── interviewSessionManager.ts  # State management
  └── feedbackGenerator.ts        # Final feedback generation

app/api/interview/
  ├── start/route.ts             # Initialize interview
  ├── answer/route.ts            # Process answer
  ├── feedback/route.ts          # Get final feedback
  └── health/route.ts            # Service health check

types/
  └── interview.d.ts             # TypeScript interfaces
```

## Production Considerations

1. **Database**: Replace in-memory `sessionStore` with MongoDB/PostgreSQL
2. **Caching**: Add Redis for session state
3. **Rate Limiting**: Implement per-interview rate limits
4. **Logging**: Add structured logging for all API operations
5. **Error Handling**: Enhanced error recovery and retry logic
6. **Monitoring**: Track model response quality and API latency

## Future Enhancements

- Video/audio integration
- Candidate calibration across different evaluators
- Performance benchmarking database
- Interview analytics dashboard
- Custom scoring rubrics per role
