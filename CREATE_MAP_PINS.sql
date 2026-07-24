-- Create a table to permanently store IPs pinned to the Globe & Map
CREATE TABLE IF NOT EXISTS map_pins (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  ip VARCHAR(45) NOT NULL,
  city VARCHAR(255),
  country VARCHAR(255),
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  pinned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(ip)
);
