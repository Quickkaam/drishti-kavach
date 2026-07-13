// ============================================
// Drishti Kavach — Cloudflare Turnstile Middleware
// Verification middleware for all public endpoints
// ============================================

const axios = require('axios');

/**
 * Cloudflare Turnstile verification middleware
 * @param {Object} options - Middleware options
 * @param {boolean} options.optional - Whether Turnstile is optional (default: false)
 * @param {string} options.field - Field name containing the Turnstile token (default: 'turnstile_token')
 * @returns {Function} Express middleware
 */
const verifyTurnstile = (options = {}) => {
  const { optional = false, field = 'turnstile_token' } = options;

  return async (req, res, next) => {
    // Skip if TURNSTILE_SECRET_KEY not configured (development)
    if (!process.env.TURNSTILE_SECRET_KEY) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('Turnstile: No secret key configured, skipping verification');
        return next();
      } else {
        return res.status(500).json({ error: 'Turnstile configuration missing' });
      }
    }

    // Skip if SKIP_TURNSTILE is set (for local testing or special cases)
    if (process.env.SKIP_TURNSTILE === 'true') {
      console.warn('Turnstile: SKIP_TURNSTILE=true, skipping verification');
      return next();
    }

    const token = req.body[field] || req.query[field];

    // If optional and no token provided, skip verification
    if (optional && !token) {
      return next();
    }

    // If required and no token provided, reject
    if (!token) {
      return res.status(400).json({ 
        error: 'Turnstile verification required', 
        code: 'TURNSTILE_REQUIRED' 
      });
    }

    try {
      const response = await axios.post(
        'https://challenges.cloudflare.com/turnstile/v0/siteverify',
        {
          secret: process.env.TURNSTILE_SECRET_KEY,
          response: token,
          remoteip: req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress,
        },
        { 
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          timeout: 5000,
        }
      );

      const data = response.data;

      if (!data.success) {
        // Log failed verification for security monitoring
        console.warn('Turnstile verification failed:', {
          ip: req.ip,
          errorCodes: data['error-codes'],
          timestamp: new Date().toISOString(),
        });

        return res.status(400).json({ 
          error: 'Turnstile verification failed', 
          code: 'TURNSTILE_FAILED',
          details: data['error-codes'] || ['unknown_error']
        });
      }

      // Add verification metadata to request for logging
      req.turnstileVerified = {
        success: true,
        timestamp: data.challenge_ts,
        hostname: data.hostname,
        action: data.action,
        cdata: data.cdata,
        remoteip: data.remoteip,
      };

      next();
    } catch (error) {
      console.error('Turnstile verification error:', error);

      // On network/timeout errors, allow optional bypass for UX
      if (optional && error.code === 'ECONNABORTED') {
        console.warn('Turnstile timeout, allowing request due to optional mode');
        return next();
      }

      res.status(500).json({ 
        error: 'Turnstile verification service unavailable', 
        code: 'TURNSTILE_SERVICE_UNAVAILABLE'
      });
    }
  };
};

/**
 * Turnstile site key validation middleware
 * Validates that the correct site key is being used
 */
const validateSiteKey = (expectedSiteKey) => (req, res, next) => {
  if (!expectedSiteKey) {
    return next();
  }

  const siteKey = req.headers['x-turnstile-sitekey'] || req.body.site_key;
  
  if (siteKey && siteKey !== expectedSiteKey) {
    return res.status(400).json({ 
      error: 'Invalid Turnstile site key', 
      code: 'INVALID_SITE_KEY' 
    });
  }

  next();
};

/**
 * Turnstile health check endpoint
 */
const turnstileHealthCheck = async (req, res) => {
  try {
    // Quick test to verify Turnstile service is reachable
    const response = await axios.post(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      {
        secret: process.env.TURNSTILE_SECRET_KEY,
        response: 'test_token_should_fail',
      },
      { 
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        timeout: 3000,
      }
    );

    // If we get a response (even failed), service is reachable
    res.json({
      status: 'operational',
      service: 'cloudflare_turnstile',
      reachable: true,
      configured: !!process.env.TURNSTILE_SECRET_KEY,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    // Differentiate between configuration errors and service errors
    if (!process.env.TURNSTILE_SECRET_KEY) {
      res.status(503).json({
        status: 'misconfigured',
        service: 'cloudflare_turnstile',
        reachable: false,
        configured: false,
        error: 'TURNSTILE_SECRET_KEY not configured',
        timestamp: new Date().toISOString(),
      });
    } else if (error.code === 'ECONNABORTED') {
      res.status(503).json({
        status: 'timeout',
        service: 'cloudflare_turnstile',
        reachable: false,
        configured: true,
        error: 'Service timeout',
        timestamp: new Date().toISOString(),
      });
    } else {
      res.status(503).json({
        status: 'unavailable',
        service: 'cloudflare_turnstile',
        reachable: false,
        configured: true,
        error: error.message,
        timestamp: new Date().toISOString(),
      });
    }
  }
};

/**
 * Rate limiting based on Turnstile verification
 * Stricter limits for unverified requests
 */
const turnstileRateLimit = (options = {}) => {
  const {
    verifiedLimit = 100, // Requests per window for verified users
    unverifiedLimit = 10, // Requests per window for unverified users
    windowMs = 15 * 60 * 1000, // 15 minutes
  } = options;

  const rateLimit = require('express-rate-limit');

  return (req, res, next) => {
    // Check if request has Turnstile verification
    const isVerified = req.turnstileVerified && req.turnstileVerified.success;
    
    const limiter = rateLimit({
      windowMs,
      max: isVerified ? verifiedLimit : unverifiedLimit,
      message: { 
        error: 'Too many requests', 
        code: 'RATE_LIMIT_EXCEEDED',
        verified: isVerified,
      },
      keyGenerator: (req) => {
        // Use IP + verification status for rate limiting
        return `${req.ip}_${isVerified ? 'verified' : 'unverified'}`;
      },
      standardHeaders: true,
      legacyHeaders: false,
    });

    limiter(req, res, next);
  };
};

module.exports = {
  verifyTurnstile,
  validateSiteKey,
  turnstileHealthCheck,
  turnstileRateLimit,
};