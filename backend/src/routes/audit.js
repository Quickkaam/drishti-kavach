// ============================================
// Drishti Kavach — Audit Log Routes
// ============================================

const express = require('express');
const supabase = require('../db/supabase');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth, requireRole('admin'));

router.get('/', async (req, res) => {
  try {
    const { website_id, action, page = 1, limit = 100 } = req.query;
    let query = supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (website_id) query = query.eq('website_id', website_id);
    if (action) query = query.eq('action', action);

    const { data } = await query;
    res.json({ logs: data });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
});

module.exports = router;
