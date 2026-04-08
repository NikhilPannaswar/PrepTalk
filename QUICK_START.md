# Quick Start Guide - 5 Minutes to Running Interviews

## Prerequisites Check

```bash
# 1. Check Node.js version (need 20+)
node --version

# 2. Check npm
npm --version

# 3. Check Ollama is running
curl http://localhost:11434/api/tags
```

If Ollama not running: `ollama serve` in a new terminal

## Setup (First Time Only)

### Step 1: Install Dependencies
```bash
cd d:\MEGA PROJECTS\PrepTalk
npm install
# This installs nanoid and all required packages
```

### Step 2: Configure Environment
Create `.env.local` in project root:
```
OLLAMA_BASE_URL=http://localhost:11434
```

### Step 3: Verify Setup
```bash
curl http://localhost:3000/api/interview/health
```

You should see:
```json
{
  "status": "online",
  "models": ["phi3:mini"],
  "ollamaUrl": "http://localhost:11434"
}
```

## Running Interview System

### Terminal 1: Start Ollama
```bash
ollama serve
# Keep this running - it provides the AI model
```

### Terminal 2: Start Next.js Dev Server
```bash
cd d:\MEGA PROJECTS\PrepTalk
npm run dev
# Server runs at http://localhost:3000
```

### Terminal 3 (Optional): Run Tests
```bash
# Test start interview
curl -X POST http://localhost:3000/api/interview/start \
  -H "Content-Type: application/json" \
  -d '{"role":"Frontend","difficulty":"easy"}'

# Copy sessionId from response, then:
curl -X POST http://localhost:3000/api/interview/answer \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId":"PASTE_SESSION_ID_HERE",
    "userAnswer":"My answer here"
  }'
```

## Test the Full Flow

### Via cURL (Manual)

```bash
# 1. Start interview
SESSION=$(curl -s -X POST http://localhost:3000/api/interview/start \
  -H "Content-Type: application/json" \
  -d '{"role":"Frontend","difficulty":"medium"}' | grep -o '"sessionId":"[^"]*"' | cut -d'"' -f4)

echo "Session: $SESSION"

# 2. Submit answer (repeat this 10 times for full interview)
curl -X POST http://localhost:3000/api/interview/answer \
  -H "Content-Type: application/json" \
  -d "{\"sessionId\":\"$SESSION\",\"userAnswer\":\"let and const are block-scoped variables\"}"

# 3. Get feedback (after 10 answers)
curl http://localhost:3000/api/interview/feedback?sessionId=$SESSION
```

### Via Browser

Visit: `http://localhost:3000/interview-new`

1. Select role (Frontend, DSA, Node.js)
2. Select difficulty (easy, medium, hard)
3. Click "Start Interview"
4. Type answer and press "Submit Answer" (or Ctrl+Enter)
5. After 10 questions, view results

## File Structure - What Each Part Does

```
📁 lib/services/
  ├─ ollamaService.ts ..................... Talks to local AI model
  ├─ evaluationEngine.ts .................. Scores answers (strict!)
  ├─ questionGenerator.ts ................. Picks next question
  ├─ interviewSessionManager.ts ........... Remembers interview state
  └─ feedbackGenerator.ts ................. Makes final report

📁 app/api/interview/
  ├─ start/route.ts ................... Initialize interview
  ├─ answer/route.ts .................. Evaluate + next question
  ├─ feedback/route.ts ................ Generate final report
  └─ health/route.ts .................. Check if AI service online

📁 components/
  ├─ InterviewManager.tsx ............... Main interview UI
  └─ FeedbackDisplay.tsx ................ Results display

📁 types/
  └─ interview.d.ts ..................... TypeScript definitions
```

## Key Features

✅ **Structured Interview State** - No chat history bloat  
✅ **Strict Scoring** - 5-6 is average, 9-10 rare  
✅ **Adaptive Difficulty** - Questions get harder/easier based on answers  
✅ **Weak Area Tracking** - Poor answers lead to related follow-ups  
✅ **Real-time Evaluation** - Get feedback on each answer immediately  
✅ **Final Comprehensive Report** - Strengths, weaknesses, actionable advice  

## Common Commands

```bash
# Start everything
ollama serve                    # Terminal 1
npm run dev                     # Terminal 2

# Check health
curl http://localhost:3000/api/interview/health

# Stop dev server
Ctrl+C

# View logs
# Check browser console (F12) for frontend errors
# Check terminal for API errors

# List active sessions (debugging)
# Sessions stored in memory - lost on server restart
```

## Troubleshooting

### "Cannot connect to Ollama"
```bash
# Make sure Ollama is running
ollama serve

# Check it's accessible
curl http://localhost:11434/api/tags
```

### "Model phi3:mini not found"
```bash
# Pull the model
ollama pull phi3:mini

# Verify
ollama list
```

### "API returns 500 error"
```bash
# Check terminal for error messages
# Most likely: Ollama not running or timeout
# Solution: Restart Ollama, increase timeout
```

### Slow responses (10+ seconds)
```
This is normal on CPU
- With GPU: 1-3 seconds
- With CPU: 5-15 seconds
phi3:mini is small but still takes time
```

## Performance Expectations

| Task | CPU Time | GPU Time |
|------|----------|----------|
| Start Interview | <1s | <1s |
| Evaluate Answer | 5-10s | 1-3s |
| Generate Next Q | 3-5s | 1-2s |
| Full 10 Q Interview | 1-2 min | 20-30s |

## Next Steps

1. ✅ Run 1-2 full interviews manually (test quality)
2. ✅ Check scoring is reasonable (not inflated)
3. ✅ Verify feedback matches answers
4. ✅ Invite test users to try
5. 📊 Build analytics (most common weak areas)
6. 🎙️ Add voice input/output
7. 💾 Add database integration
8. 🚀 Deploy to production

## Production Setup

When ready to deploy:

1. **Database**: Move session storage from memory to MongoDB
2. **Cache**: Add Redis for frequently accessed sessions
3. **Monitoring**: Log all evaluations for quality control
4. **Rate Limiting**: Limit API calls per user/minute
5. **GPU Server**: Run Ollama on GPU for speed
6. **Error Handling**: Implement retry logic

See `SETUP_GUIDE.md` for detailed production steps.

## Support Resources

- **Interview Architecture**: Read `INTERVIEW_SYSTEM.md`
- **Evaluation System**: Read `STRICT_EVALUATION_GUIDE.md`
- **Implementation Details**: Read `IMPLEMENTATION_GUIDE.md`
- **Full Setup**: Read `SETUP_GUIDE.md`
- **Ollama Docs**: https://ollama.ai
- **Next.js Docs**: https://nextjs.org/docs

## Key Endpoints

```
POST   /api/interview/start        Start new interview
POST   /api/interview/answer       Submit answer & get next Q
GET    /api/interview/feedback     Get final report
GET    /api/interview/health       Check service status
```

Example:
```javascript
// Start interview
const start = await fetch('/api/interview/start', {
  method: 'POST',
  body: JSON.stringify({ role: 'Frontend', difficulty: 'medium' })
});
const { sessionId, question } = await start.json();

// Submit answer
const answer = await fetch('/api/interview/answer', {
  method: 'POST',
  body: JSON.stringify({ sessionId, userAnswer: 'Your response...' })
});
const { evaluation, nextQuestion, isInterviewComplete } = await answer.json();

// Get feedback
const feedback = await fetch(`/api/interview/feedback?sessionId=${sessionId}`);
const result = await feedback.json();
```

That's it! You're ready to run AI mock interviews. Start with the browser at `http://localhost:3000/interview-new` or test via cURL above.
