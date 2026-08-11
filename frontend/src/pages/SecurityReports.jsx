// ============================================
// Drishti Kavach — Security Reports Page
// AI-Generated Security Intelligence Reports
// ============================================

import React, { useState, useEffect } from 'react';
import api from '../api/client';
import logo from '/drishti-ai-logo.png';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

const PERIODS = [
  { value: '7d', label: 'Last 7 Days' },
  { value: '30d', label: 'Last 30 Days' },
];

// Helper function to format numbers
const formatNumber = (num) => {
  if (!num && num !== 0) return '0';
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return String(num);
};

// Component to render threat breakdown chart
const ThreatChart = ({ securityTypes }) => {
  const maxCount = Math.max(...Object.values(securityTypes || {}), 1);

  return (
    <div className="space-y-2">
      <h3 className="text-lg font-semibold text-white mb-3">Threat Breakdown</h3>
      {Object.entries(securityTypes || {}).length === 0 ? (
        <p className="text-slate-500 text-sm">No threat data available</p>
      ) : (
        Object.entries(securityTypes).map(([type, count]) => (
          <div key={type} className="flex items-center gap-3">
            <span className="text-xs font-medium text-slate-400 w-32 truncate">{type}</span>
            <div className="flex-1 bg-slate-800 rounded-full h-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-blue-500 to-blue-600 h-full rounded-full"
                style={{ width: `${(count / maxCount) * 100}%` }}
              />
            </div>
            <span className="text-xs font-bold text-yellow-400 w-12 text-right">{count}</span>
          </div>
        ))
      )}
    </div>
  );
};

// Component to render severity distribution
const SeverityDistribution = ({ severityCounts }) => {
  const total = Object.values(severityCounts || {}).reduce((a, b) => a + b, 0);

  const getSeverityColor = (level) => {
    switch (level.toLowerCase()) {
      case 'critical': return 'bg-red-500/20 border-red-500/30 text-red-400';
      case 'high': return 'bg-orange-500/20 border-orange-500/30 text-orange-400';
      case 'medium': return 'bg-yellow-500/20 border-yellow-500/30 text-yellow-400';
      default: return 'bg-green-500/20 border-green-500/30 text-green-400';
    }
  };

  return (
    <div className="grid grid-cols-4 gap-3">
      {['critical', 'high', 'medium', 'low'].map((level) => (
        <div
          key={level}
          className={`p-3 rounded-lg border ${getSeverityColor(level)} flex flex-col items-center`}
        >
          <span className="text-sm font-bold capitalize">{level}</span>
          <span className="text-lg font-semibold">{formatNumber(severityCounts?.[level] || 0)}</span>
          {total > 0 && (
            <span className="text-xs opacity-75">
              {Math.round((severityCounts?.[level] || 0) / total * 100)}%
            </span>
          )}
        </div>
      ))}
    </div>
  );
};

// Component to render active blocked IPs
const BlockedIPs = ({ blockList }) => {
  return (
    <div className="space-y-2">
      <h3 className="text-lg font-semibold text-white mb-3">Active Blocked IPs ({blockList?.length || 0})</h3>
      {!blockList?.length ? (
        <p className="text-slate-500 text-sm">No IPs currently blocked</p>
      ) : (
        blockList.slice(0, 10).map((ip, i) => (
          <div key={i} className="flex justify-between items-center p-2 bg-slate-800/50 rounded text-sm">
            <span className="font-mono text-red-400">{ip.ip}</span>
            <span className="text-slate-400 truncate max-w-xs">{ip.reason || 'No reason'}</span>
          </div>
        ))
      )}
      {blockList?.length > 10 && (
        <p className="text-xs text-slate-500 mt-2">Showing 10 of {blockList.length} blocked IPs</p>
      )}
    </div>
  );
};

