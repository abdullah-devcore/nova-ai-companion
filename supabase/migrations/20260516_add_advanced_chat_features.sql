-- Chat sharing for collaboration
CREATE TABLE IF NOT EXISTS chat_shares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id uuid REFERENCES chats(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  share_token text UNIQUE NOT NULL,
  include_messages boolean DEFAULT true,
  password_hash text, -- Optional password protection
  view_count integer DEFAULT 0,
  last_viewed_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE chat_shares ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS chat_shares_share_token_idx ON chat_shares(share_token);
CREATE INDEX IF NOT EXISTS chat_shares_chat_id_idx ON chat_shares(chat_id);
CREATE INDEX IF NOT EXISTS chat_shares_user_id_idx ON chat_shares(user_id);
CREATE INDEX IF NOT EXISTS chat_shares_expires_at_idx ON chat_shares(expires_at);

CREATE POLICY "Users can view own shares"
  ON chat_shares FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR EXISTS (
    SELECT 1 FROM chats WHERE chats.id = chat_shares.chat_id AND chats.user_id = auth.uid()
  ));

CREATE POLICY "Users can create shares"
  ON chat_shares FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own shares"
  ON chat_shares FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own shares"
  ON chat_shares FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Update messages table to support editing
ALTER TABLE messages ADD COLUMN IF NOT EXISTS edited_at timestamptz;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS edit_count integer DEFAULT 0;

CREATE INDEX IF NOT EXISTS messages_edited_at_idx ON messages(edited_at);

-- Chat insights table
CREATE TABLE IF NOT EXISTS chat_insights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id uuid REFERENCES chats(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  message_count integer DEFAULT 0,
  user_message_count integer DEFAULT 0,
  assistant_message_count integer DEFAULT 0,
  average_message_length integer DEFAULT 0,
  total_tokens_used integer DEFAULT 0,
  primary_topic text,
  conversation_sentiment text, -- positive | neutral | negative | mixed
  key_discussion_points text[],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE chat_insights ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS chat_insights_chat_id_idx ON chat_insights(chat_id);
CREATE INDEX IF NOT EXISTS chat_insights_user_id_idx ON chat_insights(user_id);

CREATE POLICY "Users can view own insights"
  ON chat_insights FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own insights"
  ON chat_insights FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own insights"
  ON chat_insights FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
