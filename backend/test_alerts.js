// ============================================
// Drishti Kavach — Test Alerts Script
// Send test messages to Slack and Telegram
// ============================================

require('dotenv').config();
const { testAlerts } = require('./src/services/alerts');

console.log('🚀 Testing Drishti Kavach alerts...\n');

testAlerts()
  .then(() => {
    console.log('\n✅ Test alerts completed!');
    process.exit(0);
  })
  .catch(err => {
    console.error('\n❌ Test failed:', err);
    process.exit(1);
  });
