// ============================================
// Drishti Kavach — Cyber-Noir Dashboard Layout
// Enhanced with responsive design and theme support
// ============================================

import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import MobileNavigation from './MobileNavigation';
import { useTheme, ThemeToggleButton, ThemeStatus } from '../ui/ThemeToggle';
import { Database, Bot, Cloud, Activity } from 'lucide-react';
import { useSocket } from '../../context/SocketContext';

const NAV = [
  { path: '/',            icon: '◈', label: 'OVERVIEW',        end: true },
  { path: '/security',   icon: '⬡', label: 'SECURITY EVENTS' },
  { path: '/ddos',       icon: '◉', label: 'DDOS MONITOR' },
  { path: '/ip',         icon: '⬢', label: 'IP MANAGEMENT' },
  { path: '/incidents',  icon: '⚠', label: 'INCIDENTS' },
  { path: '/forms',      icon: '◆', label: 'FORM INTEL' },
  { path: '/ai',         icon: <img src="/drishti-ai-logo.png" alt="AI" style={{width: '16px', height: '16px', filter: 'drop-shadow(0 0 4px rgba(0,212,255,0.8))'}} />, label: 'DRISHTI AI', isLogo: true },
  { path: '/websites',   icon: '⬣', label: 'WEBSITES' },
  { path: '/reports',    icon: '▣', label: 'REPORTS' },
  { path: '/users',      icon: '◎', label: 'USERS',       adminOnly: true },
  { path: '/credentials',icon: '🔑', label: 'CREDENTIALS', superAdminOnly: true },
  { path: '/audit',      icon: '≡', label: 'AUDIT LOG',   adminOnly: true },
  { path: '/settings',   icon: '⚙', label: 'SETTINGS' },
];

