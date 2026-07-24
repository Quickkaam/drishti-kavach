const crypto = require('crypto');
const BACKEND = 'https://drishti-kavach-backend.onrender.com';
const API_KEY = 'dk_fc370748404c447454d76ff96f347075ed1c4930d941e80d';

async function runHealthCheck() {
  console.log('═══════════════════════════════════════════');
  console.log('  DRISHTI KAVACH — FULL SYSTEM HEALTH CHECK');
  console.log('═══════════════════════════════════════════\n');

  // Generate valid UUIDs
  const sessionUUID = crypto.randomUUID();

  // 1. Engagement Endpoint (Body API Key)
  try {
    const r1 = await fetch(BACKEND + '/api/sdk/engagement', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-API-Key': API_KEY },
      body: JSON.stringify({
        event_type: 'page_view',
        session_id: sessionUUID,
        data: { url: 'https://quickkaam.in/test', title: 'Test', referrer: '' },
      }),
    });
    console.log(`📊 [1/2] SDK ENGAGEMENT ENDPOINT`);
    console.log(`   Status: ${r1.status}`);
    const text1 = await r1.text();
    console.log(`   Response: ${text1}`);
    console.log(r1.ok ? '   ✅ PASS\n' : '   ❌ FAIL\n');
  } catch (e) {
    console.log(`❌ ERROR: ${e.message}\n`);
  }

  // 2. Log Endpoint (Body API Key)
  try {
    const r2 = await fetch(BACKEND + '/api/sdk/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-API-Key': API_KEY },
      body: JSON.stringify({
        event_type: 'custom_event',
        session_id: sessionUUID,
        page_url: 'https://quickkaam.in/test',
        event_data: { test: true },
        referrer: '',
      }),
    });
    console.log(`📝 [2/2] SDK LOG ENDPOINT`);
    console.log(`   Status: ${r2.status}`);
    const text2 = await r2.text();
    console.log(`   Response: ${text2}`);
    console.log(r2.ok ? '   ✅ PASS\n' : '   ❌ FAIL\n');
  } catch (e) {
    console.log(`❌ ERROR: ${e.message}\n`);
  }
}

runHealthCheck();
