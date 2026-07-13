// ============================================
// Drishti Kavach — User Management Routes
// ============================================

const express = require('express');
const bcrypt = require('bcryptjs');
const supabase = require('../db/supabase');
const { requireAuth, requireRole } = require('../middleware/auth');
const { validate, createUserSchema } = require('../middleware/validate');

const router = express.Router();
router.use(requireAuth, requireRole('admin'));

// GET /api/users
router.get('/', async (req, res) => {
  try {
    const { data } = await supabase
      .from('users')
      .select('id, username, email, role, created_at, last_login, is_active')
      .order('created_at', { ascending: false });
    res.json({ users: data });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// POST /api/users — Create user
router.post('/', validate(createUserSchema), async (req, res) => {
  try {
    const { username, email, password, role = 'viewer' } = req.body;
    const hash = await bcrypt.hash(password, 12);

    const { data, error } = await supabase
      .from('users')
      .insert({ username, email, password_hash: hash, role })
      .select('id, username, email, role')
      .single();

    if (error) {
      if (error.code === '23505') return res.status(409).json({ error: 'User already exists' });
      throw error;
    }

    res.status(201).json({ user: data });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// PATCH /api/users/:id
router.patch('/:id', async (req, res) => {
  try {
    const { role, is_active, password } = req.body;
    const updates = {};
    if (role) updates.role = role;
    if (typeof is_active === 'boolean') updates.is_active = is_active;
    if (password) updates.password_hash = await bcrypt.hash(password, 12);

    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', req.params.id)
      .select('id, username, email, role, is_active')
      .single();

    if (error) throw error;
    res.json({ user: data });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// DELETE /api/users/:id
router.delete('/:id', async (req, res) => {
  try {
    if (req.params.id === String(req.user.id)) {
      return res.status(400).json({ error: 'Cannot delete yourself' });
    }
    await supabase.from('users').update({ is_active: false }).eq('id', req.params.id);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

module.exports = router;