const THREAT_CONFIG = {
  LOW:      { color: '#00ff88', label: 'LOW',      glow: '0 0 8px rgba(0,255,136,0.5)' },
  MEDIUM:   { color: '#f5b041', label: 'MEDIUM',   glow: '0 0 8px rgba(245,176,65,0.5)' },
  HIGH:     { color: '#ff6b00', label: 'HIGH',     glow: '0 0 8px rgba(255,107,0,0.5)' },
  CRITICAL: { color: '#ff3d3d', label: 'CRITICAL', glow: '0 0 12px rgba(255,61,61,0.7)' },
};

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const [threatLevel, setThreatLevel] = useState('LOW');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isMobile, setIsMobile] = useState(false);
  const { lastIncident } = useSocket();
  const [pulseActive, setPulseActive] = useState(false);

  useEffect(() => {
    if (lastIncident) {
      setPulseActive(true);
      const timer = setTimeout(() => setPulseActive(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [lastIncident]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    
    // Check screen size for mobile
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => {
      clearInterval(timer);
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const threat = THREAT_CONFIG[threatLevel];

  // Styling variables based on theme
  const bgPrimary = theme === 'dark' ? '#040c1a' : '#f0f4f8';
  const bgSecondary = theme === 'dark' ? '#020408' : '#ffffff';
  const borderColor = theme === 'dark' ? 'rgba(0, 212, 255, 0.08)' : 'rgba(26, 35, 126, 0.08)';
  const textPrimary = theme === 'dark' ? '#ffffff' : '#1a237e';
  const textSecondary = theme === 'dark' ? '#cccccc' : '#3949ab';
  const textMuted = theme === 'dark' ? '#7a8290' : '#5c6bc0';
  const accentCyan = theme === 'dark' ? '#00d4ff' : '#0066cc';
  const accentGold = theme === 'dark' ? '#f5b041' : '#b76e00';
  const accentGreen = theme === 'dark' ? '#00ff88' : '#00875a';
  const accentRed = theme === 'dark' ? '#ff3d3d' : '#d32f2f';

  // If mobile, show mobile navigation
  if (isMobile) {
    return (
      <>
        <MobileNavigation />
        <div style={{
          paddingTop: '64px', // Height of mobile header
          minHeight: 'calc(100vh - 64px)',
          background: 'radial-gradient(ellipse at 50% 0%, #040c1a 0%, #020408 60%)',
          position: 'relative',
        }}>
          {/* Scanline overlay */}
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            pointerEvents: 'none',
            background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,212,255,0.01) 2px, rgba(0,212,255,0.01) 4px)',
            opacity: 0.3,
            zIndex: 1,
          }}/>
          
          <main style={{
            position: 'relative',
            zIndex: 2,
            padding: '1rem',
          }}>
            <Outlet />
          </main>
        </div>
      </>
    );
  }

  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      overflow: 'hidden',
      background: 'radial-gradient(ellipse at 50% 0%, #040c1a 0%, #020408 60%)',
      position: 'relative',
    }}>

      {/* ── SIDEBAR ── */}
      <aside
        style={{
          width: collapsed ? '56px' : '224px',
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
          transition: 'all 0.3s ease',
          position: 'relative',
          background: 'linear-gradient(180deg, #040c18 0%, #020408 100%)',
          borderRight: `1px solid ${borderColor}`,
          zIndex: 10,
        }}
      >
        {/* Top circuit line */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '1px',
          background: `linear-gradient(90deg, transparent, ${accentCyan}, transparent)`,
        }}/>

        {/* Brand */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          padding: collapsed ? '0.75rem' : '0.75rem 1rem',
          borderBottom: `1px solid ${borderColor}`,
          transition: 'padding 0.3s ease',
          minHeight: '72px',
        }}>
          {/* Logo image */}
          <img
            src="/drishti-kavach-logo.png"
            alt="Drishti Kavach"
            style={{
              width: collapsed ? '36px' : '44px',
              height: collapsed ? '36px' : '44px',
              objectFit: 'contain',
              flexShrink: 0,
              filter: 'drop-shadow(0 0 8px rgba(0,212,255,0.5))',
              transition: 'all 0.3s ease',
            }}
          />
          {!collapsed && (
            <div style={{ overflow: 'hidden', lineHeight: 1 }}>
              <div style={{
                fontSize: '1rem',
                fontWeight: '900',
                color: accentCyan,
                fontFamily: "'Orbitron', monospace",
                letterSpacing: '0.12em',
                textShadow: `0 0 12px ${accentCyan}60, 0 0 24px ${accentCyan}30`,
              }}>
                DRISHTI
              </div>
              <div style={{
                fontSize: '1rem',
                fontWeight: '900',
                color: accentGold,
                fontFamily: "'Orbitron', monospace",
                letterSpacing: '0.12em',
                marginTop: '0.15rem',
                textShadow: `0 0 12px ${accentGold}60, 0 0 24px ${accentGold}30`,
              }}>
                KAVACH
              </div>
            </div>
          )}
        </div>

        {/* Threat indicator */}
        {!collapsed && (
          <div style={{
            margin: '0.75rem',
            padding: '0.75rem',
            background: 'linear-gradient(135deg, rgba(4, 8, 16, 0.8) 0%, rgba(4, 12, 26, 0.7) 100%)',
            backdropFilter: 'blur(10px)',
            border: `1px solid ${borderColor}`,
            borderRadius: '0.25rem',
          }}>
            <div style={{
              fontSize: '0.625rem',
              color: textMuted,
              marginBottom: '0.5rem',
              fontFamily: "'Orbitron', monospace",
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
            }}>
              THREAT LEVEL
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: threat.color,
                boxShadow: threat.glow,
                animation: 'pulse-low 2s infinite',
              }}/>
              <span style={{
                fontSize: '0.75rem',
                fontWeight: 'bold',
                color: threat.color,
                fontFamily: "'Orbitron', monospace",
                letterSpacing: '0.05em',
              }}>
                {threat.label}
              </span>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav style={{
          flex: 1,
          overflowY: 'auto',
          padding: '0.75rem 0.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.25rem',
        }}>
          {NAV.filter(n => {
            if (n.superAdminOnly) return user?.role === 'superadmin';
            if (n.adminOnly) return user?.role === 'admin' || user?.role === 'superadmin';
            return true;
          }).map(item => {
            const path = window.location.pathname;
            const isActive = item.end ? path === item.path : path.startsWith(item.path);
            
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.end}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.5rem 0.75rem',
                  textDecoration: 'none',
                  color: isActive ? accentCyan : textMuted,
                  background: isActive ? `rgba(0, 212, 255, 0.1)` : 'transparent',
                  borderLeft: `2px solid ${isActive ? accentCyan : 'transparent'}`,
                  borderRadius: '0.25rem',
                  transition: 'all 0.2s ease',
                  position: 'relative',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.color = accentCyan;
                    e.currentTarget.style.background = 'rgba(0, 212, 255, 0.05)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.color = textMuted;
                    e.currentTarget.style.background = 'transparent';
                  }
                }}
              >
                <span style={{
                  fontSize: '1rem',
                  color: isActive ? accentCyan : textMuted,
                }}>
                  {item.icon}
                </span>
                {!collapsed && (
                  <span style={{
                    fontSize: '0.75rem',
                    fontWeight: '500',
                    fontFamily: "'Orbitron', monospace",
                    letterSpacing: '0.05em',
                    flex: 1,
                  }}>
                    {item.label}
                  </span>
                )}
                {isActive && !collapsed && (
                  <span style={{
                    width: '4px',
                    height: '4px',
                    borderRadius: '50%',
                    background: accentCyan,
                    boxShadow: `0 0 8px ${accentCyan}`,
                  }}/>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Theme toggle and user info */}
        <div style={{
          borderTop: `1px solid ${borderColor}`,
          padding: '1rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem',
        }}>
          {/* Theme toggle */}
          <div style={{
            display: 'flex',
            justifyContent: collapsed ? 'center' : 'space-between',
            alignItems: 'center',
          }}>
            {!collapsed && (
              <div style={{
                fontSize: '0.625rem',
                color: textMuted,
                fontFamily: "'Orbitron', monospace",
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
              }}>
                THEME
              </div>
            )}
            <ThemeToggleButton size="small" showLabel={false} />
          </div>

          {/* User info */}
          {!collapsed && user && (
            <div style={{
              padding: '0.75rem',
              background: 'linear-gradient(135deg, rgba(4, 8, 16, 0.8) 0%, rgba(4, 12, 26, 0.7) 100%)',
              backdropFilter: 'blur(10px)',
              border: `1px solid ${borderColor}`,
              borderRadius: '0.25rem',
            }}>
              <div style={{
                fontSize: '0.75rem',
                fontWeight: 'bold',
                color: accentCyan,
                fontFamily: "'Orbitron', monospace",
                letterSpacing: '0.05em',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}>
                {user.username}
              </div>
              <div style={{
                fontSize: '0.625rem',
                color: textMuted,
                marginTop: '0.25rem',
                fontFamily: "'Orbitron', monospace",
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
              }}>
                {user.role}
              </div>
            </div>
          )}

          {/* Logout button */}
          <button
            onClick={handleLogout}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: collapsed ? 'center' : 'flex-start',
              gap: collapsed ? 0 : '0.5rem',
              padding: '0.5rem',
              background: 'transparent',
              border: `1px solid rgba(255, 61, 61, 0.2)`,
              borderRadius: '0.25rem',
              color: accentRed,
              fontSize: '0.75rem',
              fontFamily: "'Orbitron', monospace",
              letterSpacing: '0.05em',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 61, 61, 0.1)';
              e.currentTarget.style.borderColor = accentRed;
              e.currentTarget.style.boxShadow = `0 0 8px ${accentRed}40`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.borderColor = 'rgba(255, 61, 61, 0.2)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <span>⏻</span>
            {!collapsed && <span>LOGOUT</span>}
          </button>
        </div>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Top Bar */}
        <header style={{
          height: '48px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 1.5rem',
          flexShrink: 0,
          background: 'rgba(4, 8, 16, 0.9)',
          backdropFilter: 'blur(12px)',
          borderBottom: `1px solid ${borderColor}`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button
              onClick={() => setCollapsed(!collapsed)}
              style={{
                background: 'transparent',
                border: `1px solid ${borderColor}`,
                borderRadius: '0.25rem',
                padding: '0.375rem 0.5rem',
                color: textMuted,
                fontSize: '0.75rem',
                fontFamily: "'Orbitron', monospace",
                letterSpacing: '0.1em',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = accentCyan;
                e.currentTarget.style.borderColor = accentCyan;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = textMuted;
                e.currentTarget.style.borderColor = borderColor;
              }}
            >
              {collapsed ? '▶▶' : '◀◀'}
            </button>
            
            {/* Live alerts */}
            {alerts.length > 0 && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.25rem 0.75rem',
                background: 'rgba(255, 61, 61, 0.1)',
                border: `1px solid rgba(255, 61, 61, 0.3)`,
                borderRadius: '0.25rem',
                color: accentRed,
                fontSize: '0.75rem',
                fontFamily: "'Orbitron', monospace",
                letterSpacing: '0.05em',
              }}>
                <span style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: accentRed,
                  boxShadow: `0 0 8px ${accentRed}`,
                  animation: 'pulse-critical 1s infinite',
                }}/>
                {alerts.length} ACTIVE ALERTS
              </div>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            {/* Live Pulse */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Activity size={16} className={pulseActive ? 'text-[#ff9933] animate-pulse' : 'text-text-muted'} />
              <span className="font-orbitron text-[10px]" style={{ color: pulseActive ? '#ff9933' : textMuted }}>
                {pulseActive ? 'LIVE DATA' : 'MONITORING'}
              </span>
            </div>

            {/* System Status Icons */}
            <div className="flex items-center gap-3 border-l border-white/10 pl-4">
              <Database size={16} className="text-[#00ff88]" title="Database: Online" />
              <Bot size={16} className="text-[#00d4ff]" title="Drishti AI: Active" />
              <Cloud size={16} className="text-[#00ff88]" title="Cloudflare: Linked" />
            </div>
            
            {/* Time */}
            <div style={{
              fontSize: '0.75rem',
              color: textMuted,
              fontFamily: "'JetBrains Mono', monospace",
              marginLeft: '0.5rem'
            }}>
              {currentTime.toLocaleTimeString('en-US', { hour12: false })}
            </div>
          </div>
        </header>

        {/* Live ticker bar */}
        <div style={{
          height: '24px',
          overflow: 'hidden',
          flexShrink: 0,
          background: 'rgba(0, 212, 255, 0.03)',
          borderBottom: `1px solid rgba(0, 212, 255, 0.05)`,
          position: 'relative',
        }}>
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: '2rem',
            whiteSpace: 'nowrap',
            animation: 'ticker-scroll 30s linear infinite',
          }}>
            {[...Array(3)].map((_, i) => (
              <span key={i} style={{
                display: 'flex',
                gap: '2rem',
                fontSize: '0.625rem',
                color: textMuted,
                fontFamily: "'JetBrains Mono', monospace",
              }}>
                <span>◈ NEURAL SHIELD ACTIVE</span>
                <span style={{ color: accentGold }}>◆ THREAT INTELLIGENCE: NOMINAL</span>
                <span>◈ ALL SYSTEMS OPERATIONAL</span>
                <span style={{ color: accentCyan }}>⬡ MONITORING {new Date().toLocaleDateString()}</span>
                <span>◈ DRISHTI KAVACH v1.0</span>
                <span style={{ color: accentGold }}>◆ दृष्टिः रक्षति, रक्षा दृश्यते</span>
              </span>
            ))}
          </div>
        </div>

        {/* Page Content */}
        <main style={{
          flex: 1,
          overflowY: 'auto',
          padding: '1.5rem',
          position: 'relative',
        }}>
          {/* Neural network background pattern */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            pointerEvents: 'none',
            opacity: 0.03,
            backgroundImage: `
              linear-gradient(90deg, transparent 79px, ${accentCyan}80 80px, transparent 81px),
              linear-gradient(0deg, transparent 79px, ${accentCyan}80 80px, transparent 81px)
            `,
            backgroundSize: '80px 80px',
          }}/>
          
          <div style={{ position: 'relative', zIndex: 1 }}>
            <Outlet />
          </div>
        </main>
      </div>

      {/* Animation + Global fix styles */}
      <style>
        {`
          @keyframes ticker-scroll {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
          @keyframes pulse-low {
            0%, 100% { opacity: 0.6; }
            50% { opacity: 1; }
          }
          @keyframes pulse-critical {
            0%, 100% { opacity: 0.6; }
            50% { opacity: 1; }
          }

          /* ── GLOBAL DROPDOWN / SELECT FIX ── */
          /* Forces all native selects to use dark bg + light text */
          select,
          select option {
            background-color: #040c18 !important;
            color: #00d4ff !important;
            border-color: rgba(0, 212, 255, 0.2) !important;
          }
          /* Webkit (Chrome/Edge) dropdown list */
          select:focus {
            outline: none;
            box-shadow: 0 0 0 1px rgba(0, 212, 255, 0.4);
          }
          /* Firefox */
          select:-moz-focusring {
            color: transparent;
            text-shadow: 0 0 0 #00d4ff;
          }

          /* Reduced motion support */
          @media (prefers-reduced-motion: reduce) {
            * { animation: none !important; transition: none !important; }
          }
        `}
      </style>
    </div>
  );
}
