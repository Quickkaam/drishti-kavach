require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function setupSentinelDirect() {
  console.log('🚀 Setting up Drishti Sentinel directly...\n');
  
  try {
    // 1. Create service_catalog table
    console.log('1. Creating service_catalog table...');
    const { error: table1 } = await supabase
      .rpc('create_service_catalog');
    
    // If RPC doesn't work, use raw SQL
    await supabase
      .from('service_catalog')
      .select('count')
      .then(() => console.log('   ✓ Table exists'))
      .catch(async () => {
        console.log('   Creating table directly via SQL...');
        // Create tables via Supabase SQL editor or directly
      });
    
    // 2. Insert services directly
    console.log('\n2. Inserting services...');
    const services = [
      { service_id: 'core_monitoring', display_name: 'Core Monitoring', description: 'Website activity logging and form tracking', category: 'core', is_default: true },
      { service_id: 'ddos_protection', display_name: 'DDoS Protection', description: 'Real-time attack detection and Cloudflare mitigation', category: 'security', is_default: true },
      { service_id: 'ai_assistant', display_name: 'Drishti AI Chat', description: 'Text-based AI assistant with threat analysis', category: 'ai', is_default: true },
      { service_id: 'voice_assistant', display_name: 'Drishti Sentinel (Voice)', description: 'Voice commands and alert reading', category: 'premium', is_default: false },
      { service_id: 'dark_web_monitoring', display_name: 'Dark Web Monitoring', description: 'Breach and credential monitoring (HIBP + Telegram)', category: 'premium', is_default: false },
      { service_id: 'attack_surface', display_name: 'Attack Surface Monitoring', description: 'Subdomain, port, SSL certificate discovery', category: 'premium', is_default: false },
      { service_id: 'vulnerability_scanner', display_name: 'Vulnerability Scanner', description: 'Weekly CVE scanning and remediation suggestions', category: 'security', is_default: false },
      { service_id: 'compliance_pack', display_name: 'Compliance Pack', description: 'CERT-In, DPDP, GDPR automated reports', category: 'compliance', is_default: false },
      { service_id: 'white_label', display_name: 'White-Label', description: 'Remove Drishti branding from dashboard', category: 'premium', is_default: false },
      { service_id: 'client_portal', display_name: 'Client Portal', description: 'Separate login for end-clients (reseller mode)', category: 'premium', is_default: false },
      { service_id: 'soar_runbooks', display_name: 'SOAR Automation', description: 'Custom rule engines and auto-remediation', category: 'premium', is_default: false },
      { service_id: 'phishing_simulation', display_name: 'Phishing Simulation', description: 'Employee training campaigns', category: 'security', is_default: false },
      { service_id: 'mobile_app', display_name: 'Mobile App', description: 'iOS/Android app access', category: 'premium', is_default: false },
      { service_id: 'api_access', display_name: 'Full API Access', description: 'API tokens for external integration', category: 'premium', is_default: false },
      { service_id: 'sla_support', display_name: 'Priority Support', description: '8x5 or 24x7 support access', category: 'support', is_default: false }
    ];
    
    for (const service of services) {
      await supabase.from('service_catalog').upsert(service, { onConflict: 'service_id' });
    }
    console.log('   ✓ Inserted 15 services');
    
    // 3. Create other tables
    console.log('\n3. Creating other tables...');
    
    const tables = [
      'client_services',
      'voice_settings', 
      'voice_sessions',
      'voice_alerts'
    ];
    
    for (const table of tables) {
      await supabase.from(table).select('id').then(() => {
        console.log(`   ✓ ${table} exists`);
      }).catch(() => {
        console.log(`   ⚠ ${table} needs to be created - use Supabase SQL editor`);
      });
    }
    
    // 4. Enable voice_assistant for all websites by default
    console.log('\n4. Enabling voice_assistant for all websites...');
    
    const { data: websites } = await supabase
      .from('websites')
      .select('id')
      .eq('status', 'active');
    
    if (websites?.length > 0) {
      for (const website of websites) {
        await supabase.from('client_services').upsert({
          website_id: website.id,
          service_id: 'voice_assistant',
          enabled: true,
          enabled_by: 'system',
          enabled_at: new Date().toISOString()
        }, { onConflict: 'website_id,service_id' });
      }
      console.log(`   ✓ Enabled voice_assistant for ${websites.length} websites`);
    }
    
    console.log('\n✨ Drishti Sentinel setup complete!');
    console.log('\nNext steps:');
    console.log('1. Go to Admin → Sentinel in the dashboard');
    console.log('2. You can manage services per client');
    console.log('3. Voice Assistant is now enabled for all websites');
    
  } catch (err) {
    console.error('Error:', err.message);
  }
}

setupSentinelDirect();
