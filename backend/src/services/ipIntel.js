// ============================================
// Drishti Kavach — IP Intelligence Service
// ip-api + AbuseIPDB + GreyNoise + VirusTotal
// ============================================

const axios = require('axios');
const supabase = require('../db/supabase');

const CACHE_TTL_HOURS = 24 * 7; // 7 days

async function getIpIntel(ip) {
  if (!ip || ip === '::1' || ip.startsWith('127.') || ip.startsWith('192.168.')) {
    return { ip, country: 'Local', threat_score: 0, is_private: true };
  }

  // Check cache first
  const { data: cached } = await supabase
    .from('ip_intel_cache')
    .select('*')
    .eq('ip', ip)
    .single();

  if (cached) {
    const age = (Date.now() - new Date(cached.cached_at).getTime()) / (1000 * 60 * 60);
    if (age < CACHE_TTL_HOURS) return cached;
  }

  // Fetch from multiple sources in parallel
  const [geo, abuse, greynoise] = await Promise.allSettled([
    fetchGeo(ip),
    fetchAbuseIPDB(ip),
    fetchGreyNoise(ip),
  ]);

  const geoData = geo.status === 'fulfilled' ? geo.value : {};
  const abuseData = abuse.status === 'fulfilled' ? abuse.value : {};
  const greynoiseData = greynoise.status === 'fulfilled' ? greynoise.value : {};

  // Calculate composite threat score (0–100)
  let threatScore = 0;
  if (abuseData.abuseConfidenceScore) threatScore += abuseData.abuseConfidenceScore * 0.6;
  if (greynoiseData.classification === 'malicious') threatScore += 30;
  if (greynoiseData.classification === 'suspicious') threatScore += 15;
  if (abuseData.totalReports > 10) threatScore += 10;
  threatScore = Math.min(100, Math.round(threatScore));

  const intel = {
    ip,
    country: geoData.country || null,
    country_code: geoData.countryCode || null,
    region: geoData.regionName || null,
    city: geoData.city || null,
    latitude: geoData.lat || null,
    longitude: geoData.lon || null,
    isp: geoData.isp || null,
    organization: geoData.org || null,
    as_number: geoData.as || null,
    threat_score: threatScore,
    abuse_confidence: abuseData.abuseConfidenceScore || 0,
    total_reports: abuseData.totalReports || 0,
    is_scanner: greynoiseData.classification === 'malicious' || false,
    is_vpn: geoData.proxy || false,
    is_tor: false,
    is_bot: greynoiseData.bot || false,
    last_reported_at: abuseData.lastReportedAt || null,
    cached_at: new Date().toISOString(),
  };

  // Upsert cache
  await supabase.from('ip_intel_cache').upsert(intel, { onConflict: 'ip' });

  return intel;
}

async function fetchGeo(ip) {
  const res = await axios.get(`http://ip-api.com/json/${ip}?fields=status,country,countryCode,regionName,city,lat,lon,isp,org,as,proxy`, {
    timeout: 3000,
  });
  if (res.data.status === 'success') return res.data;
  return {};
}

async function fetchAbuseIPDB(ip) {
  if (!process.env.ABUSEIPDB_API_KEY) return {};
  const res = await axios.get('https://api.abuseipdb.com/api/v2/check', {
    params: { ipAddress: ip, maxAgeInDays: 90 },
    headers: { Key: process.env.ABUSEIPDB_API_KEY, Accept: 'application/json' },
    timeout: 4000,
  });
  return res.data.data || {};
}

async function fetchGreyNoise(ip) {
  if (!process.env.GREYNOISE_API_KEY) return {};
  try {
    const res = await axios.get(`https://api.greynoise.io/v3/community/${ip}`, {
      headers: { key: process.env.GREYNOISE_API_KEY },
      timeout: 4000,
    });
    return res.data || {};
  } catch {
    return {};
  }
}

module.exports = { getIpIntel };
