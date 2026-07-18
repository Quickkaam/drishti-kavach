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

// ─────────────────────────────────────────────────────────────────
// POST /api/sdk/engagement — Receive engagement events (Phase 2)
// Handles: page_view, time_on_page, scroll_depth, click, session_start
// ─────────────────────────────────────────────────────────────────
router.post('/engagement', requireApiKey, async (req, res) => {
  try {
    const { event_type, session_id, data = {} } = req.body;
    if (!event_type || !session_id) return res.status(400).json({ error: 'Missing event_type or session_id' });

    const websiteId = req.website.id;
    const userIp    = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip;
    const userAgent = req.headers['user-agent'] || '';
    const now       = new Date().toISOString();

    switch (event_type) {

      case 'session_start': {
        // Upsert session: create if new, mark active
        const { data: existing } = await supabase
          .from('user_sessions')
          .select('id')
          .eq('session_id', session_id)
          .eq('website_id', websiteId)
          .single();

        if (!existing) {
          await supabase.from('user_sessions').insert({
            website_id:   websiteId,
            session_id,
            user_ip:      userIp,
            user_agent:   userAgent,
            referrer:     data.referrer || null,
            landing_page: data.url || null,
            is_active:    true,
            started_at:   now,
          });
        }
        break;
      }

      case 'page_view': {
        // Ensure session exists
        const { data: sess } = await supabase
          .from('user_sessions')
          .select('id')
          .eq('session_id', session_id)
          .eq('website_id', websiteId)
          .single();

        if (!sess) {
          await supabase.from('user_sessions').insert({
            website_id:   websiteId,
            session_id,
            user_ip:      userIp,
            user_agent:   userAgent,
            referrer:     data.referrer || null,
            landing_page: data.url || null,
            is_active:    true,
            started_at:   now,
          });
        }

        // Insert page view
        await supabase.from('page_views').insert({
          website_id:  websiteId,
          session_id,
          page_url:    data.url || null,
          page_title:  data.title || null,
          referrer:    data.referrer || null,
          user_ip:     userIp,
          user_agent:  userAgent,
          created_at:  now,
        });

        // Increment pages_visited count on session
        await supabase.rpc('increment_session_page_count', { p_session_id: session_id })
          .catch(() => {}); // Non-critical

        break;
      }

      case 'time_on_page': {
        const duration = parseInt(data.duration) || 0;
        if (duration > 0) {
          // Update the most recent page view with this duration
          const { data: lastPv } = await supabase
            .from('page_views')
            .select('id')
            .eq('session_id', session_id)
            .eq('website_id', websiteId)
            .eq('page_url', data.url)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          if (lastPv) {
            await supabase.from('page_views')
              .update({ duration })
              .eq('id', lastPv.id);
          }

          // Update session total duration
          await supabase.rpc('update_session_duration', {
            p_session_id: session_id,
            p_duration:   duration,
          }).catch(() => {});
        }
        break;
      }

      case 'scroll_depth': {
        const depth = parseInt(data.depth) || 0;
        const { data: lastPv } = await supabase
          .from('page_views')
          .select('id, scroll_depth')
          .eq('session_id', session_id)
          .eq('website_id', websiteId)
          .eq('page_url', data.url)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (lastPv && depth > (lastPv.scroll_depth || 0)) {
          await supabase.from('page_views')
            .update({ scroll_depth: depth })
            .eq('id', lastPv.id);
        }
        break;
      }

      case 'click':
      case 'form_submit':
      case 'form_interaction': {
        await supabase.from('user_interactions').insert({
          website_id:       websiteId,
          session_id,
          interaction_type: event_type,
          page_url:         data.url || null,
          element_id:       data.element?.id || null,
          element_class:    data.element?.class || null,
          element_type:     data.element?.tag || null,
          interaction_data: data,
          created_at:       now,
        });
        break;
      }

      case 'session_end': {
        await supabase.from('user_sessions')
          .update({ is_active: false, ended_at: now })
          .eq('session_id', session_id)
          .eq('website_id', websiteId);
        break;
      }

      default:
        // Unknown event type — log generically to user_interactions
        await supabase.from('user_interactions').insert({
          website_id:       websiteId,
          session_id,
          interaction_type: event_type,
          page_url:         data.url || null,
          interaction_data: data,
          created_at:       now,
        });
    }

    // Emit live visitor update to dashboard
    if (req.io) {
      req.io.to(`website:${websiteId}`).emit('engagement_event', {
        event_type,
        session_id,
        website_id: websiteId,
        data,
      });
    }

    res.status(200).json({ ok: true });
  } catch (err) {
    console.error('[SDK ENGAGEMENT]', err.message);
    res.status(500).json({ error: 'Failed to track engagement' });
  }
});

module.exports = router;
