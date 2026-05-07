"use server";

import { createClient } from "@/lib/supabase/server";
import type { Chat, Message } from "@/lib/types/database";

export async function createChat(title?: string): Promise<Chat | null> {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  const { data, error } = await supabase
    .from("chats")
    .insert({
      title: title || "New Chat",
      user_id: user?.id || null,
    })
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
  
  const { data, error } = await supabase
    .from("chats")
    .select("*")
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("Error fetching chats:", error);
    return [];
  }

  return data || [];
}

export async function getChat(chatId: string): Promise<Chat | null> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from("chats")
    .select("*")
    .eq("id", chatId)
    .single();

  if (error) {
    console.error("Error fetching chat:", error);
    return null;
  }

  return data;
}

export async function getChatMessages(chatId: string): Promise<Message[]> {
  const supabase = await createClient();
  
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
  content: string
): Promise<Message | null> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from("messages")
    .insert({
      chat_id: chatId,
      role,
      content,
    })
    .select()
    .single();

  if (error) {
    console.error("Error adding message:", error);
    return null;
  }

  // Update the chat's updated_at timestamp
  await supabase
    .from("chats")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", chatId);

  return data;
}

export async function updateChatTitle(
  chatId: string,
  title: string
): Promise<boolean> {
  const supabase = await createClient();
  
  const { error } = await supabase
    .from("chats")
    .update({ title })
    .eq("id", chatId);

  if (error) {
    console.error("Error updating chat title:", error);
    return false;
  }

  return true;
}

export async function deleteChat(chatId: string): Promise<boolean> {
  const supabase = await createClient();
  
  const { error } = await supabase
    .from("chats")
    .delete()
    .eq("id", chatId);

  if (error) {
    console.error("Error deleting chat:", error);
    return false;
  }

  return true;
}

export async function generateChatTitle(firstMessage: string): Promise<string> {
  // Generate a simple title from the first message
  const words = firstMessage.split(" ").slice(0, 6);
  let title = words.join(" ");
  if (firstMessage.split(" ").length > 6) {
    title += "...";
  }
  return title || "New Chat";
}
