// ============================================
// Drishti Kavach — Login Logger Utility
// ============================================

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
// const fetch = require('node-fetch'); // using global fetch
const supabase = require('../db/supabase');
const crypto = require('crypto');
const { logAuthEvent } = require('../services/logging');

// Ensure logs directory exists
const logsDir = path.resolve(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const logFilePath = path.join(logsDir, 'login_events.jsonl.gz');

/** Fetch enriched IP info from ipinfo.io */
async function fetchIpInfo(ip) {
  try {
    const token = process.env.IPINFO_API_KEY;
    // First try ipinfo.io
    if (token) {
      const ipinfoRes = await fetch(`https://ipinfo.io/${ip}?token=${token}`);
      if (ipinfoRes.ok) {
        const data = await ipinfoRes.json();
        // Basic sanity check – ensure we got a city or country
        if (data && (data.city || data.country)) {
          return data;
        }
      }
    }
    // Fallback to ip-api.com (no API key required)
    const fallbackRes = await fetch(`http://ip-api.com/json/${ip}?fields=status,country,countryCode,regionName,city,lat,lon,isp,org,as,proxy`);
    if (fallbackRes.ok) {
      const alt = await fallbackRes.json();
      if (alt && alt.status === 'success') {
        return alt;
      }
    }
    return {};
  } catch (e) {
    console.error('fetchIpInfo error', e);
    return {};
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

/** Log login event: email, ip, enriched location, compressed storage, real‑time admin notify */
async function logLoginEvent({ userId, email, ip, io }) {
  try {
    const location = await fetchIpInfo(ip);
    const event = {
      user_id: userId,
      email,
      ip_address: ip,
      location,
      timestamp: new Date().toISOString(),
    };
    
    // Write compressed line to local file
    const compressed = await compressJsonLine(event);
    fs.appendFileSync(logFilePath, compressed);
    
    // Store in Supabase using the new login_logs table
    const insertData = {
      user_id: userId,
      email,
      email_hash: crypto.createHash('sha512').update(email).digest('hex'),
      ip_address: ip,
      location: JSON.stringify(location),
      user_agent: null,
      success: true,
      failure_reason: null,
      created_at: event.timestamp,
    };
    
    console.log('[LOGIN LOGGER] Inserting login event:', { email, ip, userId });
    
    const { data, error } = await supabase.from('login_logs').insert(insertData).select();
    
    if (error) {
      console.error('[LOGIN LOGGER] Failed to insert login event:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
    } else {
      console.log('[LOGIN LOGGER] Successfully inserted login event, id:', data?.[0]?.id);
    }
    
    // Emit real‑time admin event if socket provided
    if (io && typeof io.to === 'function') {
      io.to('superadmin').emit('login_event', event);
    }
  } catch (err) {
    console.error('logLoginEvent failed', err);
  }
}

module.exports = { logLoginEvent, fetchIpInfo, compressJsonLine };
