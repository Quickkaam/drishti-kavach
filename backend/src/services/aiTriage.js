// ============================================
// Drishti Kavach — AI Triage Engine
// Background worker that continuously monitors
// logs and makes autonomous security decisions
// ============================================

const supabase = require('../db/supabase');
const { executeAiAction } = require('./aiActions');
const { sendAlert } = require('./alerts');
const { propagateThreat } = require('./aiFederation');

// Track last processed timestamp to avoid re-processing
let lastProcessedAt = new Date(Date.now() - 10 * 60 * 1000).toISOString(); // Start 10 min ago

/**
 * Fetch recent unprocessed logs from multiple tables
 * @param {Number} limit Max logs per table
 */
async function fetchRecentLogs(limit = 100) {
  const since = lastProcessedAt;
  
  const [secEvents, ddosEvents, loginLogs] = await Promise.all([
    // Security events not yet resolved
    supabase.from('security_events')
      .select('id, website_id, event_type, severity, user_ip, user_agent, url, payload, created_at')
      .gte('created_at', since)
      .eq('is_resolved', false)
      .order('created_at', { ascending: false })
      .limit(limit),
    // DDoS events still active
    supabase.from('ddos_events')
      .select('id, website_id, severity, attack_type, details, affected_ip, total_requests, created_at')
      .gte('created_at', since)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(limit),
    // Failed login attempts (brute force detection)
    supabase.from('login_logs')
      .select('id, email, ip_address, success, created_at')
      .gte('created_at', since)
      .eq('success', false)
      .order('created_at', { ascending: false })
      .limit(limit)
  ]);

  return {
    securityEvents: secEvents.data || [],
    ddosEvents: ddosEvents.data || [],
    failedLogins: loginLogs.data || []
  };
}

/**
 * Group related events (e.g., same IP doing multiple things)
 */
function groupEventsByIp(logs) {
  const ipMap = {};
  
  // Group security events
  for (const evt of logs.securityEvents) {
    const ip = evt.user_ip;
    if (!ip) continue;
    if (!ipMap[ip]) ipMap[ip] = { ip, securityEvents: [], ddosEvents: [], failedLogins: [], websiteIds: new Set() };
    ipMap[ip].securityEvents.push(evt);
    ipMap[ip].websiteIds.add(evt.website_id);
  }
  
  // Group DDoS events
  for (const evt of logs.ddosEvents) {
    const ip = evt.affected_ip;
    if (!ip) continue;
    if (!ipMap[ip]) ipMap[ip] = { ip, securityEvents: [], ddosEvents: [], failedLogins: [], websiteIds: new Set() };
    ipMap[ip].ddosEvents.push(evt);
    ipMap[ip].websiteIds.add(evt.website_id);
  }
  
  // Group failed logins
  for (const evt of logs.failedLogins) {
    const ip = evt.ip_address;
    if (!ip) continue;
    if (!ipMap[ip]) ipMap[ip] = { ip, securityEvents: [], ddosEvents: [], failedLogins: [], websiteIds: new Set() };
    ipMap[ip].failedLogins.push(evt);
  }
  
  return Object.values(ipMap).map(group => ({
    ...group,
    websiteIds: [...group.websiteIds]
  }));
}

/**
 * Local heuristic-based triage (no LLM call needed for obvious cases)
 * Returns decisions for clear-cut threats; returns null for ambiguous cases
 */
