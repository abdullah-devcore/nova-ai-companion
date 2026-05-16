import { createClient } from "@/lib/supabase/server";

export interface ExtractedEntity {
  type: "person" | "place" | "preference" | "goal" | "skill" | "other";
  value: string;
  confidence: number;
  context?: string;
}

export interface Memory {
  id: string;
  userId: string;
  content: string;
  type: "user_fact" | "preference" | "goal" | "learning" | "context";
  importance: number;
  lastReferenced?: Date;
  referenceCount: number;
  createdAt: Date;
  tags: string[];
}

/**
 * Extract entities from conversation messages
 * Identifies people, places, preferences, goals, etc.
 */
export function extractEntities(text: string): ExtractedEntity[] {
  const entities: ExtractedEntity[] = [];

  // Person names (patterns like "My name is X" or "I'm X")
  const namePatterns = [
    /(?:my name is|i'm|i am|call me)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/gi,
    /(?:people call me|everyone calls me)\s+([A-Z][a-z]+)/gi,
  ];

  for (const pattern of namePatterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      entities.push({
        type: "person",
        value: match[1],
        confidence: 0.9,
        context: text.substring(Math.max(0, match.index - 30), match.index + 50),
      });
    }
  }

  // Preferences (patterns like "I prefer X" or "I like X")
  const preferencePatterns = [
    /i (?:prefer|like|love|enjoy)\s+([^.,!?]+)/gi,
    /i don't (?:like|prefer)\s+([^.,!?]+)/gi,
  ];

  for (const pattern of preferencePatterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      entities.push({
        type: "preference",
        value: match[1].trim(),
        confidence: 0.85,
        context: text.substring(Math.max(0, match.index - 30), match.index + 50),
      });
    }
  }

  // Goals (patterns like "I want to" or "My goal is")
  const goalPatterns = [
    /(?:i want to|my goal is|i aim to|i'm trying to)\s+([^.,!?]+)/gi,
    /(?:i need to|i should)\s+([^.,!?]+)/gi,
  ];

  for (const pattern of goalPatterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      entities.push({
        type: "goal",
        value: match[1].trim(),
        confidence: 0.8,
        context: text.substring(Math.max(0, match.index - 30), match.index + 50),
      });
    }
  }

  // Skills (patterns like "I'm good at" or "I know X")
  const skillPatterns = [
    /i(?:'m| am) (?:good|great|excellent) at\s+([^.,!?]+)/gi,
    /i (?:know|understand|specialize in)\s+([^.,!?]+)/gi,
  ];

  for (const pattern of skillPatterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      entities.push({
        type: "skill",
        value: match[1].trim(),
        confidence: 0.8,
        context: text.substring(Math.max(0, match.index - 30), match.index + 50),
      });
    }
  }

  // Remove duplicates
  const seen = new Set();
  return entities.filter((entity) => {
    const key = `${entity.type}:${entity.value.toLowerCase()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * Calculate importance score for a memory (0-1)
 * Based on keyword prominence, specificity, recency
 */
export function calculateImportanceScore(
  content: string,
  entityType: string,
  referenceCount: number = 0,
  lastReferenced?: Date
): number {
  let score = 0.5; // Base score

  // Boost for high-value entity types
  if (entityType === "goal") score += 0.2;
  if (entityType === "user_fact") score += 0.15;
  if (entityType === "preference") score += 0.1;

  // Boost based on reference frequency
  score += Math.min(referenceCount * 0.05, 0.2);

  // Recency boost
  if (lastReferenced) {
    const daysSinceReference = Math.floor(
      (Date.now() - lastReferenced.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysSinceReference < 7) score += 0.1;
    else if (daysSinceReference < 30) score += 0.05;
  }

  // Content specificity boost (longer, more detailed = more important)
  const contentLength = content.length;
  if (contentLength > 200) score += 0.1;
  if (contentLength > 500) score += 0.05;

  return Math.min(score, 1);
}

/**
 * Store extracted entities as memories
 */
export async function storeMemories(
  userId: string,
  entities: ExtractedEntity[],
  conversationContext: string
): Promise<string[]> {
  const supabase = await createClient();
  const storedIds: string[] = [];

  for (const entity of entities) {
    // Check if memory already exists
    const { data: existing } = await supabase
      .from("ai_memories")
      .select("id")
      .eq("user_id", userId)
      .ilike("content", `%${entity.value}%`)
      .single();

    if (existing) {
      // Update reference count
      await supabase
        .from("ai_memories")
        .update({
          reference_count: (existing.reference_count || 0) + 1,
          last_referenced_at: new Date().toISOString(),
        })
        .eq("id", existing.id);

      storedIds.push(existing.id);
    } else {
      // Create new memory
      const importance = calculateImportanceScore(entity.context || "", entity.type);

      const { data: memory, error } = await supabase
        .from("ai_memories")
        .insert({
          user_id: userId,
          content: entity.value,
          type: entity.type === "other" ? "context" : entity.type,
          importance_score: importance,
          reference_count: 1,
          metadata: {
            confidence: entity.confidence,
            source_context: entity.context,
          },
        })
        .select("id")
        .single();

      if (memory) {
        storedIds.push(memory.id);
      }
    }
  }

  return storedIds;
}

/**
 * Retrieve relevant memories for a conversation
 */
export async function retrieveRelevantMemories(
  userId: string,
  query: string,
  limit: number = 5
): Promise<Memory[]> {
  const supabase = await createClient();

  // Simple keyword search + importance score ranking
  const { data: memories, error } = await supabase
    .from("ai_memories")
    .select("*")
    .eq("user_id", userId)
    .order("importance_score", { ascending: false })
    .order("last_referenced_at", { ascending: false })
    .limit(limit);

  if (error || !memories) return [];

  // Filter by query relevance
  const queryWords = query.toLowerCase().split(" ");
  const filtered = memories.filter((memory) => {
    const contentLower = (memory.content || "").toLowerCase();
    return queryWords.some((word) => word.length > 2 && contentLower.includes(word));
  });

  return filtered.slice(0, limit);
}
