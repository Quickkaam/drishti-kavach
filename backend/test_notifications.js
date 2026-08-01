require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function test() {
  const { data, error } = await supabase.from('notifications').select('*').limit(1);
  if (error) {
    console.error('❌ SELECT FAILED:', error.message);
  } else {
    console.log('✅ SELECT OK:', data);
  }
}

test();
