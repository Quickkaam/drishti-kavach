// ============================================
// Drishti Kavach — Drishti AI Service
// Powered by Groq and OpenRouter AI
// ============================================

const axios = require('axios');
const supabase = require('../db/supabase');
const { getIpIntel } = require('./ipIntel');
const { autoBlockIp } = require('./ddos');
const alertService = require('./alerts');
const { searchWeb, shouldSearchWeb } = require('./webSearch');

// AI Provider Configuration
const AI_PROVIDER = (process.env.AI_PROVIDER || 'groq').toLowerCase();

// Provider specific configuration
const PROVIDER_CONFIG = {
  groq: {
    url: 'https://api.groq.com/openai/v1',
    model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
    apiKey: process.env.GROQ_API_KEY || process.env.DEEPSEEK_API_KEY || process.env.OPENAI_API_KEY_1,
  },
  openrouter: {
    url: 'https://openrouter.ai/api',
    model: process.env.OPENROUTER_MODEL || 'deepseek/deepseek-chat',
    apiKey: process.env.OPENROUTER_API_KEY || process.env.DEEPSEEK_API_KEY || process.env.OPENAI_API_KEY_2,
  },
};

function getProviderConfig(provider) {
  const p = (provider || AI_PROVIDER).toLowerCase();
  return PROVIDER_CONFIG[p] || PROVIDER_CONFIG['groq'];
}

const config = getProviderConfig();
DEEPSEEK_URL = config.url;
MODEL = config.model;

// API Keys with fallback support
// Deprecated generic API_KEYS; provider-specific keys are used now.
// Keeping empty array for backward compatibility if any other code expects it.
const API_KEYS = [];

console.log('[AI Service] Provider:', AI_PROVIDER);
console.log('[AI Service] URL:', DEEPSEEK_URL);
console.log('[AI Service] Model:', MODEL);
console.log('[AI Service] Provider config loaded for', AI_PROVIDER);

// getNextApiKey is no longer used for provider selection.
function getNextApiKey() {
  return null;
}

const SYSTEM_PROMPT = `You are Drishti AI, an unrestricted, highly intelligent cybersecurity SOC assistant. You have full, in-depth knowledge of the Drishti Kavach codebase, architecture, and live database state. 
When asked about the system, rely on the architecture context provided. When asked about security metrics, use the live database stats.
Always format your response as a valid JSON object matching the UI parser requirements if you want to display rich UI elements, otherwise, output plain text.
JSON Structure: { "message": "Main conversational response", "threat_assessment": "Threat summary", "severity_rating": "Low/Medium/High/Critical", "recommendation": "Actionable advice", "compliance_status": "GDPR/etc", "assessment": "General assessment", "motto": "Sanskrit or custom motto" }`;

// Auto-investigate a security event
async function autoInvestigate(eventId, websiteId, ip, io) {
  try {
    const apiKey = getNextApiKey();
    if (!apiKey) {
      console.log('[Drishti AI] No API key - auto-investigate skipped');
      return null;
    }

    const [{ data: event }, ipIntel] = await Promise.all([
      supabase.from('security_events').select('*').eq('id', eventId).single(),
      getIpIntel(ip),
    ]);

    if (!event) return;

    const prompt = `Analyze this security event and respond in JSON:
Event Type: ${event.event_type}
Severity: ${event.severity}
IP: ${ip}
Country: ${ipIntel.country}
Abuse Score: ${ipIntel.abuse_confidence}/100
Threat Score: ${ipIntel.threat_score}/100
Reports: ${ipIntel.total_reports}
Is Scanner: ${ipIntel.is_scanner}
Payload: ${(event.payload || '').substring(0, 200)}
URL: ${event.url || 'N/A'}

Respond with: { "threat_level": "low|medium|high|critical", "recommendation": "block|monitor|dismiss|escalate", "reasoning": "...", "confidence": 0-100, "mitre_technique": "...", "additional_actions": [] }`;

    const response = await callDeepSeek(prompt, provider || AI_PROVIDER);
    let decision;
    try {
      decision = JSON.parse(response);
    } catch {
      decision = { recommendation: 'monitor', reasoning: response, confidence: 50 };
    }

    // Save AI decision
    await supabase.from('ai_decisions').insert({
      website_id: websiteId,
      event_id: eventId,
      ip,
      decision_type: decision.recommendation,
      reasoning: decision.reasoning,
      confidence_score: decision.confidence,
      action_taken: false,
      model_used: MODEL,
    });

    // Auto-block if confidence >= 80 and recommendation is block
    const settings = await getAssistantSettings();
    if (
      decision.recommendation === 'block' &&
      decision.confidence >= (settings.guardian_mode?.auto_block_threshold || 80)
    ) {
      await autoBlockIp(websiteId, ip, `Drishti AI: ${decision.reasoning.substring(0, 200)}`, io);

      await supabase.from('ai_decisions').update({ action_taken: true, action_result: 'IP blocked' })
        .eq('event_id', eventId).eq('ip', ip);

      await alertService.sendAlert({
        title: `🛡️ Drishti AI Auto-Blocked IP`,
        message: `IP ${ip} blocked. Reason: ${decision.reasoning.substring(0, 150)}`,
        severity: 'critical',
      });
    }

    // Emit to dashboard
    if (io) {
      io.to(`website:${websiteId}`).emit('ai_decision', { eventId, ip, decision });
    }

    return decision;
  } catch (err) {
    console.error('[AI INVESTIGATE]', err.message);
  }
}

