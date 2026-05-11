import { getMemories, createMemory, updateMemory } from "@/lib/database/queries";
import type { AiMemory, MemoryContext, Message } from "@/lib/types/schema.types";

// ============================================================================
// MEMORY EXTRACTION
// ============================================================================

interface ExtractedMemory {
  type: "interest" | "goal" | "emotion" | "preference" | "context";
  content: string;
  importance: number;
}

/**
 * Extract memories from user messages using pattern matching and NLP heuristics
 */
export function extractMemoriesFromMessage(
  userMessage: string,
  role: "user" | "assistant"
): ExtractedMemory[] {
  if (role !== "user") return [];

  const memories: ExtractedMemory[] = [];
  const lowercased = userMessage.toLowerCase();

  // Interest detection: "I like...", "I love...", "I enjoy..."
  const interestPatterns = [
    /i (?:like|love|enjoy|'m interested in) (.+?)(?:\.|,|;|$)/gi,
    /i'm (?:into|keen on|passionate about) (.+?)(?:\.|,|;|$)/gi,
  ];

  for (const pattern of interestPatterns) {
    let match;
    while ((match = pattern.exec(userMessage)) !== null) {
      memories.push({
        type: "interest",
        content: match[1].trim(),
        importance: 6,
      });
    }
  }

  // Goal detection: "I want to...", "I'm planning to...", "My goal is..."
  const goalPatterns = [
    /i (?:want to|need to|'m (?:going to|planning to)) (.+?)(?:\.|,|;|$)/gi,
    /(?:my goal|i(?:'m)? aiming) (?:to|is to) (.+?)(?:\.|,|;|$)/gi,
  ];

  for (const pattern of goalPatterns) {
    let match;
    while ((match = pattern.exec(userMessage)) !== null) {
      memories.push({
        type: "goal",
        content: match[1].trim(),
        importance: 8,
      });
    }
  }

  // Emotion detection: various emotional indicators
  const emotionPatterns = [
    /i (?:feel|felt|am|was) (?:so |very |really )?(happy|sad|angry|excited|anxious|stressed|depressed|lonely|confident)/gi,
  ];

  for (const pattern of emotionPatterns) {
    let match;
    while ((match = pattern.exec(userMessage)) !== null) {
      memories.push({
        type: "emotion",
        content: match[0].trim(),
        importance: 4,
      });
    }
  }

  // Preference detection: "I prefer...", "I don't like..."
  const preferencePatterns = [
    /i (?:prefer|don't like|dislike|hate) (.+?)(?:\.|,|;|$)/gi,
    /i (?:always|never) (.+?)(?:\.|,|;|$)/gi,
  ];

  for (const pattern of preferencePatterns) {
    let match;
    while ((match = pattern.exec(userMessage)) !== null) {
      memories.push({
        type: "preference",
        content: match[1].trim(),
        importance: 5,
      });
    }
  }

  // Remove duplicates and short/invalid memories
  return memories.filter(
    (m, idx, arr) =>
      m.content.length > 3 &&
      arr.findIndex((a) => a.content.toLowerCase() === m.content.toLowerCase()) === idx
  );
}

/**
 * Store extracted memories in database
 */
export async function storeExtractedMemories(
  extracted: ExtractedMemory[]
): Promise<AiMemory[]> {
  const stored: AiMemory[] = [];

  for (const memory of extracted) {
    const result = await createMemory({
      memory_type: memory.type,
      content: memory.content,
      importance_score: memory.importance,
    });

    if (result) {
      stored.push(result);
    }
  }

  return stored;
}

// ============================================================================
// MEMORY RETRIEVAL
// ============================================================================

/**
 * Build a contextual memory summary optimized for prompt injection
 */
export async function buildMemoryContext(
  maxTokens: number = 500
): Promise<MemoryContext> {
  // Fetch memories prioritized by importance
  const memories = await getMemories(undefined, 50);

  if (memories.length === 0) {
    return {
      memories: [],
      summary: "",
    };
  }

  // Group by memory type
  const byType = {
    interest: memories.filter((m) => m.memory_type === "interest"),
    goal: memories.filter((m) => m.memory_type === "goal"),
    emotion: memories.filter((m) => m.memory_type === "emotion"),
    preference: memories.filter((m) => m.memory_type === "preference"),
    context: memories.filter((m) => m.memory_type === "context"),
  };

  // Build summary with token limit consideration
  const parts: string[] = [];

  if (byType.goal.length > 0) {
    parts.push(
      `User Goals: ${byType.goal.map((m) => m.content).join(", ")}`
    );
  }

  if (byType.interest.length > 0) {
    const topInterests = byType.interest.slice(0, 5);
    parts.push(
      `User Interests: ${topInterests.map((m) => m.content).join(", ")}`
    );
  }

  if (byType.preference.length > 0) {
    const topPrefs = byType.preference.slice(0, 3);
    parts.push(
      `User Preferences: ${topPrefs.map((m) => m.content).join(", ")}`
    );
  }

  if (byType.emotion.length > 0) {
    const recent = byType.emotion.slice(0, 2);
    parts.push(
      `Recent Emotional State: ${recent.map((m) => m.content).join(", ")}`
    );
  }

  // Estimate tokens (rough approximation: 1 token ≈ 4 chars)
  let summary = parts.join(". ");
  if (summary.length > maxTokens * 4) {
    summary = summary.substring(0, maxTokens * 4) + "...";
  }

  return {
    memories,
    summary,
  };
}

/**
 * Format memories for injection into system prompt
 */
export function formatMemoriesForPrompt(context: MemoryContext): string {
  if (!context.summary) {
    return "";
  }

  return `
Context about the user from our previous conversations:
${context.summary}

Use this information to personalize your responses and show continuity in our conversation.`;
}

// ============================================================================
// MEMORY SCORING AND DECAY
// ============================================================================

/**
 * Boost memory importance based on recent relevance
 */
export async function updateMemoryImportance(
  memoryId: string,
  boost: number = 1
): Promise<void> {
  const memories = await getMemories();
  const memory = memories.find((m) => m.id === memoryId);

  if (memory) {
    const newScore = Math.min(10, memory.importance_score + boost);
    await updateMemory(memoryId, { importance_score: newScore });
  }
}

/**
 * Clean up old or low-importance memories
 */
export async function pruneOldMemories(
  daysOld: number = 90,
  minImportance: number = 2
): Promise<number> {
  const memories = await getMemories();
  const now = Date.now();
  const threshold = now - daysOld * 24 * 60 * 60 * 1000;

  let pruned = 0;
  for (const memory of memories) {
    const createdAt = new Date(memory.created_at).getTime();
    if (createdAt < threshold && memory.importance_score < minImportance) {
      // In production, implement actual deletion
      // await deleteMemory(memory.id);
      pruned++;
    }
  }

  return pruned;
}

// ============================================================================
// MEMORY STATISTICS
// ============================================================================

export interface MemoryStats {
  total: number;
  byType: Record<string, number>;
  avgImportance: number;
  newestMemory: Date | null;
}

/**
 * Get statistics about user's memory
 */
export async function getMemoryStats(): Promise<MemoryStats> {
  const memories = await getMemories();

  const byType = {
    interest: memories.filter((m) => m.memory_type === "interest").length,
    goal: memories.filter((m) => m.memory_type === "goal").length,
    emotion: memories.filter((m) => m.memory_type === "emotion").length,
    preference: memories.filter((m) => m.memory_type === "preference").length,
    context: memories.filter((m) => m.memory_type === "context").length,
  };

  const avgImportance =
    memories.length > 0
      ? memories.reduce((sum, m) => sum + m.importance_score, 0) /
        memories.length
      : 0;

  const newestMemory =
    memories.length > 0 ? new Date(memories[0].created_at) : null;

  return {
    total: memories.length,
    byType,
    avgImportance,
    newestMemory,
  };
}
