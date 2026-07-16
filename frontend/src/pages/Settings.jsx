// ============================================
// Drishti Kavach — Settings & Integrations Page
// ============================================

import React, { useState, useEffect } from 'react';
import { Shield, Key, Cpu, Zap, Eye, CheckCircle2, XCircle } from 'lucide-react';
import api from '../api/client';

export default function Settings() {
  const [activeTab, setActiveTab] = useState('general');
  const [aiSettings, setAiSettings] = useState(null);
  const [health, setHealth] = useState(null);
  const [integrations, setIntegrations] = useState(null);
  const [summary, setSummary] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
    fetchIntegrations();
    fetch('/api/health')
      .then(r => r.json())
      .then(setHealth)
      .catch(() => setHealth({ status: 'error' }));
  }, []);

  const fetchSettings = () => {
    api.get('/ai/settings')
      .then(r => setAiSettings(r.data.settings))
      .catch(() => setAiSettings({}));
  };

  const fetchIntegrations = () => {
    api.get('/integrations/status')
      .then(r => {
        setIntegrations(r.data.integrations);
        setSummary(r.data.summary);
      })
      .catch(() => setIntegrations(null));
  };

  const saveSetting = async (key, value) => {
    setSaving(true);
    try {
      await api.post('/ai/settings', { setting_key: key, setting_value: value });
      setAiSettings(prev => ({ ...prev, [key]: value }));
    } catch { alert('Failed to save'); }
    finally { setSaving(false); }
  };

  const StatusIcon = ({ status }) => {
    if (['online', 'configured', 'active'].includes(status)) {
      return <CheckCircle2 className="w-5 h-5 text-green-400" />;
    }
    if (status === 'using-fallback' || status === 'limited') {
      return <Shield className="w-5 h-5 text-amber-400" />;
    }
    return <XCircle className="w-5 h-5 text-red-400" />;
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-white">System Configuration</h1>
        
        <div className="flex bg-slate-800/50 p-1 rounded-lg border border-slate-700/50">
          <button
            onClick={() => setActiveTab('general')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === 'general' ? 'bg-royal-600 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            <div className="flex items-center gap-2"><Cpu className="w-4 h-4"/> General</div>
          </button>
          <button
            onClick={() => setActiveTab('integrations')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === 'integrations' ? 'bg-royal-600 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            <div className="flex items-center gap-2"><Zap className="w-4 h-4"/> Integrations</div>
          </button>
        </div>
      </div>

      {activeTab === 'general' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* API Health */}
          <div className="dk-card border border-slate-700/50 bg-slate-900/50 backdrop-blur-xl">
            <h3 className="font-semibold text-slate-200 mb-3 flex items-center gap-2">
              <Shield className="w-5 h-5 text-royal-400" /> System Status
            </h3>
            {health ? (
              <div className="space-y-2 p-4 rounded-lg bg-slate-800/30 border border-slate-700/30">
                <div className="flex items-center gap-3">
                  <span className={`w-3 h-3 rounded-full animate-pulse ${health.status === 'ok' ? 'bg-green-400 shadow-[0_0_10px_rgba(74,222,128,0.5)]' : 'bg-red-400'}`}></span>
                  <span className={`font-medium ${health.status === 'ok' ? 'text-green-400' : 'text-red-400'}`}>
                    {health.status === 'ok' ? 'All Systems Operational' : 'System Degraded'}
                  </span>
                </div>
                {health.tagline && <p className="text-slate-500 text-xs italic mt-2">{health.tagline}</p>}
              </div>
            ) : (
              <div className="animate-pulse h-16 bg-slate-800/50 rounded-lg"></div>
            )}
          </div>

          {/* AI Settings */}
          <div className="dk-card border border-slate-700/50 bg-slate-900/50 backdrop-blur-xl">
            <h3 className="font-semibold text-slate-200 mb-4 flex items-center gap-2">
              <Eye className="w-5 h-5 text-gold-400" /> Drishti AI Directives
            </h3>
            {aiSettings ? (
              <div className="space-y-1">
                {[
                  { key: 'guardian_mode', label: 'Guardian Mode', desc: 'Auto-block IPs with threat score ≥ 80' },
                  { key: 'auto_investigate', label: 'Auto-Investigate', desc: 'AI triage for high/critical events' },
                  { key: 'daily_summary_enabled', label: 'Daily Summary', desc: 'Send daily security summary at 8:00 AM' },
                ].map(setting => {
                  const val = aiSettings[setting.key];
                  const enabled = val?.enabled ?? val ?? false;
                  return (
                    <div key={setting.key} className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-800/30 transition-colors border border-transparent hover:border-slate-700/30 group">
                      <div>
                        <p className="text-slate-200 text-sm font-medium group-hover:text-gold-400 transition-colors">{setting.label}</p>
                        <p className="text-slate-500 text-xs">{setting.desc}</p>
                      </div>
                      <button
                        onClick={() => saveSetting(setting.key, { ...(typeof val === 'object' ? val : {}), enabled: !enabled })}
                        disabled={saving}
                        className={`w-11 h-6 rounded-full transition-all relative ${enabled ? 'bg-gold-500/80' : 'bg-slate-700'}`}
                      >
                        <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${enabled ? 'translate-x-6 shadow-[0_0_10px_rgba(255,255,255,0.8)]' : 'translate-x-1'}`}></span>
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-3">
                {[1,2,3].map(i => <div key={i} className="animate-pulse h-12 bg-slate-800/50 rounded-lg"></div>)}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'integrations' && (
        <div className="space-y-6">
          {summary && (
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="dk-card py-4 flex flex-col items-center justify-center bg-slate-800/30 border border-slate-700/50">
                <span className="text-3xl font-bold text-white">{summary.total}</span>
                <span className="text-xs text-slate-400 uppercase tracking-wider mt-1">Total Services</span>
              </div>
              <div className="dk-card py-4 flex flex-col items-center justify-center bg-green-900/20 border border-green-500/30">
                <span className="text-3xl font-bold text-green-400">{summary.active}</span>
                <span className="text-xs text-green-500/70 uppercase tracking-wider mt-1">Active / Online</span>
              </div>
              <div className="dk-card py-4 flex flex-col items-center justify-center bg-amber-900/20 border border-amber-500/30">
                <span className="text-3xl font-bold text-amber-400">{summary.missing}</span>
                <span className="text-xs text-amber-500/70 uppercase tracking-wider mt-1">Not Configured</span>
              </div>
            </div>
          )}

          {integrations ? (
            Object.entries(integrations).map(([category, items]) => (
              <div key={category} className="dk-card border border-slate-700/50 bg-slate-900/50">
                <h3 className="text-lg font-bold text-white mb-4 capitalize flex items-center gap-2">
                  <Key className="w-5 h-5 text-royal-400" />
                  {category.replace(/_/g, ' ')}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {items.map(item => (
                    <div key={item.name} className="flex items-center justify-between p-4 rounded-lg bg-slate-800/50 border border-slate-700/50">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-slate-200">{item.name}</p>
                          {item.free && <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-green-500/10 text-green-400 border border-green-500/20">FREE</span>}
                        </div>
                        <p className="text-xs text-slate-500 mt-1 uppercase tracking-wider">{item.status.replace('-', ' ')}</p>
                        {item.note && <p className="text-xs text-slate-400 mt-1 italic">{item.note}</p>}
                      </div>
                      <div className="flex items-center gap-3">
                        {item.url && item.status !== 'configured' && item.status !== 'active' && item.status !== 'online' && (
                          <a href={item.url} target="_blank" rel="noreferrer" className="text-xs text-royal-400 hover:text-royal-300 transition-colors">
                            Configure →
                          </a>
                        )}
                        <StatusIcon status={item.status} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12">
              <div className="animate-spin w-8 h-8 border-2 border-royal-500 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-slate-400">Loading integrations...</p>
            </div>
          )}
        </div>
      )}

      {/* Shloka Footer */}
      <div className="text-center py-8">
        <p className="text-gold-400 text-lg mb-2 font-medium tracking-wide">दृष्टिः रक्षति, रक्षा दृश्यते</p>
        <p className="text-slate-500 text-sm italic">Vision protects, and protection is seen.</p>
        <p className="text-slate-600 text-xs mt-3 font-mono">Drishti Kavach v1.0 — SOC Edition</p>
      </div>
    </div>
  );
}
