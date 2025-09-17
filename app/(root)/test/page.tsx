import Link from "next/link";
import { DEMO_INTERVIEWS } from "@/constants/demoData";

const TestPage = () => {
  return (
    <div className="container mx-auto px-4 py-8 bg-white min-h-screen">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-900">
          AI Interview System - Gemini Voice Conversation
        </h1>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
          <h2 className="text-lg font-semibold mb-4 text-blue-900">🎯 Features Implemented:</h2>
          <ul className="space-y-2 text-sm text-blue-800">
            <li>✅ Gemini API integration for intelligent conversation</li>
            <li>✅ Web Speech API for Speech-to-Text (browser native)</li>
            <li>✅ Web Speech API for Text-to-Speech (browser native)</li>
            <li>✅ Continuous conversation with context retention</li>
            <li>✅ Interview conversation stored in array format</li>
            <li>✅ Dynamic question generation based on conversation</li>
            <li>✅ Authentication bypass for testing</li>
            <li>✅ End button to stop conversation and generate feedback</li>
            <li>🆕 <strong>Smart silence detection (2-3 seconds) - AI continues automatically</strong></li>
            <li>🆕 <strong>Live interaction feel - Natural conversation flow</strong></li>
          </ul>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-8">
          <h2 className="text-lg font-semibold mb-4 text-yellow-900">📋 Setup Requirements:</h2>
          <ol className="space-y-2 text-sm list-decimal list-inside text-yellow-800">
            <li>Create a <code className="bg-yellow-200 px-1 rounded text-yellow-900">.env.local</code> file with your Google Gemini API key:</li>
            <li className="ml-4"><code className="bg-yellow-200 px-1 rounded text-yellow-900">GOOGLE_GENERATIVE_AI_API_KEY=your_api_key_here</code></li>
            <li>Make sure your browser supports Web Speech API (Chrome/Edge recommended)</li>
            <li>Allow microphone permissions when prompted</li>
            <li>Ensure you have speakers/headphones for audio output</li>
          </ol>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {DEMO_INTERVIEWS.map((interview) => (
            <div key={interview.id} className="bg-white rounded-lg border shadow-sm p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-lg">
                    {interview.role.charAt(0)}
                  </span>
                </div>
                <div>
                  <h3 className="font-semibold text-lg text-gray-900">{interview.role}</h3>
                  <p className="text-gray-600 text-sm">
                    {interview.level} • {interview.type}
                  </p>
                </div>
              </div>
              
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">Tech Stack:</p>
                <div className="flex flex-wrap gap-2">
                  {interview.techstack.map((tech) => (
                    <span
                      key={tech}
                      className="px-2 py-1 bg-gray-100 rounded-md text-xs"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>

              <Link
                href={`/interview/${interview.id}`}
                className="inline-block w-full bg-blue-600 hover:bg-blue-700 text-white text-center py-2 px-4 rounded-md transition-colors duration-200"
              >
                Start Voice Interview
              </Link>
            </div>
          ))}
        </div>

        <div className="mt-8 bg-gray-50 border border-gray-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4 text-gray-900">🎤 How It Works:</h2>
          <ol className="space-y-3 text-sm list-decimal list-inside text-gray-800">
            <li><strong>Click "Start Voice Interview"</strong> - The AI will greet you and begin</li>
            <li><strong>Listen to the AI</strong> - Questions and responses will be spoken aloud</li>
            <li><strong>Speak your answers</strong> - The system automatically listens after the AI finishes</li>
            <li><strong>Continuous conversation</strong> - The AI builds on your responses and asks follow-up questions</li>
            <li><strong>🆕 Natural pauses</strong> - If you pause for 2-3 seconds, the AI will continue automatically</li>
            <li><strong>Live interaction feel</strong> - Just like talking to a real interviewer</li>
            <li><strong>Click "End Interview"</strong> - Stops the conversation and generates detailed feedback</li>
          </ol>
        </div>

        <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4 text-green-900">💡 Smart Silence Detection:</h2>
          <ul className="space-y-2 text-sm text-green-800">
            <li>• <strong>Thinking time</strong> - Take pauses to think, AI will wait</li>
            <li>• <strong>Auto-continue</strong> - After 2.5 seconds of silence, AI takes over</li>
            <li>• <strong>Natural flow</strong> - AI will encourage you, repeat questions, or ask follow-ups</li>
            <li>• <strong>Visual feedback</strong> - See when AI detects silence and continues</li>
            <li>• <strong>No interruptions</strong> - Smooth, natural conversation experience</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default TestPage;