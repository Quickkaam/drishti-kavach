// ============================================
// Drishti Kavach — Websites (Multi-Tenant) Page
// ============================================

import React, { useState, useEffect } from 'react';
import api from '../api/client';

export default function Websites() {
  const [websites, setWebsites] = useState([]);
  const [creating, setCreating] = useState(false);
  const [snippetFor, setSnippetFor] = useState(null);
  const [settingsFor, setSettingsFor] = useState(null);
  const [form, setForm] = useState({ name: '', domain: '' });
  const [newKey, setNewKey] = useState(null);

  // Settings form state
  const [settingsForm, setSettingsForm] = useState({
    ga_id: '',
    seo: { title: '', description: '', keywords: '', google_verify: '' }
  });

  useEffect(() => { fetchWebsites(); }, []);

  const fetchWebsites = async () => {
    const { data } = await api.get('/websites');
    setWebsites(data.websites || []);
  };

  const createWebsite = async () => {
    try {
      const { data } = await api.post('/websites', form);
      setNewKey(data.api_key);
      setForm({ name: '', domain: '' });
      setCreating(false);
      fetchWebsites();
    } catch (e) { alert(e.response?.data?.error || 'Failed'); }
  };

  const getSnippet = async (id) => {
    try {
      const { data } = await api.get(`/websites/${id}/snippet`);
      setSnippetFor(data.snippet);
    } catch (e) {
      console.error(e);
      alert('Error fetching snippet: ' + (e.response?.data?.error || e.message));
    }
  };

  const regenKey = async (id) => {
    if (!confirm('Regenerate API key? Old key will stop working immediately.')) return;
    const { data } = await api.post(`/websites/${id}/regenerate-key`);
    alert(`New API key: ${data.api_key}\n\nSave this — it won't be shown again.`);
    fetchWebsites();
  };

  const openSettings = (website) => {
    const s = website.settings || {};
    setSettingsForm({
      ga_id: s.ga_id || '',
      seo: {
        title: s.seo?.title || '',
        description: s.seo?.description || '',
        keywords: s.seo?.keywords || '',
        google_verify: s.seo?.google_verify || ''
      }
    });
    setSettingsFor(website);
  };

  const saveSettings = async () => {
    try {
      // Merge new settings with existing ones if any
      const currentSettings = settingsFor.settings || {};
      const updatedSettings = {
        ...currentSettings,
        ga_id: settingsForm.ga_id,
        seo: settingsForm.seo
      };
      await api.patch(`/websites/${settingsFor.id}`, { settings: updatedSettings });
      setSettingsFor(null);
      fetchWebsites();
    } catch (e) {
      alert('Failed to save settings');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Websites</h1>
          <p className="text-slate-500 text-sm mt-0.5">Manage monitored websites and API keys</p>
        </div>
        <button onClick={() => setCreating(!creating)} className="dk-btn-primary">
          {creating ? '✕ Cancel' : '➕ Add Website'}
        </button>
      </div>

      {/* New API Key Alert */}
      {newKey && (
        <div className="border border-gold-400/40 bg-gold-400/10 rounded-xl p-4">
          <p className="text-gold-400 font-semibold mb-2">✅ Website created! Save your API key:</p>
          <code className="font-mono text-sm text-white bg-navy-900 px-3 py-2 rounded block break-all">{newKey}</code>
          <p className="text-slate-500 text-xs mt-2">⚠️ This key will not be shown again. Save it now.</p>
          <button onClick={() => setNewKey(null)} className="dk-btn-secondary text-xs py-1 mt-2">Dismiss</button>
        </div>
      )}

      {/* Create Form */}
      {creating && (
        <div className="dk-card max-w-lg space-y-4">
          <h3 className="font-semibold text-slate-200">Add New Website</h3>
          <div>
            <label className="block text-xs text-slate-400 mb-1.5">Website Name</label>
            <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                   placeholder="My Website" className="dk-input" />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1.5">Domain (full URL)</label>
            <input value={form.domain} onChange={e => setForm(p => ({ ...p, domain: e.target.value }))}
                   placeholder="https://example.com" className="dk-input" />
          </div>
          <button onClick={createWebsite} className="dk-btn-primary">Create Website</button>
        </div>
      )}

      {/* Website Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {websites.map(w => (
          <div key={w.id} className="dk-card space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-white">{w.name}</h3>
                <a href={w.domain} target="_blank" className="text-blue-400 text-xs hover:underline">{w.domain}</a>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded border ${
                w.status === 'active' ? 'text-green-400 border-green-700/30' : 'text-red-400 border-red-700/30'
              }`}>{w.status}</span>
            </div>

            {w.last_seen_at && (
              <p className="text-xs text-slate-500">
                Last seen: {new Date(w.last_seen_at).toLocaleString()}
              </p>
            )}

            <div className="flex flex-wrap gap-2 pt-1">
              <button onClick={() => getSnippet(w.id)} className="dk-btn-secondary text-xs py-1">📋 Snippet</button>
              <button onClick={() => openSettings(w)} className="dk-btn-secondary text-xs py-1">⚙️ Settings</button>
              <button onClick={() => regenKey(w.id)} className="dk-btn-secondary text-xs py-1 border-red-900/30 text-red-400 hover:bg-red-900/20">🔑 Regen Key</button>
            </div>
          </div>
        ))}
      </div>

      {/* Snippet Modal */}
      {snippetFor && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-6">
          <div className="bg-navy-800 border border-royal-800/50 rounded-xl max-w-2xl w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-white">SDK Snippet</h3>
              <button onClick={() => setSnippetFor(null)} className="text-slate-500 hover:text-white text-xl">✕</button>
            </div>
            <p className="text-slate-400 text-xs mb-3">Add this before the closing <code className="text-gold-400">&lt;/body&gt;</code> tag on your website:</p>
            <pre className="bg-navy-900 text-green-300 text-xs p-4 rounded-lg overflow-x-auto font-mono whitespace-pre-wrap">
              {snippetFor}
            </pre>
            <button onClick={() => { navigator.clipboard.writeText(snippetFor); alert('Copied!'); }}
                    className="dk-btn-primary text-xs py-1.5 mt-3">
              📋 Copy to Clipboard
            </button>
          </div>
        </div>
      )}

      {/* Website Settings Modal (SEO / GA4) */}
      {settingsFor && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-6">
          <div className="bg-navy-800 border border-royal-800/50 rounded-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between mb-4 border-b border-slate-700 pb-3">
              <h3 className="font-bold text-white text-lg">Website Integrations</h3>
              <button onClick={() => setSettingsFor(null)} className="text-slate-500 hover:text-white text-xl">✕</button>
            </div>

            <div className="space-y-5">
              {/* Google Analytics Section */}
              <div className="p-4 bg-slate-900/50 border border-slate-700/50 rounded-lg">
                <h4 className="font-semibold text-royal-400 mb-3 text-sm flex items-center gap-2">
                  📊 Google Analytics (GA4)
                </h4>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Measurement ID</label>
                  <input 
                    value={settingsForm.ga_id} 
                    onChange={e => setSettingsForm(p => ({ ...p, ga_id: e.target.value }))}
                    placeholder="G-XXXXXXXXXX" 
                    className="dk-input text-sm" 
                  />
                  <p className="text-[10px] text-slate-500 mt-1">If provided, the SDK snippet will automatically track pageviews via GA4.</p>
                </div>
              </div>

              {/* Google SEO Section */}
              <div className="p-4 bg-slate-900/50 border border-slate-700/50 rounded-lg">
                <h4 className="font-semibold text-gold-400 mb-3 text-sm flex items-center gap-2">
                  🔍 SEO Injection
                </h4>
                <p className="text-[10px] text-slate-400 mb-3">Drishti Kavach SDK will automatically inject these into the head of your website.</p>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">SEO Title</label>
                    <input 
                      value={settingsForm.seo.title} 
                      onChange={e => setSettingsForm(p => ({ ...p, seo: { ...p.seo, title: e.target.value } }))}
                      placeholder="My Awesome Website" 
                      className="dk-input text-sm" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">SEO Description</label>
                    <textarea 
                      value={settingsForm.seo.description} 
                      onChange={e => setSettingsForm(p => ({ ...p, seo: { ...p.seo, description: e.target.value } }))}
                      placeholder="Brief description of the site for search engines..." 
                      className="dk-input text-sm h-20 resize-none" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Keywords</label>
                    <input 
                      value={settingsForm.seo.keywords} 
                      onChange={e => setSettingsForm(p => ({ ...p, seo: { ...p.seo, keywords: e.target.value } }))}
                      placeholder="security, soc, drishti kavach" 
                      className="dk-input text-sm" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Google Site Verification Code</label>
                    <input 
                      value={settingsForm.seo.google_verify} 
                      onChange={e => setSettingsForm(p => ({ ...p, seo: { ...p.seo, google_verify: e.target.value } }))}
                      placeholder="xyz123..." 
                      className="dk-input text-sm font-mono" 
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button onClick={saveSettings} className="dk-btn-primary flex-1">Save Configurations</button>
                <button onClick={() => setSettingsFor(null)} className="dk-btn-secondary">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
