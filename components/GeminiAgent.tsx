"use client";

import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

import { cn } from "@/lib/utils";
import { SpeechToTextService } from "@/lib/services/speechToText";
import { TextToSpeechService } from "@/lib/services/textToSpeech";
import { ConversationManager, InterviewContext } from "@/lib/services/conversationManager";
import { createFeedback } from "@/lib/actions/general.action";

enum ConversationStatus {
  INACTIVE = "INACTIVE",
  LISTENING = "LISTENING", 
  PROCESSING = "PROCESSING",
  SPEAKING = "SPEAKING",
  SILENCE_DETECTED = "SILENCE_DETECTED",
  ACTIVE = "ACTIVE",
  FINISHED = "FINISHED",
}

const GeminiAgent = ({
  userName,
  userId,
  interviewId,
  feedbackId,
  type,
  questions,
  role,
  level,
  techstack,
  interviewType,
}: AgentProps & { 
  role: string; 
  level: string; 
  techstack: string[]; 
  interviewType: string; 
}) => {
  const router = useRouter();
  const [status, setStatus] = useState<ConversationStatus>(ConversationStatus.INACTIVE);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentMessage, setCurrentMessage] = useState<string>("");
  const [error, setError] = useState<string>("");
  
  // Services
  const sttService = useRef<SpeechToTextService | null>(null);
  const ttsService = useRef<TextToSpeechService | null>(null);
  const conversationManager = useRef<ConversationManager | null>(null);
  
  // Interview context
  const interviewContext: InterviewContext = {
    role,
    type: interviewType,
    level,
    techstack,
    questions: questions || []
  };

  useEffect(() => {
    // Initialize services
    sttService.current = new SpeechToTextService();
    ttsService.current = new TextToSpeechService();
    conversationManager.current = new ConversationManager();

    // Check browser support
    if (!sttService.current.isSupported()) {
      setError("Speech recognition is not supported in this browser");
    }
    if (!ttsService.current.isSupported()) {
      setError("Speech synthesis is not supported in this browser");
    }
  }, []);

  const startConversation = async () => {
    try {
      if (!conversationManager.current) return;
      
      setStatus(ConversationStatus.ACTIVE);
      setError("");
      
      // Initialize conversation
      conversationManager.current.initializeConversation(interviewId!, interviewContext, userName);
      
      // Start with AI greeting
      const greeting = await conversationManager.current.sendMessageToGemini(
        interviewId!,
        `Hello, I'm ready to start the interview. Please introduce yourself and let's begin.`,
        interviewContext,
        userName
      );
      
      await speakMessage(greeting);
      
      // Start listening cycle
      startListeningCycle();
      
    } catch (error) {
      console.error("Error starting conversation:", error);
      setError("Failed to start conversation");
      setStatus(ConversationStatus.INACTIVE);
    }
  };

  const startListeningCycle = async () => {
    if (status === ConversationStatus.FINISHED || !sttService.current) return;
    
    try {
      setStatus(ConversationStatus.LISTENING);
      setIsListening(true);
      
      // Handle silence detection
      const handleSilence = async () => {
        console.log("Silence detected, AI continuing conversation...");
        setIsListening(false);
        setStatus(ConversationStatus.SILENCE_DETECTED);
        setCurrentMessage("Taking a moment to continue...");
        
        // Short delay to show silence detection
        await new Promise(resolve => setTimeout(resolve, 800));
        
        setStatus(ConversationStatus.PROCESSING);
        
        if (conversationManager.current) {
          // Ask AI to continue based on silence
          const response = await conversationManager.current.sendMessageToGemini(
            interviewId!,
            "[User paused - please continue the conversation or ask a follow-up question]",
            interviewContext,
            userName
          );
          
          await speakMessage(response);
          
          // Continue listening cycle after a short pause
          setTimeout(() => {
            if (status === ConversationStatus.ACTIVE) {
              startListeningCycle();
            }
          }, 1500);
        }
      };

      const userInput = await sttService.current.startListening(handleSilence);
      
      // If we got actual user input (not silence)
      if (userInput && userInput.trim()) {
        setIsListening(false);
        setCurrentMessage(userInput);
        setStatus(ConversationStatus.PROCESSING);
        
        // Send to Gemini and get response
        if (conversationManager.current) {
          const response = await conversationManager.current.sendMessageToGemini(
            interviewId!,
            userInput,
            interviewContext,
            userName
          );
          
          await speakMessage(response);
          
          // Continue listening cycle
          setTimeout(() => {
            if (status === ConversationStatus.ACTIVE) {
              startListeningCycle();
            }
          }, 1000);
        }
      }
      
    } catch (error) {
      console.error("Error in listening cycle:", error);
      setIsListening(false);
      
      // Retry listening after a short delay
      setTimeout(() => {
        if (status === ConversationStatus.ACTIVE) {
          startListeningCycle();
        }
      }, 2000);
    }
  };

  const speakMessage = async (message: string) => {
    if (!ttsService.current) return;
    
    try {
      setStatus(ConversationStatus.SPEAKING);
      setIsSpeaking(true);
      setCurrentMessage(message);
      
      await ttsService.current.speak(message, {
        rate: 1.0,
        pitch: 1.0,
        volume: 1.0
      });
      
      setIsSpeaking(false);
      setStatus(ConversationStatus.ACTIVE);
      
    } catch (error) {
      console.error("Error speaking message:", error);
      setIsSpeaking(false);
    }
  };

  const endConversation = async () => {
    try {
      // Stop all services
      if (sttService.current) {
        sttService.current.stopListening();
      }
      if (ttsService.current) {
        ttsService.current.stop();
      }
      
      setStatus(ConversationStatus.FINISHED);
      setIsListening(false);
      setIsSpeaking(false);

      // Save conversation as feedback
      if (type === "interview" && conversationManager.current) {
        const conversation = conversationManager.current.getConversation(interviewId!);
        
        const { success, feedbackId: id } = await createFeedback({
          interviewId: interviewId!,
          userId: userId!,
          transcript: conversation,
          feedbackId,
        });

        if (success && id) {
          router.push(`/interview/${interviewId}/feedback`);
        } else {
          console.error("Error saving feedback");
          router.push("/");
        }
      } else {
        router.push("/");
      }
    } catch (error) {
      console.error("Error ending conversation:", error);
      router.push("/");
    }
  };

  const getStatusText = () => {
    switch (status) {
      case ConversationStatus.INACTIVE:
        return "Ready to start";
      case ConversationStatus.LISTENING:
        return "Listening...";
      case ConversationStatus.PROCESSING:
        return "Processing...";
      case ConversationStatus.SPEAKING:
        return "Speaking...";
      case ConversationStatus.SILENCE_DETECTED:
        return "Continuing conversation...";
      case ConversationStatus.ACTIVE:
        return "Active";
      case ConversationStatus.FINISHED:
        return "Finished";
      default:
        return "";
    }
  };

  return (
    <>
      <div className="call-view">
        {/* AI Interviewer Card */}
        <div className="card-interviewer">
          <div className="avatar">
            <Image
              src="/ai-avatar.png"
              alt="AI Interviewer"
              width={65}
              height={54}
              className="object-cover"
            />
            {isSpeaking && <span className="animate-speak" />}
          </div>
          <h3>AI Interviewer</h3>
          <p className="text-sm text-gray-400">{getStatusText()}</p>
        </div>

        {/* User Profile Card */}
        <div className="card-border">
          <div className="card-content">
            <Image
              src="/user-avatar.png"
              alt="User"
              width={539}
              height={539}
              className="rounded-full object-cover size-[120px]"
            />
            <h3>{userName}</h3>
            {isListening && (
              <div className="flex items-center gap-2 mt-2">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-sm">Listening...</span>
              </div>
            )}
            {status === ConversationStatus.SILENCE_DETECTED && (
              <div className="flex items-center gap-2 mt-2">
                <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse"></div>
                <span className="text-sm">AI taking over...</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Current Message Display */}
      {currentMessage && (
        <div className="transcript-border">
          <div className="transcript">
            <p
              className={cn(
                "transition-opacity duration-500",
                "animate-fadeIn opacity-100"
              )}
            >
              {currentMessage}
            </p>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Control Buttons */}
      <div className="w-full flex justify-center gap-4">
        {status === ConversationStatus.INACTIVE ? (
          <button 
            className="relative btn-call" 
            onClick={startConversation}
            disabled={!!error}
          >
            <span className="relative">
              Start Interview
            </span>
          </button>
        ) : status === ConversationStatus.FINISHED ? (
          <div className="text-center">
            <p className="text-green-600 mb-2">Interview Completed</p>
            <button 
              className="btn-call"
              onClick={() => router.push("/")}
            >
              Back to Home
            </button>
          </div>
        ) : (
          <button 
            className="btn-disconnect" 
            onClick={endConversation}
          >
            End Interview
          </button>
        )}
      </div>
    </>
  );
};

export default GeminiAgent;