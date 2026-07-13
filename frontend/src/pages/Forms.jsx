// ============================================
// Drishti Kavach — Form Submissions Page
// ============================================

import React, { useState, useEffect } from 'react';
import api from '../api/client';

export default function Forms() {
  const [forms, setForms] = useState([]);
  const [selected, setSelected] = useState(null);
  const [filter, setFilter] = useState('');

  useEffect(() => { fetchForms(); }, [filter]);

  const fetchForms = async () => {
    try {
      const params = filter ? `?status=${filter}` : '';
      const { data } = await api.get(`/forms${params}&limit=100`);
      setForms(data.forms || []);
    } catch {}
  };

  const updateStatus = async (id, status) => {
    await api.patch(`/forms/${id}`, { status });
    fetchForms();
    if (selected?.id === id) setSelected(prev => ({ ...prev, status }));
  };

  const deleteForm = async (id) => {
    if (!confirm('Delete this submission?')) return;
    await api.delete(`/forms/${id}`);
    fetchForms();
    if (selected?.id === id) setSelected(null);
  };

  const statusColors = { new: 'text-blue-400', read: 'text-slate-400', replied: 'text-green-400', spam: 'text-red-400' };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Form Submissions</h1>
        <div className="flex gap-2">
          {['', 'new', 'read', 'replied', 'spam'].map(s => (
            <button key={s} onClick={() => setFilter(s)}
                    className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                      filter === s ? 'border-gold-400/40 text-gold-400 bg-gold-400/10' : 'border-royal-800/40 text-slate-500 hover:text-slate-300'
                    }`}>
              {s || 'All'}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* List */}
        <div className="lg:col-span-2 space-y-2">
          {forms.length === 0 ? (
            <div className="dk-card text-center py-12 text-slate-600">No submissions found</div>
          ) : forms.map(f => (
            <div key={f.id}
                 onClick={() => { setSelected(f); updateStatus(f.id, f.status === 'new' ? 'read' : f.status); }}
                 className={`dk-card cursor-pointer transition-all ${selected?.id === f.id ? 'border-gold-400/40' : 'hover:border-royal-700/50'}`}>
              <div className="flex items-center justify-between mb-1">
                <span className={`text-xs font-medium ${statusColors[f.status] || 'text-slate-400'}`}>● {f.status}</span>
                <span className="text-xs text-slate-600">{new Date(f.created_at).toLocaleDateString()}</span>
              </div>
              <p className="font-medium text-slate-200 text-sm">{f.name || 'Anonymous'}</p>
              <p className="text-slate-500 text-xs truncate">{f.email}</p>
              <p className="text-slate-400 text-xs truncate mt-1">{f.message?.substring(0, 60)}...</p>
            </div>
          ))}
        </div>

        {/* Detail */}
        <div className="lg:col-span-3">
          {selected ? (
            <div className="dk-card space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-white">{selected.name || 'Anonymous'}</h3>
                <span className={`text-xs ${statusColors[selected.status]}`}>● {selected.status}</span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                {[['Email', selected.email], ['Phone', selected.phone || '—'], ['Form Type', selected.form_type], ['IP', selected.user_ip]].map(([k, v]) => (
                  <div key={k}>
                    <span className="text-slate-500 text-xs">{k}</span>
                    <p className="text-slate-300 font-mono text-xs mt-0.5">{v}</p>
                  </div>
                ))}
              </div>

              {selected.services && (
                <div>
                  <span className="text-slate-500 text-xs">Services</span>
                  <p className="text-slate-300 text-sm mt-0.5">{selected.services}</p>
                </div>
              )}

              <div>
                <span className="text-slate-500 text-xs">Message</span>
                <p className="text-slate-300 text-sm mt-1 leading-relaxed bg-navy-900/50 p-3 rounded-lg">
                  {selected.message || '—'}
                </p>
              </div>

              <div className="flex gap-2 flex-wrap pt-2">
                <button onClick={() => updateStatus(selected.id, 'replied')} className="dk-btn-secondary text-xs py-1.5">✅ Mark Replied</button>
                <button onClick={() => updateStatus(selected.id, 'spam')} className="dk-btn-danger text-xs py-1.5">🚫 Mark Spam</button>
                <button onClick={() => deleteForm(selected.id)} className="dk-btn-danger text-xs py-1.5">🗑️ Delete</button>
                <a href={`mailto:${selected.email}`} className="dk-btn-primary text-xs py-1.5">📧 Reply</a>
              </div>
            </div>
          ) : (
            <div className="dk-card flex items-center justify-center h-64 text-slate-600">
              Select a submission to view details
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
