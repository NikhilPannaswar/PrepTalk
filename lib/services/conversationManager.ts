import { ConversationMessage } from "@/app/api/conversation/route";

export interface InterviewContext {
  role: string;
  type: string;
  level: string;
  techstack: string[];
  questions: string[];
}

export class ConversationManager {
  private conversations: Map<string, ConversationMessage[]> = new Map();

  constructor() {
    // Load conversations from localStorage if available
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('ai_interview_conversations');
        if (saved) {
          const parsed = JSON.parse(saved);
          this.conversations = new Map(parsed);
        }
      } catch (error) {
        console.error('Failed to load conversations from localStorage:', error);
      }
    }
  }

  private saveToStorage(): void {
    if (typeof window !== 'undefined') {
      try {
        const toSave = Array.from(this.conversations.entries());
        localStorage.setItem('ai_interview_conversations', JSON.stringify(toSave));
      } catch (error) {
        console.error('Failed to save conversations to localStorage:', error);
      }
    }
  }

  getConversation(interviewId: string): ConversationMessage[] {
    return this.conversations.get(interviewId) || [];
  }

  addMessage(interviewId: string, message: ConversationMessage): void {
    const conversation = this.getConversation(interviewId);
    conversation.push(message);
    this.conversations.set(interviewId, conversation);
    this.saveToStorage();
  }

  addUserMessage(interviewId: string, content: string): void {
    this.addMessage(interviewId, {
      role: "user",
      content,
      timestamp: new Date().toISOString()
    });
  }

  addAssistantMessage(interviewId: string, content: string): void {
    this.addMessage(interviewId, {
      role: "assistant", 
      content,
      timestamp: new Date().toISOString()
    });
  }

  addSystemMessage(interviewId: string, content: string): void {
    this.addMessage(interviewId, {
      role: "system",
      content,
      timestamp: new Date().toISOString()
    });
  }

  clearConversation(interviewId: string): void {
    this.conversations.delete(interviewId);
    this.saveToStorage();
    console.log(`Cleared conversation for interview: ${interviewId}`);
  }

  clearAllConversations(): void {
    this.conversations.clear();
    this.saveToStorage();
    console.log("Cleared all conversations");
  }

  getAllConversations(): Map<string, ConversationMessage[]> {
    return this.conversations;
  }

  async sendMessageToGemini(
    interviewId: string, 
    message: string, 
    interviewContext: InterviewContext,
    userName: string
  ): Promise<string> {
    try {
      const conversationHistory = this.getConversation(interviewId);
      
      console.log("Sending to Gemini:", message);
      console.log("Conversation history length:", conversationHistory.length);
      
      const response = await fetch('/api/conversation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          conversationHistory,
          interviewContext,
          userName
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        // Only add user message if it's not a silence detection or system message
        if (!message.includes("[SILENCE_DETECTED]") && !message.startsWith("[")) {
          this.addUserMessage(interviewId, message);
        }
        
        // Always add assistant response
        this.addAssistantMessage(interviewId, data.response);
        
        console.log("AI response received:", data.response);
        return data.response;
      } else {
        throw new Error(data.error || 'Failed to get response');
      }
    } catch (error) {
      console.error('Error sending message to Gemini:', error);
      // Fallback response for errors
      return "I apologize, but I'm having trouble processing that right now. Could you please repeat your response?";
    }
  }

  initializeConversation(interviewId: string, interviewContext: InterviewContext, userName: string): void {
    // Clear any existing conversation
    this.clearConversation(interviewId);
    
    // Add initial system message without API call
    this.addSystemMessage(
      interviewId, 
      `Interview initialized for ${userName}. Role: ${interviewContext.role}, Level: ${interviewContext.level}, Type: ${interviewContext.type}, Tech: ${interviewContext.techstack.join(", ")}`
    );
    
    console.log("Conversation initialized for interview:", interviewId);
  }
}