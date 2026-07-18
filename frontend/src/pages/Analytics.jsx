// ============================================
// Drishti Kavach — Analytics Page
// User Engagement Tracking Dashboard
// ============================================

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import LiveVisitorsTable from '../components/ui/LiveVisitorsTable';
import EngagementChart from '../components/ui/EngagementChart';
import PageViewsTable from '../components/ui/PageViewsTable';
import UserSessionTimeline from '../components/ui/UserSessionTimeline';

const CARD_STYLE = {
  background: 'linear-gradient(135deg, rgba(4,12,26,0.9) 0%, rgba(2,4,8,0.85) 100%)',
  border: '1px solid rgba(0,212,255,0.12)',
  borderRadius: '0.5rem',
  padding: '1.5rem',
  backdropFilter: 'blur(10px)',
};

const ACCENT = '#00d4ff';
const GOLD   = '#f5b041';
const GREEN  = '#00ff88';

function StatCard({ icon, label, value, sub, color = ACCENT }) {
  return (
    <div style={{ ...CARD_STYLE, position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: `linear-gradient(90deg, transparent, ${color}, transparent)` }} />
      <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>{icon}</div>
      <div style={{ fontSize: '0.625rem', color: '#7a8290', fontFamily: "'Orbitron', monospace", letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.25rem' }}>{label}</div>
      <div style={{ fontSize: '2rem', fontWeight: 900, color, fontFamily: "'Orbitron', monospace" }}>{value ?? '—'}</div>
      {sub && <div style={{ fontSize: '0.75rem', color: '#7a8290', marginTop: '0.25rem' }}>{sub}</div>}
    </div>
  );
}

function formatDuration(seconds) {
  if (!seconds) return '0s';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

export default function Analytics() {
  const { user } = useAuth();
  // Super admin has no website_id — default to website 1 (Quick Kaam)
  const websiteId = user?.website_id || 1;

  const [overview,     setOverview]     = useState(null);
  const [liveVisitors, setLiveVisitors] = useState([]);
  const [activityData, setActivityData] = useState([]);
  const [topPages,     setTopPages]     = useState([]);
  const [sessions,     setSessions]     = useState([]);
  const [devices,      setDevices]      = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [timeRange,    setTimeRange]    = useState('24h');

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const [overviewRes, activityRes, pagesRes, sessionsRes, devicesRes] = await Promise.allSettled([
        api.get(`/api/analytics/website/${websiteId}/overview`),
        api.get(`/api/analytics/website/${websiteId}/activity?range=${timeRange}`),
        api.get(`/api/analytics/website/${websiteId}/pages?limit=10`),
        api.get(`/api/analytics/website/${websiteId}/sessions?limit=10`),
        api.get(`/api/analytics/website/${websiteId}/devices`),
      ]);
      if (overviewRes.status === 'fulfilled') setOverview(overviewRes.value.data);
      if (activityRes.status === 'fulfilled') setActivityData(activityRes.value.data);
      if (pagesRes.status   === 'fulfilled') setTopPages(pagesRes.value.data);
      if (sessionsRes.status === 'fulfilled') setSessions(sessionsRes.value.data);
      if (devicesRes.status  === 'fulfilled') setDevices(devicesRes.value.data);
    } catch (err) {
      console.error('[Analytics]', err);
    } finally {
      setLoading(false);
    }
  }, [websiteId, timeRange]);

  const fetchLive = useCallback(async () => {
    try {
      const res = await api.get(`/api/analytics/website/${websiteId}/live`);
      setLiveVisitors(res.data);
    } catch (_) {}
  }, [websiteId]);

  useEffect(() => { fetchAnalytics(); }, [fetchAnalytics]);

  // Auto-refresh live visitors every 10 seconds
  useEffect(() => {
    fetchLive();
    const interval = setInterval(fetchLive, 10000);
    return () => clearInterval(interval);
  }, [fetchLive]);

  // Device breakdown helpers
  const deviceTotal = devices.reduce((s, d) => s + (d.visitor_count || 0), 0) || 1;
  const deviceGroups = {};
  devices.forEach(d => {
    const key = d.device_type || 'Unknown';
    deviceGroups[key] = (deviceGroups[key] || 0) + (d.visitor_count || 0);
  });

  const RANGE_BTNS = ['24h', '7d', '30d'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#fff', fontFamily: "'Orbitron', monospace", letterSpacing: '0.08em' }}>
            📊 ANALYTICS
          </h1>
          <p style={{ fontSize: '0.75rem', color: '#7a8290', marginTop: '0.25rem' }}>
            User Engagement & Real-Time Visitor Tracking
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {RANGE_BTNS.map(r => (
            <button
              key={r}
              onClick={() => setTimeRange(r)}
              style={{
                padding: '0.375rem 0.75rem',
                fontSize: '0.75rem',
                fontFamily: "'Orbitron', monospace",
                fontWeight: 700,
                border: `1px solid ${timeRange === r ? ACCENT : 'rgba(0,212,255,0.2)'}`,
                borderRadius: '0.25rem',
                background: timeRange === r ? `rgba(0,212,255,0.15)` : 'transparent',
                color: timeRange === r ? ACCENT : '#7a8290',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              {r.toUpperCase()}
            </button>
          ))}
          <button
            onClick={fetchAnalytics}
            style={{ padding: '0.375rem 0.75rem', fontSize: '0.75rem', fontFamily: "'Orbitron', monospace", border: '1px solid rgba(0,255,136,0.3)', borderRadius: '0.25rem', background: 'rgba(0,255,136,0.08)', color: GREEN, cursor: 'pointer' }}
          >
            ↻ REFRESH
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px', color: '#7a8290', fontFamily: "'Orbitron', monospace", fontSize: '0.75rem' }}>
          ◈ LOADING ANALYTICS DATA...
        </div>
      ) : (
        <>
          {/* ── Stats Row ── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
            <StatCard icon="👥" label="Active Users" value={overview?.activeUsers ?? 0} sub="last 10 minutes" color={GREEN} />
            <StatCard icon="📊" label="Total Sessions" value={overview?.totalSessions?.toLocaleString() ?? 0} sub="last 24 hours" color={ACCENT} />
            <StatCard icon="⏱️" label="Avg. Duration" value={formatDuration(overview?.avgDuration)} sub="per session" color={GOLD} />
            <StatCard icon="📉" label="Bounce Rate" value={`${overview?.bounceRate ?? 0}%`} sub="single-page sessions" color={overview?.bounceRate > 50 ? '#ff3d3d' : GREEN} />
          </div>

          {/* ── Live Visitors ── */}
          <LiveVisitorsTable visitors={liveVisitors} />

          {/* ── Activity Chart ── */}
          <EngagementChart data={activityData} title={`User Activity — Last ${timeRange}`} />

          {/* ── Pages + Sessions ── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
            <PageViewsTable pages={topPages} />
            <UserSessionTimeline sessions={sessions} />
          </div>

          {/* ── Device Breakdown ── */}
          {devices.length > 0 && (
            <div style={CARD_STYLE}>
              <h3 style={{ fontSize: '0.875rem', fontWeight: 700, color: '#fff', fontFamily: "'Orbitron', monospace", letterSpacing: '0.05em', marginBottom: '1rem' }}>
                📱 DEVICE BREAKDOWN
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {Object.entries(deviceGroups).sort((a, b) => b[1] - a[1]).map(([device, count]) => (
                  <div key={device}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                      <span style={{ fontSize: '0.875rem', color: '#ccc' }}>{device}</span>
                      <span style={{ fontSize: '0.875rem', color: ACCENT }}>{Math.round((count / deviceTotal) * 100)}% ({count})</span>
                    </div>
                    <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${(count / deviceTotal) * 100}%`, background: `linear-gradient(90deg, ${ACCENT}, ${GOLD})`, borderRadius: '3px', transition: 'width 0.5s ease' }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
