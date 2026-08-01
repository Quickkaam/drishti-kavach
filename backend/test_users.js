require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function test() {
  const { data, error } = await supabase.from('users').select('id, role, is_active');
  if (error) {
    console.error('❌ SELECT FAILED:', error.message);
  } else {
    console.log('✅ USERS:', data);
  }
}

test();
