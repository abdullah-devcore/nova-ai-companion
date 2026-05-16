"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, Edit2, Brain, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Memory {
  id: string;
  memory_type: "fact" | "preference" | "trait" | "goal" | "context" | "emotional_note";
  title: string;
  content: string;
  category?: string;
  importance: number;
  created_at: string;
}

interface MemoryManagerProps {
  memories?: Memory[];
  onRefresh?: () => void;
  disabled?: boolean;
}

const MEMORY_COLORS = {
  fact: "bg-blue-500/20 text-blue-700",
  preference: "bg-purple-500/20 text-purple-700",
  trait: "bg-pink-500/20 text-pink-700",
  goal: "bg-green-500/20 text-green-700",
  context: "bg-amber-500/20 text-amber-700",
  emotional_note: "bg-red-500/20 text-red-700",
};

export function MemoryManager({ memories = [], onRefresh, disabled = false }: MemoryManagerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    memory_type: "fact" as const,
    title: "",
    content: "",
    category: "",
    importance: 5,
  });

  const handleCreateMemory = useCallback(async () => {
    if (!formData.title.trim() || !formData.content.trim()) return;

    try {
      const response = await fetch("/api/memories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setFormData({
          memory_type: "fact",
          title: "",
          content: "",
          category: "",
          importance: 5,
        });
        setIsCreating(false);
        onRefresh?.();
      }
    } catch (error) {
      console.error("[MemoryManager] Create error:", error);
    }
  }, [formData, onRefresh]);

  const handleDeleteMemory = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/memories?id=${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        onRefresh?.();
      }
    } catch (error) {
      console.error("[MemoryManager] Delete error:", error);
    }
  }, [onRefresh]);

  return (
    <>
      {/* Memory button */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        className="gap-2"
      >
        <Brain className="w-4 h-4" />
        <span className="hidden sm:inline">Memory</span>
      </Button>

      {/* Memory panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            className="absolute right-0 top-full mt-2 bg-card border border-border rounded-lg shadow-xl p-4 w-96 max-h-96 overflow-y-auto z-50"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Smart Memory
              </h3>
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6"
                onClick={() => setIsOpen(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Create form */}
            {!isCreating ? (
              <Button
                size="sm"
                className="w-full mb-4 gap-2"
                onClick={() => setIsCreating(true)}
              >
                <Plus className="w-4 h-4" />
                Add Memory
              </Button>
            ) : (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="bg-secondary/30 p-3 rounded-lg mb-4 space-y-2"
              >
                <select
                  value={formData.memory_type}
                  onChange={(e) =>
                    setFormData({ ...formData, memory_type: e.target.value as any })
                  }
                  className="w-full px-2 py-1 text-xs bg-background border border-border rounded"
                >
                  <option value="fact">Fact</option>
                  <option value="preference">Preference</option>
                  <option value="trait">Trait</option>
                  <option value="goal">Goal</option>
                  <option value="context">Context</option>
                  <option value="emotional_note">Emotional Note</option>
                </select>

                <Input
                  placeholder="Title..."
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="h-8 text-xs"
                />

                <textarea
                  placeholder="What do you want to remember?"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  className="w-full px-2 py-1 text-xs bg-background border border-border rounded resize-none h-16"
                />

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="flex-1 h-7 text-xs"
                    onClick={handleCreateMemory}
                    disabled={!formData.title.trim()}
                  >
                    Save
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 h-7 text-xs"
                    onClick={() => setIsCreating(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Memories list */}
            <div className="space-y-2">
              {memories.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">
                  No memories yet. Create one to get started!
                </p>
              ) : (
                memories.map((memory) => (
                  <motion.div
                    key={memory.id}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-2 rounded-lg text-xs space-y-1 group ${MEMORY_COLORS[memory.memory_type]}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{memory.title}</p>
                        <p className="text-xs opacity-75 line-clamp-2">{memory.content}</p>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-5 w-5"
                          onClick={() => handleDeleteMemory(memory.id)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex gap-1">
                        {memory.category && (
                          <span className="px-1.5 py-0.5 bg-background/50 rounded text-xs opacity-75">
                            {memory.category}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: memory.importance }).map((_, i) => (
                          <div key={i} className="w-1 h-1 rounded-full bg-current opacity-50" />
                        ))}
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
