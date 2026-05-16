"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RotateCw, Edit2, Share2, Copy, ThumbsUp, ThumbsDown } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ResponseActionsProps {
  messageId: string;
  content: string;
  onRegenerateStart?: () => void;
  onEditStart?: () => void;
  onShare?: () => void;
}

export function ResponseActions({
  messageId,
  content,
  onRegenerateStart,
  onEditStart,
  onShare,
}: ResponseActionsProps) {
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState<"positive" | "negative" | null>(null);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Copy failed:", error);
    }
  };

  const handleFeedback = async (type: "positive" | "negative") => {
    setFeedback(type);
    // Send feedback to backend for model training
    try {
      await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageId, type }),
      });
    } catch (error) {
      console.error("Feedback failed:", error);
    }

    setTimeout(() => setFeedback(null), 2000);
  };

  const actions = [
    {
      icon: RotateCw,
      label: "Regenerate",
      onClick: onRegenerateStart,
      className: "hover:text-blue-500",
    },
    {
      icon: Copy,
      label: copied ? "Copied!" : "Copy",
      onClick: handleCopy,
      className: copied ? "text-green-500" : "hover:text-green-500",
    },
    {
      icon: Share2,
      label: "Share",
      onClick: onShare,
      className: "hover:text-purple-500",
    },
    {
      icon: Edit2,
      label: "Edit",
      onClick: onEditStart,
      className: "hover:text-orange-500",
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-1 flex-wrap"
    >
      {/* Main Actions */}
      {actions.map((action) => (
        <motion.button
          key={action.label}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={action.onClick}
          disabled={!action.onClick}
          className={`
            p-1.5 rounded transition-colors text-muted-foreground
            ${action.className}
            disabled:opacity-50 disabled:cursor-not-allowed
          `}
          title={action.label}
        >
          <action.icon className="w-4 h-4" />
        </motion.button>
      ))}

      {/* Feedback Actions */}
      <div className="flex items-center gap-0.5 pl-2 border-l border-border/30">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => handleFeedback("positive")}
          className={`
            p-1.5 rounded transition-colors
            ${feedback === "positive" ? "text-green-500 bg-green-500/10" : "text-muted-foreground hover:text-green-500"}
          `}
          title="Helpful"
        >
          <ThumbsUp className="w-4 h-4" />
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => handleFeedback("negative")}
          className={`
            p-1.5 rounded transition-colors
            ${feedback === "negative" ? "text-red-500 bg-red-500/10" : "text-muted-foreground hover:text-red-500"}
          `}
          title="Not helpful"
        >
          <ThumbsDown className="w-4 h-4" />
        </motion.button>
      </div>
    </motion.div>
  );
}
