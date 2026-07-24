-- ============================================
-- Drishti Kavach — Complete System Setup
-- Run this in Supabase SQL Editor
-- ============================================

-- ─── PART 1: FIX LOGGING PERMISSIONS ───────────────────────────────
DROP POLICY IF EXISTS "Allow all for authenticated" ON login_logs;
DROP POLICY IF EXISTS "Allow all for authenticated" ON error_logs;
DROP POLICY IF EXISTS "Allow all for authenticated" ON system_audit_logs;
DROP POLICY IF EXISTS "Allow service_role all access" ON login_logs;
DROP POLICY IF EXISTS "Allow service_role all access" ON error_logs;
DROP POLICY IF EXISTS "Allow service_role all access" ON system_audit_logs;
DROP POLICY IF EXISTS "Allow anon all access" ON login_logs;
DROP POLICY IF EXISTS "Allow anon all access" ON error_logs;
DROP POLICY IF EXISTS "Allow anon all access" ON system_audit_logs;

ALTER TABLE login_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE error_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE system_audit_logs DISABLE ROW LEVEL SECURITY;

GRANT ALL PRIVILEGES ON TABLE login_logs TO service_role, authenticated, anon, postgres;
GRANT ALL PRIVILEGES ON TABLE error_logs TO service_role, authenticated, anon, postgres;
GRANT ALL PRIVILEGES ON TABLE system_audit_logs TO service_role, authenticated, anon, postgres;

GRANT USAGE, SELECT ON SEQUENCE login_logs_id_seq TO service_role, authenticated, anon;
GRANT USAGE, SELECT ON SEQUENCE error_logs_id_seq TO service_role, authenticated, anon;
GRANT USAGE, SELECT ON SEQUENCE system_audit_logs_id_seq TO service_role, authenticated, anon;

ALTER TABLE login_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_audit_logs ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  DROP POLICY IF EXISTS "service_role_all_access" ON login_logs;
  DROP POLICY IF EXISTS "service_role_all_access" ON error_logs;
  DROP POLICY IF EXISTS "service_role_all_access" ON system_audit_logs;
  DROP POLICY IF EXISTS "authenticated_all_access" ON login_logs;
  DROP POLICY IF EXISTS "authenticated_all_access" ON error_logs;
  DROP POLICY IF EXISTS "authenticated_all_access" ON system_audit_logs;
  DROP POLICY IF EXISTS "anon_all_access" ON login_logs;
  DROP POLICY IF EXISTS "anon_all_access" ON error_logs;
  DROP POLICY IF EXISTS "anon_all_access" ON system_audit_logs;
  
  CREATE POLICY "service_role_all_access" ON login_logs FOR ALL TO service_role USING (true) WITH CHECK (true);
  CREATE POLICY "service_role_all_access" ON error_logs FOR ALL TO service_role USING (true) WITH CHECK (true);
  CREATE POLICY "service_role_all_access" ON system_audit_logs FOR ALL TO service_role USING (true) WITH CHECK (true);
  CREATE POLICY "authenticated_all_access" ON login_logs FOR ALL TO authenticated USING (true) WITH CHECK (true);
  CREATE POLICY "authenticated_all_access" ON error_logs FOR ALL TO authenticated USING (true) WITH CHECK (true);
  CREATE POLICY "authenticated_all_access" ON system_audit_logs FOR ALL TO authenticated USING (true) WITH CHECK (true);
  CREATE POLICY "anon_all_access" ON login_logs FOR ALL TO anon USING (true) WITH CHECK (true);
  CREATE POLICY "anon_all_access" ON error_logs FOR ALL TO anon USING (true) WITH CHECK (true);
  CREATE POLICY "anon_all_access" ON system_audit_logs FOR ALL TO anon USING (true) WITH CHECK (true);
END $$;

