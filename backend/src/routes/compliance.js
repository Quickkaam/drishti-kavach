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

// GET /api/compliance/export
router.get('/export', async (req, res) => {
  try {
    const user_id = req.user.id;
    
    // Fetch all user related data
    const [{ data: profile }, { data: audits }] = await Promise.all([
      supabase.from('users').select('*').eq('id', user_id).single(),
      supabase.from('audit_logs').select('*').eq('admin_user', req.user.username)
    ]);

    const exportData = {
      profile,
      activity_logs: audits || [],
      exported_at: new Date().toISOString()
    };

    // Audit the export action
    try {
      await supabase.from('compliance_logs').insert({
        user_id,
        action: 'data_export',
        data_type: 'full_profile_and_activity',
        ip_address: req.ip
      });
    } catch(e) {}

    res.setHeader('Content-Disposition', `attachment; filename="gdpr_export_${req.user.username}.json"`);
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify(exportData, null, 2));
  } catch (err) {
    console.error('Export error:', err);
    res.status(500).json({ error: 'Failed to export data' });
  }
});

module.exports = router;
