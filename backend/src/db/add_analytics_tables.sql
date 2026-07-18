-- ============================================
-- Drishti Kavach – Analytics & MITRE Tables
-- Phase 2 Migration — Run in Supabase SQL Editor
-- ============================================

-- 1. User Sessions
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
CREATE INDEX IF NOT EXISTS idx_sessions_website_id ON user_sessions(website_id);
CREATE INDEX IF NOT EXISTS idx_sessions_session_id ON user_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_sessions_started ON user_sessions(started_at);
CREATE INDEX IF NOT EXISTS idx_sessions_active ON user_sessions(is_active);

-- 2. Page Views
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
CREATE INDEX IF NOT EXISTS idx_pageviews_website_id ON page_views(website_id);
CREATE INDEX IF NOT EXISTS idx_pageviews_created ON page_views(created_at);
CREATE INDEX IF NOT EXISTS idx_pageviews_url ON page_views(page_url);
CREATE INDEX IF NOT EXISTS idx_pageviews_session ON page_views(session_id);

-- 3. User Interactions
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
CREATE INDEX IF NOT EXISTS idx_interactions_website_id ON user_interactions(website_id);
CREATE INDEX IF NOT EXISTS idx_interactions_type ON user_interactions(interaction_type);
CREATE INDEX IF NOT EXISTS idx_interactions_created ON user_interactions(created_at);

-- 4. Geographic Data (Aggregated)
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
CREATE INDEX IF NOT EXISTS idx_geo_website_id ON geographic_data(website_id);
CREATE INDEX IF NOT EXISTS idx_geo_country ON geographic_data(country_code);

-- 5. Device Analytics (Aggregated)
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
CREATE INDEX IF NOT EXISTS idx_device_website_id ON device_analytics(website_id);

-- 6. MITRE Techniques (Master reference data)
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
CREATE INDEX IF NOT EXISTS idx_mitre_technique_id ON mitre_techniques(technique_id);
CREATE INDEX IF NOT EXISTS idx_mitre_tactic ON mitre_techniques(tactic);

-- 7. Website MITRE Mappings (Per-site detections)
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
CREATE INDEX IF NOT EXISTS idx_mitre_mappings_website_id ON website_mitre_mappings(website_id);
CREATE INDEX IF NOT EXISTS idx_mitre_mappings_technique_id ON website_mitre_mappings(technique_id);
CREATE INDEX IF NOT EXISTS idx_mitre_mappings_resolved ON website_mitre_mappings(is_resolved);

-- ── HELPER FUNCTIONS ─────────────────────────────────────────────

