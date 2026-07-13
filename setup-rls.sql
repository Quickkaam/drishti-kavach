-- ============================================
-- Drishti Kavach — RLS Setup & Super Admin
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. Enable RLS on all tables
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE ddos_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE ddos_mitigations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ip_block_list ENABLE ROW LEVEL SECURITY;
ALTER TABLE ip_whitelist ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_searches ENABLE ROW LEVEL SECURITY;
ALTER TABLE ddos_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE websites ENABLE ROW LEVEL SECURITY;

-- 2. Create RLS policies for multi-tenant isolation
-- Users can view their own data
CREATE POLICY users_view_own ON users
  FOR SELECT USING (id = auth.uid());

-- Websites: users can view websites where they are the client
CREATE POLICY websites_view_own ON websites
  FOR SELECT USING (
    client_id IS NULL OR 
    client_id = (SELECT client_id FROM users WHERE users.id = auth.uid())
  );

-- Events: users can view events from their websites
CREATE POLICY events_view_own ON events
  FOR SELECT USING (
    website_id IS NULL OR
    website_id IN (SELECT id FROM websites WHERE client_id = (SELECT client_id FROM users WHERE users.id = auth.uid()))
  );

-- Security events
CREATE POLICY security_view_own ON security_events
  FOR SELECT USING (
    website_id IS NULL OR
    website_id IN (SELECT id FROM websites WHERE client_id = (SELECT client_id FROM users WHERE users.id = auth.uid()))
  );

-- Form submissions
CREATE POLICY forms_view_own ON form_submissions
  FOR SELECT USING (
    website_id IS NULL OR
    website_id IN (SELECT id FROM websites WHERE client_id = (SELECT client_id FROM users WHERE users.id = auth.uid()))
  );

-- Audit logs (admin only)
CREATE POLICY audit_view_admin ON audit_logs
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'super_admin')
  );

-- 3. Create super admin user
-- Password: Coco@22/07/2001
-- Generated with: bcrypt.hash('Coco@22/07/2001', 12)
-- Email: whitehatwolf@quickkaam.in
-- Email hash (SHA-512): a7bd204204728b0acdd2ad60d2586bcd5aeb03b57a711d4395d1d2cf519e64b6bd5bb794cb7351e70b999aa6381660bae4c9df7ca5732fc2f5dc9b1039a4ac28
INSERT INTO users (
  username, 
  password_hash, 
  password_salt, 
  password_iterations,
  password_algorithm,
  email_hash, 
  role, 
  is_active,
  requires_password_change
) VALUES (
  'whitehatwolf',
  '$2a$12$SC6mEeJ1unwOPoJ8RD8F9OmMm71q2EU2JPWh6zlTjTJFs1Y0xqEGG',
  'SC6mEeJ1unwOPoJ8RD8F9O',
  100000,
  'bcrypt',
  'a7bd204204728b0acdd2ad60d2586bcd5aeb03b57a711d4395d1d2cf519e64b6bd5bb794cb7351e70b999aa6381660bae4c9df7ca5732fc2f5dc9b1039a4ac28',
  'super_admin',
  true,
  false
) ON CONFLICT (email_hash) DO NOTHING;

-- 4. Add Quick Kaam website
-- API Key: e8cc3c520ac491964ae44f7730860b1d8ae069dac422993dc8c3926a7af06892
-- API Key Hash (SHA-512): 274df2596a7e32d07ecb3df66ba7da6cec766035693a54df482afc87dc30f0f71905bb77b53a7215fc00fbec744e7e8a693a6a87996f385c0783864e38fbf33e
-- Note: api_key_encrypted should be AES-256-GCM encrypted JSON
-- To encrypt: encryptString('{"key": "e8cc3c520ac491964ae44f7730860b1d8ae069dac422993dc8c3926a7af06892"}')
-- Using ENCRYPTION_KEY from .env: Bk}i/pxnHY]s:p0)L7Iqkk#+6U*@T=ya1N;K1uVD
INSERT INTO websites (
  name, 
  domain, 
  status,
  api_key_hash,
  api_key_encrypted,
  settings
) VALUES (
  'Quick Kaam',
  'quickkaam.in',
  'active',
  '274df2596a7e32d07ecb3df66ba7da6cec766035693a54df482afc87dc30f0f71905bb77b53a7215fc00fbec744e7e8a693a6a87996f385c0783864e38fbf33e',
  '{"data":"...","iv":"...","authTag":"...","algorithm":"aes-256-gcm"}', -- AES encrypted API key
  '{
    "cloudflare_zone_id": null,
    "monitoring_enabled": true,
    "ddos_protection_enabled": true,
    "auto_block_enabled": true,
    "report_recipients": [],
    "alert_channels": ["slack", "email"]
  }'
) ON CONFLICT (domain) DO NOTHING;

-- 5. Create AI settings if not exists
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

-- 6. Create initial IP intel cache entries (optional)
-- This caches common IP data to reduce API calls
INSERT INTO ip_intel_cache (ip, country, threat_score, cached_at)
VALUES 
  ('127.0.0.1', 'Localhost', 0, NOW()),
  ('::1', 'Localhost', 0, NOW())
ON CONFLICT (ip) DO NOTHING;

-- 7. Grant necessary permissions to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- 8. Enable pgcrypto extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pgcrypto;