// ============================================
// Drishti Kavach — Dashboard Routes
// ============================================

const express = require('express');
const supabase = require('../db/supabase');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

// GET /api/dashboard/stats
router.get('/stats', async (req, res) => {
  try {
    const websiteId = req.query.website_id;
    const filter = websiteId ? { website_id: websiteId } : {};

    const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const since7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    // Run queries in parallel
    const [
      eventsToday,
      securityToday,
      formsToday,
      blockedIPs,
      openIncidents,
      ddosActive,
      totalEvents7d,
      criticalEvents7d,
    ] = await Promise.all([
      supabase.from('events').select('id', { count: 'exact', head: true })
        .gte('timestamp', since24h).match(filter),
      supabase.from('security_events').select('id', { count: 'exact', head: true })
        .gte('created_at', since24h).match(filter),
      supabase.from('form_submissions').select('id', { count: 'exact', head: true })
        .gte('created_at', since24h).match(filter),
      supabase.from('ip_block_list').select('id', { count: 'exact', head: true })
        .eq('is_active', true).match(filter),
      supabase.from('incidents').select('id', { count: 'exact', head: true })
        .in('status', ['new', 'investigating']).match(filter),
      supabase.from('ddos_events').select('id', { count: 'exact', head: true })
        .eq('status', 'active').match(filter),
      supabase.from('events').select('id', { count: 'exact', head: true })
        .gte('timestamp', since7d).match(filter),
      supabase.from('security_events').select('id', { count: 'exact', head: true })
        .gte('created_at', since7d).in('severity', ['high', 'critical']).match(filter),
    ]);

    res.json({
      events_today: eventsToday.count || 0,
      security_events_today: securityToday.count || 0,
      forms_today: formsToday.count || 0,
      blocked_ips: blockedIPs.count || 0,
      open_incidents: openIncidents.count || 0,
      ddos_active: ddosActive.count || 0,
      total_events_7d: totalEvents7d.count || 0,
      critical_events_7d: criticalEvents7d.count || 0,
      threat_level: getThreatLevel(securityToday.count, ddosActive.count),
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// GET /api/dashboard/events — Recent activity feed
router.get('/events', async (req, res) => {
  try {
    const { website_id, limit = 50, offset = 0 } = req.query;
    let query = supabase
      .from('events')
      .select('*')
      .order('timestamp', { ascending: false })
      .range(Number(offset), Number(offset) + Number(limit) - 1);

    if (website_id) query = query.eq('website_id', website_id);

    const { data, error } = await query;
    if (error) throw error;
    res.json({ events: data });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

// GET /api/dashboard/trends — Chart data
router.get('/trends', async (req, res) => {
  try {
    const { website_id, days = 7 } = req.query;
    const since = new Date(Date.now() - Number(days) * 24 * 60 * 60 * 1000).toISOString();

    let eventsQ = supabase.from('events').select('timestamp').gte('timestamp', since);
    let secQ = supabase.from('security_events').select('created_at, severity').gte('created_at', since);

    if (website_id) {
      eventsQ = eventsQ.eq('website_id', website_id);
      secQ = secQ.eq('website_id', website_id);
    }

    const [{ data: events }, { data: security }] = await Promise.all([eventsQ, secQ]);

    // Group by day
    const grouped = {};
    for (let i = 0; i < Number(days); i++) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const key = d.toISOString().split('T')[0];
      grouped[key] = { date: key, events: 0, security: 0, critical: 0 };
    }

    (events || []).forEach(e => {
      const key = e.timestamp.split('T')[0];
      if (grouped[key]) grouped[key].events++;
    });

    (security || []).forEach(e => {
      const key = e.created_at.split('T')[0];
      if (grouped[key]) {
        grouped[key].security++;
        if (['high', 'critical'].includes(e.severity)) grouped[key].critical++;
      }
    });

    res.json({ trends: Object.values(grouped).sort((a, b) => a.date.localeCompare(b.date)) });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch trends' });
  }
});

function getThreatLevel(secCount, ddosCount) {
  if (ddosCount > 0 || secCount > 20) return 'CRITICAL';
  if (secCount > 10) return 'HIGH';
  if (secCount > 3) return 'MEDIUM';
  return 'LOW';
}

module.exports = router;
