# Strict Evaluation System - Reference Guide

## Overview

The evaluation engine implements a **realistic, slightly-strict interviewer** that avoids inflated scores and generic praise.

## Scoring Rules (FINAL)

| Score | Category | Criteria | Examples |
|-------|----------|----------|----------|
| **0–3** | ❌ Incorrect | Fundamental errors, wrong approach, or severely incomplete | Completely wrong answer, major conceptual gaps |
| **4–5** | ⚠️ Partial | Mostly on track but missing important details, some logical errors | Missing edge cases, no complexity analysis, vague |
| **6** | 〰️ Vague | Correct concept but lacks depth, examples, or clarity | Correct but shallow, no walk-through, no demo |
| **7–8** | ✅ Good | Correct with proper explanation, minor gaps acceptable | Good reasoning, mentions important concepts, mostly complete |
| **9** | 🌟 Excellent | Nearly complete, includes edge cases, complexity | Rare - only for thorough, well-thought-out answers |
| **10** | 🏆 Perfect | Never given in real scenarios | Reserved for theoretically perfect answers (extremely rare) |

## Default Assumptions

```
Average answer = 5–6/10
Good answer = 7–8/10
Excellent answer = 9/10 (rare)
Perfect answer = 10/10 (almost never given)
```

## What DOES Count (Positive)

✅ **Correctness**: Core logic is sound  
✅ **Completeness**: Covers all key aspects  
✅ **Examples**: Specifically demonstrates understanding  
✅ **Edge Cases**: Mentions boundary conditions  
✅ **Complexity**: Time or space complexity analysis  
✅ **Trade-offs**: Discusses pros/cons of approach  
✅ **Clarity**: Explanation is clear and organized  

## What DOESN'T Count (Negative)

❌ **Just confidence**: "I'm sure this is right" without explanation  
❌ **Long-windedness**: Verbose without substance  
❌ **Generic praise**: Saying "this is good practice" without why  
❌ **Vague references**: "everyone does it this way" (unsupported)  
❌ **Guessing**: Reading interviewer's face for hints  

## Penalty Structure

### Heavy Penalties (-3 to -4 points)

```
❌ Missing key concept entirely
❌ Incorrect logic or algorithm
❌ No consideration of edge cases
❌ No mention of complexity (when relevant)
❌ Fundamentally flawed approach
```

### Moderate Penalties (-1 to -2 points)

```
⚠️ Missing one important detail
⚠️ No specific examples or demonstrations
⚠️ Vague explanation lacking depth
⚠️ Doesn't mention trade-offs
⚠️ Partially correct but with errors
```

### Minor Penalties (-0.5 points)

```
• Minor imprecision in terminology
• Mentions concept but doesn't elaborate
• Example could be more specific
```

## Evaluation Prompt (Used with Ollama)

```typescript
`You are a strict technical interviewer evaluating a ${role} candidate at ${difficulty} level.

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

RESPOND in JSON ONLY:
{
  "score": <0-10>,
  "mistakes": [
    "<specific technical mistake>",
    "<another specific technical mistake>"
  ],
  "improvement": "<concrete, actionable suggestion>",
  "analysis": "<brief 1-2 sentence reasoning>"
}

IMPORTANT:
- Be direct and slightly critical
- Avoid generic praise like "Great answer" or "Well done"
- If answer is vague, score 5-6 max
- Missing key concepts = heavy penalty
- Technical errors = significant deduction`
```

## Mistake Categories

The system categorizes mistakes to identify patterns:

### 1. Edge Case Gaps
```
Missing: null/empty/boundary conditions
Score Impact: -2 to -3 points for relevant questions
Flag as weakness if repeated patterns
```

### 2. Complexity Analysis Missing
```
Missing: Time complexity (O(n), O(log n), etc)
Missing: Space complexity
Score Impact: -2 points (for algorithmic questions)
Flag as pattern if appears 3+ times
```

### 3. Explanations Lack Clarity
```
Vague: "I would use X because it's good"
Missing: Walk-through of solution
Missing: Example execution
Score Impact: -1 to -2 points
```

### 4. Incomplete Understanding
```
Partially correct but with logical errors
Missing key aspects of the concept
Confusion about core principles
Score Impact: -1 to -3 points depending on severity
```

### 5. No Concrete Examples
```
Theory only, no demonstration
No code snippet or scenario walkthrough
Cannot verify practical understanding
Score Impact: -1 to -2 points
```

## Improvement Suggestions

Always actionable and specific:

### ❌ BAD Examples
- "Could be improved"
- "Think more deeply"
- "Study more concepts"
- "Practice this topic"

### ✅ GOOD Examples
- "Include time complexity (O(log n)) and explain why"
- "Mention edge cases: empty input, single element, negative numbers"
- "Walk through your solution with a concrete example: input=[1,2,3], expected=[3,2,1]"
- "Discuss trade-offs: array is O(1) access but O(n) insertion"
- "Explain how you'd handle null pointers or undefined values"

## Final Feedback Generation

### Overall Score Calculation

```typescript
// Base: average of all question scores
baseScore = scores.reduce((a,b) => a+b) / scores.length

// Penalty: if ANY answer was poor (≤4)
hasWeakAnswers = scores.some(s => s <= 4)
finalScore = hasWeakAnswers ? baseScore - 1 : baseScore

// Cap at 0-10
finalScore = Math.min(10, Math.max(0, finalScore))
```