function heuristicTriage(ipGroup) {
  const decisions = [];
  const { ip, securityEvents, ddosEvents, failedLogins, websiteIds } = ipGroup;
  const websiteId = websiteIds[0]; // Primary website
  
  // Rule 1: Brute force — 5+ failed logins from same IP in window
  if (failedLogins.length >= 5) {
    decisions.push({
      website_id: websiteId,
      event_id: null,
      ip,
      decision_type: 'block_ip',
      reasoning: `Brute force detected: ${failedLogins.length} failed login attempts from this IP in the monitoring window.`,
      confidence_score: Math.min(95, 60 + failedLogins.length * 5),
      risk_level: failedLogins.length >= 10 ? 'low' : 'medium', // 10+ = auto, 5-9 = auto+alert
      model_used: 'heuristic_triage'
    });
  }
  
  // Rule 2: Multi-vector attack — security events across multiple types
  const uniqueTypes = new Set(securityEvents.map(e => e.event_type));
  if (uniqueTypes.size >= 3) {
    decisions.push({
      website_id: websiteId,
      event_id: securityEvents[0]?.id,
      ip,
      decision_type: 'block_ip',
      reasoning: `Multi-vector attack: ${uniqueTypes.size} distinct attack types (${[...uniqueTypes].join(', ')}) from single IP.`,
      confidence_score: 90,
      risk_level: 'low', // Auto-execute — very clear signal
      model_used: 'heuristic_triage'
    });
  }
  
  // Rule 3: Critical severity events — immediate quarantine
  const criticalEvents = securityEvents.filter(e => e.severity === 'critical');
  if (criticalEvents.length > 0 && decisions.length === 0) {
    decisions.push({
      website_id: websiteId,
      event_id: criticalEvents[0].id,
      ip,
      decision_type: 'quarantine_ip',
      reasoning: `${criticalEvents.length} critical severity event(s) detected: ${criticalEvents.map(e => e.event_type).join(', ')}`,
      confidence_score: 75,
      risk_level: 'medium', // Auto + alert for critical
      model_used: 'heuristic_triage'
    });
  }
  
  // Rule 4: Active DDoS from specific IP
  if (ddosEvents.length > 0) {
    const totalRequests = ddosEvents.reduce((sum, e) => sum + (e.total_requests || 0), 0);
    if (totalRequests > 500) {
      decisions.push({
        website_id: websiteId,
        event_id: null,
        ip,
        decision_type: 'block_ip',
        reasoning: `DDoS source: ${totalRequests} requests in monitoring window across ${ddosEvents.length} DDoS event(s).`,
        confidence_score: 85,
        risk_level: 'low',
        model_used: 'heuristic_triage'
      });
    }
  }
  
  return decisions;
}

/**
 * Check if an IP has already been actioned recently (avoid duplicate blocks)
 */
async function isAlreadyActioned(ip) {
  const recentWindow = new Date(Date.now() - 60 * 60 * 1000).toISOString(); // Last 1h
  const { data } = await supabase.from('ai_decisions')
    .select('id')
    .eq('ip', ip)
    .in('status', ['executed', 'pending'])
    .gte('created_at', recentWindow)
    .limit(1);
  return data && data.length > 0;
}

/**
 * Main triage processing function — called by the cron job
 */
async function processLogs() {
  const startTime = Date.now();
  console.log(`[AI TRIAGE] 🔍 Starting log triage at ${new Date().toISOString()}`);
  console.log(`[AI TRIAGE] Processing logs since: ${lastProcessedAt}`);
  
  try {
    // Step 1: Fetch recent logs
    const logs = await fetchRecentLogs(100);
    const totalLogs = logs.securityEvents.length + logs.ddosEvents.length + logs.failedLogins.length;
    
    if (totalLogs === 0) {
      console.log('[AI TRIAGE] No new logs to process. All clear.');
      lastProcessedAt = new Date().toISOString();
      return { processed: 0, decisions: 0, actions: 0 };
    }
    
    console.log(`[AI TRIAGE] Found ${totalLogs} logs (${logs.securityEvents.length} security, ${logs.ddosEvents.length} DDoS, ${logs.failedLogins.length} failed logins)`);
    
    // Step 2: Group by IP
    const ipGroups = groupEventsByIp(logs);
    console.log(`[AI TRIAGE] Grouped into ${ipGroups.length} unique IP sources`);
    
    // Step 3: Triage each group
    let totalDecisions = 0;
    let totalActions = 0;
    
    for (const group of ipGroups) {
      // Skip if already actioned
      if (await isAlreadyActioned(group.ip)) {
        console.log(`[AI TRIAGE] Skipping ${group.ip} — already actioned recently`);
        continue;
      }
      
      const decisions = heuristicTriage(group);
      
      for (const decision of decisions) {
        try {
          const result = await executeAiAction(decision);
          totalDecisions++;
          if (result && result.status === 'executed') {
            totalActions++;
            // Federation hook: propagate high confidence automated actions
            if (decision.confidence_score >= 80 && decision.risk_level === 'low') {
               await propagateThreat({
                 ip: decision.ip,
                 attack_type: 'automated_triage',
                 reasoning: decision.reasoning,
                 confidence_score: decision.confidence_score
               }, decision.website_id);
            }
          }
          console.log(`[AI TRIAGE] Decision: ${decision.decision_type} on ${decision.ip} → ${result?.status} (confidence: ${decision.confidence_score}%)`);
        } catch (err) {
          console.error(`[AI TRIAGE] Failed to execute decision for ${decision.ip}:`, err.message);
        }
      }
    }
    
    lastProcessedAt = new Date().toISOString();
    console.log(`[AI TRIAGE] ✅ Finished in ${Date.now() - startTime}ms. Created ${totalDecisions} decisions (${totalActions} executed).`);
    
    return { processed: totalLogs, decisions: totalDecisions, actions: totalActions };
    
  } catch (error) {
    console.error('[AI TRIAGE] Critical error during log processing:', error);
    return { error: error.message };
  }
}

module.exports = {
  processLogs
};
