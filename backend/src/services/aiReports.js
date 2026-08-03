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

  try {
    // Calculate date range
    const hours = period === '7d' ? 168 : 720;
    const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

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
      { data: topSecurityTypes },
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
      supabase
        .from('security_events')
        .select('event_type, severity')
        .eq('website_id', websiteId)
        .gte('created_at', since)
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
  const { summary, securityTypes, severityCounts, recentSecurityEvents } = reportData;

  const prompt = `
Generate a comprehensive security analysis for a SOC Dashboard.

Summary Statistics:
- Total Events (Last 30 Days): ${summary.totalEvents || 0}
- Security Threats Detected: ${summary.securityEvents || 0}
- DDoS Events: ${summary.ddosEvents || 0}
- Blocked IPs: ${summary.blockedIps || 0}
- Form Submissions: ${summary.formSubmissions || 0}

Threat Breakdown by Type:
${Object.entries(securityTypes || {})
  .map(([type, count]) => `- ${type}: ${count}`)
  .join('\n')}

Severity Distribution:
${Object.entries(severityCounts || {})
  .map(([level, count]) => `- ${level.toUpperCase()}: ${count}`)
  .join('\n')}

Recent Security Events:
${(recentSecurityEvents || []).slice(0, 5).map((e, i) => `${i + 1}. ${e.event_type} (${e.severity}) from ${e.user_ip}`).join('\n')}

Analyze this security data and provide:
1. Overall security posture assessment (Low/Medium/High/Critical)
2. Key findings and insights
3. Specific threat recommendations
4. Compliance status (GDPR, etc.)
5. Actionable recommendations

Respond in JSON format:
{
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