// ============================================
// Drishti Kavach — IP Management Routes
// ============================================

const express = require('express');
const supabase = require('../db/supabase');
const { requireAuth, requireRole } = require('../middleware/auth');
const { validate, blockIpSchema } = require('../middleware/validate');
const { getIpIntel } = require('../services/ipIntel');
const { autoBlockIp } = require('../services/ddos');

const router = express.Router();
router.use(requireAuth);

// GET /api/ip/:ip — Intelligence lookup
router.get('/:ip', async (req, res) => {
  try {
    const intel = await getIpIntel(req.params.ip);
    res.json({ intel });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch IP intel' });
  }
});

// GET /api/ip/blocked — List blocked IPs
router.get('/blocked/list', async (req, res) => {
  try {
    const { website_id, page = 1, limit = 50 } = req.query;
    let query = supabase
      .from('ip_block_list')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (website_id) query = query.eq('website_id', website_id);

    const { data, error } = await query;
    if (error) throw error;
    res.json({ blocked: data });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch blocked IPs' });
  }
});

// POST /api/ip/block — Block IP
router.post('/block', requireRole('admin', 'analyst'), validate(blockIpSchema), async (req, res) => {
  try {
    const { ip, reason, severity, expires_at } = req.body;
    const websiteId = req.body.website_id || req.query.website_id;

    await supabase.from('ip_block_list').insert({
      website_id: websiteId || null,
      ip,
      reason,
      severity: severity || 'medium',
      blocked_by: req.user.username,
      expires_at: expires_at || null,
      is_active: true,
    });

    // Log audit
    await supabase.from('audit_logs').insert({
      website_id: websiteId || null,
      admin_user: req.user.username,
      action: 'ip_block',
      target: ip,
      details: { reason, severity },
      ip_address: req.ip,
    });

    // Emit real-time
    if (req.io) req.io.to('admin').emit('ip_blocked', { ip, reason, by: req.user.username });

    res.json({ ok: true, message: `IP ${ip} blocked` });
  } catch (err) {
    res.status(500).json({ error: 'Failed to block IP' });
  }
});

// POST /api/ip/unblock — Unblock IP
router.post('/unblock', requireRole('admin', 'analyst'), async (req, res) => {
  try {
    const { ip, reason, website_id } = req.body;

    const { error } = await supabase
      .from('ip_block_list')
      .update({
        is_active: false,
        unblocked_at: new Date().toISOString(),
        unblocked_by: req.user.username,
        unblock_reason: reason || 'Manual unblock',
      })
      .eq('ip', ip)
      .eq('is_active', true);

    if (error) throw error;

    await supabase.from('audit_logs').insert({
      website_id: website_id || null,
      admin_user: req.user.username,
      action: 'ip_unblock',
      target: ip,
      details: { reason },
      ip_address: req.ip,
    });

    res.json({ ok: true, message: `IP ${ip} unblocked` });
  } catch (err) {
    res.status(500).json({ error: 'Failed to unblock IP' });
  }
});

// POST /api/ip/whitelist — Add to whitelist
router.post('/whitelist', requireRole('admin'), async (req, res) => {
  try {
    const { ip, reason, website_id } = req.body;

    await supabase.from('ip_whitelist').insert({
      website_id: website_id || null,
      ip,
      reason,
      added_by: req.user.username,
    });

    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to whitelist IP' });
  }
});

// DELETE /api/ip/whitelist/:id — Remove from whitelist
router.delete('/whitelist/:id', requireRole('admin'), async (req, res) => {
  try {
    await supabase.from('ip_whitelist').update({ is_active: false }).eq('id', req.params.id);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to remove from whitelist' });
  }
});

module.exports = router;
