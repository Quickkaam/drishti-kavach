require('dotenv').config();
const { callDeepSeek } = require('./src/services/ai');
const supabase = require('./src/db/supabase');

async function test() {
  console.log('Testing callDeepSeek...');
  const res = await callDeepSeek('Say "hello test"');
  console.log('AI Response:', res);
  
  console.log('Testing audit_logs query...');
  const { data, error } = await supabase.from('audit_logs').select('*').limit(1);
  if (error) {
    console.error('❌ audit_logs error:', error.message);
  } else {
    console.log('✅ audit_logs data:', data);
  }
}
test();
