const axios = require('axios');

/**
 * Fetch VirusTotal reputation data for an IP address.
 * Requires a VIRUSTOTAL_API_KEY environment variable. If not set, returns an empty object.
 * Returns an object containing a `malicious` boolean and analysis stats.
 */
async function fetchVirusTotal(ip) {
  if (!process.env.VIRUSTOTAL_API_KEY) return {};
  try {
    const url = `https://www.virustotal.com/api/v3/ip_addresses/${ip}`;
    const res = await axios.get(url, {
      timeout: 5000,
      headers: { 'x-apikey': process.env.VIRUSTOTAL_API_KEY, 'User-Agent': 'DrishtiKavach/1.0' },
    });
    const data = res.data?.data?.attributes || {};
    const malicious = (data.last_analysis_stats?.malicious || 0) > 0;
    return {
      malicious,
      stats: data.last_analysis_stats || {},
      reputation: data.reputation,
    };
  } catch {
    return {};
  }
}

module.exports = { fetchVirusTotal };
