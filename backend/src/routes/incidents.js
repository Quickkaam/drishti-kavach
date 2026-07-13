// ============================================
// Drishti Kavach — Incidents Routes
// ============================================

const express = require('express');
const supabase = require('../db/supabase');
const { requireAuth, requireRole } = require('../middleware/auth');
const { validate, incidentSchema } = require('../middleware/validate');

const router = express.Router();
router.use(requireAuth);

// GET /api/incidents
router.get('/', async (req, res) => {
  try {
    const { website_id, status, severity, page = 1, limit = 50 } = req.query;

    let query = supabase
      .from('incidents')
      .select('*')
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (website_id) query = query.eq('website_id', website_id);
    if (status) query = query.eq('status', status);
    if (severity) query = query.eq('severity', severity);

    const { data, error } = await query;
    if (error) throw error;
    res.json({ incidents: data });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch incidents' });
  }
});

// POST /api/incidents — Create incident
router.post('/', requireRole('admin', 'analyst'), validate(incidentSchema), async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('incidents')
      .insert({ ...req.body, created_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .select()
      .single();

    if (error) throw error;

    if (req.io) req.io.to('admin').emit('new_incident', data);

    res.status(201).json({ incident: data });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create incident' });
  }
});

// GET /api/incidents/:id
router.get('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('incidents')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error || !data) return res.status(404).json({ error: 'Not found' });
    res.json({ incident: data });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch incident' });
  }
});

// PATCH /api/incidents/:id
router.patch('/:id', requireRole('admin', 'analyst'), async (req, res) => {
  try {
    const { status, assigned_to, investigation_notes, resolution_notes } = req.body;
    const updates = { updated_at: new Date().toISOString() };

    if (status) updates.status = status;
    if (assigned_to) updates.assigned_to = assigned_to;
    if (investigation_notes) updates.investigation_notes = investigation_notes;
    if (resolution_notes) {
      updates.resolution_notes = resolution_notes;
      updates.resolved_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('incidents')
      .update(updates)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    res.json({ incident: data });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update incident' });
  }
});

module.exports = router;
