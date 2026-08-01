// ============================================
// Drishti Kavach — AI Guardian Service
// Autonomous Security Monitoring & Auto-Blocking
// ============================================

const supabase = require('../db/supabase');
const { getIpIntel } = require('./ipIntel');
const { autoBlockIp } = require('./ddos');
const { sendNotification, TYPES, SEVERITY, CATEGORIES, ROLES } = require('./notifications');
const { logSecurityEvent } = require('./logging');
const { callDeepSeek } = require('./ai');
const { getMitreMapping, getSeverityFromType } = require('./security');

// Guardian mode settings
const DEFAULT_CONFIG = {
  autoInvestigate: true,
  autoBlockThreshold: 80,
  autoBlockDurationHours: 24,
  monitorAllEvents: true,
  escalateSeverity: 'critical',
};

/**
 * Get guardian configuration for a website
 */
async function getGuardianConfig(websiteId) {
  try {
    // Try to get from assistant_settings
    const { data: settings } = await supabase
      .from('assistant_settings')
      .select('setting_value')
      .eq('setting_key', 'guardian_mode')
      .eq('website_id', websiteId)
      .single();

    if (settings?.setting_value) {
      return { ...DEFAULT_CONFIG, ...settings.setting_value };
    }

    // Try global setting
    const { data: globalSettings } = await supabase
      .from('assistant_settings')
      .select('setting_value')
      .eq('setting_key', 'guardian_mode')
      .single();

    if (globalSettings?.setting_value) {
      return { ...DEFAULT_CONFIG, ...globalSettings.setting_value };
    }

    return DEFAULT_CONFIG;
  } catch (err) {
    console.error('[AI GUARDIAN] Error getting config:', err.message);
    return DEFAULT_CONFIG;
  }
}

/**
 * Check if guardian mode is enabled for a website
 */
async function isGuardianEnabled(websiteId) {
  const config = await getGuardianConfig(websiteId);
  return config.enabled !== false;
}

/**
 * Capture attacker IP from security event
 */
async function captureAttackerIP(event) {
  try {
    const ip = event.user_ip || event.ip;
    if (!ip || ip === '::1' || ip.startsWith('127.') || ip.startsWith('192.168.') || ip.startsWith('10.')) {
      return null;
    }

    const intel = await getIpIntel(ip);
    
    // Log attacker info
    const attackerInfo = {
      ip,
      country: intel.country,
      country_code: intel.country_code,
      threat_score: intel.threat_score,
      abuse_confidence: intel.abuse_confidence,
      total_reports: intel.total_reports,
      is_scanner: intel.is_scanner,
      is_vpn: intel.is_vpn,
      city: intel.city,
      latitude: intel.latitude,
      longitude: intel.longitude,
    };

    await supabase.from('attackers').upsert({
      ip,
      website_id: event.website_id,
      first_seen: event.created_at || new Date().toISOString(),
      last_seen: new Date().toISOString(),
      event_type: event.event_type,
      severity: event.severity,
      payload: event.payload,
      mitre_technique: event.mitre_technique_id,
      intel: attackerInfo,
      status: 'active',
    }, { onConflict: 'ip,website_id' });

    return attackerInfo;
  } catch (err) {
    console.error('[AI GUARDIAN] Error capturing attacker IP:', err.message);
    return null;
  }
}

/**
 * Calculate threat score based on multiple factors
 */
function calculateThreatScore(intel, eventType, payload) {
  let score = 0;

  // Base threat score from IP intel
  score += (intel.threat_score || 0) * 0.3;
  score += (intel.abuse_confidence || 0) * 0.25;
  score += Math.min(20, (intel.total_reports || 0) * 2);
  score += intel.is_scanner ? 15 : 0;
  score += intel.is_vpn ? 5 : 0;

  // Event type severity
  const severityMap = { critical: 30, high: 20, medium: 10, low: 5 };
  const eventTypeScore = severityMap[getSeverityFromType(eventType)] || 10;
  score += eventTypeScore;

  // Payload analysis
  if (payload) {
    const maliciousPatterns = ['select', 'union', 'script', 'eval(', 'onclick=', '..'];
    const patternCount = maliciousPatterns.filter(p => payload.toLowerCase().includes(p)).length;
    score += patternCount * 5;
  }

  return Math.min(100, Math.round(score));
}

