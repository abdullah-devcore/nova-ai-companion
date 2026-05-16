"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Sliders, Volume2, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { VoiceSynthesizer } from "@/lib/voice-api";

interface VoiceSettingsProps {
  onLanguageChange?: (language: string) => void;
  onRateChange?: (rate: number) => void;
  onPitchChange?: (pitch: number) => void;
}

const LANGUAGES = [
  { code: "en-US", name: "English (US)" },
  { code: "en-GB", name: "English (UK)" },
  { code: "es-ES", name: "Spanish" },
  { code: "fr-FR", name: "French" },
  { code: "de-DE", name: "German" },
  { code: "it-IT", name: "Italian" },
  { code: "pt-BR", name: "Portuguese (Brazil)" },
  { code: "ja-JP", name: "Japanese" },
  { code: "zh-CN", name: "Chinese (Simplified)" },
  { code: "ko-KR", name: "Korean" },
];

export function VoiceSettings({ onLanguageChange, onRateChange, onPitchChange }: VoiceSettingsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [language, setLanguage] = useState("en-US");
  const [rate, setRate] = useState(1);
  const [pitch, setPitch] = useState(1);
  const [synthesizer, setSynthesizer] = useState<VoiceSynthesizer | null>(null);
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    const voiceSynthesizer = new VoiceSynthesizer();
    setSynthesizer(voiceSynthesizer);
    setIsSupported(voiceSynthesizer.isSupported_());
  }, []);

  const handleTestVoice = () => {
    if (!synthesizer) return;
    synthesizer.speak("This is a voice test with the current settings.", {
      language,
      rate,
      pitch,
    });
  };

  if (!isSupported) {
    return null;
  }

  return (
    <div className="relative">
      {/* Settings button */}
      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsOpen(!isOpen)}
          className="gap-2"
        >
          <Sliders className="w-4 h-4" />
          <span className="hidden sm:inline">Voice Settings</span>
        </Button>
      </motion.div>

      {/* Settings panel */}
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.95 }}
          className="absolute right-0 top-full mt-2 bg-card border border-border rounded-lg shadow-lg p-4 w-80 z-50"
        >
          {/* Language */}
          <div className="space-y-2 mb-4">
            <label className="text-sm font-semibold text-foreground">Language</label>
            <select
              value={language}
              onChange={(e) => {
                setLanguage(e.target.value);
                onLanguageChange?.(e.target.value);
              }}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground"
            >
              {LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.name}
                </option>
              ))}
            </select>
          </div>

          {/* Speech Rate */}
          <div className="space-y-2 mb-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-foreground">Speech Rate</label>
              <span className="text-xs text-muted-foreground">{rate.toFixed(1)}x</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="2"
              step="0.1"
              value={rate}
              onChange={(e) => {
                const newRate = parseFloat(e.target.value);
                setRate(newRate);
                onRateChange?.(newRate);
              }}
              className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer"
            />
            <div className="text-xs text-muted-foreground flex justify-between">
              <span>0.5x</span>
              <span>2x</span>
            </div>
          </div>

          {/* Pitch */}
          <div className="space-y-2 mb-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-foreground">Pitch</label>
              <span className="text-xs text-muted-foreground">{pitch.toFixed(1)}</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="2"
              step="0.1"
              value={pitch}
              onChange={(e) => {
                const newPitch = parseFloat(e.target.value);
                setPitch(newPitch);
                onPitchChange?.(newPitch);
              }}
              className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer"
            />
            <div className="text-xs text-muted-foreground flex justify-between">
              <span>Low</span>
              <span>High</span>
            </div>
          </div>

          {/* Test button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleTestVoice}
            className="w-full px-3 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
          >
            <Volume2 className="w-4 h-4" />
            Test Voice
          </motion.button>
        </motion.div>
      )}
    </div>
  );
}
