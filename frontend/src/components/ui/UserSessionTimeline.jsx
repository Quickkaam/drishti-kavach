// ============================================
// Drishti Kavach — User Session Timeline
// Expandable session history view
// ============================================

import React, { useState } from 'react';

const ACCENT = '#00d4ff';
const GREEN  = '#00ff88';
const GOLD   = '#f5b041';

const CARD_STYLE = {
  background: 'linear-gradient(135deg, rgba(4,12,26,0.9) 0%, rgba(2,4,8,0.85) 100%)',
  border: '1px solid rgba(0,212,255,0.12)',
  borderRadius: '0.5rem',
  padding: '1.5rem',
};

function formatDuration(seconds) {
  if (!seconds || seconds === 0) return '0s';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

// Sum page-level durations as fallback when session.total_duration is 0
function getSessionDuration(session) {
  const total = Number(session.total_duration);
  if (total && total > 0) return total;
  if (session.pages && session.pages.length > 0) {
    return session.pages.reduce((sum, p) => sum + (Number(p.duration) || 0), 0);
  }
  return 0;
}

// Format a UTC ISO timestamp → visitor's local time
function formatLocalTime(isoString) {
  if (!isoString) return '—';
  // If Supabase returns timestamp without timezone, append 'Z' to treat as UTC
  const utcString = (isoString.endsWith('Z') || isoString.includes('+')) ? isoString : `${isoString}Z`;
  return new Date(utcString).toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });
}

// Get a flag emoji from country code
function countryFlag(code) {
  if (!code || code.length !== 2) return '🌐';
  return code.toUpperCase().replace(/./g, c =>
    String.fromCodePoint(c.charCodeAt(0) + 127397)
  );
}

// Detect device from user agent
function detectDevice(ua) {
  if (!ua) return '🖥️ Unknown';
  if (/Mobi|Android|iPhone|iPod/i.test(ua)) return '📱 Mobile';
  if (/Tablet|iPad/i.test(ua)) return '📟 Tablet';
  return '🖥️ Desktop';
}

