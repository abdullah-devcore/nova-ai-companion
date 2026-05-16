"use client";

import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, Loader2, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { VoiceRecorder, VoiceSynthesizer } from "@/lib/voice-api";

interface VoiceInputProps {
  onTranscript: (text: string) => void;
  isListening?: boolean;
  language?: string;
  disabled?: boolean;
}

export function VoiceInput({
  onTranscript,
  isListening: externalIsListening,
  language = "en-US",
  disabled = false,
}: VoiceInputProps) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [recorder, setRecorder] = useState<VoiceRecorder | null>(null);
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    const voiceRecorder = new VoiceRecorder(
      (result) => {
        setTranscript(result.isFinal ? result.text : "");
        setInterimTranscript(result.isFinal ? "" : result.text.split("").pop() || "");
        if (result.isFinal) {
          onTranscript(result.text);
        }
      },
      (err) => {
        setError(err);
        setIsListening(false);
      }
    );

    setRecorder(voiceRecorder);
    setIsSupported(voiceRecorder.isSupported());

    return () => {
      voiceRecorder.stop();
    };
  }, [onTranscript]);

  const toggleListening = useCallback(() => {
    if (!recorder || !isSupported) return;

    if (isListening) {
      recorder.stop();
      setIsListening(false);
    } else {
      setError(null);
      setTranscript("");
      setInterimTranscript("");
      recorder.start(language);
      setIsListening(true);
    }
  }, [isListening, recorder, isSupported, language]);

  if (!isSupported) {
    return null;
  }

  return (
    <div className="relative">
      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={toggleListening}
          disabled={disabled || !isSupported}
          className={`shrink-0 rounded-xl h-9 w-9 ${
            isListening ? "bg-red-500/20 text-red-600 hover:bg-red-500/30" : "text-muted-foreground hover:text-foreground hover:bg-secondary"
          }`}
          title={isListening ? "Stop recording" : "Start recording"}
        >
          {isListening ? <Mic className="w-4 h-4 animate-pulse" /> : <MicOff className="w-4 h-4" />}
        </Button>
      </motion.div>

      {/* Transcript display */}
      <AnimatePresence>
        {isListening && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-secondary rounded-lg text-xs text-foreground whitespace-nowrap max-w-xs truncate"
          >
            {transcript || interimTranscript || "Listening..."}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error message */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-destructive/20 text-destructive rounded-lg text-xs"
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Voice output component for text-to-speech
interface VoiceOutputProps {
  text: string;
  isPlaying?: boolean;
  onPlayPause?: (isPlaying: boolean) => void;
  language?: string;
}

export function VoiceOutput({ text, isPlaying, onPlayPause, language = "en-US" }: VoiceOutputProps) {
  const [localIsPlaying, setLocalIsPlaying] = useState(false);
  const [synthesizer, setSynthesizer] = useState<VoiceSynthesizer | null>(null);
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    const voiceSynthesizer = new VoiceSynthesizer();
    setSynthesizer(voiceSynthesizer);
    setIsSupported(voiceSynthesizer.isSupported_());
  }, []);

  const handleTogglePlayback = useCallback(() => {
    if (!synthesizer) return;

    if (localIsPlaying) {
      synthesizer.stop();
      setLocalIsPlaying(false);
      onPlayPause?.(false);
    } else {
      synthesizer.speak(text, { language, rate: 1, pitch: 1, volume: 1 });
      setLocalIsPlaying(true);
      onPlayPause?.(true);
    }
  }, [localIsPlaying, synthesizer, text, language, onPlayPause]);

  if (!isSupported || !text) {
    return null;
  }

  return (
    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={handleTogglePlayback}
        className={`shrink-0 rounded-xl h-9 w-9 ${
          localIsPlaying ? "bg-blue-500/20 text-blue-600 hover:bg-blue-500/30" : "text-muted-foreground hover:text-foreground hover:bg-secondary"
        }`}
        title={localIsPlaying ? "Pause audio" : "Play audio"}
      >
        {localIsPlaying ? <Volume2 className="w-4 h-4 animate-pulse" /> : <VolumeX className="w-4 h-4" />}
      </Button>
    </motion.div>
  );
}