// Main Report Content Component
const ReportContent = ({ report, period, onDownloadPDF }) => {
  const { summary, analysis, securityTypes, severityCounts, activeBlockList } = report;

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div style={{ background: 'linear-gradient(135deg, #0a1628 0%, #0d1f3c 100%)' }} className="rounded-xl p-6 border border-blue-700/30">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 flex items-center justify-center bg-yellow-500/20 rounded-lg">
            <img src={logo} alt="Drishti AI" className="w-10 h-10 object-contain" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Drishti Kavach Security Report</h2>
            <p className="text-slate-400 text-sm">
              Generated: {new Date(report.generatedAt).toLocaleString()}
              {' • '}
              Period: {PERIODS.find(p => p.value === period)?.label || period}
            </p>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: 'Total Events', value: summary?.totalEvents, color: 'text-white' },
          { label: 'Security Threats', value: summary?.securityEvents, color: 'text-orange-400' },
          { label: 'DDoS Events', value: summary?.ddosEvents, color: 'text-red-400' },
          { label: 'Blocked IPs', value: summary?.blockedIps, color: 'text-green-400' },
          { label: 'Form Submissions', value: summary?.formSubmissions, color: 'text-blue-400' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/30">
            <div className="text-slate-400 text-xs uppercase tracking-wider mb-1">{label}</div>
            <div className={`text-2xl font-bold ${color}`}>{formatNumber(value)}</div>
          </div>
        ))}
      </div>

      {/* AI Analysis */}
      {analysis && (
        <div className="bg-purple-900/10 rounded-xl p-6 border border-purple-700/30">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-purple-400 text-xl">🤖</span>
            <h3 className="text-lg font-semibold text-purple-300">AI Security Analysis</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div>
                <span className="text-slate-400 text-sm">Threat Assessment</span>
                <p className="text-slate-200 mt-1">{analysis.threat_assessment || 'N/A'}</p>
              </div>
              <div>
                <span className="text-slate-400 text-sm">Severity Rating</span>
                <br />
                <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold mt-1 ${
                  analysis.severity_rating?.toLowerCase() === 'critical' ? 'bg-red-500/20 text-red-400' :
                  analysis.severity_rating?.toLowerCase() === 'high' ? 'bg-orange-500/20 text-orange-400' :
                  analysis.severity_rating?.toLowerCase() === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                  'bg-green-500/20 text-green-400'
                }`}>
                  {analysis.severity_rating || 'N/A'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 text-sm">Compliance Status</span>
                <p className="text-slate-200 mt-1">{analysis.compliance_status || 'N/A'}</p>
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <span className="text-slate-400 text-sm">Recommendation</span>
                <p className="text-slate-200 mt-1">{analysis.recommendation || 'N/A'}</p>
              </div>
              <div>
                <span className="text-slate-400 text-sm">Overall Assessment</span>
                <p className="text-slate-200 mt-1">{analysis.assessment || 'N/A'}</p>
              </div>
              <div className="pt-2 border-t border-purple-700/30">
                <p className="text-yellow-400 text-center font-medium italic">
                  {analysis.motto || 'Vigilia et Tutela'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Threat Breakdown */}
      {Object.keys(securityTypes || {}).length > 0 && (
        <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/30">
          <ThreatChart securityTypes={securityTypes} />
        </div>
      )}

      {/* Severity Distribution */}
      {Object.keys(severityCounts || {}).length > 0 && (
        <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/30">
          <h3 className="text-lg font-semibold text-white mb-3">Severity Distribution</h3>
          <SeverityDistribution severityCounts={severityCounts} />
        </div>
      )}

      {/* Active Blocked IPs */}
      <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/30">
        <BlockedIPs blockList={activeBlockList} />
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 mt-6">
        <button
          onClick={() => window.print()}
          className="flex-1 font-semibold py-3 px-6 rounded-xl transition-all"
          style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)', color: '#fff' }}
        >
          Print Report
        </button>
        <button
          onClick={onDownloadPDF}
          className="flex-1 font-semibold py-3 px-6 rounded-xl transition-all"
          style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)', color: '#fff' }}
        >
          Download PDF Report
        </button>
      </div>
    </div>
  );
};

// Loading State
const LoadingState = () => (
  <div className="flex flex-col items-center justify-center py-20">
    <div className="w-16 h-16 mb-4">
      <img src={logo} alt="Drishti AI" className="w-full h-full object-contain animate-pulse" />
    </div>
    <h3 className="text-xl font-bold text-white mb-2">Generating AI Security Report</h3>
    <p className="text-slate-400">Analyzing security events and threat data...</p>
  </div>
);

// Error State
const ErrorState = ({ message, onRetry }) => (
  <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 text-center">
    <span className="text-red-400 text-4xl mb-4 block">⚠️</span>
    <h3 className="text-xl font-bold text-red-300 mb-2">Report Generation Failed</h3>
    <p className="text-red-200/80 mb-6">{message}</p>
    <button
      onClick={onRetry}
      className="px-6 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg transition-colors"
    >
      Try Again
    </button>
  </div>
);

export default function SecurityReports() {
  const [period, setPeriod] = useState('30d');
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    fetchReport();
  }, [period]);

  useEffect(() => {
    let interval;
    if (autoRefresh && report) {
      interval = setInterval(() => fetchReport(), 300000);
    }
    return () => clearInterval(interval);
  }, [autoRefresh, report]);

  const fetchReport = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(`/reports/full?period=${period}`);
      setReport(response.data.report);
    } catch (err) {
      console.error('Report generation error:', err);
      setError(err.response?.data?.error || 'Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = () => {
    if (!report) return;

    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

    // Watermark helper
    const stampWatermark = () => {
      doc.saveGraphicsState();
      doc.setTextColor(235, 235, 240);
      doc.setFontSize(42);
      doc.text('DRISHTI KAVACH', 105, 148, { align: 'center', angle: 45 });
      doc.restoreGraphicsState();
    };

    // Footer helper
    const addFooter = (pageNum) => {
      doc.setFontSize(8);
      doc.setTextColor(160, 160, 160);
      doc.setFont('helvetica', 'normal');
      doc.text(
        `Drishti Kavach AI Security Report  |  Page ${pageNum}  |  Confidential`,
        105, 292, { align: 'center' }
      );
    };

    // ── PAGE 1: COVER ──────────────────────────────────────
    stampWatermark();
    doc.setFontSize(28);
    doc.setTextColor(15, 20, 40);
    doc.setFont('helvetica', 'bold');
    doc.text('AI Security Intelligence Report', 105, 80, { align: 'center' });

    doc.setFontSize(13);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80, 90, 110);
    doc.text('Drishti Kavach  |  SOC Dashboard Edition', 105, 92, { align: 'center' });

    doc.setDrawColor(41, 128, 185);
    doc.setLineWidth(0.8);
    doc.line(40, 100, 170, 100);

    doc.setFontSize(10);
    doc.setTextColor(100, 100, 110);
    doc.text(`Generated: ${new Date(report.generatedAt).toLocaleString()}`, 105, 112, { align: 'center' });
    doc.text(`Period: ${PERIODS.find(p => p.value === period)?.label || period}`, 105, 120, { align: 'center' });
    addFooter(1);

    // ── PAGE 2: EXECUTIVE SUMMARY ──────────────────────────
    doc.addPage();
    stampWatermark();
    doc.setFontSize(16);
    doc.setTextColor(15, 20, 40);
    doc.setFont('helvetica', 'bold');
    doc.text('1. Executive Summary', 14, 18);

    doc.autoTable({
      startY: 24,
      head: [['Metric', 'Value']],
      body: [
        ['Total Page Events', report.summary?.totalEvents ?? 0],
        ['Security Threats Detected', report.summary?.securityEvents ?? 0],
        ['DDoS Attack Events', report.summary?.ddosEvents ?? 0],
        ['Active Blocked IPs', report.summary?.blockedIps ?? 0],
        ['Form Submissions', report.summary?.formSubmissions ?? 0],
      ],
      theme: 'grid',
      headStyles: { fillColor: [41, 128, 185], fontStyle: 'bold' },
      styles: { fontSize: 10 },
    });

    if (report.analysis) {
      const yAfterSummary = doc.lastAutoTable.finalY + 10;
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 20, 40);
      doc.text('AI Security Assessment', 14, yAfterSummary);

      doc.autoTable({
        startY: yAfterSummary + 5,
        body: [
          ['Threat Assessment', report.analysis.threat_assessment || 'N/A'],
          ['Severity Rating', report.analysis.severity_rating || 'N/A'],
          ['Compliance Status', report.analysis.compliance_status || 'N/A'],
          ['Overall Assessment', report.analysis.assessment || 'N/A'],
          ['Motto', report.analysis.motto || 'Vigilia et Tutela'],
        ],
        theme: 'plain',
        styles: { fontSize: 9, cellPadding: 2 },
        columnStyles: { 0: { fontStyle: 'bold', cellWidth: 55, textColor: [60, 70, 90] } },
      });
    }

    // Threat Intelligence — same page if space, else new page
    const yThreat = (doc.lastAutoTable?.finalY ?? 60) + 12;
    const needNewPageThreat = yThreat > 210;
    if (needNewPageThreat) { doc.addPage(); stampWatermark(); }

    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 20, 40);
    doc.text('2. Threat Intelligence Breakdown', 14, needNewPageThreat ? 18 : yThreat);

    const threatTypes = Object.entries(report.securityTypes || {}).map(([k, v]) => [k, String(v)]);
    doc.autoTable({
      startY: (needNewPageThreat ? 18 : yThreat) + 5,
      head: [['Attack Type', 'Count']],
      body: threatTypes.length ? threatTypes : [['No threats detected', '0']],
      theme: 'striped',
      headStyles: { fillColor: [192, 57, 43], fontStyle: 'bold' },
      styles: { fontSize: 9 },
    });
    addFooter(2);

    // ── PAGE 3: DETAILED ATTACK LOGS ──────────────────────
    doc.addPage();
    stampWatermark();
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 20, 40);
    doc.text('3. Detailed Attack Logs', 14, 18);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(120, 120, 130);
    doc.text('(Admin logins and internal auth events excluded)', 14, 25);

    const filteredEvents = (report.recentSecurityEvents || [])
      .filter(e => e.event_type !== 'admin_login' && e.event_type !== 'login');
    const eventBody = filteredEvents.map(e => [
      new Date(e.created_at).toLocaleString([], { month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' }),
      String(e.user_ip || 'Unknown'),
      String(e.event_type || 'Unknown'),
      String((e.details && e.details.message) || e.payload || 'N/A').slice(0, 80),
      String(e.severity || 'low').toUpperCase(),
    ]);

    doc.autoTable({
      startY: 30,
      head: [['Time', 'IP Address', 'Attack Type', 'Details', 'Severity']],
      body: eventBody.length ? eventBody : [['No external security events recorded', '', '', '', '']],
      theme: 'grid',
      styles: { fontSize: 7, overflow: 'linebreak', cellPadding: 1.5 },
      headStyles: { fillColor: [44, 62, 80], fontStyle: 'bold', fontSize: 8 },
      columnStyles: {
        0: { cellWidth: 28 },
        1: { cellWidth: 28 },
        2: { cellWidth: 28 },
        3: { cellWidth: 75 },
        4: { cellWidth: 18 },
      },
    });
    addFooter(3);

    // ── PAGE 4: VISITOR IP LOGS ────────────────────────────
    doc.addPage();
    stampWatermark();
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 20, 40);
    doc.text('4. Traffic & Visitor IP Logs', 14, 18);

    const ipBody = (report.ipLogs || []).map(e => [
      new Date(e.timestamp).toLocaleString([], { month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' }),
      String(e.user_ip || 'Unknown'),
      String(e.page_url || '/').slice(0, 60),
      `${e.city || ''}${e.city && e.country ? ', ' : ''}${e.country || ''}`.trim() || 'Unknown',
    ]);

    doc.autoTable({
      startY: 24,
      head: [['Time', 'IP Address', 'Page Visited', 'Location']],
      body: ipBody.length ? ipBody : [['No visitor traffic recorded', '', '', '']],
      theme: 'grid',
      styles: { fontSize: 7, overflow: 'linebreak', cellPadding: 1.5 },
      headStyles: { fillColor: [39, 174, 96], fontStyle: 'bold', fontSize: 8 },
      columnStyles: {
        0: { cellWidth: 28 },
        1: { cellWidth: 32 },
        2: { cellWidth: 90 },
        3: { cellWidth: 37 },
      },
    });
    addFooter(4);

    // ── PAGE 5: BLOCKLIST ──────────────────────────────────
    doc.addPage();
    stampWatermark();
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 20, 40);
    doc.text('5. Active Blocklist & Mitigations', 14, 18);

    const blockBody = (report.activeBlockList || []).map(ip => [
      String(ip.ip),
      ip.created_at ? new Date(ip.created_at).toLocaleDateString() : 'N/A',
      String(ip.reason || 'No reason specified'),
      String(ip.severity || 'N/A').toUpperCase(),
    ]);

    doc.autoTable({
      startY: 24,
      head: [['IP Address', 'Date Blocked', 'Reason', 'Severity']],
      body: blockBody.length ? blockBody : [['No IPs currently blocked', '', '', '']],
      theme: 'grid',
      styles: { fontSize: 9, cellPadding: 2 },
      headStyles: { fillColor: [142, 68, 173], fontStyle: 'bold' },
      columnStyles: {
        0: { cellWidth: 40 },
        1: { cellWidth: 30 },
        2: { cellWidth: 95 },
        3: { cellWidth: 22 },
      },
    });

    // Recommendations — same page if space, else new page
    if (report.analysis?.recommendation) {
      const yRec = doc.lastAutoTable.finalY + 12;
      if (yRec < 240) {
        doc.setFontSize(13);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(15, 20, 40);
        doc.text('6. Actionable Recommendations', 14, yRec);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(50, 55, 70);
        const lines = doc.splitTextToSize(report.analysis.recommendation, 180);
        doc.text(lines, 14, yRec + 7);
      } else {
        addFooter(5);
        doc.addPage();
        stampWatermark();
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(15, 20, 40);
        doc.text('6. Actionable Recommendations', 14, 18);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(50, 55, 70);
        const lines = doc.splitTextToSize(report.analysis.recommendation, 180);
        doc.text(lines, 14, 28);
        addFooter(6);
        const timestamp2 = new Date().toISOString().slice(0, 10);
        doc.save(`drishti-kavach-security-report-${timestamp2}.pdf`);
        return;
      }
    }
    addFooter(5);

    const timestamp = new Date().toISOString().slice(0, 10);
    doc.save(`drishti-kavach-security-report-${timestamp}.pdf`);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">Security Reports</h1>
          <p className="text-slate-400">
            AI-generated security intelligence reports with comprehensive threat analysis
          </p>
        </div>

        <div className="flex items-center gap-4">
          {/* Period Selector */}
          <div className="flex items-center gap-2">
            <span className="text-slate-400 text-sm">Report Period:</span>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="bg-slate-800 text-white border border-blue-600 rounded-lg px-4 py-2 focus:outline-none"
            >
              {PERIODS.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </div>

          {/* Auto-refresh Toggle */}
          <label className="flex items-center gap-2 cursor-pointer">
            <div className="relative">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="sr-only"
              />
              <div className={`w-10 h-6 rounded-full transition-colors ${autoRefresh ? 'bg-green-500/30' : 'bg-slate-700'}`}>
                <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${autoRefresh ? 'left-5' : 'left-1'}`} />
              </div>
            </div>
            <span className="text-sm text-slate-400">Auto-refresh</span>
          </label>
        </div>
      </div>

      {/* Report Content */}
      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchReport} />
      ) : report ? (
        <ReportContent report={report} period={period} onDownloadPDF={downloadPDF} />
      ) : (
        <p className="text-slate-400">No report data available</p>
      )}

      {/* Print Styles */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .printable, .printable * { visibility: visible; }
          .printable { position: absolute; left: 0; top: 0; width: 100%; }
        }
      `}</style>
    </div>
  );
}
