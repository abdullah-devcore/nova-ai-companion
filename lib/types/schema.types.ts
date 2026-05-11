// Complete database types generated from schema

// Profiles
export interface Profile {
  id: string; // UUID - auth.users.id
  email: string;
  username: string | null;
  avatar_url: string | null;
  onboarding_completed: boolean;
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
}

export interface CreateProfileInput {
  email: string;
  username?: string;
  avatar_url?: string;
}

export interface UpdateProfileInput {
  username?: string;
  avatar_url?: string;
  onboarding_completed?: boolean;
}

// Chat sessions
export interface ChatSession {
  id: string; // UUID
  user_id: string; // UUID
  title: string;
  last_message: string | null;
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
}

export interface CreateChatSessionInput {
  title: string;
}

export interface UpdateChatSessionInput {
  title?: string;
  last_message?: string;
}

// Messages
export interface Message {
  id: string; // UUID
  session_id: string; // UUID
  user_id: string; // UUID
  role: 'user' | 'assistant' | 'system';
  content: string;
  metadata: Record<string, any> | null;
  created_at: string; // ISO timestamp
}

export interface CreateMessageInput {
  session_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  metadata?: Record<string, any>;
}

// AI Memories
export type MemoryType = 'interest' | 'goal' | 'emotion' | 'preference' | 'context';

export interface AiMemory {
  id: string; // UUID
  user_id: string; // UUID
  memory_type: MemoryType;
  content: string;
  importance_score: number; // 0-10
  embedding_summary: string | null;
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
}

export interface CreateMemoryInput {
  memory_type: MemoryType;
  content: string;
  importance_score?: number; // defaults to 5
}

export interface UpdateMemoryInput {
  content?: string;
  importance_score?: number;
  embedding_summary?: string;
}

// User settings
export type Theme = 'light' | 'dark';
export type AiPersonality = 'helpful' | 'creative' | 'analytical' | 'friendly';

export interface UserSettings {
  id: string; // UUID
  user_id: string; // UUID
  theme: Theme;
  ai_personality: AiPersonality;
  voice_enabled: boolean;
  notifications_enabled: boolean;
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
}

export interface UpdateUserSettingsInput {
  theme?: Theme;
  ai_personality?: AiPersonality;
  voice_enabled?: boolean;
  notifications_enabled?: boolean;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// Auth types
export interface AuthUser {
  id: string;
  email: string;
  user_metadata?: {
    username?: string;
    avatar_url?: string;
  };
}

export interface SignUpInput {
  email: string;
  password: string;
  displayName: string;
}

export interface SignInInput {
  email: string;
  password: string;
}

// Memory retrieval and injection types
export interface MemoryContext {
  memories: AiMemory[];
  summary: string;
}

export interface ConversationContext {
  recentMessages: Message[];
  userMemories: MemoryContext;
  settings: UserSettings;
}
