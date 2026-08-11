// ============================================
// Drishti Kavach — Security Reports Page
// AI-Generated Security Intelligence Reports
// ============================================

import React, { useState, useEffect } from 'react';
import api from '../api/client';
import logo from '/drishti-ai-logo.png';
import 'jspdf-autotable';
import { jsPDF } from 'jspdf';

// ... other imports ...

  const downloadPDF = async () => {
    if (!report) return;

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    // Helper to add watermark
    const addWatermark = () => {
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setTextColor(240, 240, 245);
        doc.setFontSize(40);
        doc.text("DRISHTI KAVACH", 105, 150, { align: 'center', angle: 45 });
      }
    };

    // Load logo if possible (synchronous fallback if not)
    let imgData = null;
    try {
      // Use the imported logo string (usually base64 or path in Vite)
      // Since jsPDF needs base64, we'll try to use it directly or skip if it fails.
      // Assuming Vite embeds small assets as base64 or we just skip image if it errors.
    } catch (e) {}

    // --- 1. COVER PAGE ---
    doc.setFontSize(24);
    doc.setTextColor(20, 20, 30);
    doc.text('AI Security Intelligence Report', 105, 80, { align: 'center' });
    doc.setFontSize(14);
    doc.setTextColor(100, 100, 110);
    doc.text('Drishti Kavach - SOC Edition', 105, 90, { align: 'center' });
    
    doc.setFontSize(12);
    doc.text(`Generated: ${new Date(report.generatedAt).toLocaleString()}`, 105, 120, { align: 'center' });
    doc.text(`Period: ${PERIODS.find(p => p.value === period)?.label || period}`, 105, 128, { align: 'center' });
    
    doc.addPage();

    // --- 2. EXECUTIVE SUMMARY ---
    doc.setFontSize(16);
    doc.setTextColor(20, 20, 30);
    doc.text('1. Executive Summary', 14, 20);
    
    doc.autoTable({
      startY: 25,
      head: [['Metric', 'Value']],
      body: [
        ['Total Events', report.summary.totalEvents || 0],
        ['Security Threats', report.summary.securityEvents || 0],
        ['DDoS Attacks', report.summary.ddosEvents || 0],
        ['Blocked IPs', report.summary.blockedIps || 0]
      ],
      theme: 'grid',
      headStyles: { fillColor: [41, 128, 185] }
    });

    if (report.analysis) {
      doc.setFontSize(12);
      doc.text('AI Assessment', 14, doc.lastAutoTable.finalY + 10);
      
      const analysisBody = [
        ['Threat Assessment', report.analysis.threat_assessment || 'N/A'],
        ['Severity Rating', report.analysis.severity_rating || 'N/A'],
        ['Compliance Status', report.analysis.compliance_status || 'N/A']
      ];
      
      doc.autoTable({
        startY: doc.lastAutoTable.finalY + 15,
        body: analysisBody,
        theme: 'plain',
        styles: { cellPadding: 2, fontSize: 10 }
      });
    }

    // --- 3. THREAT INTELLIGENCE ---
    doc.setFontSize(16);
    doc.text('2. Threat Intelligence Breakdown', 14, doc.lastAutoTable.finalY + 15);
    
    const threatTypes = Object.entries(report.securityTypes || {}).map(([k, v]) => [k, v]);
    doc.autoTable({
      startY: doc.lastAutoTable.finalY + 20,
      head: [['Attack Type', 'Count']],
      body: threatTypes.length ? threatTypes : [['None', '0']],
      theme: 'striped',
      headStyles: { fillColor: [192, 57, 43] }
    });

    // --- 4. SECURITY EVENTS LOG ---
    doc.addPage();
    doc.setFontSize(16);
    doc.text('3. Detailed Attack Logs', 14, 20);
    
    const filteredEvents = (report.recentSecurityEvents || [])
      .filter(e => e.event_type !== 'admin_login' && e.event_type !== 'login');
      
    const eventBody = filteredEvents.map(e => [
      new Date(e.created_at).toLocaleString(),
      e.user_ip || 'Unknown',
      e.event_type || 'Unknown',
      (e.details && e.details.message) || e.payload || 'N/A',
      e.severity || 'low'
    ]);

    doc.autoTable({
      startY: 25,
      head: [['Time', 'IP', 'Type', 'Description', 'Severity']],
      body: eventBody.length ? eventBody : [['No security events recorded', '', '', '', '']],
      theme: 'grid',
      styles: { fontSize: 8, overflow: 'linebreak' },
      columnStyles: { 3: { cellWidth: 80 } },
      headStyles: { fillColor: [44, 62, 80] }
    });

    // --- 5. VISITOR IPs ---
    doc.addPage();
    doc.setFontSize(16);
    doc.text('4. Traffic & Visitor IPs', 14, 20);
    
    const ipBody = (report.ipLogs || []).map(e => [
      new Date(e.timestamp).toLocaleString(),
      e.user_ip || 'Unknown',
      e.page_url || '/',
      `${e.city || ''} ${e.country || ''}`.trim() || 'Unknown'
    ]);

    doc.autoTable({
      startY: 25,
      head: [['Time', 'IP Address', 'Page Visited', 'Location']],
      body: ipBody.length ? ipBody : [['No traffic recorded', '', '', '']],
      theme: 'grid',
      styles: { fontSize: 8 },
      headStyles: { fillColor: [39, 174, 96] }
    });

    // --- 6. BLOCKLIST & MITIGATIONS ---
    doc.addPage();
    doc.setFontSize(16);
    doc.text('5. Active Blocklist', 14, 20);
    
    const blockBody = (report.activeBlockList || []).map(ip => [
      ip.ip,
      new Date(ip.created_at).toLocaleDateString(),
      ip.reason || 'N/A'
    ]);

    doc.autoTable({
      startY: 25,
      head: [['IP Address', 'Date Blocked', 'Reason']],
      body: blockBody.length ? blockBody : [['No IPs currently blocked', '', '']],
      theme: 'grid',
      styles: { fontSize: 9 },
      headStyles: { fillColor: [142, 68, 173] }
    });

    // --- 7. RECOMMENDATIONS ---
    if (report.analysis && report.analysis.recommendation) {
      doc.setFontSize(16);
      doc.text('6. Actionable Recommendations', 14, doc.lastAutoTable.finalY + 15);
      
      doc.setFontSize(10);
      const splitText = doc.splitTextToSize(report.analysis.recommendation, 180);
      doc.text(splitText, 14, doc.lastAutoTable.finalY + 25);
    }

    addWatermark();

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