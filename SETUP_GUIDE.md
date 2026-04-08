# Environment Setup Guide

## Prerequisites

- Node.js 20+
- Windows/Mac/Linux
- 8GB+ RAM (for Ollama + Next.js)

## Installation Steps

### 1. Install Ollama

Download and install Ollama from: https://ollama.ai

### 2. Pull the Model

```bash
ollama pull phi3:mini
```

Verify it's installed:
```bash
ollama list
```

Expected output:
```
NAME            ID              SIZE    MODIFIED
phi3:mini       e1d3c214f4da    2.3GB   XX minutes ago
```

### 3. Start Ollama Service

```bash
ollama serve
```

Should see:
```
time=2024-01-15T10:30:00.123Z level=INFO msg="Listening on 127.0.0.1:11434"
```

### 4. Test Ollama Connection

In a new terminal:
```bash
curl http://localhost:11434/api/tags
```

Should return list of available models in JSON format.

### 5. Configure Next.js Environment

Create `.env.local` in project root:

```bash
# Ollama Configuration
OLLAMA_BASE_URL=http://localhost:11434

# Optional: Model fine-tuning
# Model will use phi3:mini by default
```

### 6. Install Dependencies

```bash
npm install
# or
yarn install
```

This installs `nanoid` and other required packages.

### 7. Start Development Server

```bash
npm run dev
```

Server will run at: http://localhost:3000

### 8. Verify Setup

Check interview system health:

```bash
curl http://localhost:3000/api/interview/health
```

Expected response:
```json
{
  "status": "online",
  "models": ["phi3:mini"],
  "ollamaUrl": "http://localhost:11434"
}
```

## Troubleshooting

### Ollama Connection Error

**Problem**: `Cannot connect to Ollama`

**Solution**:
1. Ensure Ollama is running: `ollama serve`
2. Check URL: Should be `http://localhost:11434`
3. Try: `curl http://localhost:11434/api/tags`
4. Update `OLLAMA_BASE_URL` in `.env.local` if on different host

### Out of Memory

**Problem**: Process killed or very slow responses

**Solution**:
- Close other applications
- Model requires ~2.3GB RAM minimum
- Consider using CPU-only mode (slower but uses less RAM)

### Model Not Found

**Problem**: `phi3:mini not found`

**Solution**:
1. Pull model: `ollama pull phi3:mini`
2. Verify: `ollama list`
3. Restart Ollama service

### Slow Responses

**Problem**: API takes 30+ seconds to respond

**Solution**:
- phi3:mini is small but requires time for inference
- GPU acceleration makes it much faster
- For development, 5-15 seconds is normal CPU speed

## Testing the Interview System

### 1. Start an Interview

```bash
curl -X POST http://localhost:3000/api/interview/start \
  -H "Content-Type: application/json" \
  -d '{"role": "Frontend", "difficulty": "easy"}'
```

Response:
```json
{
  "success": true,
  "sessionId": "...",
  "question": "What is the difference between let, const, and var..."
}
```

### 2. Submit an Answer

```bash
curl -X POST http://localhost:3000/api/interview/answer \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "YOUR_SESSION_ID",
    "userAnswer": "let and const are block-scoped, var is function-scoped..."
  }'
```

### 3. Continue with More Answers

Repeat step 2 with different answers until you reach 10 questions.

### 4. Get Final Feedback

```bash
curl http://localhost:3000/api/interview/feedback?sessionId=YOUR_SESSION_ID
```

Response will include overall score, strengths, weaknesses, and advice.

## Performance Tips

### For Development
- Use phi3:mini (2.3B, ~2-3 seconds per response on CPU)
- Set temperature to 0.2 for consistent evaluation
- Keep prompts short and structured

### For Production
- Consider GPU setup (10x faster inference)
- Use Redis for session caching
- Store interview results in database
- Add request rate limiting

## Model Parameters

Current configuration in `OllamaService`:
```typescript
{
  temperature: 0.2,      // Low = more consistent
  top_p: 0.9,           // High = diverse outputs
  top_k: 40             // Fewer candidates = faster
}
```

Adjust for different behavior:
- **Increase temperature** (0.5+) for more creative questions
- **Decrease temperature** (0.1) for stricter evaluation
- **Lower top_k** (20) for faster but less varied responses

## Next Steps

1. Build React component for interview UI
2. Integrate text-to-speech for voice interviews
3. Add speech-to-text for hands-free mode
4. Create analytics dashboard
5. Set up database for storing results

## Support

For Ollama issues: https://github.com/ollama/ollama/issues
For model info: https://ollama.ai/library/phi3
