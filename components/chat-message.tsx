"use client";

import { motion } from "framer-motion";
import { User, Copy, Check } from "lucide-react";
import { AIOrb } from "./ai-orb";
import { useState, useCallback, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeKatex from "rehype-katex";
import remarkMath from "remark-math";
import "katex/dist/katex.min.css";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
}

function CodeBlock({ code, language }: { code: string; language?: string }) {
  const [copied, setCopied] = useState(false);
  const [highlighted, setHighlighted] = useState(code);

  useEffect(() => {
    // Dynamically import highlight.js only when needed
    if (language && typeof window !== "undefined") {
      import("highlight.js").then((hljs) => {
        try {
          const result = hljs.default.highlight(code, { language, ignoreIllegals: true });
          setHighlighted(result.value);
        } catch {
          try {
            const result = hljs.default.highlightAuto(code);
            setHighlighted(result.value);
          } catch {
            setHighlighted(code);
          }
        }
      }).catch(() => setHighlighted(code));
    }
  }, [code, language]);

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [code]);

  return (
    <div className="relative group my-3 rounded-lg overflow-hidden border border-border/50 bg-muted/20">
      <div className="flex items-center justify-between px-4 py-2 bg-muted/50 border-b border-border/30">
        <span className="text-xs text-muted-foreground font-mono font-semibold uppercase tracking-wide">{language || "code"}</span>
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? "Copied!" : "Copy"}
        </motion.button>
      </div>
      <pre className="overflow-x-auto p-4 text-sm text-foreground font-mono leading-relaxed">
        <code dangerouslySetInnerHTML={{ __html: highlighted }} />
      </pre>
    </div>
  );
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
            <div className="space-y-2 markdown-content">
              <ReactMarkdown
                remarkPlugins={[remarkGfm, remarkMath]}
                rehypePlugins={[rehypeKatex]}
                components={{
                  code({ inline, className, children, ...props }: any) {
                    const language = className?.replace(/language-/, "");
                    const code = String(children).replace(/\n$/, "");

                    if (inline) {
                      return (
                        <code className="bg-muted/40 px-1.5 py-0.5 rounded text-xs font-mono text-accent" {...props}>
                          {code}
                        </code>
                      );
                    }

                    return <CodeBlock code={code} language={language} />;
                  },
                  pre({ children }: any) {
                    return <>{children}</>;
                  },
                  h1: ({ children }: any) => <h1 className="text-xl font-bold mt-4 mb-2">{children}</h1>,
                  h2: ({ children }: any) => <h2 className="text-lg font-bold mt-3 mb-2">{children}</h2>,
                  h3: ({ children }: any) => <h3 className="text-base font-bold mt-2 mb-1">{children}</h3>,
                  strong: ({ children }: any) => <strong className="font-semibold text-foreground">{children}</strong>,
                  em: ({ children }: any) => <em className="italic text-muted-foreground">{children}</em>,
                  ul: ({ children }: any) => <ul className="list-disc list-inside space-y-1 my-2 ml-2">{children}</ul>,
                  ol: ({ children }: any) => <ol className="list-decimal list-inside space-y-1 my-2 ml-2">{children}</ol>,
                  li: ({ children }: any) => <li className="ml-2">{children}</li>,
                  blockquote: ({ children }: any) => (
                    <blockquote className="border-l-4 border-accent/50 pl-4 py-1 my-2 text-muted-foreground italic">
                      {children}
                    </blockquote>
                  ),
                  a: ({ href, children }: any) => (
                    <a href={href} className="text-accent hover:underline" target="_blank" rel="noopener noreferrer">
                      {children}
                    </a>
                  ),
                  table: ({ children }: any) => (
                    <div className="overflow-x-auto my-2 border border-border/30 rounded-lg">
                      <table className="w-full text-sm">{children}</table>
                    </div>
                  ),
                  th: ({ children }: any) => (
                    <th className="px-3 py-2 text-left font-semibold bg-muted/50 border-b border-border/30">
                      {children}
                    </th>
                  ),
                  td: ({ children }: any) => (
                    <td className="px-3 py-2 border-b border-border/30">{children}</td>
                  ),
                }}
              >
                {content}
              </ReactMarkdown>
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
