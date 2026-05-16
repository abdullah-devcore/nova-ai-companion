"use client";

import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, MessageSquare, FileText, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

interface SearchResult {
  id: string;
  type: "chat" | "message" | "file";
  title?: string;
  preview?: string;
  chatId?: string;
  createdAt?: string;
}

interface SearchResults {
  chats: SearchResult[];
  messages: SearchResult[];
  files: SearchResult[];
}

export function SearchCommand() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults>({ chats: [], messages: [], files: [] });
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const router = useRouter();

  // Register Cmd+K keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen(true);
      }
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Search with debounce
  useEffect(() => {
    if (!query || query.length < 2) {
      setResults({ chats: [], messages: [], files: [] });
      return;
    }

    setIsLoading(true);
    const timer = setTimeout(async () => {
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(query)}&limit=10`);
        const data = await response.json();
        if (data.results) {
          setResults(data.results);
        }
      } catch (error) {
        console.error("[SearchCommand] Search error:", error);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const allResults = [...results.chats, ...results.messages, ...results.files];

  const handleSelect = (result: SearchResult) => {
    if (result.type === "chat") {
      router.push(`/chat/${result.id}`);
    } else if (result.type === "message" && result.chatId) {
      router.push(`/chat/${result.chatId}`);
    } else if (result.type === "file" && result.chatId) {
      router.push(`/chat/${result.chatId}`);
    }
    setIsOpen(false);
    setQuery("");
  };

  return (
    <>
      {/* Search trigger button */}
      <Button
        variant="outline"
        className="relative w-full justify-start text-sm text-muted-foreground hover:text-foreground"
        onClick={() => setIsOpen(true)}
      >
        <Search className="w-4 h-4 mr-2" />
        <span className="hidden sm:inline">Search conversations...</span>
        <span className="sm:hidden">Search...</span>
        <kbd className="pointer-events-none ml-auto hidden h-6 select-none items-center gap-1 rounded border border-border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>

      {/* Search modal */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm"
            />

            {/* Search dialog */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              className="fixed left-1/2 top-1/4 z-50 w-full max-w-2xl -translate-x-1/2 rounded-xl border border-border bg-card shadow-xl"
            >
              {/* Search input */}
              <div className="flex items-center gap-3 border-b border-border px-4 py-3">
                <Search className="w-5 h-5 text-muted-foreground" />
                <input
                  autoFocus
                  type="text"
                  placeholder="Search conversations, messages, files..."
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setSelectedIndex(0);
                  }}
                  className="flex-1 bg-transparent outline-none text-foreground placeholder:text-muted-foreground"
                />
                {isLoading && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsOpen(false)}
                  className="h-8 w-8"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {/* Results */}
              <div className="max-h-96 overflow-y-auto">
                {query && allResults.length === 0 && !isLoading && (
                  <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                    No results found for "{query}"
                  </div>
                )}

                {allResults.length > 0 && (
                  <div className="divide-y divide-border">
                    {results.chats.length > 0 && (
                      <div>
                        <div className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider bg-secondary/30">
                          Conversations
                        </div>
                        {results.chats.map((result, idx) => (
                          <motion.button
                            key={result.id}
                            onClick={() => handleSelect(result)}
                            className="w-full px-4 py-3 text-left hover:bg-secondary/50 flex items-start gap-3 group"
                          >
                            <MessageSquare className="w-4 h-4 mt-1 text-muted-foreground group-hover:text-foreground" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-foreground truncate">{result.title}</p>
                            </div>
                          </motion.button>
                        ))}
                      </div>
                    )}

                    {results.messages.length > 0 && (
                      <div>
                        <div className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider bg-secondary/30">
                          Messages
                        </div>
                        {results.messages.map((result) => (
                          <motion.button
                            key={result.id}
                            onClick={() => handleSelect(result)}
                            className="w-full px-4 py-3 text-left hover:bg-secondary/50 flex items-start gap-3 group"
                          >
                            <MessageSquare className="w-4 h-4 mt-1 text-muted-foreground group-hover:text-foreground" />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-muted-foreground capitalize mb-1">{result.role}</p>
                              <p className="text-sm text-foreground line-clamp-2">{result.preview}</p>
                            </div>
                          </motion.button>
                        ))}
                      </div>
                    )}

                    {results.files.length > 0 && (
                      <div>
                        <div className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider bg-secondary/30">
                          Files
                        </div>
                        {results.files.map((result) => (
                          <motion.button
                            key={result.id}
                            onClick={() => handleSelect(result)}
                            className="w-full px-4 py-3 text-left hover:bg-secondary/50 flex items-start gap-3 group"
                          >
                            <FileText className="w-4 h-4 mt-1 text-muted-foreground group-hover:text-foreground" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-foreground truncate">{result.title}</p>
                              <p className="text-xs text-muted-foreground line-clamp-1">{result.preview}</p>
                            </div>
                          </motion.button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="border-t border-border px-4 py-2 flex items-center justify-between text-xs text-muted-foreground bg-secondary/20">
                <div className="flex gap-3">
                  <kbd className="px-2 py-1 border border-border rounded bg-muted">↑↓</kbd>
                  <span>Navigate</span>
                </div>
                <div className="flex gap-3">
                  <kbd className="px-2 py-1 border border-border rounded bg-muted">↵</kbd>
                  <span>Select</span>
                </div>
                <div className="flex gap-3">
                  <kbd className="px-2 py-1 border border-border rounded bg-muted">ESC</kbd>
                  <span>Close</span>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
