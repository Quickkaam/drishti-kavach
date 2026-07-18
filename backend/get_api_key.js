require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const encryption = require('./src/utils/encryption');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data, error } = await supabase.from('websites').select('id, domain, api_key_encrypted').eq('domain', 'quickkaam.in').single();
  if (error) {
    console.error('Error fetching website:', error);
    return;
  }
  const apiKey = encryption.decryptData(data.api_key_encrypted);
  console.log(`WEBSITE_ID=${data.id}`);
  console.log(`API_KEY=${apiKey}`);
}

run();
