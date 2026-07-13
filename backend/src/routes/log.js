// ============================================
// Drishti Kavach — Legacy Log Route
// (For backward compat with existing common.js)
// ============================================

const express = require('express');
const supabase = require('../db/supabase');

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { action, page, agent, visitor, extra } = req.body;
    const userIp = req.headers['x-forwarded-for']?.split(',')[0] || req.ip;

    // Try to find website by origin domain
    const origin = req.headers.origin || req.headers.referer || '';
    let websiteId = null;
    if (origin) {
      try {
        const domain = new URL(origin).origin;
        const { data: site } = await supabase.from('websites').select('id').eq('domain', domain).single();
        if (site) websiteId = site.id;
      } catch {}
    }

    if (websiteId) {
      await supabase.from('events').insert({
        website_id: websiteId,
        session_id: visitor,
        event_type: action,
        page_url: page,
        event_data: extra,
        user_ip: userIp,
        user_agent: agent,
        timestamp: new Date().toISOString(),
      });
    }

    res.json({ ok: true });
  } catch {
    res.json({ ok: false });
  }
});

module.exports = router;