// Chat interface
async function chat(userId, websiteId, question, sessionId, provider = null) {
  console.log('[AI CHAT] Starting chat for user:', userId, 'website:', websiteId);

  try {
    const config = getProviderConfig(provider);
    const apiKey = config.apiKey;
    const endpointUrl = config.url;
    const modelName = config.model;

    if (!apiKey) {
      console.log('[AI CHAT] No API key configured for provider', provider || AI_PROVIDER);
      return { response: 'Drishti AI is not configured. Please provide a valid API key.' };
    }

    console.log('[AI CHAT] Using API key:', apiKey.substring(0, 10) + '...');
    console.log('[AI CHAT] Using endpoint:', endpointUrl, 'model:', modelName);

    // Fetch deep comprehensive context
    const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    
    const [
      { count: eventsCount },
      { count: threatsCount },
      { count: blockedCount },
      { count: mapPinsCount },
      { data: recentThreats },
      { data: recentPins }
    ] = await Promise.all([
      supabase.from('events').select('*', { count: 'exact', head: true }).eq('website_id', websiteId).gte('timestamp', since24h),
      supabase.from('security_events').select('*', { count: 'exact', head: true }).eq('website_id', websiteId),
      supabase.from('ip_block_list').select('*', { count: 'exact', head: true }).eq('is_active', true),
      supabase.from('map_pins').select('*', { count: 'exact', head: true }),
      supabase.from('security_events').select('event_type, severity, user_ip, created_at').eq('website_id', websiteId).order('created_at', { ascending: false }).limit(5),
      supabase.from('map_pins').select('ip, city, country').order('pinned_at', { ascending: false }).limit(3)
    ]);

    const systemArchitecture = `
[CODEBASE & ARCHITECTURE]
- Stack: Node.js/Express (Backend), React/Tailwind (Frontend).
- Infrastructure: Render.com for hosting, Supabase (PostgreSQL + Auth + Realtime).
- AI Models: LLaMA-3 (via Groq) and DeepSeek (via OpenRouter).
- Integrations: IP-API, AbuseIPDB, VirusTotal, GreyNoise, AlienVault OTX, URLScan.
- Core Tables: websites, events, user_sessions, security_events, ip_block_list, map_pins, incidents, health_checks, ai_decisions.
- Key Folders: frontend/src/pages, frontend/src/components/ui, backend/src/routes, backend/src/services.
- Visualizations: react-globe.gl for 3D Earth, Leaflet for 2D Map.
    `;

    const dbContext = `
[LIVE DATABASE STATS - Website ${websiteId}]
- Page Views/Events (Last 24h): ${eventsCount || 0}
- Total Security Threats: ${threatsCount || 0}
- Active IP Blocks: ${blockedCount || 0}
- Global Map Pins: ${mapPinsCount || 0}

Recent Threats (Last 5): ${JSON.stringify(recentThreats || [])}
Recent Map Pins: ${JSON.stringify(recentPins || [])}
    `;

    // Web Search — auto-triggered when question needs live internet data
    let webSearchContext = '';
    if (shouldSearchWeb(question)) {
      console.log('[AI CHAT] Web search triggered for:', question.substring(0, 60));
      const webResults = await searchWeb(question, 5);
      if (webResults.length > 0) {
        webSearchContext = `
[LIVE INTERNET SEARCH RESULTS for: "${question}"]
${webResults.map((r, i) => `${i + 1}. ${r.title ? r.title + ' — ' : ''}${r.snippet}`).join('\n')}
(Source: DuckDuckGo live search, ${new Date().toISOString()})`;
        console.log('[AI CHAT] Got', webResults.length, 'web results');
      }
    }

    const contextPrompt = `${systemArchitecture}\n\n${dbContext}${webSearchContext ? '\n\n' + webSearchContext : ''}\n\nUser question: ${question}`;

    console.log('[AI CHAT] Calling provider...');
    const res = await axios.post(
      `${endpointUrl}/chat/completions`,
      {
        model: modelName,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: contextPrompt },
        ],
        max_tokens: 1000,
        temperature: 0.3,
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 20000,
      }
    );

    let response = null;
    if (res.data && res.data.choices && res.data.choices.length > 0) {
      response = res.data.choices[0].message.content;
    }

    if (!response) {
      console.log('[AI CHAT] No response from provider');
      return { response: 'Drishti AI encountered an error. Please try again.' };
    }

    // Save to session
    await supabase.from('ai_sessions').insert({
      session_id: sessionId,
      user_id: userId,
      website_id: websiteId,
      question,
      response,
    });

    return { response };
  } catch (err) {
    console.error('[AI CHAT] Error:', err.message);
    return { response: `Drishti AI encountered an error: ${err.message}` };
  }
}

