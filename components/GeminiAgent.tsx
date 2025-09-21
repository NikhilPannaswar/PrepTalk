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
  const isFinishedRef = useRef(false);
  
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
      
      // AI starts with self-introduction first
      setStatus(ConversationStatus.SPEAKING);
      setIsSpeaking(true);
      
      const introMessage = `Hello ${userName}! I'm your AI interviewer, and I'm excited to conduct your ${interviewType} interview for the ${role} position today. I see you have experience with ${techstack.slice(0, 2).join(' and ')}. This will be a conversational interview where I'll ask you questions and we can have a natural discussion. Let's begin! Please start by introducing yourself and telling me about your background.`;
      
      setCurrentMessage(introMessage);
      
      // Speak the introduction
      await speakMessage(introMessage);
      
      // After AI finishes speaking, start listening for user response
      setTimeout(() => {
        if (!isFinishedRef.current) {
          startListeningCycle();
        }
      }, 1000);
      
    } catch (error) {
      console.error("Error starting conversation:", error);
      setError("Failed to start conversation");
      setStatus(ConversationStatus.INACTIVE);
    }
  };

  const startListeningCycle = async () => {
    if (isFinishedRef.current || !sttService.current) {
      console.log("🚫 Cannot start listening - finished or no STT service");
      return;
    }
    
    console.log("👂 Starting listening cycle");
    
    try {
      setStatus(ConversationStatus.LISTENING);
      setIsListening(true);
      setCurrentMessage("I'm listening... Take your time to answer completely.");
      
      // Handle silence detection - AI continues if user doesn't speak for 3 seconds
      const handleSilence = async () => {
        console.log("⏱️ 3-second silence detected - AI taking over conversation");
        setIsListening(false);
        setStatus(ConversationStatus.SILENCE_DETECTED);
        setCurrentMessage("I see you're thinking... Let me help guide the conversation.");
        
        // Short delay to show silence detection
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        setStatus(ConversationStatus.PROCESSING);
        
        if (conversationManager.current && !isFinishedRef.current) {
          try {
            console.log("🤖 Asking AI to handle silence");
            // Ask AI to continue based on silence
            const response = await conversationManager.current.sendMessageToGemini(
              interviewId!,
              "[SILENCE_DETECTED] The candidate paused for 3+ seconds. Please continue the conversation by either rephrasing the question, providing encouragement, or asking a follow-up question to keep the interview flowing naturally.",
              interviewContext,
              userName
            );
            
            await speakMessage(response);
            
            // Continue listening cycle after AI speaks
            setTimeout(() => {
              if (!isFinishedRef.current) {
                startListeningCycle();
              }
            }, 2000);
          } catch (error) {
            console.error("Error handling silence:", error);
            // Retry listening if silence handling fails
            setTimeout(() => {
              if (!isFinishedRef.current) {
                startListeningCycle();
              }
            }, 2000);
          }
        }
      };

      try {
        // Start listening with 3-second silence detection
        console.log("🔊 Setting up speech recognition with 3-second silence threshold");
        sttService.current.setSilenceThreshold(3000); // 3 seconds
        const userInput = await sttService.current.startListening(handleSilence);
        
        // If we got actual user input (not silence)
        if (userInput && userInput.trim()) {
          console.log("🎤 User input received:", userInput);
          setIsListening(false);
          setCurrentMessage(`Processing your response: "${userInput.slice(0, 50)}${userInput.length > 50 ? '...' : ''}"`);
          setStatus(ConversationStatus.PROCESSING);
          
          // Send user input to Gemini and get AI response
          if (conversationManager.current && !isFinishedRef.current) {
            console.log("💬 Sending to conversation manager");
            const response = await conversationManager.current.sendMessageToGemini(
              interviewId!,
              userInput,
              interviewContext,
              userName
            );
            
            console.log("🤖 AI response generated:", response.substring(0, 100));
            
            console.log("🗣️ Starting AI speech");
            await speakMessage(response);
            
            // Wait longer before next listening cycle to give natural pause
            setTimeout(() => {
              if (!isFinishedRef.current) {
                console.log("🔄 Continuing to next listening cycle");
                startListeningCycle();
              }
            }, 1500);
          }
        }
      } catch (speechError) {
        console.error("Speech recognition error:", speechError);
        setIsListening(false);
        setError("Speech recognition failed. Please try again or check your microphone.");
        
        // Retry listening after speech recognition error
        setTimeout(() => {
          if (!isFinishedRef.current) {
            setError(""); // Clear error before retrying
            startListeningCycle();
          }
        }, 3000);
      }
      
    } catch (error) {
      console.error("Error in listening cycle:", error);
      setIsListening(false);
      setError("An error occurred during conversation. Retrying...");
      
      // Retry listening after a short delay
      setTimeout(() => {
        if (!isFinishedRef.current) {
          setError(""); // Clear error before retrying
          startListeningCycle();
        }
      }, 3000);
    }
  };

  const speakMessage = async (message: string) => {
    if (!ttsService.current) {
      console.log("❌ No TTS service available");
      return;
    }
    
    console.log("🗣️ Starting speech:", message.substring(0, 50) + (message.length > 50 ? '...' : ''));
    
    try {
      setStatus(ConversationStatus.SPEAKING);
      setIsSpeaking(true);
      setCurrentMessage(message);
      
      await ttsService.current.speak(message, {
        rate: 1.0,
        pitch: 1.0,
        volume: 1.0
      });
      
      console.log("✅ Speech completed");
      setIsSpeaking(false);
      setStatus(ConversationStatus.ACTIVE);
      
    } catch (error) {
      console.error("❌ Error speaking message:", error);
      setIsSpeaking(false);
    }
  };

  const endConversation = async () => {
    try {
      // Set finished flag to stop all ongoing processes
      isFinishedRef.current = true;
      
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
      setCurrentMessage("Thank you for the interview! Generating your detailed feedback...");

      // Save conversation as feedback
      if (type === "interview" && conversationManager.current) {
        const conversation = conversationManager.current.getConversation(interviewId!);
        
        console.log("Ending interview with conversation:", conversation);
        
        // Only create feedback if there's actually a conversation
        if (conversation.length > 1) { // More than just the initial system message
          try {
            const { success, feedbackId: id } = await createFeedback({
              interviewId: interviewId!,
              userId: userId!,
              transcript: conversation,
              feedbackId,
            });

            if (success && id) {
              // Clear conversation from localStorage
              conversationManager.current.clearConversation(interviewId!);
              
              // Navigate to feedback page
              router.push(`/interview/${interviewId}/feedback`);
            } else {
              console.error("Error saving feedback");
              setCurrentMessage("Interview completed successfully! Unfortunately, there was an issue generating feedback.");
              setTimeout(() => {
                router.push("/");
              }, 3000);
            }
          } catch (feedbackError) {
            console.error("Error creating feedback:", feedbackError);
            setCurrentMessage("Interview completed! There was an issue generating feedback, but your performance was great.");
            setTimeout(() => {
              router.push("/");
            }, 3000);
          }
        } else {
          console.log("No substantial conversation to save");
          setCurrentMessage("Interview session was too short to generate feedback. Try having a longer conversation next time!");
          setTimeout(() => {
            router.push("/");
          }, 3000);
        }
      } else {
        // For non-interview types, just go home
        setTimeout(() => {
          router.push("/");
        }, 2000);
      }
    } catch (error) {
      console.error("Error ending conversation:", error);
      setCurrentMessage("Interview completed! Thanks for participating.");
      setTimeout(() => {
        router.push("/");
      }, 3000);
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
      {/* Interview Header */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-xl font-bold text-gray-900">{role} Interview</h3>
            <p className="text-sm text-gray-600">{level} • {interviewType}</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-gray-700">Status:</p>
            <p className={`text-sm font-semibold ${
              status === ConversationStatus.ACTIVE ? 'text-green-600' :
              status === ConversationStatus.LISTENING ? 'text-blue-600' :
              status === ConversationStatus.SPEAKING ? 'text-purple-600' :
              'text-gray-500'
            }`}>
              {getStatusText()}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {techstack.slice(0, 6).map(tech => (
            <span key={tech} className="px-2 py-1 bg-white rounded text-xs text-gray-600 border">
              {tech}
            </span>
          ))}
        </div>
      </div>

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
                <span className="text-sm">AI continuing...</span>
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
                "animate-fadeIn opacity-100 text-gray-800"
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
          <p className="font-semibold">Error:</p>
          <p>{error}</p>
          <p className="text-sm mt-2">Make sure your browser supports speech recognition and you've granted microphone permissions.</p>
        </div>
      )}

      {/* Control Buttons */}
      <div className="w-full flex justify-center gap-4">
        {status === ConversationStatus.INACTIVE ? (
          <div className="flex flex-col items-center gap-4">
            <button 
              className="relative btn-call bg-green-600 hover:bg-green-700" 
              onClick={startConversation}
              disabled={!!error}
            >
              <span className="relative">
                Start Interview
              </span>
            </button>
            <div className="text-center max-w-md">
              <p className="text-sm text-gray-600 mb-2">
                🎤 Make sure you're in a quiet environment with a working microphone
              </p>
              <p className="text-xs text-gray-500">
                The AI will greet you and begin the interview. Speak naturally and take your time to think.
              </p>
            </div>
          </div>
        ) : status === ConversationStatus.FINISHED ? (
          <div className="text-center">
            <p className="text-green-600 mb-4 text-lg font-semibold">Interview Completed Successfully! 🎉</p>
            <p className="text-gray-600 mb-4 text-sm">Generating your detailed feedback...</p>
            <button 
              className="btn-call bg-blue-600 hover:bg-blue-700"
              onClick={() => router.push("/")}
            >
              Back to Home
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4">
            <button 
              className="btn-disconnect bg-red-600 hover:bg-red-700" 
              onClick={endConversation}
            >
              End Interview
            </button>
            <p className="text-sm text-gray-500 text-center">
              Click to end the interview and get your feedback
            </p>
          </div>
        )}
      </div>
    </>
  );
};

export default GeminiAgent;