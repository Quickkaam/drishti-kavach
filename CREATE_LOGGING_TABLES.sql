-- ============================================
-- Drishti Kavach — Create Logging Tables
-- Run this in Supabase SQL Editor
-- ============================================

-- Login Logs (authentication tracking)
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

CREATE INDEX IF NOT EXISTS idx_login_logs_user_id ON login_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_login_logs_email_hash ON login_logs(email_hash);
CREATE INDEX IF NOT EXISTS idx_login_logs_ip_address ON login_logs(ip_address);
CREATE INDEX IF NOT EXISTS idx_login_logs_created ON login_logs(created_at);

-- Error Logs (application error tracking)
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

CREATE INDEX IF NOT EXISTS idx_error_logs_level ON error_logs(level);
CREATE INDEX IF NOT EXISTS idx_error_logs_created ON error_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_error_logs_website ON error_logs(website_id);

-- System Audit Logs
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

CREATE INDEX IF NOT EXISTS idx_system_audit_created ON system_audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_system_audit_entity ON system_audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_system_audit_action ON system_audit_logs(action);