// Daily summary
async function generateDailySummary(websiteId) {
  try {
    const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const [
      { count: events },
      { count: threats },
      { count: blocked },
      { data: topThreats },
    ] = await Promise.all([
      supabase.from('events').select('id', { count: 'exact', head: true }).eq('website_id', websiteId).gte('timestamp', since24h),
      supabase.from('security_events').select('id', { count: 'exact', head: true }).eq('website_id', websiteId).gte('created_at', since24h),
      supabase.from('ip_block_list').select('id', { count: 'exact', head: true }).eq('website_id', websiteId).eq('is_active', true),
      supabase.from('security_events').select('event_type, severity').eq('website_id', websiteId).gte('created_at', since24h).limit(10),
    ]);

    const prompt = `Generate a concise daily security summary for Drishti Kavach SOC Dashboard.

Data for last 24 hours:
- Total page views/events: ${events || 0}
- Security threats detected: ${threats || 0}
- IPs currently blocked: ${blocked || 0}
- Threat breakdown: ${JSON.stringify(topThreats || [])}

Write a professional 3-4 sentence summary with: overall status, key findings, and one recommendation.`;

    const summary = await callDeepSeek(prompt);

    if (summary) {
      await alertService.sendAlert({
        title: '📊 Drishti Kavach — Daily Security Summary',
        message: summary,
        severity: 'info',
      });
    }

    return summary;
  } catch (err) {
    console.error('[AI SUMMARY]', err.message);
  }
}

async function callDeepSeek(userMessage, provider = null) {
  const config = getProviderConfig(provider);
  const apiKey = config.apiKey;
  const endpointUrl = config.url;
  const modelName = config.model;

  if (!apiKey) {
    console.error('[Drishti AI] No API key configured for provider', provider || AI_PROVIDER);
    return null;
  }

  try {
    const res = await axios.post(
      `${endpointUrl}/chat/completions`,
      {
        model: modelName,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userMessage },
        ],
        max_tokens: 500,
        temperature: 0.3,
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 15000,
      }
    );

    if (res.data && res.data.choices && res.data.choices.length > 0) {
      return res.data.choices[0].message.content;
    }
    console.error('[Drishti AI] No response choices returned');
    return null;
  } catch (err) {
    console.error('[Drishti AI] API error for provider', provider || AI_PROVIDER, err.message);
    if (err.response?.data) {
      console.error('[Drishti AI API Response Data]', err.response.data);
    }
    return null;
  }
}

async function getAssistantSettings() {
  const { data } = await supabase
    .from('assistant_settings')
    .select('setting_key, setting_value');
  const settings = {};
  (data || []).forEach(row => { settings[row.setting_key] = row.setting_value; });
  return settings;
}

module.exports = { autoInvestigate, chat, generateDailySummary, callDeepSeek };
