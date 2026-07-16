// ============================================
// Drishti Kavach — IP Intelligence Service
// ip-api + AbuseIPDB + GreyNoise + AlienVault OTX + URLScan + Spamhaus
// ============================================

const axios = require('axios');
const supabase = require('../db/supabase');

const CACHE_TTL_HOURS = 24 * 7; // 7 days

async function getIpIntel(ip) {
  if (!ip || ip === '::1' || ip.startsWith('127.') || ip.startsWith('192.168.') || ip.startsWith('10.')) {
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

  // Fetch from all sources in parallel
  const [geo, abuse, greynoise, otx, urlscan] = await Promise.allSettled([
    fetchGeo(ip),
    fetchAbuseIPDB(ip),
    fetchGreyNoise(ip),
    fetchAlienVaultOTX(ip),     // FREE — no key needed
    fetchURLScan(ip),           // FREE — no key needed
  ]);

  const geoData      = geo.status      === 'fulfilled' ? geo.value      : {};
  const abuseData    = abuse.status    === 'fulfilled' ? abuse.value    : {};
  const greynoiseData = greynoise.status === 'fulfilled' ? greynoise.value : {};
  const otxData      = otx.status      === 'fulfilled' ? otx.value      : {};
  const urlscanData  = urlscan.status  === 'fulfilled' ? urlscan.value  : {};

  // Composite threat score (0–100)
  let threatScore = 0;
  if (abuseData.abuseConfidenceScore)            threatScore += abuseData.abuseConfidenceScore * 0.4;
  if (greynoiseData.classification === 'malicious') threatScore += 25;
  if (greynoiseData.classification === 'suspicious') threatScore += 12;
  if (otxData.pulse_count > 0)                   threatScore += Math.min(20, otxData.pulse_count * 2);
  if (otxData.malicious)                         threatScore += 15;
  if (urlscanData.malicious)                     threatScore += 15;
  if (abuseData.totalReports > 10)               threatScore += 10;
  threatScore = Math.min(100, Math.round(threatScore));

  const intel = {
    ip,
    country:          geoData.country        || null,
    country_code:     geoData.countryCode    || null,
    region:           geoData.regionName     || null,
    city:             geoData.city           || null,
    latitude:         geoData.lat            || null,
    longitude:        geoData.lon            || null,
    isp:              geoData.isp            || null,
    organization:     geoData.org            || null,
    as_number:        geoData.as             || null,
    threat_score:     threatScore,
    abuse_confidence: abuseData.abuseConfidenceScore || 0,
    total_reports:    abuseData.totalReports  || 0,
    is_scanner:       greynoiseData.classification === 'malicious' || false,
    is_vpn:           geoData.proxy          || false,
    is_tor:           false,
    is_bot:           greynoiseData.bot      || false,
    // OTX
    otx_pulse_count:  otxData.pulse_count    || 0,
    otx_malicious:    otxData.malicious      || false,
    // URLScan
    urlscan_malicious: urlscanData.malicious || false,
    last_reported_at: abuseData.lastReportedAt || null,
    cached_at:        new Date().toISOString(),
  };

  // Upsert cache
  await supabase.from('ip_intel_cache').upsert(intel, { onConflict: 'ip' });

  return intel;
}

async function fetchGeo(ip) {
  const res = await axios.get(
    `http://ip-api.com/json/${ip}?fields=status,country,countryCode,regionName,city,lat,lon,isp,org,as,proxy`,
    { timeout: 4000 }
  );
  if (res.data.status === 'success') return res.data;
  return {};
}

async function fetchAbuseIPDB(ip) {
  if (!process.env.ABUSEIPDB_API_KEY) return {};
  const res = await axios.get('https://api.abuseipdb.com/api/v2/check', {
    params: { ipAddress: ip, maxAgeInDays: 90 },
    headers: { Key: process.env.ABUSEIPDB_API_KEY, Accept: 'application/json' },
    timeout: 5000,
  });
  return res.data.data || {};
}

async function fetchGreyNoise(ip) {
  if (!process.env.GREYNOISE_API_KEY) return {};
  try {
    const res = await axios.get(`https://api.greynoise.io/v3/community/${ip}`, {
      headers: { key: process.env.GREYNOISE_API_KEY },
      timeout: 5000,
    });
    return res.data || {};
  } catch {
    return {};
  }
}

// ── AlienVault OTX — FREE, no key needed ────────────────────────────
async function fetchAlienVaultOTX(ip) {
  try {
    const res = await axios.get(
      `https://otx.alienvault.com/api/v1/indicators/IPv4/${ip}/general`,
      { timeout: 5000, headers: { 'User-Agent': 'DrishtiKavach/1.0' } }
    );
    const d = res.data || {};
    return {
      pulse_count: d.pulse_info?.count || 0,
      malicious: (d.pulse_info?.count || 0) > 0,
      sections: d.sections || [],
    };
  } catch {
    return {};
  }
}

// ── URLScan.io search — FREE, no key for read ───────────────────────
async function fetchURLScan(ip) {
  try {
    const res = await axios.get(
      `https://urlscan.io/api/v1/search/?q=ip:${ip}&size=5`,
      { timeout: 5000, headers: { 'User-Agent': 'DrishtiKavach/1.0' } }
    );
    const results = res.data?.results || [];
    const malicious = results.some(r => r.verdicts?.overall?.malicious === true);
    return { malicious, scan_count: results.length };
  } catch {
    return {};
  }
}

module.exports = { getIpIntel };

