// ============================================
// Drishti Kavach — DDoS Routes
// ============================================

const express = require('express');
const supabase = require('../db/supabase');
const { requireAuth, requireRole } = require('../middleware/auth');
const ddosService = require('../services/ddos');

const router = express.Router();
router.use(requireAuth);

// GET /api/ddos/status
router.get('/status', async (req, res) => {
  try {
    const { website_id } = req.query;
    let query = supabase
      .from('ddos_events')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (website_id) query = query.eq('website_id', website_id);
    const { data } = await query;
    res.json({ active_events: data, count: data?.length || 0 });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch DDoS status' });
  }
});

// GET /api/ddos/events
router.get('/events', async (req, res) => {
  try {
    const { website_id, limit = 50 } = req.query;
    let query = supabase
      .from('ddos_events')
      .select('*, ddos_mitigations(*)')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (website_id) query = query.eq('website_id', website_id);
    const { data } = await query;
    res.json({ events: data });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch DDoS events' });
  }
});

// POST /api/ddos/trigger — Manual check
router.post('/trigger', requireRole('admin', 'analyst'), async (req, res) => {
  try {
    const { website_id } = req.body;
    await ddosService.checkTrafficSpike(website_id, req.io);
    await ddosService.checkIpFlood(website_id, req.io);
    res.json({ ok: true, message: 'DDoS check triggered' });
  } catch (err) {
    res.status(500).json({ error: 'DDoS check failed' });
  }
});

// PATCH /api/ddos/resolve/:id
router.patch('/resolve/:id', requireRole('admin', 'analyst'), async (req, res) => {
  try {
    await supabase.from('ddos_events')
      .update({ status: 'resolved', resolved_at: new Date().toISOString() })
      .eq('id', req.params.id);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to resolve' });
  }
});

module.exports = router;
