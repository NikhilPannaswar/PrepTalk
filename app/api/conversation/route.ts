import { generateText } from "ai";
import { google } from "@ai-sdk/google";
import { NextRequest } from "next/server";

export interface ConversationMessage {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: string;
}

export async function POST(request: NextRequest) {
  try {
    const { 
      message, 
      conversationHistory, 
      interviewContext, 
      userName 
    } = await request.json();

    // Build conversation context
    let systemPrompt = `You are an AI interviewer conducting a ${interviewContext.type} interview for a ${interviewContext.role} position requiring ${interviewContext.level} experience level. The tech stack includes: ${interviewContext.techstack.join(", ")}.

Your role:
- Conduct a natural, conversational interview
- Ask follow-up questions based on user responses
- Keep the conversation engaging and professional
- Ask questions that test both technical skills and behavioral aspects
- Continue the conversation naturally without interruption
- Generate your own questions based on the conversation flow
- The user's name is ${userName}

Interview Questions to cover (use as guidance, but adapt based on conversation):
${interviewContext.questions.map((q: string, i: number) => `${i + 1}. ${q}`).join('\n')}

Important: 
- Keep responses concise and natural for voice conversation
- Don't use special characters like *, /, or markdown formatting
- Ask one question at a time
- Build on previous responses
- Be encouraging and supportive`;

    // Handle silence messages specially
    if (message.includes("[User paused - please continue")) {
      systemPrompt += `

SPECIAL INSTRUCTION: The user paused or is taking time to think. Please:
- Encourage them gently
- Ask if they need the question repeated
- Provide a follow-up or clarifying question
- Keep the conversation flowing naturally
- Don't wait for them, take initiative to continue`;
    }

    // Prepare conversation history for Gemini
    const messages = [
      { role: "system", content: systemPrompt },
      ...conversationHistory.map((msg: ConversationMessage) => ({
        role: msg.role === "assistant" ? "assistant" : "user",
        content: msg.content
      })),
      { role: "user", content: message }
    ];

    const { text: response } = await generateText({
      model: google("gemini-2.0-flash-001"),
      messages,
      temperature: 0.7,
      maxTokens: 500,
    });

    return Response.json({
      success: true,
      response,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error("Gemini API Error:", error);
    return Response.json(
      { success: false, error: "Failed to generate response" },
      { status: 500 }
    );
  }
}