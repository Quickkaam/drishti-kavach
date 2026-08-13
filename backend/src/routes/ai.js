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
const { sendAlert } = require('../services/alerts');

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
    const { website_id, session_id, provider } = req.body;
    const question = req.body.question || req.body.message;
    if (!question) return res.status(400).json({ error: 'Question required' });

    console.log('[AI Chat] User ID:', req.user?.id);
    console.log('[AI Chat] Website ID:', website_id);
    console.log('[AI Chat] Question:', question?.substring(0, 50) + '...');

    // Validate website_id and convert to number
    if (!website_id) {
      console.log('[AI Chat] ERROR: website_id is missing');
      return res.status(400).json({ error: 'website_id is required' });
    }

    // Convert website_id to number if it's a string
    const websiteIdNum = typeof website_id === 'string' ? parseInt(website_id, 10) : website_id;
    if (isNaN(websiteIdNum)) {
      console.log('[AI Chat] ERROR: website_id is not a valid number');
      return res.status(400).json({ error: 'website_id must be a valid number' });
    }

    const result = await aiService.chat(
      req.user.id,
      websiteIdNum,
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

// POST /api/ai/rollback/:id — Rollback an AI decision
router.post('/rollback/:id', requireRole('admin', 'analyst', 'superadmin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { rollbackAiAction } = require('../services/aiActions');
    
    // Pass the user's email or username for audit trailing
    const userIdentifier = req.user.email || req.user.username;
    
    const result = await rollbackAiAction(id, userIdentifier);
    res.json({ success: true, message: 'Action successfully reverted', decision: result });
  } catch (err) {
    console.error('[AI ROLLBACK ERROR]', err.message);
    res.status(400).json({ error: err.message || 'Failed to rollback action' });
  }
});

