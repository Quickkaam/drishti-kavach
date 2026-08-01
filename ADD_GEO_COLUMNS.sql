-- Add location columns to user_sessions table
-- Run this in your Supabase SQL editor

ALTER TABLE user_sessions
  ADD COLUMN IF NOT EXISTS city         TEXT,
  ADD COLUMN IF NOT EXISTS country      TEXT,
  ADD COLUMN IF NOT EXISTS country_code TEXT,
  ADD COLUMN IF NOT EXISTS isp          TEXT,
  ADD COLUMN IF NOT EXISTS region       TEXT;

-- Index for country-based filtering
CREATE INDEX IF NOT EXISTS idx_user_sessions_country ON user_sessions(country);
