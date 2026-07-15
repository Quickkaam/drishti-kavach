// ============================================
// Drishti Kavach — DDoS Monitor Page
// ============================================

import React, { useState, useEffect } from 'react';
import api from '../api/client';

const ATTACK_ICONS = { traffic_spike: '📈', ip_flood: '🌊', botnet: '🤖', geo_spike: '🗺️', slowloris: '🐌' };

export default function DdosMonitor() {
  const [active, setActive] = useState([]);
  const [history, setHistory] = useState([]);
  const [checking, setChecking] = useState(false);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    const [s, h] = await Promise.all([api.get('/ddos/status'), api.get('/ddos/events?limit=50')]);
    setActive(s.data.active_events || []);
    setHistory(h.data.events || []);
  };

  const triggerCheck = async () => {
    setChecking(true);
    try { await api.post('/ddos/trigger', {}); fetchData(); }
    catch { alert('Check failed'); }
    finally { setChecking(false); }
  };

  const resolve = async (id) => {
    await api.patch(`/ddos/resolve/${id}`);
    fetchData();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">DDoS Monitor</h1>
          <p className="text-slate-500 text-sm mt-0.5">Real-time attack detection & auto-mitigation</p>
        </div>
        <button onClick={triggerCheck} disabled={checking} className="dk-btn-secondary">
          {checking ? '🔄 Checking...' : '🔄 Run Check'}
        </button>
      </div>

      {/* Active Alerts */}
      {active.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-red-400 uppercase tracking-wider">⚠️ Active Attacks ({active.length})</h2>
          {active.map(ev => (
            <div key={ev.id} className="border border-red-700/50 bg-red-900/10 rounded-xl p-4 flex items-center gap-4">
              <span className="text-2xl">{ATTACK_ICONS[ev.attack_type] || '🚨'}</span>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`badge-${ev.severity}`}>{ev.severity}</span>
                  <span className="text-white font-medium text-sm capitalize">{ev.attack_type?.replace('_', ' ')}</span>
                </div>
                {ev.details && (
                  <p className="text-slate-400 text-xs font-mono">
                    {JSON.stringify(ev.details)}
                  </p>
                )}
                <p className="text-slate-500 text-xs mt-1">{new Date(ev.created_at).toLocaleString()}</p>
              </div>
              <div className="flex flex-col gap-2">
                {ev.mitigation_taken && <span className="text-xs text-green-400 border border-green-700/30 px-2 py-0.5 rounded">✅ Mitigated</span>}
                <button onClick={() => resolve(ev.id)} className="text-xs dk-btn-secondary py-1">Resolve</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {active.length === 0 && (
        <div className="dk-card text-center py-8">
          <p className="text-2xl mb-2">🛡️</p>
          <p className="text-green-400 font-medium">No active DDoS attacks</p>
          <p className="text-slate-500 text-sm mt-1">All systems normal</p>
        </div>
      )}

      {/* Detection Thresholds */}
      <div className="dk-card">
        <h3 className="text-sm font-semibold text-slate-300 mb-4">Detection Thresholds</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {[
            { label: 'Traffic Spike Warning', value: '3x average', icon: '📈' },
            { label: 'Traffic Spike Critical', value: '10x average', icon: '🚨' },
            { label: 'IP Flood Warning', value: '100 req/min', icon: '🌊' },
            { label: 'IP Flood Critical', value: '500 req/min', icon: '💥' },
            { label: 'Botnet Detection', value: '50% same UA', icon: '🤖' },
            { label: 'Geo Spike', value: '>70% one country', icon: '🗺️' },
          ].map(t => (
            <div key={t.label} className="bg-navy-900/50 border border-royal-800/20 rounded-lg p-3">
              <div className="text-lg mb-1">{t.icon}</div>
              <div className="text-xs text-slate-400 mb-1">{t.label}</div>
              <div className="text-sm font-mono text-gold-400">{t.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* History */}
      <div className="dk-card overflow-x-auto">
        <h3 className="text-sm font-semibold text-slate-300 mb-4">Event History</h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-royal-800/30 text-left">
              {['Attack Type', 'Severity', 'Details', 'Mitigated', 'Status', 'Time'].map(h => (
                <th key={h} className="px-3 py-2 text-xs font-medium text-slate-500 uppercase">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {history.map(ev => (
              <tr key={ev.id} className="border-b border-royal-800/10 hover:bg-royal-800/10">
                <td className="px-3 py-2.5 text-slate-300 capitalize">{ev.attack_type?.replace('_', ' ')}</td>
                <td className="px-3 py-2.5"><span className={`badge-${ev.severity}`}>{ev.severity}</span></td>
                <td className="px-3 py-2.5 text-slate-500 text-xs font-mono">{JSON.stringify(ev.details || {}).substring(0, 60)}</td>
                <td className="px-3 py-2.5">{ev.mitigation_taken ? <span className="text-green-400 text-xs">✅ Yes</span> : <span className="text-slate-500 text-xs">—</span>}</td>
                <td className="px-3 py-2.5 text-slate-400 text-xs capitalize">{ev.status}</td>
                <td className="px-3 py-2.5 text-slate-500 text-xs">{new Date(ev.created_at).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
