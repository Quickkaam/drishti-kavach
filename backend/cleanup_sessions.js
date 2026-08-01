// One-time script to close all stale "ACTIVE" sessions in the database
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function cleanup() {
  console.log('Closing all stale ACTIVE sessions...');
  const { data, error } = await supabase
    .from('user_sessions')
    .update({ is_active: false, ended_at: new Date().toISOString() })
    .eq('is_active', true)
    .select('id, session_id');

  if (error) {
    console.error('Error:', error.message);
    return;
  }

  console.log(`✅ Closed ${data.length} stale sessions:`);
  data.forEach(s => console.log(`  - ${s.session_id}`));
}

cleanup();
