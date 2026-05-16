"use client";

import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, Volume2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TextToSpeechService } from "@/lib/voice/text-to-speech";

interface AudioPlayerProps {
  text: string;
  messageId: string;
  onClose?: () => void;
  autoPlay?: boolean;
}

export function AudioPlayer({ text, messageId, onClose, autoPlay = false }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [rate, setRate] = useState(1);
  const [pitch, setPitch] = useState(1);
  const [volume, setVolume] = useState(1);
  const [service, setService] = useState<TextToSpeechService | null>(null);
  const [voices, setVoices] = useState<any[]>([]);
  const [selectedVoice, setSelectedVoice] = useState(0);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const tts = new TextToSpeechService();
      setService(tts);
      setVoices(tts.getVoices());

      if (autoPlay && tts.isAvailable()) {
        handlePlay();
      }
    }
  }, []);

  const handlePlay = useCallback(() => {
    if (!service || !service.isAvailable()) return;

    if (isPlaying && !isPaused) {
      service.pause();
      setIsPaused(true);
    } else if (isPaused) {
      service.resume();
      setIsPaused(false);
    } else {
      service.speak(
        text,
        { rate, pitch, volume, voice: selectedVoice },
        () => setIsPlaying(true),
        () => {
          setIsPlaying(false);
          setIsPaused(false);
        }
      );
      setIsPlaying(true);
    }
  }, [service, text, rate, pitch, volume, selectedVoice, isPlaying, isPaused]);

  const handleStop = useCallback(() => {
    service?.stop();
    setIsPlaying(false);
    setIsPaused(false);
  }, [service]);

  if (!service || !service.isAvailable()) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-3 rounded-lg bg-muted/50 border border-border space-y-3"
    >
      {/* Player Controls */}
      <div className="flex items-center gap-2">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={handlePlay}
          className="p-2 rounded-lg bg-accent text-white hover:bg-accent/90"
        >
          {isPlaying && !isPaused ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleStop}
          className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
        >
          <X className="w-4 h-4" />
        </motion.button>

        <div className="flex-1 flex items-center gap-2 text-xs">
          <Volume2 className="w-3.5 h-3.5 text-muted-foreground" />
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            className="w-16 h-1"
          />
        </div>

        {onClose && (
          <motion.button
            whileHover={{ scale: 1.1 }}
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </motion.button>
        )}
      </div>

      {/* Playback Controls */}
      <div className="grid grid-cols-3 gap-2 text-xs">
        <div>
          <label className="text-muted-foreground block mb-1">Speed</label>
          <select
            value={rate}
            onChange={(e) => setRate(parseFloat(e.target.value))}
            className="w-full px-2 py-1 rounded bg-background border border-border text-foreground"
          >
            <option value="0.5">0.5x</option>
            <option value="1">1x</option>
            <option value="1.5">1.5x</option>
            <option value="2">2x</option>
          </select>
        </div>

        <div>
          <label className="text-muted-foreground block mb-1">Pitch</label>
          <select
            value={pitch}
            onChange={(e) => setPitch(parseFloat(e.target.value))}
            className="w-full px-2 py-1 rounded bg-background border border-border text-foreground"
          >
            <option value="0.5">Low</option>
            <option value="1">Normal</option>
            <option value="1.5">High</option>
          </select>
        </div>

        <div>
          <label className="text-muted-foreground block mb-1">Voice</label>
          <select
            value={selectedVoice}
            onChange={(e) => setSelectedVoice(parseInt(e.target.value))}
            className="w-full px-2 py-1 rounded bg-background border border-border text-foreground"
          >
            {voices.slice(0, 5).map((voice, idx) => (
              <option key={idx} value={idx}>
                {voice.name.split(" ").slice(-1)[0]}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Status */}
      {isPlaying && (
        <motion.p
          animate={{ opacity: [0.5, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="text-xs text-accent text-center"
        >
          {isPaused ? "Paused" : "Playing..."}
        </motion.p>
      )}
    </motion.div>
  );
}
