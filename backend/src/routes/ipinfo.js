// ============================================
// Drishti Kavach — IPInfo Routes
// ============================================

const express = require('express');
const { requireAuth, requireRole } = require('../middleware/auth');
const { enrichIp, summariseIps } = require('../services/ipinfo');

const router = express.Router();
router.use(requireAuth);

// GET /api/ipinfo/enrich?ip=x.x.x.x  (defaults to caller's IP)
router.get('/enrich', async (req, res) => {
  try {
    const ip = req.query.ip || req.ip.replace(/^::ffff:/, '');
    const data = await enrichIp(ip);
    res.json({ ip, ...data });
  } catch (err) {
    console.error('IPInfo enrich error', err);
    res.status(500).json({ error: 'Failed to enrich IP' });
  }
});

// GET /api/ipinfo/me — Get the caller's own IP info
router.get('/me', async (req, res) => {
  try {
    const ip = req.ip.replace(/^::ffff:/, '');
    const data = await enrichIp(ip);
    res.json({ ip, ...data });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch your IP info' });
  }
});

// POST /api/ipinfo/summarise — Summarise a batch of IPs
router.post('/summarise', async (req, res) => {
  try {
    const { ips } = req.body;
    if (!Array.isArray(ips) || ips.length === 0) {
      return res.status(400).json({ error: 'Provide an array of IPs' });
    }
    if (ips.length > 100) {
      return res.status(400).json({ error: 'Max 100 IPs per request' });
    }
    const summary = await summariseIps(ips);
    res.json(summary);
  } catch (err) {
    res.status(500).json({ error: 'Failed to summarise IPs' });
  }
});

// POST /api/ipinfo/map — Return enriched IPs with lat/lon for map visualisation
router.post('/map', async (req, res) => {
  try {
    const { ips } = req.body;
    if (!Array.isArray(ips) || ips.length === 0) {
      return res.status(400).json({ error: 'Provide an array of IPs' });
    }
    const results = await Promise.allSettled(ips.map(enrichIp));
    const points = results
      .filter((r) => r.status === 'fulfilled' && (r.value.lat || r.value.loc))
      .map((r) => {
        const d = r.value;
        const lat = d.lat || (d.loc ? parseFloat(d.loc.split(',')[0]) : null);
        const lon = d.lon || (d.loc ? parseFloat(d.loc.split(',')[1]) : null);
        return { ip: d.ip || d.query, lat, lon, city: d.city, country: d.country || d.countryCode, org: d.org };
      })
      .filter((p) => p.lat && p.lon);

    res.json({ points });
  } catch (err) {
    res.status(500).json({ error: 'Failed to map IPs' });
  }
});

module.exports = router;
