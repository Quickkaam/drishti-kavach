// ============================================
// Drishti Kavach — Analytics Routes
// दृष्टि कवच — User Engagement Analytics
// ============================================

const express = require('express');
const router = express.Router();
const supabase = require('../db/supabase');
const { requireAuth } = require('../middleware/auth');

// Helper: detect device type from user agent
function detectDevice(ua) {
  if (!ua) return 'Unknown';
  if (/Mobi|Android|iPhone|iPod/i.test(ua)) return 'Mobile';
  if (/Tablet|iPad/i.test(ua)) return 'Tablet';
  return 'Desktop';
}

// Helper: detect browser from user agent
function detectBrowser(ua) {
  if (!ua) return 'Unknown';
  if (/Edg\//i.test(ua)) return 'Edge';
  if (/OPR\//i.test(ua)) return 'Opera';
  if (/Firefox\//i.test(ua)) return 'Firefox';
  if (/Safari\//i.test(ua) && !/Chrome\//i.test(ua)) return 'Safari';
  if (/Chrome\//i.test(ua)) return 'Chrome';
  return 'Other';
}

// Helper: get website ID based on user role
function getWebsiteId(req, paramId) {
  if (req.user.role === 'superadmin' && paramId && paramId !== 'global') {
    return parseInt(paramId);
  }
  return req.user.website_id;
}

// ─── GET /api/analytics/website/:id/overview ──────────────────
router.get('/website/:id/overview', requireAuth, async (req, res) => {
  try {
    const websiteId = getWebsiteId(req, req.params.id);
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const oneDayAgo  = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const [
      { data: activeSessions },
      { data: totalSessions },
      { data: sessionsWithDuration },
    ] = await Promise.all([
      supabase.from('user_sessions').select('id').eq('website_id', websiteId).eq('is_active', true).gte('started_at', fiveMinAgo),
      supabase.from('user_sessions').select('id').eq('website_id', websiteId).gte('started_at', oneDayAgo),
      supabase.from('user_sessions').select('id, pages_visited, total_duration').eq('website_id', websiteId).gte('started_at', oneDayAgo),
    ]);

    let avgDuration = 0;
    let bounceRate  = 0;

    if (sessionsWithDuration && sessionsWithDuration.length > 0) {
      const withDuration = sessionsWithDuration.filter(s => s.total_duration > 0);
      if (withDuration.length > 0) {
        avgDuration = Math.round(withDuration.reduce((s, x) => s + (x.total_duration || 0), 0) / withDuration.length);
      }
      const bounced = sessionsWithDuration.filter(s => (s.pages_visited || 0) <= 1).length;
      bounceRate = Math.round((bounced / sessionsWithDuration.length) * 100);
    }

    res.json({
      activeUsers:   activeSessions?.length  || 0,
      totalSessions: totalSessions?.length   || 0,
      avgDuration,
      bounceRate,
    });
  } catch (err) {
    console.error('[ANALYTICS OVERVIEW]', err.message);
    res.status(500).json({ error: 'Failed to fetch analytics overview' });
  }
});

// ─── GET /api/analytics/website/:id/live ──────────────────────
router.get('/website/:id/live', requireAuth, async (req, res) => {
  try {
    const websiteId = getWebsiteId(req, req.params.id);
    const tenMinAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();

    const { data: liveSessions } = await supabase
      .from('user_sessions')
      .select('id, session_id, user_ip, user_agent, referrer, landing_page, total_duration, started_at')
      .eq('website_id', websiteId)
      .eq('is_active', true)
      .gte('started_at', tenMinAgo)
      .order('started_at', { ascending: false })
      .limit(50);

    // Get the last page viewed for each active session
    const liveVisitors = await Promise.all((liveSessions || []).map(async (session) => {
      const { data: lastPage } = await supabase
        .from('page_views')
        .select('page_url, created_at')
        .eq('session_id', session.session_id)
        .eq('website_id', websiteId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      return {
        sessionId:   session.session_id,
        ip:          session.user_ip || '—',
        location:    '—',
        currentPage: lastPage?.page_url || session.landing_page || '/',
        timeSpent:   session.total_duration || 0,
        device:      detectDevice(session.user_agent),
        browser:     detectBrowser(session.user_agent),
        startedAt:   session.started_at,
      };
    }));

    res.json(liveVisitors);
  } catch (err) {
    console.error('[ANALYTICS LIVE]', err.message);
    res.status(500).json({ error: 'Failed to fetch live visitors' });
  }
});

// ─── GET /api/analytics/website/:id/activity ──────────────────
router.get('/website/:id/activity', requireAuth, async (req, res) => {
  try {
    const websiteId = getWebsiteId(req, req.params.id);
    const { range = '24h' } = req.query;

    const hoursMap = { '24h': 24, '7d': 168, '30d': 720 };
    const hours    = hoursMap[range] || 24;
    const startDate = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

    const [{ data: pageViews }, { data: sessions }] = await Promise.all([
      supabase.from('page_views').select('created_at').eq('website_id', websiteId).gte('created_at', startDate),
      supabase.from('user_sessions').select('started_at').eq('website_id', websiteId).gte('started_at', startDate),
    ]);

    // Bucket by hour
    const buckets = {};
    const now = new Date();
    for (let i = hours - 1; i >= 0; i--) {
      const d   = new Date(now - i * 60 * 60 * 1000);
      const key = d.toISOString().slice(0, 13);
      buckets[key] = { hour: key, page_views: 0, sessions: 0 };
    }

    (pageViews || []).forEach(pv => {
      const key = new Date(pv.created_at).toISOString().slice(0, 13);
      if (buckets[key]) buckets[key].page_views++;
    });

    (sessions || []).forEach(s => {
      const key = new Date(s.started_at).toISOString().slice(0, 13);
      if (buckets[key]) buckets[key].sessions++;
    });

    const timeline = Object.values(buckets);
    res.json(timeline);
  } catch (err) {
    console.error('[ANALYTICS ACTIVITY]', err.message);
    res.status(500).json({ error: 'Failed to fetch activity timeline' });
  }
});

// ─── GET /api/analytics/website/:id/pages ─────────────────────
router.get('/website/:id/pages', requireAuth, async (req, res) => {
  try {
    const websiteId = getWebsiteId(req, req.params.id);
    const limit = parseInt(req.query.limit) || 15;

    // Aggregate page views manually since Supabase RPC
    const { data: allPageViews } = await supabase
      .from('page_views')
      .select('page_url, duration')
      .eq('website_id', websiteId);

    const pageMap = {};
    (allPageViews || []).forEach(pv => {
      const url = pv.page_url || '/';
      if (!pageMap[url]) pageMap[url] = { page_url: url, views: 0, totalDuration: 0 };
      pageMap[url].views++;
      pageMap[url].totalDuration += pv.duration || 0;
    });

    const pages = Object.values(pageMap)
      .map(p => ({
        page_url:     p.page_url,
        views:        p.views,
        avg_duration: p.views > 0 ? Math.round(p.totalDuration / p.views) : 0,
      }))
      .sort((a, b) => b.views - a.views)
      .slice(0, limit);

    res.json(pages);
  } catch (err) {
    console.error('[ANALYTICS PAGES]', err.message);
    res.status(500).json({ error: 'Failed to fetch top pages' });
  }
});

// ─── GET /api/analytics/website/:id/sessions ──────────────────
router.get('/website/:id/sessions', requireAuth, async (req, res) => {
  try {
    const websiteId = getWebsiteId(req, req.params.id);
    const limit = parseInt(req.query.limit) || 20;

    const { data: sessions } = await supabase
      .from('user_sessions')
      .select('*')
      .eq('website_id', websiteId)
      .order('started_at', { ascending: false })
      .limit(limit);

    // Get pages for each session
    const enriched = await Promise.all((sessions || []).map(async (s) => {
      const { data: pages } = await supabase
        .from('page_views')
        .select('page_url, created_at, duration, scroll_depth')
        .eq('session_id', s.session_id)
        .eq('website_id', websiteId)
        .order('created_at', { ascending: true });
      return { ...s, pages: pages || [] };
    }));

    res.json(enriched);
  } catch (err) {
    console.error('[ANALYTICS SESSIONS]', err.message);
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
});

// ─── GET /api/analytics/website/:id/geography ─────────────────
router.get('/website/:id/geography', requireAuth, async (req, res) => {
  try {
    const websiteId = getWebsiteId(req, req.params.id);
    const { data: geo } = await supabase
      .from('geographic_data')
      .select('*')
      .eq('website_id', websiteId)
      .order('visitor_count', { ascending: false });
    res.json(geo || []);
  } catch (err) {
    console.error('[ANALYTICS GEO]', err.message);
    res.status(500).json({ error: 'Failed to fetch geographic data' });
  }
});

// ─── GET /api/analytics/website/:id/devices ───────────────────
router.get('/website/:id/devices', requireAuth, async (req, res) => {
  try {
    const websiteId = getWebsiteId(req, req.params.id);
    const { data: devices } = await supabase
      .from('device_analytics')
      .select('*')
      .eq('website_id', websiteId)
      .order('visitor_count', { ascending: false });
    res.json(devices || []);
  } catch (err) {
    console.error('[ANALYTICS DEVICES]', err.message);
    res.status(500).json({ error: 'Failed to fetch device data' });
  }
});

// ─── GET /api/analytics/website/:id/export ────────────────────
router.get('/website/:id/export', requireAuth, async (req, res) => {
  try {
    const websiteId = getWebsiteId(req, req.params.id);
    const format = req.query.format || 'json';

    const [{ data: sessions }, { data: pageViews }] = await Promise.all([
      supabase.from('user_sessions').select('*').eq('website_id', websiteId).order('started_at', { ascending: false }),
      supabase.from('page_views').select('*').eq('website_id', websiteId).order('created_at', { ascending: false }),
    ]);

    const exportData = { sessions: sessions || [], page_views: pageViews || [], exported_at: new Date().toISOString(), website_id: websiteId };

    if (format === 'csv') {
      const rows = (sessions || []).map(s =>
        `${s.id},${s.session_id},${s.user_ip},${s.pages_visited},${s.total_duration},${s.started_at}`
      );
      const csv = ['id,session_id,user_ip,pages_visited,total_duration,started_at', ...rows].join('\n');
      res.setHeader('Content-Disposition', `attachment; filename=analytics-${websiteId}.csv`);
      res.setHeader('Content-Type', 'text/csv');
      return res.send(csv);
    }

    res.setHeader('Content-Disposition', `attachment; filename=analytics-${websiteId}.json`);
    res.setHeader('Content-Type', 'application/json');
    res.json(exportData);
  } catch (err) {
    console.error('[ANALYTICS EXPORT]', err.message);
    res.status(500).json({ error: 'Failed to export analytics' });
  }
});

module.exports = router;
