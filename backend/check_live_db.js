require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkDatabase() {
  console.log('--- DATABASE CHECK ---');
  
  const { data: sessions, error: se } = await supabase.from('user_sessions').select('*').order('started_at', { ascending: false }).limit(5);
  console.log('Recent user_sessions:', sessions);
  if (se) console.log('user_sessions error:', se);
}

checkDatabase();
