"use client";

import { motion } from "framer-motion";
import { User } from "lucide-react";
import { AIOrb } from "./ai-orb";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
}

export function ChatMessage({ role, content, isStreaming = false }: ChatMessageProps) {
  const isAssistant = role === "assistant";
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className={`flex gap-4 ${isAssistant ? "" : "flex-row-reverse"}`}
    >
      {/* Avatar */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="shrink-0"
      >
        {isAssistant ? (
          <AIOrb size="sm" isThinking={isStreaming} />
        ) : (
          <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
            <User className="w-4 h-4 text-muted-foreground" />
          </div>
        )}
      </motion.div>
      
      {/* Message content */}
      <motion.div
        initial={{ opacity: 0, x: isAssistant ? -10 : 10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3, delay: 0.15 }}
        className={`flex-1 max-w-[85%] ${isAssistant ? "" : "flex justify-end"}`}
      >
        <div
          className={`
            px-4 py-3 rounded-2xl
            ${isAssistant 
              ? "glass text-foreground" 
              : "bg-primary text-primary-foreground"
            }
          `}
        >
          <p className="text-sm leading-relaxed whitespace-pre-wrap">
            {content}
            {isStreaming && (
              <motion.span
                animate={{ opacity: [0, 1, 0] }}
                transition={{ duration: 0.8, repeat: Infinity }}
                className="inline-block ml-1 w-2 h-4 bg-current"
              />
            )}
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}
