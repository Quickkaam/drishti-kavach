// ============================================
// Drishti Kavach — Security Events Routes
// ============================================

const express = require('express');
const supabase = require('../db/supabase');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

// GET /api/security/events
router.get('/events', async (req, res) => {
  try {
    const {
      website_id, severity, event_type, status,
      ip, from, to, page = 1, limit = 50,
    } = req.query;

    let query = supabase
      .from('security_events')
      .select('*')
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (website_id) query = query.eq('website_id', website_id);
    if (severity) query = query.eq('severity', severity);
    if (event_type) query = query.eq('event_type', event_type);
    if (status) query = query.eq('status', status);
    if (ip) query = query.eq('user_ip', ip);
    if (from) query = query.gte('created_at', from);
    if (to) query = query.lte('created_at', to);

    const { data, error, count } = await query;
    if (error) throw error;
    res.json({ events: data, total: count });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch security events' });
  }
});

// PATCH /api/security/:id — Update status / assign
router.patch('/:id', requireRole('admin', 'analyst'), async (req, res) => {
  try {
    const { status, assigned_to, investigation_notes, resolution_notes } = req.body;
    const updates = {};
    if (status) updates.status = status;
    if (assigned_to) updates.assigned_to = assigned_to;
    if (investigation_notes) updates.investigation_notes = investigation_notes;
    if (resolution_notes) {
      updates.resolution_notes = resolution_notes;
      updates.is_resolved = true;
      updates.resolved_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('security_events')
      .update(updates)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    res.json({ event: data });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update event' });
  }
});

// POST /api/security/:id/block — Block IP from event
router.post('/:id/block', requireRole('admin', 'analyst'), async (req, res) => {
  try {
    const { data: event } = await supabase
      .from('security_events')
      .select('user_ip, website_id, event_type')
      .eq('id', req.params.id)
      .single();

    if (!event) return res.status(404).json({ error: 'Event not found' });

    await supabase.from('ip_block_list').insert({
      website_id: event.website_id,
      ip: event.user_ip,
      reason: `Security event: ${event.event_type}`,
      blocked_by: req.user.username,
      severity: 'high',
      is_active: true,
    });

    await supabase.from('security_events').update({ is_blocked: true }).eq('id', req.params.id);

    await supabase.from('audit_logs').insert({
      website_id: event.website_id,
      admin_user: req.user.username,
      action: 'ip_block_from_event',
      target: event.user_ip,
      details: { event_id: req.params.id },
      ip_address: req.ip,
    });

    res.json({ ok: true, blocked_ip: event.user_ip });
  } catch (err) {
    res.status(500).json({ error: 'Failed to block IP' });
  }
});

// GET /api/security/mitre — MITRE techniques summary
router.get('/mitre', async (req, res) => {
  try {
    const { website_id } = req.query;
    let query = supabase
      .from('security_events')
      .select('mitre_technique_id, mitre_tactic, event_type')
      .not('mitre_technique_id', 'is', null);

    if (website_id) query = query.eq('website_id', website_id);
    const { data } = await query;

    // Group by technique
    const techniques = {};
    (data || []).forEach(e => {
      const key = e.mitre_technique_id;
      if (!techniques[key]) {
        techniques[key] = { id: key, tactic: e.mitre_tactic, count: 0, types: [] };
      }
      techniques[key].count++;
      if (!techniques[key].types.includes(e.event_type)) {
        techniques[key].types.push(e.event_type);
      }
    });

    res.json({ techniques: Object.values(techniques) });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch MITRE data' });
  }
});

module.exports = router;
