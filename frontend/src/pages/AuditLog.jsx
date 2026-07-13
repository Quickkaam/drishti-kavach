// ============================================
// Drishti Kavach — Audit Log Page
// ============================================

import React, { useState, useEffect } from 'react';
import api from '../api/client';

export default function AuditLog() {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    api.get('/audit?limit=200').then(r => setLogs(r.data.logs || []));
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Audit Log</h1>

      <div className="dk-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-royal-800/30 text-left">
              {['Admin', 'Action', 'Target', 'IP', 'Time'].map(h => (
                <th key={h} className="px-3 py-2.5 text-xs font-medium text-slate-500 uppercase">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {logs.map(l => (
              <tr key={l.id} className="border-b border-royal-800/10 hover:bg-royal-800/10">
                <td className="px-3 py-2.5 text-slate-300 font-medium">{l.admin_user}</td>
                <td className="px-3 py-2.5 text-gold-400 font-mono text-xs">{l.action}</td>
                <td className="px-3 py-2.5 text-slate-400 text-xs">{l.target}</td>
                <td className="px-3 py-2.5 text-slate-500 font-mono text-xs">{l.ip_address}</td>
                <td className="px-3 py-2.5 text-slate-500 text-xs">{new Date(l.created_at).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
