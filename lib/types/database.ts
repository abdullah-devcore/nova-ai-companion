export interface Profile {
  id: string;
  display_name: string;
  avatar_url: string | null;
  emotional_context: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface Chat {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  chat_id: string;
  user_id: string | null;
  role: "user" | "assistant" | "system";
  content: string;
  emotion_tag: string | null;
  created_at: string;
}

export interface UserMemory {
  id: string;
  user_id: string;
  memory_type: "preference" | "fact" | "emotional_note" | "interest";
  content: string;
  importance: number;
  created_at: string;
  updated_at: string;
}

export interface ChatWithMessages extends Chat {
  messages: Message[];
}
