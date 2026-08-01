// ============================================
// Drishti Kavach — Security Reports Page
// AI Guardian Mode & Comprehensive Analysis
// ============================================

import React, { useEffect, useState } from 'react';
import api from '../api/client';

const PERIODS = [
  { value: '7d', label: 'Last 7 Days' },
  { value: '30d', label: 'Last 30 Days' },
];

export default function SecurityReports() {
  const [reports, setReports] = useState([]);
  const [attackers, setAttackers] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [selectedAttacker, setSelectedAttacker] = useState(null);
  const [guardianStats, setGuardianStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [period, setPeriod] = useState('7d');
  const [error, setError] = useState(null);
  const [showPDF, setShowPDF] = useState(false);
  const [pdfContent, setPdfContent] = useState('');

  const fetchGuardianStats = async () => {
    try {
      const { data } = await api.get('/reports/guardian/stats');
      setGuardianStats(data.stats);
    } catch (err) {
      console.error('Failed to fetch guardian stats:', err);
    }
  };

  const fetchReports = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get('/reports', { params: { period } });
      setReports(data.reports || []);
    } catch (err) {
      console.error('Failed to fetch reports:', err);
      setError('Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  const fetchAttackers = async () => {
    try {
      const { data } = await api.get('/reports/attackers');
      setAttackers(data.attackers || []);
    } catch (err) {
      console.error('Failed to fetch attackers:', err);
    }
  };

  const generateReport = async () => {
    setGenerating(true);
    setError(null);
    try {
      const { data } = await api.post('/reports/generate', { period });
      setSelectedReport(data.report);
      fetchReports();
      fetchGuardianStats();
    } catch (err) {
      console.error('Failed to generate report:', err);
      setError('Failed to generate report');
    } finally {
      setGenerating(false);
    }
  };

  const viewPDF = async (websiteId, period) => {
    try {
      const { data } = await api.get(`/reports/pdf/${websiteId}/${period}`, {
        responseType: 'text'
      });
      setPdfContent(data);
      setShowPDF(true);
    } catch (err) {
      console.error('Failed to fetch PDF:', err);
      setError('Failed to load PDF preview');
    }
  };

  const downloadReport = async (websiteId, period) => {
    try {
      const { data } = await api.get(`/reports/download/${websiteId}/${period}`, {
        responseType: 'blob'
      });
      
      const blob = new Blob([data], { type: 'text/html' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `security-report-${websiteId}-${period}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to download report:', err);
      setError('Failed to download report');
    }
  };

  const blockAttacker = async (ip, websiteId) => {
    if (!window.confirm(`Are you sure you want to block IP ${ip}?`)) return;

    try {
      await api.post('/reports/manual-block', {
        ip,
        reason: 'Manual block from Security Reports page',
        website_id: websiteId
      });
      
      alert(`IP ${ip} blocked successfully`);
      fetchAttackers();
    } catch (err) {
      console.error('Failed to block attacker:', err);
      setError('Failed to block IP');
    }
  };

  const fetchAttackerDetails = async (ip, websiteId) => {
    try {
      const { data } = await api.get(`/reports/attacker/${ip}`, {
        params: { website_id: websiteId }
      });
      setSelectedAttacker(data.attacker);
    } catch (err) {
      console.error('Failed to fetch attacker details:', err);
      setError('Failed to load attacker details');
    }
  };

  useEffect(() => {
    fetchReports();
    fetchGuardianStats();
    fetchAttackers();
  }, [period]);

  const renderThreatLevel = (score) => {
    if (score >= 80) return <span className="badge-critical">CRITICAL</span>;
    if (score >= 60) return <span className="badge-high">HIGH</span>;
    if (score >= 40) return <span className="badge-medium">MEDIUM</span>;
    if (score >= 20) return <span className="badge-low">LOW</span>;
    return <span className="badge-minimal">MINIMAL</span>;
  };

  const renderSeverity = (severity) => {
    const colors = {
      critical: 'bg-red-600',
      high: 'bg-orange-500',
      medium: 'bg-yellow-500',
      low: 'bg-green-500',
    };
    return (
      <span className={`px-2 py-1 rounded text-xs font-bold text-white ${colors[severity] || 'bg-gray-500'}`}>
        {severity}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">🛡️ Security Reports & AI Guardian</h1>
          <p className="text-slate-500 text-sm mt-0.5">Comprehensive AI-powered security analysis</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="dk-input w-auto"
          >
            {PERIODS.map(p => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
          <button
            onClick={generateReport}
            disabled={generating}
            className="dk-btn-primary flex items-center gap-2"
          >
            {generating ? (
              <>
                <span className="animate-spin">⏳</span>
                Generating...
              </>
            ) : (
              <>
                <span>📄 Generate Report</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Guardian Stats */}
      {guardianStats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="dk-card p-4">
            <h3 className="text-slate-500 text-sm">Total Attackers</h3>
            <p className="text-2xl font-bold text-white mt-1">{guardianStats.totalAttackers}</p>
          </div>
          <div className="dk-card p-4">
            <h3 className="text-slate-500 text-sm">Active Attackers</h3>
            <p className="text-2xl font-bold text-orange-400 mt-1">{guardianStats.activeAttackers}</p>
          </div>
          <div className="dk-card p-4">
            <h3 className="text-slate-500 text-sm">Blocked Attackers</h3>
            <p className="text-2xl font-bold text-green-400 mt-1">{guardianStats.blockedAttackers}</p>
          </div>
          <div className="dk-card p-4">
            <h3 className="text-slate-500 text-sm">Critical Threats (24h)</h3>
            <p className="text-2xl font-bold text-red-500 mt-1">{guardianStats.criticalThreats}</p>
          </div>
          <div className="dk-card p-4">
            <h3 className="text-slate-500 text-sm">Total Attacks (Today)</h3>
            <p className="text-2xl font-bold text-blue-400 mt-1">{guardianStats.todayAttacks}</p>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Reports List */}
        <div className="dk-card overflow-hidden">
          <div className="border-b border-royal-800/30 p-4 bg-navy-800/50">
            <h2 className="font-semibold text-white">📊 Recent Security Reports</h2>
          </div>
          
          <div className="p-4">
            {loading ? (
              <div className="text-center py-12 text-gold-400 animate-pulse">Loading reports...</div>
            ) : error ? (
              <div className="text-center py-12 text-red-400">{error}</div>
            ) : reports.length === 0 ? (
              <div className="text-center py-12 text-slate-600">
                <p className="mb-2">No reports generated yet</p>
                <p className="text-sm text-slate-500">Click "Generate Report" to create your first AI-powered analysis</p>
              </div>
            ) : (
              <div className="space-y-3">
                {reports.slice(0, 10).map(report => (
                  <div
                    key={report.id}
                    className="dk-card p-4 hover:bg-royal-800/10 cursor-pointer transition-colors"
                    onClick={() => setSelectedReport(report)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-mono text-blue-400">ID: {report.id}</span>
                        <span className="text-xs text-slate-500">{new Date(report.created_at).toLocaleDateString()}</span>
                      </div>
                      <span className="text-xs font-mono text-slate-400">{report.period || period}</span>
                    </div>
                    <div className="text-sm text-slate-300">
                      {report.details?.type === 'comprehensive' 
                        ? 'AI Comprehensive Analysis' 
                        : 'Automated System Report'}
                    </div>
                    {report.details?.report && (
                      <p className="text-xs text-slate-500 mt-2 line-clamp-2">
                        {String(report.details.report).substring(0, 100)}...
                      </p>
                    )}
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          viewPDF(report.website_id || '1', report.period || period);
                        }}
                        className="text-xs bg-blue-600/20 text-blue-400 px-3 py-1 rounded hover:bg-blue-600/40"
                      >
                        📄 Preview PDF
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          downloadReport(report.website_id || '1', report.period || period);
                        }}
                        className="text-xs bg-green-600/20 text-green-400 px-3 py-1 rounded hover:bg-green-600/40"
                      >
                        ⬇️ Download
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Attackers List */}
        <div className="dk-card overflow-hidden">
          <div className="border-b border-royal-800/30 p-4 bg-navy-800/50">
            <h2 className="font-semibold text-white">🕵️ Active Attackers</h2>
          </div>
          
          <div className="p-4">
            {attackers.length === 0 ? (
              <div className="text-center py-12 text-slate-600">No attackers recorded</div>
            ) : (
              <div className="space-y-3">
                {attackers.slice(0, 10).map(attacker => (
                  <div
                    key={attacker.ip}
                    className="dk-card p-4 hover:bg-royal-800/10 cursor-pointer transition-colors"
                    onClick={() => fetchAttackerDetails(attacker.ip, attacker.website_id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm text-blue-400">{attacker.ip}</span>
                        <span className="text-xs text-slate-500">{attacker.country || 'Unknown'}</span>
                      </div>
                      {attacker.status === 'blocked' ? (
                        <span className="text-xs bg-red-600/20 text-red-400 px-2 py-0.5 rounded">Blocked</span>
                      ) : (
                        <span className="text-xs bg-orange-600/20 text-orange-400 px-2 py-0.5 rounded">
                          {attacker.count || 0} attacks
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-2 text-xs text-slate-500">
                      <span>First seen: {new Date(attacker.first_seen).toLocaleDateString()}</span>
                      <span>•</span>
                      <span>Event: {attacker.event_type || 'Unknown'}</span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        blockAttacker(attacker.ip, attacker.website_id);
                      }}
                      className="text-xs bg-red-600/10 text-red-400 px-2 py-1 rounded mt-2 hover:bg-red-600/20"
                    >
                      🚫 Block IP
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Detailed Report Panel */}
      {selectedReport && (
        <div className="fixed inset-y-0 right-0 w-full md:w-128 bg-navy-800 border-l border-royal-800/50 p-6 overflow-y-auto z-50">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold text-white text-xl">📄 Comprehensive Security Report</h3>
            <button onClick={() => setSelectedReport(null)} className="text-slate-500 hover:text-white text-2xl">×</button>
          </div>

          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <span className="text-sm text-slate-500">Period:</span>
              <span className="text-sm font-mono text-blue-400">{selectedReport.period}</span>
              <span className="text-sm text-slate-500">Generated:</span>
              <span className="text-sm text-slate-300">{new Date(selectedReport.generated_at).toLocaleString()}</span>
            </div>

            <div className="dk-card p-4">
              <h4 className="font-semibold text-white mb-3">📊 Executive Summary</h4>
              <p className="text-sm text-slate-300 leading-relaxed">
                {selectedReport.ai_analysis?.executive_summary || 'No summary available'}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="dk-card p-4">
                <h4 className="font-semibold text-slate-500 text-sm mb-2">Overall Threat Score</h4>
                <p className="text-3xl font-bold text-white">
                  {selectedReport.summary?.threat_score || 0}/100
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  {selectedReport.summary?.threat_score >= 80 
                    ? 'CRITICAL - Immediate action required' 
                    : selectedReport.summary?.threat_score >= 60
                    ? 'HIGH - Priority attention needed'
                    : 'MODERATE - Monitor closely'}
                </p>
              </div>
              <div className="dk-card p-4">
                <h4 className="font-semibold text-slate-500 text-sm mb-2">Threat Level</h4>
                <p className="text-xl font-bold mt-2">
                  {selectedReport.threat_analysis?.threat_level?.toUpperCase() || 'UNKNOWN'}
                </p>
                <div className="mt-2">
                  {renderThreatLevel(selectedReport.summary?.threat_score || 0)}
                </div>
              </div>
            </div>

            {selectedReport.ai_analysis && (
              <>
                <div className="dk-card p-4">
                  <h4 className="font-semibold text-white mb-3">🔍 Threat Assessment</h4>
                  <p className="text-sm text-slate-300">{selectedReport.ai_analysis.threat_assessment}</p>
                </div>

                <div className="dk-card p-4">
                  <h4 className="font-semibold text-white mb-3">🛡️ Recommendations</h4>
                  <ul className="space-y-2">
                    {selectedReport.ai_analysis.recommendations?.map((rec, i) => (
                      <li key={i} className="text-sm text-slate-300 flex items-start gap-2">
                        <span className="text-green-500 mt-1">✓</span>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            )}

            {selectedReport.top_attackers?.length > 0 && (
              <div className="dk-card p-4">
                <h4 className="font-semibold text-white mb-3">🕵️ Top Attackers</h4>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-royal-800/30 text-left">
                      <th className="px-3 py-2 text-slate-500">IP Address</th>
                      <th className="px-3 py-2 text-slate-500">Count</th>
                      <th className="px-3 py-2 text-slate-500">First Seen</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedReport.top_attackers.slice(0, 5).map((attacker, i) => (
                      <tr key={i} className="border-b border-royal-800/10">
                        <td className="px-3 py-2 font-mono text-blue-400">{attacker.ip}</td>
                        <td className="px-3 py-2">{attacker.count}</td>
                        <td className="px-3 py-2 text-slate-500">{new Date(attacker.first_seen).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="flex gap-2 pt-4">
              <button
                onClick={() => downloadReport(selectedReport.website_id || '1', selectedReport.period)}
                className="dk-btn-secondary flex-1"
              >
                ⬇️ Download PDF
              </button>
              <button
                onClick={() => viewPDF(selectedReport.website_id || '1', selectedReport.period)}
                className="dk-btn-primary flex-1"
              >
                📄 Preview PDF
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Attacker Detail Panel */}
      {selectedAttacker && (
        <div className="fixed inset-y-0 right-0 w-96 bg-navy-800 border-l border-royal-800/50 p-6 overflow-y-auto z-50">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-white">🕵️ Attacker Details</h3>
            <button onClick={() => setSelectedAttacker(null)} className="text-slate-500 hover:text-white text-xl">×</button>
          </div>

          <div className="space-y-4 text-sm">
            <div><span className="text-slate-500">IP:</span> <span className="text-blue-400 font-mono ml-2">{selectedAttacker.ip}</span></div>
            <div><span className="text-slate-500">Country:</span> <span className="text-slate-300 ml-2">{selectedAttacker.country || 'Unknown'}</span></div>
            <div><span className="text-slate-500">Threat Score:</span> <span className="text-orange-400 ml-2">{selectedAttacker.threat_score || 'N/A'}</span></div>
            <div><span className="text-slate-500">Abuse Confidence:</span> <span className="text-yellow-400 ml-2">{selectedAttacker.abuse_confidence || 0}%</span></div>
            <div><span className="text-slate-500">Total Reports:</span> <span className="text-red-400 ml-2">{selectedAttacker.total_reports || 0}</span></div>
            <div><span className="text-slate-500">Is Scanner:</span> <span className={selectedAttacker.is_scanner ? 'text-red-400 ml-2' : 'text-green-400 ml-2'}>
              {selectedAttacker.is_scanner ? 'YES' : 'No'}
            </span></div>
            <div><span className="text-slate-500">Is VPN:</span> <span className={selectedAttacker.is_vpn ? 'text-orange-400 ml-2' : 'text-green-400 ml-2'}>
              {selectedAttacker.is_vpn ? 'YES' : 'No'}
            </span></div>
            <div><span className="text-slate-500">City:</span> <span className="text-slate-300 ml-2">{selectedAttacker.city || 'Unknown'}</span></div>
            <div><span className="text-slate-500">First Seen:</span> <span className="text-slate-300 ml-2">{new Date(selectedAttacker.first_seen).toLocaleString()}</span></div>
            <div><span className="text-slate-500">Last Seen:</span> <span className="text-slate-300 ml-2">{new Date(selectedAttacker.last_seen).toLocaleString()}</span></div>
            <div><span className="text-slate-500">Status:</span> <span className={`ml-2 ${selectedAttacker.status === 'blocked' ? 'text-red-400' : 'text-green-400'}`}>
              {selectedAttacker.status || 'active'}
            </span></div>

            <div className="pt-4 border-t border-slate-700/30">
              <button
                onClick={() => blockAttacker(selectedAttacker.ip, selectedAttacker.website_id)}
                className="dk-btn-danger w-full"
              >
                🚫 Block This IP
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PDF Preview Modal */}
      {showPDF && (
        <div className="fixed inset-0 bg-black/90 z-[60] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-5xl h-[90vh] rounded-lg overflow-hidden flex flex-col">
            <div className="bg-royal-800 p-4 flex items-center justify-between">
              <h3 className="text-white font-semibold">PDF Preview</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    const printWindow = window.open('', '_blank');
                    printWindow.document.write(pdfContent);
                    printWindow.document.close();
                    printWindow.print();
                  }}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
                >
                  🖨️ Print
                </button>
                <button
                  onClick={() => setShowPDF(false)}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
                >
                  ✕ Close
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-auto bg-gray-50 p-6">
              <iframe srcDoc={pdfContent} className="w-full h-full" title="PDF Preview" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}