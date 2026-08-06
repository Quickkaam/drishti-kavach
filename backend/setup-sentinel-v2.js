require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function setupSentinelV2() {
  console.log('🚀 Setting up Drishti Sentinel (Direct SQL approach)\n');
  
  try {
    // Check if service_catalog exists
    const { data: catalogCheck, error: catalogErr } = await supabase
      .from('service_catalog')
      .select('count')
      .throwOnError(false);
    
    if (catalogErr) {
      console.log('Creating service_catalog table...');
      const { error: createTable } = await supabase.rpc(`
        CREATE TABLE IF NOT EXISTS service_catalog (
          id BIGSERIAL PRIMARY KEY,
          service_id VARCHAR(50) UNIQUE NOT NULL,
          display_name VARCHAR(100) NOT NULL,
          description TEXT,
          category VARCHAR(50),
          is_default BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `);
      
      if (createTable) {
        console.log('   Table created:', createTable.message);
      }
    }
    
    // Insert services
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
      const { error: insertErr } = await supabase
        .from('service_catalog')
        .upsert(service, { onConflict: 'service_id' });
      
      if (!insertErr) {
        console.log(`   Inserted: ${service.service_id}`);
      }
    }
    
    console.log('\n✅ Setup complete!');
    
  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

setupSentinelV2();
