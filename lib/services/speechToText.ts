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
  private silenceThreshold = 2500; // 2.5 seconds of silence

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
          } else {
            interimTranscript += transcript;
          }
        }

        // If user is speaking, clear the silence timer
        if (interimTranscript.trim() || finalTranscript.trim()) {
          if (this.silenceTimer) {
            clearTimeout(this.silenceTimer);
            this.silenceTimer = null;
          }
          hasSpoken = true;
        }

        // If we have final transcript, start silence detection
        if (finalTranscript.trim() && hasSpoken) {
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
        
        // Start silence detection immediately if no speech detected
        this.startSilenceDetection(onSilence);
      } catch (error) {
        this.cleanup();
        reject(error);
      }
    });
  }

  private startSilenceDetection(onSilence?: () => void): void {
    // Clear any existing timer
    if (this.silenceTimer) {
      clearTimeout(this.silenceTimer);
    }

    // Start new silence timer
    this.silenceTimer = setTimeout(() => {
      if (this.isListening) {
        this.stopListening();
        if (onSilence) {
          onSilence();
        }
      }
    }, this.silenceThreshold);
  }

  private cleanup(): void {
    this.isListening = false;
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