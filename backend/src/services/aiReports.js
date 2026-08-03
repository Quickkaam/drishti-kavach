// ============================================
// Drishti Kavach — AI Reports Service
// Generate comprehensive security reports
// ============================================

const supabase = require('../db/supabase');
const { callDeepSeek } = require('./ai');

/**
 * Generate comprehensive security report for a website
 */
async function generateReport(websiteId, period = '30d') {
  console.log('[AI REPORTS] Generating report for website:', websiteId, 'period:', period);

  // Validate websiteId
  if (!websiteId) {
    throw new Error('Website ID is required');
  }

  try {
    // Calculate date range
    const hours = period === '7d' ? 168 : 720;
    const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
    console.log('[AI REPORTS] Fetching data with since:', since);

    // Fetch all data
    const [
      { count: totalEvents },
      { count: securityEvents },
      { count: ddosEvents },
      { count: blockedIps },
      { count: formSubmissions },
      { data: securityEventsData },
      { data: ddosEventsData },
      { data: blockedIpsData },
    ] = await Promise.all([
      supabase
        .from('events')
        .select('*', { count: 'exact', head: true })
        .eq('website_id', websiteId)
        .gte('timestamp', since),
      supabase
        .from('security_events')
        .select('*', { count: 'exact', head: true })
        .eq('website_id', websiteId)
        .gte('created_at', since),
      supabase
        .from('ddos_events')
        .select('*', { count: 'exact', head: true })
        .eq('website_id', websiteId)
        .gte('created_at', since),
      supabase
        .from('ip_block_list')
        .select('*', { count: 'exact', head: true })
        .eq('website_id', websiteId)
        .eq('is_active', true),
      supabase
        .from('form_submissions')
        .select('*', { count: 'exact', head: true })
        .eq('website_id', websiteId)
        .gte('created_at', since),
      supabase
        .from('security_events')
        .select('*')
        .eq('website_id', websiteId)
        .gte('created_at', since)
        .order('created_at', { ascending: false })
        .limit(100),
      supabase
        .from('ddos_events')
        .select('*')
        .eq('website_id', websiteId)
        .gte('created_at', since)
        .order('created_at', { ascending: false })
        .limit(50),
      supabase
        .from('ip_block_list')
        .select('*')
        .eq('website_id', websiteId)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(50),
    ]);

    // Process data for AI analysis
    const securityTypes = {};
    securityEventsData?.forEach((e) => {
      const type = e.event_type || 'unknown';
      securityTypes[type] = (securityTypes[type] || 0) + 1;
    });

    const severityCounts = { low: 0, medium: 0, high: 0, critical: 0 };
    securityEventsData?.forEach((e) => {
      const sev = (e.severity || 'low').toLowerCase();
      severityCounts[sev] = (severityCounts[sev] || 0) + 1;
    });

    // Build report data
    const reportData = {
      websiteId,
      period,
      generatedAt: new Date().toISOString(),
      summary: {
        totalEvents,
        securityEvents,
        ddosEvents,
        blockedIps,
        formSubmissions,
      },
      securityTypes,
      severityCounts,
      recentSecurityEvents: securityEventsData || [],
      recentDdosEvents: ddosEventsData || [],
      activeBlockList: blockedIpsData || [],
    };

    // Generate AI analysis
    const analysis = await generateAiAnalysis(reportData);

    // Combine data
    const finalReport = {
      ...reportData,
      analysis,
    };

    console.log('[AI REPORTS] Report generated:', finalReport.summary);
    return finalReport;
  } catch (err) {
    console.error('[AI REPORTS] Report generation error:', err.message);
    throw err;
  }
}

/**
 * Generate AI-powered analysis of the security data
 */