### Strengths Extraction

```
Only include REAL strengths:
✅ Topics where candidate scored 7+
✅ Patterns of strong performance
✅ Never generic praise

Max 3 strengths. Examples:
"Understanding of event-driven architecture"
"Clear thinking through complex problems"
"Good consideration of error handling"
```

### Weaknesses Extraction

```
Only CONSISTENT patterns:
❌ Topics mentioned in mistakes 3+ times
❌ Conceptual gaps appearing across questions
❌ Never single instances

Max 3 weaknesses. Examples:
"Insufficient edge case consideration"
"Missing complexity analysis in algorithmic questions"
"Vague explanations lacking concrete demonstrations"
```

### Advice

```
Must be:
1. Actionable: "do X"
2. Specific: Not just "practice more"
3. Targeted: Address actual weakness
4. Concise: 1-2 sentences max

Examples:
✅ "For every problem, systematically list edge cases before solving. 
   Practice with: empty input, single element, negative numbers, 
   duplicates, very large values."

✅ "Always calculate and state time/space complexity. For sorting: 
   O(n log n) average, O(n²) worst case. Build this habit for every solution."

❌ "Practice more problems"
❌ "Study algorithms better"
❌ "Get good at coding"
```

## Interview Consistency

```typescript
// Track answer quality distribution
if (scores.filter(s => s <= 4).length > 2) {
  // Multiple weak answers = lower final score
  finalScore -= 1
}

if (scores.filter(s => s >= 7).length === 0) {
  // No good answers = max score 6
  overallScore = Math.min(6, overallScore)
}

if (scores.every(s => s >= 7)) {
  // All good answers = consider 8+ possible
  // (Still rare, don't give 10)
}
```

## Common Scenarios & Scores

### Scenario 1: "I don't know"
```
Answer: "I'm not sure about this topic."
Score: 2-3 (unless honest + shows thinking)
Reasoning: No attempt to reason through
Advice: "Describe your thought process even when unsure"
```

### Scenario 2: Correct but Vague
```
Answer: "You would use a binary search. It's an efficient algorithm."
Score: 5-6
Reasoning: Correct concept but no depth
Advice: "Explain why it's O(log n) and walk through with an example"
```

### Scenario 3: Missing Edge Cases
```
Answer: [solves main problem correctly]
Score: 6-7
Reasoning: Doesn't consider null/empty input
Advice: "Discuss edge cases: null pointers, empty arrays, single elements"
```

### Scenario 4: Complete but Hesitant
```
Answer: [thorough explanation with hedging]
Score: 7 (would be 8 with confidence)
Reasoning: Technical quality there, but delivery weak
Advice: "You have strong understanding - deliver with more confidence"
```

### Scenario 5: Excellent Answer
```
Answer: [correct, complete, edge cases, complexity, examples, trade-offs]
Score: 9
Reasoning: Rare - reserve for truly exceptional
Note: 10/10 almost never given to avoid grade inflation
```

## Maintenance Notes

### Adjusting Strictness

```typescript
// More strict (lower scores)
temperature: 0.15          // More consistent
penaltyMultiplier: 1.5     // Heavier penalties

// More lenient (higher scores)
temperature: 0.4           // More forgiving
penaltyMultiplier: 0.8     // Lighter penalties
```

### Common Tweaks

```typescript
// To reduce 8+ scores
overallScore = Math.min(7.5, overallScore)

// To increase 5- scores (if too harsh)
if (score < 5) score = Math.max(4, score + 0.5)

// To penalize more for weak starts
if (evaluationHistory[0].evaluation.score < 4) {
  finalScore -= 1.5  // Heavy penalty for first answer
}
```

## Quick Reference Checklist

When evaluating, verify:

- [ ] Score follows 0-10 scale with correct thresholds
- [ ] Mistakes are SPECIFIC and TECHNICAL (not generic)
- [ ] Improvements are ACTIONABLE and CONCRETE
- [ ] Analysis is 1-2 sentences (concise)
- [ ] No phrases like "Great", "Well done", "Excellent explanation"
- [ ] Use phrases like "Partially correct", "Missing key details"
- [ ] If vague → score ≤ 6
- [ ] If missing key concept → -2 to -3 penalty
- [ ] If no edge cases mentioned (for relevant Q) → -2 penalty
- [ ] If no complexity analysis (for algorithmic Q) → -2 penalty

## Integration Example

```typescript
const evaluation = await evaluationEngine.evaluateAnswer(
  "How does binary search work?",
  "You keep splitting in half and compare to find target",
  interviewState
);

// Returns:
{
  score: 5,  // Correct but vague
  mistakes: [
    "No mention of time complexity (O(log n))",
    "Didn't explain when to use it (requires sorted array)"
  ],
  improvement: "Explain why it's O(log n) by walking through an example",
  analysis: "Core concept correct but lacks depth and clarity"
}
```

---

**Key Philosophy**: Be slightly strict but fair. Avoid inflated scores. Make feedback direct and actionable. Help candidates see exactly what they need to improve, not just that they need to improve.
