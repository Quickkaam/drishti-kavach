// ============================================
// Drishti Kavach — Settings Page
// ============================================

import React, { useState, useEffect } from 'react';
import api from '../api/client';

export default function Settings() {
  const [aiSettings, setAiSettings] = useState(null);
  const [saving, setSaving] = useState(false);
  const [health, setHealth] = useState(null);

  useEffect(() => {
    api.get('/ai/settings')
      .then(r => {
        console.log('[Settings] AI Settings:', r.data);
        setAiSettings(r.data.settings);
      })
      .catch(err => {
        console.error('[Settings] Error fetching AI settings:', err);
        setAiSettings({});
      });
    fetch('/api/health')
      .then(r => r.json())
      .then(setHealth)
      .catch(err => {
        console.error('[Settings] Error fetching health:', err);
      });
  }, []);

  const saveSetting = async (key, value) => {
    setSaving(true);
    try {
      await api.post('/ai/settings', { setting_key: key, setting_value: value });
      setAiSettings(prev => ({ ...prev, [key]: value }));
    } catch { alert('Failed to save'); }
    finally { setSaving(false); }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold text-white">Settings</h1>

      {/* API Health */}
      <div className="dk-card">
        <h3 className="font-semibold text-slate-200 mb-3">System Status</h3>
        {health ? (
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-400"></span>
              <span className="text-green-400 font-medium">{health.status === 'ok' ? 'API Online' : 'API Issue'}</span>
            </div>
            <p className="text-slate-500 text-xs italic">{health.tagline}</p>
          </div>
        ) : (
          <p className="text-slate-500 text-sm">Checking...</p>
        )}
      </div>

      {/* AI Settings */}
      <div className="dk-card">
        <h3 className="font-semibold text-slate-200 mb-4">Drishti AI Configuration</h3>
        {aiSettings ? (
          <div className="space-y-4">
            {[
              { key: 'guardian_mode', label: 'Guardian Mode', desc: 'Auto-block IPs with threat score ≥ 80' },
              { key: 'auto_investigate', label: 'Auto-Investigate', desc: 'Automatically investigate high/critical events' },
              { key: 'daily_summary_enabled', label: 'Daily Summary', desc: 'Send daily security summary at 8:00 AM' },
            ].map(setting => {
              const val = aiSettings[setting.key];
              const enabled = val?.enabled ?? val ?? false;
              return (
                <div key={setting.key} className="flex items-center justify-between py-3 border-b border-royal-800/20">
                  <div>
                    <p className="text-slate-200 text-sm font-medium">{setting.label}</p>
                    <p className="text-slate-500 text-xs">{setting.desc}</p>
                  </div>
                  <button
                    onClick={() => saveSetting(setting.key, { ...(typeof val === 'object' ? val : {}), enabled: !enabled })}
                    className={`w-12 h-6 rounded-full transition-colors relative ${enabled ? 'bg-gold-400' : 'bg-slate-700'}`}
                  >
                    <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${enabled ? 'translate-x-6' : 'translate-x-0.5'}`}></span>
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-slate-500 text-sm">Loading settings...</p>
        )}
      </div>

      {/* Shloka */}
      <div className="dk-card text-center py-6">
        <p className="text-gold-400 text-lg mb-2">दृष्टिः रक्षति, रक्षा दृश्यते</p>
        <p className="text-slate-500 text-sm italic">Vision protects, and protection is seen.</p>
        <p className="text-slate-600 text-xs mt-3">Drishti Kavach v1.0 — The Vision Shield</p>
      </div>
    </div>
  );
}
