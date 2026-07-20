// ============================================
// Drishti Kavach — Auth Routes
// ============================================

const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const supabase = require('../db/supabase');
const { validate, loginSchema } = require('../middleware/validate');
const { requireAuth } = require('../middleware/auth');
const { verifyTurnstile } = require('../middleware/turnstile');
const { logAuthEvent, logError: logErrorLog } = require('../services/logging');
const { notifyLogin, createDefaultPreferences, getNotificationPreferences } = require('../services/notifications');
const { fetchIpInfo } = require('../utils/loginLogger');

const router = express.Router();

const crypto = require('crypto');

// Generate tokens
const generateTokens = (userId, role) => {
  const access = jwt.sign(
    { userId, role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '1h' }
  );
  const refresh = jwt.sign(
    { userId, role, jti: uuidv4() },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
  );
  return { access, refresh };
};

// POST /api/auth/login
router.post('/login', validate(loginSchema), verifyTurnstile({ optional: true }), async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log('Login attempt:', { email, passwordLength: password?.length });
    console.log('DEEPSEEK_API_KEY configured:', !!process.env.DEEPSEEK_API_KEY);
    console.log('DEEPSEEK_API_KEY_BACKUP configured:', !!process.env.DEEPSEEK_API_KEY_BACKUP);

    const emailHash = crypto.createHash('sha512').update(email).digest('hex');

    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email_hash', emailHash)
      .eq('is_active', true)
      .single();

    if (error || !user) {
      console.log('User not found:', { email, emailHash, error: error?.message });
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    console.log('User found:', { id: user.id, emailHash: user.email_hash, password_algorithm: user.password_algorithm });

    let valid = false;
    if (user.password_algorithm === 'pbkdf2-sha512') {
      const hash = crypto.pbkdf2Sync(
        password,
        Buffer.from(user.password_salt, 'hex'),
        user.password_iterations || 100000,
        64,
        'sha512'
      ).toString('hex');
      valid = hash === user.password_hash;
      console.log('PBKDF2 check:', { hashMatches: valid, password_iterations: user.password_iterations });
    } else {
      valid = await bcrypt.compare(password, user.password_hash);
      console.log('Bcrypt check:', { hashMatches: valid });
    }

    if (!valid) {
      console.log('Password validation failed:', { providedPassword: password, storedHash: user.password_hash?.substring(0, 50) + '...' });
      
      // Log failed login attempt
      await logAuthEvent({
        email,
        ip: req.ip,
        success: false,
        failureReason: 'Invalid credentials',
        userAgent: req.headers['user-agent']
      }).catch(err => console.error('[LOG FAILED LOGIN]', err));
      
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    console.log('Login successful for user:', user.id);

    // Auto-upgrade the designated Super Admin (hardcoded for reliability in prod)
    if (email === 'whitehatwolf22@gmail.com' && user.role !== 'superadmin') {
      user.role = 'superadmin';
      await supabase.from('users').update({ role: 'superadmin' }).eq('id', user.id);
      console.log('Upgraded user to superadmin role.');
    }

    // Check for location change (async)
    if (user.last_ip && user.last_ip !== req.ip && (user.role === 'admin' || user.role === 'superadmin')) {
      const { fetchIpInfo } = require('../utils/loginLogger');
      const alertService = require('../services/alerts');
      Promise.all([fetchIpInfo(user.last_ip), fetchIpInfo(req.ip)])
        .then(([oldLoc, newLoc]) => {
          const oldCity = oldLoc.city || 'Unknown';
          const newCity = newLoc.city || 'Unknown';
          const oldCountry = oldLoc.country || 'Unknown';
          const newCountry = newLoc.country || 'Unknown';
          
          if (oldCity !== newCity || oldCountry !== newCountry) {
            alertService.sendAlert({
              title: '🚨 Unusual Login Location Detected',
              message: `Admin ${user.username} (${email}) logged in from **${newCity}, ${newCountry}** (IP: ${req.ip}).\nPreviously logged in from **${oldCity}, ${oldCountry}** (IP: ${user.last_ip}).\nIf this was not you, please reset your password immediately.`,
              severity: 'critical'
            });
          }
        })
        .catch(err => console.error('Geoloc check failed:', err));
    }

    // Update last login
    await supabase.from('users').update({
      last_login: new Date().toISOString(),
      last_ip: req.ip,
    }).eq('id', user.id);

    const { access, refresh } = generateTokens(user.id, user.role);

    // Log the login event (email, IP, enriched location)
    const { logLoginEvent } = require('../utils/loginLogger');
    // req.io is attached in server.js middleware
    logLoginEvent({ userId: user.id, email, ip: req.ip, io: req.io }).catch(console.error);

    // Log successful login to database
    await logAuthEvent({
      userId: user.id,
      email,
      ip: req.ip,
      success: true,
      userAgent: req.headers['user-agent']
    }).catch(err => console.error('[LOG LOGIN EVENT]', err));

    // Send login notification
    const location = await fetchIpInfo(req.ip);
    notifyLogin(user, req.ip, location).catch(err => console.error('[LOGIN NOTIFICATION]', err));

    // Ensure user has notification preferences
    const existingPrefs = await getNotificationPreferences(user.id);
    if (!existingPrefs) {
      await createDefaultPreferences(user.id, user.role);
    }

    res.json({
      token: access,
      refresh_token: refresh,
      user: {
        id: user.id,
        username: user.username,
        email: email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    
    // Log error to database
    await logErrorLog({ 
      error: err, 
      message: 'Login error', 
      context: { email, ip: req.ip },
      level: 'error'
    }).catch(logErr => console.error('[LOG LOGIN ERROR]', logErr));
    
    res.status(500).json({ error: 'Login failed' });
  }
});

// POST /api/auth/refresh
router.post('/refresh', async (req, res) => {
  try {
    const { refresh_token } = req.body;
    if (!refresh_token) return res.status(400).json({ error: 'Refresh token required' });

    const decoded = jwt.verify(refresh_token, process.env.JWT_REFRESH_SECRET);
    const { access, refresh } = generateTokens(decoded.userId, decoded.role);

    res.json({ token: access, refresh_token: refresh });
  } catch {
    res.status(401).json({ error: 'Invalid refresh token' });
  }
});

// POST /api/auth/logout
router.post('/logout', requireAuth, (_req, res) => {
  // Client should discard token; future: implement token blocklist
  res.json({ message: 'Logged out' });
});

// GET /api/auth/me
router.get('/me', requireAuth, (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;
