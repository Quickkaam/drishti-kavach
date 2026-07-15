// ============================================
// Drishti Kavach — Reports Page
// ============================================

import React, { useState } from 'react';
import api from '../api/client';

export default function Reports() {
  const [period, setPeriod] = useState('7d');
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);

  const generateReport = async () => {
    setLoading(true);
    try {
      const { data } = await api.post('/reports/generate', { period });
      setReport({ content: data.report, generated_at: data.generated_at, period: data.period });
    } catch (e) { alert(e.response?.data?.error || 'Failed to generate report'); }
    finally { setLoading(false); }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Security Reports</h1>
        <p className="text-slate-500 text-sm mt-0.5">AI-generated security intelligence reports</p>
      </div>

      <div className="dk-card">
        <h3 className="font-semibold text-slate-200 mb-4">Generate Report</h3>
        <div className="flex items-center gap-4">
          <div>
            <label className="block text-xs text-slate-400 mb-1.5">Report Period</label>
            <select value={period} onChange={e => setPeriod(e.target.value)} className="dk-input w-auto">
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
            </select>
          </div>
          <button onClick={generateReport} disabled={loading}
                  className="dk-btn-primary mt-5 disabled:opacity-50">
            {loading ? '🤖 Generating...' : '📋 Generate AI Report'}
          </button>
        </div>
      </div>

      {report && (
        <div className="dk-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-white">Security Report — {report.period}</h3>
            <span className="text-xs text-slate-500">{new Date(report.generated_at).toLocaleString()}</span>
          </div>
          <div className="bg-navy-900/50 rounded-lg p-5 border border-royal-800/20">
            <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">{report.content}</p>
          </div>
          <div className="flex gap-3 mt-4">
            <button onClick={() => navigator.clipboard.writeText(report.content).then(() => alert('Copied!'))}
                    className="dk-btn-secondary text-xs py-1.5">
              📋 Copy Report
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
