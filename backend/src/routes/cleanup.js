// ============================================
// Drishti Kavach — Data Cleanup Routes (Cron)
// ============================================

const express = require('express');
const supabase = require('../db/supabase');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

// POST /api/cleanup — Called by cron-job.org daily
router.post('/', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const results = await runCleanup();
    res.json({ ok: true, results });
  } catch (err) {
    res.status(500).json({ error: 'Cleanup failed' });
  }
});

async function runCleanup() {
  const results = {};

  // Events older than 90 days
  const events90 = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
  const { count: eventsDeleted } = await supabase
    .from('events').delete().lt('timestamp', events90);
  results.events_deleted = eventsDeleted;

  // DDoS events older than 90 days
  const { count: ddosDeleted } = await supabase
    .from('ddos_events').delete().lt('created_at', events90);
  results.ddos_deleted = ddosDeleted;

  // AI sessions older than 30 days
  const ai30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const { count: aiDeleted } = await supabase
    .from('ai_sessions').delete().lt('created_at', ai30);
  results.ai_sessions_deleted = aiDeleted;

  // Expired IP blocks
  const { count: blocksCleared } = await supabase
    .from('ip_block_list')
    .update({ is_active: false })
    .lt('expires_at', new Date().toISOString())
    .eq('is_active', true);
  results.expired_blocks_cleared = blocksCleared;

  // Security events older than 180 days
  const sec180 = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString();
  const { count: secArchived } = await supabase
    .from('security_events')
    .update({ status: 'archived' })
    .lt('created_at', sec180)
    .neq('status', 'archived');
  results.security_archived = secArchived;

  console.log('[CLEANUP]', new Date().toISOString(), results);
  return results;
}

module.exports = router;
module.exports.runCleanup = runCleanup;
