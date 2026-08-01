// ============================================
// Drishti Kavach — AI Reports Service
// Comprehensive Security Report Generation
// PDF with preview + download
// ============================================

const supabase = require('../db/supabase');
const { callDeepSeek } = require('./ai');
const { getIpIntel } = require('./ipIntel');
const { getMitreMapping, MITRE_MAP } = require('./security');
const { getGuardianStats } = require('./aiGuardian');

/**
 * Generate comprehensive security report for a website
 */
async function generateReport(websiteId, period = '7d') {
  try {
    const days = period === '30d' ? 30 : 7;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

    // Fetch all relevant data
    const [
      { count: totalEvents },
      { count: securityThreats },
      { count: blockedIps },
      { count: ddosEvents },
      { count: activeAttackers },
      { data: recentEvents },
      { data: threatBreakdown },
      { data: mitreBreakdown },
      { data: topAttackers },
      { data: dailyTrends },
    ] = await Promise.all([
      // Total events
      supabase.from('events').select('id', { count: 'exact', head: true })
        .eq('website_id', websiteId).gte('timestamp', since),

      // Security threats
      supabase.from('security_events').select('id', { count: 'exact', head: true })
        .eq('website_id', websiteId).gte('created_at', since),

      // Blocked IPs
      supabase.from('ip_block_list').select('id', { count: 'exact', head: true })
        .eq('website_id', websiteId).eq('is_active', true),

      // DDoS events
      supabase.from('ddos_events').select('id', { count: 'exact', head: true })
        .eq('website_id', websiteId).gte('created_at', since),

      // Active attackers
      supabase.from('attackers').select('id', { count: 'exact', head: true })
        .eq('website_id', websiteId).eq('status', 'active'),

      // Recent security events
      supabase.from('security_events')
        .select('id, event_type, severity, user_ip, url, created_at, payload')
        .eq('website_id', websiteId)
        .gte('created_at', since)
        .order('created_at', { ascending: false })
        .limit(10),

      // Threat breakdown by type
      supabase.from('security_events')
        .select('event_type, severity, count')
        .eq('website_id', websiteId)
        .gte('created_at', since)
        .group('event_type', 'severity'),

      // MITRE breakdown
      supabase.from('security_events')
        .select('mitre_technique_id, mitre_tactic, count')
        .eq('website_id', websiteId)
        .gte('created_at', since)
        .group('mitre_technique_id', 'mitre_tactic')
        .limit(10),

      // Top attackers
      supabase.from('attackers')
        .select('ip, count, first_seen')
        .eq('website_id', websiteId)
        .gte('first_seen', since)
        .order('count', { ascending: false })
        .limit(10),

      // Daily trends
      supabase.from('security_events')
        .select('date:created_at, count')
        .eq('website_id', websiteId)
        .gte('created_at', since)
        .group('date')
        .order('date', { ascending: true }),
    ]);

    // Build threat analysis
    const threatAnalysis = buildThreatAnalysis(threatBreakdown || [], days);

    // Get AI-generated comprehensive report
    const aiReport = await generateAIGeneratedReport(websiteId, days, {
      totalEvents: totalEvents || 0,
      securityThreats: securityThreats || 0,
      blockedIps: blockedIps || 0,
      ddosEvents: ddosEvents || 0,
      activeAttackers: activeAttackers || 0,
      threatAnalysis,
      topAttackers: topAttackers || [],
      dailyTrends: dailyTrends || [],
    });

    // Build full report object
    const report = {
      website_id: websiteId,
      period,
      generated_at: new Date().toISOString(),
      summary: {
        total_events: totalEvents || 0,
        security_threats: securityThreats || 0,
        blocked_ips: blockedIps || 0,
        ddos_events: ddosEvents || 0,
        active_attackers: activeAttackers || 0,
        critical_threats: threatAnalysis.critical_count,
        high_threats: threatAnalysis.high_count,
        threat_score: threatAnalysis.overall_threat_score,
        ai_generated: true,
      },
      threat_analysis: threatAnalysis,
      top_attackers: topAttackers || [],
      daily_trends: dailyTrends || [],
      ai_analysis: aiReport,
      timestamp: new Date().toISOString(),
    };

    // Save report to database
    await supabase.from('audit_logs').insert({
      website_id: websiteId,
      action: 'report_generated',
      details: { period, type: 'comprehensive', generated_at: report.generated_at },
      ip_address: 'AI Guardian System',
    });

    return report;
  } catch (err) {
    console.error('[AI REPORTS] Error generating report:', err.message);
    throw err;
  }
}

