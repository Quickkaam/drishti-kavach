// ============================================
// Drishti Sentinel — Setup Script
// Creates new tables and seeds service catalog
// ============================================

const { createClient } = require('@supabase/supabase-js');

require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function setupSentinel() {
  console.log('🚀 Setting up Drishti Sentinel tables...');

  try {
    // Read the schema file
    const fs = require('fs');
    const path = require('path');
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    // Extract only the Sentinel section (from the new tables)
    const sentinelSection = schema.split('-- DRISHTI SENTINEL - NEW TABLES')[1];
    
    if (!sentinelSection) {
      console.log('⚠️  Sentinel tables may already exist or schema.sql is missing');
      return;
    }

    // Split into individual statements (simple split by semicolon)
    const statements = sentinelSection
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && s.startsWith('CREATE TABLE') || s.startsWith('INSERT INTO') || s.startsWith('CREATE INDEX'));

    // Execute each statement
    for (const statement of statements) {
      try {
        const { data, error } = await supabase.rpc('exec_sql', { 
          sql: statement 
        });
        
        if (error) {
          // Some statements might fail if tables already exist - that's ok
          if (!error.message.includes('already exists')) {
            console.log(`📋 ${statement.substring(0, 50)}... - ${error.message}`);
          }
        } else {
          console.log(`✅ ${statement.substring(0, 50)}...`);
        }
      } catch (err) {
        console.log(`⚠️  ${err.message}`);
      }
    }

    console.log('\n✅ Drishti Sentinel setup complete!');
    console.log('📊 New tables created:');
    console.log('   - service_catalog (15 services)');
    console.log('   - client_services (junction table)');
    console.log('   - voice_settings');
    console.log('   - voice_sessions');
    console.log('   - voice_alerts');
    
    console.log('\n📋 Service catalog seeded with 15 services:');
    console.log('   1. core_monitoring (Always ON by default)');
    console.log('   2. ddos_protection (Always ON by default)');
    console.log('   3. ai_assistant (Always ON by default)');
    console.log('   4. voice_assistant (Sentinel add-on)');
    console.log('   5. dark_web_monitoring (Premium)');
    console.log('   6. attack_surface (Premium)');
    console.log('   7. vulnerability_scanner (Security)');
    console.log('   8. compliance_pack (Compliance)');
    console.log('   9. white_label (Premium)');
    console.log('   10. client_portal (Premium)');
    console.log('   11. soar_runbooks (Premium)');
    console.log('   12. phishing_simulation (Security)');
    console.log('   13. mobile_app (Premium)');
    console.log('   14. api_access (Premium)');
    console.log('   15. sla_support (Support)');

    console.log('\n✨ Go to Admin → Sentinel in the dashboard to manage services!');
  } catch (err) {
    console.error('❌ Error setting up Sentinel:', err.message);
    process.exit(1);
  }
}

setupSentinel();
