import { createClient } from "@/lib/supabase/server";
import type {
  Profile,
  ChatSession,
  Message,
  AiMemory,
  UserSettings,
  CreateProfileInput,
  UpdateProfileInput,
  CreateChatSessionInput,
  UpdateChatSessionInput,
  CreateMessageInput,
  CreateMemoryInput,
  UpdateMemoryInput,
  UpdateUserSettingsInput,
} from "@/lib/types/schema.types";

// ============================================================================
// PROFILES
// ============================================================================

export async function getProfile(): Promise<Profile | null> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return null;

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("[DB] Error fetching profile:", error);
    return null;
  }
}

export async function createProfile(
  input: CreateProfileInput
): Promise<Profile | null> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) throw new Error("Not authenticated");

    const { data, error } = await supabase
      .from("profiles")
      .insert({
        id: user.id,
        email: input.email,
        username: input.username || null,
        avatar_url: input.avatar_url || null,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("[DB] Error creating profile:", error);
    return null;
  }
}

export async function updateProfile(
  input: UpdateProfileInput
): Promise<Profile | null> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) throw new Error("Not authenticated");

    const { data, error } = await supabase
      .from("profiles")
      .update(input)
      .eq("id", user.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("[DB] Error updating profile:", error);
    return null;
  }
}

// ============================================================================
// CHAT SESSIONS
// ============================================================================

export async function createChatSession(
  input: CreateChatSessionInput
): Promise<ChatSession | null> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) throw new Error("Not authenticated");

    const { data, error } = await supabase
      .from("chat_sessions")
      .insert({
        user_id: user.id,
        title: input.title,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("[DB] Error creating chat session:", error);
    return null;
  }
}

export async function getChatSessions(): Promise<ChatSession[]> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return [];

    const { data, error } = await supabase
      .from("chat_sessions")
      .select("*")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("[DB] Error fetching chat sessions:", error);
    return [];
  }
}

export async function getChatSession(
  sessionId: string
): Promise<ChatSession | null> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return null;

    const { data, error } = await supabase
      .from("chat_sessions")
      .select("*")
      .eq("id", sessionId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("[DB] Error fetching chat session:", error);
    return null;
  }
}

export async function updateChatSession(
  sessionId: string,
  input: UpdateChatSessionInput
): Promise<ChatSession | null> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) throw new Error("Not authenticated");

    const { data, error } = await supabase
      .from("chat_sessions")
      .update({ ...input, updated_at: new Date().toISOString() })
      .eq("id", sessionId)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("[DB] Error updating chat session:", error);
    return null;
  }
}

export async function deleteChatSession(sessionId: string): Promise<boolean> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) throw new Error("Not authenticated");

    const { error } = await supabase
      .from("chat_sessions")
      .delete()
      .eq("id", sessionId)
      .eq("user_id", user.id);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error("[DB] Error deleting chat session:", error);
    return false;
  }
}

// ============================================================================
// MESSAGES
// ============================================================================

export async function createMessage(
  input: CreateMessageInput
): Promise<Message | null> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) throw new Error("Not authenticated");

    const { data, error } = await supabase
      .from("messages")
      .insert({
        session_id: input.session_id,
        user_id: user.id,
        role: input.role,
        content: input.content,
        metadata: input.metadata || null,
      })
      .select()
      .single();

    if (error) throw error;

    // Update chat session's last_message and updated_at
    await supabase
      .from("chat_sessions")
      .update({
        last_message: input.content.substring(0, 100),
        updated_at: new Date().toISOString(),
      })
      .eq("id", input.session_id);

    return data;
  } catch (error) {
    console.error("[DB] Error creating message:", error);
    return null;
  }
}

export async function getMessages(sessionId: string): Promise<Message[]> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return [];

    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("session_id", sessionId)
      .eq("user_id", user.id)
      .order("created_at", { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("[DB] Error fetching messages:", error);
    return [];
  }
}

export async function deleteMessage(messageId: string): Promise<boolean> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) throw new Error("Not authenticated");

    const { error } = await supabase
      .from("messages")
      .delete()
      .eq("id", messageId)
      .eq("user_id", user.id);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error("[DB] Error deleting message:", error);
    return false;
  }
}

// ============================================================================
// AI MEMORIES
// ============================================================================

export async function createMemory(
  input: CreateMemoryInput
): Promise<AiMemory | null> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) throw new Error("Not authenticated");

    const { data, error } = await supabase
      .from("ai_memories")
      .insert({
        user_id: user.id,
        memory_type: input.memory_type,
        content: input.content,
        importance_score: input.importance_score || 5,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("[DB] Error creating memory:", error);
    return null;
  }
}

export async function getMemories(
  memoryType?: string,
  limit: number = 20
): Promise<AiMemory[]> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return [];

    let query = supabase
      .from("ai_memories")
      .select("*")
      .eq("user_id", user.id)
      .order("importance_score", { ascending: false })
      .limit(limit);

    if (memoryType) {
      query = query.eq("memory_type", memoryType);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("[DB] Error fetching memories:", error);
    return [];
  }
}

export async function updateMemory(
  memoryId: string,
  input: UpdateMemoryInput
): Promise<AiMemory | null> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) throw new Error("Not authenticated");

    const { data, error } = await supabase
      .from("ai_memories")
      .update({ ...input, updated_at: new Date().toISOString() })
      .eq("id", memoryId)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("[DB] Error updating memory:", error);
    return null;
  }
}

export async function deleteMemory(memoryId: string): Promise<boolean> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) throw new Error("Not authenticated");

    const { error } = await supabase
      .from("ai_memories")
      .delete()
      .eq("id", memoryId)
      .eq("user_id", user.id);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error("[DB] Error deleting memory:", error);
    return false;
  }
}

// ============================================================================
// USER SETTINGS
// ============================================================================

export async function getUserSettings(): Promise<UserSettings | null> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return null;

    const { data, error } = await supabase
      .from("user_settings")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("[DB] Error fetching user settings:", error);
    return null;
  }
}

export async function updateUserSettings(
  input: UpdateUserSettingsInput
): Promise<UserSettings | null> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) throw new Error("Not authenticated");

    const { data, error } = await supabase
      .from("user_settings")
      .update({ ...input, updated_at: new Date().toISOString() })
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("[DB] Error updating user settings:", error);
    return null;
  }
}