-- Increment page count for a session
CREATE OR REPLACE FUNCTION increment_session_page_count(p_session_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE user_sessions
  SET pages_visited = pages_visited + 1
  WHERE session_id = p_session_id;
END;
$$ LANGUAGE plpgsql;

-- Update session total duration
CREATE OR REPLACE FUNCTION update_session_duration(p_session_id UUID, p_duration INTEGER)
RETURNS void AS $$
BEGIN
  UPDATE user_sessions
  SET total_duration = total_duration + p_duration,
      last_seen = NOW()
  WHERE session_id = p_session_id;
END;
$$ LANGUAGE plpgsql;

-- ── SEED MITRE TECHNIQUES ─────────────────────────────────────────

INSERT INTO mitre_techniques (technique_id, technique_name, tactic, description, severity, remediation, mitre_url) VALUES
-- Reconnaissance
('T1595', 'Active Scanning', 'Reconnaissance', 'Adversaries may execute active reconnaissance scans to gather information about the victim network or infrastructure.', 'medium', 'Monitor network traffic for scan patterns. Implement honeypots to detect scanners. Use rate limiting on all endpoints.', 'https://attack.mitre.org/techniques/T1595'),
('T1598', 'Phishing for Information', 'Reconnaissance', 'Adversaries may send phishing messages to elicit sensitive information.', 'medium', 'Train users on phishing awareness. Implement DMARC/SPF email protections. Report suspicious emails immediately.', 'https://attack.mitre.org/techniques/T1598'),

-- Initial Access
('T1190', 'Exploit Public-Facing Application', 'Initial Access', 'Adversaries may attempt to exploit a weakness in an Internet-facing host or system to gain initial access.', 'critical', '1. Update application to latest version. 2. Apply security patches immediately. 3. Implement WAF rules. 4. Monitor for suspicious payloads.', 'https://attack.mitre.org/techniques/T1190'),
('T1189', 'Drive-by Compromise', 'Initial Access', 'Adversaries may gain access through a user visiting a website during normal browsing.', 'high', 'Implement CSP headers. Keep browsers and plugins updated. Use a web proxy with URL filtering.', 'https://attack.mitre.org/techniques/T1189'),
('T1566', 'Phishing', 'Initial Access', 'Adversaries may send phishing messages to gain access to victim systems.', 'high', 'Enable MFA on all accounts. Train users on phishing identification. Implement email filtering.', 'https://attack.mitre.org/techniques/T1566'),

-- Execution
('T1059', 'Command and Scripting Interpreter', 'Execution', 'Adversaries may abuse command and script interpreters to execute commands.', 'high', 'Apply application whitelisting. Monitor script execution. Restrict PowerShell and scripting tools.', 'https://attack.mitre.org/techniques/T1059'),
('T1203', 'Exploitation for Client Execution', 'Execution', 'Adversaries may exploit software vulnerabilities to execute code.', 'critical', 'Keep all software patched and updated. Implement exploit protection (e.g., DEP, ASLR). Use application control policies.', 'https://attack.mitre.org/techniques/T1203'),

-- Persistence
('T1098', 'Account Manipulation', 'Persistence', 'Adversaries may manipulate accounts to maintain access.', 'high', 'Monitor account creation and modification. Enforce MFA. Review admin accounts regularly.', 'https://attack.mitre.org/techniques/T1098'),

-- Privilege Escalation
('T1068', 'Exploitation for Privilege Escalation', 'Privilege Escalation', 'Adversaries may exploit software vulnerabilities to elevate privileges.', 'critical', 'Apply security patches. Run services with least privilege. Implement endpoint protection.', 'https://attack.mitre.org/techniques/T1068'),
('T1055', 'Process Injection', 'Privilege Escalation', 'Adversaries may inject code into processes to evade defenses or escalate privileges.', 'high', 'Use endpoint protection with memory scanning. Monitor process creation events.', 'https://attack.mitre.org/techniques/T1055'),

-- Defense Evasion
('T1070', 'Indicator Removal', 'Defense Evasion', 'Adversaries may delete or alter artifacts to remove evidence of their presence.', 'medium', 'Use tamper-protected logging. Send logs to a remote SIEM immediately. Monitor for log deletion.', 'https://attack.mitre.org/techniques/T1070'),
('T1036', 'Masquerading', 'Defense Evasion', 'Adversaries may attempt to manipulate features to make artifacts appear legitimate.', 'medium', 'Verify file hashes and signatures. Monitor file name and path patterns. Implement application whitelisting.', 'https://attack.mitre.org/techniques/T1036'),

-- Credential Access
('T1110', 'Brute Force', 'Credential Access', 'Adversaries may use brute force techniques to gain access to accounts.', 'high', 'Enforce MFA. Implement account lockout policies. Monitor for failed login attempts. Use CAPTCHA on login forms.', 'https://attack.mitre.org/techniques/T1110'),
('T1555', 'Credentials from Password Stores', 'Credential Access', 'Adversaries may search for common password storage locations.', 'critical', 'Use a password manager with encryption. Monitor access to credential stores. Implement endpoint protection.', 'https://attack.mitre.org/techniques/T1555'),
('T1556', 'Modify Authentication Process', 'Credential Access', 'Adversaries may modify authentication mechanisms to access user credentials.', 'critical', 'Monitor authentication system files. Implement integrity checks. Use multi-factor authentication.', 'https://attack.mitre.org/techniques/T1556'),

-- Discovery
('T1046', 'Network Service Discovery', 'Discovery', 'Adversaries may attempt to get a listing of services running on remote hosts.', 'medium', 'Use network segmentation. Block unnecessary ports. Monitor for port scan patterns.', 'https://attack.mitre.org/techniques/T1046'),
('T1087', 'Account Discovery', 'Discovery', 'Adversaries may attempt to get a listing of accounts on a system or within an environment.', 'low', 'Restrict access to account enumeration endpoints. Monitor for suspicious directory queries.', 'https://attack.mitre.org/techniques/T1087'),

-- Command and Control
('T1071', 'Application Layer Protocol', 'Command and Control', 'Adversaries may communicate using OSI application layer protocols to avoid detection.', 'high', 'Inspect and filter web traffic. Use a proxy for all outbound connections. Implement DPI.', 'https://attack.mitre.org/techniques/T1071'),
('T1090', 'Proxy', 'Command and Control', 'Adversaries may use a connection proxy to direct network traffic.', 'medium', 'Monitor for unusual outbound connection patterns. Block known malicious proxy services.', 'https://attack.mitre.org/techniques/T1090'),

-- Exfiltration
('T1048', 'Exfiltration Over Alternative Protocol', 'Exfiltration', 'Adversaries may steal data by exfiltrating it over a different protocol.', 'critical', 'Monitor outbound traffic for unusual volumes. Implement DLP solutions. Restrict outbound protocols.', 'https://attack.mitre.org/techniques/T1048'),
('T1041', 'Exfiltration Over C2 Channel', 'Exfiltration', 'Adversaries may steal data by exfiltrating it over an existing command and control channel.', 'critical', 'Monitor for unusual data volumes in outbound connections. Implement network monitoring and DLP.', 'https://attack.mitre.org/techniques/T1041'),

-- Impact
('T1485', 'Data Destruction', 'Impact', 'Adversaries may destroy data and files on specific systems or in large numbers.', 'critical', 'Implement immutable backups. Monitor for mass file deletion events. Use ransomware protection tools.', 'https://attack.mitre.org/techniques/T1485'),
('T1499', 'Endpoint Denial of Service', 'Impact', 'Adversaries may perform Endpoint Denial of Service (DoS) attacks to degrade or block availability.', 'high', 'Implement rate limiting and DDoS protection. Use a CDN with DDoS mitigation. Configure auto-scaling.', 'https://attack.mitre.org/techniques/T1499'),

-- Lateral Movement
('T1021', 'Remote Services', 'Lateral Movement', 'Adversaries may use remote services to move laterally through the environment.', 'high', 'Limit remote service access. Implement network segmentation. Monitor for unusual remote login activity.', 'https://attack.mitre.org/techniques/T1021')

ON CONFLICT (technique_id) DO NOTHING;
