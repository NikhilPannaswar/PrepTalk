"use client";

import { useState } from 'react';
import { SpeechToTextService } from '@/lib/services/speechToText';

export default function SpeechDebugTester() {
  const [isListening, setIsListening] = useState(false);
  const [result, setResult] = useState('');
  const [error, setError] = useState('');
  const [sttService] = useState(() => new SpeechToTextService());

  const testSpeech = async () => {
    if (!sttService.isSupported()) {
      setError('Speech recognition not supported in this browser. Please use Chrome or Edge.');
      return;
    }

    try {
      setIsListening(true);
      setError('');
      setResult('');

      // Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());

      const transcript = await sttService.startListening();
      setResult(transcript);
    } catch (err: any) {
      setError(err.message || 'Speech recognition failed');
    } finally {
      setIsListening(false);
    }
  };

  const stopListening = () => {
    sttService.stopListening();
    setIsListening(false);
  };

  return (
    <div className="p-6 bg-gray-100 rounded-lg max-w-md mx-auto">
      <h3 className="text-lg font-bold mb-4">Speech Recognition Test</h3>
      
      <div className="mb-4">
        <button
          onClick={testSpeech}
          disabled={isListening}
          className="bg-blue-500 text-white px-4 py-2 rounded mr-2 disabled:bg-gray-400"
        >
          {isListening ? 'Listening...' : 'Start Speech Test'}
        </button>
        
        {isListening && (
          <button
            onClick={stopListening}
            className="bg-red-500 text-white px-4 py-2 rounded"
          >
            Stop
          </button>
        )}
      </div>

      {isListening && (
        <div className="mb-4 p-3 bg-blue-100 rounded">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            <span className="text-blue-700">Listening for speech...</span>
          </div>
        </div>
      )}

      {result && (
        <div className="mb-4 p-3 bg-green-100 rounded">
          <strong>Result:</strong> {result}
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-100 rounded">
          <strong>Error:</strong> {error}
        </div>
      )}

      <div className="text-xs text-gray-600">
        <p>Tips:</p>
        <ul className="list-disc list-inside">
          <li>Allow microphone permission when prompted</li>
          <li>Speak clearly after clicking "Start Speech Test"</li>
          <li>Wait for final result</li>
        </ul>
      </div>
    </div>
  );
}