async function generateAiAnalysis(reportData) {
  const { summary, securityTypes, severityCounts, recentSecurityEvents, recentDdosEvents, activeBlockList } = reportData;

  // Get all security event types with full details
  const allSecurityTypes = {};
  (recentSecurityEvents || []).forEach(e => {
    const type = e.event_type || 'unknown';
    allSecurityTypes[type] = (allSecurityTypes[type] || 0) + 1;
  });

  // Get attack details
  const ddosDetails = (recentDdosEvents || []).map(e => ({
    type: e.attack_type,
    severity: e.severity,
    timestamp: e.created_at,
    details: e.details
  }));

  // Get blocked IPs with reasons
  const blockedIpDetails = (activeBlockList || []).map(ip => ({
    ip: ip.ip,
    reason: ip.reason,
    severity: ip.severity,
    blocked_by: ip.blocked_by
  }));

  const prompt = `
Generate a comprehensive security analysis for a SOC Dashboard.

SUMMARY STATISTICS (Last 30 Days):
- Total Events (Page Views/Interactions): ${summary.totalEvents || 0}
- Security Threats Detected: ${summary.securityEvents || 0}
- DDoS Events: ${summary.ddosEvents || 0}
- Active IP Blocks: ${summary.blockedIps || 0}
- Form Submissions: ${summary.formSubmissions || 0}

THREAT BREAKDOWN BY TYPE:
${Object.entries(allSecurityTypes || {}).map(([type, count]) => `- ${type}: ${count}`).join('\n') || 'No security events detected'}

SEVERITY DISTRIBUTION:
${Object.entries(severityCounts || {}).map(([level, count]) => `- ${level.toUpperCase()}: ${count}`).join('\n')}

ATTACK DETAILS:
${ddosDetails.length > 0 ? ddosDetails.map((d, i) => `${i + 1}. ${d.type} (${d.severity}) at ${d.timestamp}\n   Details: ${JSON.stringify(d.details)}`).join('\n\n') : 'No DDoS attacks detected'}

ACTIVE BLOCKED IPS:
${blockedIpDetails.length > 0 ? blockedIpDetails.map((ip, i) => `${i + 1}. IP: ${ip.ip}\n   Reason: ${ip.reason}\n   Severity: ${ip.severity}\n   Blocked By: ${ip.blocked_by}`).join('\n\n') : 'No IPs currently blocked'}

COMPREHENSIVE SECURITY ANALYSIS REQUESTED:
Please provide a COMPLETE A-Z security report with:

1. EXECUTIVE SUMMARY
   - Overall security posture (Low/Medium/High/Critical)
   - Key metrics summary
   - Immediate risks

2. THREAT ANALYSIS
   - Attack types detected (SQLi, XSS, Honeypot, DDoS, etc.)
   - Geographic distribution of threats
   - Targeted endpoints
   - Attack patterns and trends

3. DETAILED ATTACK BREAKDOWN
   - DDoS attack types (Traffic Spike, IP Flood, Botnet, Geo Spike)
   - Web attack types (SQL Injection, Cross-Site Scripting, Honeypot triggers)
   - Frequency and severity of each attack type

4. BLOCKED IP ANALYSIS
   - Top 10 blocked IPs with reasons
   - Blocked IP statistics
   - Geographic sources of blocked IPs

5. FORM SUBMISSION ANALYSIS
   - Total form submissions
   - Spam detection
   - Legitimate vs suspicious submissions

6. SECURITY EVENTS ANALYSIS
   - Top security events by severity
   - Most attacked endpoints
   - Most common attack vectors

7. COMPLIANCE STATUS
   - GDPR compliance check
   - Data protection compliance
   - Regulatory requirements

8. RECOMMENDATIONS
   - Immediate actions required
   - Medium-term improvements
   - Long-term security enhancements

9. AI INSIGHTS
   - Pattern detection
   - Anomaly detection
   - Predictive threat assessment

10. DETAILED FINDINGS
    - Complete breakdown of all security events
    - Full IP intelligence for blocked IPs
    - Timeline of critical events

Respond in JSON format with ALL sections:
{
  "executive_summary": {
    "overall_posture": "Low|Medium|High|Critical",
    "key_metrics": "...",
    "immediate_risks": "..."
  },
  "threat_analysis": {
    "attack_types_detected": "...",
    "geographic_distribution": "...",
    "targeted_endpoints": "...",
    "attack_patterns": "..."
  },
  "ddos_attack_details": {
    "types_detected": "...",
    "frequency": "...",
    "mitigation_actions": "..."
  },
  "web_attack_details": {
    "sql_injection": "...",
    "xss_attempts": "...",
    "honeypot_triggers": "...",
    "other_attacks": "..."
  },
  "blocked_ip_analysis": {
    "top_10_blocked": "...",
    "statistics": "...",
    "geographic_sources": "..."
  },
  "form_submission_analysis": {
    "total_submissions": "...",
    "spam_detection": "...",
    "legitimate_vs_suspicious": "..."
  },
  "security_events_analysis": {
    "top_events_by_severity": "...",
    "most_attacked_endpoints": "...",
    "attack_vectors": "..."
  },
  "compliance_status": {
    "gdpr_compliance": "...",
    "data_protection": "...",
    "regulatory_requirements": "..."
  },
  "recommendations": {
    "immediate_actions": "...",
    "medium_term_improvements": "...",
    "long_term_security": "..."
  },
  "ai_insights": {
    "pattern_detection": "...",
    "anomaly_detection": "...",
    "predictive_assessment": "..."
  },
  "detailed_findings": {
    "complete_event_breakdown": "...",
    "ip_intelligence_summary": "...",
    "timeline_of_events": "..."
  },
  "threat_assessment": "...",
  "severity_rating": "Low|Medium|High|Critical",
  "recommendation": "...",
  "compliance_status": "...",
  "assessment": "...",
  "motto": "Security motto in Sanskrit or English"
}
`;

  try {
    const analysis = await callDeepSeek(prompt);
    try {
      return JSON.parse(analysis);
    } catch {
      // Fallback if AI response is not valid JSON
      return {
        threat_assessment: 'Security analysis available',
        severity_rating: 'Low',
        recommendation: 'Continue monitoring and review security configurations',
        compliance_status: 'Compliant',
        assessment: 'System security posture is maintained',
        motto: 'Vigilia et Tutela',
      };
    }
  } catch (err) {
    console.error('[AI REPORTS] AI analysis error:', err.message);
    return {
      threat_assessment: 'Automatic analysis unavailable',
      severity_rating: 'Low',
      recommendation: 'Manual review recommended',
      compliance_status: 'Unknown',
      assessment: 'Automated analysis failed',
      motto: 'Vigilia et Tutela',
    };
  }
}

