// ============================================
// Drishti Kavach — API Token Routes
// ============================================

const express = require('express');
const crypto = require('crypto');
const supabase = require('../db/supabase');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth, requireRole('admin'));

// GET /api/tokens
router.get('/', async (req, res) => {
  try {
    const { data } = await supabase
      .from('api_tokens')
      .select('id, name, created_by, scope, expires_at, last_used_at, is_active, created_at')
      .order('created_at', { ascending: false });
    res.json({ tokens: data });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch tokens' });
  }
});

// POST /api/tokens — Generate token
router.post('/', async (req, res) => {
  try {
    const { name, scope, expires_in_days } = req.body;
    const rawToken = `dk_api_${crypto.randomBytes(32).toString('hex')}`;
    const hash = crypto.createHash('sha256').update(rawToken).digest('hex');

    const expires_at = expires_in_days
      ? new Date(Date.now() + Number(expires_in_days) * 24 * 60 * 60 * 1000).toISOString()
      : null;

    await supabase.from('api_tokens').insert({
      token_hash: hash,
      name,
      created_by: req.user.username,
      scope: scope || 'read',
      expires_at,
      is_active: true,
    });

    // Return raw token ONCE — not stored in plain text
    res.status(201).json({ token: rawToken, name, note: 'Save this token — it will not be shown again.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate token' });
  }
});

// DELETE /api/tokens/:id — Revoke
router.delete('/:id', async (req, res) => {
  try {
    await supabase.from('api_tokens').update({ is_active: false }).eq('id', req.params.id);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to revoke token' });
  }
});

module.exports = router;
