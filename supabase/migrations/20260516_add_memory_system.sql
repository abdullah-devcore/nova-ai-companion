-- Smart Memory System tables
-- Stores persistent user context, preferences, and conversation insights

CREATE TABLE IF NOT EXISTS user_memories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  memory_type text NOT NULL, -- fact | preference | trait | goal | context | emotional_note
  title text NOT NULL,
  content text NOT NULL,
  category text, -- e.g., "work", "interests", "family", "health"
  importance integer DEFAULT 5, -- 1-10 scale for prioritization
  confidence_score decimal DEFAULT 0.8, -- How confident the system is about this memory (0-1)
  last_mentioned_at timestamptz,
  mention_count integer DEFAULT 0, -- How many times referenced
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  expires_at timestamptz -- Optional expiration for temporary memories
);

ALTER TABLE user_memories ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS user_memories_user_id_idx ON user_memories(user_id);
CREATE INDEX IF NOT EXISTS user_memories_memory_type_idx ON user_memories(memory_type);
CREATE INDEX IF NOT EXISTS user_memories_category_idx ON user_memories(category);
CREATE INDEX IF NOT EXISTS user_memories_importance_idx ON user_memories(importance DESC);
CREATE INDEX IF NOT EXISTS user_memories_last_mentioned_at_idx ON user_memories(last_mentioned_at DESC);

CREATE POLICY "Users can view own memories"
  ON user_memories FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id AND (expires_at IS NULL OR expires_at > now()));

CREATE POLICY "Users can insert own memories"
  ON user_memories FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own memories"
  ON user_memories FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own memories"
  ON user_memories FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Entity recognition table for storing extracted entities from conversations
CREATE TABLE IF NOT EXISTS conversation_entities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  chat_id uuid REFERENCES chats(id) ON DELETE CASCADE,
  entity_type text NOT NULL, -- person | place | organization | date | product | concept
  entity_name text NOT NULL,
  context text, -- Brief context where mentioned
  sentiment text, -- positive | neutral | negative
  first_mentioned_at timestamptz DEFAULT now(),
  last_mentioned_at timestamptz DEFAULT now(),
  mention_count integer DEFAULT 1,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE conversation_entities ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS conversation_entities_user_id_idx ON conversation_entities(user_id);
CREATE INDEX IF NOT EXISTS conversation_entities_entity_type_idx ON conversation_entities(entity_type);
CREATE INDEX IF NOT EXISTS conversation_entities_entity_name_idx ON conversation_entities(entity_name);
CREATE INDEX IF NOT EXISTS conversation_entities_mention_count_idx ON conversation_entities(mention_count DESC);

CREATE POLICY "Users can view own entities"
  ON conversation_entities FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own entities"
  ON conversation_entities FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- User profile enrichment with extracted preferences
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS personality_traits jsonb DEFAULT '{}'; -- extracted personality info
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS interests jsonb DEFAULT '[]'; -- list of interests
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS communication_style text; -- formal | casual | technical | creative
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS preferred_response_length text DEFAULT 'medium'; -- short | medium | long | detailed
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS timezone text DEFAULT 'UTC';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS memory_sync_enabled boolean DEFAULT true;

-- Conversation summaries for quick context
CREATE TABLE IF NOT EXISTS conversation_summaries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id uuid REFERENCES chats(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  summary text NOT NULL, -- Concise summary of chat
  key_points text[], -- Array of main discussion points
  entities jsonb DEFAULT '[]', -- Extracted people, places, topics
  sentiment text, -- overall_positive | neutral | negative
  generated_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE conversation_summaries ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS conversation_summaries_chat_id_idx ON conversation_summaries(chat_id);
CREATE INDEX IF NOT EXISTS conversation_summaries_user_id_idx ON conversation_summaries(user_id);

CREATE POLICY "Users can view own summaries"
  ON conversation_summaries FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own summaries"
  ON conversation_summaries FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own summaries"
  ON conversation_summaries FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
