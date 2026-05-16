/**
 * Text-to-Speech using Web Audio API
 * Browser-native voice synthesis
 */

export interface TextToSpeechOptions {
  language?: string;
  voice?: number;
  rate?: number;
  pitch?: number;
  volume?: number;
}

export interface VoiceInfo {
  name: string;
  language: string;
  isDefault: boolean;
  isLocal: boolean;
}

export class TextToSpeechService {
  private synthesis: SpeechSynthesis;
  private isSupported: boolean;
  private currentUtterance: SpeechSynthesisUtterance | null = null;

  constructor() {
    this.synthesis = window.speechSynthesis;
    this.isSupported = !!this.synthesis;
  }

  isAvailable(): boolean {
    return this.isSupported;
  }

  getVoices(): VoiceInfo[] {
    if (!this.isSupported) return [];

    return this.synthesis.getVoices().map((voice, index) => ({
      name: voice.name,
      language: voice.lang,
      isDefault: voice.default,
      isLocal: voice.localService,
    }));
  }

  speak(
    text: string,
    options: TextToSpeechOptions = {},
    onStart?: () => void,
    onEnd?: () => void,
    onError?: (error: string) => void
  ): void {
    if (!this.isSupported) {
      onError?.("Text-to-Speech not supported");
      return;
    }

    // Cancel any ongoing speech
    this.stop();

    const {
      language = "en-US",
      voice = 0,
      rate = 1,
      pitch = 1,
      volume = 1,
    } = options;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language;
    utterance.rate = Math.max(0.5, Math.min(2, rate)); // 0.5 - 2
    utterance.pitch = Math.max(0, Math.min(2, pitch)); // 0 - 2
    utterance.volume = Math.max(0, Math.min(1, volume)); // 0 - 1

    const voices = this.synthesis.getVoices();
    if (voices[voice]) {
      utterance.voice = voices[voice];
    }

    utterance.onstart = () => {
      console.log("[TextToSpeech] Started speaking");
      onStart?.();
    };

    utterance.onend = () => {
      console.log("[TextToSpeech] Finished speaking");
      this.currentUtterance = null;
      onEnd?.();
    };

    utterance.onerror = (event: any) => {
      console.error("[TextToSpeech] Error:", event.error);
      onError?.(event.error || "Text-to-speech error");
    };

    this.currentUtterance = utterance;

    try {
      this.synthesis.speak(utterance);
    } catch (error) {
      console.error("[TextToSpeech] Speak error:", error);
      onError?.(error instanceof Error ? error.message : "Failed to speak");
    }
  }

  pause(): void {
    if (this.synthesis.speaking && !this.synthesis.paused) {
      this.synthesis.pause();
    }
  }

  resume(): void {
    if (this.synthesis.paused) {
      this.synthesis.resume();
    }
  }

  stop(): void {
    this.synthesis.cancel();
    this.currentUtterance = null;
  }

  isPlaying(): boolean {
    return this.synthesis.speaking;
  }

  isPaused(): boolean {
    return this.synthesis.paused;
  }
}
