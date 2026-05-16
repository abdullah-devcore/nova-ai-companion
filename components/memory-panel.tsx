"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, Edit2, Trash2, ChevronUp, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Memory {
  id: string;
  content: string;
  type: "user_fact" | "preference" | "goal" | "skill" | "context";
  importance_score: number;
  reference_count: number;
  created_at: string;
}

export function MemoryPanel() {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<string | null>(null);

  useEffect(() => {
    loadMemories();
  }, []);

  const loadMemories = async () => {
    try {
      const response = await fetch("/api/memories/list");
      const data = await response.json();
      setMemories(data.memories || []);
    } catch (error) {
      console.error("[MemoryPanel] Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteMemory = async (id: string) => {
    try {
      await fetch(`/api/memories/${id}`, { method: "DELETE" });
      setMemories((prev) => prev.filter((m) => m.id !== id));
    } catch (error) {
      console.error("[MemoryPanel] Delete error:", error);
    }
  };

  const updateImportance = async (id: string, delta: number) => {
    const memory = memories.find((m) => m.id === id);
    if (!memory) return;

    const newScore = Math.max(0, Math.min(1, memory.importance_score + delta));

    try {
      await fetch(`/api/memories/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ importance_score: newScore }),
      });
      setMemories((prev) =>
        prev.map((m) => (m.id === id ? { ...m, importance_score: newScore } : m))
      );
    } catch (error) {
      console.error("[MemoryPanel] Update error:", error);
    }
  };

  const filtered = filter
    ? memories.filter((m) => m.type === filter)
    : memories;

  const typeColors = {
    user_fact: "bg-blue-500/10 text-blue-600 border-blue-200",
    preference: "bg-purple-500/10 text-purple-600 border-purple-200",
    goal: "bg-green-500/10 text-green-600 border-green-200",
    skill: "bg-orange-500/10 text-orange-600 border-orange-200",
    context: "bg-gray-500/10 text-gray-600 border-gray-200",
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Brain className="w-5 h-5 text-accent" />
        <h3 className="font-semibold">Memories ({filtered.length})</h3>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 flex-wrap">
        <motion.button
          whileHover={{ scale: 1.05 }}
          onClick={() => setFilter(null)}
          className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
            filter === null
              ? "bg-accent text-white"
              : "bg-muted hover:bg-muted/80 text-muted-foreground"
          }`}
        >
          All
        </motion.button>
        {["user_fact", "preference", "goal", "skill"].map((type) => (
          <motion.button
            key={type}
            whileHover={{ scale: 1.05 }}
            onClick={() => setFilter(type)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              filter === type
                ? "bg-accent text-white"
                : "bg-muted hover:bg-muted/80 text-muted-foreground"
            }`}
          >
            {type.replace("_", " ")}
          </motion.button>
        ))}
      </div>

      {/* Memories List */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        <AnimatePresence>
          {isLoading ? (
            <motion.div
              animate={{ opacity: [0.5, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="text-sm text-muted-foreground text-center py-4"
            >
              Loading memories...
            </motion.div>
          ) : filtered.length === 0 ? (
            <div className="text-sm text-muted-foreground text-center py-4">
              No memories yet
            </div>
          ) : (
            filtered.map((memory) => (
              <motion.div
                key={memory.id}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={`p-3 rounded-lg border ${typeColors[memory.type]}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium line-clamp-2">{memory.content}</p>
                    <div className="flex gap-2 mt-1 flex-wrap">
                      <span className="text-xs opacity-75">
                        Type: {memory.type.replace("_", " ")}
                      </span>
                      <span className="text-xs opacity-75">
                        Refs: {memory.reference_count}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    {/* Importance Controls */}
                    <div className="flex flex-col">
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        onClick={() => updateImportance(memory.id, 0.1)}
                        className="p-1 hover:bg-current/20 rounded"
                      >
                        <ChevronUp className="w-3 h-3" />
                      </motion.button>
                      <div className="text-xs font-semibold text-center px-1.5 min-w-[2rem]">
                        {Math.round(memory.importance_score * 100)}%
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        onClick={() => updateImportance(memory.id, -0.1)}
                        className="p-1 hover:bg-current/20 rounded"
                      >
                        <ChevronDown className="w-3 h-3" />
                      </motion.button>
                    </div>

                    {/* Delete Button */}
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      onClick={() => deleteMemory(memory.id)}
                      className="p-1.5 hover:bg-red-500/20 rounded text-red-600"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
