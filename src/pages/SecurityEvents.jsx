// ============================================
// Drishti Kavach — Security Events Page
// ============================================

import React, { useEffect, useState } from 'react';
import api from '../api/client';

const SEVERITY_ORDER = { critical: 0, high: 1, medium: 2, low: 3 };

export default function SecurityEvents() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ severity: '', event_type: '', status: '' });
  const [selected, setSelected] = useState(null);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams(Object.fromEntries(Object.entries(filters).filter(([, v]) => v)));
      const { data } = await api.get(`/security/events?${params}&limit=100`);
      const sorted = [...(data.events || [])].sort((a, b) =>
        (SEVERITY_ORDER[a.severity] ?? 4) - (SEVERITY_ORDER[b.severity] ?? 4)
      );
      setEvents(sorted);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchEvents(); }, [filters]);

  const blockIp = async (ip, websiteId) => {
    try {
      await api.post('/ip/block', { ip, reason: 'Blocked from security event', severity: 'high', website_id: websiteId });
      alert(`IP ${ip} blocked ✓`);
    } catch { alert('Failed to block IP'); }
  };

  const updateStatus = async (id, status) => {
    try {
      await api.patch(`/security/${id}`, { status });
      setEvents(prev => prev.map(e => e.id === id ? { ...e, status } : e));
      if (selected?.id === id) setSelected(prev => ({ ...prev, status }));
    } catch { alert('Failed to update'); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Security Events</h1>
          <p className="text-slate-500 text-sm mt-0.5">{events.length} events found</p>
        </div>
        <button onClick={fetchEvents} className="dk-btn-secondary">🔄 Refresh</button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        {[
          { key: 'severity', options: ['', 'critical', 'high', 'medium', 'low'], label: 'Severity' },
          { key: 'event_type', options: ['', 'sqli', 'xss', 'honeypot_trigger', 'path_traversal', 'brute_force', 'command_injection'], label: 'Type' },
          { key: 'status', options: ['', 'new', 'investigating', 'resolved', 'false_positive'], label: 'Status' },
        ].map(f => (
          <select key={f.key} value={filters[f.key]}
                  onChange={e => setFilters(prev => ({ ...prev, [f.key]: e.target.value }))}
                  className="dk-input w-auto text-xs px-3 py-2">
            <option value="">{f.label}: All</option>
            {f.options.filter(Boolean).map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        ))}
      </div>

      {/* Table */}
      <div className="dk-card overflow-x-auto">
        {loading ? (
          <div className="text-center py-12 text-gold-400 text-sm animate-pulse">Loading events...</div>
        ) : events.length === 0 ? (
          <div className="text-center py-12 text-slate-600">No events found ✅</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-royal-800/30 text-left">
                {['Severity', 'Type', 'IP', 'URL', 'MITRE', 'Status', 'Time', 'Actions'].map(h => (
                  <th key={h} className="px-3 py-2.5 text-xs font-medium text-slate-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {events.map(ev => (
                <tr key={ev.id}
                    className="border-b border-royal-800/10 hover:bg-royal-800/10 cursor-pointer transition-colors"
                    onClick={() => setSelected(ev)}>
                  <td className="px-3 py-2.5"><span className={`badge-${ev.severity}`}>{ev.severity}</span></td>
                  <td className="px-3 py-2.5 font-mono text-xs text-slate-300">{ev.event_type}</td>
                  <td className="px-3 py-2.5 font-mono text-xs text-blue-400">{ev.user_ip}</td>
                  <td className="px-3 py-2.5 text-xs text-slate-400 max-w-xs truncate">{ev.url || '—'}</td>
                  <td className="px-3 py-2.5 text-xs text-gold-400 font-mono">{ev.mitre_technique_id || '—'}</td>
                  <td className="px-3 py-2.5">
                    <span className={`text-xs px-2 py-0.5 rounded border ${
                      ev.status === 'resolved' ? 'text-green-400 border-green-700/40' :
                      ev.status === 'investigating' ? 'text-yellow-400 border-yellow-700/40' :
                      'text-slate-400 border-slate-700/40'
                    }`}>{ev.status}</span>
                  </td>
                  <td className="px-3 py-2.5 text-xs text-slate-500">{new Date(ev.created_at).toLocaleString()}</td>
                  <td className="px-3 py-2.5" onClick={e => e.stopPropagation()}>
                    <button onClick={() => blockIp(ev.user_ip, ev.website_id)}
                            className="text-xs text-red-400 hover:text-red-300 border border-red-700/30 px-2 py-0.5 rounded mr-1">
                      Block
                    </button>
                    {ev.status === 'new' && (
                      <button onClick={() => updateStatus(ev.id, 'resolved')}
                              className="text-xs text-green-400 hover:text-green-300 border border-green-700/30 px-2 py-0.5 rounded">
                        Resolve
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Detail Panel */}
      {selected && (
        <div className="fixed inset-y-0 right-0 w-96 bg-navy-800 border-l border-royal-800/50 p-6 overflow-y-auto z-50">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-white">Event Detail</h3>
            <button onClick={() => setSelected(null)} className="text-slate-500 hover:text-white text-xl">✕</button>
          </div>

          <div className="space-y-4 text-sm">
            <div><span className="text-slate-500">Type:</span> <span className="text-white font-mono ml-2">{selected.event_type}</span></div>
            <div><span className="text-slate-500">Severity:</span> <span className={`badge-${selected.severity} ml-2`}>{selected.severity}</span></div>
            <div><span className="text-slate-500">IP:</span> <span className="text-blue-400 font-mono ml-2">{selected.user_ip}</span></div>
            <div><span className="text-slate-500">URL:</span> <span className="text-slate-300 ml-2 break-all">{selected.url || '—'}</span></div>
            <div><span className="text-slate-500">MITRE:</span> <span className="text-gold-400 font-mono ml-2">{selected.mitre_technique_id} — {selected.mitre_tactic}</span></div>
            <div><span className="text-slate-500">Time:</span> <span className="text-slate-300 ml-2">{new Date(selected.created_at).toLocaleString()}</span></div>

            {selected.payload && (
              <div>
                <span className="text-slate-500 block mb-1">Payload:</span>
                <pre className="bg-navy-900 text-red-300 text-xs p-3 rounded overflow-x-auto max-h-32 font-mono">
                  {selected.payload}
                </pre>
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <button onClick={() => blockIp(selected.user_ip, selected.website_id)} className="dk-btn-danger flex-1">🚫 Block IP</button>
              <button onClick={() => updateStatus(selected.id, 'resolved')} className="dk-btn-secondary flex-1">✅ Resolve</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
