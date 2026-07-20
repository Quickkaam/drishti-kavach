-- ============================================
-- Drishti Kavach -- Grant Logging Table Permissions
-- Run this in Supabase SQL Editor
-- ============================================

-- Grant authenticated users insert permissions for logging tables
GRANT INSERT, SELECT ON login_logs TO authenticated;
GRANT INSERT, SELECT ON error_logs TO authenticated;
GRANT INSERT, SELECT ON system_audit_logs TO authenticated;

-- Grant service role full access
GRANT ALL PRIVILEGES ON login_logs TO service_role;
GRANT ALL PRIVILEGES ON error_logs TO service_role;
GRANT ALL PRIVILEGES ON system_audit_logs TO service_role;

-- Enable Row Level Security (RLS) if needed
-- ALTER TABLE login_logs ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE system_audit_logs ENABLE ROW LEVEL SECURITY;
