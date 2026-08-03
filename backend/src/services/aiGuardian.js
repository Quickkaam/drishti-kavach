// ============================================
// Drishti Kavach — AI Guardian Service
// Auto-monitoring and threat response in user absence
// ============================================

const supabase = require('../db/supabase');
const { getIpIntel } = require('./ipIntel');
const { sendNotification, TYPES, SEVERITY, CATEGORIES, ROLES } = require('./notifications');

const GUARDIAN_MODE_ENABLED = (process.env.GUARDIAN_MODE_ENABLED || 'true').toLowerCase() === 'true';
const AUTO_BLOCK_THRESHOLD = parseInt(process.env.AUTO_BLOCK_THRESHOLD || '80', 10);

/**
 * Check if Guardian Mode is enabled
 */
function isGuardianEnabled() {
  return GUARDIAN_MODE_ENABLED;
}

/**
 * Auto-investigate a security event
 */
async function autoInvestigate(eventId, websiteId, ip, io) {
  if (!isGuardianEnabled()) {
    console.log('[AI GUARDIAN] Guardian mode disabled, skipping auto-investigation');
    return null;
  }

  try {
    console.log('[AI GUARDIAN] Auto-investigating event:', eventId, 'IP:', ip);

    const { data: event } = await supabase
      .from('security_events')
      .select('*')
      .eq('id', eventId)
      .single();

    if (!event) {
      console.log('[AI GUARDIAN] Event not found:', eventId);
      return null;
    }

    const ipIntel = await getIpIntel(ip);
    const threatScore = ipIntel.threat_score || 0;
    const abuseScore = ipIntel.abuse_confidence || 0;
    const severity = event.severity || 'low';

    let recommendation = 'monitor';
    let reason = `Threat score: ${threatScore}, Abuse confidence: ${abuseScore}`;

    if (threatScore >= AUTO_BLOCK_THRESHOLD || abuseScore >= AUTO_BLOCK_THRESHOLD) {
      recommendation = 'block';
      reason += '. Threshold exceeded for auto-blocking';
    } else if (severity === 'critical' || severity === 'high') {
      recommendation = 'escalate';
      reason += '. High severity event requires manual review';
    }

    await supabase.from('ai_decisions').insert({
      website_id: websiteId,
      event_id: eventId,
      ip,
      decision_type: recommendation,
      reasoning: reason,
      confidence_score: Math.max(threatScore, abuseScore),
      action_taken: false,
      model_used: 'AI_Guardian_Auto',
    });

    if (recommendation === 'block') {
      console.log('[AI GUARDIAN] Auto-blocking IP:', ip);
      const { autoBlockIp: ddosAutoBlockIp } = require('./ddos');
      await ddosAutoBlockIp(websiteId, ip, `AI Guardian: ${reason}`, io);

      await supabase
        .from('ai_decisions')
        .update({ action_taken: true, action_result: 'IP blocked' })
        .eq('event_id', eventId)
        .eq('ip', ip);

      await sendNotification({
        title: `🛡️ AI Guardian Auto-Blocked IP`,
        message: `IP ${ip} automatically blocked for website ${websiteId}`,
        type: TYPES.SECURITY,
        severity: SEVERITY.CRITICAL,
        category: CATEGORIES.AI,
        targetRoles: [ROLES.SUPERADMIN, ROLES.ADMIN],
        websiteId,
        referenceType: 'security_event',
        referenceId: eventId,
        sendEmail: true,
        sendSlack: true,
        sendTelegram: true,
        sendInApp: true,
        io
      });
    } else if (recommendation === 'escalate') {
      await sendNotification({
        title: `⚠️ AI Guardian: High Severity Alert`,
        message: `Security event ${eventId} requires attention. IP: ${ip}, Severity: ${severity}`,
        type: TYPES.WARNING,
        severity: SEVERITY.HIGH,
        category: CATEGORIES.AI,
        targetRoles: [ROLES.SUPERADMIN, ROLES.ADMIN],
        websiteId,
        referenceType: 'security_event',
        referenceId: eventId,
        sendEmail: true,
        sendSlack: true,
        sendTelegram: true,
        sendInApp: true,
        io
      });
    }

    return { eventId, ip, recommendation, reason };
  } catch (err) {
    console.error('[AI GUARDIAN] Auto-investigation error:', err.message);
    return null;
  }
}

/**
 * Generate daily summary report
 */
async function generateDailySummary(websiteId) {
  if (!isGuardianEnabled()) {
    console.log('[AI GUARDIAN] Guardian mode disabled, skipping daily summary');
    return null;
  }

  try {
    const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const [
      { count: events },
      { count: threats },
      { count: blocked },
      { data: topThreats },
    ] = await Promise.all([
      supabase
        .from('events')
        .select('*', { count: 'exact', head: true })
        .eq('website_id', websiteId)
        .gte('timestamp', since24h),
      supabase
        .from('security_events')
        .select('*', { count: 'exact', head: true })
        .eq('website_id', websiteId)
        .gte('created_at', since24h),
      supabase
        .from('ip_block_list')
        .select('*', { count: 'exact', head: true })
        .eq('website_id', websiteId)
        .eq('is_active', true),
      supabase
        .from('security_events')
        .select('event_type, severity, user_ip, created_at')
        .eq('website_id', websiteId)
        .gte('created_at', since24h)
        .order('created_at', { ascending: false })
        .limit(10),
    ]);

    let summary = `**Drishti Kavach Daily Security Summary (Last 24h)**\n\n`;
    summary += `📊 *Stats:*\n`;
    summary += `- Total Events: ${events || 0}\n`;
    summary += `- Security Threats: ${threats || 0}\n`;
    summary += `- Active Blocks: ${blocked || 0}\n\n`;

    if (threats > 0) {
      summary += `⚠️ *Recent Threats:*\n`;
      topThreats.forEach((t, i) => {
        summary += `${i + 1}. ${t.event_type} - ${t.severity} - ${t.user_ip}\n`;
      });
      summary += `\n`;
    }

    summary += `🛡️ *Status: ${threats > 0 ? 'ACTIVE MONITORING' : 'CLEAN'}*`;

    await sendNotification({
      title: '📊 Drishti Kavach — Daily Security Summary',
      message: summary,
      type: TYPES.INFO,
      severity: SEVERITY.INFO,
      category: CATEGORIES.AI,
      targetRoles: [ROLES.SUPERADMIN, ROLES.ADMIN],
      websiteId,
      sendEmail: true,
      sendSlack: true,
      sendTelegram: false,
      sendInApp: true,
    });

    console.log('[AI GUARDIAN] Daily summary sent for website:', websiteId);
    return summary;
  } catch (err) {
    console.error('[AI GUARDIAN] Daily summary error:', err.message);
    return null;
  }
}

function getStatus() {
  return {
    enabled: isGuardianEnabled(),
    autoBlockThreshold: AUTO_BLOCK_THRESHOLD,
    lastUpdate: new Date().toISOString(),
  };
}

function toggleEnabled(enabled) {
  const newStatus = enabled === true || enabled === 'true';
  console.log('[AI GUARDIAN] Guardian mode toggled:', newStatus);
  return { success: true, enabled: newStatus };
}

module.exports = {
  isGuardianEnabled,
  autoInvestigate,
  generateDailySummary,
  getStatus,
  toggleEnabled,
  GUARDIAN_MODE_ENABLED,
  AUTO_BLOCK_THRESHOLD,
};