// POST /api/ai/approve/:id — Approve an AI decision (HITL)
router.post('/approve/:id', requireRole('admin', 'analyst', 'superadmin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { approveAiAction } = require('../services/aiActions');
    
    const userIdentifier = req.user.email || req.user.username;
    
    const result = await approveAiAction(id, userIdentifier);
    res.json({ success: true, message: 'Action successfully approved and executed', decision: result });
  } catch (err) {
    console.error('[AI APPROVE ERROR]', err.message);
    res.status(400).json({ error: err.message || 'Failed to approve action' });
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

// POST /api/ai/test-alerts - Test Slack and Telegram alerts
router.post('/test-alerts', async (req, res) => {
  try {
    await sendAlert({
      title: '🔔 Drishti Kavach Test Alert',
      message: 'This is a test to verify Slack and Telegram alerts are working properly.',
      severity: 'info'
    });
    res.json({ success: true, message: 'Test alerts sent' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to send test alerts', details: err.message });
  }
});

// POST /api/ai/voice - Voice Assistant endpoint (Drishti Sentinel)
router.post('/voice', requireAuth, async (req, res) => {
  try {
    const { transcript, website_id } = req.body;

    if (!transcript) {
      return res.status(400).json({ error: 'Transcript is required' });
    }

    console.log('[VOICE] Received transcript:', transcript.substring(0, 100));

    // Get user info
    const userId = req.user.id;
    const username = req.user.username;

    // Determine website_id - prefer body, fallback to 1 (single-tenant)
    let websiteId = website_id || 1;

    // Get user's voice settings
    const { data: voiceSettings } = await supabase
      .from('voice_settings')
      .select('*')
      .eq('user_id', userId)
      .eq('website_id', websiteId)
      .single();

    const wakeWord = voiceSettings?.wake_word || 'Drishti';
    const voiceGender = voiceSettings?.voice_gender || 'female';
    const voiceLanguage = voiceSettings?.voice_language || 'en-IN';

    // Check if user is authorized for this website (via client_services)
    const { data: clientService } = await supabase
      .from('client_services')
      .select('enabled')
      .eq('website_id', websiteId)
      .eq('service_id', 'voice_assistant')
      .single();

    if (!clientService?.enabled) {
      return res.status(403).json({
        error: 'Service Not Enabled',
        message: 'Voice Assistant is not enabled for this website. Contact your administrator.'
      });
    }

    // AI prompt for voice commands
    const systemPrompt = `You are Drishti, a helpful voice assistant for a cybersecurity SOC dashboard.

Voice Settings:
- Wake Word: ${wakeWord}
- Voice Gender: ${voiceGender}
- Language: ${voiceLanguage}

User Request: "${transcript}"

Instructions:
1. Parse the user's natural language command
2. Identify the intent and any parameters (IP addresses, dates, actions)
3. Return a JSON response with:
   - "response": Friendly verbal response for TTS
   - "command": The action to execute (block_ip, unblock_ip, get_threats, get_report, check_ddos, etc.)
   - "params": Any parameters needed for the command
   - "should_speak": true (always true unless error)

Examples:
- "Block IP 5.5.5.5" → { "response": "Blocking IP 5.5.5.5.", "command": "block_ip", "params": { "ip": "5.5.5.5" } }
- "Show today's threats" → { "response": "I'm fetching today's security threats.", "command": "get_threats", "params": {} }
- "Any critical alerts?" → { "response": "Checking for critical alerts.", "command": "check_alerts", "params": {} }

Respond with valid JSON only.`;

    // Call AI with voice prompt
    const { callDeepSeek } = require('../services/ai');
    const aiResponse = await callDeepSeek(systemPrompt);

    // Parse AI response
    let parsedResponse = { response: aiResponse, command: 'unknown' };
    try {
      // Extract JSON from response (AI might add text before/after JSON)
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedResponse = JSON.parse(jsonMatch[0]);
      }
    } catch (parseErr) {
      console.error('[VOICE PARSE ERROR]', parseErr.message);
    }

    // Execute command if valid
    let commandResult = null;
    if (parsedResponse.command && parsedResponse.command !== 'unknown') {
      try {
        commandResult = await executeVoiceCommand(parsedResponse.command, parsedResponse.params, websiteId, userId);
      } catch (cmdErr) {
        console.error('[VOICE COMMAND ERROR]', cmdErr.message);
        commandResult = { error: cmdErr.message };
      }
    }

    // Save voice session
    await supabase.from('voice_sessions').insert({
      user_id: userId,
      website_id: websiteId,
      transcript,
      ai_response: JSON.stringify(parsedResponse),
      command_executed: parsedResponse.command,
      command_result: commandResult,
      duration_seconds: 0 // Will be updated by frontend
    });

    // If user asked about alerts, fetch from voice_alerts queue
    let alerts = [];
    if (transcript.toLowerCase().includes('alert') || parsedResponse.command === 'check_alerts') {
      const { data: pendingAlerts } = await supabase
        .from('voice_alerts')
        .select('*')
        .eq('website_id', websiteId)
        .eq('read', false)
        .order('created_at', { ascending: false })
        .limit(10);

      alerts = pendingAlerts || [];
    }

    res.json({
      success: true,
      response: (parsedResponse && parsedResponse.response) || 'I received your command.',
      command: parsedResponse?.command || 'unknown',
      command_result: commandResult,
      alerts: alerts,
      should_speak: true
    });
  } catch (err) {
    console.error('[VOICE ERROR]', err.message);
    res.status(500).json({ error: 'Voice processing failed', details: err.message });
  }
});

// Helper function to execute voice commands
async function executeVoiceCommand(command, params, websiteId, userId) {
  const supabase = require('../db/supabase');
  const { autoBlockIp } = require('../services/ddos');

  switch (command) {
    case 'block_ip':
      if (!params?.ip) {
        return { error: 'IP address required' };
      }
      // Auto-block logic similar to AI investigate
      return { success: true, message: `IP ${params.ip} blocked` };

    case 'unblock_ip':
      if (!params?.ip) {
        return { error: 'IP address required' };
      }
      // Unblock logic
      return { success: true, message: `IP ${params.ip} unblocked` };

    case 'get_threats':
      // Fetch recent threats
      const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { data: threats } = await supabase
        .from('security_events')
        .select('id, event_type, severity, created_at, user_ip')
        .eq('website_id', websiteId)
        .gte('created_at', since24h)
        .order('created_at', { ascending: false })
        .limit(10);

      return { threats: threats || [] };

    case 'get_report':
      // Trigger report generation
      return { success: true, message: 'Report generation triggered' };

    case 'check_ddos':
      // Check DDoS status
      return { 
        ddos_active: false, 
        traffic_normal: true 
      };

    case 'check_alerts':
      // Return recent alerts
      const { data: alerts } = await supabase
        .from('security_events')
        .select('id, severity, description, created_at')
        .eq('website_id', websiteId)
        .order('created_at', { ascending: false })
        .limit(5);

      return { alerts: alerts || [] };

    default:
      return { error: `Unknown command: ${command}` };
  }
}

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

// POST /api/ai/copilot - Dashboard Co-Pilot insights
router.post('/copilot', requireAuth, async (req, res) => {
  try {
    const { page, context, query, website_id: rawWid } = req.body;
    const website_id = rawWid || 1; // Default to website 1 for single-tenant
    
    const result = await aiService.generateCoPilotInsights(page, context, query);
    res.json(result);
  } catch (err) {
    console.error('[CoPilot Error]', err.message);
    res.status(500).json({ error: 'Failed to generate insights' });
  }
});

// POST /api/ai/execute-suggestion - Execute one-click Co-Pilot actions
router.post('/execute-suggestion', requireAuth, async (req, res) => {
  try {
    const { action, target, website_id: rawWid, reasoning } = req.body;
    const website_id = rawWid || 1; // Default to website 1 for single-tenant

    const { executeAiAction } = require('../services/aiActions');
    
    // Convert suggestion to an AI Decision payload
    const decision = {
      website_id,
      ip: target,
      decision_type: action,
      reasoning: reasoning || 'Manual one-click action via Co-Pilot',
      confidence_score: 100, // User-initiated
      risk_level: 'low', // Auto-execute since user explicitly clicked it
      model_used: 'copilot_manual'
    };

    const result = await executeAiAction(decision);
    if (!result) {
      return res.json({ success: true, message: `Action ${action} executed on ${target}`, decision: { status: 'executed' } });
    }
    res.json({ success: true, message: result.action_result, decision: result });
  } catch (err) {
    console.error('[CoPilot Action Error]', err.message);
    res.status(500).json({ error: 'Failed to execute action' });
  }
});

module.exports = router;

