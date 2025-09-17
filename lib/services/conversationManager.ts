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

      const data = await response.json();

      if (data.success) {
        // Add both user message and assistant response to conversation
        this.addUserMessage(interviewId, message);
        this.addAssistantMessage(interviewId, data.response);
        
        return data.response;
      } else {
        throw new Error(data.error || 'Failed to get response');
      }
    } catch (error) {
      console.error('Error sending message to Gemini:', error);
      throw error;
    }
  }

  initializeConversation(interviewId: string, interviewContext: InterviewContext, userName: string): void {
    // Clear any existing conversation
    this.clearConversation(interviewId);
    
    // Add initial system message
    this.addSystemMessage(
      interviewId, 
      `Interview started for ${userName}. Role: ${interviewContext.role}, Level: ${interviewContext.level}, Type: ${interviewContext.type}`
    );
  }
}