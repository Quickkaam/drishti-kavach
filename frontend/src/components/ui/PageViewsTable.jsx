// ============================================
// Drishti Kavach — Page Views Table Component
// Top pages bar chart visualization
// ============================================

import React from 'react';

const ACCENT = '#00d4ff';
const GOLD   = '#f5b041';

const CARD_STYLE = {
  background: 'linear-gradient(135deg, rgba(4,12,26,0.9) 0%, rgba(2,4,8,0.85) 100%)',
  border: '1px solid rgba(0,212,255,0.12)',
  borderRadius: '0.5rem',
  padding: '1.5rem',
};

function formatDuration(seconds) {
  if (!seconds) return '—';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

export default function PageViewsTable({ pages = [] }) {
  if (pages.length === 0) {
    return (
      <div style={CARD_STYLE}>
        <h3 style={{ fontSize: '0.875rem', fontWeight: 700, color: '#fff', fontFamily: "'Orbitron', monospace", letterSpacing: '0.05em', marginBottom: '1rem' }}>
          📄 TOP PAGES
        </h3>
        <div style={{ textAlign: 'center', padding: '2rem', color: '#7a8290', fontSize: '0.75rem', fontFamily: "'Orbitron', monospace" }}>
          No page data yet
        </div>
      </div>
    );
  }

  const maxViews = pages[0]?.views || 1;

  return (
    <div style={CARD_STYLE}>
      <h3 style={{ fontSize: '0.875rem', fontWeight: 700, color: '#fff', fontFamily: "'Orbitron', monospace", letterSpacing: '0.05em', marginBottom: '1.25rem' }}>
        📄 TOP PAGES
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
        {pages.map((page, i) => (
          <div key={i}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0 }}>
                <span style={{ fontSize: '0.65rem', color: '#7a8290', fontFamily: "'Orbitron', monospace", width: '14px', textAlign: 'right', flexShrink: 0 }}>
                  {i + 1}
                </span>
                <span style={{ fontSize: '0.75rem', color: '#ccc', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={page.page_url}>
                  {page.page_url || '/'}
                </span>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', flexShrink: 0, marginLeft: '0.5rem' }}>
                <span style={{ fontSize: '0.7rem', color: ACCENT, fontFamily: "'JetBrains Mono', monospace", whiteSpace: 'nowrap' }}>
                  {page.views?.toLocaleString()} views
                </span>
                {page.avg_duration > 0 && (
                  <span style={{ fontSize: '0.7rem', color: GOLD, fontFamily: "'JetBrains Mono', monospace", whiteSpace: 'nowrap' }}>
                    {formatDuration(page.avg_duration)}
                  </span>
                )}
              </div>
            </div>
            <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.04)', borderRadius: '2px', overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${((page.views || 0) / maxViews) * 100}%`,
                background: `linear-gradient(90deg, ${ACCENT}, ${GOLD})`,
                borderRadius: '2px',
                transition: 'width 0.6s ease',
              }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
