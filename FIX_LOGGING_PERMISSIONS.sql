-- ============================================
-- Drishti Kavach — Fix Logging Tables Permissions
-- Run this in Supabase SQL Editor
-- This fixes: permission denied for table login_logs
-- ============================================

-- ─── 1. DROP EXISTING POLICIES IF THEY EXIST ─────────────────────────
DROP POLICY IF EXISTS "Allow all for authenticated" ON login_logs;
DROP POLICY IF EXISTS "Allow all for authenticated" ON error_logs;
DROP POLICY IF EXISTS "Allow all for authenticated" ON system_audit_logs;
DROP POLICY IF EXISTS "Allow service_role all access" ON login_logs;
DROP POLICY IF EXISTS "Allow service_role all access" ON error_logs;
DROP POLICY IF EXISTS "Allow service_role all access" ON system_audit_logs;
DROP POLICY IF EXISTS "Allow anon all access" ON login_logs;
DROP POLICY IF EXISTS "Allow anon all access" ON error_logs;
DROP POLICY IF EXISTS "Allow anon all access" ON system_audit_logs;

-- ─── 2. DISABLE RLS TEMPORARILY FOR SETUP ───────────────────────────
ALTER TABLE login_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE error_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE system_audit_logs DISABLE ROW LEVEL SECURITY;

-- ─── 3. GRANT ALL PRIVILEGES TO ROLES ───────────────────────────────
-- Grant to service_role (used by backend with SUPABASE_SERVICE_ROLE_KEY)
GRANT ALL PRIVILEGES ON TABLE login_logs TO service_role;
GRANT ALL PRIVILEGES ON TABLE error_logs TO service_role;
GRANT ALL PRIVILEGES ON TABLE system_audit_logs TO service_role;

-- Grant to authenticated role
GRANT ALL PRIVILEGES ON TABLE login_logs TO authenticated;
GRANT ALL PRIVILEGES ON TABLE error_logs TO authenticated;
GRANT ALL PRIVILEGES ON TABLE system_audit_logs TO authenticated;

-- Grant to anon role (for public access if needed)
GRANT ALL PRIVILEGES ON TABLE login_logs TO anon;
GRANT ALL PRIVILEGES ON TABLE error_logs TO anon;
GRANT ALL PRIVILEGES ON TABLE system_audit_logs TO anon;

-- Grant to postgres superuser
GRANT ALL PRIVILEGES ON TABLE login_logs TO postgres;
GRANT ALL PRIVILEGES ON TABLE error_logs TO postgres;
GRANT ALL PRIVILEGES ON TABLE system_audit_logs TO postgres;

-- ─── 4. GRANT SEQUENCE PERMISSIONS ──────────────────────────────────
GRANT USAGE, SELECT ON SEQUENCE login_logs_id_seq TO service_role;
GRANT USAGE, SELECT ON SEQUENCE login_logs_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE login_logs_id_seq TO anon;

GRANT USAGE, SELECT ON SEQUENCE error_logs_id_seq TO service_role;
GRANT USAGE, SELECT ON SEQUENCE error_logs_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE error_logs_id_seq TO anon;

GRANT USAGE, SELECT ON SEQUENCE system_audit_logs_id_seq TO service_role;
GRANT USAGE, SELECT ON SEQUENCE system_audit_logs_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE system_audit_logs_id_seq TO anon;

-- ─── 5. ENABLE RLS WITH PROPER POLICIES ─────────────────────────────
ALTER TABLE login_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_audit_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for service_role (backend uses this)
-- Using DO block to handle existing policies
DO $$
BEGIN
  -- Drop existing policies first
  DROP POLICY IF EXISTS "service_role_all_access" ON login_logs;
  DROP POLICY IF EXISTS "service_role_all_access" ON error_logs;
  DROP POLICY IF EXISTS "service_role_all_access" ON system_audit_logs;
  DROP POLICY IF EXISTS "authenticated_all_access" ON login_logs;
  DROP POLICY IF EXISTS "authenticated_all_access" ON error_logs;
  DROP POLICY IF EXISTS "authenticated_all_access" ON system_audit_logs;
  DROP POLICY IF EXISTS "anon_all_access" ON login_logs;
  DROP POLICY IF EXISTS "anon_all_access" ON error_logs;
  DROP POLICY IF EXISTS "anon_all_access" ON system_audit_logs;
  
  -- Create service_role policies
  CREATE POLICY "service_role_all_access" ON login_logs FOR ALL TO service_role USING (true) WITH CHECK (true);
  CREATE POLICY "service_role_all_access" ON error_logs FOR ALL TO service_role USING (true) WITH CHECK (true);
  CREATE POLICY "service_role_all_access" ON system_audit_logs FOR ALL TO service_role USING (true) WITH CHECK (true);
  
  -- Create authenticated policies
  CREATE POLICY "authenticated_all_access" ON login_logs FOR ALL TO authenticated USING (true) WITH CHECK (true);
  CREATE POLICY "authenticated_all_access" ON error_logs FOR ALL TO authenticated USING (true) WITH CHECK (true);
  CREATE POLICY "authenticated_all_access" ON system_audit_logs FOR ALL TO authenticated USING (true) WITH CHECK (true);
  
  -- Create anon policies
  CREATE POLICY "anon_all_access" ON login_logs FOR ALL TO anon USING (true) WITH CHECK (true);
  CREATE POLICY "anon_all_access" ON error_logs FOR ALL TO anon USING (true) WITH CHECK (true);
  CREATE POLICY "anon_all_access" ON system_audit_logs FOR ALL TO anon USING (true) WITH CHECK (true);
END $$;

-- ─── 6. VERIFY TABLES EXIST AND HAVE CORRECT STRUCTURE ──────────────
SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name AND table_schema = 'public') as column_count
FROM information_schema.tables t
WHERE table_schema = 'public'
AND table_name IN ('login_logs', 'error_logs', 'system_audit_logs');

-- ─── 7. VERIFY POLICIES ARE APPLIED ─────────────────────────────────
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename IN ('login_logs', 'error_logs', 'system_audit_logs')
ORDER BY tablename, policyname;

-- ─── SUCCESS MESSAGE ────────────────────────────────────────────────
SELECT '✅ Permissions fixed! Run this query to verify: SELECT * FROM login_logs LIMIT 1;' as status;
