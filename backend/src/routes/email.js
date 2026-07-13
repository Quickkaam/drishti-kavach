// ============================================
// Drishti Kavach — Email Routes
// Secure email proxy (hides EmailJS private key)
// ============================================

const express = require('express');
const supabase = require('../db/supabase');
const { verifyTurnstile } = require('../middleware/turnstile');
const emailService = require('../services/email');

const router = express.Router();

// POST /api/email/send - Send email via EmailJS proxy
router.post('/send', verifyTurnstile({ optional: true }), async (req, res) => {
  try {
    const { service_id, template_id, template_params, turnstile_token } = req.body;

    if (!service_id || !template_id || !template_params) {
      return res.status(400).json({ error: 'Missing required fields: service_id, template_id, template_params' });
    }

    // Verify Turnstile if provided
    if (turnstile_token && !req.turnstileVerified) {
      return res.status(400).json({ error: 'Turnstile verification failed' });
    }

    // Log request for audit
    if (req.user) {
      console.log(`[EMAIL] User ${req.user.email} requested email send`);
    }

    // Send email via EmailJS
    const result = await emailService.sendEmailViaProxy({
      service_id,
      template_id,
      template_params,
    });

    if (result.success) {
      res.json({ success: true, message: 'Email sent successfully' });
    } else {
      res.status(500).json({ error: result.error || 'Failed to send email' });
    }
  } catch (err) {
    console.error('[EMAIL SEND]', err);
    res.status(500).json({ error: 'Failed to send email' });
  }
});

// POST /api/email/notify - Send notification to Slack/Telegram
router.post('/notify', async (req, res) => {
  try {
    const { channel, message } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message required' });
    }

    const results = {
      slack: null,
      telegram: null,
    };

    // Send to Slack if configured
    if (process.env.SLACK_WEBHOOK_URL) {
      results.slack = await emailService.sendSlackAlert(message, channel);
    }

    // Send to Telegram if configured
    if (process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID) {
      results.telegram = await emailService.sendTelegramAlert(message);
    }

    res.json({ success: true, results });
  } catch (err) {
    console.error('[EMAIL NOTIFY]', err);
    res.status(500).json({ error: 'Failed to send notifications' });
  }
});

module.exports = router;
