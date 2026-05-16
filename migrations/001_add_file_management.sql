-- File Management Tables for Nova AI

-- Create uploaded_files table
CREATE TABLE IF NOT EXISTS uploaded_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  chat_id UUID REFERENCES chat_sessions(id) ON DELETE SET NULL,
  filename TEXT NOT NULL,
  file_type VARCHAR(50),
  file_size INT,
  original_url TEXT,
  extracted_content TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create file_chunks table for vector search
CREATE TABLE IF NOT EXISTS file_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id UUID NOT NULL REFERENCES uploaded_files(id) ON DELETE CASCADE,
  chunk_index INT,
  chunk_content TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create conversation_folders table
CREATE TABLE IF NOT EXISTS conversation_folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color VARCHAR(7) DEFAULT '#7c3aed',
  parent_folder_id UUID REFERENCES conversation_folders(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Alter chat_sessions to add folder support
ALTER TABLE IF EXISTS chat_sessions ADD COLUMN folder_id UUID REFERENCES conversation_folders(id) ON DELETE SET NULL;
ALTER TABLE IF EXISTS chat_sessions ADD COLUMN pinned BOOLEAN DEFAULT FALSE;
ALTER TABLE IF EXISTS chat_sessions ADD COLUMN pin_order INT;

-- Create shared_chats table
CREATE TABLE IF NOT EXISTS shared_chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  token VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255),
  expires_at TIMESTAMP,
  access_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_uploaded_files_user_id ON uploaded_files(user_id);
CREATE INDEX IF NOT EXISTS idx_uploaded_files_chat_id ON uploaded_files(chat_id);
CREATE INDEX IF NOT EXISTS idx_file_chunks_file_id ON file_chunks(file_id);
CREATE INDEX IF NOT EXISTS idx_conversation_folders_user_id ON conversation_folders(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_folder_id ON chat_sessions(folder_id);
CREATE INDEX IF NOT EXISTS idx_shared_chats_token ON shared_chats(token);

-- Enable RLS
ALTER TABLE uploaded_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE file_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE shared_chats ENABLE ROW LEVEL SECURITY;

-- RLS Policies for uploaded_files
CREATE POLICY "Users can view their own files" ON uploaded_files
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can upload files" ON uploaded_files
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their files" ON uploaded_files
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for file_chunks
CREATE POLICY "Users can view chunks of their files" ON file_chunks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM uploaded_files
      WHERE uploaded_files.id = file_chunks.file_id
      AND uploaded_files.user_id = auth.uid()
    )
  );

-- RLS Policies for conversation_folders
CREATE POLICY "Users can manage their folders" ON conversation_folders
  FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for shared_chats
CREATE POLICY "Users can create shares" ON shared_chats
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can view their shares" ON shared_chats
  FOR SELECT USING (auth.uid() = created_by);

CREATE POLICY "Anyone can access public shares" ON shared_chats
  FOR SELECT USING (TRUE);
