-- ============================================
-- Drishti Kavach — Analytics Tables
-- Run this in Supabase SQL Editor
-- ============================================

-- Drop old tables if they exist with wrong schema
DROP TABLE IF EXISTS user_sessions CASCADE;
DROP TABLE IF EXISTS page_views CASCADE;
DROP TABLE IF EXISTS geographic_data CASCADE;
DROP TABLE IF EXISTS device_analytics CASCADE;

-- User Sessions Table
CREATE TABLE IF NOT EXISTS user_sessions (
  id BIGSERIAL PRIMARY KEY,
  website_id BIGINT REFERENCES websites(id) ON DELETE CASCADE,
  session_id UUID DEFAULT gen_random_uuid(),
  user_ip INET,
  user_agent TEXT,
  referrer TEXT,
  landing_page TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  pages_visited INTEGER DEFAULT 0,
  total_duration INTEGER DEFAULT 0,
  started_at TIMESTAMP DEFAULT NOW(),
  ended_at TIMESTAMP,
  last_activity_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_sessions_website_id ON user_sessions(website_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_session_id ON user_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_is_active ON user_sessions(is_active);
CREATE INDEX IF NOT EXISTS idx_user_sessions_started_at ON user_sessions(started_at);

-- Page Views Table
CREATE TABLE IF NOT EXISTS page_views (
  id BIGSERIAL PRIMARY KEY,
  website_id BIGINT REFERENCES websites(id) ON DELETE CASCADE,
  session_id UUID,
  page_url TEXT,
  page_title TEXT,
  duration INTEGER DEFAULT 0,
  scroll_depth INTEGER DEFAULT 0,
  user_ip INET,
  user_agent TEXT,
  referrer TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_page_views_website_id ON page_views(website_id);
CREATE INDEX IF NOT EXISTS idx_page_views_session_id ON page_views(session_id);
CREATE INDEX IF NOT EXISTS idx_page_views_created_at ON page_views(created_at);
CREATE INDEX IF NOT EXISTS idx_page_views_page_url ON page_views(page_url);

-- Geographic Data Table
CREATE TABLE IF NOT EXISTS geographic_data (
  id BIGSERIAL PRIMARY KEY,
  website_id BIGINT REFERENCES websites(id) ON DELETE CASCADE,
  country VARCHAR(100),
  country_code VARCHAR(10),
  region VARCHAR(100),
  city VARCHAR(100),
  latitude DECIMAL(10,6),
  longitude DECIMAL(10,6),
  visitor_count INTEGER DEFAULT 0,
  last_visit_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_geographic_website_id ON geographic_data(website_id);
CREATE INDEX IF NOT EXISTS idx_geographic_country ON geographic_data(country);

-- Device Analytics Table
CREATE TABLE IF NOT EXISTS device_analytics (
  id BIGSERIAL PRIMARY KEY,
  website_id BIGINT REFERENCES websites(id) ON DELETE CASCADE,
  device_type VARCHAR(20),
  browser VARCHAR(50),
  os VARCHAR(50),
  screen_resolution VARCHAR(20),
  visitor_count INTEGER DEFAULT 0,
  last_visit_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_device_website_id ON device_analytics(website_id);
CREATE INDEX IF NOT EXISTS idx_device_type ON device_analytics(device_type);

-- Enable RLS
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE page_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE geographic_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE device_analytics ENABLE ROW LEVEL SECURITY;

-- RLS Policies for service_role
CREATE POLICY "service_role_user_sessions" ON user_sessions FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_page_views" ON page_views FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_geographic_data" ON geographic_data FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_device_analytics" ON device_analytics FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Grant permissions
GRANT ALL PRIVILEGES ON user_sessions TO service_role, authenticated;
GRANT ALL PRIVILEGES ON page_views TO service_role, authenticated;
GRANT ALL PRIVILEGES ON geographic_data TO service_role, authenticated;
GRANT ALL PRIVILEGES ON device_analytics TO service_role, authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role, authenticated;

SELECT '✅ Analytics tables created successfully!' as status;
