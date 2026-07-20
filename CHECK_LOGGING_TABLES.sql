-- Check if logging tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('login_logs', 'error_logs', 'system_audit_logs');
-- Check table structure
SELECT * FROM login_logs LIMIT 1;
-- Check row count
SELECT COUNT(*) as count FROM login_logs;
