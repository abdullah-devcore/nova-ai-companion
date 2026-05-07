"use server";

import { createClient } from "@/lib/supabase/server";
import type { Chat, Message, UserMemory } from "@/lib/types/database";

export async function createChat(title?: string): Promise<Chat | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("chats")
    .insert({ title: title || "New Chat", user_id: user.id })
    .select()
    .single();

  if (error) {
    console.error("Error creating chat:", error);
    return null;
  }
  return data;
}

export async function getChats(): Promise<Chat[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("chats")
    .select("*")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("Error fetching chats:", error);
    return [];
  }
  return data || [];
}

export async function getChat(chatId: string): Promise<Chat | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("chats")
    .select("*")
    .eq("id", chatId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) return null;
  return data;
}

export async function getChatMessages(chatId: string): Promise<Message[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("chat_id", chatId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error fetching messages:", error);
    return [];
  }
  return data || [];
}

export async function addMessage(
  chatId: string,
  role: "user" | "assistant",
  content: string,
  emotionTag?: string
): Promise<Message | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

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
    console.error("Error adding message:", error);
    return null;
  }

  await supabase
    .from("chats")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", chatId);

  return data;
}

export async function updateChatTitle(chatId: string, title: string): Promise<boolean> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { error } = await supabase
    .from("chats")
    .update({ title })
    .eq("id", chatId)
    .eq("user_id", user.id);

  return !error;
}

export async function deleteChat(chatId: string): Promise<boolean> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { error } = await supabase
    .from("chats")
    .delete()
    .eq("id", chatId)
    .eq("user_id", user.id);

  return !error;
}

export async function getUserMemories(): Promise<UserMemory[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("user_memories")
    .select("*")
    .eq("user_id", user.id)
    .order("importance", { ascending: false })
    .limit(20);

  if (error) return [];
  return data || [];
}

export async function saveUserMemory(
  content: string,
  memoryType: UserMemory["memory_type"],
  importance: number = 5
): Promise<boolean> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { error } = await supabase
    .from("user_memories")
    .insert({ user_id: user.id, content, memory_type: memoryType, importance });

  return !error;
}

export async function generateChatTitle(firstMessage: string): Promise<string> {
  const words = firstMessage.split(" ").slice(0, 6);
  let title = words.join(" ");
  if (firstMessage.split(" ").length > 6) title += "...";
  return title || "New Chat";
}
