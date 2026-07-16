-- ============================================
-- Drishti Kavach — Multi-Tenant Indexes
-- Run this in Supabase SQL Editor
-- ============================================

-- ─── website_id indexes for fast filtering ───
CREATE INDEX IF NOT EXISTS idx_security_events_website ON security_events(website_id);
CREATE INDEX IF NOT EXISTS idx_ip_block_list_website ON ip_block_list(website_id);
CREATE INDEX IF NOT EXISTS idx_incidents_website ON incidents(website_id);
CREATE INDEX IF NOT EXISTS idx_form_submissions_website ON form_submissions(website_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_website ON audit_logs(website_id);
CREATE INDEX IF NOT EXISTS idx_ddos_events_website ON ddos_events(website_id);

-- ─── Composite indexes for common query patterns ───
CREATE INDEX IF NOT EXISTS idx_security_events_website_time ON security_events(website_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_incidents_website_status ON incidents(website_id, status);
CREATE INDEX IF NOT EXISTS idx_ip_block_list_website_active ON ip_block_list(website_id, is_active);

-- ─── Database health monitoring view ───
CREATE OR REPLACE VIEW db_health AS
SELECT
  schemaname,
  tablename,
  n_live_tup AS live_rows,
  n_dead_tup AS dead_rows,
  last_vacuum,
  last_autovacuum,
  last_analyze
FROM pg_stat_user_tables
ORDER BY n_live_tup DESC;

-- ─── Table size view ───
CREATE OR REPLACE VIEW table_sizes AS
SELECT
  table_name,
  pg_size_pretty(pg_total_relation_size('public.' || table_name)) AS total_size,
  pg_size_pretty(pg_relation_size('public.' || table_name)) AS table_size,
  pg_size_pretty(pg_indexes_size('public.' || table_name)) AS index_size
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY pg_total_relation_size('public.' || table_name) DESC;

-- ─── Slow events cleanup (auto-maintenance) ───
-- Keep last 90 days of events, delete older ones
-- Can be called manually or via pg_cron if enabled
CREATE OR REPLACE FUNCTION cleanup_old_events()
RETURNS void AS $$
BEGIN
  DELETE FROM security_events WHERE created_at < NOW() - INTERVAL '90 days';
  DELETE FROM ddos_events WHERE created_at < NOW() - INTERVAL '90 days';
  DELETE FROM audit_logs WHERE created_at < NOW() - INTERVAL '180 days';
  DELETE FROM ip_intel_cache WHERE cached_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;
