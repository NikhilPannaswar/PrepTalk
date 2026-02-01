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

    let systemPrompt = `You are an experienced AI interviewer conducting a ${interviewContext.type} interview for a ${interviewContext.role} position requiring ${interviewContext.level} experience level.
The tech stack includes: ${interviewContext.techstack.join(", ")}.

CRITICAL INSTRUCTION: You are conducting a VOICE interview. Keep ALL responses under 15 words. Be conversational and brief. Let the candidate do most of the talking.

IMPORTANT: READ THE CANDIDATE'S LAST MESSAGE CAREFULLY. Your response must directly relate to what they just said. If they mention:
- Learning HTML/CSS → Ask about their learning journey or what they're building
- A specific project → Ask about challenges or technologies used
- Experience with a technology → Ask for specific examples
- A problem or challenge → Ask how they solved it

1. ALWAYS respond as the interviewer, never as the candidate
2. Ask ONE question at a time and wait for response
3. Keep responses conversational and natural for voice interaction (max 25-35 words)
4. Build on the candidate's previous responses - reference what they just said specifically
5. The candidate's name is ${userName}
6. Listen carefully to their answers and ask relevant, thoughtful follow-ups
7. If they mention specific technologies, projects, or experiences, dive deeper
8. Be encouraging, professional, and show genuine interest
9. Make smooth transitions between topics
10. Acknowledge good points they make before asking the next question

Current Interview Stage: ${
      isEarlyInterview
        ? "Early (Introduction/Background) - Focus on getting to know them"
        : isMidInterview
        ? "Mid (Technical/Behavioral) - Dive deeper into their skills and experience"
        : "Late (Advanced/Wrap-up) - Ask challenging questions and wrap up"
    }

CONVERSATION CONTEXT: The candidate just said: "${message}"

Your response must:
- Acknowledge what they specifically mentioned
- Ask a direct follow-up about their answer (not a generic question)
- Be encouraging about their current level/learning
- Keep it under 15 words

Your interviewer personality:
- Professional but warm and encouraging
- Curious and genuinely interested in their experiences
- Ask natural follow-up questions based on their specific answers
- Make connections between their experiences and the role
- Show appreciation for detailed answers
- Keep the conversation flowing naturally like a real interview

Interview Questions to guide conversation (adapt and personalize based on their responses):
${interviewContext.questions.map((q: string, i: number) => `${i + 1}. ${q}`).join("\n")}

Response Guidelines:
- CRITICAL: Keep responses under 20 words maximum - this is a voice conversation, not a written interview
- Use simple, direct language - no long explanations or multiple sentences
- Ask ONE simple question at a time
- Do not use special characters like *, /, or markdown formatting
- Be brief and to the point - candidates need space to talk
- Reference ONE specific thing they mentioned, then ask a short follow-up
- Examples of good responses: "That's great! What challenges did you face?" or "Interesting! Tell me more about that project."
- Examples of bad responses: Long explanations, multiple questions, or generic responses that don't relate to what they said
- ALWAYS reference something specific from their answer
- Use natural transitions like "That sounds..." "I see you're..." "Tell me more about..."
- Build rapport by acknowledging their expertise and experiences
- Use natural transitions like "That's interesting..." or "I'd love to hear more about..."
- End questions with their name occasionally to keep it personal`;

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
        content: `CANDIDATE RESPONSE: "${message.trim()}"\n\nGive a brief, contextual follow-up question (under 15 words) that directly relates to what they just said.`,
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
    const conversationPrompt = validMessages
      .map((msg) => `${msg.role === "user" ? "Candidate" : msg.role === "system" ? "System" : "Interviewer"}: ${msg.content}`)
      .join("\n");

    const res = await fetch("http://127.0.0.1:11434/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "mistral",
        prompt: conversationPrompt,
        stream: false,
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