/**
 * Auto-investigate a security event with full AI analysis
 */
async function autoInvestigate(event, io) {
  try {
    const websiteId = event.website_id;
    const ip = event.user_ip || event.ip;

    // Get attacker intel
    const intel = await getIpIntel(ip);
    const threatScore = calculateThreatScore(intel, event.event_type, event.payload);

    // Enhanced prompt for comprehensive A-Z analysis
    const prompt = `You are Drishti AI Guardian — autonomous security responder.

ATTACKER INTELLIGENCE:
IP: ${ip}
Country: ${intel.country || 'Unknown'}
Threat Score: ${threatScore}/100
Abuse Confidence: ${intel.abuse_confidence || 0}%
Reports: ${intel.total_reports || 0}
Is Scanner: ${intel.is_scanner ? 'YES' : 'No'}
VPN: ${intel.is_vpn ? 'YES' : 'No'}
City: ${intel.city || 'Unknown'}

ATTACK DETAILS:
Type: ${event.event_type}
Severity: ${event.severity}
Payload: ${(event.payload || '').substring(0, 300)}
URL: ${event.url || 'N/A'}
MITRE Technique: ${event.mitre_technique_id || 'N/A'}

CONDUCT A COMPREHENSIVE A-Z SECURITY ANALYSIS:
1. Threat Assessment: Evaluate the immediate threat level
2. Attack Vector: Identify the exact attack method
3. Impact Analysis: Potential damage to system/data
4. Indicators of Compromise (IoCs): Extract any malware/C2 indicators
5. Attack Pattern: Determine if this is part of a larger campaign
6. Historical Context: Check if attacker has been seen before
7. Recommendation: Immediate action required
8. Mitigation Steps: How to prevent future attacks

Respond with VALID JSON:
{
  "threat_level": "low|medium|high|critical",
  "recommendation": "block|monitor|escalate|dismiss",
  "reasoning": "Detailed analysis summary",
  "confidence": 0-100,
  "mitre_technique": "TXXX.XXX",
  "attack_vector": "Detailed description",
  "impact": "Potential damage assessment",
  "iocs": ["list", "of", "indicators"],
  "historical_pattern": "pattern description or 'new_attack'",
  "mitigation_steps": ["step1", "step2", "step3"],
  "additional_actions": ["auto_block", "log_analysis", "monitor_ip"]
}`;

    const analysis = await callDeepSeek(prompt);

    let decision;
    try {
      decision = JSON.parse(analysis);
    } catch {
      // Fallback if JSON parsing fails
      decision = {
        threat_level: event.severity,
        recommendation: event.severity === 'critical' ? 'block' : 'monitor',
        reasoning: analysis,
        confidence: 50,
        mitre_technique: event.mitre_technique_id,
        attack_vector: event.event_type,
        impact: 'Unknown',
        iocs: [],
        historical_pattern: 'unknown',
        mitigation_steps: ['Review logs', 'Monitor traffic'],
        additional_actions: ['log_analysis'],
      };
    }

    // Save AI decision
    await supabase.from('ai_decisions').insert({
      website_id: websiteId,
      event_id: event.id,
      ip,
      decision_type: decision.recommendation,
      reasoning: decision.reasoning,
      confidence_score: decision.confidence,
      threat_score: threatScore,
      threat_level: decision.threat_level,
      attack_vector: decision.attack_vector,
      impact: decision.impact,
      iocs: decision.iocs,
      mitigation_steps: decision.mitigation_steps,
      action_taken: false,
      model_used: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
    });

    // Auto-block based on threat score and recommendation
    const config = await getGuardianConfig(websiteId);
    
    if (
      (decision.recommendation === 'block' || threatScore >= (config.autoBlockThreshold || 80)) &&
      !event.ip_blocklisted
    ) {
      await autoBlockIp(websiteId, ip, 
        `AI Guardian: ${decision.reasoning?.substring(0, 100) || 'High threat score'}`, 
        io);

      await supabase.from('ai_decisions').update({ 
        action_taken: true, 
        action_result: 'IP blocked' 
      })
      .eq('event_id', event.id).eq('ip', ip);

      // Send critical alert
      await sendNotification({
        title: `🛡️ AI Guardian Auto-Blocked IP`,
        message: `IP ${ip} auto-blocked. Threat score: ${threatScore}/100. Reason: ${decision.reasoning?.substring(0, 150) || 'High threat'}`,
        type: TYPES.SECURITY,
        severity: SEVERITY.CRITICAL,
        category: CATEGORIES.AI,
        targetRoles: [ROLES.SUPERADMIN, ROLES.ADMIN],
        websiteId,
        referenceType: 'security_event',
        referenceId: event.id,
        sendEmail: true,
        sendSlack: true,
        sendTelegram: true,
        sendInApp: true,
        io
      });

      // Log security event
      await logSecurityEvent({
        type: 'ai_guardian_block',
        severity: 'critical',
        description: `AI Guardian auto-blocked IP ${ip} based on threat score ${threatScore}`,
        websiteId,
        data: { ip, threat_score: threatScore, decision },
        ip,
      });
    } else if (decision.recommendation === 'escalate') {
      // Escalate to admin
      await sendNotification({
        title: `🚨 Security Event Escalated`,
        message: `Event ${event.event_type} from IP ${ip} requires immediate attention. Threat score: ${threatScore}/100. Reason: ${decision.reasoning?.substring(0, 150)}`,
        type: TYPES.WARNING,
        severity: decision.threat_level === 'critical' ? SEVERITY.CRITICAL : decision.threat_level === 'high' ? SEVERITY.HIGH : SEVERITY.MEDIUM,
        category: CATEGORIES.AI,
        targetRoles: [ROLES.SUPERADMIN, ROLES.ADMIN],
        websiteId,
        referenceType: 'security_event',
        referenceId: event.id,
        sendEmail: true,
        sendSlack: true,
        sendTelegram: true,
        sendInApp: true,
        io
      });
    } else if (decision.threat_level === 'critical' || decision.threat_level === 'high') {
      // Send warning notification even if not auto-blocking
      const alertSeverity = decision.threat_level === 'critical' ? SEVERITY.CRITICAL : SEVERITY.HIGH;
      
      await sendNotification({
        title: `🤖 AI Guardian: ${decision.threat_level.toUpperCase()} Threat Detected`,
        message: `Recommendation: ${decision.recommendation}. Reason: ${decision.reasoning?.substring(0, 150) || 'AI analysis'}`,
        type: TYPES.WARNING,
        severity: alertSeverity,
        category: CATEGORIES.AI,
        targetRoles: [ROLES.SUPERADMIN, ROLES.ADMIN],
        websiteId,
        referenceType: 'security_event',
        referenceId: event.id,
        sendEmail: alertSeverity === SEVERITY.CRITICAL,
        sendSlack: true,
        sendTelegram: alertSeverity === SEVERITY.CRITICAL,
        sendInApp: true,
        io
      });
    }

    // Emit real-time event
    if (io) {
      io.to(`website:${websiteId}`).emit('ai_guardian_decision', { 
        eventId: event.id, 
        ip,
        decision,
        threatScore
      });
    }

    return { decision, threatScore, intel };
  } catch (err) {
    console.error('[AI GUARDIAN INVESTIGATE]', err.message);
    return { error: err.message };
  }
}

