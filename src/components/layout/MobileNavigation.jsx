// ============================================
// Drishti Kavach — Mobile Navigation
// Hamburger menu with cyber-noir styling
// ============================================

import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

// Cyber-style hamburger icon
const HamburgerIcon = ({ isOpen }) => (
  <svg className="hamburger-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {isOpen ? (
      <>
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
      </>
    ) : (
      <>
        <line x1="3" y1="12" x2="21" y2="12" />
        <line x1="3" y1="6" x2="21" y2="6" />
        <line x1="3" y1="18" x2="21" y2="18" />
      </>
    )}
  </svg>
);

// Cyber-style menu items
const CyberMenuItem = ({ to, icon, label, isActive, onClick }) => (
  <Link
    to={to}
    className={`cyber-menu-item ${isActive ? 'active' : ''}`}
    onClick={onClick}
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem',
      padding: '0.75rem 1rem',
      textDecoration: 'none',
      color: isActive ? '#00d4ff' : '#cccccc',
      background: isActive ? 'rgba(0, 212, 255, 0.1)' : 'transparent',
      borderLeft: `3px solid ${isActive ? '#00d4ff' : 'transparent'}`,
      transition: 'all 0.2s ease',
      position: 'relative',
      overflow: 'hidden',
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.background = 'rgba(0, 212, 255, 0.05)';
      e.currentTarget.style.color = '#00d4ff';
    }}
    onMouseLeave={(e) => {
      if (!isActive) {
        e.currentTarget.style.background = 'transparent';
        e.currentTarget.style.color = '#cccccc';
      }
    }}
  >
    {/* Glow effect for active items */}
    {isActive && (
      <div className="active-glow"
           style={{
             position: 'absolute',
             top: 0,
             left: 0,
             right: 0,
             bottom: 0,
             background: 'linear-gradient(90deg, transparent, rgba(0, 212, 255, 0.1), transparent)',
             animation: 'pulse-glow 2s infinite',
           }}/>
    )}
    
    {/* Icon */}
    <span className="menu-icon" style={{ fontSize: '1.25rem' }}>
      {icon}
    </span>
    
    {/* Label */}
    <span className="menu-label" style={{
      fontSize: '0.875rem',
      fontWeight: '500',
      letterSpacing: '0.025em',
      fontFamily: "'Orbitron', monospace",
    }}>
      {label}
    </span>
    
    {/* Active indicator */}
    {isActive && (
      <span className="active-indicator"
            style={{
              position: 'absolute',
              right: '1rem',
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: '#00d4ff',
              boxShadow: '0 0 8px #00d4ff',
            }}/>
    )}
  </Link>
);

// Threat level indicator for mobile
const MobileThreatIndicator = ({ level = 'medium' }) => {
  const colors = {
    low: '#00ff88',
    medium: '#f5b041',
    high: '#ff6b00',
    critical: '#ff3d3d',
  };
  
  return (
    <div className="mobile-threat-indicator"
         style={{
           display: 'flex',
           alignItems: 'center',
           gap: '0.5rem',
           padding: '0.5rem',
           background: 'rgba(4, 12, 26, 0.8)',
           border: '1px solid rgba(0, 212, 255, 0.2)',
           borderRadius: '0.25rem',
           margin: '0.5rem',
         }}>
      <div className="threat-pulse"
           style={{
             width: '8px',
             height: '8px',
             borderRadius: '50%',
             background: colors[level],
             boxShadow: `0 0 12px ${colors[level]}`,
             animation: `pulse-${level} 2s infinite`,
           }}/>
      <span style={{
        fontSize: '0.75rem',
        color: colors[level],
        fontFamily: "'Orbitron', monospace",
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
      }}>
        {level.toUpperCase()}
      </span>
    </div>
  );
};

