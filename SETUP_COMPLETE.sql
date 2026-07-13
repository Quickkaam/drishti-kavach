-- ============================================
-- Drishti Kavach — Complete Setup Script
-- Run this in Supabase SQL Editor
-- ============================================

-- User 'whitehatwolf' and website 'quickkaam.in' already exist
-- This script adds AI settings and creates indexes

-- ============================================
-- AI SETTINGS
-- ============================================

INSERT INTO assistant_settings (setting_key, setting_value)
VALUES 
  ('guardian_mode', '{"enabled": true, "auto_block_threshold": 80}'),
  ('alert_channels', '["slack", "telegram", "email"]'),
  ('daily_summary_enabled', '{"enabled": true, "time": "08:00"}'),
  ('auto_investigate', '{"enabled": true, "min_severity": "medium"}'),
  ('ddos_thresholds', '{
    "traffic_spike_warning": 3,
    "traffic_spike_critical": 10,
    "ip_flood_warning": 100,
    "ip_flood_critical": 500,
    "botnet_ua_threshold": 50,
    "geo_spike_threshold": 70
  }')
ON CONFLICT (setting_key) DO NOTHING;

-- ============================================
-- INDEXES (if not already created)
-- ============================================

CREATE INDEX IF NOT EXISTS idx_events_timestamp ON events(timestamp);
CREATE INDEX IF NOT EXISTS idx_events_website_id ON events(website_id);
CREATE INDEX IF NOT EXISTS idx_events_type ON events(event_type);
CREATE INDEX IF NOT EXISTS idx_events_ip ON events(user_ip);

CREATE INDEX IF NOT EXISTS idx_security_timestamp ON security_events(created_at);
CREATE INDEX IF NOT EXISTS idx_security_website_id ON security_events(website_id);
CREATE INDEX IF NOT EXISTS idx_security_type ON security_events(event_type);
CREATE INDEX IF NOT EXISTS idx_security_severity ON security_events(severity);
CREATE INDEX IF NOT EXISTS idx_security_ip ON security_events(user_ip);

CREATE INDEX IF NOT EXISTS idx_forms_timestamp ON form_submissions(created_at);
CREATE INDEX IF NOT EXISTS idx_forms_website_id ON form_submissions(website_id);
CREATE INDEX IF NOT EXISTS idx_forms_status ON form_submissions(status);

CREATE INDEX IF NOT EXISTS idx_ddos_timestamp ON ddos_events(created_at);
CREATE INDEX IF NOT EXISTS idx_ddos_website_id ON ddos_events(website_id);
CREATE INDEX IF NOT EXISTS idx_ddos_status ON ddos_events(status);

CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_website_id ON audit_logs(website_id);

CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);

CREATE INDEX IF NOT EXISTS idx_websites_domain ON websites(domain);
CREATE INDEX IF NOT EXISTS idx_websites_status ON websites(status);

-- ============================================
-- GRANT PERMISSIONS (for authenticated users)
-- ============================================

-- Note: RLS is disabled, so we grant direct access
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- ============================================
-- ENABLE EXTENSIONS
-- ============================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";