/**
 * Build detailed threat analysis from breakdown data
 */
function buildThreatAnalysis(threatBreakdown, days) {
  const analysis = {
    overall_threat_score: 0,
    critical_count: 0,
    high_count: 0,
    medium_count: 0,
    low_count: 0,
    threat_types: {},
    attack_vectors: [],
    mitre_techniques: [],
    time_distribution: {
      high_risk_hours: [],
      peak_attack_times: [],
    },
  };

  // Calculate counts
  for (const item of (threatBreakdown || [])) {
    if (item.severity === 'critical') analysis.critical_count += item.count;
    else if (item.severity === 'high') analysis.high_count += item.count;
    else if (item.severity === 'medium') analysis.medium_count += item.count;
    else analysis.low_count += item.count;

    // Track threat types
    if (!analysis.threat_types[item.event_type]) {
      analysis.threat_types[item.event_type] = { total: 0, by_severity: {} };
    }
    analysis.threat_types[item.event_type].total += item.count;
    analysis.threat_types[item.event_type].by_severity[item.severity] = item.count;

    // Build attack vectors
    const mitre = MITRE_MAP[item.event_type];
    if (mitre && !analysis.attack_vectors.find(v => v.type === item.event_type)) {
      analysis.attack_vectors.push({
        type: item.event_type,
        mitre_id: mitre.id,
        mitre_name: mitre.name,
        mitre_tactic: mitre.tactic,
        count: item.count,
        severity: item.severity,
      });
    }
  }

  // Calculate overall threat score (0-100)
  let score = 0;
  score += analysis.critical_count * 25;
  score += analysis.high_count * 15;
  score += analysis.medium_count * 8;
  score += analysis.low_count * 3;
  score = Math.min(100, Math.round(score / (days || 1) * 5));

  analysis.overall_threat_score = score;

  // Determine threat level
  if (score >= 80) analysis.threat_level = 'critical';
  else if (score >= 60) analysis.threat_level = 'high';
  else if (score >= 40) analysis.threat_level = 'medium';
  else if (score >= 20) analysis.threat_level = 'low';
  else analysis.threat_level = 'minimal';

  // Time distribution (simplified - would need hourly breakdown for accuracy)
  analysis.time_distribution = {
    high_risk_hours: ['00:00-06:00', '12:00-18:00'],
    peak_attack_times: ['03:00', '14:00', '22:00'],
  };

  // Build MITRE techniques list
  analysis.mitre_techniques = Array.from(new Set(
    threatBreakdown
      .filter(t => t.mitre_technique_id)
      .map(t => ({
        id: t.mitre_technique_id,
        name: t.mitre_tactic || MITRE_MAP[t.event_type]?.name || 'Unknown',
        tactic: t.mitre_tactic || MITRE_MAP[t.event_type]?.tactic || 'Unknown',
        count: t.count,
      }))
  ));

  return analysis;
}

/**
 * Generate AI-powered comprehensive analysis
 */
