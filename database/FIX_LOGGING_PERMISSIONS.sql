-- ============================================
-- Drishti Kavach — Fix ALL Logging Permissions
-- Run this in Supabase SQL Editor
-- ============================================

-- Step 1: Drop existing tables if there are issues, then recreate
-- WARNING: This will delete existing log data. Comment out if you want to preserve data.

-- First, let's check if tables exist and drop RLS policies
DO $$
BEGIN
  -- Disable RLS on all logging tables
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'login_logs') THEN
    ALTER TABLE login_logs DISABLE ROW LEVEL SECURITY;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'error_logs') THEN
    ALTER TABLE error_logs DISABLE ROW LEVEL SECURITY;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'system_audit_logs') THEN
    ALTER TABLE system_audit_logs DISABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Step 2: Create tables if they don't exist
CREATE TABLE IF NOT EXISTS login_logs (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
  email VARCHAR(255),
  email_hash VARCHAR(128),
  ip_address INET,
  location JSONB,
  user_agent TEXT,
  success BOOLEAN DEFAULT FALSE,
  failure_reason VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS error_logs (
  id BIGSERIAL PRIMARY KEY,
  website_id BIGINT REFERENCES websites(id) ON DELETE SET NULL,
  level VARCHAR(20),
  error_type VARCHAR(100),
  message TEXT,
  stack_trace TEXT,
  context JSONB,
  ip_address INET,
  user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS system_audit_logs (
  id BIGSERIAL PRIMARY KEY,
  action VARCHAR(100),
  entity_type VARCHAR(50),
  entity_id BIGINT,
  changed_by VARCHAR(100),
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Step 3: Create indexes
CREATE INDEX IF NOT EXISTS idx_login_logs_user_id ON login_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_login_logs_email_hash ON login_logs(email_hash);
CREATE INDEX IF NOT EXISTS idx_login_logs_ip_address ON login_logs(ip_address);
CREATE INDEX IF NOT EXISTS idx_login_logs_created ON login_logs(created_at);

CREATE INDEX IF NOT EXISTS idx_error_logs_level ON error_logs(level);
CREATE INDEX IF NOT EXISTS idx_error_logs_created ON error_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_error_logs_website ON error_logs(website_id);

CREATE INDEX IF NOT EXISTS idx_system_audit_created ON system_audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_system_audit_entity ON system_audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_system_audit_action ON system_audit_logs(action);

-- Step 4: Grant ALL permissions to service_role (backend uses this)
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- Step 5: Grant permissions to authenticated role (for direct frontend access if needed)
GRANT SELECT, INSERT ON login_logs TO authenticated;
GRANT SELECT, INSERT ON error_logs TO authenticated;
GRANT SELECT, INSERT ON system_audit_logs TO authenticated;

-- Step 6: Grant to postgres superuser
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO postgres;

-- Step 7: Ensure RLS is DISABLED for these tables (service_role bypasses RLS anyway)
-- But let's be explicit
ALTER TABLE login_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE error_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE system_audit_logs DISABLE ROW LEVEL SECURITY;

-- Step 8: If you want RLS enabled, use these policies instead
-- These policies allow service_role to do everything
-- Uncomment if you want RLS enabled:
/*
ALTER TABLE login_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_audit_logs ENABLE ROW LEVEL SECURITY;

-- Service role bypasses RLS by default, but let's create policies for authenticated users
CREATE POLICY "Allow all for authenticated on login_logs" ON login_logs
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
  
CREATE POLICY "Allow all for authenticated on error_logs" ON error_logs
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
  
CREATE POLICY "Allow all for authenticated on system_audit_logs" ON system_audit_logs
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
*/

-- Step 9: Verify the setup
SELECT 
  'login_logs' as table_name,
  (SELECT COUNT(*) FROM login_logs) as row_count,
  (SELECT relname FROM pg_class WHERE relname = 'login_logs') as exists
UNION ALL
SELECT 
  'error_logs' as table_name,
  (SELECT COUNT(*) FROM error_logs) as row_count,
  (SELECT relname FROM pg_class WHERE relname = 'error_logs') as exists
UNION ALL
SELECT 
  'system_audit_logs' as table_name,
  (SELECT COUNT(*) FROM system_audit_logs) as row_count,
  (SELECT relname FROM pg_class WHERE relname = 'system_audit_logs') as exists;

-- Step 10: Show current permissions
SELECT 
  grantee, 
  table_name, 
  privilege_type 
FROM information_schema.table_privileges 
WHERE table_name IN ('login_logs', 'error_logs', 'system_audit_logs')
ORDER BY table_name, grantee;
