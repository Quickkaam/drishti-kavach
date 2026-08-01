// ============================================
// Drishti Kavach — IP Logger Utility
// ============================================
// Logs IP addresses with location data for both login tracking and DDoS detection
// ============================================

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const fetch = require('node-fetch');
const supabase = require('../db/supabase');
const crypto = require('crypto');
const { logAuthEvent } = require('../services/logging');

// Ensure logs directory exists
const logsDir = path.resolve(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const logFilePath = path.join(logsDir, 'ip_events.jsonl.gz');

/** Get the real visitor IP address (handles proxy headers) */
function getRealIpAddress(req) {
  // Check Cloudflare header first
  const cfConnectingIp = req.headers['cf-connecting-ip'];
  if (cfConnectingIp) return cfConnectingIp.split(',')[0].trim();
  
  // Check X-Forwarded-For header
  const xForwardedFor = req.headers['x-forwarded-for'];
  if (xForwardedFor) return xForwardedFor.split(',')[0].trim();
  
  // Fall back to req.ip (which respects trust proxy setting)
  return req.ip;
}

/** Fetch enriched IP info from ipinfo.io or ip-api.com */
async function fetchIpInfo(ip) {
  if (!ip || ip === '::1' || ip === '127.0.0.1' || ip === 'localhost') {
    return { country: 'Localhost', country_code: 'LO', city: 'Localhost', lat: 0, lon: 0 };
  }
  
  // Skip private/internal IPs that can't be geolocated
  if (ip.startsWith('10.') || ip.startsWith('192.168.') || ip.startsWith('172.') || ip.startsWith('127.')) {
    return { country: 'Private Network', country_code: 'PR', city: 'Internal', lat: 0, lon: 0 };
  }
  
  try {
    const token = process.env.IPINFO_API_KEY;
    // First try ipinfo.io
    if (token) {
      const ipinfoRes = await fetch(`https://ipinfo.io/${ip}?token=${token}`);
      if (ipinfoRes.ok) {
        const data = await ipinfoRes.json();
        if (data && (data.city || data.country)) {
          return {
            country: data.country || 'Unknown',
            country_code: data.country_code || 'UN',
            region: data.region || 'Unknown',
            city: data.city || 'Unknown',
            lat: data.loc ? data.loc.split(',')[0] : '0',
            lon: data.loc ? data.loc.split(',')[1] : '0',
            isp: data.isp || 'Unknown',
            org: data.org || 'Unknown',
            timezone: data.timezone || 'Unknown',
          };
        }
      }
    }
    // Fallback to ip-api.com (no API key required)
    const fallbackRes = await fetch(`http://ip-api.com/json/${ip}?fields=status,country,countryCode,regionName,city,lat,lon,isp,org,as,proxy`);
    if (fallbackRes.ok) {
      const alt = await fallbackRes.json();
      if (alt && alt.status === 'success') {
        return {
          country: alt.country || 'Unknown',
          country_code: alt.countryCode || 'UN',
          region: alt.regionName || 'Unknown',
          city: alt.city || 'Unknown',
          lat: alt.lat ? String(alt.lat) : '0',
          lon: alt.lon ? String(alt.lon) : '0',
          isp: alt.isp || 'Unknown',
          org: alt.org || 'Unknown',
          timezone: alt.timezone || 'Unknown',
          proxy: alt.proxy || false,
          hosting: alt.hosting || false,
        };
      }
    }
    return { country: 'Unknown', country_code: 'UN', city: 'Unknown', lat: '0', lon: '0' };
  } catch (e) {
    console.error('fetchIpInfo error for IP', ip, e);
    return { country: 'Error', country_code: 'ER', city: 'Error', lat: '0', lon: '0' };
  }
}

/** Compress JSON line using gzip */
function compressJsonLine(obj) {
  return new Promise((resolve, reject) => {
    const json = JSON.stringify(obj) + '\n';
    zlib.gzip(json, (err, buffer) => {
      if (err) reject(err);
      else resolve(buffer);
    });
  });
}

/** Log IP event with location data for analytics and security */
async function logIpEvent({ 
  websiteId, 
  eventType, 
  ip, 
  req = null,
  userAgent = null, 
  session_id = null,
  page_url = null,
  io = null
}) {
  try {
    // Extract IP from req if not provided
    const ipAddress = req ? getRealIpAddress(req) : ip;
    const location = await fetchIpInfo(ipAddress);
    const event = {
      website_id: websiteId,
      event_type: eventType,
      ip_address: ip,
      location: JSON.stringify(location),
      user_agent: userAgent,
      session_id: session_id,
      page_url: page_url,
      timestamp: new Date().toISOString(),
    };
    
    // Write compressed line to local file
    const compressed = await compressJsonLine(event);
    fs.appendFileSync(logFilePath, compressed);
    
    // Store in Supabase - use events table for analytics
    // Also create a separate ip_events table if needed for security tracking
    const insertData = {
      website_id: websiteId,
      event_type: eventType,
      user_ip: ipAddress,
      user_agent: userAgent,
      referrer: null,
      session_id: session_id,
      page_url: page_url,
      timestamp: event.timestamp,
    };
    
    const { data, error } = await supabase
      .from('events')
      .insert(insertData)
      .select('id')
      .single();
    
    if (error) {
      console.error('[IP LOGGER] Failed to insert event:', {
        message: error.message,
        details: error.details,
      });
    } else {
      console.log('[IP LOGGER] Successfully logged event:', { eventType, ip, eventId: data?.id });
    }
    
    // Emit real-time event if socket provided
    if (io && typeof io.to === 'function') {
      io.to(`website:${websiteId}`).emit('ip_event', {
        ip,
        location,
        eventType,
        session_id,
      });
      io.to('admin').emit('ip_event', {
        ip,
        location,
        eventType,
        websiteId,
        session_id,
      });
    }
    
    return { success: !error, location };
  } catch (err) {
    console.error('[IP LOGGER] Failed to log event:', { ip, eventType, error: err.message });
    return { success: false, error: err.message, location: null };
  }
}

module.exports = { logIpEvent, fetchIpInfo, compressJsonLine, getRealIpAddress };
