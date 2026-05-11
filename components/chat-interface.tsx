"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, PanelLeftClose, PanelLeft, CircleAlert as AlertCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AIOrb } from "./ai-orb";
import { ChatMessage } from "./chat-message";
import { ChatInput } from "./chat-input";
import { TypingIndicator } from "./typing-indicator";
import { SuggestedPrompts } from "./suggested-prompts";
import { ChatSidebar } from "./chat-sidebar";
import { SettingsModal } from "./settings-modal";
import { FloatingGradients } from "./floating-gradients";
import type { Chat } from "@/lib/types/database";
import {
  createChat,
  getChatMessages,
  addMessage,
  deleteChat,
  updateChatTitle,
  generateChatTitle,
  getUserMemories,
} from "@/lib/actions/chat";
import { createClient } from "@/lib/supabase/client";

interface LocalMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface User {
  id: string;
  email: string;
  displayName: string;
}

interface ChatInterfaceProps {
  initialChats: Chat[];
  user: User;
}

export function ChatInterface({ initialChats, user }: ChatInterfaceProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const [chats, setChats] = useState<Chat[]>(initialChats);
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [messages, setMessages] = useState<LocalMessage[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, scrollToBottom]);

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const loadMessages = useCallback(async (chatId: string) => {
    setIsLoadingMessages(true);
    const msgs = await getChatMessages(chatId);
    setMessages(msgs.map((m) => ({ id: m.id, role: m.role as "user" | "assistant", content: m.content })));
    setIsLoadingMessages(false);
  }, []);

  const handleSelectChat = useCallback(async (id: string) => {
    if (id === activeChat) return;
    setActiveChat(id);
    await loadMessages(id);
    if (window.innerWidth < 768) setSidebarOpen(false);
  }, [activeChat, loadMessages]);

  const handleNewChat = useCallback(async () => {
    const newChat = await createChat("New conversation");
    if (!newChat) return;
    setChats((prev) => [newChat, ...prev]);
    setActiveChat(newChat.id);
    setMessages([]);
    if (window.innerWidth < 768) setSidebarOpen(false);
  }, []);

  const handleDeleteChat = useCallback(async (id: string) => {
    const success = await deleteChat(id);
    if (!success) return;
    setChats((prev) => prev.filter((c) => c.id !== id));
    if (activeChat === id) {
      setActiveChat(null);
      setMessages([]);
    }
  }, [activeChat]);

  const handleSendMessage = useCallback(async (content: string, files?: File[]) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    setError(null);

    let chatId = activeChat;
    let isNewChat = false;
    if (!chatId) {
      const newChat = await createChat("New conversation");
      if (!newChat) {
        setError("Could not create chat. Please try again.");
        return;
      }
      chatId = newChat.id;
      setActiveChat(chatId);
      setChats((prev) => [newChat, ...prev]);
      isNewChat = true;
    }

    const tempId = crypto.randomUUID();
    let userContent = content;
    
    // Handle file uploads
    if (files && files.length > 0) {
      const fileInfo = files.map(f => `[File: ${f.name}]`).join(" ");
      userContent = content ? `${content}\n${fileInfo}` : fileInfo;
    }

    const userMessage: LocalMessage = { id: tempId, role: "user", content: userContent };
    setMessages((prev) => [...prev, userMessage]);
    setIsTyping(true);

    const savedMsg = await addMessage(chatId, "user", userContent);
    if (savedMsg) {
      setMessages((prev) => prev.map((m) => m.id === tempId ? { ...m, id: savedMsg.id } : m));
    }

    if (isNewChat || chats.find((c) => c.id === chatId)?.title === "New conversation") {
      const title = await generateChatTitle(userContent);
      await updateChatTitle(chatId, title);
      setChats((prev) => prev.map((c) => c.id === chatId ? { ...c, title } : c));
    }

    try {
      const memories = await getUserMemories();
      const memoryStrings = memories.map((m) => m.content);

      const apiMessages = [...messages, userMessage].map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: apiMessages,
          memories: memoryStrings,
          userName: user.displayName,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to get response");
      }

      setIsTyping(false);
      setIsStreaming(true);

      const assistantTempId = crypto.randomUUID();
      setMessages((prev) => [...prev, { id: assistantTempId, role: "assistant", content: "" }]);

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response body");

      const decoder = new TextDecoder();
      let accumulatedContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        for (const line of chunk.split("\n")) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") continue;
            try {
              const parsed = JSON.parse(data);
              if (parsed.content) {
                accumulatedContent += parsed.content;
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === assistantTempId ? { ...msg, content: accumulatedContent } : msg
                  )
                );
              }
            } catch {
              // Skip
            }
          }
        }
      }

      if (accumulatedContent) {
        const savedAssistant = await addMessage(chatId, "assistant", accumulatedContent);
        if (savedAssistant) {
          setMessages((prev) =>
            prev.map((msg) => msg.id === assistantTempId ? { ...msg, id: savedAssistant.id } : msg)
          );
        }
      }
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
      console.error("Chat error:", err);
      setError(err instanceof Error ? err.message : "An error occurred");
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
    } finally {
      setIsTyping(false);
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  }, [activeChat, chats, messages, user.displayName]);

  const showWelcome = messages.length === 0 && !isLoadingMessages;

  const sidebarChats = chats.map((c) => ({
    id: c.id,
    title: c.title,
    preview: "",
    timestamp: new Date(c.updated_at),
  }));

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <FloatingGradients />

      <ChatSidebar
        isOpen={sidebarOpen}
        isCollapsed={sidebarCollapsed}
        onClose={() => setSidebarOpen(false)}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        chats={sidebarChats}
        activeChat={activeChat}
        onSelectChat={handleSelectChat}
        onNewChat={handleNewChat}
        onDeleteChat={handleDeleteChat}
        onOpenSettings={() => setSettingsOpen(true)}
        user={user}
      />

      <main className="flex-1 flex flex-col relative z-10 min-w-0">
        <header className="shrink-0 h-16 border-b border-border glass flex items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                if (window.innerWidth < 768) {
                  setSidebarOpen(!sidebarOpen);
                } else {
                  setSidebarCollapsed(!sidebarCollapsed);
                }
              }}
              className="hover:bg-secondary"
            >
              {sidebarCollapsed ? (
                <PanelLeft className="w-5 h-5" />
              ) : (
                <>
                  <PanelLeftClose className="w-5 h-5 hidden md:block" />
                  <Menu className="w-5 h-5 md:hidden" />
                </>
              )}
            </Button>
            <AIOrb size="sm" isThinking={isTyping || isStreaming} />
            <div>
              <h1 className="font-semibold text-sm">Nova AI</h1>
              <motion.p
                key={isTyping ? "thinking" : isStreaming ? "responding" : "online"}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-xs text-muted-foreground"
              >
                {isTyping ? "Thinking..." : isStreaming ? "Responding..." : "Online"}
              </motion.p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground hidden sm:block">
              Hi, {user.displayName}
            </span>
            <motion.div
              animate={{ scale: [1, 1.3, 1] }}
              transition={{ duration: 2.5, repeat: Infinity }}
              className="w-2 h-2 rounded-full bg-green-500"
            />
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-4 py-6">
          <div className="max-w-3xl mx-auto">
            <AnimatePresence mode="wait">
              {isLoadingMessages ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center py-16 gap-4"
                >
                  <AIOrb size="md" isThinking />
                  <p className="text-sm text-muted-foreground">Loading conversation...</p>
                </motion.div>
              ) : showWelcome ? (
                <motion.div
                  key="welcome"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="py-8"
                >
                  <div className="text-center mb-12">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 200, damping: 15 }}
                      className="flex justify-center mb-6"
                    >
                      <AIOrb size="lg" isThinking />
                    </motion.div>
                    <motion.h2
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="text-2xl md:text-3xl font-bold mb-3"
                    >
                      How can I help you today?
                    </motion.h2>
                    <motion.p
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="text-muted-foreground max-w-md mx-auto"
                    >
                      I&apos;m Nova. Ask me anything or choose a suggestion below.
                    </motion.p>
                  </div>
                  <SuggestedPrompts onSelect={handleSendMessage} />
                </motion.div>
              ) : (
                <motion.div
                  key="messages"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-6"
                >
                  {messages.map((message, i) => (
                    <ChatMessage
                      key={message.id}
                      role={message.role}
                      content={message.content}
                      isStreaming={
                        isStreaming &&
                        i === messages.length - 1 &&
                        message.role === "assistant"
                      }
                    />
                  ))}
                  <AnimatePresence>
                    {isTyping && <TypingIndicator />}
                  </AnimatePresence>
                </motion.div>
              )}
            </AnimatePresence>
            <div ref={messagesEndRef} />
          </div>
        </div>

        <div className="shrink-0 p-4 border-t border-border/50">
          <div className="max-w-3xl mx-auto">
            <ChatInput
              onSend={handleSendMessage}
              disabled={isTyping || isStreaming}
            />
            <p className="text-xs text-muted-foreground text-center mt-3">
              Nova can make mistakes. Consider checking important information.
            </p>
          </div>
        </div>
      </main>

      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        user={user}
      />

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50"
          >
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-red-500/20 border border-red-500/30 backdrop-blur-xl text-red-200 shadow-lg max-w-sm">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span className="text-sm">{error}</span>
              <button
                onClick={() => setError(null)}
                className="p-1 hover:bg-red-500/20 rounded-lg transition-colors shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
