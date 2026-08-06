-- ============================================
-- Drishti Sentinel — Setup SQL Script
-- Run this in Supabase SQL Editor
-- ============================================

-- Create service_catalog table
CREATE TABLE IF NOT EXISTS service_catalog (
  id BIGSERIAL PRIMARY KEY,
  service_id VARCHAR(50) UNIQUE NOT NULL,
  display_name VARCHAR(100) NOT NULL,
  description TEXT,
  category VARCHAR(50),
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Insert 15 services
INSERT INTO service_catalog (service_id, display_name, description, category, is_default) VALUES
  ('core_monitoring', 'Core Monitoring', 'Website activity logging and form tracking', 'core', TRUE),
  ('ddos_protection', 'DDoS Protection', 'Real-time attack detection and Cloudflare mitigation', 'security', TRUE),
  ('ai_assistant', 'Drishti AI Chat', 'Text-based AI assistant with threat analysis', 'ai', TRUE),
  ('voice_assistant', 'Drishti Sentinel (Voice)', 'Voice commands and alert reading', 'premium', FALSE),
  ('dark_web_monitoring', 'Dark Web Monitoring', 'Breach and credential monitoring (HIBP + Telegram)', 'premium', FALSE),
  ('attack_surface', 'Attack Surface Monitoring', 'Subdomain, port, SSL certificate discovery', 'premium', FALSE),
  ('vulnerability_scanner', 'Vulnerability Scanner', 'Weekly CVE scanning and remediation suggestions', 'security', FALSE),
  ('compliance_pack', 'Compliance Pack', 'CERT-In, DPDP, GDPR automated reports', 'compliance', FALSE),
  ('white_label', 'White-Label', 'Remove Drishti branding from dashboard', 'premium', FALSE),
  ('client_portal', 'Client Portal', 'Separate login for end-clients (reseller mode)', 'premium', FALSE),
  ('soar_runbooks', 'SOAR Automation', 'Custom rule engines and auto-remediation', 'premium', FALSE),
  ('phishing_simulation', 'Phishing Simulation', 'Employee training campaigns', 'security', FALSE),
  ('mobile_app', 'Mobile App', 'iOS/Android app access', 'premium', FALSE),
  ('api_access', 'Full API Access', 'API tokens for external integration', 'premium', FALSE),
  ('sla_support', 'Priority Support', '8x5 or 24x7 support access', 'support', FALSE)
ON CONFLICT (service_id) DO NOTHING;

-- Create client_services table
CREATE TABLE IF NOT EXISTS client_services (
  id BIGSERIAL PRIMARY KEY,
  website_id BIGINT REFERENCES websites(id) ON DELETE CASCADE,
  service_id VARCHAR(50) REFERENCES service_catalog(service_id) ON DELETE CASCADE,
  enabled BOOLEAN DEFAULT FALSE,
  enabled_by VARCHAR(100),
  enabled_at TIMESTAMP DEFAULT NOW(),
  disabled_by VARCHAR(100),
  disabled_at TIMESTAMP,
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(website_id, service_id)
);

-- Create voice_settings table
CREATE TABLE IF NOT EXISTS voice_settings (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
  website_id BIGINT REFERENCES websites(id) ON DELETE CASCADE,
  wake_word VARCHAR(50) DEFAULT 'Drishti',
  voice_gender VARCHAR(20) DEFAULT 'female',
  voice_language VARCHAR(10) DEFAULT 'en-IN',
  speech_rate DECIMAL(3,2) DEFAULT 1.0,
  speech_pitch DECIMAL(3,2) DEFAULT 1.0,
  auto_read_alerts BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, website_id)
);

-- Create voice_sessions table
CREATE TABLE IF NOT EXISTS voice_sessions (
  id BIGSERIAL PRIMARY KEY,
  session_id UUID DEFAULT gen_random_uuid(),
  user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
  website_id BIGINT REFERENCES websites(id) ON DELETE CASCADE,
  transcript TEXT,
  ai_response TEXT,
  command_executed VARCHAR(100),
  command_result JSONB,
  duration_seconds INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create voice_alerts table
CREATE TABLE IF NOT EXISTS voice_alerts (
  id BIGSERIAL PRIMARY KEY,
  website_id BIGINT REFERENCES websites(id) ON DELETE CASCADE,
  event_id BIGINT,
  alert_type VARCHAR(50),
  severity VARCHAR(20),
  title TEXT,
  message TEXT,
  read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP,
  read_by VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_service_catalog_service_id ON service_catalog(service_id);
CREATE INDEX IF NOT EXISTS idx_service_catalog_category ON service_catalog(category);
CREATE INDEX IF NOT EXISTS idx_client_services_website ON client_services(website_id);
CREATE INDEX IF NOT EXISTS idx_client_services_service ON client_services(service_id);
CREATE INDEX IF NOT EXISTS idx_client_services_enabled ON client_services(enabled);
CREATE INDEX IF NOT EXISTS idx_voice_settings_user ON voice_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_voice_settings_website ON voice_settings(website_id);
CREATE INDEX IF NOT EXISTS idx_voice_sessions_user ON voice_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_voice_sessions_website ON voice_sessions(website_id);
CREATE INDEX IF NOT EXISTS idx_voice_sessions_created ON voice_sessions(created_at);
CREATE INDEX IF NOT EXISTS idx_voice_alerts_website ON voice_alerts(website_id);
CREATE INDEX IF NOT EXISTS idx_voice_alerts_severity ON voice_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_voice_alerts_created ON voice_alerts(created_at);
CREATE INDEX IF NOT EXISTS idx_voice_alerts_read ON voice_alerts(read);

-- Enable voice_assistant for all existing websites
INSERT INTO client_services (website_id, service_id, enabled, enabled_by, enabled_at)
SELECT id, 'voice_assistant', TRUE, 'system', NOW()
FROM websites
WHERE status = 'active'
  AND NOT EXISTS (
    SELECT 1 FROM client_services cs 
    WHERE cs.website_id = websites.id 
      AND cs.service_id = 'voice_assistant'
  );

-- Update default assistant settings
INSERT INTO assistant_settings (setting_key, setting_value) VALUES
  ('sentinel_enabled', '{"enabled": true, "voice_enabled": true, "service_control": true}'),
  ('client_service_defaults', '{"core_monitoring": true, "ddos_protection": true, "ai_assistant": true}')
ON CONFLICT (setting_key) DO NOTHING;

-- Done!
SELECT '✅ Drishti Sentinel setup complete!' as status;
-- ✅ Drishti Sentinel setup complete!
-- 
-- Next steps:
-- 1. The backend and frontend will auto-deploy to Render/Vercel
-- 2. Go to your Drishti Kavach dashboard
-- 3. Click on the floating microphone button (bottom-right)
-- 4. Speak: "Hey Drishti, what are you doing?"
--
-- 🎤 Voice Assistant Features:
-- - Push-to-talk (hold button while speaking)
-- - AI-powered natural language commands
-- - Real-time text-to-speech response
-- - 24/7 alert awareness
--
-- 🔐 Service Provisioning:
-- - Go to Admin → Sentinel
-- - Enable/disable services per client
-- - Apply starter/pro/enterprise packs