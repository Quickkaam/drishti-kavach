// ============================================
// Drishti Kavach — Vulnerability & CVE Routes
// NVD API + CIRCL + OSV + GitHub Advisories + HIBP
// ============================================

const express = require('express');
const supabase = require('../db/supabase');
const { requireAuth, requireRole } = require('../middleware/auth');
const { searchCVEs, getCVEDetails, queryOSV, searchGitHubAdvisories, checkBreaches } = require('../services/breach');

const router = express.Router();
router.use(requireAuth);

// GET /api/vulnerabilities — Recent high/critical security events
router.get('/', async (req, res) => {
  try {
    const { website_id } = req.query;
    let query = supabase
      .from('security_events')
      .select('id, event_type, severity, url, created_at, mitre_technique_id, mitre_tactic, status')
      .in('severity', ['high', 'critical'])
      .order('created_at', { ascending: false })
      .limit(100);
    if (website_id) query = query.eq('website_id', website_id);
    const { data } = await query;
    res.json({ vulnerabilities: data });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch vulnerabilities' });
  }
});

// GET /api/vulnerabilities/cve/search?q=apache&severity=HIGH
// Search NVD CVE database — FREE, no key needed
router.get('/cve/search', async (req, res) => {
  try {
    const { q, severity, limit = 10 } = req.query;
    if (!q) return res.status(400).json({ error: 'Query parameter "q" is required' });
    const result = await searchCVEs(q, { limit: Number(limit), severity });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'CVE search failed' });
  }
});

// GET /api/vulnerabilities/cve/:id — CVE details via CIRCL
router.get('/cve/:id', async (req, res) => {
  try {
    const cve = await getCVEDetails(req.params.id);
    if (!cve) return res.status(404).json({ error: 'CVE not found' });
    res.json({ cve });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch CVE details' });
  }
});

// GET /api/vulnerabilities/osv?package=express&ecosystem=npm
// Query OSV for package vulnerabilities — FREE, no key needed
router.get('/osv', async (req, res) => {
  try {
    const { package: pkg, ecosystem = 'npm' } = req.query;
    if (!pkg) return res.status(400).json({ error: 'Parameter "package" is required' });
    const vulns = await queryOSV(pkg, ecosystem);
    res.json({ package: pkg, ecosystem, vulnerabilities: vulns });
  } catch (err) {
    res.status(500).json({ error: 'OSV query failed' });
  }
});

// GET /api/vulnerabilities/advisories?q=sql+injection
// GitHub Security Advisories — FREE, no key needed
router.get('/advisories', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.status(400).json({ error: 'Query parameter "q" is required' });
    const advisories = await searchGitHubAdvisories(q);
    res.json({ advisories });
  } catch (err) {
    res.status(500).json({ error: 'Advisory search failed' });
  }
});

// GET /api/vulnerabilities/breach?domain=example.com
// HaveIBeenPwned domain breach check
router.get('/breach', requireRole('admin', 'superadmin'), async (req, res) => {
  try {
    const { domain } = req.query;
    if (!domain) return res.status(400).json({ error: 'Parameter "domain" is required' });
    const result = await checkBreaches(domain);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Breach check failed' });
  }
});

// POST /api/vulnerabilities/scan — Scan summary from DB events
router.post('/scan', requireRole('admin', 'analyst'), async (req, res) => {
  try {
    const { website_id } = req.body;
    const since7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    let query = supabase
      .from('security_events')
      .select('event_type, severity, mitre_technique_id')
      .gte('created_at', since7d);
    if (website_id) query = query.eq('website_id', website_id);
    const { data } = await query;

    const summary = {
      total: data?.length || 0,
      critical: data?.filter(e => e.severity === 'critical').length || 0,
      high: data?.filter(e => e.severity === 'high').length || 0,
      by_type: (data || []).reduce((acc, e) => {
        acc[e.event_type] = (acc[e.event_type] || 0) + 1;
        return acc;
      }, {}),
      scanned_at: new Date().toISOString(),
    };

    res.json({ scan: summary });
  } catch (err) {
    res.status(500).json({ error: 'Scan failed' });
  }
});

module.exports = router;

