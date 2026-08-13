require('dotenv').config();
const { processLogs } = require('./src/services/aiTriage');
const supabase = require('./src/db/supabase');

async function runTests() {
  console.log('🧪 Starting AI Triage & Actions Test...\n');
  
  console.log('--- TEST 0: Injecting Mock Data ---');
  // 1. Inject 5 failed logins (brute force) -> Medium Risk
  for(let i=0; i<5; i++) {
    await supabase.from('login_logs').insert({
      email: 'admin@test.com',
      ip_address: '1.1.1.1',
      success: false,
      user_agent: 'MockTest/1.0',
    });
  }
  
  // 2. Inject 3 critical security events (multi-vector) -> Low/Medium Risk
  await supabase.from('security_events').insert({ website_id: 1, event_type: 'SQL Injection', severity: 'critical', user_ip: '2.2.2.2', url: '/login', payload: '1=1', is_resolved: false });
  await supabase.from('security_events').insert({ website_id: 1, event_type: 'XSS', severity: 'critical', user_ip: '2.2.2.2', url: '/search', payload: '<script>', is_resolved: false });
  await supabase.from('security_events').insert({ website_id: 1, event_type: 'Path Traversal', severity: 'critical', user_ip: '2.2.2.2', url: '/download', payload: '../../../etc', is_resolved: false });
  
  console.log('✅ Mock data injected.\n');

  // 1. Manually run processLogs to see what it finds currently
  console.log('--- TEST 1: Run processLogs against current DB state ---');
  // Reset lastProcessedAt in the module if possible, or we just trust it picks up new rows
  const result = await processLogs();
  console.log('Result:', result);
  
  // 2. Fetch the latest AI decisions to verify what was saved
  console.log('\n--- TEST 2: Latest AI Decisions ---');
  const { data: decisions, error: decErr } = await supabase
    .from('ai_decisions')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5);
    
  if (decErr) console.error('Error fetching decisions:', decErr);
  else console.log(decisions);

  // 3. Fetch the latest audit logs
  console.log('\n--- TEST 3: Latest Audit Logs ---');
  const { data: audit, error: audErr } = await supabase
    .from('audit_logs')
    .select('*')
    .ilike('action', 'AI_%')
    .order('created_at', { ascending: false })
    .limit(5);
    
  if (audErr) console.error('Error fetching audit logs:', audErr);
  else console.log(audit);
  
  console.log('\n✅ Testing Script Finished.');
  process.exit(0);
}

runTests();
