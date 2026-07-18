// ============================================
// Drishti Kavach — Live Visitors Table
// Real-time active session display
// ============================================

import React from 'react';

const ACCENT = '#00d4ff';
const GREEN  = '#00ff88';
const GOLD   = '#f5b041';

const CARD_STYLE = {
  background: 'linear-gradient(135deg, rgba(4,12,26,0.9) 0%, rgba(2,4,8,0.85) 100%)',
  border: '1px solid rgba(0,212,255,0.12)',
  borderRadius: '0.5rem',
  padding: '1.5rem',
};

function DeviceIcon({ device }) {
  if (device === 'Mobile') return <span title="Mobile">📱</span>;
  if (device === 'Tablet') return <span title="Tablet">📟</span>;
  return <span title="Desktop">💻</span>;
}

function formatDuration(seconds) {
  if (!seconds) return '0s';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

export default function LiveVisitorsTable({ visitors = [] }) {
  return (
    <div style={CARD_STYLE}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <h3 style={{ fontSize: '0.875rem', fontWeight: 700, color: '#fff', fontFamily: "'Orbitron', monospace", letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: RED_DOT, animation: 'pulse-critical 1s infinite', boxShadow: '0 0 8px #ff3d3d' }} />
          LIVE VISITORS
          <span style={{ fontSize: '0.75rem', fontWeight: 400, color: '#7a8290' }}>
            ({visitors.length} online)
          </span>
        </h3>
        <span style={{ fontSize: '0.6rem', color: '#7a8290', fontFamily: "'JetBrains Mono', monospace" }}>
          Auto-refresh: 10s
        </span>
      </div>

      {visitors.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#7a8290', fontSize: '0.75rem', fontFamily: "'Orbitron', monospace" }}>
          No active visitors right now
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['IP Address', 'Current Page', 'Time Spent', 'Device', 'Browser', 'Started'].map(h => (
                  <th key={h} style={{ padding: '0.5rem 0.75rem', textAlign: 'left', fontSize: '0.6rem', color: '#7a8290', fontFamily: "'Orbitron', monospace", letterSpacing: '0.08em', textTransform: 'uppercase', borderBottom: '1px solid rgba(0,212,255,0.08)', whiteSpace: 'nowrap' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visitors.map((v, i) => (
                <tr key={v.sessionId || i} style={{ borderBottom: '1px solid rgba(0,212,255,0.04)' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,212,255,0.03)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <td style={{ padding: '0.6rem 0.75rem', fontSize: '0.75rem', color: ACCENT, fontFamily: "'JetBrains Mono', monospace" }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: GREEN, display: 'inline-block', flexShrink: 0 }} />
                      {v.ip || '—'}
                    </div>
                  </td>
                  <td style={{ padding: '0.6rem 0.75rem', fontSize: '0.75rem', color: '#ccc', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {v.currentPage || '/'}
                  </td>
                  <td style={{ padding: '0.6rem 0.75rem', fontSize: '0.75rem', color: GOLD, fontFamily: "'JetBrains Mono', monospace" }}>
                    {formatDuration(v.timeSpent)}
                  </td>
                  <td style={{ padding: '0.6rem 0.75rem', fontSize: '0.875rem' }}>
                    <DeviceIcon device={v.device} />
                  </td>
                  <td style={{ padding: '0.6rem 0.75rem', fontSize: '0.75rem', color: '#7a8290' }}>
                    {v.browser || '—'}
                  </td>
                  <td style={{ padding: '0.6rem 0.75rem', fontSize: '0.7rem', color: '#7a8290', fontFamily: "'JetBrains Mono', monospace", whiteSpace: 'nowrap' }}>
                    {v.startedAt ? new Date(v.startedAt).toLocaleTimeString() : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <style>{`
        @keyframes pulse-critical {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}

const RED_DOT = '#ff3d3d';
