"use client";

import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

import { cn } from "@/lib/utils";
import { SpeechToTextService } from "@/lib/services/speechToText";
import { TextToSpeechService } from "@/lib/services/textToSpeech";
import { ConversationManager, InterviewContext } from "@/lib/services/conversationManager";
import { createFeedback } from "@/lib/actions/general.action";
import CameraFeed from "./CameraFeed";

enum ConversationStatus {
  INACTIVE = "INACTIVE",
  LISTENING = "LISTENING", 
  PROCESSING = "PROCESSING",
  SPEAKING = "SPEAKING",
  SILENCE_DETECTED = "SILENCE_DETECTED",
  ACTIVE = "ACTIVE",
  FINISHED = "FINISHED",
}

const OllamaAgent = ({
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
      
      // Request microphone permission first
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        console.log("✅ Microphone access granted");
        // Stop the stream immediately after permission check
        stream.getTracks().forEach(track => track.stop());
      } catch (micError) {
        console.error("❌ Microphone access denied:", micError);
        setError("🎤 Microphone access is required for the interview. Please click 'Allow' when prompted and refresh the page if needed.");
        setCurrentMessage("Please allow microphone access to continue with the interview. Look for the microphone icon in your browser's address bar.");
        return;
      }
      
      setStatus(ConversationStatus.ACTIVE);
      setError("");
      
      // Initialize conversation
      conversationManager.current.initializeConversation(interviewId!, interviewContext, userName);
      
      // AI starts with self-introduction first
      setStatus(ConversationStatus.SPEAKING);
      setIsSpeaking(true);
      
      const introMessage = `Hello ${userName}! I'm excited to interview you for the ${role} position today. Let's start - tell me about your background with ${techstack.slice(0, 1).join('')}.`;
      
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
      setError("Failed to start conversation. Please check your microphone and try again.");
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
      setError(""); // Clear any previous errors
      setCurrentMessage("🎤 I'm listening... I'll continue after 2.5 seconds of silence.");
      
      // Handle silence detection - AI continues if user doesn't speak for 2.5 seconds
      const handleSilence = async () => {
        console.log("⏱️ Silence detected after 2.5 seconds - AI taking over conversation");
        setIsListening(false);
        setStatus(ConversationStatus.SILENCE_DETECTED);
        setCurrentMessage("I see you're taking a moment to think... Let me help guide the conversation.");
        
        // Short delay to show silence detection
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        if (!isFinishedRef.current) {
          setStatus(ConversationStatus.PROCESSING);
          
          if (conversationManager.current) {
            try {
              console.log("🤖 Asking AI to handle 2.5s silence");
              const response = await conversationManager.current.sendMessageToOllama(
                interviewId!,
                "[PAUSE_DETECTED] The candidate paused for 2.5 seconds after the last question. Please continue the conversation naturally by either: 1) Gently encouraging them to elaborate, 2) Rephrasing the question in a simpler way, 3) Asking a related follow-up question, or 4) Moving to the next topic if they seem to have finished their response. Keep it conversational and supportive.",
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
              setError("Had trouble processing. Let's continue...");
              // Retry listening if silence handling fails
              setTimeout(() => {
                if (!isFinishedRef.current) {
                  startListeningCycle();
                }
              }, 2000);
            }
          }
        }
      };

      try {
        // Start listening with silence detection
        console.log("🔊 Setting up speech recognition with 2.5s silence detection");
        sttService.current.setSilenceThreshold(2500); // 2.5 seconds for responsive flow
        const userInput = await sttService.current.startListening(handleSilence);
        
        // If we got actual user input (not silence)
        if (userInput && userInput.trim() && !isFinishedRef.current) {
          console.log("🎤 User input received:", userInput);
          setIsListening(false);
          setCurrentMessage(`Processing your response...`);
          setStatus(ConversationStatus.PROCESSING);
          
          // Send user input to Gemini and get AI response
          if (conversationManager.current) {
            try {
              console.log("💬 Sending to conversation manager");
              const response = await conversationManager.current.sendMessageToOllama(
                interviewId!,
                userInput,
                interviewContext,
                userName
              );
              
              console.log("🤖 AI response generated");
              
              await speakMessage(response);
              
              // Continue to next listening cycle
              setTimeout(() => {
                if (!isFinishedRef.current) {
                  console.log("🔄 Continuing to next listening cycle");
                  startListeningCycle();
                }
              }, 1500);
            } catch (apiError) {
              console.error("API Error:", apiError);
              setError("Had trouble processing your response. Let's continue...");
              
              // Fallback response
              await speakMessage("I apologize, I had trouble processing that. Could you please try again?");
              
              setTimeout(() => {
                if (!isFinishedRef.current) {
                  startListeningCycle();
                }
              }, 2000);
            }
          }
        }
      } catch (speechError) {
        console.error("Speech recognition error:", speechError);
        setIsListening(false);
        
        const errorMessage = speechError instanceof Error ? speechError.message : String(speechError);
        
        if (errorMessage.includes('not-allowed') || errorMessage.includes('denied')) {
          setError("🎤 Microphone access denied. Please allow microphone permission and refresh the page.");
          setCurrentMessage("Unable to access microphone. Please check your browser settings.");
        } else if (errorMessage.includes('no-speech')) {
          setError("No speech detected. Please try speaking louder or closer to your microphone.");
          setCurrentMessage("I didn't hear anything. Please try again.");
          // Auto-retry after a short delay
          setTimeout(() => {
            if (!isFinishedRef.current) {
              setError("");
              startListeningCycle();
            }
          }, 2000);
        } else {
          setError("Speech recognition failed. Let me try again...");
          setCurrentMessage("Having trouble hearing you. Please check your microphone and try again.");
          
          // Retry listening after speech recognition error
          setTimeout(() => {
            if (!isFinishedRef.current) {
              setError("");
              startListeningCycle();
            }
          }, 2000);
        }
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
        <div className="card-interviewer bg-gray-800 rounded-lg p-6 flex flex-col items-center">
          <div className="avatar mb-4">
            <div className="w-16 h-16 bg-purple-500 rounded-full flex items-center justify-center">
              <span className="text-white text-2xl">🤖</span>
            </div>
            {isSpeaking && <span className="animate-speak" />}
          </div>
          <h3>AI Interviewer</h3>
          <p className="text-sm text-gray-400">{getStatusText()}</p>
        </div>

        {/* User Profile Card */}
        <div className="card-border">
          <div className="card-content">
            <CameraFeed className="rounded-full object-cover size-[240px]" />
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
        <div className="bg-gray-800 border border-gray-600 rounded-lg p-6 mb-4">
          <div className="text-center">
            <p className="text-gray-200 text-base leading-relaxed mb-3">
              {currentMessage}
            </p>
            
            {/* Status indicator */}
            <div className="flex items-center justify-center gap-2 mb-2">
              {isListening && (
                <div className="flex items-center gap-2 text-blue-400">
                  <div className="animate-pulse w-2 h-2 bg-blue-400 rounded-full"></div>
                  <span className="text-sm font-medium">🎤 Listening for your response...</span>
                </div>
              )}
              {isSpeaking && (
                <div className="flex items-center gap-2 text-purple-400">
                  <div className="animate-pulse w-2 h-2 bg-purple-400 rounded-full"></div>
                  <span className="text-sm font-medium">🗣️ AI is speaking...</span>
                </div>
              )}
              {status === ConversationStatus.PROCESSING && (
                <div className="flex items-center gap-2 text-yellow-400">
                  <div className="animate-spin w-4 h-4 border-2 border-yellow-400 border-t-transparent rounded-full"></div>
                  <span className="text-sm font-medium">Processing...</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-red-900/50 border border-red-600 rounded-lg p-4 mb-4">
          <p className="text-red-200 font-semibold mb-2">⚠️ Error:</p>
          <p className="text-red-300 mb-3">{error}</p>
          <div className="bg-red-800/50 rounded p-3">
            <p className="text-red-200 text-sm font-medium mb-2">💡 Troubleshooting Tips:</p>
            <ul className="text-red-300 text-sm space-y-1 list-disc list-inside">
              <li>Allow microphone access when prompted</li>
              <li>Use Chrome or Edge browser for best results</li>
              <li>Ensure you're in a quiet environment</li>
              <li>Speak clearly and wait for the listening indicator</li>
            </ul>
          </div>
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

export default OllamaAgent;