/**
 * Monitor all security events in real-time
 */
async function monitorSecurityEvents(io) {
  try {
    const config = await getGuardianConfig(null); // Global config

    if (!config.enabled) {
      console.log('[AI GUARDIAN] Guardian mode disabled');
      return;
    }

    // Fetch recent security events (last 5 minutes)
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    
    const { data: events } = await supabase
      .from('security_events')
      .select('*')
      .eq('status', 'new')
      .gte('created_at', fiveMinAgo)
      .order('created_at', { ascending: false })
      .limit(50);

    if (!events || events.length === 0) {
      return;
    }

    console.log(`[AI GUARDIAN] Processing ${events.length} new security events`);

    // Process each event
    for (const event of events) {
      try {
        // Mark as investigating
        await supabase.from('security_events')
          .update({ status: 'investigating', investigating_by: 'AI Guardian' })
          .eq('id', event.id);

        // Capture attacker IP
        await captureAttackerIP(event);

        // Auto-investigate
        const result = await autoInvestigate(event, io);

        // Update event status
        const status = result?.decision?.recommendation === 'block' ? 'resolved' : 'investigating';
        await supabase.from('security_events')
          .update({ status, last_investigated_at: new Date().toISOString() })
          .eq('id', event.id);

      } catch (eventErr) {
        console.error(`[AI GUARDIAN] Error processing event ${event.id}:`, eventErr.message);
      }
    }

  } catch (err) {
    console.error('[AI GUARDIAN MONITOR]', err.message);
  }
}

