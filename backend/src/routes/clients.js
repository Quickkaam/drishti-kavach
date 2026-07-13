// ============================================
// Drishti Kavach — Client Management Routes
// ============================================

const express = require('express');
const supabase = require('../db/supabase');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth, requireRole('admin'));

router.get('/', async (req, res) => {
  try {
    const { data } = await supabase.from('clients').select('*, websites(id, name, domain, status)').order('created_at', { ascending: false });
    res.json({ clients: data });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch clients' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { company_name, contact_name, contact_email, contact_phone, plan } = req.body;
    const { data, error } = await supabase.from('clients').insert({ company_name, contact_name, contact_email, contact_phone, plan: plan || 'free' }).select().single();
    if (error) throw error;
    res.status(201).json({ client: data });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create client' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { data } = await supabase.from('clients').select('*, websites(*)').eq('id', req.params.id).single();
    if (!data) return res.status(404).json({ error: 'Not found' });
    res.json({ client: data });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch client' });
  }
});

router.patch('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase.from('clients').update({ ...req.body, updated_at: new Date().toISOString() }).eq('id', req.params.id).select().single();
    if (error) throw error;
    res.json({ client: data });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update client' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await supabase.from('clients').delete().eq('id', req.params.id);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete client' });
  }
});

module.exports = router;
