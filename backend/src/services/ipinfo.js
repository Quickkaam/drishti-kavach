// ============================================
// Drishti Kavach — IPInfo Service
// ============================================

/**
 * Enrich an IP address using ipinfo.io and fallback to ip-api.com.
 * @param {string} ip - IPv4 or IPv6 address
 * @returns {Promise<Object>} Enriched data (may be empty object on failure)
 */
async function enrichIp(ip) {
  try {
    // Clean up IP (remove ::ffff: prefix for IPv4-mapped IPv6)
    const cleanIp = ip.replace(/^::ffff:/, '');

    const token = process.env.IPINFO_API_KEY;
    if (token) {
      const resp = await fetch(`https://ipinfo.io/${cleanIp}?token=${token}`);
      if (resp.ok) {
        const data = await resp.json();
        if (data && (data.city || data.country)) {
          // Parse loc field "lat,lon" into separate fields
          if (data.loc) {
            const [lat, lon] = data.loc.split(',').map(Number);
            data.lat = lat;
            data.lon = lon;
          }
          return { source: 'ipinfo', ...data };
        }
      }
    }

    // Fallback to ip-api.com (no key required, 45 req/min limit)
    const fallback = await fetch(
      `http://ip-api.com/json/${cleanIp}?fields=status,country,countryCode,regionName,city,lat,lon,isp,org,as,proxy`
    );
    if (fallback.ok) {
      const alt = await fallback.json();
      if (alt && alt.status === 'success') {
        return { source: 'ip-api', ...alt };
      }
    }

    return {};
  } catch (e) {
    console.error('enrichIp error', e);
    return {};
  }
}

/**
 * Summarise a list of IPs — returns aggregate stats.
 * @param {string[]} ips
 * @returns {Promise<Object>}
 */
async function summariseIps(ips) {
  const results = await Promise.allSettled(ips.map(enrichIp));
  const enriched = results
    .filter((r) => r.status === 'fulfilled' && r.value.city)
    .map((r) => r.value);

  const countries = {};
  const cities = {};
  enriched.forEach((d) => {
    countries[d.country || d.countryCode] = (countries[d.country || d.countryCode] || 0) + 1;
    cities[d.city] = (cities[d.city] || 0) + 1;
  });

  return {
    total: ips.length,
    resolved: enriched.length,
    countries,
    cities,
    details: enriched,
  };
}

module.exports = { enrichIp, summariseIps };
