// ============================================
// Drishti Kavach — Integration Status Route
// Shows which APIs/services are configured
// GET /api/integrations/status
// ============================================

const express = require('express');
const axios = require('axios');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth, requireRole('admin', 'superadmin'));

// GET /api/integrations/status — Check all integration configs
router.get('/status', async (req, res) => {
  const env = process.env;

  // Test live connectivity for critical services
  const [backendAlive, supabaseAlive] = await Promise.allSettled([
    axios.get('https://drishti-kavach-backend.onrender.com/api/health', { timeout: 5000 }),
    axios.get(`${env.SUPABASE_URL}/rest/v1/`, {
      headers: { apikey: env.SUPABASE_ANON_KEY },
      timeout: 5000,
    }),
  ]);

  const integrations = {
    // ── Core Infrastructure ──────────────────────────
    core: [
      { name: 'Backend API', status: backendAlive.status === 'fulfilled' ? 'online' : 'offline', type: 'core', free: true },
      { name: 'Supabase DB', status: supabaseAlive.status === 'fulfilled' ? 'online' : 'offline', type: 'core', free: true },
      { name: 'JWT Auth', status: !!env.JWT_SECRET ? 'configured' : 'missing', type: 'core', free: true },
      { name: 'AES Encryption', status: !!env.ENCRYPTION_KEY ? 'configured' : 'using-fallback', type: 'core', free: true },
    ],

    // ── AI ───────────────────────────────────────────
    ai: [
      { name: 'Groq AI', status: !!env.GROQ_API_KEY ? 'configured' : 'missing', type: 'ai', free: true, url: 'https://console.groq.com' },
      { name: 'DeepSeek AI', status: !!env.DEEPSEEK_API_KEY ? 'configured' : 'not-set', type: 'ai', free: false, url: 'https://platform.deepseek.com' },
    ],

    // ── Threat Intel (no key required) ───────────────
    threat_intel_free: [
      { name: 'ip-api.com', status: 'active', type: 'threat', free: true, note: 'Geolocation — no key needed' },
      { name: 'AlienVault OTX', status: 'active', type: 'threat', free: true, note: 'Threat pulses — no key needed' },
      { name: 'URLScan.io', status: 'active', type: 'threat', free: true, note: 'Malicious scan — no key needed' },
    ],

    // ── Threat Intel (key required) ──────────────────
    threat_intel_keyed: [
      { name: 'AbuseIPDB', status: !!env.ABUSEIPDB_API_KEY ? 'configured' : 'not-set', type: 'threat', free: true, url: 'https://www.abuseipdb.com/register' },
      { name: 'GreyNoise', status: !!env.GREYNOISE_API_KEY ? 'configured' : 'not-set', type: 'threat', free: true, url: 'https://www.greynoise.io' },
      { name: 'VirusTotal', status: !!env.VIRUSTOTAL_API_KEY ? 'configured' : 'not-set', type: 'threat', free: true, url: 'https://www.virustotal.com/gui/join-us' },
    ],

    // ── CVE / Vulnerability ───────────────────────────
    vulnerability: [
      { name: 'NVD CVE Database', status: 'active', type: 'vuln', free: true, note: 'No key needed' },
      { name: 'CIRCL CVE Search', status: 'active', type: 'vuln', free: true, note: 'No key needed' },
      { name: 'OSV Database', status: 'active', type: 'vuln', free: true, note: 'No key needed' },
      { name: 'GitHub Advisories', status: 'active', type: 'vuln', free: true, note: 'No key needed' },
      { name: 'HaveIBeenPwned', status: !!env.HIBP_API_KEY ? 'configured' : 'limited', type: 'vuln', free: false, url: 'https://haveibeenpwned.com/API/Key', note: 'Domain checks work without key' },
    ],

    // ── Alerting ──────────────────────────────────────
    alerting: [
      { name: 'Slack', status: !!env.SLACK_WEBHOOK_URL ? 'configured' : 'not-set', type: 'alert', free: true, url: 'https://api.slack.com/apps' },
      { name: 'Telegram', status: (!!env.TELEGRAM_BOT_TOKEN && !!env.TELEGRAM_CHAT_ID) ? 'configured' : 'not-set', type: 'alert', free: true, url: 'https://t.me/BotFather' },
    ],

    // ── Edge / CDN ────────────────────────────────────
    edge: [
      { name: 'Cloudflare', status: (!!env.CLOUDFLARE_API_TOKEN && !!env.CLOUDFLARE_ZONE_ID) ? 'configured' : 'not-set', type: 'edge', free: true, url: 'https://dash.cloudflare.com' },
      { name: 'Turnstile CAPTCHA', status: !!env.TURNSTILE_SECRET_KEY ? 'configured' : 'missing', type: 'edge', free: true },
    ],
  };

  // Summary counts
  const allItems = Object.values(integrations).flat();
  const summary = {
    total: allItems.length,
    active: allItems.filter(i => ['configured', 'active', 'online'].includes(i.status)).length,
    missing: allItems.filter(i => ['not-set', 'missing', 'offline'].includes(i.status)).length,
  };

  res.json({ integrations, summary });
});

module.exports = router;
