-- =============================================
-- Drishti AI — Persistent Memory Table
-- Run this in your Supabase SQL Editor
-- =============================================

CREATE TABLE IF NOT EXISTS public.ai_memory (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL,
  memory      TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- Allow service_role full access
GRANT ALL ON public.ai_memory TO service_role;
GRANT ALL ON public.ai_memory TO authenticated;

-- Index for fast per-user lookups
CREATE INDEX IF NOT EXISTS ai_memory_user_id_idx ON public.ai_memory(user_id);