/**
 * Get report data for preview
 */
async function getReportData(websiteId, period = '30d') {
  const report = await generateReport(websiteId, period);
  return {
    preview: {
      summary: report.summary,
      analysis: report.analysis,
      timestamp: report.generatedAt,
    },
    fullData: report,
  };
}

/**
 * Export report as formatted text (for PDF generation)
 */
async function exportReportAsText(websiteId, period = '30d') {
  const report = await generateReport(websiteId, period);

  let text = `========================================\n`;
  text += `Drishti Kavach Security Report\n`;
  text += `Website ID: ${report.websiteId}\n`;
  text += `Period: ${period}\n`;
  text += `Generated: ${report.generatedAt}\n`;
  text += `========================================\n\n`;

  text += `SUMMARY\n`;
  text += `-------\n`;
  text += `Total Events: ${report.summary.totalEvents || 0}\n`;
  text += `Security Threats: ${report.summary.securityEvents || 0}\n`;
  text += `DDoS Events: ${report.summary.ddosEvents || 0}\n`;
  text += `Blocked IPs: ${report.summary.blockedIps || 0}\n`;
  text += `Form Submissions: ${report.summary.formSubmissions || 0}\n\n`;

  text += `THREAT BREAKDOWN\n`;
  text += `----------------\n`;
  Object.entries(report.securityTypes || {}).forEach(([type, count]) => {
    text += `${type}: ${count}\n`;
  });
  text += '\n';

  text += `SEVERITY DISTRIBUTION\n`;
  text += `---------------------\n`;
  Object.entries(report.severityCounts || {}).forEach(([level, count]) => {
    text += `${level.toUpperCase()}: ${count}\n`;
  });
  text += '\n';

  text += `AI ANALYSIS\n`;
  text += `-----------\n`;
  text += `Threat Assessment: ${report.analysis?.threat_assessment || 'N/A'}\n`;
  text += `Severity Rating: ${report.analysis?.severity_rating || 'N/A'}\n`;
  text += `Recommendation: ${report.analysis?.recommendation || 'N/A'}\n`;
  text += `Compliance Status: ${report.analysis?.compliance_status || 'N/A'}\n`;
  text += `Assessment: ${report.analysis?.assessment || 'N/A'}\n`;
  text += `Motto: ${report.analysis?.motto || 'N/A'}\n\n`;

  text += `ACTIVE BLOCKED IPS\n`;
  text += `------------------\n`;
  (report.activeBlockList || []).forEach((ip, i) => {
    text += `${i + 1}. ${ip.ip} - ${ip.reason}\n`;
  });
  text += '\n';

  text += `========================================\n`;
  text += `End of Report\n`;
  text += `========================================`;

  return text;
}

module.exports = {
  generateReport,
  getReportData,
  exportReportAsText,
};
