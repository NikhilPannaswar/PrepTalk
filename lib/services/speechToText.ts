// Type declarations for Web Speech API
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null;
  onend: ((this: SpeechRecognition) => any) | null;
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

interface SpeechRecognitionResultList {
  [index: number]: SpeechRecognitionResult;
  length: number;
}

interface SpeechRecognitionResult {
  [index: number]: SpeechRecognitionAlternative;
  isFinal: boolean;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

declare var SpeechRecognition: {
  prototype: SpeechRecognition;
  new(): SpeechRecognition;
};

export class SpeechToTextService {
  private recognition: SpeechRecognition | null = null;
  private isListening = false;
  private silenceTimer: NodeJS.Timeout | null = null;
  private silenceThreshold = 3000; // 3 seconds of silence
  private isUserSpeaking = false;
  private lastSpeechTime: number = 0;

  constructor() {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      
      if (SpeechRecognition) {
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = true; // Keep listening continuously
        this.recognition.interimResults = true; // Get partial results
        this.recognition.lang = 'en-US';
      }
    }
  }

  isSupported(): boolean {
    return this.recognition !== null;
  }

  startListening(onSilence?: () => void): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!this.recognition) {
        reject(new Error('Speech recognition not supported'));
        return;
      }

      if (this.isListening) {
        reject(new Error('Already listening'));
        return;
      }

      this.isListening = true;
      let finalTranscript = '';
      let hasSpoken = false;

      // Clear any existing silence timer
      if (this.silenceTimer) {
        clearTimeout(this.silenceTimer);
        this.silenceTimer = null;
      }

      this.recognition.onresult = (event: SpeechRecognitionEvent) => {
        let interimTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
            hasSpoken = true;
            this.lastSpeechTime = Date.now();
          } else {
            interimTranscript += transcript;
          }
        }

        // User is actively speaking - clear silence timer and mark as speaking
        if (interimTranscript.trim()) {
          this.isUserSpeaking = true;
          this.lastSpeechTime = Date.now();
          if (this.silenceTimer) {
            clearTimeout(this.silenceTimer);
            this.silenceTimer = null;
          }
          hasSpoken = true;
        }

        // User finished a phrase - start silence detection only after final result
        if (finalTranscript.trim() && event.results[event.results.length - 1]?.isFinal) {
          this.isUserSpeaking = false;
          this.startSilenceDetection(onSilence);
        }
      };

      this.recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        this.cleanup();
        reject(new Error(`Speech recognition error: ${event.error}`));
      };

      this.recognition.onend = () => {
        if (this.isListening && finalTranscript.trim()) {
          this.cleanup();
          resolve(finalTranscript.trim());
        } else if (this.isListening && !hasSpoken && onSilence) {
          // User never spoke, trigger silence callback
          this.cleanup();
          onSilence();
        }
      };

      try {
        this.recognition.start();
        
        // Don't start silence detection immediately - wait for user to start speaking
        // Only start silence detection after we detect actual speech
      } catch (error) {
        this.cleanup();
        reject(error);
      }
    });
  }

  private startSilenceDetection(onSilence?: () => void): void {
    // Don't start silence detection if user is currently speaking
    if (this.isUserSpeaking) {
      return;
    }

    // Clear any existing timer
    if (this.silenceTimer) {
      clearTimeout(this.silenceTimer);
    }

    // Start new silence timer - only trigger if truly silent for 3 seconds
    this.silenceTimer = setTimeout(() => {
      // Double-check: only proceed if user hasn't spoken recently and isn't currently speaking
      const timeSinceLastSpeech = Date.now() - this.lastSpeechTime;
      if (this.isListening && !this.isUserSpeaking && timeSinceLastSpeech >= this.silenceThreshold) {
        this.stopListening();
        if (onSilence) {
          onSilence();
        }
      }
    }, this.silenceThreshold);
  }

  private cleanup(): void {
    this.isListening = false;
    this.isUserSpeaking = false;
    this.lastSpeechTime = 0;
    if (this.silenceTimer) {
      clearTimeout(this.silenceTimer);
      this.silenceTimer = null;
    }
  }

  stopListening(): void {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
      this.cleanup();
    }
  }

  getIsListening(): boolean {
    return this.isListening;
  }

  setSilenceThreshold(milliseconds: number): void {
    this.silenceThreshold = milliseconds;
  }
}