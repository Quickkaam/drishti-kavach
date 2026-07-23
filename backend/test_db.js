require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function test() {
  const { data, error } = await supabase.from('websites').select('api_key, domain, name, settings').eq('id', 1).single();
  console.log('Data:', data);
  console.log('Error:', error);
}

test();
