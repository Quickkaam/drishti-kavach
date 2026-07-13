// ============================================
// Drishti Kavach — SDK Routes (Client-side API)
// ============================================

const express = require('express');
const { v4: uuidv4 } = require('uuid');
const supabase = require('../db/supabase');
const { requireApiKey } = require('../middleware/auth');
const { validate, sdkEventSchema } = require('../middleware/validate');
const ddosService = require('../services/ddos');
const securityService = require('../services/security');

const router = express.Router();

// POST /api/sdk/log — Receive event from client website
router.post('/log', requireApiKey, validate(sdkEventSchema), async (req, res) => {
  try {
    const { event_type, page_url, event_data, session_id, referrer } = req.body;
    const userIp = req.headers['x-forwarded-for']?.split(',')[0] || req.ip;
    const userAgent = req.headers['user-agent'] || '';

    const event = {
      website_id: req.website.id,
      session_id: session_id || uuidv4(),
      event_type,
      page_url,
      event_data,
      user_ip: userIp,
      user_agent: userAgent,
      referrer,
      timestamp: new Date().toISOString(),
    };

    const { data } = await supabase.from('events').insert(event).select('id').single();

    // Update website last_seen
    await supabase.from('websites')
      .update({ last_seen_at: new Date().toISOString() })
      .eq('id', req.website.id);

    // Async: check DDoS and emit real-time
    if (req.website.settings?.ddos_protection_enabled !== false) {
      ddosService.checkTrafficSpike(req.website.id, req.io).catch(() => {});
    }

    // Emit real-time event to dashboard
    if (req.io) {
      req.io.to(`website:${req.website.id}`).emit('new_event', {
        ...event,
        id: data?.id,
      });
    }

    res.json({ ok: true });
  } catch (err) {
    console.error('[SDK LOG]', err.message);
    res.status(500).json({ error: 'Failed to log event' });
  }
});

// POST /api/sdk/security — Receive security event
router.post('/security', requireApiKey, async (req, res) => {
  try {
    const { type, level, payload, url } = req.body;
    const userIp = req.headers['x-forwarded-for']?.split(',')[0] || req.ip;
    const userAgent = req.headers['user-agent'] || '';

    const secEvent = {
      website_id: req.website.id,
      event_type: type,
      severity: level || 'medium',
      user_ip: userIp,
      user_agent: userAgent,
      url,
      payload: typeof payload === 'string' ? payload.substring(0, 1000) : JSON.stringify(payload),
      details: { raw: payload },
      created_at: new Date().toISOString(),
    };

    // Map to MITRE ATT&CK
    const mitre = securityService.getMitreMapping(type);
    if (mitre) {
      secEvent.mitre_technique_id = mitre.id;
      secEvent.mitre_tactic = mitre.tactic;
    }

    const { data } = await supabase
      .from('security_events')
      .insert(secEvent)
      .select('id')
      .single();

    // Real-time alert to dashboard
    if (req.io) {
      req.io.to(`website:${req.website.id}`).emit('security_alert', {
        ...secEvent,
        id: data?.id,
      });
      req.io.to('admin').emit('security_alert', {
        website: req.website.name,
        ...secEvent,
        id: data?.id,
      });
    }

    // Auto-investigate via AI if high severity
    if (['high', 'critical'].includes(secEvent.severity)) {
      const aiService = require('../services/ai');
      aiService.autoInvestigate(data?.id, req.website.id, userIp, req.io).catch(() => {});
    }

    res.json({ ok: true });
  } catch (err) {
    console.error('[SDK SECURITY]', err.message);
    res.status(500).json({ error: 'Failed to log security event' });
  }
});

// POST /api/sdk/form — Receive form submission
router.post('/form', requireApiKey, async (req, res) => {
  try {
    const { type, email, name, phone, services, message, data: formData } = req.body;
    const userIp = req.headers['x-forwarded-for']?.split(',')[0] || req.ip;

    await supabase.from('form_submissions').insert({
      website_id: req.website.id,
      form_type: type || 'contact',
      user_ip: userIp,
      user_agent: req.headers['user-agent'],
      email,
      name,
      phone,
      services,
      message,
      data: formData || {},
    });

    if (req.io) {
      req.io.to('admin').emit('new_form', {
        website: req.website.name,
        name,
        email,
        type,
      });
    }

    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to log form' });
  }
});

// GET /api/sdk/config — Get website config for SDK
router.get('/config', requireApiKey, (_req, res) => {
  res.json({
    settings: {
      monitoring_enabled: true,
      ddos_protection_enabled: true,
      auto_block_enabled: true,
    },
  });
});

module.exports = router;
