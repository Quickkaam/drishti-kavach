// ============================================
// Drishti Kavach — DDoS Detection Service
// ============================================

const supabase = require('../db/supabase');
const axios = require('axios');

// Default thresholds
const THRESHOLDS = {
  traffic_spike_warning: 3,
  traffic_spike_critical: 10,
  ip_flood_warning: 100,
  ip_flood_critical: 500,
  botnet_ua_threshold: 50,
  geo_spike_threshold: 70,
};

async function getThresholds() {
  const { data } = await supabase
    .from('assistant_settings')
    .select('setting_value')
    .eq('setting_key', 'ddos_thresholds')
    .single();
  return data?.setting_value || THRESHOLDS;
}

// Check for traffic spike (runs every minute via cron)
async function checkTrafficSpike(websiteId, io) {
  try {
    const now = new Date();
    const last5min = new Date(now - 5 * 60 * 1000).toISOString();
    const last60min = new Date(now - 60 * 60 * 1000).toISOString();

    const [{ count: recent }, { count: lastHour }] = await Promise.all([
      supabase.from('events').select('id', { count: 'exact', head: true })
        .eq('website_id', websiteId).gte('timestamp', last5min),
      supabase.from('events').select('id', { count: 'exact', head: true })
        .eq('website_id', websiteId).gte('timestamp', last60min),
    ]);

    const recentPerMin = (recent || 0) / 5;
    const avgPerMin = (lastHour || 1) / 60;
    const ratio = recentPerMin / avgPerMin;

    const thresholds = await getThresholds();

    if (ratio >= thresholds.traffic_spike_critical) {
      await createDDoSEvent(websiteId, 'critical', 'traffic_spike', {
        ratio: ratio.toFixed(2),
        recent_per_min: recentPerMin,
        avg_per_min: avgPerMin,
      }, io);
    } else if (ratio >= thresholds.traffic_spike_warning) {
      await createDDoSEvent(websiteId, 'warning', 'traffic_spike', {
        ratio: ratio.toFixed(2),
        recent_per_min: recentPerMin,
        avg_per_min: avgPerMin,
      }, io);
    }
  } catch (err) {
    console.error('[DDoS SPIKE CHECK]', err.message);
  }
}

// Check for IP flood
async function checkIpFlood(websiteId, io) {
  try {
    const since1min = new Date(Date.now() - 60 * 1000).toISOString();
    const { data: counts } = await supabase.rpc('count_events_by_ip', {
      p_website_id: websiteId,
      p_since: since1min,
    });

    const thresholds = await getThresholds();
    for (const row of (counts || [])) {
      if (row.count >= thresholds.ip_flood_critical) {
        await createDDoSEvent(websiteId, 'critical', 'ip_flood', {
          ip: row.user_ip,
          requests_per_min: row.count,
        }, io, row.user_ip);
        await autoBlockIp(websiteId, row.user_ip, 'IP flood - auto blocked by Drishti Kavach', io);
      } else if (row.count >= thresholds.ip_flood_warning) {
        await createDDoSEvent(websiteId, 'warning', 'ip_flood', {
          ip: row.user_ip,
          requests_per_min: row.count,
        }, io, row.user_ip);
      }
    }
  } catch (err) {
    console.error('[DDoS IP FLOOD]', err.message);
  }
}

async function createDDoSEvent(websiteId, severity, attackType, details, io, affectedIp = null) {
  const { data } = await supabase.from('ddos_events').insert({
    website_id: websiteId,
    severity,
    attack_type: attackType,
    details,
    affected_ip: affectedIp,
    status: 'active',
  }).select('id').single();

  // Real-time alert
  if (io) {
    io.to(`website:${websiteId}`).emit('ddos_alert', { severity, attackType, details, affectedIp });
    io.to('admin').emit('ddos_alert', { websiteId, severity, attackType, details });
  }

  // Auto-mitigate critical
  if (severity === 'critical') {
    await mitigate(websiteId, attackType, data?.id, details, io);
  }

  return data;
}

async function mitigate(websiteId, attackType, ddosEventId, details, io) {
  try {
    // Enable Cloudflare Under Attack Mode for critical traffic spike
    if (attackType === 'traffic_spike' && process.env.CLOUDFLARE_API_TOKEN) {
      await enableCloudflareUnderAttack();
      await supabase.from('ddos_mitigations').insert({
        ddos_event_id: ddosEventId,
        action: 'cloudflare_under_attack',
        target: 'all',
        status: 'success',
        details: { note: 'Cloudflare Under Attack Mode enabled' },
      });
    }

    // Block IP for ip_flood
    if (attackType === 'ip_flood' && details.ip) {
      await autoBlockIp(websiteId, details.ip, 'Auto-blocked: DDoS IP flood', io);
      await supabase.from('ddos_mitigations').insert({
        ddos_event_id: ddosEventId,
        action: 'ip_block',
        target: details.ip,
        status: 'success',
        details: { ip: details.ip },
      });
    }

    // Update ddos_event mitigation_taken
    await supabase.from('ddos_events').update({
      mitigation_taken: true,
      mitigation_details: { actions: ['auto_mitigated'] },
    }).eq('id', ddosEventId);

  } catch (err) {
    console.error('[DDoS MITIGATE]', err.message);
  }
}

async function autoBlockIp(websiteId, ip, reason, io) {
  await supabase.from('ip_block_list').upsert({
    website_id: websiteId,
    ip,
    reason,
    blocked_by: 'Drishti AI',
    severity: 'critical',
    is_active: true,
    expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24h
  }, { onConflict: 'ip,website_id' });

  if (io) {
    io.to(`website:${websiteId}`).emit('ip_blocked', { ip, reason });
  }
}

async function enableCloudflareUnderAttack() {
  if (!process.env.CLOUDFLARE_API_TOKEN || !process.env.CLOUDFLARE_ZONE_ID) return;
  await axios.patch(
    `https://api.cloudflare.com/client/v4/zones/${process.env.CLOUDFLARE_ZONE_ID}/settings/security_level`,
    { value: 'under_attack' },
    { headers: { Authorization: `Bearer ${process.env.CLOUDFLARE_API_TOKEN}` } }
  );
}

module.exports = { checkTrafficSpike, checkIpFlood, createDDoSEvent, autoBlockIp };
