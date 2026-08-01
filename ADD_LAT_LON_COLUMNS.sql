-- Add latitude and longitude columns to user_sessions table
-- Run this in your Supabase SQL editor

ALTER TABLE user_sessions
  ADD COLUMN IF NOT EXISTS latitude  DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;
