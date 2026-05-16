"use client";

import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, MessageSquare, Clock, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface SearchResult {
  type: "chat" | "message";
  id: string;
  title?: string;
  content?: string;
  preview?: string;
  createdAt?: string;
}

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectChat?: (chatId: string) => void;
}

export function SearchModal({ isOpen, onClose, onSelectChat }: SearchModalProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const handleSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/search/chats?q=${encodeURIComponent(searchQuery)}`);
      const data = await response.json();

      const formattedResults: SearchResult[] = [
        ...(data.results.chats || []).map((chat: any) => ({
          type: "chat" as const,
          id: chat.id,
          title: chat.title,
          createdAt: chat.created_at,
        })),
        ...(data.results.messages || []).map((msg: any) => ({
          type: "message" as const,
          id: msg.id,
          title: msg.chat_sessions?.title || "Unknown",
          content: msg.content,
          preview: msg.content.substring(0, 100),
        })),
      ];

      setResults(formattedResults);
      setSelectedIndex(0);
    } catch (error) {
      console.error("[SearchModal] Error:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      handleSearch(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [query, handleSearch]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      onClose();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (results[selectedIndex]) {
        const result = results[selectedIndex];
        if (result.type === "chat") {
          onSelectChat?.(result.id);
          onClose();
        }
      }
    }
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center pt-20"
    >
      <motion.div
        initial={{ scale: 0.95, y: -20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: -20 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl mx-4 rounded-xl bg-card border border-border shadow-lg overflow-hidden"
      >
        {/* Search Header */}
        <div className="flex items-center gap-3 p-4 border-b border-border">
          <Search className="w-5 h-5 text-muted-foreground" />
          <input
            autoFocus
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search conversations and messages... (Cmd+K)"
            className="flex-1 bg-transparent outline-none text-foreground placeholder:text-muted-foreground"
          />
          <motion.button
            whileHover={{ scale: 1.1 }}
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="w-5 h-5" />
          </motion.button>
        </div>

        {/* Results */}
        <div className="max-h-96 overflow-y-auto">
          {isLoading && (
            <div className="p-8 text-center text-muted-foreground">
              <motion.div
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                Searching...
              </motion.div>
            </div>
          )}

          {!isLoading && results.length === 0 && query.length > 0 && (
            <div className="p-8 text-center text-muted-foreground">
              No results found for "{query}"
            </div>
          )}

          {!isLoading && results.length > 0 && (
            <div className="divide-y divide-border">
              {results.map((result, index) => (
                <motion.button
                  key={`${result.type}-${result.id}`}
                  onClick={() => {
                    if (result.type === "chat") {
                      onSelectChat?.(result.id);
                      onClose();
                    }
                  }}
                  className={`
                    w-full text-left p-4 transition-colors
                    ${
                      selectedIndex === index
                        ? "bg-accent/10 border-l-4 border-accent"
                        : "hover:bg-muted/50"
                    }
                  `}
                >
                  <div className="flex items-start gap-3">
                    {result.type === "chat" ? (
                      <MessageSquare className="w-4 h-4 mt-1 text-accent" />
                    ) : (
                      <Clock className="w-4 h-4 mt-1 text-muted-foreground" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {result.title || "Untitled"}
                      </p>
                      {result.preview && (
                        <p className="text-xs text-muted-foreground truncate mt-1">
                          {result.preview}
                        </p>
                      )}
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-border p-3 flex items-center justify-between text-xs text-muted-foreground bg-muted/20">
          <div className="flex gap-4">
            <span>↑↓ Navigate</span>
            <span>Enter Select</span>
            <span>Esc Close</span>
          </div>
          <span>{results.length} results</span>
        </div>
      </motion.div>
    </motion.div>
  );
}