// Main mobile navigation component
const MobileNavigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const { user, logout } = useAuth();

  // Close menu when route changes
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  // Handle scroll for header effects
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Navigation menu items
  const menuItems = [
    { to: '/', icon: '🏠', label: 'Overview' },
    { to: '/security', icon: '🛡️', label: 'Security Events' },
    { to: '/ip', icon: '📍', label: 'IP Management' },
    { to: '/incidents', icon: '🚨', label: 'Incidents' },
    { to: '/forms', icon: '📋', label: 'Form Submissions' },
    { to: '/ddos', icon: '🌊', label: 'DDoS Monitor' },
    { to: '/ai', icon: '🤖', label: 'Drishti AI' },
    { to: '/websites', icon: '🌐', label: 'Websites' },
    { to: '/reports', icon: '📊', label: 'Reports' },
    ...(user?.role === 'admin' || user?.role === 'super_admin' ? [
      { to: '/users', icon: '👥', label: 'User Management' },
      { to: '/audit', icon: '📝', label: 'Audit Log' },
    ] : []),
    { to: '/settings', icon: '⚙️', label: 'Settings' },
  ];

  return (
    <>
      {/* Mobile Header */}
      <header className="mobile-header"
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                zIndex: 1000,
                background: scrolled 
                  ? 'rgba(4, 12, 26, 0.95)' 
                  : 'linear-gradient(to bottom, rgba(4, 12, 26, 0.95) 0%, rgba(4, 12, 26, 0.8) 100%)',
                backdropFilter: 'blur(10px)',
                borderBottom: '1px solid rgba(0, 212, 255, 0.1)',
                transition: 'all 0.3s ease',
                padding: '0.75rem 1rem',
              }}>
        <div className="mobile-header-inner"
             style={{
               display: 'flex',
               alignItems: 'center',
               justifyContent: 'space-between',
               maxWidth: '1440px',
               margin: '0 auto',
             }}>
          
          {/* Logo/Brand */}
          <div className="mobile-brand"
               style={{
                 display: 'flex',
                 alignItems: 'center',
                 gap: '0.75rem',
               }}>
            <button
              className="hamburger-button"
              onClick={() => setIsOpen(!isOpen)}
              style={{
                background: 'transparent',
                border: '1px solid rgba(0, 212, 255, 0.3)',
                borderRadius: '0.25rem',
                padding: '0.5rem',
                cursor: 'pointer',
                color: '#00d4ff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#00d4ff';
                e.currentTarget.style.boxShadow = '0 0 12px rgba(0, 212, 255, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(0, 212, 255, 0.3)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <HamburgerIcon isOpen={isOpen} />
            </button>
            
            <div className="mobile-logo"
                 style={{
                   display: 'flex',
                   flexDirection: 'column',
                   lineHeight: 1,
                 }}>
              <span style={{
                fontSize: '0.875rem',
                fontWeight: 'bold',
                color: '#00d4ff',
                fontFamily: "'Orbitron', monospace",
                letterSpacing: '0.05em',
              }}>
                DRISHTI KAVACH
              </span>
              <span style={{
                fontSize: '0.625rem',
                color: '#7a8290',
                fontFamily: "'Orbitron', monospace",
                letterSpacing: '0.1em',
              }}>
                NEURAL SHIELD
              </span>
            </div>
          </div>

          {/* User and Status */}
          <div className="mobile-user-status"
               style={{
                 display: 'flex',
                 alignItems: 'center',
                 gap: '0.75rem',
               }}>
            <MobileThreatIndicator level="medium" />
            
            {user && (
              <div className="mobile-user-avatar"
                   style={{
                     width: '32px',
                     height: '32px',
                     borderRadius: '50%',
                     background: 'linear-gradient(135deg, #00d4ff, #1a237e)',
                     display: 'flex',
                     alignItems: 'center',
                     justifyContent: 'center',
                     color: '#ffffff',
                     fontSize: '0.75rem',
                     fontWeight: 'bold',
                     border: '2px solid rgba(0, 212, 255, 0.5)',
                   }}>
                {user.username?.charAt(0).toUpperCase() || 'U'}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <div className="mobile-menu-overlay"
             style={{
               position: 'fixed',
               top: '64px', // Height of mobile header
               left: 0,
               right: 0,
               bottom: 0,
               zIndex: 999,
               background: 'linear-gradient(to bottom, rgba(4, 12, 26, 0.98) 0%, rgba(2, 4, 8, 0.95) 100%)',
               backdropFilter: 'blur(20px)',
               display: 'flex',
               flexDirection: 'column',
               animation: 'slide-in 0.3s ease',
             }}>
          
          {/* Menu Header */}
          <div className="mobile-menu-header"
               style={{
                 padding: '1.5rem',
                 borderBottom: '1px solid rgba(0, 212, 255, 0.1)',
               }}>
            <div className="user-info"
                 style={{
                   display: 'flex',
                   alignItems: 'center',
                   gap: '1rem',
                   marginBottom: '1rem',
                 }}>
              <div className="user-avatar-large"
                   style={{
                     width: '48px',
                     height: '48px',
                     borderRadius: '50%',
                     background: 'linear-gradient(135deg, #00d4ff, #1a237e)',
                     display: 'flex',
                     alignItems: 'center',
                     justifyContent: 'center',
                     color: '#ffffff',
                     fontSize: '1rem',
                     fontWeight: 'bold',
                     border: '3px solid rgba(0, 212, 255, 0.5)',
                   }}>
                {user?.username?.charAt(0).toUpperCase() || 'U'}
              </div>
              
              <div className="user-details"
                   style={{
                     display: 'flex',
                     flexDirection: 'column',
                   }}>
                <span style={{
                  fontSize: '1rem',
                  fontWeight: 'bold',
                  color: '#ffffff',
                }}>
                  {user?.username || 'User'}
                </span>
                <span style={{
                  fontSize: '0.75rem',
                  color: '#7a8290',
                  fontFamily: "'Orbitron', monospace",
                  letterSpacing: '0.05em',
                }}>
                  {user?.role ? user.role.replace('_', ' ').toUpperCase() : 'VIEWER'}
                </span>
              </div>
            </div>

            {/* System Status */}
            <div className="system-status"
                 style={{
                   display: 'flex',
                   alignItems: 'center',
                   gap: '0.75rem',
                   padding: '0.75rem',
                   background: 'rgba(4, 12, 26, 0.8)',
                   border: '1px solid rgba(0, 212, 255, 0.2)',
                   borderRadius: '0.5rem',
                 }}>
              <div className="status-indicators"
                   style={{
                     display: 'flex',
                     gap: '0.5rem',
                   }}>
                <div className="status-dot active"
                     style={{
                       width: '8px',
                       height: '8px',
                       borderRadius: '50%',
                       background: '#00ff88',
                       boxShadow: '0 0 8px #00ff88',
                     }}/>
                <div className="status-dot active"
                     style={{
                       width: '8px',
                       height: '8px',
                       borderRadius: '50%',
                       background: '#00d4ff',
                       boxShadow: '0 0 8px #00d4ff',
                     }}/>
                <div className="status-dot"
                     style={{
                       width: '8px',
                       height: '8px',
                       borderRadius: '50%',
                       background: '#7a8290',
                     }}/>
              </div>
              
              <span style={{
                fontSize: '0.75rem',
                color: '#cccccc',
                fontFamily: "'Orbitron', monospace",
              }}>
                SYSTEMS: 2/3 ACTIVE
              </span>
            </div>
          </div>

          {/* Menu Items */}
          <div className="mobile-menu-items"
               style={{
                 flex: 1,
                 overflowY: 'auto',
                 padding: '1rem 0',
               }}>
            {menuItems.map((item) => (
              <CyberMenuItem
                key={item.to}
                to={item.to}
                icon={item.icon}
                label={item.label}
                isActive={location.pathname === item.to}
                onClick={() => setIsOpen(false)}
              />
            ))}
          </div>

          {/* Menu Footer */}
          <div className="mobile-menu-footer"
               style={{
                 padding: '1.5rem',
                 borderTop: '1px solid rgba(0, 212, 255, 0.1)',
                 display: 'flex',
                 flexDirection: 'column',
                 gap: '1rem',
               }}>
            
            {/* Quick Actions */}
            <div className="quick-actions"
                 style={{
                   display: 'grid',
                   gridTemplateColumns: '1fr 1fr',
                   gap: '0.75rem',
                 }}>
              <button className="cyber-btn-outline"
                      style={{
                        padding: '0.75rem',
                        background: 'transparent',
                        border: '1px solid rgba(245, 176, 65, 0.3)',
                        borderRadius: '0.25rem',
                        color: '#f5b041',
                        fontSize: '0.75rem',
                        fontFamily: "'Orbitron', monospace",
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = '#f5b041';
                        e.currentTarget.style.boxShadow = '0 0 12px rgba(245, 176, 65, 0.3)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = 'rgba(245, 176, 65, 0.3)';
                        e.currentTarget.style.boxShadow = 'none';
                      }}>
                🔔 Alerts
              </button>
              
              <button className="cyber-btn-outline"
                      style={{
                        padding: '0.75rem',
                        background: 'transparent',
                        border: '1px solid rgba(0, 212, 255, 0.3)',
                        borderRadius: '0.25rem',
                        color: '#00d4ff',
                        fontSize: '0.75rem',
                        fontFamily: "'Orbitron', monospace",
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = '#00d4ff';
                        e.currentTarget.style.boxShadow = '0 0 12px rgba(0, 212, 255, 0.3)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = 'rgba(0, 212, 255, 0.3)';
                        e.currentTarget.style.boxShadow = 'none';
                      }}>
                📄 Report
              </button>
            </div>

            {/* Logout Button */}
            <button className="cyber-btn-danger"
                    onClick={logout}
                    style={{
                      padding: '0.75rem',
                      background: 'linear-gradient(135deg, rgba(255, 61, 61, 0.1) 0%, rgba(255, 61, 61, 0.05) 100%)',
                      border: '1px solid rgba(255, 61, 61, 0.3)',
                      borderRadius: '0.25rem',
                      color: '#ff3d3d',
                      fontSize: '0.875rem',
                      fontFamily: "'Orbitron', monospace",
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#ff3d3d';
                      e.currentTarget.style.boxShadow = '0 0 12px rgba(255, 61, 61, 0.3)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(255, 61, 61, 0.3)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}>
              <span>🚪</span>
              <span>LOGOUT</span>
            </button>

            {/* Footer Note */}
            <div className="footer-note"
                 style={{
                   textAlign: 'center',
                   fontSize: '0.625rem',
                   color: '#5a6270',
                   fontFamily: "'Orbitron', monospace",
                   letterSpacing: '0.1em',
                   marginTop: '0.5rem',
                 }}>
              दृष्टिः रक्षति, रक्षा दृश्यते
            </div>
          </div>
        </div>
      )}

      {/* Animation Styles */}
      <style>
        {`
          @keyframes slide-in {
            from {
              transform: translateX(-100%);
              opacity: 0;
            }
            to {
              transform: translateX(0);
              opacity: 1;
            }
          }
          
          @keyframes pulse-glow {
            0%, 100% {
              opacity: 0.1;
            }
            50% {
              opacity: 0.3;
            }
          }
          
          @keyframes pulse-low {
            0%, 100% {
              opacity: 0.6;
            }
            50% {
              opacity: 1;
            }
          }
          
          @keyframes pulse-medium {
            0%, 100% {
              opacity: 0.6;
            }
            50% {
              opacity: 1;
            }
          }
          
          @keyframes pulse-high {
            0%, 100% {
              opacity: 0.6;
            }
            50% {
              opacity: 1;
            }
          }
          
          @keyframes pulse-critical {
            0%, 100% {
              opacity: 0.6;
            }
            50% {
              opacity: 1;
            }
          }
          
          /* Responsive adjustments */
          @media (min-width: 1025px) {
            .mobile-header {
              display: none;
            }
          }
          
          /* Tablet adjustments */
          @media (min-width: 641px) and (max-width: 1024px) {
            .mobile-menu-overlay {
              width: 320px;
              right: unset;
              border-right: 1px solid rgba(0, 212, 255, 0.1);
            }
          }
          
          /* Reduced motion */
          @media (prefers-reduced-motion: reduce) {
            .mobile-menu-overlay {
              animation: none;
            }
            
            .cyber-menu-item {
              transition: none;
            }
            
            button {
              transition: none;
            }
          }
        `}
      </style>
    </>
  );
};

export default MobileNavigation;