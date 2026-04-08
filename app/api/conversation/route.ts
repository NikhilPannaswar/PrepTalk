import { NextRequest } from "next/server";

export interface ConversationMessage {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: string;
}

export async function POST(request: NextRequest) {
  console.log("🔵 Conversation API called at:", new Date().toISOString());
  
  try {
    const body = await request.json();
    console.log("📨 Request body received:", {
      message: body.message?.substring(0, 100) + (body.message?.length > 100 ? '...' : ''),
      conversationHistoryLength: body.conversationHistory?.length || 0,
      interviewContext: body.interviewContext,
      userName: body.userName
    });

    const { message, conversationHistory, interviewContext, userName } = body;

    if (!message || !message.trim()) {
      return Response.json(
        { success: false, error: "Empty message" },
        { status: 400 }
      );
    }

    const userResponses = conversationHistory.filter(
      (msg: ConversationMessage) => msg.role === "user"
    ).length;

    const isEarlyInterview = userResponses < 3;
    const isMidInterview = userResponses >= 3 && userResponses < 6;

  let systemPrompt = `You are an experienced AI interviewer conducting a ${interviewContext.type} interview for a ${interviewContext.role} position (${interviewContext.level} level).
Tech stack: ${interviewContext.techstack.join(", ")}.

CORE RULES:
1. Keep ALL responses under 20 words - this is a VOICE interview
2. Respond ONLY as an interviewer (not a chatbot)
3. Ask ONLY ONE question
4. Keep tone natural but NOT overly encouraging
5. Do NOT praise unnecessarily
6. Do NOT assume anything not mentioned by the candidate
7. Only use information explicitly provided in the answer
8. Stay strictly within interview context
9. Avoid generic questions like "tell me more"
10. Always guide conversation toward interview topics

BEHAVIOR CONTROL:
- If candidate says "no experience" → ask a basic foundational question
- If answer is weak → simplify the next question
- If answer is good → slightly increase difficulty
- If answer is unclear → ask for clarification
- If answer is unrelated → redirect to interview topic

CURRENT STAGE: ${
      isEarlyInterview
        ? "Introduction - ask simple background or basic concept questions"
        : isMidInterview
        ? "Technical depth - ask role-specific questions"
        : "Advanced - deeper concepts or edge cases"
    }

Interview Topics to guide you: ${interviewContext.questions.slice(0, 3).join(" | ")}

EXAMPLE GOOD RESPONSES (under 20 words):
- "Alright, let's start simple. What is React?"
- "Can you explain how components work in React?"
- "What is virtual DOM in your understanding?"
- "Okay, what is your experience with JavaScript?"

EXAMPLE BAD RESPONSES (do NOT do this):
- Encouragement like "that's great" or "exciting"
- Guessing things not mentioned
- Multiple questions at once
- Long explanations
- Generic follow-ups like "tell me more"

REMEMBER:
You are a structured interviewer, not a friendly chatbot.`;

    if (message.includes("[PAUSE_DETECTED]")) {
      systemPrompt += `\n\nSPECIAL: Candidate paused 2.5 seconds. Give a brief 8-10 word encouragement like "Take your time" or "What do you think?" or rephrase the question in 10 words or less.`;
    }

    const messages = [
      {
        role: "system" as const,
        content: systemPrompt,
      },
      ...conversationHistory
        .filter((msg: ConversationMessage) => msg.content && msg.content.trim().length > 0)
        .map((msg: ConversationMessage) => ({
          role: msg.role === "assistant" ? ("assistant" as const) : ("user" as const),
          content: msg.content.trim(),
        })),
      {
        role: "user" as const,
        content: `The candidate just said: "${message.trim()}"\n\nYour next sentence as the interviewer (20 words max, reference what they said, ask one follow-up):`,
      },
    ];

    const validMessages = messages.filter((msg) => msg.content && msg.content.length > 0);
    
    console.log("🧠 Processing conversation:", {
      totalMessages: messages.length,
      validMessages: validMessages.length,
      userResponses,
      stage: isEarlyInterview ? "early" : isMidInterview ? "mid" : "late"
    });

    if (validMessages.length < 2) {
      console.log("❌ Invalid message format - too few messages");
      return Response.json(
        { success: false, error: "Invalid message format" },
        { status: 400 }
      );
    }

    console.log("🤖 Calling Ollama API...");
    
    // Build the prompt with conversation history
    // Extract system prompt and create a proper conversation format
    const systemContent = validMessages.find(msg => msg.role === "system")?.content || "";
    const conversationMessages = validMessages
      .filter(msg => msg.role !== "system")
      .map((msg) => `${msg.role === "user" ? "Candidate" : "Interviewer"}: ${msg.content}`)
      .join("\n");

    const conversationPrompt = `${systemContent}\n\nCONVERSATION:\n${conversationMessages}\n\nInterviewer:`;

    const res = await fetch("http://127.0.0.1:11434/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "phi3:mini",
        prompt: conversationPrompt,
        stream: false,
        temperature: 0.3,
        top_p: 0.9,
        top_k: 40,
      }),
    });

    if (!res.ok) {
      throw new Error(`Ollama API error! status: ${res.status}`);
    }

    const data = await res.json();
    const response = data.response;

    console.log("✅ Ollama response received:", response.substring(0, 100));

    const cleanedResponse = response
      .replace(/\*/g, "")
      .replace(/\//g, "")
      .replace(/\[|\]/g, "")
      .replace(/\n+/g, " ")
      .trim();

    // Enforce maximum word limit for voice conversations
    const words = cleanedResponse.split(' ');
    const truncatedResponse = words.length > 20 
      ? words.slice(0, 20).join(' ') + '...'
      : cleanedResponse;

    console.log("📤 Sending response back to client. Words:", words.length);
    
    return Response.json({
      success: true,
      response: truncatedResponse,
      timestamp: new Date().toISOString(),
      interviewStage: isEarlyInterview ? "early" : isMidInterview ? "mid" : "late",
      totalUserResponses: userResponses,
      shouldEndInterview: userResponses >= 8,
    });
  } catch (error) {
    console.error("❌ Ollama API Error:", error);
    return Response.json(
      { success: false, error: "Failed to generate response" },
      { status: 500 }
    );
  }
}