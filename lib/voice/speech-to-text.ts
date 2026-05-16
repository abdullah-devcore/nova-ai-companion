/**
 * Speech-to-Text using Web Speech API
 * Browser-native voice recognition
 */

export interface SpeechToTextOptions {
  language?: string;
  continuous?: boolean;
  interimResults?: boolean;
  maxAlternatives?: number;
}

export interface SpeechResult {
  transcript: string;
  isFinal: boolean;
  confidence: number;
}

declare global {
  interface Window {
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
  }
}

export class SpeechToTextService {
  private recognition: any;
  private isSupported: boolean;
  private isListening: boolean = false;

  constructor() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    this.isSupported = !!SpeechRecognition;
    
    if (this.isSupported) {
      this.recognition = new SpeechRecognition();
    }
  }

  isAvailable(): boolean {
    return this.isSupported;
  }

  start(
    options: SpeechToTextOptions = {},
    onResult: (result: SpeechResult) => void,
    onError: (error: string) => void,
    onEnd: () => void
  ): void {
    if (!this.isSupported) {
      onError("Speech Recognition not supported in this browser");
      return;
    }

    if (this.isListening) {
      console.warn("[SpeechToText] Already listening");
      return;
    }

    const {
      language = "en-US",
      continuous = false,
      interimResults = true,
      maxAlternatives = 1,
    } = options;

    this.recognition.language = language;
    this.recognition.continuous = continuous;
    this.recognition.interimResults = interimResults;
    this.recognition.maxAlternatives = maxAlternatives;

    this.recognition.onstart = () => {
      console.log("[SpeechToText] Recognition started");
      this.isListening = true;
    };

    this.recognition.onresult = (event: any) => {
      let interimTranscript = "";
      let finalTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;

        if (event.results[i].isFinal) {
          finalTranscript += transcript + " ";
        } else {
          interimTranscript += transcript;
        }
      }

      if (finalTranscript) {
        onResult({
          transcript: finalTranscript.trim(),
          isFinal: true,
          confidence: event.results[event.results.length - 1][0].confidence,
        });
      } else if (interimTranscript) {
        onResult({
          transcript: interimTranscript,
          isFinal: false,
          confidence: 0.5,
        });
      }
    };

    this.recognition.onerror = (event: any) => {
      console.error("[SpeechToText] Error:", event.error);
      onError(event.error || "Speech recognition error");
    };

    this.recognition.onend = () => {
      console.log("[SpeechToText] Recognition ended");
      this.isListening = false;
      onEnd();
    };

    try {
      this.recognition.start();
    } catch (error) {
      console.error("[SpeechToText] Start error:", error);
      onError("Failed to start speech recognition");
    }
  }

  stop(): void {
    if (this.isListening) {
      this.recognition?.stop();
      this.isListening = false;
    }
  }

  abort(): void {
    this.recognition?.abort();
    this.isListening = false;
  }
}