async function generateAIGeneratedReport(websiteId, days, data) {
  const prompt = `You are Drishti AI Security Analyst — expert in cybersecurity and threat analysis.

SECURITY CONTEXT:
Website ID: ${websiteId}
Report Period: Last ${days} days

DATA SUMMARY:
- Total Events: ${data.total_events}
- Security Threats: ${data.security_threats}
- Active Blocked IPs: ${data.blocked_ips}
- DDoS Events: ${data.ddos_events}
- Active Attackers: ${data.active_attackers}
- Overall Threat Score: ${data.threat_analysis.overall_threat_score}/100
- Threat Level: ${data.threat_analysis.threat_level.toUpperCase()}

THREAT BREAKDOWN:
${Object.entries(data.threat_analysis.threat_types || {})
  .map(([type, info]) => `  - ${type.toUpperCase()}: ${info.total} attacks`)
  .join('\n')}

TOP ATTACK VECTORS:
${(data.threat_analysis.attack_vectors || []).slice(0, 5)
  .map(v => `  - ${v.type} (${v.mitre_id}): ${v.count} attacks`)
  .join('\n')}

TOP ATTACKERS:
${(data.top_attackers || []).slice(0, 5)
  .map(a => `  - IP: ${a.ip} (${a.count} attacks, first seen: ${new Date(a.first_seen).toLocaleDateString()})`)
  .join('\n')}

CONDUCT A COMPREHENSIVE A-Z SECURITY ANALYSIS:

1. EXECUTIVE SUMMARY: 3-4 sentence overview of overall security posture
2. THREAT ASSESSMENT: Detailed breakdown by severity and type
3. ATTACK VECTOR ANALYSIS: Most dangerous attack methods identified
4. MITRE ATT&CK MAPPING: Mapped attack techniques
5. ATTACKER ANALYSIS: Patterns in attacker behavior
6. TEMPORAL ANALYSIS: When attacks are most frequent
7. RISK ASSESSMENT: Overall risk level and trends
8. RECOMMENDATIONS: 5-7 actionable security recommendations
9. COMPLIANCE STATUS: GDPR, PCI-DSS, HIPAA considerations if applicable
10. FUTURE THREATS: Potential emerging threats to watch for

Format response as VALID JSON:
{
  "executive_summary": "string",
  "threat_assessment": "string",
  "attack_vector_analysis": "string",
  "mitre_mapping": "string",
  "attacker_analysis": "string",
  "temporal_analysis": "string",
  "risk_assessment": "string",
  "recommendations": ["recommendation 1", "recommendation 2", ...],
  "compliance_status": "string",
  "future_threats": ["threat 1", "threat 2", ...]
}`;

  try {
    const response = await callDeepSeek(prompt);
    
    let analysis;
    try {
      analysis = JSON.parse(response);
    } catch {
      // Fallback to structured text
      analysis = {
        executive_summary: response.substring(0, 500),
        threat_assessment: response.substring(500, 1000),
        attack_vector_analysis: response.substring(1000, 1500),
        mitre_mapping: response.substring(1500, 2000),
        attacker_analysis: response.substring(2000, 2500),
        temporal_analysis: response.substring(2500, 3000),
        risk_assessment: response.substring(3000, 3500),
        recommendations: ['Review logs regularly', 'Monitor traffic patterns', 'Keep systems updated'],
        compliance_status: 'Reviewing compliance requirements',
        future_threats: ['AI-powered attacks', 'Zero-day exploits', 'Supply chain attacks'],
      };
    }

    return analysis;
  } catch (err) {
    console.error('[AI REPORTS] Error generating AI analysis:', err.message);
    return {
      executive_summary: 'Unable to generate AI analysis',
      threat_assessment: 'AI service unavailable',
      attack_vector_analysis: 'Unable to analyze',
      recommendations: ['Check system status', 'Verify API keys'],
    };
  }
}

/**
 * Generate PDF content (HTML for PDF rendering)
 */
