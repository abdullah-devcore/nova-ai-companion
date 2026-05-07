"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Mic, MicOff, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function ChatInput({ onSend, disabled = false, placeholder = "Message Nova..." }: ChatInputProps) {
  const [message, setMessage] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
    }
  }, [message]);
  
  const handleSubmit = () => {
    if (message.trim() && !disabled) {
      onSend(message.trim());
      setMessage("");
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };
  
  const toggleVoice = () => {
    setIsListening(!isListening);
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative"
    >
      {/* Gradient border effect */}
      <AnimatePresence>
        {isFocused && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute -inset-[1px] rounded-2xl pointer-events-none"
            style={{
              background: "linear-gradient(135deg, oklch(0.65 0.2 250 / 0.5), oklch(0.6 0.22 200 / 0.5), oklch(0.55 0.18 180 / 0.5))",
            }}
          />
        )}
      </AnimatePresence>
      
      <div className="relative glass-strong rounded-2xl overflow-hidden">
        <div className="flex items-end gap-2 p-3">
          {/* Sparkle icon */}
          <motion.div
            whileHover={{ scale: 1.1, rotate: 15 }}
            whileTap={{ scale: 0.95 }}
            className="shrink-0 mb-1"
          >
            <Sparkles className="w-5 h-5 text-primary" />
          </motion.div>
          
          {/* Textarea */}
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={placeholder}
            disabled={disabled}
            rows={1}
            className="
              flex-1 bg-transparent border-none outline-none resize-none
              text-foreground placeholder:text-muted-foreground
              text-sm leading-relaxed min-h-[24px] max-h-[150px]
              disabled:opacity-50 disabled:cursor-not-allowed
            "
          />
          
          {/* Voice button */}
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={toggleVoice}
              className={`
                shrink-0 rounded-xl h-9 w-9 transition-colors
                ${isListening 
                  ? "bg-destructive/20 text-destructive hover:bg-destructive/30" 
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                }
              `}
            >
              <AnimatePresence mode="wait">
                {isListening ? (
                  <motion.div
                    key="mic-off"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                  >
                    <MicOff className="w-4 h-4" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="mic"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                  >
                    <Mic className="w-4 h-4" />
                  </motion.div>
                )}
              </AnimatePresence>
            </Button>
          </motion.div>
          
          {/* Send button */}
          <motion.div 
            whileHover={{ scale: 1.05 }} 
            whileTap={{ scale: 0.95 }}
            animate={{ opacity: message.trim() ? 1 : 0.5 }}
          >
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={!message.trim() || disabled}
              className="
                shrink-0 rounded-xl h-9 w-9 p-0
                bg-primary hover:bg-primary/90
                disabled:opacity-30 disabled:cursor-not-allowed
              "
            >
              <Send className="w-4 h-4" />
            </Button>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