// Detect browser from user agent
function detectBrowser(ua) {
  if (!ua) return 'Unknown';
  if (/Edg\//i.test(ua)) return 'Edge';
  if (/OPR\//i.test(ua)) return 'Opera';
  if (/Firefox\//i.test(ua)) return 'Firefox';
  if (/Safari\//i.test(ua) && !/Chrome\//i.test(ua)) return 'Safari';
  if (/Chrome\//i.test(ua)) return 'Chrome';
  return 'Other';
}

export default function UserSessionTimeline({ sessions = [] }) {
  const [expanded, setExpanded] = useState(null);

  if (sessions.length === 0) {
    return (
      <div style={CARD_STYLE}>
        <h3 style={{ fontSize: '0.875rem', fontWeight: 700, color: '#fff', fontFamily: "'Orbitron', monospace", letterSpacing: '0.05em', marginBottom: '1rem' }}>
          👤 RECENT SESSIONS
        </h3>
        <div style={{ textAlign: 'center', padding: '2rem', color: '#7a8290', fontSize: '0.75rem', fontFamily: "'Orbitron', monospace" }}>
          No session data yet
        </div>
      </div>
    );
  }

  return (
    <div style={CARD_STYLE}>
      <h3 style={{ fontSize: '0.875rem', fontWeight: 700, color: '#fff', fontFamily: "'Orbitron', monospace", letterSpacing: '0.05em', marginBottom: '1rem' }}>
        👤 RECENT SESSIONS
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '400px', overflowY: 'auto' }}>
        {sessions.map((session) => {
          const isExpanded = expanded === session.id;
          return (
            <div key={session.id} style={{ border: '1px solid rgba(0,212,255,0.1)', borderRadius: '0.375rem', overflow: 'hidden' }}>
              {/* Session header — clickable */}
              <div
                onClick={() => setExpanded(isExpanded ? null : session.id)}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.6rem 0.75rem', cursor: 'pointer', background: isExpanded ? 'rgba(0,212,255,0.06)' : 'transparent', transition: 'background 0.2s' }}
                onMouseEnter={e => !isExpanded && (e.currentTarget.style.background = 'rgba(0,212,255,0.03)')}
                onMouseLeave={e => !isExpanded && (e.currentTarget.style.background = 'transparent')}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.7rem', color: ACCENT, fontFamily: "'JetBrains Mono', monospace" }}>
                      {(session.session_id || '').slice(0, 14) || 'Unknown'}
                    </span>
                    <span style={{
                      fontSize: '0.55rem', padding: '0.1rem 0.4rem', borderRadius: '0.75rem',
                      background: session.is_active ? 'rgba(0,255,136,0.1)' : 'rgba(122,130,144,0.1)',
                      color: session.is_active ? GREEN : '#7a8290',
                      border: `1px solid ${session.is_active ? 'rgba(0,255,136,0.3)' : 'rgba(122,130,144,0.2)'}`,
                    }}>
                      {session.is_active ? '● ACTIVE' : '○ ENDED'}
                    </span>
                    {/* IP Address */}
                    {session.user_ip && session.user_ip !== '::1' && session.user_ip !== '127.0.0.1' && (
                      <span style={{ fontSize: '0.55rem', color: '#f5b041', fontFamily: "'JetBrains Mono', monospace", background: 'rgba(245,176,65,0.08)', padding: '0.1rem 0.35rem', borderRadius: '0.4rem', border: '1px solid rgba(245,176,65,0.2)' }}>
                        🔌 {session.user_ip}
                      </span>
                    )}
                    {/* Location */}
                    {(session.city || session.country) && (
                      <span style={{ fontSize: '0.55rem', color: '#a29bfe', fontFamily: "'JetBrains Mono', monospace", background: 'rgba(162,155,254,0.08)', padding: '0.1rem 0.35rem', borderRadius: '0.4rem', border: '1px solid rgba(162,155,254,0.2)' }}>
                        {countryFlag(session.country_code)} {session.city}{session.country ? `, ${session.country}` : ''}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '0.65rem', color: '#7a8290', marginTop: '0.2rem', fontFamily: "'JetBrains Mono', monospace" }}>
                    {session.pages_visited || 0} pages · {formatDuration(getSessionDuration(session))} · {formatLocalTime(session.started_at)}
                    {session.isp && <span style={{ color: '#636e72', marginLeft: '0.4rem' }}>· {session.isp}</span>}
                  </div>
                </div>
                <span style={{ color: '#7a8290', fontSize: '0.75rem', transition: 'transform 0.2s', transform: isExpanded ? 'rotate(90deg)' : 'none' }}>▶</span>

              </div>

              {/* Session page timeline — expanded */}
              {isExpanded && session.pages && session.pages.length > 0 && (
                <div style={{ borderTop: '1px solid rgba(0,212,255,0.08)', background: 'rgba(0,0,0,0.3)', padding: '0.5rem 0.75rem', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                  {session.pages.map((page, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.7rem' }}>
                      <span style={{ color: '#7a8290', fontFamily: "'JetBrains Mono', monospace", flexShrink: 0 }}>
                        {formatLocalTime(page.created_at)}

                      </span>
                      <span style={{ color: '#00d4ff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                        {page.page_url || '/'}
                      </span>
                      {page.duration > 0 && (
                        <span style={{ color: GOLD, fontFamily: "'JetBrains Mono', monospace", flexShrink: 0 }}>
                          {page.duration}s
                        </span>
                      )}
                      {page.scroll_depth > 0 && (
                        <span style={{ color: GREEN, fontFamily: "'JetBrains Mono', monospace", flexShrink: 0, fontSize: '0.6rem' }}>
                          ↕{page.scroll_depth}%
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
              {isExpanded && (!session.pages || session.pages.length === 0) && (
                <div style={{ borderTop: '1px solid rgba(0,212,255,0.08)', padding: '0.5rem 0.75rem', color: '#7a8290', fontSize: '0.7rem', fontFamily: "'JetBrains Mono', monospace" }}>
                  No page view details
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