-- ─── PART 2: CREATE NOTIFICATION TABLES ────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) NOT NULL DEFAULT 'info',
  severity VARCHAR(20) DEFAULT 'info',
  category VARCHAR(50),
  reference_type VARCHAR(50),
  reference_id BIGINT,
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS notification_preferences (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  email_security BOOLEAN DEFAULT TRUE,
  email_ddos BOOLEAN DEFAULT TRUE,
  email_login BOOLEAN DEFAULT TRUE,
  email_system BOOLEAN DEFAULT TRUE,
  email_ai BOOLEAN DEFAULT TRUE,
  email_incidents BOOLEAN DEFAULT TRUE,
  email_forms BOOLEAN DEFAULT TRUE,
  inapp_security BOOLEAN DEFAULT TRUE,
  inapp_ddos BOOLEAN DEFAULT TRUE,
  inapp_login BOOLEAN DEFAULT TRUE,
  inapp_system BOOLEAN DEFAULT TRUE,
  inapp_ai BOOLEAN DEFAULT TRUE,
  inapp_incidents BOOLEAN DEFAULT TRUE,
  inapp_forms BOOLEAN DEFAULT TRUE,
  slack_security BOOLEAN DEFAULT TRUE,
  slack_ddos BOOLEAN DEFAULT TRUE,
  slack_login BOOLEAN DEFAULT FALSE,
  slack_system BOOLEAN DEFAULT TRUE,
  slack_ai BOOLEAN DEFAULT FALSE,
  slack_incidents BOOLEAN DEFAULT TRUE,
  slack_forms BOOLEAN DEFAULT FALSE,
  telegram_security BOOLEAN DEFAULT TRUE,
  telegram_ddos BOOLEAN DEFAULT TRUE,
  telegram_login BOOLEAN DEFAULT FALSE,
  telegram_system BOOLEAN DEFAULT TRUE,
  telegram_ai BOOLEAN DEFAULT FALSE,
  telegram_incidents BOOLEAN DEFAULT TRUE,
  telegram_forms BOOLEAN DEFAULT FALSE,
  min_email_severity VARCHAR(20) DEFAULT 'low',
  min_slack_severity VARCHAR(20) DEFAULT 'medium',
  min_telegram_severity VARCHAR(20) DEFAULT 'medium',
  min_inapp_severity VARCHAR(20) DEFAULT 'info',
  quiet_hours_enabled BOOLEAN DEFAULT FALSE,
  quiet_hours_start TIME DEFAULT '22:00',
  quiet_hours_end TIME DEFAULT '08:00',
  quiet_hours_tz VARCHAR(50) DEFAULT 'UTC',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, is_read) WHERE is_read = FALSE;
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_category ON notifications(category);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_reference ON notifications(reference_type, reference_id);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_notifications" ON notifications FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_preferences" ON notification_preferences FOR ALL TO service_role USING (true) WITH CHECK (true);

GRANT ALL PRIVILEGES ON notifications TO service_role, authenticated, anon;
GRANT ALL PRIVILEGES ON notification_preferences TO service_role, authenticated, anon;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role, authenticated;

