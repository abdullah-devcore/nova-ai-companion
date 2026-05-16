"use client";

import { useState, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import { Mic, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SpeechToTextService } from "@/lib/voice/speech-to-text";

interface VoiceInputButtonProps {
  onTranscript: (text: string) => void;
  disabled?: boolean;
}

export function VoiceInputButton({ onTranscript, disabled = false }: VoiceInputButtonProps) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [service, setService] = useState<SpeechToTextService | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stt = new SpeechToTextService();
      setService(stt);

      if (!stt.isAvailable()) {
        setError("Speech Recognition not available");
      }
    }
  }, []);

  const handleToggle = useCallback(() => {
    if (!service || !service.isAvailable() || disabled) return;

    if (isListening) {
      service.stop();
      setIsListening(false);
      if (transcript.trim()) {
        onTranscript(transcript);
      }
      setTranscript("");
    } else {
      setError(null);
      setTranscript("");
      service.start(
        { language: "en-US", continuous: true, interimResults: true },
        (result) => {
          setTranscript(result.transcript);
        },
        (err) => {
          setError(err);
          setIsListening(false);
        },
        () => {
          setIsListening(false);
        }
      );
      setIsListening(true);
    }
  }, [service, isListening, transcript, onTranscript, disabled]);

  if (!service || !service.isAvailable()) {
    return null;
  }

  return (
    <div className="relative">
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleToggle}
        disabled={disabled}
        className={`
          p-2 rounded-lg transition-colors
          ${
            isListening
              ? "bg-red-500/20 text-red-500 hover:bg-red-500/30"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          }
          disabled:opacity-50 disabled:cursor-not-allowed
        `}
        title={isListening ? "Stop recording" : "Start voice input"}
      >
        {isListening ? (
          <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 1, repeat: Infinity }}>
            <Square className="w-5 h-5 fill-current" />
          </motion.div>
        ) : (
          <Mic className="w-5 h-5" />
        )}
      </motion.button>

      {/* Transcript Preview */}
      {transcript && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute bottom-full mb-2 right-0 p-2 rounded-lg bg-muted border border-border text-sm max-w-xs whitespace-normal"
        >
          <p className="text-foreground">{transcript}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {isListening ? "Listening..." : "Click to send"}
          </p>
        </motion.div>
      )}

      {/* Error Message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute bottom-full mb-2 right-0 p-2 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-500"
        >
          {error}
        </motion.div>
      )}
    </div>
  );
}
