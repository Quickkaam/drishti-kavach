// ============================================
// Drishti Kavach — Form Submissions Routes
// ============================================

const express = require('express');
const supabase = require('../db/supabase');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

// GET /api/forms
router.get('/', async (req, res) => {
  try {
    const { website_id, status, form_type, page = 1, limit = 50 } = req.query;

    let query = supabase
      .from('form_submissions')
      .select('*')
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (website_id) query = query.eq('website_id', website_id);
    if (status) query = query.eq('status', status);
    if (form_type) query = query.eq('form_type', form_type);

    const { data, error } = await query;
    if (error) throw error;
    res.json({ forms: data });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch forms' });
  }
});

// PATCH /api/forms/:id — Mark read/replied/spam
router.patch('/:id', requireRole('admin', 'analyst'), async (req, res) => {
  try {
    const { status } = req.body;
    const updates = { status };
    if (status === 'read') updates.read_at = new Date().toISOString();
    if (status === 'replied') updates.replied_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('form_submissions')
      .update(updates)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    res.json({ form: data });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update form' });
  }
});

// DELETE /api/forms/:id
router.delete('/:id', requireRole('admin'), async (req, res) => {
  try {
    await supabase.from('form_submissions').delete().eq('id', req.params.id);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete form' });
  }
});

module.exports = router;
