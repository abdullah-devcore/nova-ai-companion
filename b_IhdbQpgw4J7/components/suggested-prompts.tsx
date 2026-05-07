"use client";

import { motion } from "framer-motion";
import { Lightbulb, Code, PenTool, Brain, Zap, MessageCircle } from "lucide-react";

interface SuggestedPromptsProps {
  onSelect: (prompt: string) => void;
}

const suggestions = [
  {
    icon: Code,
    label: "Help me code",
    prompt: "Help me write a function that sorts an array of objects by multiple properties",
  },
  {
    icon: PenTool,
    label: "Write for me",
    prompt: "Write a compelling product description for a new AI-powered app",
  },
  {
    icon: Brain,
    label: "Explain concept",
    prompt: "Explain quantum computing in simple terms a beginner can understand",
  },
  {
    icon: Lightbulb,
    label: "Brainstorm ideas",
    prompt: "Help me brainstorm creative startup ideas in the AI space",
  },
  {
    icon: Zap,
    label: "Quick task",
    prompt: "Summarize the key benefits of adopting a healthy morning routine",
  },
  {
    icon: MessageCircle,
    label: "Just chat",
    prompt: "Tell me something interesting I probably don't know",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.4,
      ease: "easeOut",
    },
  },
};

export function SuggestedPrompts({ onSelect }: SuggestedPromptsProps) {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-2 md:grid-cols-3 gap-3"
    >
      {suggestions.map((suggestion) => (
        <motion.button
          key={suggestion.label}
          variants={itemVariants}
          whileHover={{ 
            scale: 1.02, 
            y: -2,
            transition: { duration: 0.2 } 
          }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onSelect(suggestion.prompt)}
          className="
            group relative glass rounded-xl p-4 text-left
            hover:border-primary/30 transition-colors
            cursor-pointer overflow-hidden
          "
        >
          {/* Hover gradient effect */}
          <motion.div
            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
            style={{
              background: "linear-gradient(135deg, oklch(0.65 0.2 250 / 0.1), oklch(0.6 0.22 200 / 0.1))",
            }}
          />
          
          <div className="relative flex items-start gap-3">
            <div className="shrink-0 p-2 rounded-lg bg-secondary/50 group-hover:bg-primary/20 transition-colors">
              <suggestion.icon className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                {suggestion.label}
              </p>
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                {suggestion.prompt}
              </p>
            </div>
          </div>
        </motion.button>
      ))}
    </motion.div>
  );
}
