// ============================================
// Drishti Kavach — Cloudflare Integration Service
// Block IPs at the edge via Cloudflare API
// ============================================

const axios = require('axios');

const CF_BASE = 'https://api.cloudflare.com/client/v4';

function getCfHeaders() {
  return {
    'Authorization': `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`,
    'Content-Type': 'application/json',
  };
}

function isConfigured() {
  return !!(process.env.CLOUDFLARE_API_TOKEN && process.env.CLOUDFLARE_ZONE_ID);
}

/**
 * Block an IP via Cloudflare Firewall Rules (Zone-level)
 */
async function blockIpCloudflare(ip, notes = 'Blocked by Drishti Kavach') {
  if (!isConfigured()) {
    console.warn('[Cloudflare] Not configured — skipping edge block for', ip);
    return null;
  }

  const zoneId = process.env.CLOUDFLARE_ZONE_ID;

  try {
    const res = await axios.post(
      `${CF_BASE}/zones/${zoneId}/firewall/access_rules/rules`,
      {
        mode: 'block',
        configuration: { target: 'ip', value: ip },
        notes,
      },
      { headers: getCfHeaders(), timeout: 8000 }
    );
    console.log(`[Cloudflare] Blocked IP: ${ip}`);
    return res.data.result;
  } catch (err) {
    console.error('[Cloudflare] Block failed:', err.response?.data || err.message);
    return null;
  }
}

/**
 * Unblock an IP via Cloudflare (removes the rule)
 */
async function unblockIpCloudflare(ip) {
  if (!isConfigured()) return null;

  const zoneId = process.env.CLOUDFLARE_ZONE_ID;

  try {
    // Find the rule for this IP
    const listRes = await axios.get(
      `${CF_BASE}/zones/${zoneId}/firewall/access_rules/rules`,
      {
        params: { 'configuration.value': ip, mode: 'block' },
        headers: getCfHeaders(),
        timeout: 8000,
      }
    );

    const rules = listRes.data.result || [];
    if (rules.length === 0) return null;

    // Delete all matching rules
    await Promise.all(
      rules.map((rule) =>
        axios.delete(
          `${CF_BASE}/zones/${zoneId}/firewall/access_rules/rules/${rule.id}`,
          { headers: getCfHeaders(), timeout: 8000 }
        )
      )
    );

    console.log(`[Cloudflare] Unblocked IP: ${ip}`);
    return true;
  } catch (err) {
    console.error('[Cloudflare] Unblock failed:', err.response?.data || err.message);
    return null;
  }
}

/**
 * Purge entire Cloudflare cache for the zone
 */
async function purgeCache() {
  if (!isConfigured()) return null;

  const zoneId = process.env.CLOUDFLARE_ZONE_ID;
  try {
    const res = await axios.post(
      `${CF_BASE}/zones/${zoneId}/purge_cache`,
      { purge_everything: true },
      { headers: getCfHeaders(), timeout: 8000 }
    );
    console.log('[Cloudflare] Cache purged');
    return res.data.result;
  } catch (err) {
    console.error('[Cloudflare] Cache purge failed:', err.response?.data || err.message);
    return null;
  }
}

module.exports = { blockIpCloudflare, unblockIpCloudflare, purgeCache, isConfigured };