-- ─── PART 3: CREATE ANALYTICS TABLES ───────────────────────────────
CREATE TABLE IF NOT EXISTS user_sessions (
  id BIGSERIAL PRIMARY KEY,
  website_id BIGINT REFERENCES websites(id) ON DELETE CASCADE,
  session_id UUID NOT NULL,
  user_ip INET,
  user_agent TEXT,
  referrer TEXT,
  landing_page TEXT,
  pages_visited INTEGER DEFAULT 0,
  total_duration INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  started_at TIMESTAMP DEFAULT NOW(),
  ended_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS page_views (
  id BIGSERIAL PRIMARY KEY,
  website_id BIGINT REFERENCES websites(id) ON DELETE CASCADE,
  session_id UUID,
  page_url TEXT,
  page_title VARCHAR(255),
  referrer TEXT,
  duration INTEGER DEFAULT 0,
  scroll_depth INTEGER DEFAULT 0,
  user_ip INET,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_interactions (
  id BIGSERIAL PRIMARY KEY,
  website_id BIGINT REFERENCES websites(id) ON DELETE CASCADE,
  session_id UUID,
  interaction_type VARCHAR(50),
  page_url TEXT,
  element_id VARCHAR(255),
  element_class VARCHAR(255),
  element_type VARCHAR(50),
  interaction_data JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS geographic_data (
  id BIGSERIAL PRIMARY KEY,
  website_id BIGINT REFERENCES websites(id) ON DELETE CASCADE,
  country_code VARCHAR(2),
  country_name VARCHAR(100),
  region VARCHAR(100),
  city VARCHAR(100),
  visitor_count INTEGER DEFAULT 0,
  last_updated TIMESTAMP DEFAULT NOW(),
  UNIQUE(website_id, country_code, city)
);

CREATE TABLE IF NOT EXISTS device_analytics (
  id BIGSERIAL PRIMARY KEY,
  website_id BIGINT REFERENCES websites(id) ON DELETE CASCADE,
  device_type VARCHAR(20),
  browser VARCHAR(50),
  os VARCHAR(50),
  visitor_count INTEGER DEFAULT 0,
  last_updated TIMESTAMP DEFAULT NOW(),
  UNIQUE(website_id, device_type, browser, os)
);

CREATE INDEX IF NOT EXISTS idx_sessions_website_id ON user_sessions(website_id);
CREATE INDEX IF NOT EXISTS idx_sessions_session_id ON user_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_sessions_started ON user_sessions(started_at);
CREATE INDEX IF NOT EXISTS idx_sessions_active ON user_sessions(is_active);
CREATE INDEX IF NOT EXISTS idx_pageviews_website_id ON page_views(website_id);
CREATE INDEX IF NOT EXISTS idx_pageviews_created ON page_views(created_at);
CREATE INDEX IF NOT EXISTS idx_pageviews_url ON page_views(page_url);
CREATE INDEX IF NOT EXISTS idx_pageviews_session ON page_views(session_id);
CREATE INDEX IF NOT EXISTS idx_geo_website_id ON geographic_data(website_id);
CREATE INDEX IF NOT EXISTS idx_geo_country ON geographic_data(country_code);
CREATE INDEX IF NOT EXISTS idx_device_website_id ON device_analytics(website_id);

ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE page_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE geographic_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE device_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_user_sessions" ON user_sessions FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_page_views" ON page_views FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_geographic_data" ON geographic_data FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_device_analytics" ON device_analytics FOR ALL TO service_role USING (true) WITH CHECK (true);

GRANT ALL PRIVILEGES ON user_sessions TO service_role, authenticated;
GRANT ALL PRIVILEGES ON page_views TO service_role, authenticated;
GRANT ALL PRIVILEGES ON geographic_data TO service_role, authenticated;
GRANT ALL PRIVILEGES ON device_analytics TO service_role, authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role, authenticated;

-- ─── PART 4: CREATE MITRE TABLES ───────────────────────────────────
CREATE TABLE IF NOT EXISTS mitre_techniques (
  id BIGSERIAL PRIMARY KEY,
  technique_id VARCHAR(20) UNIQUE NOT NULL,
  technique_name VARCHAR(255),
  tactic VARCHAR(100),
  description TEXT,
  severity VARCHAR(20) DEFAULT 'medium',
  remediation TEXT,
  mitre_url TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS website_mitre_mappings (
  id BIGSERIAL PRIMARY KEY,
  website_id BIGINT REFERENCES websites(id) ON DELETE CASCADE,
  technique_id VARCHAR(20) REFERENCES mitre_techniques(technique_id),
  detected_at TIMESTAMP DEFAULT NOW(),
  last_seen TIMESTAMP DEFAULT NOW(),
  count INTEGER DEFAULT 1,
  is_resolved BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMP,
  resolved_by VARCHAR(100)
);

CREATE INDEX IF NOT EXISTS idx_mitre_technique_id ON mitre_techniques(technique_id);
CREATE INDEX IF NOT EXISTS idx_mitre_tactic ON mitre_techniques(tactic);
CREATE INDEX IF NOT EXISTS idx_mitre_mappings_website_id ON website_mitre_mappings(website_id);
CREATE INDEX IF NOT EXISTS idx_mitre_mappings_technique_id ON website_mitre_mappings(technique_id);
CREATE INDEX IF NOT EXISTS idx_mitre_mappings_resolved ON website_mitre_mappings(is_resolved);

ALTER TABLE mitre_techniques ENABLE ROW LEVEL SECURITY;
ALTER TABLE website_mitre_mappings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_mitre" ON mitre_techniques FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_mitre_mappings" ON website_mitre_mappings FOR ALL TO service_role USING (true) WITH CHECK (true);

GRANT ALL PRIVILEGES ON mitre_techniques TO service_role, authenticated;
GRANT ALL PRIVILEGES ON website_mitre_mappings TO service_role, authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role, authenticated;

-- Seed MITRE techniques
INSERT INTO mitre_techniques (technique_id, technique_name, tactic, description, severity, remediation, mitre_url) VALUES
('T1595', 'Active Scanning', 'Reconnaissance', 'Adversaries may execute active reconnaissance scans.', 'medium', 'Monitor network traffic for scan patterns.', 'https://attack.mitre.org/techniques/T1595'),
('T1190', 'Exploit Public-Facing Application', 'Initial Access', 'Adversaries may attempt to exploit a weakness in an Internet-facing host.', 'critical', 'Update application to latest version.', 'https://attack.mitre.org/techniques/T1190'),
('T1189', 'Drive-by Compromise', 'Initial Access', 'Adversaries may gain access through a user visiting a website.', 'high', 'Implement CSP headers.', 'https://attack.mitre.org/techniques/T1189'),
('T1566', 'Phishing', 'Initial Access', 'Adversaries may send phishing messages to gain access.', 'high', 'Enable MFA on all accounts.', 'https://attack.mitre.org/techniques/T1566'),
('T1059', 'Command and Scripting Interpreter', 'Execution', 'Adversaries may abuse command and script interpreters.', 'high', 'Apply application whitelisting.', 'https://attack.mitre.org/techniques/T1059'),
('T1110', 'Brute Force', 'Credential Access', 'Adversaries may use brute force techniques to gain access.', 'high', 'Enforce MFA. Implement account lockout policies.', 'https://attack.mitre.org/techniques/T1110'),
('T1071', 'Application Layer Protocol', 'Command and Control', 'Adversaries may communicate using OSI application layer protocols.', 'high', 'Inspect and filter web traffic.', 'https://attack.mitre.org/techniques/T1071'),
('T1485', 'Data Destruction', 'Impact', 'Adversaries may destroy data and files on specific systems.', 'critical', 'Implement immutable backups.', 'https://attack.mitre.org/techniques/T1485')
ON CONFLICT (technique_id) DO NOTHING;

-- ─── SUCCESS VERIFICATION ──────────────────────────────────────────
SELECT '✅ PART 1: Logging permissions fixed' as status;
SELECT '✅ PART 2: Notifications tables created' as status;
SELECT '✅ PART 3: Analytics tables created' as status;
SELECT '✅ PART 4: MITRE tables created' as status;

SELECT COUNT(*) as user_sessions_count FROM user_sessions;
SELECT COUNT(*) as page_views_count FROM page_views;
SELECT COUNT(*) as notifications_count FROM notifications;
SELECT COUNT(*) as mitre_techniques_count FROM mitre_techniques;
