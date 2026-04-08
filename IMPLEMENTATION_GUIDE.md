# Implementation Guide - Production-Ready Interview System

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    React Components                          │
│  • InterviewManager (UI + state management)                 │
│  • FeedbackDisplay (Results visualization)                  │
└─────────────────┬───────────────────────────────────────────┘
                  │ HTTP Requests
┌─────────────────▼───────────────────────────────────────────┐
│                    Next.js API Routes                        │
│  • POST /api/interview/start     (Initialize)               │
│  • POST /api/interview/answer    (Evaluate + Next Q)        │
│  • GET  /api/interview/feedback  (Final results)            │
│  • GET  /api/interview/health    (Service status)           │
└─────────────────┬───────────────────────────────────────────┘
                  │ Calls
┌─────────────────▼───────────────────────────────────────────┐
│                   Interview Services                         │
│  • SessionManager (State CRUD)                              │
│  • EvaluationEngine (Scoring)                               │
│  • QuestionGenerator (Adaptive selection)                   │
│  • FeedbackGenerator (Results compilation)                  │
└─────────────────┬───────────────────────────────────────────┘
                  │ Uses
┌─────────────────▼───────────────────────────────────────────┐
│                   OllamaService                              │
│  • Connects to http://localhost:11434                       │
│  • Sends structured prompts                                 │
│  • Receives JSON responses                                  │
└─────────────────┬───────────────────────────────────────────┘
                  │ HTTP Requests
┌─────────────────▼───────────────────────────────────────────┐
│                   Ollama + phi3:mini                         │
│  • Local LLM inference                                      │
│  • Temperature: 0.2 (consistent)                            │
│  • Max tokens: 200-300                                      │
└─────────────────────────────────────────────────────────────┘
```

## Request/Response Flow

### 1. Start Interview

```
Client Request:
  POST /api/interview/start
  {
    "role": "Frontend",
    "difficulty": "medium"
  }

Backend Process:
  1. Generate sessionId (nanoid)
  2. Create InterviewState in memory
  3. Generate first question via QuestionGenerator
  4. Return session info

Client Response:
  {
    "sessionId": "abc123...",
    "state": { ...InterviewState },
    "question": "What is the difference between let and const?"
  }
```

### 2. Submit Answer

```
Client Request:
  POST /api/interview/answer
  {
    "sessionId": "abc123...",
    "userAnswer": "let is block-scoped, const is also block-scoped..."
  }

Backend Process:
  1. Validate session exists
  2. Detect name change if mentioned
  3. Call EvaluationEngine.evaluateAnswer()
     - Build evaluation prompt
     - Call OllamaService.generateText()
     - Parse JSON response
     - Return: { score, mistakes, improvement, analysis }
  4. Determine answer quality (poor/average/good)
  5. Update weak areas if poor answer
  6. Store evaluation in history
  7. Check if max questions reached
  8. If not complete:
     - Generate next question via QuestionGenerator
     - Return next question + evaluation
  9. If complete:
     - Return isInterviewComplete: true

Client Response (Not Complete):
  {
    "success": true,
    "evaluation": {
      "score": 6,
      "mistakes": [
        "Did not mention temporal dead zone",
        "No discussion of reassignment rules"
      ],
      "improvement": "Explain const prevents reassignment but not immutability",
      "analysis": "Partial understanding but missing details"
    },
    "isInterviewComplete": false,
    "nextQuestion": "Explain hoisting in JavaScript",
    "state": { ...updated state }
  }

Client Response (Complete - 10 Questions Reached):
  {
    "success": true,
    "evaluation": { ...last evaluation },
    "isInterviewComplete": true,
    "state": { ...final state }
  }
```

### 3. Get Feedback

```
Client Request:
  GET /api/interview/feedback?sessionId=abc123...

Backend Process:
  1. Retrieve session and evaluation history
  2. Call FeedbackGenerator.generateFinalFeedback()
     - Calculate overall score
     - Penalize for inconsistency
     - Extract strength patterns
     - Extract weakness patterns
     - Generate actionable advice
  3. Delete session from memory
  4. Return comprehensive feedback

Client Response:
  {
    "success": true,
    "userName": "John",
    "feedback": {
      "overallScore": 6,
      "strengths": ["Event handling", "Async understanding"],
      "weaknesses": [
        "Missing edge case consideration",
        "Lack of complexity analysis"
      ],
      "advice": "Practice thinking through edge cases systematically...",
      "evaluationHistory": [
        {
          "questionIndex": 1,
          "question": "What is the difference between let and const?",
          "userAnswer": "...",
          "evaluation": { score, mistakes, improvement, analysis },
          "timestamp": "2024-01-15T10:30:00Z"
        },
        ...
      ]
    }
  }
