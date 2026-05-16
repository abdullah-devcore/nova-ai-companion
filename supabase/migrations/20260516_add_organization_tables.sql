-- Chat organization tables for folders, tags, and search
CREATE TABLE IF NOT EXISTS chat_folders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  parent_folder_id uuid REFERENCES chat_folders(id) ON DELETE CASCADE,
  name text NOT NULL,
  color text DEFAULT '#6366f1', -- Indigo
  description text,
  is_pinned boolean DEFAULT false,
  order_index integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, parent_folder_id, name)
);

ALTER TABLE chat_folders ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS chat_folders_user_id_idx ON chat_folders(user_id);
CREATE INDEX IF NOT EXISTS chat_folders_parent_id_idx ON chat_folders(parent_folder_id);

CREATE POLICY "Users can view own folders"
  ON chat_folders FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own folders"
  ON chat_folders FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own folders"
  ON chat_folders FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own folders"
  ON chat_folders FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Chat tags for categorization
CREATE TABLE IF NOT EXISTS chat_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  color text DEFAULT '#06b6d4', -- Cyan
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, name)
);

ALTER TABLE chat_tags ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS chat_tags_user_id_idx ON chat_tags(user_id);

CREATE POLICY "Users can view own tags"
  ON chat_tags FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tags"
  ON chat_tags FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tags"
  ON chat_tags FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own tags"
  ON chat_tags FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Junction table: chats to tags
CREATE TABLE IF NOT EXISTS chat_chat_tags (
  chat_id uuid REFERENCES chats(id) ON DELETE CASCADE NOT NULL,
  tag_id uuid REFERENCES chat_tags(id) ON DELETE CASCADE NOT NULL,
  PRIMARY KEY (chat_id, tag_id)
);

CREATE INDEX IF NOT EXISTS chat_chat_tags_tag_id_idx ON chat_chat_tags(tag_id);

-- Update chats table to add folder and pinned support
ALTER TABLE chats ADD COLUMN IF NOT EXISTS folder_id uuid REFERENCES chat_folders(id) ON DELETE SET NULL;
ALTER TABLE chats ADD COLUMN IF NOT EXISTS is_pinned boolean DEFAULT false;
ALTER TABLE chats ADD COLUMN IF NOT EXISTS is_archived boolean DEFAULT false;
ALTER TABLE chats ADD COLUMN IF NOT EXISTS last_accessed_at timestamptz;

-- Update indexes
CREATE INDEX IF NOT EXISTS chats_folder_id_idx ON chats(folder_id);
CREATE INDEX IF NOT EXISTS chats_is_pinned_idx ON chats(is_pinned) WHERE is_pinned = true;
CREATE INDEX IF NOT EXISTS chats_is_archived_idx ON chats(is_archived) WHERE is_archived = false;
CREATE INDEX IF NOT EXISTS chats_last_accessed_at_idx ON chats(last_accessed_at DESC);
