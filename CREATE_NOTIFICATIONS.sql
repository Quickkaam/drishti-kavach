-- ============================================
-- Drishti Kavach — Notifications Table
-- Run this in Supabase SQL Editor
-- ============================================

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) NOT NULL DEFAULT 'info', -- info, success, warning, error, security, ddos, login, system
  severity VARCHAR(20) DEFAULT 'info', -- info, low, medium, high, critical
  category VARCHAR(50), -- security, ddos, login, user, system, ai, form, incident
  reference_type VARCHAR(50), -- website, user, ip, incident, event, etc.
  reference_id BIGINT,
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP
);

-- Notification preferences table
CREATE TABLE IF NOT EXISTS notification_preferences (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  
  -- Email notifications (per category)
  email_security BOOLEAN DEFAULT TRUE,
  email_ddos BOOLEAN DEFAULT TRUE,
  email_login BOOLEAN DEFAULT TRUE,
  email_system BOOLEAN DEFAULT TRUE,
  email_ai BOOLEAN DEFAULT TRUE,
  email_incidents BOOLEAN DEFAULT TRUE,
  email_forms BOOLEAN DEFAULT TRUE,
  
  -- In-app notifications (per category)
  inapp_security BOOLEAN DEFAULT TRUE,
  inapp_ddos BOOLEAN DEFAULT TRUE,
  inapp_login BOOLEAN DEFAULT TRUE,
  inapp_system BOOLEAN DEFAULT TRUE,
  inapp_ai BOOLEAN DEFAULT TRUE,
  inapp_incidents BOOLEAN DEFAULT TRUE,
  inapp_forms BOOLEAN DEFAULT TRUE,
  
  -- Slack notifications (per category)
  slack_security BOOLEAN DEFAULT TRUE,
  slack_ddos BOOLEAN DEFAULT TRUE,
  slack_login BOOLEAN DEFAULT FALSE,
  slack_system BOOLEAN DEFAULT TRUE,
  slack_ai BOOLEAN DEFAULT FALSE,
  slack_incidents BOOLEAN DEFAULT TRUE,
  slack_forms BOOLEAN DEFAULT FALSE,
  
  -- Telegram notifications (per category)
  telegram_security BOOLEAN DEFAULT TRUE,
  telegram_ddos BOOLEAN DEFAULT TRUE,
  telegram_login BOOLEAN DEFAULT FALSE,
  telegram_system BOOLEAN DEFAULT TRUE,
  telegram_ai BOOLEAN DEFAULT FALSE,
  telegram_incidents BOOLEAN DEFAULT TRUE,
  telegram_forms BOOLEAN DEFAULT FALSE,
  
  -- Severity thresholds
  min_email_severity VARCHAR(20) DEFAULT 'low',
  min_slack_severity VARCHAR(20) DEFAULT 'medium',
  min_telegram_severity VARCHAR(20) DEFAULT 'medium',
  min_inapp_severity VARCHAR(20) DEFAULT 'info',
  
  -- Quiet hours
  quiet_hours_enabled BOOLEAN DEFAULT FALSE,
  quiet_hours_start TIME DEFAULT '22:00',
  quiet_hours_end TIME DEFAULT '08:00',
  quiet_hours_tz VARCHAR(50) DEFAULT 'UTC',
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Default notification preferences per role
-- This will be created in the service, not here (per-user)

-- Indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, is_read) WHERE is_read = FALSE;
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_category ON notifications(category);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_reference ON notifications(reference_type, reference_id);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "users_own_notifications" ON notifications
  FOR ALL TO authenticated
  USING (user_id = (SELECT id FROM users WHERE email_hash = auth.jwt()->>'email_hash'))
  WITH CHECK (user_id = (SELECT id FROM users WHERE email_hash = auth.jwt()->>'email_hash'));

CREATE POLICY "users_own_preferences" ON notification_preferences
  FOR ALL TO authenticated
  USING (user_id = (SELECT id FROM users WHERE email_hash = auth.jwt()->>'email_hash'))
  WITH CHECK (user_id = (SELECT id FROM users WHERE email_hash = auth.jwt()->>'email_hash'));

-- For service_role (backend) access
CREATE POLICY "service_role_notifications" ON notifications
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "service_role_preferences" ON notification_preferences
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Grant permissions
GRANT ALL PRIVILEGES ON notifications TO service_role, authenticated, anon;
GRANT ALL PRIVILEGES ON notification_preferences TO service_role, authenticated, anon;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role, authenticated;

SELECT '✅ Notifications tables created successfully!' as status;