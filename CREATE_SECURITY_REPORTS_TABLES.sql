-- ============================================
-- Drishti Kavach — Security Reports Tables
-- ============================================

-- Attackers table
CREATE TABLE IF NOT EXISTS attackers (
  id BIGSERIAL PRIMARY KEY,
  ip VARCHAR(45) NOT NULL,
  website_id BIGINT REFERENCES websites(id),
  first_seen TIMESTAMPTZ DEFAULT NOW(),
  last_seen TIMESTAMPTZ DEFAULT NOW(),
  event_type VARCHAR(100),
  severity VARCHAR(20),
  payload TEXT,
  mitre_technique VARCHAR(50),
  intel JSONB,
  status VARCHAR(20) DEFAULT 'active',
  blocked_by BIGINT REFERENCES users(id),
  blocked_at TIMESTAMPTZ,
  count INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(ip, website_id)
);

CREATE INDEX IF NOT EXISTS idx_attackers_ip ON attackers(ip);
CREATE INDEX IF NOT EXISTS idx_attackers_website ON attackers(website_id);
CREATE INDEX IF NOT EXISTS idx_attackers_status ON attackers(status);
CREATE INDEX IF NOT EXISTS idx_attackers_first_seen ON attackers(first_seen);

-- AI Decisions table
CREATE TABLE IF NOT EXISTS ai_decisions (
  id BIGSERIAL PRIMARY KEY,
  website_id BIGINT REFERENCES websites(id),
  event_id BIGINT REFERENCES security_events(id),
  ip VARCHAR(45) NOT NULL,
  decision_type VARCHAR(50),
  reasoning TEXT,
  confidence_score INTEGER CHECK (confidence_score >= 0 AND confidence_score <= 100),
  threat_score INTEGER CHECK (threat_score >= 0 AND threat_score <= 100),
  threat_level VARCHAR(20),
  attack_vector TEXT,
  impact TEXT,
  iocs JSONB,
  mitigation_steps JSONB,
  action_taken BOOLEAN DEFAULT FALSE,
  action_result TEXT,
  model_used VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_decisions_ip ON ai_decisions(ip);
CREATE INDEX IF NOT EXISTS idx_ai_decisions_website ON ai_decisions(website_id);
CREATE INDEX IF NOT EXISTS idx_ai_decisions_event ON ai_decisions(event_id);
CREATE INDEX IF NOT EXISTS idx_ai_decisions_created ON ai_decisions(created_at);

-- Add columns to security_events if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'security_events' AND column_name = 'ip_blocklisted') THEN
    ALTER TABLE security_events ADD COLUMN ip_blocklisted BOOLEAN DEFAULT FALSE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'security_events' AND column_name = 'investigating_by') THEN
    ALTER TABLE security_events ADD COLUMN investigating_by VARCHAR(100);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'security_events' AND column_name = 'last_investigated_at') THEN
    ALTER TABLE security_events ADD COLUMN last_investigated_at TIMESTAMPTZ;
  END IF;
END $$;

-- Assistant settings for guardian mode
INSERT INTO assistant_settings (setting_key, setting_value, website_id)
VALUES (
  'guardian_mode',
  '{"enabled": true, "autoInvestigate": true, "autoBlockThreshold": 80, "autoBlockDurationHours": 24, "monitorAllEvents": true, "escalateSeverity": "critical"}',
  NULL
)
ON CONFLICT (setting_key, website_id) DO NOTHING;

-- Insert default notification preferences for existing users
INSERT INTO notification_preferences (
  user_id,
  email_security, email_ddos, email_login, email_system, email_ai, email_incidents, email_forms,
  inapp_security, inapp_ddos, inapp_login, inapp_system, inapp_ai, inapp_incidents, inapp_forms,
  slack_security, slack_ddos, slack_login, slack_system, slack_ai, slack_incidents, slack_forms,
  telegram_security, telegram_ddos, telegram_login, telegram_system, telegram_ai, telegram_incidents, telegram_forms,
  min_email_severity, min_slack_severity, min_telegram_severity, min_inapp_severity, quiet_hours_enabled
)
SELECT 
  u.id,
  true, true, true, true, true, true, true,
  true, true, true, true, true, true, true,
  true, true, false, true, false, true, false,
  true, true, false, true, false, true, false,
  'low', 'medium', 'medium', 'info', false
FROM users u
WHERE NOT EXISTS (
  SELECT 1 FROM notification_preferences np WHERE np.user_id = u.id
);

-- Add sample data for testing
INSERT INTO security_events (website_id, event_type, severity, user_ip, url, payload, status)
VALUES (
  1,
  'sqli',
  'critical',
  '45.33.32.156',
  'https://example.com/login',
  'SELECT * FROM users WHERE id=1 OR 1=1',
  'new'
);

-- Update audit logs for report generation
ALTER TABLE audit_logs 
ADD COLUMN IF NOT EXISTS details JSONB;

-- Add website_id to ip_block_list if missing
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ip_block_list' AND column_name = 'website_id') THEN
    ALTER TABLE ip_block_list ADD COLUMN website_id BIGINT REFERENCES websites(id);
    CREATE INDEX idx_ip_block_website ON ip_block_list(website_id);
  END IF;
END $$;