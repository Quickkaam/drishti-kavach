// ============================================
// Drishti Kavach — Audit & System Log Routes
// ============================================

const express = require('express');
const supabase = require('../db/supabase');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth, requireRole('admin', 'superadmin'));

// Get system audit logs with pagination
router.get('/audit', async (req, res) => {
  try {
    const { website_id, action, page = 1, limit = 50 } = req.query;
    let query = supabase
      .from('system_audit_logs')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (website_id) query = query.eq('entity_id', website_id);
    if (action) query = query.ilike('action', `%${action}%`);

    const { data, count } = await query;

    res.json({
      logs: data || [],
      total: count || 0,
      page: parseInt(page),
      totalPages: Math.ceil((count || 0) / limit),
    });
  } catch (err) {
    console.error('Audit logs error:', err);
    res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
});

// Get login logs
router.get('/login', async (req, res) => {
  try {
    const { email, page = 1, limit = 50, startDate, endDate } = req.query;
    let query = supabase
      .from('login_logs')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (email) query = query.eq('email', email);
    if (startDate) query = query.gte('created_at', startDate);
    if (endDate) query = query.lte('created_at', endDate);

    const { data, count } = await query;

    res.json({
      logs: data || [],
      total: count || 0,
      page: parseInt(page),
      totalPages: Math.ceil((count || 0) / limit),
    });
  } catch (err) {
    console.error('Login logs error:', err);
    res.status(500).json({ error: 'Failed to fetch login logs' });
  }
});

// Get error logs
router.get('/errors', async (req, res) => {
  try {
    const { level, website_id, page = 1, limit = 50, startDate, endDate } = req.query;
    let query = supabase
      .from('error_logs')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (level) query = query.eq('level', level);
    if (website_id) query = query.eq('website_id', website_id);
    if (startDate) query = query.gte('created_at', startDate);
    if (endDate) query = query.lte('created_at', endDate);

    const { data, count } = await query;

    res.json({
      logs: data || [],
      total: count || 0,
      page: parseInt(page),
      totalPages: Math.ceil((count || 0) / limit),
    });
  } catch (err) {
    console.error('Error logs error:', err);
    res.status(500).json({ error: 'Failed to fetch error logs' });
  }
});

module.exports = router;
