/*
  # Nova AI - Core Schema

  ## New Tables

  ### profiles
  - `id` (uuid, PK, references auth.users)
  - `display_name` (text)
  - `avatar_url` (text, nullable)
  - `emotional_context` (jsonb) - stores AI's memory of user's emotional state/preferences
  - `created_at` / `updated_at`

  ### chats
  - `id` (uuid, PK)
  - `user_id` (uuid, FK to auth.users)
  - `title` (text)
  - `created_at` / `updated_at`

  ### messages
  - `id` (uuid, PK)
  - `chat_id` (uuid, FK to chats)
  - `user_id` (uuid, nullable FK to auth.users)
  - `role` (text: user | assistant | system)
  - `content` (text)
  - `emotion_tag` (text, nullable) - AI-detected emotional context
  - `created_at`

  ### user_memories
  - `id` (uuid, PK)
  - `user_id` (uuid, FK to auth.users)
  - `memory_type` (text: preference | fact | emotional_note)
  - `content` (text)
  - `importance` (int, 1-10)
  - `created_at` / `updated_at`

  ## Security
  - RLS enabled on all tables
  - Users can only access their own data
*/

-- Profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text DEFAULT '',
  avatar_url text,
  emotional_context jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Chats table
CREATE TABLE IF NOT EXISTS chats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title text DEFAULT 'New Chat',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE chats ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS chats_user_id_idx ON chats(user_id);
CREATE INDEX IF NOT EXISTS chats_updated_at_idx ON chats(updated_at DESC);

CREATE POLICY "Users can view own chats"
  ON chats FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own chats"
  ON chats FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own chats"
  ON chats FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own chats"
  ON chats FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id uuid REFERENCES chats(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  role text NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content text NOT NULL DEFAULT '',
  emotion_tag text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS messages_chat_id_idx ON messages(chat_id);
CREATE INDEX IF NOT EXISTS messages_created_at_idx ON messages(created_at ASC);

CREATE POLICY "Users can view messages in own chats"
  ON messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM chats
      WHERE chats.id = messages.chat_id
      AND chats.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert messages in own chats"
  ON messages FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM chats
      WHERE chats.id = messages.chat_id
      AND chats.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete messages in own chats"
  ON messages FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM chats
      WHERE chats.id = messages.chat_id
      AND chats.user_id = auth.uid()
    )
  );

-- User memories table (persistent AI memory)
CREATE TABLE IF NOT EXISTS user_memories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  memory_type text NOT NULL DEFAULT 'fact' CHECK (memory_type IN ('preference', 'fact', 'emotional_note', 'interest')),
  content text NOT NULL,
  importance integer DEFAULT 5 CHECK (importance BETWEEN 1 AND 10),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_memories ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS user_memories_user_id_idx ON user_memories(user_id);
CREATE INDEX IF NOT EXISTS user_memories_importance_idx ON user_memories(importance DESC);

CREATE POLICY "Users can view own memories"
  ON user_memories FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

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

-- Auto-update updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER chats_updated_at
  BEFORE UPDATE ON chats
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER user_memories_updated_at
  BEFORE UPDATE ON user_memories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
