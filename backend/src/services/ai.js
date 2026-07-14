// ============================================
// Drishti Kavach — Drishti AI Service
// Powered by Groq and OpenRouter AI
// ============================================

const axios = require('axios');
const supabase = require('../db/supabase');
const { getIpIntel } = require('./ipIntel');
const { autoBlockIp } = require('./ddos');
const alertService = require('./alerts');

// AI Provider Configuration
const AI_PROVIDER = (process.env.AI_PROVIDER || 'groq').toLowerCase();
let DEEPSEEK_URL;
let MODEL;

if (AI_PROVIDER === 'groq') {
  DEEPSEEK_URL = 'https://api.groq.com/openai';
  MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
} else {
  DEEPSEEK_URL = 'https://openrouter.ai/api';
  MODEL = process.env.OPENROUTER_MODEL || 'deepseek/deepseek-chat';
}

// API Keys with fallback support
const API_KEYS = [
  process.env.DEEPSEEK_API_KEY,
  process.env.DEEPSEEK_API_KEY_BACKUP,
].filter(key => key && key.trim() !== '');

console.log('[AI Service] Provider:', AI_PROVIDER);
console.log('[AI Service] URL:', DEEPSEEK_URL);
console.log('[AI Service] Model:', MODEL);
console.log('[AI Service] API Keys configured:', API_KEYS.length);

let currentApiKeyIndex = 0;

function getNextApiKey() {
  if (API_KEYS.length === 0) return null;
  const key = API_KEYS[currentApiKeyIndex];
  currentApiKeyIndex = (currentApiKeyIndex + 1) % API_KEYS.length;
  return key;
}

const SYSTEM_PROMPT = `You are Drishti AI, the intelligent security guardian of Drishti Kavach SOC Dashboard.
Your duties:
- Analyze cybersecurity threats (SQLi, XSS, DDoS, brute force, honeypot triggers)
- Provide concise threat assessments with severity ratings
- Recommend specific actions (block IP, escalate, dismiss, investigate)
- Map threats to MITRE ATT&CK framework
- Speak with authority and precision
- Always respond in JSON format when analyzing threats
- Use the motto: "दृष्टिः रक्षति, रक्षा दृश्यते" — Vision protects, and protection is seen.`;

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

    const response = await callDeepSeek(prompt);
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
async function chat(userId, websiteId, question, sessionId) {
  try {
    const apiKey = getNextApiKey();
    if (!apiKey) {
      return { response: 'Drishti AI is not configured. Please set DEEPSEEK_API_KEY.' };
    }

    // Fetch recent context
    const { data: recentEvents } = await supabase
      .from('security_events')
      .select('event_type, severity, user_ip, created_at')
      .eq('website_id', websiteId)
      .order('created_at', { ascending: false })
      .limit(5);

    const { data: stats } = await supabase
      .from('security_events')
      .select('id', { count: 'exact', head: true })
      .eq('website_id', websiteId)
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    const contextPrompt = `Context:
- Security events in last 24h: ${stats?.count || 0}
- Recent events: ${JSON.stringify(recentEvents?.slice(0, 3) || [])}

User question: ${question}`;

    const response = await callDeepSeek(contextPrompt);

    if (!response) {
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
    console.error('[AI CHAT]', err.message);
    return { response: 'Drishti AI encountered an error. Please try again.' };
  }
}

// Daily summary
async function generateDailySummary(websiteId) {
  try {
    if (!process.env.DEEPSEEK_API_KEY) return null;

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

    await alertService.sendAlert({
      title: '📊 Drishti Kavach — Daily Security Summary',
      message: summary,
      severity: 'info',
    });

    return summary;
  } catch (err) {
    console.error('[AI SUMMARY]', err.message);
  }
}

async function callDeepSeek(userMessage) {
  const apiKey = getNextApiKey();
  
  if (!apiKey) {
    console.error('[Drishti AI] No API key configured');
    return null;
  }
  
  console.log('[Drishti AI] Calling API with key:', apiKey.substring(0, 10) + '...');
  
  try {
    const res = await axios.post(
      `${DEEPSEEK_URL}/v1/chat/completions`,
      {
        model: MODEL,
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
    
    console.log('[Drishti AI] API response received, choices:', res.data.choices?.length);
    
    if (!res.data.choices || res.data.choices.length === 0) {
      console.error('[Drishti AI] No choices in response');
      return null;
    }
    
    return res.data.choices[0].message.content;
  } catch (err) {
    console.error('[Drishti AI API Error]', err.message);
    console.error('[Drishti AI API Response Data]', err.response?.data);
    console.error('[Drishti AI API Response Status]', err.response?.status);
    // Try next key if available
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
