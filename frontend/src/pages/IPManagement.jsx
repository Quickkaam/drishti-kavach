// ============================================
// Drishti Kavach — IP Management Page
// Cyber-noir responsive design implementation
// ============================================

import React, { useState, useEffect } from 'react';
import api from '../api/client';
import { DashboardGrid, CardGrid, FluidContainer } from '../components/layout/ResponsiveGrid';

export default function IPManagement() {
  const [blocked, setBlocked] = useState([]);
  const [intel, setIntel] = useState(null);
  const [lookupIp, setLookupIp] = useState('');
  const [blockForm, setBlockForm] = useState({ ip: '', reason: '', severity: 'medium' });
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState('blocked');

  useEffect(() => { fetchBlocked(); }, []);

  const fetchBlocked = async () => {
    try {
      const { data } = await api.get('/ip/blocked/list?limit=100');
      setBlocked(data.blocked || []);
    } catch {}
  };

  const lookupIP = async () => {
    if (!lookupIp) return;
    setLoading(true);
    try {
      const { data } = await api.get(`/ip/${lookupIp}`);
      setIntel(data.intel);
    } catch { alert('Lookup failed'); }
    finally { setLoading(false); }
  };

  const blockIp = async () => {
    try {
      await api.post('/ip/block', blockForm);
      setBlockForm({ ip: '', reason: '', severity: 'medium' });
      fetchBlocked();
      alert('IP blocked ✓');
    } catch (e) { alert(e.response?.data?.error || 'Failed'); }
  };

  const unblockIp = async (ip) => {
    if (!confirm(`Unblock ${ip}?`)) return;
    try {
      await api.post('/ip/unblock', { ip, reason: 'Manual unblock' });
      fetchBlocked();
    } catch { alert('Failed'); }
  };



  // Cyber-noir styling functions
  const cyberCardStyle = {
    background: 'linear-gradient(135deg, rgba(4, 8, 16, 0.98) 0%, rgba(4, 12, 26, 0.95) 100%)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(0, 212, 255, 0.15)',
    borderRadius: '0.5rem',
    padding: '1.5rem',
    position: 'relative',
    overflow: 'hidden',
  };

  const cyberButtonStyle = (isActive = false, variant = 'primary') => {
    const base = {
      padding: '0.75rem 1.5rem',
      borderRadius: '0.25rem',
      border: '1px solid',
      fontFamily: "'Orbitron', monospace",
      fontSize: '0.875rem',
      fontWeight: '500',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      letterSpacing: '0.025em',
    };

    const variants = {
      primary: {
        background: isActive ? 'linear-gradient(135deg, #00d4ff, #1a237e)' : 'transparent',
        borderColor: isActive ? '#00d4ff' : 'rgba(0, 212, 255, 0.3)',
        color: isActive ? '#ffffff' : '#cccccc',
        boxShadow: isActive ? '0 0 12px rgba(0, 212, 255, 0.3)' : 'none',
      },
      danger: {
        background: 'linear-gradient(135deg, rgba(255, 61, 61, 0.1) 0%, rgba(255, 61, 61, 0.05) 100%)',
        borderColor: '#ff3d3d',
        color: '#ff3d3d',
      },
      success: {
        background: 'linear-gradient(135deg, rgba(0, 255, 136, 0.1) 0%, rgba(0, 255, 136, 0.05) 100%)',
        borderColor: '#00ff88',
        color: '#00ff88',
      },
    };

    return { ...base, ...variants[variant] };
  };

  const cyberInputStyle = {
    background: 'rgba(2, 4, 8, 0.8)',
    border: '1px solid rgba(0, 212, 255, 0.2)',
    borderRadius: '0.25rem',
    padding: '0.75rem 1rem',
    color: '#ffffff',
    fontSize: '0.875rem',
    fontFamily: "'JetBrains Mono', monospace",
    width: '100%',
    transition: 'border-color 0.2s ease',
  };

  const threatColor = (score) => {
    if (score >= 80) return '#ff3d3d';
    if (score >= 50) return '#ff6b00';
    if (score >= 20) return '#f5b041';
    return '#00ff88';
  };

  const severityBadge = (severity) => {
    const colors = {
      low: '#00ff88',
      medium: '#f5b041',
      high: '#ff6b00',
      critical: '#ff3d3d',
    };
    
    return (
      <span style={{
        padding: '0.25rem 0.75rem',
        borderRadius: '9999px',
        fontSize: '0.75rem',
        fontWeight: '500',
        background: `${colors[severity]}15`,
        color: colors[severity],
        border: `1px solid ${colors[severity]}30`,
        fontFamily: "'Orbitron', monospace",
        letterSpacing: '0.05em',
      }}>
        {severity.toUpperCase()}
      </span>
    );
  };

  return (
    <FluidContainer maxWidth="1440px">
      <DashboardGrid>
        {/* Header Section */}
        <div style={{
          ...cyberCardStyle,
          gridColumn: '1 / -1',
          marginBottom: '1.5rem',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '1.5rem',
          }}>
            <div>
              <h1 style={{
                fontSize: '1.75rem',
                fontWeight: 'bold',
                color: '#ffffff',
                fontFamily: "'Orbitron', monospace",
                letterSpacing: '0.05em',
                marginBottom: '0.25rem',
              }}>
                IP MANAGEMENT
              </h1>
              <p style={{
                color: '#7a8290',
                fontSize: '0.875rem',
                fontFamily: "'Orbitron', monospace",
                letterSpacing: '0.1em',
              }}>
                NEURAL SHIELD | REAL-TIME IP INTELLIGENCE
              </p>
            </div>
            
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 1rem',
              background: 'rgba(4, 12, 26, 0.8)',
              border: '1px solid rgba(0, 212, 255, 0.2)',
              borderRadius: '0.25rem',
            }}>
              <div style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: '#00ff88',
                boxShadow: '0 0 12px #00ff88',
                animation: 'pulse-low 2s infinite',
              }}/>
              <span style={{
                fontSize: '0.75rem',
                color: '#00ff88',
                fontFamily: "'Orbitron', monospace",
                letterSpacing: '0.05em',
              }}>
                SYSTEMS ONLINE
              </span>
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem' }}>
            {['blocked', 'lookup', 'block'].map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                style={cyberButtonStyle(tab === t)}
                onMouseEnter={(e) => {
                  if (tab !== t) {
                    e.currentTarget.style.borderColor = '#00d4ff';
                    e.currentTarget.style.color = '#00d4ff';
                  }
                }}
                onMouseLeave={(e) => {
                  if (tab !== t) {
                    e.currentTarget.style.borderColor = 'rgba(0, 212, 255, 0.3)';
                    e.currentTarget.style.color = '#cccccc';
                  }
                }}
              >
                {t === 'blocked' ? `🚫 BLOCKED (${blocked.length})` : 
                 t === 'lookup' ? '🔍 IP LOOKUP' : '➕ BLOCK IP'}
              </button>
            ))}
          </div>
        </div>

        {/* Blocked IPs */}
        {tab === 'blocked' && (
          <div style={{
            ...cyberCardStyle,
            gridColumn: '1 / -1',
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '1.5rem',
            }}>
              <h2 style={{
                fontSize: '1.25rem',
                fontWeight: 'bold',
                color: '#ffffff',
                fontFamily: "'Orbitron', monospace",
                letterSpacing: '0.05em',
              }}>
                ACTIVE IP BLOCKS
              </h2>
              <span style={{
                color: '#7a8290',
                fontSize: '0.875rem',
                fontFamily: "'Orbitron', monospace",
                letterSpacing: '0.05em',
              }}>
                TOTAL: {blocked.length}
              </span>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{
                    borderBottom: '1px solid rgba(0, 212, 255, 0.1)',
                  }}>
                    {['IP ADDRESS', 'REASON', 'SEVERITY', 'BLOCKED BY', 'EXPIRES', 'ACTION'].map(h => (
                      <th key={h} style={{
                        padding: '1rem 0.75rem',
                        textAlign: 'left',
                        fontSize: '0.75rem',
                        color: '#7a8290',
                        fontWeight: '600',
                        letterSpacing: '0.05em',
                        textTransform: 'uppercase',
                        fontFamily: "'Orbitron', monospace",
                      }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {blocked.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{
                        textAlign: 'center',
                        padding: '3rem',
                        color: '#5a6270',
                        fontSize: '0.875rem',
                        fontFamily: "'Orbitron', monospace",
                        letterSpacing: '0.05em',
                      }}>
                        ⚡ NO ACTIVE IP BLOCKS | SYSTEM SECURE
                      </td>
                    </tr>
                  ) : blocked.map(b => (
                    <tr key={b.id} style={{
                      borderBottom: '1px solid rgba(0, 212, 255, 0.05)',
                      transition: 'background 0.2s ease',
                    }}>
                      <td style={{
                        padding: '0.75rem',
                        color: '#00d4ff',
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: '0.875rem',
                      }}>
                        {b.ip}
                      </td>
                      <td style={{
                        padding: '0.75rem',
                        color: '#cccccc',
                        fontSize: '0.875rem',
                        maxWidth: '200px',
                        wordBreak: 'break-word',
                      }}>
                        {b.reason}
                      </td>
                      <td style={{ padding: '0.75rem' }}>
                        {severityBadge(b.severity || 'medium')}
                      </td>
                      <td style={{
                        padding: '0.75rem',
                        color: '#7a8290',
                        fontSize: '0.875rem',
                        fontFamily: "'JetBrains Mono', monospace",
                      }}>
                        {b.blocked_by}
                      </td>
                      <td style={{
                        padding: '0.75rem',
                        color: '#7a8290',
                        fontSize: '0.875rem',
                        fontFamily: "'Orbitron', monospace",
                        letterSpacing: '0.05em',
                      }}>
                        {b.expires_at ? new Date(b.expires_at).toLocaleDateString() : 'NEVER'}
                      </td>
                      <td style={{ padding: '0.75rem' }}>
                        <button
                          onClick={() => unblockIp(b.ip)}
                          style={cyberButtonStyle(false, 'success')}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.boxShadow = '0 0 12px rgba(0, 255, 136, 0.3)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.boxShadow = 'none';
                          }}
                        >
                          🔓 UNBLOCK
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* IP Lookup */}
        {tab === 'lookup' && (
          <div style={{
            ...cyberCardStyle,
            gridColumn: '1 / -1',
          }}>
            <h2 style={{
              fontSize: '1.25rem',
              fontWeight: 'bold',
              color: '#ffffff',
              fontFamily: "'Orbitron', monospace",
              letterSpacing: '0.05em',
              marginBottom: '1.5rem',
            }}>
              IP INTELLIGENCE LOOKUP
            </h2>

            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                <input
                  value={lookupIp}
                  onChange={e => setLookupIp(e.target.value)}
                  placeholder="ENTER IP ADDRESS (e.g., 1.2.3.4)"
                  style={cyberInputStyle}
                  onKeyDown={e => e.key === 'Enter' && lookupIP()}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#00d4ff';
                    e.target.style.boxShadow = '0 0 8px rgba(0, 212, 255, 0.2)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'rgba(0, 212, 255, 0.2)';
                    e.target.style.boxShadow = 'none';
                  }}
                />
                <button
                  onClick={lookupIP}
                  disabled={loading}
                  style={{
                    ...cyberButtonStyle(true),
                    minWidth: '120px',
                  }}
                >
                  {loading ? '🔍 SCANNING...' : '🔍 LOOKUP'}
                </button>
              </div>
            </div>

            {intel && (
              <div style={{
                ...cyberCardStyle,
                borderColor: 'rgba(0, 212, 255, 0.3)',
                marginTop: '1.5rem',
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '1.5rem',
                  paddingBottom: '1rem',
                  borderBottom: '1px solid rgba(0, 212, 255, 0.1)',
                }}>
                  <div>
                    <h3 style={{
                      fontSize: '1.5rem',
                      fontWeight: 'bold',
                      color: '#ffffff',
                      fontFamily: "'JetBrains Mono', monospace",
                      marginBottom: '0.25rem',
                    }}>
                      {intel.ip}
                    </h3>
                    <p style={{
                      color: '#7a8290',
                      fontSize: '0.875rem',
                      fontFamily: "'Orbitron', monospace",
                      letterSpacing: '0.05em',
                    }}>
                      THREAT ANALYSIS INTELLIGENCE
                    </p>
                  </div>
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                  }}>
                    <span style={{
                      fontSize: '2.5rem',
                      fontWeight: 'bold',
                      color: threatColor(intel.threat_score),
                      fontFamily: "'Orbitron', monospace",
                    }}>
                      {intel.threat_score}
                    </span>
                    <span style={{
                      fontSize: '0.75rem',
                      color: '#7a8290',
                      fontFamily: "'Orbitron', monospace",
                      letterSpacing: '0.1em',
                    }}>
                      THREAT SCORE
                    </span>
                  </div>
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '1rem',
                  marginBottom: '1.5rem',
                }}>
                  {[
                    ['COUNTRY', `${intel.country} (${intel.country_code})`],
                    ['CITY', intel.city || '—'],
                    ['ISP', intel.isp || '—'],
                    ['ORGANISATION', intel.organization || '—'],
                    ['ASN', intel.as_number || '—'],
                    ['ABUSE SCORE', `${intel.abuse_confidence}/100`],
                    ['TOTAL REPORTS', intel.total_reports],
                    ['SCANNER', intel.is_scanner ? '⚠️ DETECTED' : '✅ CLEAN'],
                    ['VPN', intel.is_vpn ? '⚠️ DETECTED' : '✅ CLEAN'],
                    ['BOT', intel.is_bot ? '⚠️ DETECTED' : '✅ CLEAN'],
                  ].map(([k, v]) => (
                    <div key={k} style={{
                      padding: '0.75rem',
                      background: 'rgba(2, 4, 8, 0.5)',
                      border: '1px solid rgba(0, 212, 255, 0.1)',
                      borderRadius: '0.25rem',
                    }}>
                      <div style={{
                        fontSize: '0.75rem',
                        color: '#7a8290',
                        marginBottom: '0.25rem',
                        fontFamily: "'Orbitron', monospace",
                        letterSpacing: '0.05em',
                      }}>
                        {k}
                      </div>
                      <div style={{
                        fontSize: '0.875rem',
                        color: '#cccccc',
                        fontFamily: "'JetBrains Mono', monospace",
                      }}>
                        {String(v)}
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => {
                    setBlockForm({ 
                      ip: intel.ip, 
                      reason: `Threat score: ${intel.threat_score}/100`, 
                      severity: intel.threat_score >= 80 ? 'critical' : 'high' 
                    });
                    setTab('block');
                  }}
                  style={cyberButtonStyle(false, 'danger')}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = '0 0 12px rgba(255, 61, 61, 0.3)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  🚫 BLOCK THIS IP
                </button>
              </div>
            )}
          </div>
        )}

        {/* Block IP Form */}
        {tab === 'block' && (
          <div style={{
            ...cyberCardStyle,
            maxWidth: '500px',
            margin: '0 auto',
          }}>
            <h2 style={{
              fontSize: '1.25rem',
              fontWeight: 'bold',
              color: '#ffffff',
              fontFamily: "'Orbitron', monospace",
              letterSpacing: '0.05em',
              marginBottom: '1.5rem',
            }}>
              BLOCK IP ADDRESS
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {['ip', 'reason'].map(field => (
                <div key={field}>
                  <label style={{
                    display: 'block',
                    fontSize: '0.75rem',
                    color: '#7a8290',
                    marginBottom: '0.5rem',
                    fontFamily: "'Orbitron', monospace",
                    letterSpacing: '0.05em',
                    textTransform: 'uppercase',
                  }}>
                    {field === 'ip' ? 'IP ADDRESS' : 'REASON FOR BLOCKING'}
                  </label>
                  <input
                    value={blockForm[field]}
                    onChange={e => setBlockForm(p => ({ ...p, [field]: e.target.value }))}
                    placeholder={field === 'ip' ? 'e.g., 1.2.3.4' : 'Reason for blocking...'}
                    style={cyberInputStyle}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#00d4ff';
                      e.target.style.boxShadow = '0 0 8px rgba(0, 212, 255, 0.2)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = 'rgba(0, 212, 255, 0.2)';
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                </div>
              ))}

              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.75rem',
                  color: '#7a8290',
                  marginBottom: '0.5rem',
                  fontFamily: "'Orbitron', monospace",
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                }}>
                  SEVERITY LEVEL
                </label>
                <select
                  value={blockForm.severity}
                  onChange={e => setBlockForm(p => ({ ...p, severity: e.target.value }))}
                  style={cyberInputStyle}
                >
                  {['low', 'medium', 'high', 'critical'].map(s => (
                    <option key={s} value={s} style={{
                      background: '#020408',
                      color: '#ffffff',
                    }}>
                      {s.toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={blockIp}
                style={cyberButtonStyle(false, 'danger')}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 0 12px rgba(255, 61, 61, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                🚫 BLOCK IP
              </button>
            </div>
          </div>
        )}
      </DashboardGrid>

      {/* Animation styles */}
      <style>
        {`
          @keyframes pulse-low {
            0%, 100% {
              opacity: 0.6;
            }
            50% {
              opacity: 1;
            }
          }
        `}
      </style>
    </FluidContainer>
  );
}
