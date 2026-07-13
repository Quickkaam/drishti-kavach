// ============================================
// Drishti Kavach — Compliance Routes
// ============================================

const express = require('express');
const supabase = require('../db/supabase');
const { requireAuth, requireRole } = require('../middleware/auth');
const { callDeepSeek } = require('../services/ai');

const router = express.Router();
router.use(requireAuth);

// GET /api/compliance/gdpr
router.get('/gdpr', async (req, res) => {
  try {
    const { website_id } = req.query;
    const checks = {
      data_retention: true,
      ip_logging: 'Anonymized after 90 days',
      form_data: 'Stored with consent',
      right_to_erasure: 'Manual process available',
      dpo_contact: process.env.ADMIN_EMAIL || 'Not configured',
      encryption_in_transit: 'HTTPS enforced',
    };
    res.json({ gdpr: checks, status: 'partial', website_id });
  } catch (err) {
    res.status(500).json({ error: 'Failed' });
  }
});

// GET /api/compliance/logs
router.get('/logs', async (req, res) => {
  try {
    const { website_id } = req.query;
    let query = supabase.from('compliance_logs').select('*').order('created_at', { ascending: false }).limit(100);
    if (website_id) query = query.eq('website_id', website_id);
    const { data } = await query;
    res.json({ logs: data });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch compliance logs' });
  }
});

module.exports = router;
