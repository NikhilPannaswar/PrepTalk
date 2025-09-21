import { generateText } from "ai";
import { google } from "@ai-sdk/google";
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

CRITICAL INTERVIEW FLOW RULES:
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

CONVERSATION CONTEXT: Look at the conversation history carefully. The candidate just said something specific - your response should directly relate to what they mentioned. Show you were listening by referencing their exact words or experiences they shared.

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
- Keep responses between 25-35 words for natural voice conversation
- Do not use special characters like *, /, or markdown formatting
- Ask follow-up questions that show you were listening to their answer
- Be encouraging and positive - acknowledge good points before moving on
- Reference specific things they mentioned in their previous response
- If they mention a project, ask about challenges, technologies, or outcomes
- If they mention experience, ask for specific examples or details
- Build rapport by acknowledging their expertise and experiences
- Use natural transitions like "That's interesting..." or "I'd love to hear more about..."
- End questions with their name occasionally to keep it personal`;

    if (message.includes("[SILENCE_DETECTED]")) {
      systemPrompt += `\n\nSPECIAL SITUATION: The candidate paused for 3+ seconds. Please:
- Gently encourage them ("Take your time" or "No rush")
- Rephrase the current question if needed
- Ask a simpler follow-up question
- Keep the conversation flowing naturally
- Show patience and understanding`;
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
        content: message.trim(),
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

    console.log("🤖 Calling Gemini API...");
    const { text: response } = await generateText({
      model: google("gemini-2.0-flash-001"),
      messages: validMessages,
      temperature: 0.6,
      maxTokens: 120,
    });

    console.log("✅ Gemini response received:", response.substring(0, 100));

    const cleanedResponse = response
      .replace(/\*/g, "")
      .replace(/\//g, "")
      .replace(/\[|\]/g, "")
      .replace(/\n+/g, " ")
      .trim();

    console.log("📤 Sending response back to client");
    
    return Response.json({
      success: true,
      response: cleanedResponse,
      timestamp: new Date().toISOString(),
      interviewStage: isEarlyInterview ? "early" : isMidInterview ? "mid" : "late",
      totalUserResponses: userResponses,
      shouldEndInterview: userResponses >= 8,
    });
  } catch (error) {
    console.error("❌ Gemini API Error:", error);
    return Response.json(
      { success: false, error: "Failed to generate response" },
      { status: 500 }
    );
  }
}