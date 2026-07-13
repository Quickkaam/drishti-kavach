-- ============================================
-- Drishti Kavach — Complete Database Schema
-- दृष्टि कवच — The Vision Shield
-- Run this in your Supabase SQL editor
-- ============================================

-- IMPORTANT: This schema includes support for:
-- 1. Data compression (Brotli/Gzip) for large JSON fields
-- 2. Field-level encryption for sensitive data
-- 3. Storage optimization to minimize database space usage

-- ─── 0. COMPRESSION SUPPORT FUNCTIONS ─────────────────────────
-- Function to estimate compression savings
CREATE OR REPLACE FUNCTION estimate_compression_savings(data JSONB)
RETURNS JSONB AS $$
DECLARE
  original_size INTEGER;
  compressed_size INTEGER;
  compressed_data BYTEA;
BEGIN
  original_size = octet_length(data::text);
  
  -- Simple compression estimate (PostgreSQL doesn't have Brotli built-in)
  compressed_data = compress(data::text, 'gzip');
  compressed_size = octet_length(compressed_data);
  
  RETURN jsonb_build_object(
    'original_size', original_size,
    'estimated_compressed_size', compressed_size,
    'savings_percentage', ROUND((1 - compressed_size::decimal / original_size) * 100, 2),
    'bytes_saved', original_size - compressed_size
  );
END;
$$ LANGUAGE plpgsql;

-- Function to check if compression is beneficial
CREATE OR REPLACE FUNCTION should_compress_data(data JSONB, threshold_kb INTEGER DEFAULT 1)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN octet_length(data::text) > threshold_kb * 1024;
END;
$$ LANGUAGE plpgsql;

-- ─── 1. CLIENTS ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS clients (
  id BIGSERIAL PRIMARY KEY,
  company_name VARCHAR(255) NOT NULL,
  contact_name VARCHAR(255),
  contact_email VARCHAR(255) UNIQUE,
  contact_phone VARCHAR(50),
  plan VARCHAR(50) DEFAULT 'free',
  dashboard_url VARCHAR(255),
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(contact_email);

-- Add compression metadata tracking
ALTER TABLE clients ADD COLUMN IF NOT EXISTS storage_metadata JSONB DEFAULT '{}';
COMMENT ON COLUMN clients.storage_metadata IS 'Storage optimization metadata (compression ratios, encryption status)';

-- ─── 2. WEBSITES (Multi-Tenant) ───────────────────────────────
CREATE TABLE IF NOT EXISTS websites (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  domain VARCHAR(255) UNIQUE NOT NULL,
  client_id BIGINT REFERENCES clients(id) ON DELETE SET NULL,
  status VARCHAR(20) DEFAULT 'active',
  tracking_script_url VARCHAR(255),
  
  -- Encrypted API key (never store plain API keys)
  api_key_encrypted JSONB NOT NULL,
  api_key_hash VARCHAR(128) NOT NULL, -- For lookup without decryption
  
  settings JSONB DEFAULT '{
    "cloudflare_zone_id": null,
    "monitoring_enabled": true,
    "ddos_protection_enabled": true,
    "auto_block_enabled": true,
    "report_recipients": [],
    "alert_channels": ["slack", "email"]
  }',
  settings_compressed BYTEA, -- Optional compressed settings
  settings_algorithm VARCHAR(20), -- Compression algorithm used
  
  framework_detected VARCHAR(50),
  pages_detected INTEGER DEFAULT 0,
  
  -- Large JSON fields that benefit from compression
  ai_analysis_result_compressed BYTEA,
  ai_analysis_result_algorithm VARCHAR(20),
  
  created_at TIMESTAMP DEFAULT NOW(),
  last_seen_at TIMESTAMP,
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Storage optimization metadata
  storage_metadata JSONB DEFAULT '{
    "compression_enabled": true,
    "encryption_enabled": true,
    "last_optimized": null,
    "estimated_savings": 0
  }'
);
CREATE INDEX IF NOT EXISTS idx_websites_domain ON websites(domain);
CREATE INDEX IF NOT EXISTS idx_websites_client_id ON websites(client_id);
CREATE INDEX IF NOT EXISTS idx_websites_api_key_hash ON websites(api_key_hash);
CREATE INDEX IF NOT EXISTS idx_websites_status ON websites(status);

