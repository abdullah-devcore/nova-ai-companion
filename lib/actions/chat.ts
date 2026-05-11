"use server";

import { createClient } from "@/lib/supabase/server";
import type { Chat, Message, UserMemory } from "@/lib/types/database";

export async function createChat(title?: string): Promise<Chat | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    console.error("[Chat] createChat: No user");
    return null;
  }

  try {
    const { data, error } = await supabase
      .from("chats")
      .insert({ title: title || "New Chat", user_id: user.id })
      .select()
      .single();

    if (error) {
      console.error("[Chat] Error creating chat:", error.message);
      return null;
    }
    console.log("[Chat] Chat created:", data?.id);
    return data;
  } catch (err) {
    console.error("[Chat] Unexpected error creating chat:", err);
    return null;
  }
}

export async function getChats(): Promise<Chat[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    console.error("[Chat] getChats: No user");
    return [];
  }

  try {
    const { data, error } = await supabase
      .from("chats")
      .select("*")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false });

    if (error) {
      console.error("[Chat] Error fetching chats:", error.message);
      return [];
    }
    console.log("[Chat] Fetched", data?.length || 0, "chats");
    return data || [];
  } catch (err) {
    console.error("[Chat] Unexpected error fetching chats:", err);
    return [];
  }
}

export async function getChat(chatId: string): Promise<Chat | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    console.error("[Chat] getChat: No user");
    return null;
  }

  try {
    const { data, error } = await supabase
      .from("chats")
      .select("*")
      .eq("id", chatId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) {
      console.error("[Chat] Error fetching chat:", error.message);
      return null;
    }
    console.log("[Chat] Got chat:", chatId);
    return data;
  } catch (err) {
    console.error("[Chat] Unexpected error getting chat:", err);
    return null;
  }
}

export async function getChatMessages(chatId: string): Promise<Message[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    console.error("[Chat] getChatMessages: No user");
    return [];
  }

  try {
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("chat_id", chatId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("[Chat] Error fetching messages:", error.message);
      return [];
    }
    console.log("[Chat] Fetched", data?.length || 0, "messages for chat", chatId);
    return data || [];
  } catch (err) {
    console.error("[Chat] Unexpected error fetching messages:", err);
    return [];
  }
}

export async function addMessage(
  chatId: string,
  role: "user" | "assistant",
  content: string,
  emotionTag?: string
): Promise<Message | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    console.error("[Chat] addMessage: No user");
    return null;
  }

  try {
    const { data, error } = await supabase
      .from("messages")
      .insert({
        chat_id: chatId,
        user_id: user.id,
        role,
        content,
        emotion_tag: emotionTag || null,
      })
      .select()
      .single();

    if (error) {
      console.error("[Chat] Error adding message:", error.message);
      return null;
    }

    // Update chat's updated_at timestamp
    const { error: updateError } = await supabase
      .from("chats")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", chatId);

    if (updateError) {
      console.error("[Chat] Error updating chat timestamp:", updateError.message);
    }

    console.log("[Chat] Message added:", data?.id);
    return data;
  } catch (err) {
    console.error("[Chat] Unexpected error adding message:", err);
    return null;
  }
}

export async function updateChatTitle(chatId: string, title: string): Promise<boolean> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    console.error("[Chat] updateChatTitle: No user");
    return false;
  }

  try {
    const { error } = await supabase
      .from("chats")
      .update({ title })
      .eq("id", chatId)
      .eq("user_id", user.id);

    if (error) {
      console.error("[Chat] Error updating chat title:", error.message);
      return false;
    }
    console.log("[Chat] Chat title updated:", chatId);
    return true;
  } catch (err) {
    console.error("[Chat] Unexpected error updating title:", err);
    return false;
  }
}

export async function deleteChat(chatId: string): Promise<boolean> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    console.error("[Chat] deleteChat: No user");
    return false;
  }

  try {
    const { error } = await supabase
      .from("chats")
      .delete()
      .eq("id", chatId)
      .eq("user_id", user.id);

    if (error) {
      console.error("[Chat] Error deleting chat:", error.message);
      return false;
    }
    console.log("[Chat] Chat deleted:", chatId);
    return true;
  } catch (err) {
    console.error("[Chat] Unexpected error deleting chat:", err);
    return false;
  }
}

export async function getUserMemories(): Promise<UserMemory[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    console.error("[Chat] getUserMemories: No user");
    return [];
  }

  try {
    const { data, error } = await supabase
      .from("user_memories")
      .select("*")
      .eq("user_id", user.id)
      .order("importance", { ascending: false })
      .limit(20);

    if (error) {
      console.error("[Chat] Error fetching memories:", error.message);
      return [];
    }
    console.log("[Chat] Fetched", data?.length || 0, "user memories");
    return data || [];
  } catch (err) {
    console.error("[Chat] Unexpected error fetching memories:", err);
    return [];
  }
}

export async function saveUserMemory(
  content: string,
  memoryType: UserMemory["memory_type"],
  importance: number = 5
): Promise<boolean> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    console.error("[Chat] saveUserMemory: No user");
    return false;
  }

  try {
    const { error } = await supabase
      .from("user_memories")
      .insert({ user_id: user.id, content, memory_type: memoryType, importance });

    if (error) {
      console.error("[Chat] Error saving memory:", error.message);
      return false;
    }
    console.log("[Chat] Memory saved");
    return true;
  } catch (err) {
    console.error("[Chat] Unexpected error saving memory:", err);
    return false;
  }
}

export async function generateChatTitle(firstMessage: string): Promise<string> {
  const words = firstMessage.split(" ").slice(0, 6);
  let title = words.join(" ");
  if (firstMessage.split(" ").length > 6) title += "...";
  return title || "New Chat";
}
