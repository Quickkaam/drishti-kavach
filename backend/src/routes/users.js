// ============================================
// Drishti Kavach — User Management Routes
// Super Admin: create, update, delete accounts
// ============================================

const express = require('express');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const supabase = require('../db/supabase');
const { requireAuth, requireRole } = require('../middleware/auth');
const { validate, createUserSchema } = require('../middleware/validate');
const encryption = require('../utils/encryption');

const router = express.Router();
router.use(requireAuth, requireRole('admin', 'superadmin'));

// GET /api/users — List all users
router.get('/', async (req, res) => {
  try {
    const { data } = await supabase
      .from('users')
      .select('id, username, email_encrypted, role, created_at, last_login, is_active, last_ip')
      .order('created_at', { ascending: false });

    // Decrypt emails where needed
    const users = await Promise.all(
      (data || []).map(async (u) => {
        if (u.email_encrypted) {
          try {
            u.email = await encryption.decryptData(u.email_encrypted);
          } catch { 
            u.email = u.email_encrypted; // fallback to plain if it was stored unencrypted
          }
        }
        delete u.email_encrypted;
        return u;
      })
    );

    res.json({ users });
  } catch (err) {
    console.error('Fetch users error:', err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// POST /api/users — Create user (super admin only)
router.post('/', validate(createUserSchema), async (req, res) => {
  try {
    const { username, email, password, role = 'user' } = req.body;

    // Validate role — only 'user' or 'admin' allowed via this endpoint
    const allowedRoles = ['user', 'admin'];
    const finalRole = allowedRoles.includes(role) ? role : 'user';

    // Hash password with PBKDF2-SHA512 (matching existing auth system)
    const salt = crypto.randomBytes(32).toString('hex');
    const iterations = 100000;
    const passwordHash = crypto
      .pbkdf2Sync(password, Buffer.from(salt, 'hex'), iterations, 64, 'sha512')
      .toString('hex');

    // Hash email for lookup
    const emailHash = crypto.createHash('sha512').update(email).digest('hex');

    // Encrypt email for storage
    let emailEncrypted = null;
    try {
      emailEncrypted = await encryption.encryptData(email);
    } catch { /* fallback: store plain */ }

    const { data, error } = await supabase
      .from('users')
      .insert({
        username,
        email_encrypted: emailEncrypted || email,
        email_hash: emailHash,
        password_hash: passwordHash,
        password_salt: salt,
        password_algorithm: 'pbkdf2-sha512',
        password_iterations: iterations,
        role: finalRole,
        is_active: true,
      })
      .select('id, username, role, created_at')
      .single();

    if (error) {
      if (error.code === '23505') return res.status(409).json({ error: 'User already exists' });
      throw error;
    }

    // Audit log
    try {
      await supabase.from('audit_logs').insert({
        admin_user: req.user.username,
        action: 'user_create',
        target: username,
        details: { role: finalRole, created_by: req.user.id },
        ip_address: req.ip,
      });
    } catch (err) {}

    res.status(201).json({ user: { ...data, email } });
  } catch (err) {
    console.error('Create user error:', err);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// PATCH /api/users/:id — Update user
router.patch('/:id', async (req, res) => {
  try {
    const { role, is_active, password } = req.body;
    const updates = {};

    if (role) {
      const allowedRoles = ['user', 'admin'];
      if (allowedRoles.includes(role)) updates.role = role;
    }
    if (typeof is_active === 'boolean') updates.is_active = is_active;
    if (password) {
      const salt = crypto.randomBytes(32).toString('hex');
      const iterations = 100000;
      updates.password_hash = crypto
        .pbkdf2Sync(password, Buffer.from(salt, 'hex'), iterations, 64, 'sha512')
        .toString('hex');
      updates.password_salt = salt;
      updates.password_algorithm = 'pbkdf2-sha512';
      updates.password_iterations = iterations;
    }

    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', req.params.id)
      .select('id, username, email, role, is_active')
      .single();

    if (error) throw error;

    // Audit log
    try {
      await supabase.from('audit_logs').insert({
        admin_user: req.user.username,
        action: 'user_update',
        target: data.username,
        details: { updates: Object.keys(updates) },
        ip_address: req.ip,
      });
    } catch (err) {}

    res.json({ user: data });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// POST /api/users/me/delete-request
router.post('/me/delete-request', async (req, res) => {
  try {
    const user_id = req.user.id;
    
    // Deactivate user and mark for deletion
    await supabase.from('users').update({ 
      is_active: false, 
      deletion_requested_at: new Date().toISOString() 
    }).eq('id', user_id);

    // Audit the action
    try {
      await supabase.from('compliance_logs').insert({
        user_id,
        action: 'account_deletion_requested',
        ip_address: req.ip
      });
    } catch(e) {}

    res.json({ ok: true, message: 'Account deletion requested' });
  } catch (err) {
    console.error('Delete request error:', err);
    res.status(500).json({ error: 'Failed to process deletion request' });
  }
});

// GET /api/users/:id — Soft-delete (deactivate) user
router.delete('/:id', async (req, res) => {
  try {
    if (req.params.id === String(req.user.id)) {
      return res.status(400).json({ error: 'Cannot delete yourself' });
    }

    // Check target isn't a super admin
    const { data: target } = await supabase
      .from('users')
      .select('username, role')
      .eq('id', req.params.id)
      .single();

    if (target && target.role === 'superadmin') {
      return res.status(403).json({ error: 'Cannot delete a super admin' });
    }

    await supabase.from('users').update({ is_active: false }).eq('id', req.params.id);

    // Audit log
    try {
      await supabase.from('audit_logs').insert({
        admin_user: req.user.username,
        action: 'user_delete',
        target: target?.username || req.params.id,
        ip_address: req.ip,
      });
    } catch (err) {}

    res.json({ ok: true, message: 'User deactivated' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// DELETE /api/users/:id/permanent — Permanently delete user (super admin only)
router.delete('/:id/permanent', requireRole('superadmin'), async (req, res) => {
  try {
    if (req.params.id === String(req.user.id)) {
      return res.status(400).json({ error: 'Cannot delete yourself' });
    }

    const { data: target } = await supabase
      .from('users')
      .select('username, role')
      .eq('id', req.params.id)
      .single();

    if (target && target.role === 'superadmin') {
      return res.status(403).json({ error: 'Cannot delete a super admin' });
    }

    const { error } = await supabase.from('users').delete().eq('id', req.params.id);
    if (error) throw error;

    // Audit log
    try {
      await supabase.from('audit_logs').insert({
        admin_user: req.user.username,
        action: 'user_permanent_delete',
        target: target?.username || req.params.id,
        ip_address: req.ip,
      });
    } catch (err) {}

    res.json({ ok: true, message: 'User permanently deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to permanently delete user' });
  }
});

// PATCH /api/users/:id/reset-password — Reset password (super admin only)
router.patch('/:id/reset-password', requireRole('superadmin'), async (req, res) => {
  try {
    const { password } = req.body;
    if (!password || password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters long' });
    }

    const salt = crypto.randomBytes(32).toString('hex');
    const iterations = 100000;
    const passwordHash = crypto
      .pbkdf2Sync(password, Buffer.from(salt, 'hex'), iterations, 64, 'sha512')
      .toString('hex');

    const updates = {
      password_hash: passwordHash,
      password_salt: salt,
      password_algorithm: 'pbkdf2-sha512',
      password_iterations: iterations,
    };

    const { data: target, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', req.params.id)
      .select('username')
      .single();

    if (error) throw error;

    // Audit log
    try {
      await supabase.from('audit_logs').insert({
        admin_user: req.user.username,
        action: 'user_password_reset',
        target: target.username,
        ip_address: req.ip,
      });
    } catch (err) {}

    res.json({ ok: true, message: 'Password reset successfully' });
  } catch (err) {
    console.error('Password reset error:', err);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

module.exports = router;
