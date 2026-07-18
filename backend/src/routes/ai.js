// ============================================
// Drishti Kavach — Drishti AI Routes
// ============================================

const express = require('express');
const { v4: uuidv4 } = require('uuid');
const supabase = require('../db/supabase');
const { requireAuth, requireRole } = require('../middleware/auth');
const aiService = require('../services/ai');
const rateLimit = require('express-rate-limit');
const { validate, aiChatSchema } = require('../middleware/validate');

const router = express.Router();

// GET /api/ai/summary/send — Daily summary dispatched via external cron
router.get('/summary/send', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const cronSecret = process.env.CRON_SECRET || 'drishti-cron-secret';
    if (authHeader !== `Bearer ${cronSecret}`) {
      return res.status(401).json({ error: 'Unauthorized cron request' });
    }

    const { data: websites } = await supabase.from('websites').select('id').eq('status', 'active');
    for (const site of (websites || [])) {
      await aiService.generateDailySummary(site.id).catch(() => {});
    }

    res.json({ ok: true, message: 'Daily summaries generated and sent' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to process summaries' });
  }
});

router.use(requireAuth);

// POST /api/ai/chat
// Rate limiter for AI chat (30 requests per minute per IP)
const aiChatLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: { error: 'AI request limit exceeded' },
});

router.post('/chat', aiChatLimiter, validate(aiChatSchema), async (req, res) => {
  try {
    const { question, website_id, session_id, provider } = req.body;
    if (!question) return res.status(400).json({ error: 'Question required' });

    console.log('[AI Chat] User ID:', req.user?.id);
    console.log('[AI Chat] Website ID:', website_id);
    console.log('[AI Chat] Question:', question?.substring(0, 50) + '...');

    // Validate website_id
    if (!website_id) {
      console.log('[AI Chat] ERROR: website_id is missing');
      return res.status(400).json({ error: 'website_id is required' });
    }

    const result = await aiService.chat(
      req.user.id,
      website_id,
      question,
      session_id || uuidv4(),
      provider
    );

    console.log('[AI Chat] Response:', result?.response?.substring(0, 50) + '...');
    res.json(result);
  } catch (err) {
    console.error('[AI Chat Error]', err.message);
    console.error('[AI Chat Error Stack]', err.stack);
    res.status(500).json({ error: 'AI service error', message: err.message });
  }
});

// GET /api/ai/decisions
router.get('/decisions', async (req, res) => {
  try {
    const { website_id, limit = 50 } = req.query;
    let query = supabase
      .from('ai_decisions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (website_id) query = query.eq('website_id', website_id);
    const { data } = await query;
    res.json({ decisions: data });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch AI decisions' });
  }
});

// POST /api/ai/investigate/:ip — Manually investigate an IP
router.post('/investigate/:ip', requireRole('admin', 'analyst'), async (req, res) => {
  try {
    const { ip } = req.params;
    const { website_id, event_id } = req.body;

    const result = await aiService.autoInvestigate(event_id, website_id, ip, req.io);
    res.json({ investigation: result });
  } catch (err) {
    res.status(500).json({ error: 'Investigation failed' });
  }
});

// GET /api/ai/summary — Daily summary
router.get('/summary', async (req, res) => {
  try {
    const { website_id } = req.query;
    const summary = await aiService.generateDailySummary(website_id);
    res.json({ summary });
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate summary' });
  }
});

// GET /api/ai/settings
router.get('/settings', requireRole('admin'), async (req, res) => {
  try {
    const { data } = await supabase.from('assistant_settings').select('*');
    const settings = {};
    (data || []).forEach(row => { settings[row.setting_key] = row.setting_value; });
    res.json({ settings });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

// POST /api/ai/settings — Update settings
router.post('/settings', requireRole('admin'), async (req, res) => {
  try {
    const { setting_key, setting_value } = req.body;
    await supabase.from('assistant_settings').upsert({
      setting_key,
      setting_value,
      updated_by: req.user.username,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'setting_key' });

    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

module.exports = router;
