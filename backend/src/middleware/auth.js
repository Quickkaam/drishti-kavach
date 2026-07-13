// ============================================
// Drishti Kavach — Auth Middleware
// ============================================

const jwt = require('jsonwebtoken');
const supabase = require('../db/supabase');
const encryption = require('../utils/encryption');

// Verify JWT token
const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Fetch user from DB to ensure still active
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', decoded.userId)
      .single();

    if (error || !user || !user.is_active) {
      return res.status(401).json({ error: 'Invalid or inactive user' });
    }

    // Decrypt email if needed
    if (user.email_encrypted) {
      try {
        user.email = await encryption.decryptData(user.email_encrypted);
      } catch (decryptError) {
        console.error('Auth middleware: Failed to decrypt email', decryptError);
        user.email = null;
      }
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired', code: 'TOKEN_EXPIRED' });
    }
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// Require specific role(s)
const requireRole = (...roles) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ error: 'Insufficient permissions' });
  }
  next();
};

// Validate SDK API key (for client-side tracking)
const requireApiKey = async (req, res, next) => {
  try {
    const apiKey = req.headers['x-api-key'];
    if (!apiKey) {
      return res.status(401).json({ error: 'API key required' });
    }

    const { data: website, error } = await supabase
      .from('websites')
      .select('id, name, domain, status, settings')
      .eq('api_key', apiKey)
      .eq('status', 'active')
      .single();

    if (error || !website) {
      return res.status(401).json({ error: 'Invalid API key' });
    }

    req.website = website;
    next();
  } catch (err) {
    return res.status(500).json({ error: 'Auth error' });
  }
};

module.exports = { requireAuth, requireRole, requireApiKey };
