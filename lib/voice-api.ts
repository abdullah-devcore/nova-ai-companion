// Browser Web Speech API utilities for voice features
interface VoiceSettings {
  language: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
}

interface TranscriptResult {
  text: string;
  isFinal: boolean;
  confidence: number;
}

export class VoiceRecorder {
  private recognition: any;
  private isListening = false;
  private transcript = "";

  constructor(onResult?: (result: TranscriptResult) => void, onError?: (error: string) => void) {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.warn("[VoiceRecorder] Speech Recognition API not available");
      return;
    }

    this.recognition = new SpeechRecognition();

    this.recognition.onstart = () => {
      this.isListening = true;
      this.transcript = "";
    };

    this.recognition.onresult = (event: any) => {
      let interimTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        const confidence = event.results[i][0].confidence;
        const isFinal = event.results[i].isFinal;

        if (isFinal) {
          this.transcript += transcript;
        } else {
          interimTranscript += transcript;
        }

        if (onResult) {
          onResult({
            text: this.transcript + interimTranscript,
            isFinal,
            confidence,
          });
        }
      }
    };

    this.recognition.onerror = (event: any) => {
      console.error("[VoiceRecorder] Error:", event.error);
      if (onError) {
        onError(event.error);
      }
    };

    this.recognition.onend = () => {
      this.isListening = false;
    };
  }

  start(language = "en-US") {
    if (!this.recognition) return;
    this.recognition.language = language;
    this.recognition.start();
  }

  stop() {
    if (!this.recognition) return;
    this.recognition.stop();
  }

  abort() {
    if (!this.recognition) return;
    this.recognition.abort();
  }

  getTranscript() {
    return this.transcript;
  }

  isSupported() {
    return !!this.recognition;
  }
}

export class VoiceSynthesizer {
  private isSupported: boolean;

  constructor() {
    this.isSupported = !!window.speechSynthesis;
  }

  speak(text: string, options?: { rate?: number; pitch?: number; volume?: number; language?: string }) {
    if (!this.isSupported) {
      console.warn("[VoiceSynthesizer] Speech Synthesis API not available");
      return;
    }

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = options?.rate || 1;
    utterance.pitch = options?.pitch || 1;
    utterance.volume = options?.volume || 1;
    utterance.lang = options?.language || "en-US";

    window.speechSynthesis.speak(utterance);
  }

  stop() {
    if (this.isSupported) {
      window.speechSynthesis.cancel();
    }
  }

  pause() {
    if (this.isSupported && window.speechSynthesis.speaking) {
      window.speechSynthesis.pause();
    }
  }

  resume() {
    if (this.isSupported && window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }
  }

  isSpeaking() {
    return this.isSupported && window.speechSynthesis.speaking;
  }

  isSupported_() {
    return this.isSupported;
  }

  getVoices() {
    return this.isSupported ? window.speechSynthesis.getVoices() : [];
  }
}
