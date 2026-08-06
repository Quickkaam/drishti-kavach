require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkVoice() {
  console.log('Connected to Supabase');
  
  try {
    // Check service catalog
    const { data: services, error: servicesError } = await supabase
      .from('service_catalog')
      .select('*')
      .order('service_id', { ascending: true });
    
    if (servicesError) {
      console.log('Service catalog table not found or empty:', servicesError.message);
    } else {
      console.log('\nAvailable Services:');
      services.forEach(s => console.log(`  - ${s.service_id}: ${s.display_name}`));
    }
    
    // Check if voice_assistant service is enabled
    const { data: clientServices, error: clientError } = await supabase
      .from('client_services')
      .select('*')
      .eq('service_id', 'voice_assistant')
      .eq('enabled', true);
    
    if (clientError) {
      console.log('\n⚠️  client_services table not found. Run: node src/db/setup-sentinel.js');
      return;
    }
    
    console.log(`\nVoice Assistant Enabled Websites: ${clientServices?.length || 0}`);
    
    if (clientServices?.length === 0) {
      console.log('\n⚠️  No websites have voice_assistant enabled!');
      console.log('Please go to Admin → Sentinel and enable Voice Assistant for your website.');
      console.log('Or run: node src/db/setup-sentinel.js to create tables');
    } else {
      console.log('✅ Voice Assistant is enabled!');
      clientServices.forEach(cs => {
        console.log(`  - Website ID: ${cs.website_id}`);
      });
    }
  } catch (err) {
    console.log('Error:', err.message);
  }
}

checkVoice();