COMMENT ON COLUMN websites.api_key_encrypted IS 'Encrypted API key (AES-256-GCM)';
COMMENT ON COLUMN websites.api_key_hash IS 'SHA-512 hash of API key for lookup';
COMMENT ON COLUMN websites.settings_compressed IS 'Compressed settings (Brotli/Gzip)';
COMMENT ON COLUMN websites.ai_analysis_result_compressed IS 'Compressed AI analysis result';
COMMENT ON COLUMN websites.storage_metadata IS 'Storage optimization tracking';

-- ─── 3. USERS (RBAC) ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id BIGSERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  
  -- Securely stored password
  password_hash TEXT NOT NULL,
  password_salt VARCHAR(64) NOT NULL,
  password_iterations INTEGER DEFAULT 100000,
  password_algorithm VARCHAR(20) DEFAULT 'pbkdf2-sha256',
  
  -- Encrypted email for additional protection
  email_encrypted JSONB NOT NULL,
  email_hash VARCHAR(128) NOT NULL, -- For lookups without decryption
  
  role VARCHAR(20) DEFAULT 'viewer', -- admin, analyst, viewer, client, super_admin
  
  -- Security metadata
  mfa_enabled BOOLEAN DEFAULT FALSE,
  mfa_secret_encrypted JSONB,
  backup_codes_encrypted JSONB,
  
  -- Activity tracking
  created_at TIMESTAMP DEFAULT NOW(),
  last_login TIMESTAMP,
  last_login_ip INET,
  login_count INTEGER DEFAULT 0,
  failed_login_attempts INTEGER DEFAULT 0,
  account_locked_until TIMESTAMP,
  
  -- Security settings
  is_active BOOLEAN DEFAULT TRUE,
  requires_password_change BOOLEAN DEFAULT FALSE,
  session_timeout_minutes INTEGER DEFAULT 30,
  
  -- Storage optimization
  storage_metadata JSONB DEFAULT '{
    "encryption_enabled": true,
    "last_password_update": null,
    "security_level": "high"
  }'
);
CREATE INDEX IF NOT EXISTS idx_users_email_hash ON users(email_hash);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);
CREATE INDEX IF NOT EXISTS idx_users_last_login ON users(last_login);

COMMENT ON COLUMN users.password_hash IS 'PBKDF2 hash of password';
COMMENT ON COLUMN users.email_encrypted IS 'Encrypted email address';
COMMENT ON COLUMN users.email_hash IS 'SHA-512 hash of email for lookup';
COMMENT ON COLUMN users.mfa_secret_encrypted IS 'Encrypted MFA secret (if enabled)';

