"use client";

import { motion } from "framer-motion";
import { User, Copy, Check } from "lucide-react";
import { AIOrb } from "./ai-orb";
import { useState, useCallback } from "react";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
}

function CodeBlock({ code, language }: { code: string; language?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [code]);

  return (
    <div className="relative group my-2 rounded-xl overflow-hidden border border-border/50">
      <div className="flex items-center justify-between px-4 py-2 bg-muted/50 border-b border-border/50">
        <span className="text-xs text-muted-foreground font-mono">{language || "code"}</span>
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? "Copied!" : "Copy"}
        </motion.button>
      </div>
      <pre className="overflow-x-auto p-4 text-sm bg-muted/20 text-foreground font-mono leading-relaxed">
        <code>{code}</code>
      </pre>
    </div>
  );
}

function renderContent(content: string) {
  const parts = content.split(/(```[\s\S]*?```)/g);

  return parts.map((part, i) => {
    if (part.startsWith("```") && part.endsWith("```")) {
      const lines = part.slice(3, -3).split("\n");
      const language = lines[0].trim();
      const code = lines.slice(1).join("\n");
      return <CodeBlock key={i} code={code} language={language || undefined} />;
    }

    return (
      <span key={i}>
        {part.split("\n").map((line, j) => {
          const boldProcessed = line.replace(/\*\*(.*?)\*\*/g, (_, text) => `<strong>${text}</strong>`);
          const inlineCodeProcessed = boldProcessed.replace(/`([^`]+)`/g, (_, text) => `<code class="bg-muted/40 px-1 py-0.5 rounded text-sm font-mono">${text}</code>`);

          return (
            <span key={j}>
              {j > 0 && <br />}
              <span dangerouslySetInnerHTML={{ __html: inlineCodeProcessed }} />
            </span>
          );
        })}
      </span>
    );
  });
}

export function ChatMessage({ role, content, isStreaming = false }: ChatMessageProps) {
  const isAssistant = role === "assistant";

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className={`flex gap-3 ${isAssistant ? "" : "flex-row-reverse"}`}
    >
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.25, delay: 0.05 }}
        className="shrink-0 self-start mt-1"
      >
        {isAssistant ? (
          <AIOrb size="sm" isThinking={isStreaming} />
        ) : (
          <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center">
            <User className="w-4 h-4 text-primary" />
          </div>
        )}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: isAssistant ? -12 : 12, scale: 0.97 }}
        animate={{ opacity: 1, x: 0, scale: 1 }}
        transition={{ duration: 0.3, delay: 0.08, ease: "easeOut" }}
        className={`flex-1 max-w-[88%] ${isAssistant ? "" : "flex justify-end"}`}
      >
        <div
          className={`
            px-4 py-3 rounded-2xl text-sm leading-relaxed
            ${isAssistant
              ? "glass text-foreground rounded-tl-sm"
              : "text-primary-foreground rounded-tr-sm"
            }
          `}
          style={!isAssistant ? { background: "linear-gradient(135deg, oklch(0.65 0.2 250 / 0.9), oklch(0.6 0.22 200 / 0.9))" } : undefined}
        >
          {isAssistant ? (
            <div className="space-y-1">
              {renderContent(content)}
              {isStreaming && (
                <motion.span
                  animate={{ opacity: [0, 1, 0] }}
                  transition={{ duration: 0.7, repeat: Infinity }}
                  className="inline-block ml-0.5 w-0.5 h-4 bg-current align-middle"
                />
              )}
            </div>
          ) : (
            <p className="whitespace-pre-wrap">{content}</p>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