```

## File Organization

```
interview-system/
├── lib/services/
│   ├── ollamaService.ts             # LLM integration
│   ├── evaluationEngine.ts          # Scoring logic (strict)
│   ├── questionGenerator.ts         # Adaptive questions
│   ├── interviewSessionManager.ts   # State management
│   └── feedbackGenerator.ts         # Results compilation
│
├── app/api/interview/
│   ├── start/route.ts               # Initialize
│   ├── answer/route.ts              # Evaluate & next Q
│   ├── feedback/route.ts            # Final results
│   └── health/route.ts              # Service status
│
├── components/
│   ├── InterviewManager.tsx         # Main UI
│   └── FeedbackDisplay.tsx          # Results UI
│
├── types/
│   └── interview.d.ts               # TypeScript types
│
└── pages (or app)/
    └── interview-new/page.tsx       # Example page
```

## Key Design Decisions

### 1. Structured State Over Chat History
- **Why**: Efficient and intentional
- **How**: Only store: question, answer quality, weak areas, scores
- **Benefit**: Low memory, fast processing, less token usage

### 2. Strict, Realistic Scoring
- **Scoring**: 0-10 scale with clear rules
  - 0-3: Incorrect
  - 4-6: Partial/vague
  - 7-8: Good
  - 9: Excellent (rare)
  - 10: Perfect (almost never)
- **No Inflation**: Avoids "Great job!" syndrome
- **Technical Specificity**: Mistakes are precise (not generic)

### 3. Adaptive Difficulty
- **Logic**:
  - Poor answer (≤4) → Ask easier question
  - Good answer (≥7) → Ask harder question
  - Weak areas → Prioritize in future questions
- **Result**: Self-calibrating interview that matches candidate level

### 4. In-Memory Session Storage
- **Current**: Map<sessionId, { state, evaluationHistory }>
- **For Production**: Replace with MongoDB/PostgreSQL
- **Note**: Session deleted after feedback generated

### 5. phi3:mini Model
- **Size**: ~2.3GB (fits 8GB RAM)
- **Speed**: 2-10 seconds per response (CPU)
- **Quality**: Good enough for technical evaluation
- **Cost**: Free (local)

## Performance Metrics

```
Operation               Typical Time    Max Time
─────────────────────────────────────────────────
Start Interview         <100ms          500ms
Evaluate Answer         2-5 seconds     10 seconds
Generate Next Question  1-3 seconds     5 seconds
Generate Feedback       3-5 seconds     10 seconds
Total (10 questions)    ~30-50 seconds  ~120 seconds
```

## Testing Checklist

- [ ] Ollama running: `ollama serve`
- [ ] Model available: `ollama list`
- [ ] Health check: `curl http://localhost:3000/api/interview/health`
- [ ] Start interview works
- [ ] Answer evaluation returns score
- [ ] Next question generated
- [ ] Weak areas accumulate
- [ ] Interview completes at 10 questions
- [ ] Feedback generated without errors
- [ ] Session deleted after feedback

## Production Deployment

### Environment Setup
```bash
# .env.production
OLLAMA_BASE_URL=http://ollama-service:11434
# Add database credentials
# Add caching setup (Redis)
```

### Scaling Considerations
1. **State Storage**: Use MongoDB with TTL index
2. **Caching**: Redis for frequent sessions
3. **Model Service**: Ollama on dedicated GPU server
4. **Rate Limiting**: Implement per-user limits
5. **Monitoring**: Log all evaluations for quality checks

### Security
- Validate input (XSS, injection)
- Rate limit LLM calls
- Audit interview data
- Encrypt sensitive data

## Troubleshooting

### Common Issues

**Problem**: "Cannot connect to Ollama"
```bash
# Solution
ollama serve  # Start Ollama in another terminal
curl http://localhost:11434/api/tags  # Verify
```

**Problem**: "Responses too long/slow"
```typescript
// Reduce in OllamaService
temperature: 0.1  // Consistency
maxTokens: 150    // Shorter responses
```

**Problem**: "Scores too high/too low"
```typescript
// Adjust in EvaluationEngine prompt
"5-6: Correct but vague"  // Raise baseline
"7-8: Complete explanation"  // Raise good threshold
```

## Integration Examples

### In Next.js Page
```tsx
import { InterviewManager } from '@/components/InterviewManager';

export default function Page() {
  return <InterviewManager role="Frontend" difficulty="medium" />;
}
```

### In API Handler
```typescript
import { sessionManager } from '@/lib/services/interviewSessionManager';
import { evaluationEngine } from '@/lib/services/evaluationEngine';

const state = sessionManager.getSession(sessionId);
const evaluation = await evaluationEngine.evaluateAnswer(
  state.currentQuestion,
  userAnswer,
  state
);
```

## Next Steps

1. **Test All Endpoints**: Use curl or Postman
2. **Add Speech**: Integrate Web Speech API
3. **Add Persistence**: Connect MongoDB
4. **Build Dashboard**: Analytics & history
5. **Optimize**: GPU setup, caching, monitoring