-- ─── 4. EVENTS ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS events (
  id BIGSERIAL PRIMARY KEY,
  website_id BIGINT REFERENCES websites(id) ON DELETE CASCADE,
  session_id UUID,
  event_type VARCHAR(30),
  page_url TEXT,
  event_data JSONB,
  user_ip INET,
  user_agent TEXT,
  referrer TEXT,
  country VARCHAR(100),
  city VARCHAR(100),
  timestamp TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_events_website_id ON events(website_id);
CREATE INDEX IF NOT EXISTS idx_events_timestamp ON events(timestamp);
CREATE INDEX IF NOT EXISTS idx_events_type ON events(event_type);
CREATE INDEX IF NOT EXISTS idx_events_ip ON events(user_ip);

-- ─── 5. FORM SUBMISSIONS ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS form_submissions (
  id BIGSERIAL PRIMARY KEY,
  website_id BIGINT REFERENCES websites(id) ON DELETE CASCADE,
  form_type VARCHAR(20),
  session_id UUID,
  user_ip INET,
  user_agent TEXT,
  data JSONB,
  email VARCHAR(255),
  name VARCHAR(255),
  phone VARCHAR(50),
  services TEXT,
  message TEXT,
  status VARCHAR(20) DEFAULT 'new', -- new, read, replied, spam
  created_at TIMESTAMP DEFAULT NOW(),
  read_at TIMESTAMP,
  replied_at TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_forms_website_id ON form_submissions(website_id);
CREATE INDEX IF NOT EXISTS idx_forms_status ON form_submissions(status);
CREATE INDEX IF NOT EXISTS idx_forms_email ON form_submissions(email);

-- ─── 6. SECURITY EVENTS (MITRE ATT&CK) ───────────────────────
CREATE TABLE IF NOT EXISTS security_events (
  id BIGSERIAL PRIMARY KEY,
  website_id BIGINT REFERENCES websites(id) ON DELETE CASCADE,
  event_type VARCHAR(50),       -- sqli, xss, honeypot, path_traversal, etc.
  severity VARCHAR(20),         -- low, medium, high, critical
  mitre_technique_id VARCHAR(20),
  mitre_tactic VARCHAR(50),
  user_ip INET,
  user_agent TEXT,
  session_id UUID,
  url TEXT,
  payload TEXT,
  details JSONB,
  is_blocked BOOLEAN DEFAULT FALSE,
  status VARCHAR(20) DEFAULT 'new', -- new, investigating, resolved, false_positive
  assigned_to VARCHAR(100),
  investigation_notes TEXT,
  resolution_notes TEXT,
  escalated_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  is_resolved BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_security_website_id ON security_events(website_id);
CREATE INDEX IF NOT EXISTS idx_security_type ON security_events(event_type);
CREATE INDEX IF NOT EXISTS idx_security_severity ON security_events(severity);
CREATE INDEX IF NOT EXISTS idx_security_ip ON security_events(user_ip);
CREATE INDEX IF NOT EXISTS idx_security_created ON security_events(created_at);
CREATE INDEX IF NOT EXISTS idx_security_status ON security_events(status);

-- ─── 7. DDOS EVENTS ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ddos_events (
  id BIGSERIAL PRIMARY KEY,
  website_id BIGINT REFERENCES websites(id) ON DELETE CASCADE,
  severity VARCHAR(20),         -- warning, critical
  attack_type VARCHAR(50),      -- traffic_spike, ip_flood, botnet, geo_spike, slowloris
  details JSONB,
  affected_ip INET,
  total_requests INTEGER,
  avg_requests INTEGER,
  mitigation_taken BOOLEAN DEFAULT FALSE,
  mitigation_details JSONB,
  status VARCHAR(20) DEFAULT 'active',  -- active, mitigated, resolved
  created_at TIMESTAMP DEFAULT NOW(),
  resolved_at TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_ddos_website_id ON ddos_events(website_id);
CREATE INDEX IF NOT EXISTS idx_ddos_created ON ddos_events(created_at);
CREATE INDEX IF NOT EXISTS idx_ddos_status ON ddos_events(status);

-- ─── 8. DDOS MITIGATIONS ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS ddos_mitigations (
  id BIGSERIAL PRIMARY KEY,
  ddos_event_id BIGINT REFERENCES ddos_events(id) ON DELETE CASCADE,
  action VARCHAR(50),   -- cloudflare_under_attack, ip_block, geo_block, rate_limit
  target VARCHAR(255),
  status VARCHAR(20),   -- success, failed
  details JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ─── 9. IP BLOCK LIST ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ip_block_list (
  id BIGSERIAL PRIMARY KEY,
  website_id BIGINT REFERENCES websites(id) ON DELETE CASCADE,
  ip INET NOT NULL,
  reason VARCHAR(255),
  blocked_by VARCHAR(100),
  severity VARCHAR(20),
  expires_at TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  unblocked_at TIMESTAMP,
  unblocked_by VARCHAR(100),
  unblock_reason VARCHAR(255)
);
CREATE INDEX IF NOT EXISTS idx_block_ip ON ip_block_list(ip);
CREATE INDEX IF NOT EXISTS idx_block_website_id ON ip_block_list(website_id);
CREATE INDEX IF NOT EXISTS idx_block_active ON ip_block_list(is_active);

-- ─── 10. IP WHITELIST ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ip_whitelist (
  id BIGSERIAL PRIMARY KEY,
  website_id BIGINT REFERENCES websites(id) ON DELETE CASCADE,
  ip INET NOT NULL,
  reason VARCHAR(255),
  added_by VARCHAR(100),
  expires_at TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_whitelist_ip ON ip_whitelist(ip);
CREATE INDEX IF NOT EXISTS idx_whitelist_website_id ON ip_whitelist(website_id);

-- ─── 11. IP INTEL CACHE ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS ip_intel_cache (
  ip INET PRIMARY KEY,
  country VARCHAR(100),
  country_code VARCHAR(10),
  region VARCHAR(100),
  city VARCHAR(100),
  latitude DECIMAL(10,6),
  longitude DECIMAL(10,6),
  isp VARCHAR(255),
  organization VARCHAR(255),
  as_number VARCHAR(50),
  threat_score INTEGER DEFAULT 0,
  abuse_confidence INTEGER DEFAULT 0,
  total_reports INTEGER DEFAULT 0,
  is_scanner BOOLEAN DEFAULT FALSE,
  is_vpn BOOLEAN DEFAULT FALSE,
  is_tor BOOLEAN DEFAULT FALSE,
  is_bot BOOLEAN DEFAULT FALSE,
  last_reported_at TIMESTAMP,
  cached_at TIMESTAMP DEFAULT NOW()
);

-- ─── 12. AUDIT LOGS ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS audit_logs (
  id BIGSERIAL PRIMARY KEY,
  website_id BIGINT REFERENCES websites(id) ON DELETE SET NULL,
  admin_user VARCHAR(100),
  action VARCHAR(100),
  target VARCHAR(255),
  details JSONB,
  ip_address INET,
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_audit_website_id ON audit_logs(website_id);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at);

-- ─── 13. INCIDENTS ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS incidents (
  id BIGSERIAL PRIMARY KEY,
  website_id BIGINT REFERENCES websites(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  severity VARCHAR(20),   -- low, medium, high, critical
  status VARCHAR(20) DEFAULT 'new', -- new, investigating, resolved, closed
  assigned_to VARCHAR(100),
  event_ids BIGINT[],
  investigation_notes TEXT,
  resolution_notes TEXT,
  mitre_techniques TEXT[],
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  resolved_at TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_incidents_website_id ON incidents(website_id);
CREATE INDEX IF NOT EXISTS idx_incidents_status ON incidents(status);
CREATE INDEX IF NOT EXISTS idx_incidents_severity ON incidents(severity);

-- ─── 14. AI DECISIONS ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ai_decisions (
  id BIGSERIAL PRIMARY KEY,
  website_id BIGINT REFERENCES websites(id) ON DELETE CASCADE,
  event_id BIGINT,
  ip INET,
  decision_type VARCHAR(50),  -- investigate, block, escalate, dismiss
  reasoning TEXT,
  confidence_score INTEGER,
  action_taken BOOLEAN DEFAULT FALSE,
  action_result TEXT,
  model_used VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ai_decisions_website_id ON ai_decisions(website_id);
CREATE INDEX IF NOT EXISTS idx_ai_decisions_created ON ai_decisions(created_at);

-- ─── 15. AI SESSIONS (Chat) ───────────────────────────────────
CREATE TABLE IF NOT EXISTS ai_sessions (
  id BIGSERIAL PRIMARY KEY,
  session_id UUID,
  user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
  website_id BIGINT REFERENCES websites(id) ON DELETE SET NULL,
  question TEXT,
  response TEXT,
  context JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ai_sessions_user ON ai_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_sessions_created ON ai_sessions(created_at);

-- ─── 16. ASSISTANT SETTINGS ───────────────────────────────────
CREATE TABLE IF NOT EXISTS assistant_settings (
  id BIGSERIAL PRIMARY KEY,
  setting_key VARCHAR(50) UNIQUE,
  setting_value JSONB,
  updated_at TIMESTAMP DEFAULT NOW(),
  updated_by VARCHAR(100)
);

-- ─── 17. API TOKENS ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS api_tokens (
  id BIGSERIAL PRIMARY KEY,
  token_hash TEXT UNIQUE,
  name VARCHAR(100),
  created_by VARCHAR(100),
  scope VARCHAR(50),
  expires_at TIMESTAMP,
  last_used_at TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ─── 18. SAVED SEARCHES ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS saved_searches (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(100),
  query JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ─── 19. COMPLIANCE LOGS ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS compliance_logs (
  id BIGSERIAL PRIMARY KEY,
  website_id BIGINT REFERENCES websites(id) ON DELETE CASCADE,
  user_id BIGINT,
  action VARCHAR(100),
  data_type VARCHAR(50),
  consent_given BOOLEAN,
  ip_address INET,
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_compliance_website_id ON compliance_logs(website_id);

-- ─── 20. INTEGRATION LOGS ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS integration_logs (
  id BIGSERIAL PRIMARY KEY,
  website_id BIGINT REFERENCES websites(id) ON DELETE CASCADE,
  method VARCHAR(50),
  files_processed INTEGER,
  tracking_injected BOOLEAN DEFAULT FALSE,
  status VARCHAR(20),
  error_message TEXT,
  details JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);

-- ─── 21. DDOS RULES (Configurable thresholds) ────────────────
CREATE TABLE IF NOT EXISTS ddos_rules (
  id BIGSERIAL PRIMARY KEY,
  website_id BIGINT REFERENCES websites(id) ON DELETE CASCADE,
  rule_type VARCHAR(50),
  threshold_value INTEGER,
  threshold_unit VARCHAR(20),
  action VARCHAR(50),
  severity VARCHAR(20),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ─── DEFAULT ASSISTANT SETTINGS ───────────────────────────────
INSERT INTO assistant_settings (setting_key, setting_value) VALUES
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
