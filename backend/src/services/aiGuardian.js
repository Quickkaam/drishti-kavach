// ============================================
// Drishti Kavach — AI Guardian Service
// Auto-monitoring and threat response in user absence
// ============================================

const supabase = require('../db/supabase');
const { getIpIntel } = require('./ipIntel');
const { autoBlockIp } = require('./ddos');
const alertService = require('./alerts');
const { sendNotification, TYPES, SEVERITY, CATEGORIES, ROLES } = require('./notifications');

const GUARDIAN_MODE_ENABLED = (process.env.GUARDIAN_MODE_ENABLED || 'true').toLowerCase() === 'true';
const AUTO_BLOCK_THRESHOLD = parseInt(process.env.AUTO_BLOCK_THRESHOLD || '80', 10);
const AUTO_INVESTIGATE_MIN_SEVERITY = process.env.AUTO_INVESTIGATE_MIN_SEVERITY || 'medium';

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

    // Get event details
    const { data: event } = await supabase
      .from('security_events')
      .select('*')
      .eq('id', eventId)
      .single();

    if (!event) {
      console.log('[AI GUARDIAN] Event not found:', eventId);
      return null;
    }

    // Get IP intelligence
    const ipIntel = await getIpIntel(ip);

    // Determine threat level
    const threatScore = ipIntel.threat_score || 0;
    const abuseScore = ipIntel.abuse_confidence || 0;
    const severity = event.severity || 'low';

    // Decide action based on scores
    let recommendation = 'monitor';
    let reason = `Threat score: ${threatScore}, Abuse confidence: ${abuseScore}`;

    if (threatScore >= AUTO_BLOCK_THRESHOLD || abuseScore >= AUTO_BLOCK_THRESHOLD) {
      recommendation = 'block';
      reason += '. Threshold exceeded for auto-blocking';
    } else if (severity === 'critical' || severity === 'high') {
      recommendation = 'escalate';
      reason += '. High severity event requires manual review';
    }

    // Save AI decision
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

    // Auto-block if threshold exceeded
    if (recommendation === 'block') {
      console.log('[AI GUARDIAN] Auto-blocking IP:', ip);
      await autoBlockIp(websiteId, ip, `AI Guardian: ${reason}`, io);

      // Update decision
      await supabase
        .from('ai_decisions')
        .update({ action_taken: true, action_result: 'IP blocked' })
        .eq('event_id', eventId)
        .eq('ip', ip);

      // Send notification
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
      // Send alert for manual review
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
 * Auto-block an IP based on threat intelligence
 */
async function autoBlockIp(websiteId, ip, reason, io) {
  if (!isGuardianEnabled()) {
    console.log('[AI GUARDIAN] Guardian mode disabled, skipping auto-block');
    return false;
  }

  try {
    await autoBlockIp(websiteId, ip, reason, io);
    console.log('[AI GUARDIAN] Auto-blocked IP:', ip, 'for website:', websiteId);
    return true;
  } catch (err) {
    console.error('[AI GUARDIAN] Auto-block error:', err.message);
    return false;
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

    // Generate report content
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

    // Send notification
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

/**
 * Get Guardian Mode status
 */
function getStatus() {
  return {
    enabled: isGuardianEnabled(),
    autoBlockThreshold: AUTO_BLOCK_THRESHOLD,
    autoInvestigateMinSeverity: AUTO_INVESTIGATE_MIN_SEVERITY,
    lastUpdate: new Date().toISOString(),
  };
}

/**
 * Toggle Guardian Mode
 */
function toggleEnabled(enabled) {
  const newStatus = enabled === true || enabled === 'true';
  console.log('[AI GUARDIAN] Guardian mode toggled:', newStatus);
  return { success: true, enabled: newStatus };
}

module.exports = {
  isGuardianEnabled,
  autoInvestigate,
  autoBlockIp,
  generateDailySummary,
  getStatus,
  toggleEnabled,
  GUARDIAN_MODE_ENABLED,
  AUTO_BLOCK_THRESHOLD,
};