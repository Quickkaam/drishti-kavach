-- ============================================
-- Drishti Kavach — Add website_id to users table
-- Run this in Supabase SQL Editor
-- ============================================

-- Add website_id column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS website_id BIGINT REFERENCES websites(id) ON DELETE SET NULL;

-- Update existing users with website_id (default to website 1 for all)
UPDATE users SET website_id = 1 WHERE website_id IS NULL;

-- Create index for website_id
CREATE INDEX IF NOT EXISTS idx_users_website_id ON users(website_id);

-- Update RLS policies
DROP POLICY IF EXISTS "users_own_data" ON users;

-- Allow users to see their own data
CREATE POLICY "users_own_data" ON users
  FOR ALL TO authenticated
  USING (id = (SELECT id FROM users WHERE email_hash = auth.jwt()->>'email_hash'))
  WITH CHECK (id = (SELECT id FROM users WHERE email_hash = auth.jwt()->>'email_hash'));

-- Allow superadmin to see all users
CREATE POLICY "superadmin_all_users" ON users
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM users u 
    WHERE u.id = (SELECT id FROM users WHERE email_hash = auth.jwt()->>'email_hash')
    AND u.role = 'superadmin'
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM users u 
    WHERE u.id = (SELECT id FROM users WHERE email_hash = auth.jwt()->>'email_hash')
    AND u.role = 'superadmin'
  ));

SELECT '✅ website_id column added to users table!' as status;
