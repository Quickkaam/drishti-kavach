const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');
require('dotenv').config({ path: './backend/.env' });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkWebsite() {
  const apiKey = 'e8cc3c520ac491964ae44f7730860b1d8ae069dac422993dc8c3926a7af06892';
  const apiKeyHash = crypto.createHash('sha512').update(apiKey).digest('hex');
  console.log('API Key Hash:', apiKeyHash);

  const { data, error } = await supabase.from('websites').select('*');
  console.log('Websites in DB:', data);
  if (error) console.error('Error fetching websites:', error);
}

checkWebsite();
