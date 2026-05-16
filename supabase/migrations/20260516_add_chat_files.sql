-- Chat Files table for document storage and extraction
CREATE TABLE IF NOT EXISTS chat_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id uuid REFERENCES chats(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  file_name text NOT NULL,
  file_type text NOT NULL,
  file_size integer NOT NULL,
  content_type text NOT NULL, -- pdf | document | image | spreadsheet | csv | text
  extracted_text text, -- Full extracted text content
  extracted_metadata jsonb DEFAULT '{}', -- Metadata from extraction
  preview text, -- First 500 chars for UI display
  is_processed boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE chat_files ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS chat_files_chat_id_idx ON chat_files(chat_id);
CREATE INDEX IF NOT EXISTS chat_files_user_id_idx ON chat_files(user_id);
CREATE INDEX IF NOT EXISTS chat_files_created_at_idx ON chat_files(created_at DESC);

CREATE POLICY "Users can view own chat files"
  ON chat_files FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own chat files"
  ON chat_files FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own chat files"
  ON chat_files FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own chat files"
  ON chat_files FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Full-text search index on extracted_text for efficient searching
CREATE INDEX IF NOT EXISTS chat_files_extracted_text_idx 
  ON chat_files USING GIN(to_tsvector('english', extracted_text));
