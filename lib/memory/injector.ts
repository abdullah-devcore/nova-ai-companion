import { createClient } from "@/lib/supabase/server";
import { retrieveRelevantMemories } from "./entity-extractor";

/**
 * Builds enhanced system prompt with relevant memories
 */
export async function buildMemoryEnrichedPrompt(
  userId: string,
  userMessage: string,
  baseSystemPrompt: string
): Promise<string> {
  try {
    // Retrieve relevant memories
    const memories = await retrieveRelevantMemories(userId, userMessage, 5);

    if (memories.length === 0) {
      return baseSystemPrompt;
    }

    // Build memory context
    const memoryContext = buildMemoryContext(memories);

    return `${baseSystemPrompt}

## User Context & Preferences
${memoryContext}

Please use this information to provide more personalized and relevant responses.`;
  } catch (error) {
    console.error("[MemoryInjector] Error building prompt:", error);
    return baseSystemPrompt;
  }
}

/**
 * Format memories into readable context string
 */
function buildMemoryContext(memories: any[]): string {
  const grouped = {
    facts: memories.filter((m) => m.type === "user_fact"),
    preferences: memories.filter((m) => m.type === "preference"),
    goals: memories.filter((m) => m.type === "goal"),
    skills: memories.filter((m) => m.type === "skill"),
  };

  let context = "";

  if (grouped.facts.length > 0) {
    context += "**About the User:**\n";
    context += grouped.facts.map((m) => `- ${m.content}`).join("\n") + "\n\n";
  }

  if (grouped.preferences.length > 0) {
    context += "**Preferences:**\n";
    context += grouped.preferences.map((m) => `- ${m.content}`).join("\n") + "\n\n";
  }

  if (grouped.goals.length > 0) {
    context += "**Goals:**\n";
    context += grouped.goals.map((m) => `- ${m.content}`).join("\n") + "\n\n";
  }

  if (grouped.skills.length > 0) {
    context += "**Skills:**\n";
    context += grouped.skills.map((m) => `- ${m.content}`).join("\n") + "\n";
  }

  return context;
}

/**
 * Inject memories into conversation context
 */
export async function injectMemoriesIntoContext(
  userId: string,
  messages: Array<{ role: string; content: string }>,
  limit: number = 3
): Promise<string> {
  try {
    // Get the last user message for context
    const lastUserMessage = messages
      .reverse()
      .find((m) => m.role === "user")?.content || "";

    if (!lastUserMessage) return "";

    const memories = await retrieveRelevantMemories(userId, lastUserMessage, limit);

    if (memories.length === 0) return "";

    return buildMemoryContext(memories);
  } catch (error) {
    console.error("[MemoryInjector] Error:", error);
    return "";
  }
}

/**
 * Update memory importance based on user feedback
 */
export async function updateMemoryImportance(
  memoryId: string,
  userId: string,
  feedback: "positive" | "negative",
  adjustment: number = 0.1
): Promise<boolean> {
  const supabase = await createClient();

  try {
    const { data: memory, error: fetchError } = await supabase
      .from("ai_memories")
      .select("importance_score")
      .eq("id", memoryId)
      .eq("user_id", userId)
      .single();

    if (fetchError || !memory) return false;

    const newScore = Math.max(
      0,
      Math.min(
        1,
        memory.importance_score + (feedback === "positive" ? adjustment : -adjustment)
      )
    );

    const { error: updateError } = await supabase
      .from("ai_memories")
      .update({ importance_score: newScore })
      .eq("id", memoryId);

    return !updateError;
  } catch (error) {
    console.error("[MemoryInjector] Update error:", error);
    return false;
  }
}
