// ============================================
// Drishti Kavach — Vulnerability Scanner Routes
// ============================================

const express = require('express');
const supabase = require('../db/supabase');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

// GET /api/vulnerabilities — Recent scan results from security events
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

// POST /api/vulnerabilities/scan — Trigger scan summary
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
