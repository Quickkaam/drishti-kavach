// ============================================
// Drishti Kavach — Cron Jobs
// ============================================

const cron = require('node-cron');
const supabase = require('../db/supabase');
const { runCleanup } = require('../routes/cleanup');
const { generateDailySummary } = require('../services/ai');
const { checkTrafficSpike, checkIpFlood } = require('../services/ddos');
const { cleanupOldLogs } = require('../services/logging');

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

  // Daily at 2:00 AM: Data cleanup (including 30-day log retention)
  cron.schedule('0 2 * * *', async () => {
    try {
      await runCleanup();
      // Cleanup logs older than 30 days
      await cleanupOldLogs({ days: 30 });
      console.log('[CRON] Daily cleanup complete (30-day log retention)');
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

  // Monthly on 1st at 3:30 AM: Deep cleanup old events (90d+)
  cron.schedule('30 3 1 * *', async () => {
    try {
      const cutoff90 = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
      const cutoff180 = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString();
      await supabase.from('security_events').delete().lt('created_at', cutoff90);
      await supabase.from('ddos_events').delete().lt('created_at', cutoff90);
      await supabase.from('audit_logs').delete().lt('created_at', cutoff180);
      console.log('[CRON] Monthly deep cleanup complete');
    } catch (err) {
      console.error('[CRON DEEP CLEANUP]', err.message);
    }
  });

  // Every 6 hours: DB health log
  cron.schedule('0 */6 * * *', async () => {
    try {
      const { count: eventsCount } = await supabase
        .from('security_events')
        .select('id', { count: 'exact', head: true });
      const { count: blockedCount } = await supabase
        .from('ip_block_list')
        .select('id', { count: 'exact', head: true })
        .eq('is_active', true);
      console.log(`[CRON DB HEALTH] Security events: ${eventsCount} | Blocked IPs: ${blockedCount}`);
    } catch (err) {
      console.error('[CRON DB HEALTH]', err.message);
    }
  });

  console.log('[CRON] All jobs scheduled ✓');
}

module.exports = { startCronJobs };
