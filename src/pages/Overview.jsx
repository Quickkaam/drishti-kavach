// ============================================
// Drishti Kavach — Cyber-Noir Overview Page
// Live Map Feed + DNS Checker + Full Monitoring
// ============================================

import React, { useEffect, useState } from 'react';
import api from '../api/client';
import LiveGlobe from '../components/ui/LiveGlobe';
import IncidentFeed from '../components/ui/IncidentFeed';
import DrishtiAIConsole from '../components/ui/DrishtiAIConsole';
import SystemHealthDashboard from '../components/ui/SystemHealthDashboard';

export default function Overview() {
  const [stats, setStats] = useState({});
  const [threats, setThreats] = useState([]);
  const [trends, setTrends] = useState([]);

  useEffect(() => {
    // Fetch real data (falling back to empty gracefully, as components handle fallbacks)
    Promise.all([
      api.get('/dashboard/stats').catch(() => ({ data: {} })),
      api.get('/security/events?limit=20').catch(() => ({ data: { events: [] } })),
      api.get('/dashboard/trends?days=1').catch(() => ({ data: { trends: [] } }))
    ]).then(([s, sec, t]) => {
      if (s.data) setStats(s.data);
      if (sec.data.events) setThreats(sec.data.events);
      if (t.data.trends) setTrends(t.data.trends);
    });
  }, []);

  return (
    <div className="h-full w-full flex flex-col fade-in">
      {/* ── HEADER ── */}
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <div>
          <h1 className="font-orbitron text-2xl font-black text-glow-cyan uppercase tracking-wider">Drishti Kavach</h1>
          <p className="text-xs text-text-muted font-mono mt-1 italic">
            अहं रक्षामि, अहं दृश्यामि • Vision protects, and protection is seen.
          </p>
        </div>
      </div>

      {/* ── 4-PANEL GRID LAYOUT ── */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 overflow-hidden min-h-[600px] pb-4">
        
        {/* Left Panel: Incident Feed (3 cols) */}
        <div className="lg:col-span-3 h-full overflow-hidden">
          <IncidentFeed events={threats} />
        </div>

        {/* Center Panel: Live Globe Monitor (6 cols) */}
        <div className="lg:col-span-6 h-full rounded-lg overflow-hidden border border-white/10 relative">
          <LiveGlobe />
        </div>

        {/* Right Panel: AI & System Health (3 cols) */}
        <div className="lg:col-span-3 h-full flex flex-col gap-4 overflow-hidden">
          {/* Top Half: System Health */}
          <div className="flex-shrink-0">
             <SystemHealthDashboard trends={trends} />
          </div>
          
          {/* Bottom Half: Drishti AI Console */}
          <div className="flex-1 min-h-0 h-full">
            <DrishtiAIConsole />
          </div>
        </div>

      </div>
    </div>
  );
}
