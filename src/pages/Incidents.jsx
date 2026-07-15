// ============================================
// Drishti Kavach — Incidents Page
// ============================================

import React, { useState, useEffect } from 'react';
import api from '../api/client';

export default function Incidents() {
  const [incidents, setIncidents] = useState([]);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', severity: 'high' });

  useEffect(() => { fetchIncidents(); }, []);

  const fetchIncidents = async () => {
    try {
      const { data } = await api.get('/incidents?limit=100');
      setIncidents(data.incidents || []);
    } catch {}
  };

  const createIncident = async () => {
    try {
      await api.post('/incidents', form);
      setForm({ title: '', description: '', severity: 'high' });
      setCreating(false);
      fetchIncidents();
    } catch (e) { alert(e.response?.data?.error || 'Failed'); }
  };

  const updateStatus = async (id, status) => {
    await api.patch(`/incidents/${id}`, { status });
    fetchIncidents();
  };

  const statusColors = { new: 'text-red-400 border-red-700/30', investigating: 'text-yellow-400 border-yellow-700/30', resolved: 'text-green-400 border-green-700/30', closed: 'text-slate-500 border-slate-700/30' };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Incident Management</h1>
        <button onClick={() => setCreating(!creating)} className="dk-btn-primary">
          {creating ? '✕ Cancel' : '➕ New Incident'}
        </button>
      </div>

      {creating && (
        <div className="dk-card max-w-2xl space-y-4">
          <h3 className="font-semibold text-slate-200">Create Incident</h3>
          <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                 placeholder="Incident title..." className="dk-input" />
          <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                    placeholder="Description..." className="dk-input h-24 resize-none" />
          <select value={form.severity} onChange={e => setForm(p => ({ ...p, severity: e.target.value }))} className="dk-input w-auto">
            {['low', 'medium', 'high', 'critical'].map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <button onClick={createIncident} className="dk-btn-primary">Create Incident</button>
        </div>
      )}

      <div className="space-y-3">
        {incidents.length === 0 ? (
          <div className="dk-card text-center py-12 text-slate-600">No incidents. Everything's clean. ✅</div>
        ) : incidents.map(inc => (
          <div key={inc.id} className="dk-card">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className={`badge-${inc.severity}`}>{inc.severity}</span>
                  <span className={`text-xs px-2 py-0.5 rounded border ${statusColors[inc.status] || ''}`}>{inc.status}</span>
                  <span className="text-xs text-slate-500">#{inc.id}</span>
                </div>
                <h3 className="font-semibold text-white text-sm mb-1">{inc.title}</h3>
                {inc.description && <p className="text-slate-400 text-xs">{inc.description}</p>}
                <p className="text-slate-600 text-xs mt-2">{new Date(inc.created_at).toLocaleString()}</p>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                {inc.status === 'new' && (
                  <button onClick={() => updateStatus(inc.id, 'investigating')} className="dk-btn-secondary py-1 text-xs">🔍 Investigate</button>
                )}
                {inc.status === 'investigating' && (
                  <button onClick={() => updateStatus(inc.id, 'resolved')} className="dk-btn-secondary py-1 text-xs">✅ Resolve</button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
