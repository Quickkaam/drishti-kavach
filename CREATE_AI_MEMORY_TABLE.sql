-- ============================================
-- Drishti Kavach — Create AI Memory Table
-- Run this in your Supabase SQL editor
-- ============================================

CREATE TABLE IF NOT EXISTS ai_memory (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
  memory TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_memory_user ON ai_memory(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_memory_created ON ai_memory(created_at);

COMMENT ON TABLE ai_memory IS 'Persistent per-user memories for Drishti AI chat';
COMMENT ON COLUMN ai_memory.user_id IS 'Foreign key to users table';
COMMENT ON COLUMN ai_memory.memory IS 'The memory text saved by the user';
COMMENT ON COLUMN ai_memory.created_at IS 'When the memory was saved';