/**
 * Get all attackers with full intel
 */
async function getAttackers(websiteId = null) {
  try {
    let query = supabase
      .from('attackers')
      .select(`
        *,
        security_events(count),
        ai_decisions(count)
      `)
      .order('first_seen', { ascending: false });

    if (websiteId) {
      query = query.eq('website_id', websiteId);
    }

    const { data: attackers } = await query;
    return attackers || [];
  } catch (err) {
    console.error('[AI GUARDIAN] Error getting attackers:', err.message);
    return [];
  }
}

/**
 * Get attacker details by IP
 */
async function getAttackerDetail(ip, websiteId) {
  try {
    const { data } = await supabase
      .from('attackers')
      .select('*')
      .eq('ip', ip)
      .eq('website_id', websiteId)
      .single();

    return data;
  } catch (err) {
    console.error('[AI GUARDIAN] Error getting attacker:', err.message);
    return null;
  }
}

/**
 * Manual block by admin
 */
async function manualBlockIP(websiteId, ip, reason, userId) {
  try {
    const intel = await getIpIntel(ip);
    
    await supabase.from('ip_block_list').upsert({
      website_id: websiteId,
      ip,
      reason: `Manual block by ${userId}: ${reason}`,
      blocked_by: userId,
      severity: 'high',
      is_active: true,
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    }, { onConflict: 'ip,website_id' });

    // Update attacker status
    await supabase.from('attackers').update({
      status: 'blocked',
      blocked_by: userId,
      blocked_at: new Date().toISOString(),
    }).eq('ip', ip).eq('website_id', websiteId);

    // Log action
    await logSecurityEvent({
      type: 'manual_block',
      severity: 'high',
      description: `Admin manually blocked IP ${ip}`,
      websiteId,
      data: { ip, reason, blocked_by: userId },
      ip,
    });

    return { success: true, message: `IP ${ip} blocked` };
  } catch (err) {
    console.error('[AI GUARDIAN] Manual block error:', err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Get guardian dashboard stats
 */
async function getGuardianStats(websiteId = null) {
  try {
    const stats = {
      totalAttackers: 0,
      activeAttackers: 0,
      blockedAttackers: 0,
      criticalThreats: 0,
      highThreats: 0,
      todayAttacks: 0,
    };

    let query = supabase.from('attackers').select('*', { count: 'exact', head: true });

    if (websiteId) {
      query = query.eq('website_id', websiteId);
    }

    const { count } = await query;
    stats.totalAttackers = count || 0;

    // Count active attackers
    const { count: activeCount } = await supabase
      .from('attackers')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active')
      .eq('website_id', websiteId);

    stats.activeAttackers = activeCount || 0;

    // Count blocked attackers
    const { count: blockedCount } = await supabase
      .from('attackers')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'blocked')
      .eq('website_id', websiteId);

    stats.blockedAttackers = blockedCount || 0;

    // Count critical threats (last 24h)
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    
    const { count: criticalCount } = await supabase
      .from('security_events')
      .select('*', { count: 'exact', head: true })
      .eq('severity', 'critical')
      .gte('created_at', yesterday)
      .eq('website_id', websiteId);

    stats.criticalThreats = criticalCount || 0;

    // Count today's attacks
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString();

    const { count: todayCount } = await supabase
      .from('security_events')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', todayStr)
      .eq('website_id', websiteId);

    stats.todayAttacks = todayCount || 0;

    return stats;
  } catch (err) {
    console.error('[AI GUARDIAN STATS]', err.message);
    return null;
  }
}

module.exports = {
  getGuardianConfig,
  isGuardianEnabled,
  captureAttackerIP,
  calculateThreatScore,
  autoInvestigate,
  monitorSecurityEvents,
  getAttackers,
  getAttackerDetail,
  manualBlockIP,
  getGuardianStats,
};