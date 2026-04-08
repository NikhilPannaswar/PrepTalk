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
  private silenceThreshold = 2500; // 2.5 seconds of silence as requested
  private isUserSpeaking = false;
  private lastSpeechTime: number = 0;

  constructor() {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      
      if (SpeechRecognition) {
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = false; // Changed to false for better control
        this.recognition.interimResults = true; // Get partial results
        this.recognition.lang = 'en-US';
        (this.recognition as any).maxAlternatives = 1;
      }
    }
  }

  isSupported(): boolean {
    return this.recognition !== null;
  }

  startListening(onSilence?: () => void): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!this.recognition) {
        reject(new Error('Speech recognition not supported. Please use Chrome or Edge browser.'));
        return;
      }

      if (this.isListening) {
        console.log('Already listening, stopping previous session...');
        this.stopListening();
        // Wait a bit before starting new session
        setTimeout(() => this.startListening(onSilence).then(resolve).catch(reject), 500);
        return;
      }

      this.isListening = true;
      let finalTranscript = '';
      let hasSpoken = false;
      let silenceStartTime: number | null = null;

      // Clear any existing silence timer
      if (this.silenceTimer) {
        clearTimeout(this.silenceTimer);
        this.silenceTimer = null;
      }

      console.log('🎤 Starting speech recognition...');

      this.recognition.onresult = (event: SpeechRecognitionEvent) => {
        let interimTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
            hasSpoken = true;
            this.lastSpeechTime = Date.now();
            this.isUserSpeaking = false;
            console.log('Final transcript:', transcript);
          } else {
            interimTranscript += transcript;
            this.isUserSpeaking = true;
            this.lastSpeechTime = Date.now();
            console.log('Interim transcript:', transcript);
          }
        }

        // Clear silence timer when user speaks
        if (interimTranscript.trim() || finalTranscript.trim()) {
          if (this.silenceTimer) {
            clearTimeout(this.silenceTimer);
            this.silenceTimer = null;
          }
          hasSpoken = true;
        }

        // If we have final results, stop and return immediately
        if (finalTranscript.trim() && event.results[event.results.length - 1]?.isFinal) {
          this.cleanup();
          resolve(finalTranscript.trim());
          return;
        }
      };

      this.recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error('Speech recognition error:', event.error);
        
        // Handle different error types
        if (event.error === 'not-allowed') {
          this.cleanup();
          reject(new Error('Microphone access denied. Please allow microphone permission.'));
        } else if (event.error === 'no-speech') {
          // No speech detected - trigger silence if callback exists
          if (onSilence && !hasSpoken) {
            this.cleanup();
            onSilence();
          } else {
            // Restart listening if no callback
            setTimeout(() => {
              if (this.isListening) {
                try {
                  this.recognition?.start();
                } catch (e) {
                  console.log('Could not restart recognition');
                }
              }
            }, 100);
          }
        } else {
          this.cleanup();
          reject(new Error(`Speech recognition error: ${event.error}`));
        }
      };

      this.recognition.onend = () => {
        console.log('Speech recognition ended');
        if (this.isListening) {
          if (finalTranscript.trim()) {
            this.cleanup();
            resolve(finalTranscript.trim());
          } else if (!hasSpoken) {
            // No speech detected, restart or trigger silence
            if (onSilence) {
              this.cleanup();
              onSilence();
            } else {
              // Restart recognition
              setTimeout(() => {
                if (this.isListening) {
                  try {
                    this.recognition?.start();
                  } catch (e) {
                    console.log('Could not restart recognition');
                  }
                }
              }, 100);
            }
          } else {
            // Had interim results but no final - restart
            setTimeout(() => {
              if (this.isListening) {
                try {
                  this.recognition?.start();
                } catch (e) {
                  console.log('Could not restart recognition');
                }
              }
            }, 100);
          }
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