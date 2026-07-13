// ============================================
// Drishti Kavach — Cron Jobs
// ============================================

const cron = require('node-cron');
const supabase = require('../db/supabase');
const { runCleanup } = require('../routes/cleanup');
const { generateDailySummary } = require('../services/ai');
const { checkTrafficSpike, checkIpFlood } = require('../services/ddos');

function startCronJobs() {
  console.log('[CRON] Starting scheduled jobs...');

  // Every minute: DDoS check for all active websites
  cron.schedule('* * * * *', async () => {
    try {
      const { data: websites } = await supabase
        .from('websites')
        .select('id, settings')
        .eq('status', 'active');

      for (const site of (websites || [])) {
        if (site.settings?.ddos_protection_enabled !== false) {
          await checkTrafficSpike(site.id, null).catch(() => {});
          await checkIpFlood(site.id, null).catch(() => {});
        }
      }
    } catch (err) {
      console.error('[CRON DDoS]', err.message);
    }
  });

  // Daily at 8:00 AM: AI summary
  cron.schedule('0 8 * * *', async () => {
    try {
      const { data: websites } = await supabase
        .from('websites')
        .select('id')
        .eq('status', 'active');

      for (const site of (websites || [])) {
        await generateDailySummary(site.id).catch(() => {});
      }
    } catch (err) {
      console.error('[CRON AI SUMMARY]', err.message);
    }
  });

  // Daily at 2:00 AM: Data cleanup
  cron.schedule('0 2 * * *', async () => {
    try {
      await runCleanup();
    } catch (err) {
      console.error('[CRON CLEANUP]', err.message);
    }
  });

  // Every 7 days: Refresh IP intel cache
  cron.schedule('0 3 * * 0', async () => {
    try {
      const week = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      await supabase.from('ip_intel_cache').delete().lt('cached_at', week);
      console.log('[CRON] IP intel cache cleared');
    } catch (err) {
      console.error('[CRON IP CACHE]', err.message);
    }
  });

  console.log('[CRON] All jobs scheduled ✓');
}

module.exports = { startCronJobs };