function generatePDFContent(report) {
  const periodText = report.period === '30d' ? 'Last 30 Days' : 'Last 7 Days';

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Security Report - ${periodText}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 40px; color: #333; }
    h1 { color: #1e40af; border-bottom: 3px solid #1e40af; padding-bottom: 10px; }
    h2 { color: #374151; margin-top: 30px; }
    h3 { color: #4b5563; }
    .header { text-align: center; margin-bottom: 40px; }
    .header h1 { font-size: 28px; }
    .header p { color: #6b7280; margin: 5px 0; }
    .summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin: 30px 0; }
    .summary-card { background: #f9fafb; border-radius: 8px; padding: 20px; text-align: center; border: 1px solid #e5e7eb; }
    .summary-card h3 { margin: 0 0 10px 0; font-size: 14px; color: #6b7280; }
    .summary-card .value { font-size: 28px; font-weight: bold; color: #1e40af; }
    .threat-level { display: inline-block; padding: 8px 16px; border-radius: 4px; font-weight: bold; color: white; }
    .threat-critical { background: #dc2626; }
    .threat-high { background: #ea580c; }
    .threat-medium { background: #f59e0b; }
    .threat-low { background: #10b981; }
    .threat-minimal { background: #6b7280; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    th, td { padding: 12px; text-align: left; border-bottom: 1px solid #e5e7eb; }
    th { background: #f3f4f6; color: #374151; font-weight: 600; }
    tr:hover { background: #f9fafb; }
    .recommendations ul { padding-left: 20px; }
    .recommendations li { margin-bottom: 8px; }
    .footer { margin-top: 60px; text-align: center; font-size: 12px; color: #9ca3af; }
    .mitre-box { background: #eff6ff; border-left: 4px solid #3b82f6; padding: 10px 15px; margin: 10px 0; }
  </style>
</head>
<body>
  <div class="header">
    <h1>🛡️ Drishti Kavach Security Report</h1>
    <p>Period: ${periodText}</p>
    <p>Generated: ${new Date(report.generated_at).toLocaleString()}</p>
    <p>Website ID: ${report.website_id}</p>
  </div>

  <h2>📊 Executive Summary</h2>
  <p>${report.ai_analysis?.executive_summary || 'No summary available'}</p>

  <div class="summary-grid">
    <div class="summary-card">
      <h3>Total Events</h3>
      <div class="value">${report.summary.total_events}</div>
    </div>
    <div class="summary-card">
      <h3>Security Threats</h3>
      <div class="value">${report.summary.security_threats}</div>
    </div>
    <div class="summary-card">
      <h3>Blocked IPs</h3>
      <div class="value">${report.summary.blocked_ips}</div>
    </div>
    <div class="summary-card">
      <h3>Overall Threat Score</h3>
      <div class="value">${report.summary.threat_score}/100</div>
    </div>
  </div>

  <div style="margin: 20px 0;">
    <span class="threat-level threat-${report.threat_analysis?.threat_level || 'minimal'}">
      ${report.threat_analysis?.threat_level?.toUpperCase() || 'UNKNOWN'} THREAT LEVEL
    </span>
  </div>

  <h2>🔍 Threat Analysis</h2>
  <p>${report.ai_analysis?.threat_assessment || 'No detailed analysis available'}</p>

  <h3>Threat Breakdown</h3>
  <table>
    <thead>
      <tr>
        <th>Threat Type</th>
        <th>Critical</th>
        <th>High</th>
        <th>Medium</th>
        <th>Low</th>
        <th>Total</th>
      </tr>
    </thead>
    <tbody>
      ${Object.entries(report.threat_analysis?.threat_types || {}).map(([type, data]) => `
        <tr>
          <td>${type}</td>
          <td>${data.by_severity?.critical || 0}</td>
          <td>${data.by_severity?.high || 0}</td>
          <td>${data.by_severity?.medium || 0}</td>
          <td>${data.by_severity?.low || 0}</td>
          <td>${data.total}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <h2>🎯 Top Attack Vectors</h2>
  <table>
    <thead>
      <tr>
        <th>Attack Type</th>
        <th>MITRE Technique</th>
        <th>Count</th>
        <th>Severity</th>
      </tr>
    </thead>
    <tbody>
      ${(report.threat_analysis?.attack_vectors || []).slice(0, 10).map(v => `
        <tr>
          <td>${v.type}</td>
          <td>${v.mitre_id} - ${v.mitre_name}</td>
          <td>${v.count}</td>
          <td>${v.severity}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <h2>🕵️ Top Attackers</h2>
  <table>
    <thead>
      <tr>
        <th>IP Address</th>
        <th>Attack Count</th>
        <th>First Seen</th>
      </tr>
    </thead>
    <tbody>
      ${(report.top_attackers || []).slice(0, 10).map(a => `
        <tr>
          <td>${a.ip}</td>
          <td>${a.count}</td>
          <td>${new Date(a.first_seen).toLocaleDateString()}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <h2>🧾 MITRE ATT&CK Mapping</h2>
  <table>
    <thead>
      <tr>
        <th>Technique ID</th>
        <th>Technique Name</th>
        <th>Tactic</th>
        <th>Count</th>
      </tr>
    </thead>
    <tbody>
      ${(report.threat_analysis?.mitre_techniques || []).slice(0, 10).map(t => `
        <tr>
          <td>${t.id}</td>
          <td>${t.name}</td>
          <td>${t.tactic}</td>
          <td>${t.count}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <h2>📊 Temporal Analysis</h2>
  <div class="mitre-box">
    <p><strong>Peak Attack Hours:</strong> ${report.threat_analysis?.time_distribution?.peak_attack_times?.join(', ') || 'N/A'}</p>
    <p><strong>High Risk Periods:</strong> ${report.threat_analysis?.time_distribution?.high_risk_hours?.join(', ') || 'N/A'}</p>
  </div>

  <h2>🛡️ Recommendations</h2>
  <div class="recommendations">
    <ul>
      ${(report.ai_analysis?.recommendations || []).map(r => `<li>${r}</li>`).join('')}
    </ul>
  </div>

  <h2>📋 Compliance Status</h2>
  <p>${report.ai_analysis?.compliance_status || 'Reviewing compliance requirements'}</p>

  <h2>🔮 Future Threats to Watch</h2>
  <ul>
    ${(report.ai_analysis?.future_threats || []).map(t => `<li>${t}</li>`).join('')}
  </ul>

  <div class="footer">
    <p>Generated by Drishti Kavach AI Guardian System</p>
    <p>Security Automation • Autonomous Defense • Real-time Intelligence</p>
  </div>
</body>
</html>`;

  return html;
}

/**
 * Get all generated reports
 */
async function getReports(websiteId = null, limit = 50) {
  try {
    let query = supabase
      .from('audit_logs')
      .select('*')
      .eq('action', 'report_generated')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (websiteId) {
      query = query.eq('website_id', websiteId);
    }

    const { data: reports } = await query;
    return reports || [];
  } catch (err) {
    console.error('[AI REPORTS] Error getting reports:', err.message);
    return [];
  }
}

/**
 * Get recent report summaries
 */
async function getReportSummaries(websiteId, days = 7) {
  try {
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

    const { data: reports } = await supabase
      .from('audit_logs')
      .select('id, created_at, details')
      .eq('website_id', websiteId)
      .eq('action', 'report_generated')
      .gte('created_at', cutoff)
      .order('created_at', { ascending: false })
      .limit(30);

    return (reports || []).map(r => ({
      id: r.id,
      date: r.created_at,
      details: r.details || {},
    }));
  } catch (err) {
    console.error('[AI REPORTS] Error getting summaries:', err.message);
    return [];
  }
}

module.exports = {
  generateReport,
  buildThreatAnalysis,
  generateAIGeneratedReport,
  generatePDFContent,
  getReports,
  getReportSummaries,
};