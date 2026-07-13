// ============================================
// Drishti Kavach — Reports Routes
// ============================================

const express = require('express');
const supabase = require('../db/supabase');
const { requireAuth, requireRole } = require('../middleware/auth');
const { callDeepSeek } = require('../services/ai');

const router = express.Router();
router.use(requireAuth);

// GET /api/reports — List reports
router.get('/', async (req, res) => {
  try {
    const { data } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('action', 'report_generated')
      .order('created_at', { ascending: false })
      .limit(50);
    res.json({ reports: data || [] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
});

// POST /api/reports/generate — Generate a text report
router.post('/generate', requireRole('admin', 'analyst'), async (req, res) => {
  try {
    const { website_id, period = '7d' } = req.body;
    const days = period === '30d' ? 30 : 7;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

    let evQ = supabase.from('events').select('id', { count: 'exact', head: true }).gte('timestamp', since);
    let secQ = supabase.from('security_events').select('event_type, severity').gte('created_at', since);
    let blkQ = supabase.from('ip_block_list').select('id', { count: 'exact', head: true }).eq('is_active', true);

    if (website_id) {
      evQ = evQ.eq('website_id', website_id);
      secQ = secQ.eq('website_id', website_id);
      blkQ = blkQ.eq('website_id', website_id);
    }

    const [{ count: events }, { data: sec }, { count: blocked }] = await Promise.all([evQ, secQ, blkQ]);

    const prompt = `Generate a professional security report for Drishti Kavach SOC Dashboard.

Period: Last ${days} days
Total Events: ${events || 0}
Security Threats: ${sec?.length || 0}
Blocked IPs: ${blocked || 0}
Threat Breakdown: ${JSON.stringify((sec || []).reduce((acc, e) => {
  acc[e.event_type] = (acc[e.event_type] || 0) + 1;
  return acc;
}, {}))}

Write a 5-6 sentence professional security report covering: executive summary, key findings, threat analysis, and recommendations. Use formal language suitable for stakeholders.`;

    const report = await callDeepSeek(prompt);

    // Log the report generation
    await supabase.from('audit_logs').insert({
      website_id: website_id || null,
      admin_user: req.user.username,
      action: 'report_generated',
      details: { period, events, threats: sec?.length, blocked, report },
      ip_address: req.ip,
    });

    res.json({ report, period, generated_at: new Date().toISOString() });
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate report' });
  }
});

module.exports = router;
