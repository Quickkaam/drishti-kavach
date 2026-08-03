// ============================================
// Drishti Kavach — Security Reports Page
// AI-Generated Security Intelligence Reports
// ============================================

import React, { useState, useEffect } from 'react';
import api from '../api/client';
import logo from '/drishti-ai-logo.png';
import { jsPDF } from 'jspdf';

const PERIODS = [
  { value: '7d', label: 'Last 7 Days' },
  { value: '30d', label: 'Last 30 Days' },
];

// Helper function to format numbers
const formatNumber = (num) => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num;
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
                className="bg-gradient-to-r from-royal-500 to-royal-600 h-full rounded-full"
                style={{ width: `${(count / maxCount) * 100}%` }}
              />
            </div>
            <span className="text-xs font-bold text-gold-400 w-12 text-right">{count}</span>
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
          <span className="text-lg font-semibold">
            {formatNumber(severityCounts?.[level] || 0)}
          </span>
          {total > 0 && (
            <span className="text-xs opacity-75">
              {total > 0 ? Math.round((severityCounts?.[level] || 0) / total * 100) : 0}%
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
      {blockList?.length === 0 ? (
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
const ReportContent = ({ report, period }) => {
  const { summary, analysis, securityTypes, severityCounts, activeBlockList } = report;

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-navy-800 to-royal-900 rounded-xl p-6 border border-royal-700/30">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 flex items-center justify-center bg-gold-500/20 rounded-lg">
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
        <div className="bg-navy-800/50 rounded-xl p-4 border border-slate-700/30">
          <div className="text-slate-400 text-xs uppercase tracking-wider mb-1">Total Events</div>
          <div className="text-2xl font-bold text-white">{formatNumber(summary?.totalEvents)}</div>
        </div>
        <div className="bg-navy-800/50 rounded-xl p-4 border border-slate-700/30">
          <div className="text-slate-400 text-xs uppercase tracking-wider mb-1">Security Threats</div>
          <div className="text-2xl font-bold text-orange-400">{formatNumber(summary?.securityEvents)}</div>
        </div>
        <div className="bg-navy-800/50 rounded-xl p-4 border border-slate-700/30">
          <div className="text-slate-400 text-xs uppercase tracking-wider mb-1">DDoS Events</div>
          <div className="text-2xl font-bold text-red-400">{formatNumber(summary?.ddosEvents)}</div>
        </div>
        <div className="bg-navy-800/50 rounded-xl p-4 border border-slate-700/30">
          <div className="text-slate-400 text-xs uppercase tracking-wider mb-1">Blocked IPs</div>
          <div className="text-2xl font-bold text-green-400">{formatNumber(summary?.blockedIps)}</div>
        </div>
        <div className="bg-navy-800/50 rounded-xl p-4 border border-slate-700/30">
          <div className="text-slate-400 text-xs uppercase tracking-wider mb-1">Form Submissions</div>
          <div className="text-2xl font-bold text-blue-400">{formatNumber(summary?.formSubmissions)}</div>
        </div>
      </div>

      {/* AI Analysis */}
      {analysis && (
        <div className="bg-gradient-to-r from-purple-900/20 to-indigo-900/20 rounded-xl p-6 border border-purple-700/30">
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
                <p className="text-gold-400 text-center font-medium italic" style={{ fontFamily: "'Noto Sans Devanagari', sans-serif" }}>
                  {analysis.motto || 'Vigilia et Tutela'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Threat Breakdown */}
      {Object.keys(securityTypes || {}).length > 0 && (
        <div className="bg-navy-800/50 rounded-xl p-6 border border-slate-700/30">
          <ThreatChart securityTypes={securityTypes} />
        </div>
      )}

      {/* Severity Distribution */}
      {Object.keys(severityCounts || {}).length > 0 && (
        <div className="bg-navy-800/50 rounded-xl p-6 border border-slate-700/30">
          <SeverityDistribution severityCounts={severityCounts} />
        </div>
      )}

      {/* Active Blocked IPs */}
      <BlockedIPs blockList={activeBlockList} />

      {/* Action Buttons */}
      <div className="flex gap-3 mt-6">
        <button
          onClick={() => window.print()}
          className="flex-1 bg-gradient-to-r from-royal-500 to-royal-600 hover:from-royal-400 hover:to-royal-500 text-white font-semibold py-3 px-6 rounded-xl shadow-lg shadow-royal-500/20 transition-all"
        >
          Print Report
        </button>
        <button
          onClick={downloadPDF}
          className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-400 hover:to-green-500 text-white font-semibold py-3 px-6 rounded-xl shadow-lg shadow-green-500/20 transition-all"
        >
          Download PDF Report
        </button>
        <a
          href={`${process.env.REACT_APP_API_URL || 'https://drishti-kavach-backend.onrender.com'}/api/reports/download?period=${period}`}
          className="flex-1 bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-400 hover:to-gold-500 text-navy-900 font-semibold py-3 px-6 rounded-xl shadow-lg shadow-gold-500/20 transition-all"
        >
          Download TXT Report
        </a>
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
    generateReport();
  }, [period]);

  useEffect(() => {
    let interval;
    if (autoRefresh && report) {
      interval = setInterval(() => {
        generateReport();
      }, 300000); // Refresh every 5 minutes
    }
    return () => clearInterval(interval);
  }, [autoRefresh, report]);

  const generateReport = async () => {
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

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    // Add header
    doc.setFontSize(20);
    doc.setTextColor(20, 20, 20);
    doc.text('Drishti Kavach Security Report', 105, 20, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated: ${new Date(report.generatedAt).toLocaleString()}`, 105, 28, { align: 'center' });
    doc.text(`Period: ${PERIODS.find(p => p.value === period)?.label || period}`, 105, 33, { align: 'center' });

    // Add summary stats
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text('SUMMARY', 20, 45);
    
    doc.setFontSize(10);
    doc.text(`Total Events: ${report.summary.totalEvents || 0}`, 20, 52);
    doc.text(`Security Threats: ${report.summary.securityEvents || 0}`, 20, 57);
    doc.text(`DDoS Events: ${report.summary.ddosEvents || 0}`, 20, 62);
    doc.text(`Blocked IPs: ${report.summary.blockedIps || 0}`, 20, 67);
    doc.text(`Form Submissions: ${report.summary.formSubmissions || 0}`, 20, 72);

    // Add AI analysis
    if (report.analysis) {
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.text('AI ANALYSIS', 20, 85);
      
      doc.setFontSize(10);
      const analysisText = [
        `Threat Assessment: ${report.analysis.threat_assessment || 'N/A'}`,
        `Severity Rating: ${report.analysis.severity_rating || 'N/A'}`,
        `Recommendation: ${report.analysis.recommendation || 'N/A'}`,
        `Compliance: ${report.analysis.compliance_status || 'N/A'}`,
        `Assessment: ${report.analysis.assessment || 'N/A'}`,
        `Motto: ${report.analysis.motto || 'Vigilia et Tutela'}`,
      ];
      
      analysisText.forEach((line, i) => {
        doc.text(line, 20, 92 + i * 7);
      });
    }

    // Add blocked IPs
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text('ACTIVE BLOCKED IPS', 20, report.analysis ? 140 : 110);
    
    let y = report.analysis ? 147 : 117;
    (report.activeBlockList || []).slice(0, 8).forEach((ip, i) => {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
      doc.setFontSize(9);
      doc.text(`${i + 1}. ${ip.ip} - ${ip.reason || 'N/A'}`, 20, y);
      y += 7;
    });

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text('Generated by Drishti Kavach AI — दृष्टिः रक्षति, रक्षा दृश्यते', 105, 290, { align: 'center' });

    // Download
    const timestamp = new Date().toISOString().slice(0, 10);
    doc.save(`security-report-${timestamp}-${period}.pdf`);
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
              className="bg-navy-800 text-white border border-royal-600 rounded-lg px-4 py-2 focus:outline-none focus:border-gold-500"
            >
              {PERIODS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
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
        <ErrorState message={error} onRetry={generateReport} />
      ) : report ? (
        <ReportContent report={report} period={period} />
      ) : (
        <p className="text-slate-400">No report data available</p>
      )}

      {/* Print Styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .printable, .printable * {
            visibility: visible;
          }
          .printable {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}